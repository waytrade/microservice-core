import {
  BehaviorSubject,
  filter,
  firstValueFrom,
  Observable,
  Subject,
} from "rxjs";
import WebSocket from "ws";
import {WebSocketCloseCode} from "..";

/** Default ping / pong interval on the websocket. */
const DEFAULT_PING_INTERVAL = 5; // sec

/** Default time to wait between re-connection attempts. */
const DEFAULT_RECONNECT_DELEAY = 10; // sec

export interface WebSocketAutoConnectionConfig {
  /** If set to true, text message based ping-pong hearbeart check is disabled. */
  disablePingHeartbeat?: boolean;

  /**
   * The ping sending interval in seconds (default is 5s).
   */
  pingInterval?: number;

  /** If set to true, auto re-connect will be disabled. */
  disableAutoReconnect?: boolean;

  /**
   * Time delay between re-connection attempts in seconds (default is 10s).
   */
  reconnectDelay?: number;
}

/** Connection state of a [WebSocketAutoConnection] */
export enum WebSocketAutoConnectionState {
  /** [WebSocketAutoConnection.connect] has not been called yet. */
  DISCONNECTED = "DISCONNECTED",

  /** The websocket is currently connecting to server. */
  CONNECTING = "CONNECTING",

  /** The websocket is successfully connected. */
  CONNECTED = "CONNECTED",

  /**
   * Connection to the websocket sever has been lost.
   * State will change to WAITING_RECONNECT or CLOSED immediatly after this one.
   */
  CONNECTION_LOST = "CONNECTION_LOST",

  /** The websocket is currently disconnected, waiting for re-connection. */
  WAITING_RECONNECT = "WAITING_RECONNECT",

  /** The websocket connection has been permanently closed. */
  CLOSED = "CLOSED",
}

/** Triggers for the connection closing. */
export enum WebSocketAutoConnectionCloseSource {
  /**
   * User has permanently closed the connection by calling
   * [WebSocketAutoConnection.close()].
   */
  USER,

  /**
   * Client closed the connection, because of e.g. a ping/pong heartbeat
   * timeout.
   */
  CLIENT,

  /** Server has closed the connection. */
  SERVER,
}

/** Connection close reason. */
export interface WebSocketAutoConnectionCloseReason {
  source: WebSocketAutoConnectionCloseSource;
  code?: number | WebSocketCloseCode;
  reason?: string;
}

/**
 * A WebSocket that automatically re-connects if the connection got lost,
 * on the peer stopped replaying to pings.
 */
export class WebSocketAutoConnection {
  constructor(
    private url: string,
    private config?: WebSocketAutoConnectionConfig,
  ) {}

  /** The underlying websocket instance. */
  private ws?: WebSocket;

  /** Timeout for re-connection after connection loss. */
  private reconnectTimeout?: NodeJS.Timeout;

  /** Timeout for re-connection after connection loss. */
  private pingTimerInterval?: NodeJS.Timeout;

  /** Timestamp of the last received pong. */
  private lastPongReceived = 0;

  /** True if the connection has benn permanently closed, false otherwise. */
  private permanentlyClosed = false;

  /** Code and description send on the close. */
  private closeReason: WebSocketAutoConnectionCloseReason = {
    source: WebSocketAutoConnectionCloseSource.USER,
  };

  /** The error dispatcher subjsct. */
  private errorSubject = new Subject<Error>();

  /** The ingress message dispatch subject. */
  private readonly messages = new Subject<string>();

  /** The current connection state. */
  private readonly state = new BehaviorSubject<WebSocketAutoConnectionState>(
    WebSocketAutoConnectionState.DISCONNECTED,
  );

  /** Get the current connection state. */
  get currentConnectionState(): WebSocketAutoConnectionState {
    return this.state.value;
  }

  /** Get and Observable to observe connection state changes. */
  get connectionState(): Observable<WebSocketAutoConnectionState> {
    return this.state;
  }

  /** Resolves when connection to server is initialted. */
  get onConnecting(): Promise<void> {
    return this.waitState(WebSocketAutoConnectionState.CONNECTING);
  }

  /** Resolves when an error during connecting occurs. */
  get onError(): Promise<Error> {
    return firstValueFrom(this.errorSubject);
  }

  /** Resolves when websocket is successfully conntected. */
  get onConnected(): Promise<void> {
    return this.waitState(WebSocketAutoConnectionState.CONNECTED);
  }

  /** Resolves when connection to server has been lost. */
  get onLostConnection(): Promise<WebSocketAutoConnectionCloseReason> {
    return (async (): Promise<WebSocketAutoConnectionCloseReason> => {
      await this.waitState(WebSocketAutoConnectionState.CONNECTION_LOST);
      return this.closeReason;
    })();
  }

  /**
   * Resolves when re-connection delay timer has started.
   * Returns the number of seconds until next connection attempt will be started.
   */
  get onWaitingReconnect(): Promise<number> {
    return (async (): Promise<number> => {
      await this.waitState(WebSocketAutoConnectionState.WAITING_RECONNECT);
      return this.config?.reconnectDelay ?? DEFAULT_RECONNECT_DELEAY;
    })();
  }

  /** Resolves when websocket is closed. */
  get onClosed(): Promise<WebSocketAutoConnectionCloseReason> {
    return (async (): Promise<WebSocketAutoConnectionCloseReason> => {
      await this.waitState(WebSocketAutoConnectionState.CLOSED);
      return this.closeReason;
    })();
  }

  /** Get the connection close reason, or undefined currently connected. */
  get connectionCloseReason(): WebSocketAutoConnectionCloseReason | undefined {
    if (this.state.value === WebSocketAutoConnectionState.CONNECTED) {
      return undefined;
    }
    return this.closeReason;
  }

  /** Get an Observable to receive incomming messages. */
  get onMessage(): Observable<string> {
    return this.messages;
  }

  /** Wait for a given connection state. */
  async waitState(state: WebSocketAutoConnectionState): Promise<void> {
    if (this.state.value === state) {
      return;
    }
    await firstValueFrom(this.state.pipe(filter(s => s === state)));
  }

  /** Open the connection to server. */
  connect(): WebSocketAutoConnection {
    if (
      this.state.value === WebSocketAutoConnectionState.DISCONNECTED ||
      this.state.value === WebSocketAutoConnectionState.CLOSED
    ) {
      this.permanentlyClosed = false;
      this.connectInternal();
    }
    return this;
  }

  /** Close the connection to server. */
  close(closeCode?: WebSocketCloseCode | number, closeReason?: string): void {
    this.permanentlyClosed = true;
    this.closeReason.source = WebSocketAutoConnectionCloseSource.USER;
    this.closeReason.code = closeCode;
    this.closeReason.reason = closeReason;
    this.shutdown(closeCode, closeReason);
  }

  /** Send a message */
  send(data: unknown, cb?: (err?: Error) => void): void {
    if (!this.ws) {
      if (cb) {
        cb(new Error("Not connected"));
      }
    } else {
      this.ws.send(data, cb);
    }
  }

  /** Update the connection state */
  private updateState(state: WebSocketAutoConnectionState): void {
    if (this.state.value !== state) {
      this.state.next(state);
    }
  }

  /** Close connection and cleanup all resources. */
  private shutdown(closeCode?: number, closeReason?: string): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      delete this.reconnectTimeout;
    }

    if (this.pingTimerInterval) {
      clearInterval(this.pingTimerInterval);
      delete this.pingTimerInterval;
    }

    if (this.ws) {
      this.ws.close(closeCode, closeReason);
      delete this.ws;
    } else {
      if (this.permanentlyClosed) {
        this.state.next(WebSocketAutoConnectionState.CLOSED);
      }
    }
  }

  /** Connect the websocket. */
  private connectInternal(): void {
    this.shutdown();
    this.updateState(WebSocketAutoConnectionState.CONNECTING);

    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      this.errorSubject.next(e);
      return;
    }

    this.ws.on("message", (message): void => {
      if (typeof message !== "string") {
        return;
      }

      if (this.config?.disablePingHeartbeat) {
        this.messages.next(message);
      } else {
        if (message === "pong") {
          this.lastPongReceived = Date.now();
        } else if (message === "ping") {
          this.ws?.send("pong");
        } else {
          this.messages.next(message);
        }
      }
    });

    this.ws.on("open", () => {
      this.updateState(WebSocketAutoConnectionState.CONNECTED);
      this.runPingPongWatchdog();
    });

    this.ws.on("error", error => {
      this.errorSubject.next(error);
      this.reconnectDelayed();
    });

    this.ws.on("close", (code, reason) => {
      this.shutdown(code, reason);
      if (this.permanentlyClosed) {
        this.updateState(WebSocketAutoConnectionState.CLOSED);
      } else {
        this.closeReason.source = WebSocketAutoConnectionCloseSource.SERVER;
        this.closeReason.code = code;
        this.closeReason.reason = reason;
        this.updateState(WebSocketAutoConnectionState.CONNECTION_LOST);
        this.reconnectDelayed();
      }
    });
  }

  /** Run the ping/pong heartbeat watchdog. */
  private runPingPongWatchdog(): void {
    if (this.config?.disablePingHeartbeat) {
      return;
    }

    let lastPingSent = 0;
    const pingInterval =
      (this.config?.pingInterval ?? DEFAULT_PING_INTERVAL) * 1000;

    this.pingTimerInterval = setInterval(() => {
      const now = Date.now();

      if (lastPingSent && this.lastPongReceived < now - pingInterval) {
        this.closeReason.source = WebSocketAutoConnectionCloseSource.CLIENT;
        this.closeReason.code = WebSocketCloseCode.HEARTBEAT_TIMEOUT;
        this.closeReason.reason = "ping/pong message timeout";
        this.updateState(WebSocketAutoConnectionState.CONNECTION_LOST);
        this.shutdown(this.closeReason.code, this.closeReason.reason);
        this.reconnectDelayed();
      }

      try {
        this.ws?.send("ping");
      } catch (e) {}
      lastPingSent = now;
    }, pingInterval);
  }

  /** Re-connect to websocket after the configured time delay. */
  private reconnectDelayed(): void {
    this.updateState(WebSocketAutoConnectionState.WAITING_RECONNECT);

    const reconnectDelay =
      (this.config?.reconnectDelay ?? DEFAULT_RECONNECT_DELEAY) * 1000;

    this.reconnectTimeout = global.setTimeout(() => {
      this.connectInternal();
    }, reconnectDelay);
  }
}

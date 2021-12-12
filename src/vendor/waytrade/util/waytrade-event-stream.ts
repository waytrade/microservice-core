import WebSocket from "ws";
import {WaytradeEventMessage, WaytradeEventMessageType} from "..";
import {WebSocketCloseCode} from "../../../models/websocket-close-code";

/** Default ping / pong interval on the websocket. */
const DEFAULT_PING_INTERVAL = 5; // sec

/** Default time to wait between re-connection attempts. */
const DEFAULT_RECONNECT_DELEAY = 10; // sec

/** Configuraton of a [WaytradeEventStream]. */
export interface WaytradeEventStreamConfig {
  /** If set to true, text message based ping-pong hearbeart check is disabled. */
  disablePingHeartbeat?: boolean;

  /** The ping sending interval in seconds (default is 5s). */
  pingInterval?: number;

  /** If set to true, auto re-connect will be disabled. */
  disableAutoReconnect?: boolean;

  /** Time delay between re-connection attempts in seconds (default is 10s). */
  reconnectDelay?: number;
}

/** Connection state of a [WaytradeEventStream] */
export enum WaytradeEventStreamConnectionState {
  /** Not connected. */
  DISCONNECTED = "DISCONNECTED",

  /** The websocket is currently connecting to server. */
  CONNECTING = "CONNECTING",

  /** The websocket is successfully connected. */
  CONNECTED = "CONNECTED",

  /** The websocket connection has been manually closed. */
  CLOSED = "CLOSED",
}


/** Triggers for the connection closing. */
export enum WaytradeEventStreamCloseSource {
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
export interface WaytradeEventStreamCloseReason {
  source: WaytradeEventStreamCloseSource;
  code?: number | WebSocketCloseCode;
  reason?: string;
}

/** A websocket connection to send/receive [WaytradeEventMessage]'s  */
export class WaytradeEventStream {
  constructor(
    public url: string,
    private config?: WaytradeEventStreamConfig,
  ) {
    setImmediate(() => this.connect());
  }

  /** The underlying websocket instance. */
  private ws?: WebSocket;

  /** The current connection state. */
  private connectionState = WaytradeEventStreamConnectionState.DISCONNECTED;

  /** Timestamp of the last received pong. */
  private lastPongReceived = 0;

  /** Timeout for re-connection after connection loss. */
  private reconnectTimeout?: NodeJS.Timeout;

  /** Timeout for re-connection after connection loss. */
  private pingTimerInterval?: NodeJS.Timeout;

  /** True if the connection has benn permanently closed, false otherwise. */
  private permanentlyClosed = false;

  /** True if client watchdog has closed the connection, false otherwise. */
  private clientClosed = false;

  /** Code and description send on the close. */
  private closeReason: WaytradeEventStreamCloseReason = {
    source: WaytradeEventStreamCloseSource.USER,
  };

  /** Set of all subscribed message topcis. */
  private subscribedTopcis = new Set<string>();

  /** Get the connection close reason, or undefined currently connected. */
  get connectionCloseReason(): WaytradeEventStreamCloseReason | undefined {
    if (this.connectionState === WaytradeEventStreamConnectionState.CONNECTED) {
      return undefined;
    }
    return this.closeReason;
  }

  /** Connection error callback. */
  onError?: (error: Error) => void;

  /** Connection state change callback. */
  onConnectionState?: (state: WaytradeEventStreamConnectionState) => void;

  /** Incomming message callback. */
  onMessage?: (event: WaytradeEventMessage) => void;

  /** Subscribe on a message topic */
  subscribe(topic: string): void {
    this.subscribedTopcis.add(topic);
    this.send(JSON.stringify({
      topic,
      type: WaytradeEventMessageType.Subscribe
    } as WaytradeEventMessage));
  }

  /** Unsubscribe from a message topic */
  unsubscribe(topic: string): void {
    this.subscribedTopcis.delete(topic);
    this.send(JSON.stringify({
      topic,
      type: WaytradeEventMessageType.Unsubscribe
    } as WaytradeEventMessage));
  }

  /** Publish a message. */
  publish(topic: string, data: unknown): void {
    this.send(JSON.stringify({
      topic,
      data
    } as WaytradeEventMessage));
  }

  /** Unpublish a message. */
  unpublish(topic: string): void {
    this.send(JSON.stringify({
      topic,
      type: WaytradeEventMessageType.Unpublish,
    } as WaytradeEventMessage));
  }

  /** Permaneltly close the connection. */
  close(closeCode?: WebSocketCloseCode | number, closeReason?: string): void {
    this.permanentlyClosed = true;
    this.shutdown(closeCode, closeReason);
  }

  /** Connect the websocket. */
  private connect(): void {
    this.clientClosed = false;
    this.updateState(WaytradeEventStreamConnectionState.CONNECTING);

    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      if (this.onError) {
        this.onError(<Error>e);
      }
      return;
    }

    this.ws.onmessage = (msgEvent: WebSocket.MessageEvent): void => {
      const data = msgEvent.data;
      if (typeof data !== "string") {
        return;
      }

      if (this.config?.disablePingHeartbeat) {
        try {
          if (this.onMessage) {
            this.onMessage(JSON.parse(data));
          }
        } catch(e) {}
      } else {
        if (data === "pong") {
          this.lastPongReceived = Date.now();
        } else {
          try {
            if (this.onMessage) {
              this.onMessage(JSON.parse(data));
            }
          } catch(e) {}
        }
      }
    };

    this.ws.on("open", () => {
      this.subscribedTopcis.forEach(topic => {
        this.send(JSON.stringify({
          topic,
          type: WaytradeEventMessageType.Subscribe
        } as WaytradeEventMessage));
      });
      this.updateState(WaytradeEventStreamConnectionState.CONNECTED);
      this.runPingPongWatchdog();
    });

    this.ws.on("error", error => {
      if (this.onError) {
        this.onError(error);
      }
      this.reconnectDelayed();
    });

    this.ws.on("close", (code, reason) => {
      delete this.ws;
      this.shutdown(code, reason.toString());
      if (!this.permanentlyClosed) {
        this.reconnectDelayed();
      }
    });
  }

  /** Send a message */
  private send(data: unknown): void {
    if (this.ws) {
      this.ws.send(data);
    }
  }

  /** Update the connection state */
  private updateState(state: WaytradeEventStreamConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      if (this.onConnectionState) {
        this.onConnectionState(state);
      }
    }
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

      if (lastPingSent && this.lastPongReceived < now - pingInterval * 2) {
        this.clientClosed = true;
        this.shutdown(
          WebSocketCloseCode.HEARTBEAT_TIMEOUT,
          "ping/pong message timeout");
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
    const reconnectDelay =
      (this.config?.reconnectDelay ?? DEFAULT_RECONNECT_DELEAY) * 1000;
    this.reconnectTimeout = setTimeout(() => {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        delete this.reconnectTimeout;
        this.connect();
      }
    }, reconnectDelay);
  }

  /** Close connection and cleanup all resources. */
  private shutdown(
    closeCode?: number,
    closeReason?: string): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      delete this.reconnectTimeout;
    }

    if (this.pingTimerInterval) {
      clearInterval(this.pingTimerInterval);
      delete this.pingTimerInterval;
    }

    if (this.ws) {
      if (closeCode) {
        this.ws.close(closeCode, closeReason);
      } else {
        this.ws.terminate();
      }
      delete this.ws;
    } else {
      this.closeReason.code = closeCode;
      this.closeReason.reason = closeReason;
      if (this.permanentlyClosed) {
        this.closeReason.source = WaytradeEventStreamCloseSource.USER;
        this.updateState(WaytradeEventStreamConnectionState.CLOSED);
      } else if (this.clientClosed) {
        this.closeReason.source = WaytradeEventStreamCloseSource.CLIENT;
        this.updateState(WaytradeEventStreamConnectionState.DISCONNECTED);
      } else {
        this.closeReason.source = WaytradeEventStreamCloseSource.SERVER;
        this.updateState(WaytradeEventStreamConnectionState.DISCONNECTED);
      }
    }
  }
}

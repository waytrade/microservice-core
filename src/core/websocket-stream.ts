import {firstValueFrom, ReplaySubject} from "rxjs";
import * as uWS from "uWebSockets.js";
import {MicroserviceStream} from "..";
import {WebSocketCloseCode} from "../models/websocket-close-code";

/** Default ping op-code sending interval in seconds. */
const DEFAULT_WEBSOCKET_PING_INTERVAL = 30;

/** Max amount of bytes on websocket back-pressure before dropping the connection. */
const DEFAULT_MAX_WEBSOCKET_BACKPRESSURE_SIZE = 1024; // 1Kb

/**
 * Websocket stream configuration.
 */
export interface MicroserviceWebsocketStreamConfig {
  /** Maxmimum backpressure pre websocket in bytes. */
  maxBackpressure?: number;

  /** Websocket ping headbeat interval in seconds. */
  pingInterval?: number;

  /**
   * If set to true, no 'pong' text message will send to websockets when
   * receiving a 'ping' text message.
   * Pong op-code responses on protocol level will still continue to work.
   */
  disablePongMessageReply?: boolean;

  /** If set to true, no pint/pong op-code heartbeat check will be run. */
  disableOpCodeHeartbeat?: boolean;
}

/** An stream on a uWebSockets server. */
export class MicroserviceWebsocketStream implements MicroserviceStream {
  constructor(
    private ws: uWS.WebSocket,
    public readonly requestHeader: Map<string, string>,
    public config?: MicroserviceWebsocketStreamConfig,
  ) {
    this.url = ws.url;
    if (!this.config?.disableOpCodeHeartbeat) {
      this.startHeartbeat();
    }
  }

  /** Timestamp (UNIX) of the last received pong op-code. */
  lastPongReceived = 0;

  /** The ping interval timer. */
  private pingIntervalTimer?: NodeJS.Timeout;

  /** Subject to signal closed state. */
  private readonly closedSubject = new ReplaySubject<void>(1);

  /** The request URL. */
  readonly url: string;

  /** Data ingress callback function */
  onReceived: (message: string) => void = (): void => {
    return;
  };

  /** Promise that will resolve when the stream is closed. */
  get closed(): Promise<void> {
    return firstValueFrom<void>(this.closedSubject);
  }

  /** Send a message to the stream. */
  send(msg: string): boolean {
    try {
      const maxBackpressure =
        this.config?.maxBackpressure ?? DEFAULT_MAX_WEBSOCKET_BACKPRESSURE_SIZE;
      if (this.ws.getBufferedAmount() >= maxBackpressure) {
        this.close(WebSocketCloseCode.ABNORMAL, "max backpressure");
        return false;
      }
      this.ws.send(msg, false);
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Close the stream. */
  close(code?: number, msg?: string): void {
    try {
      this.ws.end(code, msg);
    } catch (e) {}
    this.onClose();
  }

  /** Called when the underlying websocket has been closed. */
  onClose(): void {
    this.stopHeartbeat();
    this.closedSubject.next();
  }

  /** Start the ping/pong op-code heartbeat. */
  private startHeartbeat(): void {
    const pingInterval =
      (this.config?.pingInterval ?? DEFAULT_WEBSOCKET_PING_INTERVAL) * 1000;

    let lastPingSent = 0;
    this.pingIntervalTimer = setInterval(() => {
      try {
        if (
          lastPingSent &&
          this.lastPongReceived + pingInterval * 2 < lastPingSent
        ) {
          this.close(1002, "ping/pong timeout");
          return;
        }
        this.ws.ping();
        lastPingSent = Date.now();
      } catch (e) {}
    }, pingInterval);
  }

  /** Stop the ping/pong op-code heartbeat. */
  private stopHeartbeat(): void {
    if (this.pingIntervalTimer) {
      clearInterval(this.pingIntervalTimer);
      delete this.pingIntervalTimer;
    }
  }
}

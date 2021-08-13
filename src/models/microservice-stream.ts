/**
 * Stream between a microservice and a remote peer.
 */
export interface MicroserviceStream {
  /** The request URL. */
  readonly url: string;

  /** The HTTP header fields on upgrade request. */
  readonly requestHeader: Map<string, string>;

  /** Callback handler for received messages. */
  onReceived?: (message: string) => void;

  /** Send a message to the stream. */
  send(msg: string): boolean;

  /** Close the stream. */
  close(): void;

  /** Promise that will resolve when the stream is closed. */
  readonly closed: Promise<void>;
}

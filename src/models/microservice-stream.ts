import {Subject} from "rxjs";

/**
 * Stream between a microservice and a remote peer.
 */
export interface MicroserviceStream {
  /** The request URL. */
  readonly url: string;

  /** Callback handler for received messages. */
  onReceived?: (message: string) => void;

  /** Send a message to the stream. */
  send(msg: string): void;

  /** Close the stream. */
  close(): void;

  /** true if the stream has need closed, false otherwise. */
  readonly closed: Subject<boolean>;
}

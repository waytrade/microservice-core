import {enumProperty, model, property} from "../../..";

/**
 * Type of an message.
 */
export enum WaytradeEventMessageType {
  Subscribe = "sub",
  SubscribeAck = "subAck",
  Unsubscribe = "unsub",
  Publish = "pub",
  Unpublish = "unpub",
}

/** A error on event-stream. */
@model("An error on event-stream.")
export class WaytradeErrorEvent {
  /** The error code. */
  @property("The error code..")
  code?: number;

  /** The error description. */
  @property("The error description.")
  desc?: string;
}

/** A message on event-stream. */
@model("A message on event-stream.")
export class WaytradeEventMessage {
  @property("The error description, or undefined.")
  error?: WaytradeErrorEvent;

  /** The message type. 'publish' if not specified. */
  @enumProperty(
    "WaytradeEventMessageType",
    WaytradeEventMessageType,
    "The message type. 'publish' if not specified and error is undefined.",
  )
  type?: WaytradeEventMessageType;

  /** The message topic. */
  @property("The message topic.")
  topic!: string;

  /** The message data payload. */
  @property("The message data payload.")
  data?: unknown;
}

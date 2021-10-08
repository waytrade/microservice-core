import {arrayProperty, enumProperty, model, property} from "../../..";
import {WaytradeGatewayPermission} from "./waytrade-gateway-permission.model";

/**
 * Type of an message.
 */
export enum WaytradeEventMessageType {
  Subscribe = "subscribe",
  Unsubscribe = "unsubscribe",
  Publish = "publish",
  Unpublish = "unpublish",
}

/** A message on event-stream. */
@model("A message on event-stream.")
export class WaytradeEventMessage {
  /** The message topic. */
  @property("The message topic.")
  topic!: string;

  /** The message data payload. */
  @property("The message data payload.")
  data?: unknown;

  /** The message type. 'publish' if not specified. */
  @enumProperty(
    "WaytradeEventMessageType",
    "The message type. 'publish' if not specified.",
  )
  type?: WaytradeEventMessageType;
}

/** An event-stream message topic descriptor. */
@model("A message topic descriptor.")
export class WaytradeEventMessageTopicDescriptor {
  /** The topic name. */
  @property("The message topic.")
  topic!: string;

  /**
   * An identity must have any of those permissions for receiving messages,
   * through api-gateway.
   */
  @arrayProperty(
    WaytradeGatewayPermission,
    "An identity must have any of those permissons for receiving messages.",
  )
  permissions?: WaytradeGatewayPermission[];

  /**
   * true if the last message on this topic shall be cached until unpublished,
   * false otherwise.
   */
  @property(
    "true if the last message on this topic shall be cached until unpublished,\
 false otherwise.",
  )
  cache?: boolean;
}

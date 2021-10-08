import {model, property} from "../../..";

/** Waytrade gateway permission types */
export enum WaytradeGatewayPermissionType {
  /** Must have the given permission grant */
  Grant = "grant",

  /** Topic must match the given string after evaluation. */
  TopicMatch = "matchTopic",
}

/**
 * Permission to call a waytrade gateway api function or to subscribe on a message topic
 */
@model(
  "Permission to call a waytrade gateway api function or to subscribe on a message topic.",
)
export class WaytradeGatewayPermission {
  /** The permisson type. */
  @property("The permisson type.")
  type!: WaytradeGatewayPermissionType;

  /** The permission value. */
  @property("The permission value.")
  val!: string;
}

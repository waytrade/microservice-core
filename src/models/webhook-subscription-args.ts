import {model, property} from "..";

/**
 * Webhook callback subscription request.
 */
@model("Webhook callback subscription arguments.")
export class WebhookSubscriptionArgs {
  /**
   * The hostname of the callback server.
   * The peer address of the connection will be used if not specified.
   */
  @property(
    "Hostname of the callback server. The peer address of the connection will be used if not specified.",
  )
  host!: string;

  /** The port number of the callback server. */
  @property("The port number of the callback server.")
  port!: number;

  /** The callback url. */
  @property("The callback url.")
  callbackUrl!: string;
}

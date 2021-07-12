import {model, property} from "..";

/**
 * Host of a webhook callback function.
 */
@model("Host of a webhook callback function.")
export class WebhookCallbackHost {
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

import {ParsedUrlQuery} from "querystring";

/**
 * Incoming request to a microservice.
 */
export interface MicroserviceRequest {
  /** The URL including initial /slash   */
  readonly url: string;

  /** The URL including initial /slash   */
  readonly method: string;

  /** the raw querystring (the part of URL after ? sign) or empty string.  */
  readonly query: string;

  /** All query parameters. */
  readonly queryParams: ParsedUrlQuery;

  /** All HTTP header key/values pairs. */
  readonly headers: Map<string, string>;

  /** The IP address of the remote peer  */
  readonly remoteAddress: string;

  /** Write a header to response. */
  writeResponseHeader(key: string, value: string): void;
}

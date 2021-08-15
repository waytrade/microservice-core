/** Websocket close code values */
export enum WebSocketCloseCode {
  /** Successful operation / regular socket shutdown */
  NORMAL = 1000,

  /** No close code frame has been receieved */
  ABNORMAL = 1006,

  /** Server/service is restarting */
  RESTARTING = 1012,

  /** Connection closed because of a heartbeat watchdog timeout. */
  HEARTBEAT_TIMEOUT = 4000,

  /** First code value that be used for custom status codes. */
  FIRST_CUSTOM = 4001,

  /** Last code value that be used for custom status codes. */
  LAST_CUSTOM = 4999,
}

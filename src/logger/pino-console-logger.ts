import Pino, {Logger} from "pino";
import {LogObserver} from "../core/context";

/**
 * LogObserver to log to console with Pino.
 */
export class PinoConsoleLogger implements LogObserver {
  constructor(appName: string, logLevel: string) {
    this.logger = Pino({
      name: appName,
      level: logLevel.toLowerCase(),
      prettyPrint: {
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss.l",
        ignore: "name,pid,hostname",
      },
    });
  }

  /** The Pino Logger instance. */
  private logger: Logger;

  //
  // LogObserver implementation
  //

  async onDebugLog(msg: string, ...args: unknown[]): Promise<void> {
    this.logger.debug(msg, args);
  }

  async onInfoLog(msg: string, ...args: unknown[]): Promise<void> {
    this.logger.info(msg, args);
  }

  async onWarnLog(msg: string, ...args: unknown[]): Promise<void> {
    this.logger.warn(msg, args);
  }

  async onErrorLog(msg: string, ...args: unknown[]): Promise<void> {
    this.logger.error(msg, args);
  }
}

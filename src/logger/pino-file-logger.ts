import fs from "fs";
import * as path from "path";
import Pino, {Logger} from "pino";
import {LogObserver} from "../core/context";

/**
 * LogObserver to log into a file with Pino.
 */
export class PinoFileLogger implements LogObserver {
  constructor(logFileFolderPath: string, appName: string, logLevel: string) {
    const name = appName?.substr(appName.indexOf("/") + 1);
    const today = new Date();
    const logFileName = `${name}_${today.getFullYear()}_${
      today.getMonth() + 1
    }_${today.getDate()}.log`;

    if (!fs.existsSync(logFileFolderPath)) {
      fs.mkdirSync(logFileFolderPath, {recursive: true});
    }

    const logFilePathName = path.resolve(logFileFolderPath, logFileName);
    this.logger = Pino(
      {
        name: appName,
        level: logLevel.toLowerCase(),
      },
      Pino.destination(logFilePathName),
    );
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

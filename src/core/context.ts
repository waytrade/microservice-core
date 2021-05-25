import fs from "fs";
import Pino, {Logger} from "pino";
import {MicroserviceConfig, readConfiguration} from "..";
import {MapExt} from "../util/map-ext";
import {ControllerMetadata, ModelMetadata, ServiceMetadata} from "./metadata";

/**
 * Base-class for Microservice App implementations.
 */
export class MicroserviceContext {
  /**
   * Create a MicroserviceContext instance.
   *
   * @param config The microservice configuration.
   */
  private constructor(
    public readonly rootFolder: string,
    public readonly config: MicroserviceConfig,
  ) {
    const logLevel = this.config.LOG_LEVEL ?? "info";
    const name = config.NAME.substr(config.NAME.indexOf("/") + 1);
    const today = new Date();
    const logFileName = `${name}_${today.getFullYear()}_${
      today.getMonth() + 1
    }_${today.getDate()}.log`;

    if (
      this.config.LOG_FILE_PATH &&
      !fs.existsSync(this.config.LOG_FILE_PATH)
    ) {
      fs.mkdirSync(this.config.LOG_FILE_PATH);
    }

    this.logger = this.config.LOG_FILE_PATH
      ? Pino(
          {
            name: this.config.NAME,
            level: logLevel.toLowerCase(),
          },
          Pino.destination(this.config.LOG_FILE_PATH + "/" + logFileName),
        )
      : Pino({
          name: this.config.NAME,
          level: logLevel.toLowerCase(),
          prettyPrint: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss.l",
            ignore: "name,pid,hostname",
          },
        });
  }

  /** The Pino logger instance. */
  private readonly logger: Logger;

  /** Log a debug message. */
  debug(msg: string, ...args: unknown[]): void {
    this.logger.debug(msg, args);
  }

  /** Log an info message. */
  info(msg: string, ...args: unknown[]): void {
    this.logger.info(msg, args);
  }

  /** Log a warning message. */
  warn(msg: string, ...args: unknown[]): void {
    this.logger.warn(msg, args);
  }

  /** Log an error message. */
  error(msg: string, ...args: unknown[]): void {
    this.logger.error(msg, args);
  }

  /** The context singleton instance. */
  private static instance?: MicroserviceContext;

  /** Boot the context. */
  static async boot(rootFolder: string): Promise<MicroserviceContext> {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new MicroserviceContext(
      rootFolder,
      await readConfiguration(rootFolder),
    );
    return this.instance;
  }

  /** Array of all controller metadata, with target object as key. */
  static readonly controllers = new MapExt<string, ControllerMetadata>();

  /** Array of all service metadata, with target object as key. */
  static readonly services = new MapExt<string, ServiceMetadata>();

  /** Array of all model metadata, with target object as key. */
  static readonly models = new MapExt<string, ModelMetadata>();
}

import path from "path";
import {PinoConsoleLogger} from "../logger/pino-console-logger";
import {PinoFileLogger} from "../logger/pino-file-logger";
import {LogLevel, MicroserviceConfig, readConfiguration} from "./config";

/** Log output observer interface. */
export interface LogObserver {
  onDebugLog(msg: string, ...args: unknown[]): Promise<void>;
  onInfoLog(msg: string, ...args: unknown[]): Promise<void>;
  onWarnLog(msg: string, ...args: unknown[]): Promise<void>;
  onErrorLog(msg: string, ...args: unknown[]): Promise<void>;
}

/**
 * The Microservice Context.
 */
export class MicroserviceContext {
  /**
   * Create a MicroserviceContext.
   *
   * @param projectRootFolder Root folder of the project.
   * This is the folder that contains the package.json.
   * Configurations will be read from the file /config sub-folder.
   */
  constructor(private readonly projectRootFolder: string) {}

  /** The service configuration. */
  private serviceConfig?: MicroserviceConfig;

  /** List of log observers. */
  private readonly logObservers = new Set<LogObserver>();

  /** The log level. */
  private logLevel?: LogLevel;

  /** Get the app root folder. */
  get rootFolder(): string {
    return this.projectRootFolder;
  }

  /** Get the service configuration. */
  get config(): MicroserviceConfig {
    if (!this.serviceConfig) {
      throw new Error("Context not booted yet.");
    }
    return this.serviceConfig;
  }

  /**
   * Boot the context.
   *
   * @param configOverwrite Configuration settings that shall be overwritten
   * with the given values on this context instance.
   */
  async boot(configOverwrites?: Partial<MicroserviceConfig>): Promise<void> {
    // read service config

    const config = await readConfiguration(
      this.projectRootFolder,
      configOverwrites,
    );

    this.serviceConfig = config;
    this.logLevel = config.LOG_LEVEL;

    // init logging

    if (config.LOG_TO_CONSOLE) {
      const printPretty = config.LOG_PRETTY || !config.isProduction;
      this.registerLogObserver(
        new PinoConsoleLogger(config.NAME, this.logLevel, printPretty),
      );
    }

    if (config.LOG_FILE_FOLDER_PATH) {
      const folderPath = path.resolve(
        this.projectRootFolder,
        config.LOG_FILE_FOLDER_PATH,
      );
      this.registerLogObserver(
        new PinoFileLogger(folderPath, config.NAME, this.logLevel),
      );
    }
  }

  /** Log a debug message. */
  debug(msg: string, ...args: unknown[]): void {
    if (this.logLevel === "debug") {
      this.logObservers.forEach(observer => observer.onDebugLog(msg, args));
    }
  }

  /** Log an info message. */
  info(msg: string, ...args: unknown[]): void {
    if (this.logLevel === "info" || this.logLevel === "debug") {
      this.logObservers.forEach(observer => observer.onInfoLog(msg, args));
    }
  }

  /** Log a warning message. */
  warn(msg: string, ...args: unknown[]): void {
    if (
      this.logLevel === "info" ||
      this.logLevel === "debug" ||
      this.logLevel === "warn"
    ) {
      this.logObservers.forEach(observer => observer.onWarnLog(msg, args));
    }
  }

  /** Log an error message. */
  error(msg: string, ...args: unknown[]): void {
    if (
      this.logLevel === "info" ||
      this.logLevel === "debug" ||
      this.logLevel === "warn" ||
      this.logLevel === "error"
    ) {
      this.logObservers.forEach(observer => observer.onErrorLog(msg, args));
    }
  }

  /** Register a log observer. */
  registerLogObserver(observer: LogObserver): void {
    this.logObservers.add(observer);
  }

  /** Unregister a log observer. */
  unregisterLogObserver(observer: LogObserver): void {
    this.logObservers.delete(observer);
  }
}

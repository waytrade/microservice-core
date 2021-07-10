import axios from "axios";
import fs from "fs";
import path, {resolve} from "path";
import Pino, {Logger} from "pino";
import {MicroserviceConfig, readConfiguration} from "./config";
import {CONTROLLER_METADATA, SERVICE_METADATA} from "./metadata";
import {OpenApi} from "./openapi";
import {MicroserviceServer, ServerType} from "./server";

/**
 * Base-class for Microservice App implementations.
 */
export abstract class MicroserviceApp {
  protected constructor(
    private readonly rootFolder: string,
    private readonly controllers: unknown[],
    private readonly services: unknown[],
  ) {}

  /** The Pino logger instance. */
  private logger?: Logger;

  /** The REST API server. */
  private apiServer?: MicroserviceServer;

  /** The Webhook callbacks server. */
  private callbackServer?: MicroserviceServer;

  /** The service configuration */
  config: MicroserviceConfig = {};

  /** Get the port number of the API server. */
  get apiPort(): number {
    return this.apiServer?.listeningPort ?? 0;
  }

  /** Get the port number of the callback server. */
  get callbackPort(): number {
    return this.callbackServer?.listeningPort ?? 0;
  }

  /**
   * Called when the app shall boot up.
   * Implement on sub-class to prepare for startup (e.g. validate configuration,
   * or connection to external services).
   */
  abstract onBoot(): Promise<void>;

  /**
   * Boot the service (prepare for startup).
   * The service will be booted during run() call, unless already booted
   * by an explicit previous call.
   */
  protected async boot(): Promise<void> {
    if (this.apiServer) {
      return;
    }
    try {
      // read config

      this.config = await readConfiguration(this.rootFolder);

      // init logger

      const logLevel = this.config.LOG_LEVEL ?? "info";

      const name = this.config.NAME?.substr(this.config.NAME?.indexOf("/") + 1);
      const today = new Date();
      const logFileName = `${name}_${today.getFullYear()}_${
        today.getMonth() + 1
      }_${today.getDate()}.log`;

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

      // create API server

      this.apiServer = new MicroserviceServer(this);

      // export OpenAPI.json

      new OpenApi(this.apiServer);

      const writeOpenApi =
        process.argv.find(v => v === "-write-openapi") === "-write-openapi";

      const writeOpenApiNoExit =
        process.argv.find(v => v === "-write-openapi-no-exit") ===
        "-write-openapi-no-exit";

      if (writeOpenApi || writeOpenApiNoExit) {
        await this.startServers();
        await this.writeOpenapi();
        this.shutdown();
        resolve();
        if (!writeOpenApiNoExit) {
          process.exit(0);
        }
      }

      // create callback server

      if (this.config.CALLBACK_PORT && !isNaN(this.config.CALLBACK_PORT)) {
        this.callbackServer = new MicroserviceServer(this);
      }

      // boot app code

      await this.onBoot();
    } catch (error) {
      this.apiServer?.stop();
      this.callbackServer?.stop();
      delete this.apiServer;
      delete this.callbackServer;
      this.error("Service boot failed: " + error);
      throw error;
    }
  }

  /**
   * Called when the microservice has been started.
   * Overwrite on sub-class if necessary.
   */
  onStarted(): void {
    this.info(`API Server is running at port ${this.apiPort}`);
    if (this.callbackPort) {
      this.info(`Callback Server is running at port ${this.callbackPort}`);
    }
  }

  /** Start the service. */
  async run(): Promise<void> {
    try {
      await this.startServers();

      const services = Array.from(SERVICE_METADATA.values());
      for (let i = 0; i < services.length; i++) {
        if (services[i].target?.boot) {
          await (services[i].target?.boot() as Promise<void>);
        }
      }

      const controllers = Array.from(CONTROLLER_METADATA.values());
      for (let i = 0; i < controllers.length; i++) {
        if (controllers[i].target?.boot) {
          await (controllers[i].target?.boot() as Promise<void>);
        }
      }

      this.onStarted();
    } catch (error) {
      this.error("Service start failed. ");
      this.error(error);
      throw error;
    }
  }

  /** Shutdown the service. */
  shutdown(): void {
    this.apiServer?.stop();
    this.callbackServer?.stop();

    CONTROLLER_METADATA.forEach(c => {
      if (c.target?.shutdown) {
        c.target?.shutdown();
      }
    });

    SERVICE_METADATA.forEach(c => {
      if (c.target?.shutdown) {
        c.target?.shutdown();
      }
    });
  }

  /** Log a debug message. */
  debug(msg: string, ...args: unknown[]): void {
    this.logger?.debug(msg, args);
  }

  /** Log an info message. */
  info(msg: string, ...args: unknown[]): void {
    this.logger?.info(msg, args);
  }

  /** Log a warning message. */
  warn(msg: string, ...args: unknown[]): void {
    this.logger?.warn(msg, args);
  }

  /** Log an error message. */
  error(msg: string, ...args: unknown[]): void {
    this.logger?.error(msg, args);
  }

  /** Write the openapi.json to root folder. */
  writeOpenapi(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      axios
        .get(`http://127.0.0.1:${this.config.SERVER_PORT}/openapi.json`, {
          transformResponse: r => r,
        })
        .then(res => {
          const filePath = path.resolve(
            require?.main?.filename ?? "",
            "../../openapi.json",
          );
          fs.promises
            .writeFile(filePath, res.data)
            .then(() => {
              this.info("openapi.json downloaded to " + filePath);
              resolve();
            })
            .catch(error => {
              this.error(
                "Failed to write openapi.json to " +
                  filePath +
                  ": " +
                  error.message,
              );
              reject();
            });
        })
        .catch(() => {
          this.error("Failed to download openapi.json");
          reject();
        });
    });
  }

  /** Start the HTTP servers. */
  private startServers(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // verify config

      const apiPort = this.config.SERVER_PORT;
      if (!apiPort || isNaN(apiPort)) {
        throw new Error("SERVER_PORT not configured.");
      }

      // start API server

      this.apiServer
        ?.start(apiPort, ServerType.ApiServer)
        .then(() => {
          // start callback server

          const callbackPort = this.config.CALLBACK_PORT;
          if (this.callbackServer && callbackPort) {
            this.callbackServer
              .start(callbackPort, ServerType.CallbackServer)
              .then(() => {
                resolve();
              })
              .catch(error => reject(error));
          } else {
            resolve();
          }
        })
        .catch(error => reject(error));
    });
  }
}

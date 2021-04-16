import axios from "axios";
import fs from "fs";
import path from "path";
import {MicroserviceContext} from "./context";
import {OpenApi} from "./openapi";
import {MicroserviceServer} from "./server";

/**
 * Base-class for Microservice App implementations.
 */
export abstract class MicroserviceApp {
  constructor(private readonly rootFolder: string) {
    this.exportOpenApi =
      process.argv.find(v => v === "-write-openapi") === "-write-openapi";
  }

  /**
   * If true, the openapi.json will be exported an app will terminate
   * afterwards. If false, the app will start normally.
   */
  private exportOpenApi: boolean;

  /** The microservice context. */
  private static _context: MicroserviceContext;
  static get context(): MicroserviceContext {
    return this._context;
  }

  /** The HTTP/REST API server. */
  private server!: MicroserviceServer;

  /** Get the port number of API server. */
  get port(): number {
    return MicroserviceApp.context.config.SERVER_PORT ?? 0;
  }

  /** Called the app shall boot up. */
  abstract onBoot(): Promise<void>;

  /** Called when the microservice has been started. */
  abstract onStarted(): void;

  /** Log a debug message. */
  static debug(msg: string, ...args: unknown[]): void {
    MicroserviceApp.context.debug(msg, args);
  }

  /** Log an info message. */
  static info(msg: string, ...args: unknown[]): void {
    MicroserviceApp.context.info(msg, args);
  }

  /** Log a warning message. */
  static warn(msg: string, ...args: unknown[]): void {
    MicroserviceApp.context.error(msg, args);
  }

  /** Log an error message. */
  static error(msg: string, ...args: unknown[]): void {
    MicroserviceApp.context.error(msg, args);
  }

  /** Start the service. */
  async run(): Promise<void> {
    MicroserviceApp._context = await MicroserviceContext.boot(this.rootFolder);
    this.server = new MicroserviceServer();
    new OpenApi(this.server);

    await this.onBoot();

    MicroserviceContext.services.forEach(c => {
      if (c.target?.boot) {
        c.target?.boot();
      }
    });

    MicroserviceContext.controllers.forEach(c => {
      if (c.target?.boot) {
        c.target?.boot();
      }
    });

    await this._start();
    if (this.exportOpenApi) {
      this.writeOpenapi().finally(() => {
        this.shutdown();
        process.exit(0);
      });
    } else {
      this.onStarted();
    }
  }

  /** Shutdown the app. */
  shutdown(): void {
    if (this.server) {
      this.server.stop();
    }

    MicroserviceContext.controllers.forEach(c => {
      if (c.target?.shutdown) {
        c.target?.shutdown();
      }
    });

    MicroserviceContext.services.forEach(c => {
      if (c.target?.shutdown) {
        c.target?.shutdown();
      }
    });
  }

  /** The the openapi.json to root folder. */
  writeOpenapi(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      axios
        .get(
          `http://127.0.0.1:${MicroserviceApp.context.config.SERVER_PORT}/openapi.json`,
          {
            transformResponse: r => r,
          },
        )
        .then(res => {
          const filePath = path.resolve(
            require?.main?.filename ?? "",
            "../../openapi.json",
          );
          fs.promises
            .writeFile(filePath, res.data)
            .then(() => {
              MicroserviceApp.info("openapi.json downloaded to " + filePath);
              resolve();
            })
            .catch(error => {
              MicroserviceApp.error(
                "Failed to write openapi.json to " +
                  filePath +
                  ": " +
                  error.message,
              );
              reject();
            });
        })
        .catch(() => {
          MicroserviceApp.error("Failed to download openapi.json");
          reject();
        });
    });
  }

  /** Start the microservice. */
  private _start(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // verify config

      const port = MicroserviceApp.context.config.SERVER_PORT;
      if (!port) {
        throw new Error("SERVER_PORT not configured.");
      }

      // start server

      this.server
        .start(port)
        .then(() => {
          resolve();
        })
        .catch(error => reject(error));
    });
  }
}

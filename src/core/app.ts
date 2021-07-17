import {MicroserviceContext} from "..";
import {MicroserviceConfig} from "./config";
import {MicroserviceHttpServer} from "./http-server";
import {exportOpenApiJson} from "./openapi-exporter";

/** MicroserviceApp initialization parameters. */
export interface MicroserviceAppParams {
  // API controller types exposed by this app
  apiControllers?: unknown[];

  // Webhook Callback controller types exposed by this app
  callbackControllers?: unknown[];

  // Services types exposed by this app
  services?: unknown[];

  /**
   * If not undefined, this context will be used instead of a newly created
   * context that is owner by the app.
   */
  externalContext?: MicroserviceContext;
}

/**
 * Base-class for Microservice App implementations.
 */
export abstract class MicroserviceApp<CONFIG_TYPE extends MicroserviceConfig> {
  /**
   * MicroserviceApp constructor.
   *
   * @param projectRootFolder App root folder. This is the folder containing the package.json.
   */
  constructor(
    private projectRootFolder: string,
    private readonly params: MicroserviceAppParams,
  ) {
    this.context =
      params.externalContext ?? new MicroserviceContext(this.projectRootFolder);
  }

  /** The service context. */
  private readonly context: MicroserviceContext;

  /** The REST API server. */
  private apiServer?: MicroserviceHttpServer;

  /** The Webhook callbacks server. */
  private callbackServer?: MicroserviceHttpServer;

  /** Called when the app shall boot up. */
  protected abstract boot(): Promise<void>;

  /** Called when the microservice has been started. */
  onStarted(): void {
    if (this.apiServer) {
      this.info(
        `REST API Server started at port ${this.apiServer.listeningPort}`,
      );
    }
    if (this.callbackServer) {
      this.info(
        `Webhook Callback Server started at port ${this.callbackServer.listeningPort}`,
      );
    }
    return;
  }

  /** Called when the microservice has been stopped. */
  onStopped(): void {
    this.info("App stopped.");
  }

  /** Get the service configuration */
  get config(): CONFIG_TYPE {
    return (<unknown>this.context.config) as CONFIG_TYPE;
  }

  /** Get the listening port for number of the REST API server. */
  get apiServerPort(): number | undefined {
    return this.apiServer?.listeningPort;
  }

  /** Get the listening port for number of the Webhook callback I server. */
  get callbackServerPort(): number | undefined {
    return this.callbackServer?.listeningPort;
  }

  /**  Start the app. */
  async start(configOverwrites?: Partial<MicroserviceConfig>): Promise<void> {
    // booth context

    if (!this.context.isBooted) {
      await this.context.boot(configOverwrites);
    }

    // start the app

    await this.boot();

    this.info("Starting App...");

    // start webhook callback server

    if (this.params.callbackControllers) {
      this.callbackServer = new MicroserviceHttpServer(
        this.context,
        this.params.callbackControllers,
      );
      await this.callbackServer.start(this.config.CALLBACK_PORT);
    }

    // boot the services

    if (this.params.services) {
      for (let i = 0; i < this.params.services?.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const service = this.params.services[i] as any;
        if (service.start) {
          await service.start();
        }
      }
    }

    // boot the callback controllers

    if (this.params.callbackControllers) {
      for (let i = 0; i < this.params.callbackControllers?.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctrl = this.params.callbackControllers[i] as any;
        if (ctrl.start) {
          await ctrl.start();
        }
      }
    }

    // boot the API controllers

    if (this.params.apiControllers) {
      for (let i = 0; i < this.params.apiControllers?.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctrl = this.params.apiControllers[i] as any;
        if (ctrl.start) {
          await ctrl.start();
        }
      }
    }

    // start API server

    if (this.params.apiControllers) {
      this.apiServer = new MicroserviceHttpServer(
        this.context,
        this.params.apiControllers,
      );
      await this.apiServer.start(this.config.SERVER_PORT);
    }

    this.onStarted();
  }

  /** Stop the app. */
  stop(): void {
    // stop the HTTP servers

    this.apiServer?.stop();
    this.callbackServer?.stop();

    // stop the controllers

    if (this.params.apiControllers) {
      for (let i = 0; i < this.params.apiControllers.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctrl = this.params.apiControllers[i] as any;
        if (ctrl.stop) {
          ctrl.stop();
        }
      }
    }

    // stop the services

    if (this.params.services) {
      for (let i = 0; i < this.params.services.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const service = this.params.services[i] as any;
        if (service.stop) {
          service.stop();
        }
      }
    }

    this.onStopped();
  }

  /** Log a debug message. */
  debug(msg: string, ...args: unknown[]): void {
    this.context?.debug(msg, args);
  }

  /** Log an info message. */
  info(msg: string, ...args: unknown[]): void {
    this.context?.info(msg, args);
  }

  /** Log a warning message. */
  warn(msg: string, ...args: unknown[]): void {
    this.context?.warn(msg, args);
  }

  /** Log an error message. */
  error(msg: string, ...args: unknown[]): void {
    this.context?.error(msg, args);
  }

  /** Export the openapi.json the given folder */
  exportOpenApi(destinationFolder: string): Promise<void> {
    return exportOpenApiJson(
      destinationFolder,
      this.context,
      this.params.apiControllers ?? [],
    );
  }
}

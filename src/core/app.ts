import {MicroserviceContext} from "..";
import {exportOpenApiJson} from "../util/openapi-exporter";
import {MicroserviceConfig} from "./config";
import {MicroserviceHttpServer} from "./http-server";

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
export class MicroserviceApp<CONFIG_TYPE extends MicroserviceConfig> {
  /**
   * MicroserviceApp constructor.
   *
   * @param projectRootFolder App root folder. This is the folder containing the package.json.
   */
  constructor(
    private projectRootFolder: string,
    private readonly params?: MicroserviceAppParams,
  ) {
    this.context =
      params?.externalContext ??
      new MicroserviceContext(this.projectRootFolder);
  }

  /** The service context. */
  private readonly context: MicroserviceContext;

  /** The REST API server. */
  private apiServer?: MicroserviceHttpServer;

  /** The Webhook callbacks server. */
  private callbackServer?: MicroserviceHttpServer;

  /** Get the service configuration */
  get config(): CONFIG_TYPE {
    return (<unknown>this.context.config) as CONFIG_TYPE;
  }

  /** Get the listening port for number of the REST API server. */
  get apiServerPort(): number {
    return this.apiServer?.listeningPort ?? 0;
  }

  /** Get the listening port for number of the Webhook callback I server. */
  get callbackServerPort(): number {
    return this.callbackServer?.listeningPort ?? 0;
  }

  /**  Start the app. */
  async start(configOverwrites?: Partial<MicroserviceConfig>): Promise<void> {
    // booth context

    if (!this.context.isBooted) {
      await this.context.boot(configOverwrites);
    }

    // start webhook callback server

    if (this.params?.callbackControllers) {
      this.callbackServer = new MicroserviceHttpServer(
        this.context,
        this.params.callbackControllers,
      );
      await this.callbackServer.start(this.config.CALLBACK_PORT);
    }

    // boot the services

    if (this.params?.services) {
      for (let i = 0; i < this.params.services?.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const service = this.params.services[i] as any;
        if (service.boot) {
          await service.boot();
        }
      }
    }

    // boot the callback controllers

    if (this.params?.callbackControllers) {
      for (let i = 0; i < this.params.callbackControllers?.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctrl = this.params.callbackControllers[i] as any;
        if (ctrl.boot) {
          await ctrl.boot();
        }
      }
    }

    // boot the API controllers

    if (this.params?.apiControllers) {
      for (let i = 0; i < this.params.apiControllers?.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctrl = this.params.apiControllers[i] as any;
        if (ctrl.boot) {
          await ctrl.boot();
        }
      }
    }

    // start API server

    if (this.params?.apiControllers) {
      this.apiServer = new MicroserviceHttpServer(
        this.context,
        this.params.apiControllers,
      );
      await this.apiServer.start(this.config.SERVER_PORT);
    }
  }

  /** Stop the app. */
  stop(): void {
    // shutdown the HTTP server

    this.apiServer?.stop();
    this.callbackServer?.stop();

    // shutdown the controllers

    if (this.params?.apiControllers) {
      for (let i = 0; i < this.params.apiControllers.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctrl = this.params.apiControllers[i] as any;
        if (ctrl.shutdown) {
          ctrl.shutdown();
        }
      }
    }

    // shutdown the services

    if (this.params?.services) {
      for (let i = 0; i < this.params.services.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const service = this.params.services[i] as any;
        if (service.shutdown) {
          service.shutdown();
        }
      }
    }
  }

  /** Export the openapi.json the given folder */
  exportOpenApi(destinationFolder: string): Promise<void> {
    return exportOpenApiJson(
      destinationFolder,
      this.context,
      this.params?.apiControllers ?? [],
    );
  }
}

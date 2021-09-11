/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import {MicroserviceContext} from "..";
import {MicroserviceConfig} from "./config";
import {MicroserviceHttpServer} from "./http-server";
import {CONTROLLER_METADATA, InjectedPropertyMetadata} from "./metadata";
import {OpenApi} from "./openapi";
import {MicroserviceWebsocketStreamConfig} from "./websocket-stream";

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

  /** Maxmimum backpressure pre websocket in bytes. Default is 1KB (1024). */
  websocketMaxBackpressure?: number;

  /** Websocket ping headbeat interval in seconds. Default is 30s. */
  websocketPingInterval?: number;

  /**
   * If set to true, no 'pong' text message will send to websockets when
   * receiving 'ping' text message has been received.
   * Pong op-code responses on protocol level will still continue to work.
   */
  disablePongMessageReply?: boolean;

  /** If set to true, no pint/pong op-code heartbeat check will be run. */
  disableOpCodeHeartbeat?: boolean;
}

/** A component instance with its type */
export interface MicroserviceComponentInstance {
  instance: any;
  type: any;
  running: boolean;
}

/** The component factory. */
export interface MicroserviceComponentFactory {
  create(type: unknown): unknown;
}

/** The default component factory. */
export class DefaultMicroserviceComponentFactory
  implements MicroserviceComponentFactory
{
  create(type: unknown): unknown {
    return new (<any>type)();
  }
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
    private readonly componentFactory: MicroserviceComponentFactory = new DefaultMicroserviceComponentFactory(),
  ) {
    this.context =
      params.externalContext ?? new MicroserviceContext(this.projectRootFolder);
  }

  /** The service context. */
  private readonly context: MicroserviceContext;

  /** List of service instances. */
  private services: MicroserviceComponentInstance[] = [];

  /** List of callback controller instances. */
  private callbackControllers: MicroserviceComponentInstance[] = [];

  /** List of api controller instances. */
  private apiControllers: MicroserviceComponentInstance[] = [];

  /** The REST API server. */
  private apiServer?: MicroserviceHttpServer;

  /** The OpenAPI generator. */
  private openApi?: OpenApi;

  /** The Webhook callbacks server. */
  private callbackServer?: MicroserviceHttpServer;

  /** true if the app is running, false otherwise. */
  private running = false;

  /** Called when the app shall boot up. */
  protected abstract boot(): Promise<void>;

  /** Called when the microservice has been started. */
  protected onStarted(): void {
    this.info(`API Server started at port ${this.apiServer?.listeningPort}`);
    if (this.callbackServer) {
      this.info(
        `Webhook Callback Server started at port ${this.callbackServer.listeningPort}`,
      );
    }
    return;
  }

  /** Called when the microservice has been stopped. */
  protected onStopped(): void {
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

  /** Get an API controller instance. */
  getApiController(type: unknown): unknown {
    let instance: unknown | undefined = undefined;
    for (let i = 0; i < this.apiControllers.length; i++) {
      if (this.apiControllers[i].type === type) {
        instance = this.apiControllers[i].instance;
        break;
      }
    }
    return instance;
  }

  /** Get an API controller instance by class name. */
  getApiControllerByName(name: string): unknown {
    let instance: unknown | undefined = undefined;
    for (let i = 0; i < this.apiControllers.length; i++) {
      if (this.apiControllers[i].type.name === name) {
        instance = this.apiControllers[i].instance;
        break;
      }
    }
    return instance;
  }

  /** Get a callback controller instance. */
  getCallbackController(type: unknown): unknown {
    let instance: unknown | undefined = undefined;
    for (let i = 0; i < this.callbackControllers.length; i++) {
      if (this.callbackControllers[i].type === type) {
        instance = this.callbackControllers[i].instance;
        break;
      }
    }
    return instance;
  }

  /** Get a callback controller instance by class name. */
  getCallbackControllerByName(name: string): unknown {
    let instance: unknown | undefined = undefined;
    for (let i = 0; i < this.callbackControllers.length; i++) {
      if (this.callbackControllers[i].type.name === name) {
        instance = this.callbackControllers[i].instance;
        break;
      }
    }
    return instance;
  }

  /** Get a service instance. */
  getService(type: unknown): unknown {
    let instance: unknown | undefined = undefined;
    for (let i = 0; i < this.services.length; i++) {
      if (this.services[i].type === type) {
        instance = this.services[i].instance;
        break;
      }
    }
    return instance;
  }

  /** Get a service instance by class name. */
  getServiceByName(name: unknown): unknown {
    let instance: unknown | undefined = undefined;
    for (let i = 0; i < this.services.length; i++) {
      if (this.services[i].type.name === name) {
        instance = this.services[i].instance;
        break;
      }
    }
    return instance;
  }

  /**  Start the app. */
  async start(configOverwrites?: Partial<MicroserviceConfig>): Promise<void> {
    try {
      if (this.running) {
        throw new Error("App is running already.");
      }

      // boot the app

      if (!this.params.externalContext) {
        await this.context.boot(configOverwrites);
      }

      this.info("Starting App...");

      await this.boot();

      // create component instances

      if (this.params.apiControllers) {
        this.params.apiControllers.forEach(ctrl => {
          this.apiControllers.push({
            type: ctrl,
            instance: this.componentFactory.create(ctrl),
            running: false,
          });
        });
      }

      if (this.params.callbackControllers) {
        this.params.callbackControllers.forEach(ctrl => {
          this.callbackControllers.push({
            type: ctrl,
            instance: this.componentFactory.create(ctrl),
            running: false,
          });
        });
      }

      if (this.params.services) {
        this.params.services.forEach(service => {
          this.services.push({
            type: service,
            instance: this.componentFactory.create(service),
            running: false,
          });
        });
      }

      // boot components

      for (let i = 0; i < this.apiControllers.length; i++) {
        const ctrl = this.apiControllers[i];
        const metadata = CONTROLLER_METADATA.get(ctrl.type.name);
        this.injectProperties(
          ctrl.type,
          ctrl.instance,
          metadata?.injectedProps,
        );
        if (ctrl.type.boot) {
          await ctrl.type.boot();
        }
        if (ctrl.instance.boot) {
          await ctrl.instance.boot();
        }
      }

      for (let i = 0; i < this.callbackControllers.length; i++) {
        const ctrl = this.callbackControllers[i];
        const metadata = CONTROLLER_METADATA.get(ctrl.type.name);
        this.injectProperties(
          ctrl.type,
          ctrl.instance,
          metadata?.injectedProps,
        );
        if (ctrl.type.boot) {
          await ctrl.type.boot();
        }
        if (ctrl.instance.boot) {
          await ctrl.instance.boot();
        }
      }

      for (let i = 0; i < this.services.length; i++) {
        const service = this.services[i];
        const metadata = CONTROLLER_METADATA.get(service.type.name);
        this.injectProperties(
          service.type,
          service.instance,
          metadata?.injectedProps,
        );
        if (service.type.boot) {
          await service.type.boot();
        }
        if (service.instance.boot) {
          await service.instance.boot();
        }
      }

      // start servers

      const wsConfig: MicroserviceWebsocketStreamConfig = {
        maxBackpressure: this.params.websocketMaxBackpressure,
        pingInterval: this.params.websocketPingInterval,
        disablePongMessageReply: this.params.disablePongMessageReply,
        disableOpCodeHeartbeat: this.params.disableOpCodeHeartbeat,
      };

      this.apiServer = new MicroserviceHttpServer(
        this.context,
        this.apiControllers,
        wsConfig,
      );
      this.openApi = new OpenApi(
        this.context,
        this.params.apiControllers ?? [],
        this.apiServer,
      );

      await this.apiServer.start(this.config.SERVER_PORT);

      if (this.callbackControllers.length) {
        this.callbackServer = new MicroserviceHttpServer(
          this.context,
          this.callbackControllers,
          wsConfig,
        );
        await this.callbackServer.start(this.config.CALLBACK_PORT);
      }

      // start components

      for (let i = 0; i < this.apiControllers.length; i++) {
        const ctrl = this.apiControllers[i];
        if (ctrl.type.start) {
          await ctrl.type.start();
        }
        if (ctrl.instance.start) {
          await ctrl.instance.start();
        }
        ctrl.running = true;
      }

      for (let i = 0; i < this.callbackControllers.length; i++) {
        const ctrl = this.callbackControllers[i];
        if (ctrl.type.start) {
          await ctrl.type.start();
        }
        if (ctrl.instance.start) {
          await ctrl.instance.start();
        }
        ctrl.running = true;
      }

      for (let i = 0; i < this.services.length; i++) {
        const service = this.services[i];
        if (service.type.start) {
          await service.type.start();
        }
        if (service.instance.start) {
          await service.instance.start();
        }
        service.running = true;
      }

      this.onStarted();
      this.running = true;
    } catch (e) {
      const msg = typeof e === "string" ? e : (e as Error).message ?? e;
      this.context.error("App start failed: " + msg);
      throw new Error(msg);
    }
  }

  /** Stop the app. */
  stop(): void {
    // stop the HTTP servers

    this.apiServer?.stop();
    this.callbackServer?.stop();

    // stop the api controllers

    for (let i = 0; i < this.apiControllers.length; i++) {
      if (this.apiControllers[i].instance.stop) {
        this.apiControllers[i].instance.stop();
      }
      if (this.apiControllers[i].type.stop) {
        this.apiControllers[i].type.stop();
      }
    }

    this.apiControllers = [];

    // stop the callback controllers

    for (let i = 0; i < this.callbackControllers.length; i++) {
      if (this.callbackControllers[i].instance.stop) {
        this.callbackControllers[i].instance.stop();
      }
      if (this.callbackControllers[i].type.stop) {
        this.callbackControllers[i].type.stop();
      }
    }

    this.callbackControllers = [];

    // stop the services

    for (let i = 0; i < this.services.length; i++) {
      if (this.services[i].instance.stop) {
        this.services[i].instance.stop();
      }
      if (this.services[i].type.stop) {
        this.services[i].type.stop();
      }
    }

    this.services = [];

    this.onStopped();
    this.running = false;
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
  async exportOpenApi(destinationFolder: string): Promise<void> {
    // start servers

    const context = new MicroserviceContext(this.projectRootFolder);
    await context.boot();

    const openApi = new OpenApi(context, this.params.apiControllers ?? []);
    const model = await openApi.getOpenApiModel();
    fs.writeFileSync(
      destinationFolder + "/openapi.json",
      JSON.stringify(model),
    );
  }

  private injectProperties(
    parentType: any,
    instance: any,
    injectedProps?: InjectedPropertyMetadata[],
  ): void {
    injectedProps?.forEach(prop => {
      if (prop.typeName === this.constructor.name) {
        if (prop.isStatic) {
          parentType[prop.propertyKey] = this;
        } else {
          instance[prop.propertyKey] = this;
        }
      } else {
        const val =
          this.getServiceByName(prop.typeName) ??
          this.getCallbackControllerByName(prop.typeName) ??
          this.getApiControllerByName(prop.typeName);
        if (prop.isStatic) {
          parentType[prop.propertyKey] = val;
        } else {
          instance[prop.propertyKey] = val;
        }
      }
    });
  }
}

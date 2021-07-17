import axios from "axios";
import path from "path";
import {
  controller,
  get,
  HttpStatus,
  MicroserviceContext,
  MicroserviceTestApp,
} from "../../..";
import {MicroserviceAppParams} from "../../../core/app";
import {MicroserviceConfig} from "../../../core/config";

@controller("Dummy controller without start and stop functions")
class TestControllerNoBootFunction {
  static dummy() {
    return;
  }
}

@controller("TestControllerBlockingBootFunction")
class TestControllerBlockingBootFunction {
  static startCalled = false;
  static stopCalled = false;

  static start(): void {
    this.startCalled = true;
    return;
  }
  static stop(): void {
    this.stopCalled = true;
    return;
  }
}

@controller("TestControllerAsyncBootFunction")
class TestControllerAsyncBootFunction {
  static startCalled = false;
  static stopCalled = false;

  static start(): Promise<void> {
    return new Promise<void>(resolve => {
      this.startCalled = true;
      resolve();
    });
  }
  static stop(): void {
    this.stopCalled = true;
    return;
  }
}

const GET_HANDLER_CONTROLLER_PATH = "/test/get";
@controller("HandleGetTestController", GET_HANDLER_CONTROLLER_PATH)
class HandleGetTestController {
  static getHandlerCalled = false;
  @get("/")
  static get(): void {
    this.getHandlerCalled = true;
  }
}

/** App with verification steps during boot */
class BootVerifyApp extends MicroserviceTestApp<MicroserviceConfig> {
  constructor(projectRootFolder: string, params: MicroserviceAppParams) {
    super(projectRootFolder, params);
  }

  protected async boot(): Promise<void> {
    // config must be valid
    expect(this.config).toBeDefined();
    // HTTP server not booted yet, ports must be undefined
    expect(this.apiServerPort).toEqual(undefined);
    expect(this.callbackServerPort).toEqual(undefined);
  }
}

describe("Test MicroserviceApp class", () => {
  test("Start / Stop App with own context", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder);
      app
        .start()
        .then(() => {
          expect(app.config.NAME).toEqual("@waytrade/microservice-core");
          app.stop();
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Start / Stop App with external context", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const context = new MicroserviceContext(rootFolder);
      context
        .boot()
        .then(() => {
          const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
            externalContext: context,
          });
          app
            .start()
            .then(() => {
              expect(context.config.VERSION).toEqual(context.config.VERSION);
              app.stop();
              resolve();
            })
            .catch(error => {
              reject(error);
            });
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Start / Stop controllers", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new BootVerifyApp(rootFolder, {
        apiControllers: [
          TestControllerNoBootFunction,
          TestControllerBlockingBootFunction,
          TestControllerAsyncBootFunction,
        ],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports)
        .then(() => {
          //expect(server.listeningPort).not.toEqual(0);
          expect(TestControllerBlockingBootFunction.startCalled).toBeTruthy();
          expect(TestControllerBlockingBootFunction.stopCalled).toBeFalsy();
          expect(TestControllerAsyncBootFunction.startCalled).toBeTruthy();
          expect(TestControllerAsyncBootFunction.stopCalled).toBeFalsy();
          app.stop();
          expect(TestControllerBlockingBootFunction.startCalled).toBeTruthy();
          expect(TestControllerBlockingBootFunction.stopCalled).toBeTruthy();
          expect(TestControllerAsyncBootFunction.startCalled).toBeTruthy();
          expect(TestControllerAsyncBootFunction.stopCalled).toBeTruthy();
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Test API server", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");
      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [HandleGetTestController],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.apiServerPort).not.toEqual(0);
          expect(app.callbackServerPort).toEqual(0);
          axios
            .get<void>(
              `http://127.0.0.1:${app.apiServerPort}${GET_HANDLER_CONTROLLER_PATH}/`,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              resolve();
            })
            .catch(error => {
              reject(error);
            })
            .finally(() => {
              app.stop();
            });
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Log a via App proxies", () => {
    return new Promise<void>((resolve, reject) => {
      const errorMessage = "Error message";
      const warnMessage = "Warning message";
      const infoMessage = "Info message";
      const debugMessage = "Debug message";

      let logMessagesReceived = 0;
      const rootFolder = path.resolve(__dirname, "../../../..");

      const context = new MicroserviceContext(rootFolder);
      context
        .boot({
          LOG_LEVEL: "debug",
        })
        .then(() => {
          context.registerLogObserver({
            async onDebugLog(msg: string, ...args: unknown[]): Promise<void> {
              expect(msg).toEqual(debugMessage);
              logMessagesReceived++;
              if (logMessagesReceived === 4) {
                resolve();
              }
            },
            async onInfoLog(msg: string, ...args: unknown[]): Promise<void> {
              expect(msg).toEqual(infoMessage);
              logMessagesReceived++;
              if (logMessagesReceived === 4) {
                resolve();
              }
            },
            async onWarnLog(msg: string, ...args: unknown[]): Promise<void> {
              expect(msg).toEqual(warnMessage);
              logMessagesReceived++;
              if (logMessagesReceived === 4) {
                resolve();
              }
            },
            async onErrorLog(msg: string, ...args: unknown[]): Promise<void> {
              expect(msg).toEqual(errorMessage);
              logMessagesReceived++;
              if (logMessagesReceived === 4) {
                resolve();
              }
            },
          });

          const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
            externalContext: context,
          });
          app
            .start()
            .then(() => {
              app.debug(debugMessage);
              app.info(infoMessage);
              app.warn(warnMessage);
              app.error(errorMessage);
            })
            .catch(error => {
              reject(error);
            })
            .finally(() => {
              app.stop();
            });
        })
        .catch(error => {
          reject(error);
        });
    });
  });
});

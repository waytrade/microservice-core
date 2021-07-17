import axios from "axios";
import path from "path";
import {
  controller,
  get,
  HttpStatus,
  MicroserviceAppParams,
  MicroserviceContext,
  MicroserviceTestApp,
} from "../../..";
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

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestControllerNoBootFunction],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
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
        .boot({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
            apiControllers: [TestControllerNoBootFunction],
            externalContext: context,
          });
          app
            .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
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

  test("Fail on double-start", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestControllerNoBootFunction],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          app
            .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
            .then(() => {
              reject();
            })
            .catch(() => {
              resolve();
            })
            .finally(() => {
              app.stop();
            });
        })
        .catch(error => {
          app.stop();
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
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
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

      expect(app.apiServerPort).toEqual(undefined);
      expect(app.callbackServerPort).toEqual(undefined);

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.apiServerPort).not.toEqual(undefined);
          expect(app.callbackServerPort).toEqual(undefined);
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
      let errorReceived = false;
      const warnMessage = "Warning message";
      let warnReceived = false;
      const infoMessage = "Info message";
      let infoReceived = false;
      const debugMessage = "Debug message";
      let debugReceived = false;

      const rootFolder = path.resolve(__dirname, "../../../..");

      const context = new MicroserviceContext(rootFolder);
      context
        .boot({
          SERVER_PORT: undefined,
          CALLBACK_PORT: undefined,
          LOG_LEVEL: "debug",
        })
        .then(() => {
          context.registerLogObserver({
            async onDebugLog(msg: string, ...args: unknown[]): Promise<void> {
              if (msg === debugMessage) {
                debugReceived = true;
              }
              if (
                errorReceived &&
                warnReceived &&
                infoReceived &&
                debugReceived
              ) {
                resolve();
              }
            },
            async onInfoLog(msg: string, ...args: unknown[]): Promise<void> {
              if (msg === infoMessage) {
                infoReceived = true;
              }
              if (
                errorReceived &&
                warnReceived &&
                infoReceived &&
                debugReceived
              ) {
                resolve();
              }
            },
            async onWarnLog(msg: string, ...args: unknown[]): Promise<void> {
              if (msg === warnMessage) {
                warnReceived = true;
              }
              if (
                errorReceived &&
                warnReceived &&
                infoReceived &&
                debugReceived
              ) {
                resolve();
              }
            },
            async onErrorLog(msg: string, ...args: unknown[]): Promise<void> {
              if (msg === errorMessage) {
                errorReceived = true;
              }
              if (
                errorReceived &&
                warnReceived &&
                infoReceived &&
                debugReceived
              ) {
                resolve();
              }
            },
          });

          const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
            apiControllers: [TestControllerNoBootFunction],
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

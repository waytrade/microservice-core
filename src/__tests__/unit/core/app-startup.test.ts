import axios from "axios";
import path from "path";
import {
  controller,
  get,
  HttpStatus,
  MicroserviceContext,
  MicroserviceTestApp,
} from "../../..";
import {MicroserviceConfig} from "../../../core/config";

@controller("Dummy controller with boot and shutdown functions")
class TestControllerNoBootFunction {
  static dummy() {
    return;
  }
}

@controller("TestControllerBlockingBootFunction")
class TestControllerBlockingBootFunction {
  static bootCalled = false;
  static shutCalled = false;

  static boot(): void {
    this.bootCalled = true;
    return;
  }
  static shutdown(): void {
    this.shutCalled = true;
    return;
  }
}

@controller("TestControllerAsyncBootFunction")
class TestControllerAsyncBootFunction {
  static bootCalled = false;
  static shutCalled = false;

  static boot(): Promise<void> {
    return new Promise<void>(resolve => {
      this.bootCalled = true;
      resolve();
    });
  }
  static shutdown(): void {
    this.shutCalled = true;
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
              //expect(server.listeningPort).not.toEqual(0);
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

  test("Boot / Shutdown controllers", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
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
          expect(TestControllerBlockingBootFunction.bootCalled).toBeTruthy();
          expect(TestControllerBlockingBootFunction.shutCalled).toBeFalsy();
          expect(TestControllerAsyncBootFunction.bootCalled).toBeTruthy();
          expect(TestControllerAsyncBootFunction.shutCalled).toBeFalsy();
          app.stop();
          expect(TestControllerBlockingBootFunction.bootCalled).toBeTruthy();
          expect(TestControllerBlockingBootFunction.shutCalled).toBeTruthy();
          expect(TestControllerAsyncBootFunction.bootCalled).toBeTruthy();
          expect(TestControllerAsyncBootFunction.shutCalled).toBeTruthy();
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
});

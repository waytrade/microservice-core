import path from "path";
import {controller} from "../../..";
import {MicroserviceConfig} from "../../../core/config";
import {MicroserviceTestApp} from "../../../util/test-app";

@controller("Dummy controller without start and stop functions")
class TestControllerNoBootFunction {
  static dummy() {
    return;
  }
}

@controller("Controller with blocking boot function")
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

@controller("Controller with async boot function")
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

const CONTROLLER_BOOT_FAILURE_TEXT = "Controller booth failed";

@controller("Controller with failing async boot function")
class TestControllerFailedAsyncBoot {
  static start(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      reject(new Error(CONTROLLER_BOOT_FAILURE_TEXT));
    });
  }
}

@controller("Controller with failed blocking boot function")
class TestControllerFailedBlockingBoot {
  static start(): Promise<void> {
    throw new Error(CONTROLLER_BOOT_FAILURE_TEXT);
  }
}

describe("Test Controller boot", () => {
  test("Start / Stop controllers", () => {
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

  test("API Controller boot failure async", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestControllerFailedAsyncBoot],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          reject();
        })
        .catch(error => {
          expect(error.message).toEqual(CONTROLLER_BOOT_FAILURE_TEXT);
          resolve();
        })
        .finally(() => {
          app.stop();
        });
    });
  });

  test("API Controller boot failure blocking", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestControllerFailedBlockingBoot],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          reject();
        })
        .catch(error => {
          expect(error.message).toEqual(CONTROLLER_BOOT_FAILURE_TEXT);
          resolve();
        })
        .finally(() => {
          app.stop();
        });
    });
  });

  test("Callback Controller boot failure async", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        callbackControllers: [TestControllerFailedAsyncBoot],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          reject();
        })
        .catch(error => {
          expect(error.message).toEqual(CONTROLLER_BOOT_FAILURE_TEXT);
          resolve();
        })
        .finally(() => {
          app.stop();
        });
    });
  });

  test("Callback Controller boot failure blocking", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        callbackControllers: [TestControllerFailedBlockingBoot],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          reject();
        })
        .catch(error => {
          expect(error.message).toEqual(CONTROLLER_BOOT_FAILURE_TEXT);
          resolve();
        })
        .finally(() => {
          app.stop();
        });
    });
  });
});

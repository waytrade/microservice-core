import path from "path";
import {controller} from "../../..";
import {MicroserviceConfig} from "../../../core/config";
import {MicroserviceTestApp} from "../../../util/test-app";

@controller("Controller with static blocking boot function")
class TestControllerStaticBlockingBootFunction {
  static bootCalled = false;
  static startCalled = false;
  static stopCalled = false;

  static boot(): void {
    this.bootCalled = true;
    return;
  }
  static start(): void {
    this.startCalled = true;
    return;
  }
  static stop(): void {
    this.stopCalled = true;
    return;
  }
}

@controller("Controller with static async boot function")
class TestControllerStaticAsyncBootFunction {
  static bootCalled = false;
  static startCalled = false;
  static stopCalled = false;

  static boot(): Promise<void> {
    return new Promise<void>(resolve => {
      this.bootCalled = true;
      resolve();
    });
  }
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

@controller("Controller with static blocking boot function")
class TestControllerBlockingBootFunction {
  bootCalled = false;
  startCalled = false;
  stopCalled = false;

  boot(): void {
    this.bootCalled = true;
    return;
  }
  start(): void {
    this.startCalled = true;
    return;
  }
  stop(): void {
    this.stopCalled = true;
    return;
  }
}

@controller("Controller with static async boot function")
class TestControllerAsyncBootFunction {
  bootCalled = false;
  startCalled = false;
  stopCalled = false;

  boot(): Promise<void> {
    return new Promise<void>(resolve => {
      this.bootCalled = true;
      resolve();
    });
  }
  start(): Promise<void> {
    return new Promise<void>(resolve => {
      this.startCalled = true;
      resolve();
    });
  }
  stop(): void {
    this.stopCalled = true;
    return;
  }
}

const CONTROLLER_BOOT_FAILURE_TEXT = "Controller booth failed";

@controller("Controller with failing static async boot function")
class TestControllerFailedStaticAsyncBoot {
  static start(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      reject(new Error(CONTROLLER_BOOT_FAILURE_TEXT));
    });
  }
}

@controller("Controller with failing static blocking boot function")
class TestControllerFailedStaticBlockingBoot {
  static start(): Promise<void> {
    throw new Error(CONTROLLER_BOOT_FAILURE_TEXT);
  }
}

@controller("Controller with failing async boot function")
class TestControllerFailedAsyncBoot {
  start(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      reject(new Error(CONTROLLER_BOOT_FAILURE_TEXT));
    });
  }
}

@controller("Controller with failing blocking boot function")
class TestControllerFailedBlockingBoot {
  start(): Promise<void> {
    throw new Error(CONTROLLER_BOOT_FAILURE_TEXT);
  }
}

describe("Test API Controller boot", () => {
  test("Start / Stop (static)", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        callbackControllers: [
          TestControllerStaticBlockingBootFunction,
          TestControllerStaticAsyncBootFunction,
        ],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(
            TestControllerStaticBlockingBootFunction.bootCalled,
          ).toBeTruthy();
          expect(
            TestControllerStaticBlockingBootFunction.startCalled,
          ).toBeTruthy();
          expect(
            TestControllerStaticBlockingBootFunction.stopCalled,
          ).toBeFalsy();
          expect(TestControllerStaticAsyncBootFunction.bootCalled).toBeTruthy();
          expect(
            TestControllerStaticAsyncBootFunction.startCalled,
          ).toBeTruthy();
          expect(TestControllerStaticAsyncBootFunction.stopCalled).toBeFalsy();

          app.stop();

          expect(
            TestControllerStaticBlockingBootFunction.stopCalled,
          ).toBeTruthy();
          expect(TestControllerStaticAsyncBootFunction.stopCalled).toBeTruthy();
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Start / Stop (instance)", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        callbackControllers: [
          TestControllerBlockingBootFunction,
          TestControllerAsyncBootFunction,
        ],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          let instanceBlocking = app.getCallbackController(
            TestControllerBlockingBootFunction,
          ) as TestControllerBlockingBootFunction;
          expect(instanceBlocking.bootCalled).toBeTruthy();
          expect(instanceBlocking.startCalled).toBeTruthy();
          expect(instanceBlocking.stopCalled).toBeFalsy();
          const instanceAsync = app.getCallbackController(
            TestControllerAsyncBootFunction,
          ) as TestControllerAsyncBootFunction;
          expect(instanceAsync.bootCalled).toBeTruthy();
          expect(instanceAsync.startCalled).toBeTruthy();
          expect(instanceAsync.stopCalled).toBeFalsy();

          app.stop();

          expect(
            app.getCallbackController(TestControllerBlockingBootFunction),
          ).toBeUndefined();
          expect(instanceBlocking.stopCalled).toBeTruthy();
          expect(
            app.getCallbackController(TestControllerAsyncBootFunction),
          ).toBeUndefined();
          expect(instanceAsync.stopCalled).toBeTruthy();
          resolve();
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });

  test("Start failure static async", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        callbackControllers: [TestControllerFailedStaticAsyncBoot],
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

  test("Start failure static blocking", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        callbackControllers: [TestControllerFailedStaticBlockingBoot],
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

  test("Start failure async", () => {
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

  test("Start failure blocking", () => {
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

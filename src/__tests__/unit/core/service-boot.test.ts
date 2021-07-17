import path from "path";
import {service} from "../../..";
import {MicroserviceConfig} from "../../../core/config";
import {MicroserviceTestApp} from "../../../util/test-app";

@service()
class TestServiceStaticBlockingBootFunction {
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

@service()
class TestServiceStaticAsyncBootFunction {
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

@service()
class TestServiceBlockingBootFunction {
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

@service()
class TestServiceAsyncBootFunction {
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

const SERVICE_BOOT_FAILURE_TEXT = "Controller booth failed";

@service()
class TestServiceFailedStaticAsyncBoot {
  static boot(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      reject(new Error(SERVICE_BOOT_FAILURE_TEXT));
    });
  }
}

@service()
class TestServiceFailedStaticBlockingBoot {
  static boot(): Promise<void> {
    throw new Error(SERVICE_BOOT_FAILURE_TEXT);
  }
}

@service()
class TestServiceFailedAsyncBoot {
  boot(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      reject(new Error(SERVICE_BOOT_FAILURE_TEXT));
    });
  }
}

@service()
class TestServiceFailedBlockingBoot {
  boot(): Promise<void> {
    throw new Error(SERVICE_BOOT_FAILURE_TEXT);
  }
}

describe("Test API Controller boot", () => {
  test("Start / Stop (static)", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        services: [
          TestServiceStaticBlockingBootFunction,
          TestServiceStaticAsyncBootFunction,
        ],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(TestServiceStaticBlockingBootFunction.bootCalled).toBeTruthy();
          expect(
            TestServiceStaticBlockingBootFunction.startCalled,
          ).toBeTruthy();
          expect(TestServiceStaticBlockingBootFunction.stopCalled).toBeFalsy();
          expect(TestServiceStaticAsyncBootFunction.bootCalled).toBeTruthy();
          expect(TestServiceStaticAsyncBootFunction.startCalled).toBeTruthy();
          expect(TestServiceStaticAsyncBootFunction.stopCalled).toBeFalsy();

          app.stop();

          expect(TestServiceStaticBlockingBootFunction.stopCalled).toBeTruthy();
          expect(TestServiceStaticAsyncBootFunction.stopCalled).toBeTruthy();
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
        services: [
          TestServiceBlockingBootFunction,
          TestServiceAsyncBootFunction,
        ],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          let instanceBlocking = app.getService(
            TestServiceBlockingBootFunction,
          ) as TestServiceBlockingBootFunction;
          expect(instanceBlocking.bootCalled).toBeTruthy();
          expect(instanceBlocking.startCalled).toBeTruthy();
          expect(instanceBlocking.stopCalled).toBeFalsy();
          const instanceAsync = app.getService(
            TestServiceAsyncBootFunction,
          ) as TestServiceAsyncBootFunction;
          expect(instanceAsync.bootCalled).toBeTruthy();
          expect(instanceAsync.startCalled).toBeTruthy();
          expect(instanceAsync.stopCalled).toBeFalsy();

          app.stop();

          expect(
            app.getService(TestServiceBlockingBootFunction),
          ).toBeUndefined();
          expect(instanceBlocking.stopCalled).toBeTruthy();
          expect(app.getService(TestServiceAsyncBootFunction)).toBeUndefined();
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
        services: [TestServiceFailedStaticAsyncBoot],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          reject();
        })
        .catch(error => {
          expect(error.message).toEqual(SERVICE_BOOT_FAILURE_TEXT);
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
        services: [TestServiceFailedStaticBlockingBoot],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          reject();
        })
        .catch(error => {
          expect(error.message).toEqual(SERVICE_BOOT_FAILURE_TEXT);
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
        services: [TestServiceFailedAsyncBoot],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          reject();
        })
        .catch(error => {
          expect(error.message).toEqual(SERVICE_BOOT_FAILURE_TEXT);
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
        services: [TestServiceFailedBlockingBoot],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          reject();
        })
        .catch(error => {
          expect(error.message).toEqual(SERVICE_BOOT_FAILURE_TEXT);
          resolve();
        })
        .finally(() => {
          app.stop();
        });
    });
  });
});

import path from "path";
import {MicroserviceTestApp, service} from "../../..";
import {MicroserviceConfig} from "../../../core/config";

@service()
class TestServiceNoBootFunction {
  static dummy() {
    return;
  }
}

@service()
class TestServiceBlockingBootFunction {
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

@service()
class TestServiceAsyncBootFunction {
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

const SERVICE_BOOT_FAILURE_TEXT = "Controller booth failed";

@service()
class TestServiceFailedAsyncBoot {
  static start(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      reject(new Error(SERVICE_BOOT_FAILURE_TEXT));
    });
  }
}

@service()
class TestServiceFailedBlockingBoot {
  static start(): Promise<void> {
    throw new Error(SERVICE_BOOT_FAILURE_TEXT);
  }
}

describe("Test Service boot", () => {
  test("Start / Stop services", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        services: [
          TestServiceNoBootFunction,
          TestServiceBlockingBootFunction,
          TestServiceAsyncBootFunction,
        ],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          //expect(server.listeningPort).not.toEqual(0);
          expect(TestServiceBlockingBootFunction.startCalled).toBeTruthy();
          expect(TestServiceBlockingBootFunction.stopCalled).toBeFalsy();
          expect(TestServiceAsyncBootFunction.startCalled).toBeTruthy();
          expect(TestServiceAsyncBootFunction.stopCalled).toBeFalsy();
          app.stop();
          expect(TestServiceBlockingBootFunction.startCalled).toBeTruthy();
          expect(TestServiceBlockingBootFunction.stopCalled).toBeTruthy();
          expect(TestServiceAsyncBootFunction.startCalled).toBeTruthy();
          expect(TestServiceAsyncBootFunction.stopCalled).toBeTruthy();
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Service boot failure async", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        services: [TestServiceFailedAsyncBoot],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
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

  test("Service boot failure blocking", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        services: [TestServiceFailedBlockingBoot],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
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

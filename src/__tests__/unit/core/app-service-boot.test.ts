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

@service()
class TestServiceAsyncBootFunction {
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

const SERVICE_BOOT_FAILURE_TEXT = "Controller booth failed";

@service()
class TestServiceFailedAsyncBoot {
  static boot(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      reject(new Error(SERVICE_BOOT_FAILURE_TEXT));
    });
  }
}

@service()
class TestServiceFailedBlockingBoot {
  static boot(): Promise<void> {
    throw new Error(SERVICE_BOOT_FAILURE_TEXT);
  }
}

describe("Test Service boot", () => {
  test("Boot / Shutdown services", () => {
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
        .start()
        .then(() => {
          //expect(server.listeningPort).not.toEqual(0);
          expect(TestServiceBlockingBootFunction.bootCalled).toBeTruthy();
          expect(TestServiceBlockingBootFunction.shutCalled).toBeFalsy();
          expect(TestServiceAsyncBootFunction.bootCalled).toBeTruthy();
          expect(TestServiceAsyncBootFunction.shutCalled).toBeFalsy();
          app.stop();
          expect(TestServiceBlockingBootFunction.bootCalled).toBeTruthy();
          expect(TestServiceBlockingBootFunction.shutCalled).toBeTruthy();
          expect(TestServiceAsyncBootFunction.bootCalled).toBeTruthy();
          expect(TestServiceAsyncBootFunction.shutCalled).toBeTruthy();
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
        .start()
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
        .start()
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

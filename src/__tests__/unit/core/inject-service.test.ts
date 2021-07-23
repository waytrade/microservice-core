import path from "path";
import {
  controller,
  inject,
  MicroserviceConfig,
  MicroserviceTestApp,
} from "../../..";
import {service} from "../../../decorators/service.decorator";

@service()
class InjectedTestService {
  foo(): number {
    return 1;
  }
}

@service()
class TestServiceStatic {
  @inject("MicroserviceTestApp")
  static app?: MicroserviceTestApp<MicroserviceConfig>;

  @inject("InjectedTestService")
  static service?: InjectedTestService;
}

@service()
class TestServiceInstance {
  @inject("MicroserviceTestApp")
  app?: MicroserviceTestApp<MicroserviceConfig>;

  @inject("InjectedTestService")
  service?: InjectedTestService;
}

@controller("Test Controller Static")
class TestControllerStatic {
  @inject("MicroserviceTestApp")
  static app?: MicroserviceTestApp<MicroserviceConfig>;

  @inject("InjectedTestService")
  static service?: InjectedTestService;
}

@controller("Test Controller Instance")
class TestControllerInstance {
  @inject("MicroserviceTestApp")
  app?: MicroserviceTestApp<MicroserviceConfig>;

  @inject("InjectedTestService")
  service?: InjectedTestService;
}

describe("Test service injection", () => {
  test("Controller static properties", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestControllerStatic],
        services: [InjectedTestService],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          expect(TestControllerStatic.app).toEqual(app);
          expect(TestControllerStatic.service).toEqual(
            app.getService(InjectedTestService),
          );
          resolve();
        })
        .catch(error => {
          reject(error);
        })
        .finally(() => {
          app.stop();
        });
    });
  });

  test("Controller instance properties", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestControllerInstance],
        services: [InjectedTestService],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          expect(
            (<TestControllerInstance>(
              app.getApiController(TestControllerInstance)
            )).app,
          ).toEqual(app);
          expect(
            (<TestControllerInstance>(
              app.getApiController(TestControllerInstance)
            )).service,
          ).toEqual(app.getService(InjectedTestService));
          resolve();
        })
        .catch(error => {
          reject(error);
        })
        .finally(() => {
          app.stop();
        });
    });
  });

  test("Service static properties", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        services: [InjectedTestService, TestServiceStatic],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          expect(TestServiceStatic.app).toEqual(app);
          expect(TestServiceStatic.service).toEqual(
            app.getService(InjectedTestService),
          );
          resolve();
        })
        .catch(error => {
          reject(error);
        })
        .finally(() => {
          app.stop();
        });
    });
  });

  test("Service instance properties", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        services: [InjectedTestService, TestServiceInstance],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          expect(
            (<TestServiceInstance>app.getService(TestServiceInstance)).app,
          ).toEqual(app);
          expect(
            (<TestServiceInstance>app.getService(TestServiceInstance)).service,
          ).toEqual(app.getService(InjectedTestService));
          resolve();
        })
        .catch(error => {
          reject(error);
        })
        .finally(() => {
          app.stop();
        });
    });
  });
});

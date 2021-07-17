import path from "path";
import {
  controller,
  inject,
  MicroserviceConfig,
  MicroserviceTestApp,
} from "../../..";
import {service} from "../../../decorators/service.decorator";

@controller("Injected Test Controller")
class InjectedTestController {
  foo(): number {
    return 1;
  }
}

@service()
class TestServiceStatic {
  @inject()
  static app?: MicroserviceTestApp<MicroserviceConfig>;

  @inject()
  static controller?: InjectedTestController;
}

@service()
class TestServiceInstance {
  @inject()
  app?: MicroserviceTestApp<MicroserviceConfig>;

  @inject()
  controller?: InjectedTestController;
}

@controller("Test Controller Static")
class TestControllerStatic {
  @inject()
  static app?: MicroserviceTestApp<MicroserviceConfig>;

  @inject()
  static controller?: InjectedTestController;
}

@controller("Test Controller Instance")
class TestControllerInstance {
  @inject()
  app?: MicroserviceTestApp<MicroserviceConfig>;

  @inject()
  controller?: InjectedTestController;
}

describe("Test service injection", () => {
  test("Controller static properties", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        callbackControllers: [InjectedTestController, TestControllerStatic],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          expect(TestControllerStatic.app).toEqual(app);
          expect(TestControllerStatic.controller).toEqual(
            app.getCallbackController(InjectedTestController),
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
        callbackControllers: [InjectedTestController, TestControllerInstance],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          expect(
            (<TestControllerInstance>(
              app.getCallbackController(TestControllerInstance)
            )).app,
          ).toEqual(app);
          expect(
            (<TestControllerInstance>(
              app.getCallbackController(TestControllerInstance)
            )).controller,
          ).toEqual(app.getCallbackController(InjectedTestController));
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
        callbackControllers: [InjectedTestController],
        services: [TestServiceStatic],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          expect(TestServiceStatic.app).toEqual(app);
          expect(TestServiceStatic.controller).toEqual(
            app.getCallbackController(InjectedTestController),
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
        callbackControllers: [InjectedTestController],
        services: [TestServiceInstance],
      });

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          expect(
            (<TestServiceInstance>app.getService(TestServiceInstance)).app,
          ).toEqual(app);
          expect(
            (<TestServiceInstance>app.getService(TestServiceInstance))
              .controller,
          ).toEqual(app.getCallbackController(InjectedTestController));
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

import path from "path";
import {Subject} from "rxjs";
import {
  controller,
  MicroserviceComponentFactory,
  MicroserviceConfig,
  MicroserviceTestApp,
  service,
} from "../../..";
import {MicroserviceComponentInstance} from "../../../core/app";

@controller("Test Controller")
class TestController {
  foo(): string {
    return "foo";
  }
}

@controller("Test Controller Mock")
class TestControllerMock {
  readonly fooCalled = new Subject<void>();
  foo(): string {
    return "foo";
  }
}

@service()
class TestService {
  foo(): string {
    return "foo";
  }
}

@service()
class TestServiceMock {
  readonly fooCalled = new Subject<void>();
  foo(): string {
    return "foo";
  }
}

class MockComponentFactory extends MicroserviceComponentFactory {
  override create(type: unknown): MicroserviceComponentInstance {
    switch (typeof type) {
      case typeof TestController:
        return {
          type,
          instance: new TestControllerMock(),
          running: false,
        };
      case typeof TestService:
        return {
          type,
          instance: new TestServiceMock(),
          running: false,
        };
    }
    return super.create(type);
  }
}

describe("Test Component Injection", () => {
  test("Inject via MockComponentFactory", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(
        rootFolder,
        {
          apiControllers: [TestController],
          callbackControllers: [TestController],
          services: [TestService],
        },
        new MockComponentFactory(),
      );

      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          expect(app.getApiController(TestController)).toBeDefined();
          expect(typeof app.getApiController(TestController)).toEqual(
            typeof new TestControllerMock(),
          );
          expect(app.getApiController(TestControllerMock)).toBeUndefined();
          expect(app.getApiControllerByName("TestController")).toBeDefined();
          expect(typeof app.getApiControllerByName("TestController")).toEqual(
            typeof new TestControllerMock(),
          );
          expect(
            app.getApiControllerByName("TestControllerMock"),
          ).toBeUndefined();

          expect(app.getCallbackController(TestController)).toBeDefined();
          expect(typeof app.getCallbackController(TestController)).toEqual(
            typeof new TestControllerMock(),
          );
          expect(app.getCallbackController(TestControllerMock)).toBeUndefined();
          expect(
            app.getCallbackControllerByName("TestController"),
          ).toBeDefined();
          expect(
            typeof app.getCallbackControllerByName("TestController"),
          ).toEqual(typeof new TestControllerMock());
          expect(
            app.getCallbackControllerByName("TestControllerMock"),
          ).toBeUndefined();

          expect(app.getService(TestService)).toBeDefined();
          expect(typeof app.getService(TestService)).toEqual(
            typeof new TestServiceMock(),
          );
          expect(app.getService(TestServiceMock)).toBeUndefined();
          expect(app.getServiceByName("TestService")).toBeDefined();
          expect(typeof app.getServiceByName("TestService")).toEqual(
            typeof new TestServiceMock(),
          );
          expect(app.getServiceByName("TestServiceMock")).toBeUndefined();

          app.stop();
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  });
});

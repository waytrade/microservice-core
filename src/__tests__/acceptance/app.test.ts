import axios from "axios";
import path from "path";
import {controller, get, HttpStatus, MicroserviceTestApp} from "../..";
import {MicroserviceConfig} from "../../core/config";
import {service} from "../../decorators/service.decorator";

/** Dummy application config*/
interface CustomAppConfig extends MicroserviceConfig {
  MY_CONFIG_SETTING: string;
}

/** TestController response model */
interface CustomAppResponse {
  val: number;
}

/** The app root folder. */
const ROOT_FOLDER = path.resolve(__dirname, "../../..");

/** TestController response object */
const TEST_RESPONSE: CustomAppResponse = {val: Math.random()};

/** A test controller that replies with TEST_RESPONSE on /api */
@controller("A Controller that responses a predefined object")
class CustomAppController {
  @get("/")
  static get(): unknown {
    return TEST_RESPONSE;
  }
}

/** A test service */
@service()
class CustomAppService {
  static foo(): unknown {
    return TEST_RESPONSE;
  }
}

/** An app with API and Callback controller */
class CustomApp extends MicroserviceTestApp<CustomAppConfig> {
  constructor() {
    super(ROOT_FOLDER, {
      apiControllers: [CustomAppController],
      callbackControllers: [CustomAppController],
      services: [CustomAppService],
    });
  }
}

class NoAppComponent {
  static foo(): unknown {
    return TEST_RESPONSE;
  }
}

/**
 * The test code.
 */
describe("Test Custom App", () => {
  test("Call REST API server", () => {
    return new Promise<void>((resolve, reject) => {
      const app = new CustomApp();
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          axios
            .get<CustomAppResponse>(
              `http://127.0.0.1:${app.apiServerPort}/api/`,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.data).toEqual(TEST_RESPONSE);
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

  test("Get SwaggerUI HTML", () => {
    return new Promise<void>((resolve, reject) => {
      const app = new CustomApp();
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          axios
            .get<CustomAppResponse>(`http://127.0.0.1:${app.apiServerPort}/`)
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.headers["content-type"]).toBe("text/html");
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

  test("Call Webhook Callback server", () => {
    return new Promise<void>((resolve, reject) => {
      const app = new CustomApp();
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          axios
            .get<CustomAppResponse>(
              `http://127.0.0.1:${app.callbackServerPort}/api/`,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.data).toEqual(TEST_RESPONSE);
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

  test("getApiControllerByName", () => {
    return new Promise<void>((resolve, reject) => {
      const app = new CustomApp();
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
        .then(() => {
          expect(
            app.getApiControllerByName("CustomAppController"),
          ).toBeDefined();
          expect(app.getApiControllerByName("NoAppController")).toBeUndefined();
          expect(
            app.getCallbackControllerByName("CustomAppController"),
          ).toBeDefined();
          expect(
            app.getCallbackControllerByName("NoAppController"),
          ).toBeUndefined();
          expect(app.getServiceByName("CustomAppService")).toBeDefined();
          expect(app.getServiceByName("NoAppService")).toBeUndefined();

          expect(app.getApiController(CustomAppController)).toBeDefined();
          expect(app.getApiController(NoAppComponent)).toBeUndefined();
          expect(app.getCallbackController(CustomAppController)).toBeDefined();
          expect(app.getCallbackController(NoAppComponent)).toBeUndefined();
          expect(app.getService(CustomAppService)).toBeDefined();
          expect(app.getService(NoAppComponent)).toBeUndefined();
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

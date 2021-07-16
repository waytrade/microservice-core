import axios from "axios";
import path from "path";
import {controller, get, HttpStatus, MicroserviceTestApp} from "../..";
import {MicroserviceConfig} from "../../core/config";

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

/** An app with API and Callback controller */
class CustomApp extends MicroserviceTestApp<CustomAppConfig> {
  constructor() {
    super(ROOT_FOLDER, {
      apiControllers: [CustomAppController],
      callbackControllers: [CustomAppController],
    });
  }
}

/** An app w/o controllers, won't start */
class NoControllersApp extends MicroserviceTestApp<CustomAppConfig> {
  constructor() {
    super(ROOT_FOLDER, {});
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

  describe("Call Webhook Callback server", () => {
    test("", () => {
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
  });

  test("Download openapi.json", () => {
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

  test("Export openapi.json (no controllers)", () => {
    return new Promise<void>((resolve, reject) => {
      const app = new NoControllersApp();
      app
        .exportOpenApi(ROOT_FOLDER + "test-report/tmp/openapi.json")
        .then(() => {
          reject();
        })
        .catch(() => {
          resolve();
        });
    });
  });
});

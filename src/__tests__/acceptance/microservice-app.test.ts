import axios from "axios";
import path from "path";
import {controller, get, HttpStatus} from "../..";
import {MicroserviceApp} from "../../core/app";
import {MicroserviceConfig} from "../../core/config";

/** Dummy application config*/
interface TestAppConfig extends MicroserviceConfig {
  MY_CONFIG_SETTING: string;
}

/** TestController response model */
interface TestAppResponse {
  val: number;
}

/** The app root folder. */
const ROOT_FOLDER = path.resolve(__dirname, "../../..");

/** TestController response object */
const TEST_RESPONSE: TestAppResponse = {val: Math.random()};

/** A test controller that replies with TEST_RESPONSE on /api */
@controller("A Controller that responses a predefined object")
class TestController {
  @get("/")
  static get(): unknown {
    return TEST_RESPONSE;
  }
}

/** The test app, has an API and Callback Controller */
class TestApp extends MicroserviceApp<TestAppConfig> {
  constructor() {
    super(ROOT_FOLDER, {
      apiControllers: [TestController],
      callbackControllers: [TestController],
    });
  }
}

/**
 * The test code.
 */
describe("Test Custom App", () => {
  test("Call REST API server", () => {
    return new Promise<void>((resolve, reject) => {
      const app = new TestApp();
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          axios
            .get<TestAppResponse>(`http://127.0.0.1:${app.apiServerPort}/api/`)
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
          fail(error);
        });
    });
  });

  describe("Call Webhook Callback server", () => {
    test("", () => {
      return new Promise<void>((resolve, reject) => {
        const app = new TestApp();
        app
          .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
          .then(() => {
            axios
              .get<TestAppResponse>(
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
            fail(error);
          });
      });
    });
  });

  test("Export openapi.json", () => {
    return new Promise<void>((resolve, reject) => {
      const app = new TestApp();
      app.exportOpenApi(ROOT_FOLDER + "test-report/tmp/openapi.json");
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          axios
            .get<TestAppResponse>(
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
          fail(error);
        });
    });
  });
});

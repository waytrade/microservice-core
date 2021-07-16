import axios from "axios";
import fs from "fs";
import path from "path";
import {controller, get, MicroserviceContext} from "../../..";
import {exportOpenApiJson} from "../../../core/openapi-exporter";

/** axios response error injection */
let injectAxiosResponseError: Error | undefined = undefined;
axios.interceptors.response.use(v => {
  if (injectAxiosResponseError) {
    throw injectAxiosResponseError;
  }
  return v;
});

/** The app root folder. */
const ROOT_FOLDER = path.resolve(__dirname, "../../..");

/** TestController response object */
const TEST_RESPONSE = {val: Math.random()};

/** A test controller that replies with TEST_RESPONSE on /api */
@controller("A Controller that responses a predefined object")
class TestController {
  @get("/")
  static get(): unknown {
    return TEST_RESPONSE;
  }
}

describe("OpenAPI export", () => {
  test("Export to openapi.json file", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");
      const context = new MicroserviceContext(rootFolder);

      const outputFolder = path.resolve(rootFolder, "./tmp");
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
      }

      context.boot().then(() => {
        exportOpenApiJson(outputFolder, context, [TestController])
          .then(() => {
            expect(fs.existsSync(outputFolder + "/openapi.json")).toBeTruthy();
            resolve();
          })
          .catch(error => {
            reject(error);
          })
          .finally(() => {
            fs.rmdirSync(outputFolder, {recursive: true});
          });
      });
    });
  });

  test("Export to openapi.json file (fail download)", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");
      const context = new MicroserviceContext(rootFolder);

      const outputFolder = path.resolve(rootFolder, "./tmp");
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
      }

      injectAxiosResponseError = new Error("Injected Error");
      context.boot().then(() => {
        exportOpenApiJson(outputFolder, context, [TestController])
          .then(() => {
            reject();
          })
          .catch(error => {
            expect(error.message).toEqual("Injected Error");
            resolve();
          })
          .finally(() => {
            injectAxiosResponseError = undefined;
          });
      });
    });
  });

  test("Export to openapi.json file (no controllers)", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");
      const context = new MicroserviceContext(rootFolder);
      context.boot().then(() => {
        exportOpenApiJson(ROOT_FOLDER + "/test-report/tmp", context, [])
          .then(() => {
            reject();
          })
          .catch(error => {
            expect(error.message).toEqual("No controllers registered");
            resolve();
          });
      });
    });
  });
});

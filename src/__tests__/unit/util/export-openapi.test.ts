import fs from "fs";
import path from "path";
import {controller, get, MicroserviceContext} from "../../..";
import {exportOpenApiJson} from "../../../util/openapi-exporter";

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
      const rootFolder = path.resolve(__dirname, "../../..");
      const context = new MicroserviceContext(rootFolder);

      context.boot().then(() => {
        exportOpenApiJson(ROOT_FOLDER + "/test-report/tmp", context, [
          TestController,
        ])
          .then(() => {
            expect(
              fs.existsSync(ROOT_FOLDER + "/test-report/tmp/openapi.json"),
            ).toBeTruthy();
            fs.rmdirSync(ROOT_FOLDER + "/test-report/tmp", {recursive: true});
            resolve();
          })
          .catch(error => {
            reject(error);
          });
      });
    });
  });
});

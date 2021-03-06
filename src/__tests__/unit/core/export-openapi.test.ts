import fs from "fs";
import path from "path";
import {
  controller,
  get,
  MicroserviceConfig,
  MicroserviceTestApp,
} from "../../..";

@controller("Test Controller")
class TestController {
  @get("/static")
  static get(): void {
    return;
  }

  @get("/instance")
  get(): void {
    return;
  }
}

describe("Test OpenAPI export", () => {
  test("Export openapi.json", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestController],
      });

      if (!fs.existsSync(rootFolder + "/tmp")) {
        fs.mkdirSync(rootFolder + "/tmp");
      }
      if (fs.existsSync(rootFolder + "/tmp/openapi.json")) {
        fs.rmSync(rootFolder + "/tmp/openapi.json");
      }

      app
        .exportOpenApi(rootFolder + "/tmp")
        .then(() => {
          expect(fs.existsSync(rootFolder + "/tmp/openapi.json")).toBeTruthy();
          fs.rmSync(rootFolder + "/tmp", {recursive: true});
          app.stop();
          resolve();
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });

  test("Export openapi.json (no controller)", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {});

      if (!fs.existsSync(rootFolder + "/tmp")) {
        fs.mkdirSync(rootFolder + "/tmp");
      }
      if (fs.existsSync(rootFolder + "/tmp/openapi.json")) {
        fs.rmSync(rootFolder + "/tmp/openapi.json");
      }

      app
        .exportOpenApi(rootFolder + "/tmp")
        .then(() => {
          expect(fs.existsSync(rootFolder + "/tmp/openapi.json")).toBeTruthy();
          fs.rmSync(rootFolder + "/tmp", {recursive: true});
          app.stop();
          resolve();
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });
});

import fs from "fs";
import {TestApp} from "../test-app";

/**
 * The REST server tests.
 */
describe("MicroserviceApp tests", () => {
  const TEST_SERVER_CALLBACK_PORT = 3999;

  let processArgs = Array.from(process.argv);

  beforeAll(() => {
    if (fs.existsSync("../../../test_logs")) {
      fs.rmdirSync("../../../test_logs");
    }
  });

  test("Log messages", () => {
    return new Promise<void>(async (resolve, reject) => {
      let app = new TestApp(TEST_SERVER_CALLBACK_PORT);
      app
        .start()
        .then(() => {
          app.error("Error message");
          app.warn("Warning message");
          app.info("Info message");
          app.debug("Debug message");
          resolve();
        })
        .catch(error => {
          reject(error);
        })
        .finally(() => {
          app?.shutdown();
        });
    });
  });

  test("Export OpenAPI", () => {
    return new Promise<void>(async (resolve, reject) => {
      process.argv.push("-write-openapi-no-exit");
      const app: TestApp = new TestApp(TEST_SERVER_CALLBACK_PORT);
      app
        .start()
        .then(() => {
          resolve();
        })
        .catch(error => {
          reject(error);
        })
        .finally(() => {
          app?.shutdown();
        });
    });
  });

  test("Log debug level to file", () => {
    return new Promise<void>(async (resolve, reject) => {
      process.argv = processArgs;
      const app: TestApp = new TestApp(TEST_SERVER_CALLBACK_PORT);
      app.config.LOG_FILE_PATH = "./test_logs";
      app.config.LOG_LEVEL = "debug";
      app
        .start()
        .then(() => {
          app.info("Info message");
          resolve();
        })
        .catch(error => {
          reject(error);
        })
        .finally(() => {
          app?.shutdown();
        });
    });
  });

  test("Log default level to stdout", () => {
    return new Promise<void>(async (resolve, reject) => {
      process.argv = processArgs;
      const app: TestApp = new TestApp(TEST_SERVER_CALLBACK_PORT);
      app.config.LOG_FILE_PATH = undefined;
      app.config.LOG_LEVEL = undefined;
      app
        .start()
        .then(() => {
          app.info("Info message");
          resolve();
        })
        .catch(error => {
          reject(error);
        })
        .finally(() => {
          app?.shutdown();
        });
    });
  });
});

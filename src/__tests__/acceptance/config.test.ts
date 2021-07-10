import {TestApp} from "../test-app";

/**
 * The REST server tests.
 */
describe("Configuration tests", () => {
  const TEST_SERVER_CALLBACK_PORT = 3999;

  /*
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = new TestApp(TEST_SERVER_CALLBACK_PORT);
    testApp.start();
  });

  afterAll(() => {
    testApp?.shutdown();
  });

  /*
  test("Failed boot (cannot open socket)", () => {
    return new Promise<void>(async (resolve, reject) => {
      const app: TestApp = new TestApp(TEST_SERVER_CALLBACK_PORT);
      app.TEST_failWithBootError = true;
      app
        .start()
        .then(() => {
          reject();
        })
        .catch(error => {
          resolve();
        })
        .finally(() => {
          app.shutdown();
        });
    });
  });*/

  test("Failed boot (invalid SERVER_PORT)", () => {
    return new Promise<void>(async (resolve, reject) => {
      const app: TestApp = new TestApp(TEST_SERVER_CALLBACK_PORT);
      app.config.SERVER_PORT = undefined;
      app
        .start()
        .then(() => {
          app.shutdown();
          reject();
        })
        .catch(error => {
          app.shutdown();
          resolve();
        });
    });
  });
});

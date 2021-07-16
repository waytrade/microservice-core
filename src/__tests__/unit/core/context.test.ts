import fs from "fs";
import path from "path";
import {MicroserviceContext} from "../../..";

const errorMessage = "Error message";
const warnMessage = "Warning message";
const infoMessage = "Info message";
const debugMessage = "Debug message";

describe("Test MicroserviceContext class", () => {
  test("Context boot", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");
      const context = new MicroserviceContext(rootFolder);

      try {
        // this must throw as context is not booted yet
        const mustThrow = context.config.LOG_LEVEL;
        reject(mustThrow);
      } catch (e) {}

      context
        .boot()
        .then(() => {
          expect(context.config.NAME).toEqual("@waytrade/microservice-core");
          expect(context.rootFolder).toBeDefined();
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Default configurations", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");
      const context = new MicroserviceContext(rootFolder);

      context
        .boot({
          LOG_LEVEL: undefined,
          LOG_TO_CONSOLE: undefined,
        })
        .then(() => {
          expect(context.config.LOG_LEVEL).toEqual("info");
          expect(context.config.LOG_TO_CONSOLE).toEqual(true);
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Invalid config file", () => {
    return new Promise<void>((resolve, reject) => {
      const tmpRootFolder = path.resolve(__dirname, "../../../../tmp-root");
      if (!fs.existsSync(tmpRootFolder)) {
        fs.mkdirSync(tmpRootFolder);
      }
      if (!fs.existsSync(tmpRootFolder + "/config")) {
        fs.mkdirSync(tmpRootFolder + "/config");
      }
      const testConfigFile = path.resolve(tmpRootFolder, "./config/test.json");
      fs.writeFileSync(testConfigFile, "this is no json");
      const context = new MicroserviceContext(tmpRootFolder);
      context
        .boot()
        .then(() => {
          reject();
        })
        .catch(() => {
          resolve();
        })
        .finally(() => {
          fs.rmSync(tmpRootFolder, {recursive: true});
        });
    });
  });

  test("No config file", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");
      const tmpFolder = path.resolve(rootFolder, "./tmp");
      if (!fs.existsSync(tmpFolder)) {
        fs.mkdirSync(tmpFolder);
      }
      fs.copyFileSync(
        rootFolder + "/package.json",
        tmpFolder + "/package.json",
      );

      const context = new MicroserviceContext(tmpFolder);
      context
        .boot()
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        })
        .finally(() => {
          fs.rmSync(tmpFolder, {recursive: true});
        });
    });
  });

  test("No environment", () => {
    return new Promise<void>((resolve, reject) => {
      const oldEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const rootFolder = path.resolve(__dirname, "../../../..");
      const context = new MicroserviceContext(rootFolder);
      context
        .boot()
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        })
        .finally(() => {
          process.env.NODE_ENV = oldEnv;
        });
    });
  });

  test("Log level debug", () => {
    return new Promise<void>((resolve, reject) => {
      const context = new MicroserviceContext(
        path.resolve(__dirname, "../../../.."),
      );

      let logMessagesReceived = 0;

      context.registerLogObserver({
        async onDebugLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(debugMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 4) {
            resolve();
          }
        },
        async onInfoLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(infoMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 4) {
            resolve();
          }
        },
        async onWarnLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(warnMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 4) {
            resolve();
          }
        },
        async onErrorLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(errorMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 4) {
            resolve();
          }
        },
      });

      context
        .boot({
          LOG_LEVEL: "debug",
        })
        .then(() => {
          context.debug(debugMessage);
          context.info(infoMessage);
          context.warn(warnMessage);
          context.error(errorMessage);
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Log level info", () => {
    return new Promise<void>((resolve, reject) => {
      const context = new MicroserviceContext(
        path.resolve(__dirname, "../../../.."),
      );

      let logMessagesReceived = 0;

      context.registerLogObserver({
        async onDebugLog(msg: string, ...args: unknown[]): Promise<void> {
          reject();
        },
        async onInfoLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(infoMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 3) {
            resolve();
          }
        },
        async onWarnLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(warnMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 3) {
            resolve();
          }
        },
        async onErrorLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(errorMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 3) {
            resolve();
          }
        },
      });

      context
        .boot({
          LOG_LEVEL: "info",
        })
        .then(() => {
          context.debug(debugMessage);
          context.info(infoMessage);
          context.warn(warnMessage);
          context.error(errorMessage);
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Log level warning", () => {
    return new Promise<void>((resolve, reject) => {
      const context = new MicroserviceContext(
        path.resolve(__dirname, "../../../.."),
      );

      let logMessagesReceived = 0;

      context.registerLogObserver({
        async onDebugLog(msg: string, ...args: unknown[]): Promise<void> {
          reject();
        },
        async onInfoLog(msg: string, ...args: unknown[]): Promise<void> {
          reject();
        },
        async onWarnLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(warnMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 2) {
            resolve();
          }
        },
        async onErrorLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(errorMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 2) {
            resolve();
          }
        },
      });

      context
        .boot({
          LOG_LEVEL: "warn",
        })
        .then(() => {
          context.debug(debugMessage);
          context.info(infoMessage);
          context.warn(warnMessage);
          context.error(errorMessage);
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Log level error", () => {
    return new Promise<void>((resolve, reject) => {
      const context = new MicroserviceContext(
        path.resolve(__dirname, "../../../.."),
      );

      const logObserver = {
        async onDebugLog(msg: string, ...args: unknown[]): Promise<void> {
          reject();
        },
        async onInfoLog(msg: string, ...args: unknown[]): Promise<void> {
          reject();
        },
        async onWarnLog(msg: string, ...args: unknown[]): Promise<void> {
          reject();
        },
        async onErrorLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(errorMessage);
          context.unregisterLogObserver(logObserver);
          resolve();
        },
      };

      context.registerLogObserver(logObserver);

      context
        .boot({
          LOG_LEVEL: "error",
        })
        .then(() => {
          context.debug(debugMessage);
          context.info(infoMessage);
          context.warn(warnMessage);
          context.error(errorMessage);
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Log level silent", () => {
    return new Promise<void>((resolve, reject) => {
      const context = new MicroserviceContext(
        path.resolve(__dirname, "../../../.."),
      );

      let receivedLog = false;

      const logObserver = {
        async onDebugLog(msg: string, ...args: unknown[]): Promise<void> {
          receivedLog = true;
        },
        async onInfoLog(msg: string, ...args: unknown[]): Promise<void> {
          receivedLog = true;
        },
        async onWarnLog(msg: string, ...args: unknown[]): Promise<void> {
          receivedLog = true;
        },
        async onErrorLog(msg: string, ...args: unknown[]): Promise<void> {
          receivedLog = true;
        },
      };

      context.registerLogObserver(logObserver);

      context
        .boot({
          LOG_FILE_FOLDER_PATH: undefined,
          LOG_TO_CONSOLE: false,
          LOG_LEVEL: "silent",
        })
        .then(() => {
          context.debug(debugMessage);
          context.info(infoMessage);
          context.warn(warnMessage);
          context.error(errorMessage);
          setTimeout(() => {
            expect(receivedLog).toBeFalsy();
            context.unregisterLogObserver(logObserver);
            resolve();
          });
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Log to stdout", () => {
    return new Promise<void>((resolve, reject) => {
      const context = new MicroserviceContext(
        path.resolve(__dirname, "../../../.."),
      );

      let logMessagesReceived = 0;

      context.registerLogObserver({
        async onDebugLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(debugMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 4) {
            resolve();
          }
        },
        async onInfoLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(infoMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 4) {
            resolve();
          }
        },
        async onWarnLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(warnMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 4) {
            resolve();
          }
        },
        async onErrorLog(msg: string, ...args: unknown[]): Promise<void> {
          expect(msg).toEqual(errorMessage);
          logMessagesReceived++;
          if (logMessagesReceived === 4) {
            resolve();
          }
        },
      });

      context
        .boot({
          LOG_LEVEL: "debug",
          LOG_TO_CONSOLE: true,
        })
        .then(() => {
          context.debug(debugMessage);
          context.info(infoMessage);
          context.warn(warnMessage);
          context.error(errorMessage);
        })
        .catch(error => {
          reject(error);
        });
    });
  });
});

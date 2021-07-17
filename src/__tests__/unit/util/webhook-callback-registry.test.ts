import axios from "axios";
import path from "path";
import {firstValueFrom, Subject} from "rxjs";
import {
  HttpStatus,
  MicroserviceConfig,
  MicroserviceRequest,
  MicroserviceTestApp,
  post,
  WebhookCallbackRegistry,
  WebhookSubscriptionRequest,
} from "../../..";
import {HttpError} from "../../../core/http-error";
import {model} from "../../../decorators/model.decorator";
import {webhookCallback} from "../../../decorators/operation.decorator";
import {property} from "../../../decorators/property.decorator";
import {requestBody} from "../../../decorators/request-body.decorator";

@model("Test Data Model")
class DataModel {
  @property("String prop")
  stringProp?: string;
}

class TestApiController {
  static readonly errorSignal = new Subject<string>();
  static readonly eventSignal = new Subject<DataModel>();

  static readonly registry = new WebhookCallbackRegistry((url, error) => {
    TestApiController.errorSignal.next(url);
  });

  @post("/subscribe")
  @requestBody(WebhookSubscriptionRequest)
  static subscribe(
    request: MicroserviceRequest,
    args: WebhookSubscriptionRequest,
  ): void {
    throw new HttpError(this.registry.add(request, args, this.eventSignal));
  }

  @post("/unsubscribe")
  @requestBody(WebhookSubscriptionRequest)
  static unsubscribe(
    request: MicroserviceRequest,
    args: WebhookSubscriptionRequest,
  ): void {
    throw new HttpError(this.registry.remove(request, args));
  }
}

class TestCallbackController {
  static readonly callbackSignal = new Subject<DataModel>();
  static callbackError: Error | undefined = undefined;

  @webhookCallback("/callback")
  @requestBody(WebhookSubscriptionRequest)
  static callback(request: MicroserviceRequest, args: DataModel): void {
    this.callbackSignal.next(args);
    if (this.callbackError) {
      throw this.callbackError;
    }
  }
}

describe("Test WebhookCallbackRegistry class", () => {
  test("Subscribe (bad request)", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestApiController],
        callbackControllers: [TestCallbackController],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.callbackServerPort).toBeDefined();

          const subscribeRequest = {};

          axios
            .post<void>(
              `http://127.0.0.1:${app.apiServerPort}/subscribe`,
              subscribeRequest,
            )
            .then(() => {
              app.stop();
              reject();
            })
            .catch(error => {
              expect(error.response.status).toBe(HttpStatus.BAD_REQUEST);
              app.stop();
              resolve();
            });
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });

  test("Re-Subscribe", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestApiController],
        callbackControllers: [TestCallbackController],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.callbackServerPort).toBeDefined();

          const subscribeRequest: WebhookSubscriptionRequest = {
            port: app.callbackServerPort ?? 0,
            callbackUrl: "/callback",
          };

          axios
            .post<void>(
              `http://127.0.0.1:${app.apiServerPort}/subscribe`,
              subscribeRequest,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.CREATED);

              axios
                .post<void>(
                  `http://127.0.0.1:${app.apiServerPort}/subscribe`,
                  subscribeRequest,
                )
                .then(res => {
                  expect(res.status).toBe(HttpStatus.NO_CONTENT);
                  app.stop();
                  resolve();
                })
                .catch(error => {
                  app.stop();
                  reject();
                });
            })
            .catch(error => {
              app.stop();
              reject(error);
            });
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });

  test("Clear registry", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestApiController],
        callbackControllers: [TestCallbackController],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.callbackServerPort).toBeDefined();

          const subscribeRequest: WebhookSubscriptionRequest = {
            port: app.callbackServerPort ?? 0,
            callbackUrl: "/callback",
          };

          axios
            .post<void>(
              `http://127.0.0.1:${app.apiServerPort}/subscribe`,
              subscribeRequest,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.CREATED);

              TestApiController.registry.clear();

              axios
                .post<void>(
                  `http://127.0.0.1:${app.apiServerPort}/subscribe`,
                  subscribeRequest,
                )
                .then(res => {
                  expect(res.status).toBe(HttpStatus.CREATED);
                  app.stop();
                  resolve();
                })
                .catch(error => {
                  app.stop();
                  reject();
                });
            })
            .catch(error => {
              app.stop();
              reject(error);
            });
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });

  test("Unsubscribe", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestApiController],
        callbackControllers: [TestCallbackController],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.callbackServerPort).toBeDefined();

          const subscribeRequest: WebhookSubscriptionRequest = {
            port: app.callbackServerPort ?? 0,
            callbackUrl: "/callback",
          };

          axios
            .post<void>(
              `http://127.0.0.1:${app.apiServerPort}/subscribe`,
              subscribeRequest,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.CREATED);

              axios
                .post<void>(
                  `http://127.0.0.1:${app.apiServerPort}/unsubscribe`,
                  subscribeRequest,
                )
                .then(res => {
                  expect(res.status).toBe(HttpStatus.OK);
                  app.stop();
                  resolve();
                })
                .catch(error => {
                  app.stop();
                  reject(error);
                });
            })
            .catch(error => {
              app.stop();
              reject(error);
            });
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });

  test("Unsubscribe (bad request)", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestApiController],
        callbackControllers: [TestCallbackController],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.callbackServerPort).toBeDefined();

          const subscribeRequest = {};

          axios
            .post<void>(
              `http://127.0.0.1:${app.apiServerPort}/unsubscribe`,
              subscribeRequest,
            )
            .then(res => {
              app.stop();
              reject();
            })
            .catch(error => {
              expect(error.response.status).toBe(HttpStatus.BAD_REQUEST);
              app.stop();
              resolve();
            });
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });

  test("Unsubscribe (not found)", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestApiController],
        callbackControllers: [TestCallbackController],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.callbackServerPort).toBeDefined();

          const subscribeRequest: WebhookSubscriptionRequest = {
            port: app.callbackServerPort ?? 0,
            callbackUrl: "/notRegistered",
          };

          axios
            .post<void>(
              `http://127.0.0.1:${app.apiServerPort}/unsubscribe`,
              subscribeRequest,
            )
            .then(res => {
              app.stop();
              reject();
            })
            .catch(error => {
              expect(error.response.status).toBe(HttpStatus.NOT_FOUND);
              app.stop();
              resolve();
            });
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });

  test("Callback event", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestApiController],
        callbackControllers: [TestCallbackController],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.callbackServerPort).toBeDefined();

          const subscribeRequest: WebhookSubscriptionRequest = {
            port: app.callbackServerPort ?? 0,
            callbackUrl: "/callback",
          };

          axios
            .post<void>(
              `http://127.0.0.1:${app.apiServerPort}/subscribe`,
              subscribeRequest,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.CREATED);

              const testPropValue = "Test String Value";

              TestApiController.eventSignal.next({
                stringProp: testPropValue,
              });

              firstValueFrom(TestCallbackController.callbackSignal).then(
                data => {
                  expect(data.stringProp).toEqual(testPropValue);
                  app.stop();
                  resolve();
                },
              );
            })
            .catch(error => {
              app.stop();
              reject(error);
            });
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });

  test("Callback event (custom host)", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestApiController],
        callbackControllers: [TestCallbackController],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.callbackServerPort).toBeDefined();

          const subscribeRequest: WebhookSubscriptionRequest = {
            host: "127.0.0.1",
            port: app.callbackServerPort ?? 0,
            callbackUrl: "/callback",
          };

          axios
            .post<void>(
              `http://127.0.0.1:${app.apiServerPort}/subscribe`,
              subscribeRequest,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.CREATED);

              const testPropValue = "Test String Value";

              TestApiController.eventSignal.next({
                stringProp: testPropValue,
              });

              firstValueFrom(TestCallbackController.callbackSignal).then(
                data => {
                  expect(data.stringProp).toEqual(testPropValue);
                  app.stop();
                  resolve();
                },
              );
            })
            .catch(error => {
              app.stop();
              reject(error);
            });
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });

  test("Callback error", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestApiController],
        callbackControllers: [TestCallbackController],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.callbackServerPort).toBeDefined();

          const subscribeRequest: WebhookSubscriptionRequest = {
            port: app.callbackServerPort ?? 0,
            callbackUrl: "/callback",
          };

          axios
            .post<void>(
              `http://127.0.0.1:${app.apiServerPort}/subscribe`,
              subscribeRequest,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.CREATED);

              TestCallbackController.callbackError = new HttpError(418);

              const testPropValue = "Test String Value";
              TestApiController.eventSignal.next({
                stringProp: testPropValue,
              });

              firstValueFrom(TestCallbackController.callbackSignal).then(
                data => {
                  expect(data.stringProp).toEqual(testPropValue);

                  axios
                    .post<void>(
                      `http://127.0.0.1:${app.apiServerPort}/subscribe`,
                      subscribeRequest,
                    )
                    .then(res => {
                      expect(res.status).toBe(HttpStatus.CREATED);
                      app.stop();
                      resolve();
                    })
                    .catch(error => {
                      app.stop();
                      reject(error);
                    });
                },
              );
            })
            .catch(error => {
              app.stop();
              reject(error);
            });
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });

  test("Error event", () => {
    return new Promise<void>((resolve, reject) => {
      const rootFolder = path.resolve(__dirname, "../../../..");

      const app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
        apiControllers: [TestApiController],
        callbackControllers: [TestCallbackController],
      });
      app
        .start({SERVER_PORT: undefined, CALLBACK_PORT: undefined}) // use random ports
        .then(() => {
          expect(app.callbackServerPort).toBeDefined();

          const subscribeRequest: WebhookSubscriptionRequest = {
            port: app.callbackServerPort ?? 0,
            callbackUrl: "/callback",
          };

          axios
            .post<void>(
              `http://127.0.0.1:${app.apiServerPort}/subscribe`,
              subscribeRequest,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.CREATED);

              TestApiController.eventSignal.error("this is an error");

              axios
                .post<void>(
                  `http://127.0.0.1:${app.apiServerPort}/subscribe`,
                  subscribeRequest,
                )
                .then(res => {
                  expect(res.status).toBe(HttpStatus.CREATED);
                  app.stop();
                  resolve();
                })
                .catch(error => {
                  app.stop();
                  reject();
                });
            })
            .catch(error => {
              app.stop();
              reject(error);
            });
        })
        .catch(error => {
          app.stop();
          reject(error);
        });
    });
  });
});

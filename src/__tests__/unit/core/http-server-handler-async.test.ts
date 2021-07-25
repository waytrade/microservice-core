import axios from "axios";
import path from "path";
import {firstValueFrom, Subject} from "rxjs";
import {
  controller,
  del,
  get,
  HttpError,
  HttpStatus,
  MicroserviceContext,
  MicroserviceRequest,
  patch,
  post,
  put,
} from "../../..";
import {MicroserviceComponentInstance} from "../../../core/app";
import {MicroserviceHttpServer} from "../../../core/http-server";

const TEST_CONTROLLER_PATH = "/api/test";
const ERROR_MESSAGE = "The error message";
@controller("Controller with async request handlers", TEST_CONTROLLER_PATH)
class TestController {
  static readonly getRequests = new Subject<[MicroserviceRequest, unknown]>();
  static getResult: unknown;

  @get("/{pathArgument}")
  static async onGET(
    request: MicroserviceRequest,
    args: unknown,
  ): Promise<unknown> {
    this.getRequests.next([request, args]);
    return this.getResult;
  }

  @get("/error")
  static async onGET_error(
    request: MicroserviceRequest,
    args: unknown,
  ): Promise<unknown> {
    throw new HttpError(418);
  }

  @get("/serverError")
  static async onGET_serverError(
    request: MicroserviceRequest,
    args: unknown,
  ): Promise<unknown> {
    throw new Error("No HTTP Error");
  }

  static readonly putRequests = new Subject<[MicroserviceRequest, unknown]>();
  static putResult: unknown;

  @put("/{pathArgument}")
  static async onPUT(
    request: MicroserviceRequest,
    args: unknown,
  ): Promise<unknown> {
    this.putRequests.next([request, args]);
    return this.putResult;
  }

  @put("/error")
  static async onPUT_error(
    request: MicroserviceRequest,
    args: unknown,
  ): Promise<unknown> {
    throw new HttpError(418, ERROR_MESSAGE);
  }

  static readonly postRequests = new Subject<[MicroserviceRequest, unknown]>();
  static postResult: unknown;

  @post("/{pathArgument}")
  static async onPOST(
    request: MicroserviceRequest,
    args: unknown,
  ): Promise<unknown> {
    this.postRequests.next([request, args]);
    return this.postResult;
  }

  @post("/error")
  static async onPOST_error(
    request: MicroserviceRequest,
    args: unknown,
  ): Promise<unknown> {
    throw new HttpError(418, ERROR_MESSAGE);
  }

  static readonly patchRequests = new Subject<[MicroserviceRequest, unknown]>();
  static patchResult: unknown;

  @patch("/{pathArgument}")
  static async onPATCH(
    request: MicroserviceRequest,
    args: unknown,
  ): Promise<unknown> {
    this.patchRequests.next([request, args]);
    return this.patchResult;
  }

  @patch("/error")
  static async onPATCH_error(
    request: MicroserviceRequest,
    args: unknown,
  ): Promise<unknown> {
    throw new HttpError(418, ERROR_MESSAGE);
  }

  static readonly deleteRequests = new Subject<
    [MicroserviceRequest, unknown]
  >();
  static deleteResult: unknown;

  @del("/{pathArgument}")
  static async onDELETE(
    request: MicroserviceRequest,
    args: unknown,
  ): Promise<unknown> {
    this.deleteRequests.next([request, args]);
    return this.deleteResult;
  }

  @del("/error")
  static async onDELETE_error(
    request: MicroserviceRequest,
    args: unknown,
  ): Promise<unknown> {
    throw new HttpError(418, ERROR_MESSAGE);
  }
}

describe("Test MicroserviceHttpServer async handlers", () => {
  const context = new MicroserviceContext(
    path.resolve(__dirname, "../../../.."),
  );

  beforeAll(async () => {
    await context.boot();
  });

  test("Handle GET request", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          let serverHandlerCalled = false;
          firstValueFrom(TestController.getRequests).then(v => {
            serverHandlerCalled = true;
          });

          TestController.getResult = {val: Math.random()};

          axios
            .get<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/`,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.data).toEqual(TestController.getResult);
              expect(serverHandlerCalled).toBeTruthy();
              resolve();
            })
            .catch(error => {
              reject(error);
            })
            .finally(() => {
              server.stop();
            });
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Fail GET request (HTTP error)", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      server
        .start()
        .then(() => {
          axios
            .get<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/error`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toEqual(418);
              resolve();
            })
            .finally(() => {
              server.stop();
            });
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Fail GET request (server error)", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      server
        .start()
        .then(() => {
          axios
            .get<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/serverError`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toEqual(500);
              resolve();
            })
            .finally(() => {
              server.stop();
            });
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Handle PUT request", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const requestData = {val: Math.random()};

          let serverHandlerCalled = false;
          firstValueFrom(TestController.putRequests).then(v => {
            expect(v[1]).toEqual(requestData);
            serverHandlerCalled = true;
          });

          TestController.putResult = {val: Math.random()};

          axios
            .put<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/`,
              requestData,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.data).toEqual(TestController.putResult);
              expect(serverHandlerCalled).toBeTruthy();
              resolve();
            })
            .catch(error => {
              reject(error);
            })
            .finally(() => {
              server.stop();
            });
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Fail PUT request", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      server
        .start()
        .then(() => {
          axios
            .put<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/error`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toEqual(418);
              resolve();
            })
            .finally(() => {
              server.stop();
            });
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Handle POST request", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const requestData = {val: Math.random()};

          let serverHandlerCalled = false;
          firstValueFrom(TestController.postRequests).then(v => {
            expect(v[1]).toEqual(requestData);
            serverHandlerCalled = true;
          });

          TestController.postResult = {val: Math.random()};

          axios
            .post<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/`,
              requestData,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.data).toEqual(TestController.postResult);
              expect(serverHandlerCalled).toBeTruthy();
              resolve();
            })
            .catch(error => {
              reject(error);
            })
            .finally(() => {
              server.stop();
            });
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Fail POST request", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      server
        .start()
        .then(() => {
          axios
            .post<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/error`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toEqual(418);
              resolve();
            })
            .finally(() => {
              server.stop();
            });
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Handle PATCH request", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const requestData = {val: Math.random()};

          let serverHandlerCalled = false;
          firstValueFrom(TestController.patchRequests).then(v => {
            expect(v[1]).toEqual(requestData);
            serverHandlerCalled = true;
          });

          TestController.patchResult = {val: Math.random()};

          axios
            .patch<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/`,
              requestData,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.data).toEqual(TestController.patchResult);
              expect(serverHandlerCalled).toBeTruthy();
              resolve();
            })
            .catch(error => {
              reject(error);
            })
            .finally(() => {
              server.stop();
            });
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Fail PATCH request", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      server
        .start()
        .then(() => {
          axios
            .patch<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/error`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toEqual(418);
              resolve();
            })
            .finally(() => {
              server.stop();
            });
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Handle DELETE request", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          let serverHandlerCalled = false;
          firstValueFrom(TestController.deleteRequests).then(v => {
            serverHandlerCalled = true;
          });

          TestController.deleteResult = {val: Math.random()};

          axios
            .delete<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/`,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.data).toEqual(TestController.deleteResult);
              expect(serverHandlerCalled).toBeTruthy();
              resolve();
            })
            .catch(error => {
              reject(error);
            })
            .finally(() => {
              server.stop();
            });
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Fail DELETE request", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      server
        .start()
        .then(() => {
          axios
            .delete<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/error`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toEqual(418);
              resolve();
            })
            .finally(() => {
              server.stop();
            });
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });
});

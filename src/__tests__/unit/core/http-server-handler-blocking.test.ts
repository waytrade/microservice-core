import axios from "axios";
import path from "path";
import {firstValueFrom, Subject} from "rxjs";
import {
  controller,
  del,
  get,
  HttpStatus,
  MicroserviceContext,
  MicroserviceRequest,
  patch,
  post,
  put,
} from "../../..";
import {MicroserviceComponentInstance} from "../../../core/app";
import {HttpError} from "../../../core/http-error";
import {MicroserviceHttpServer} from "../../../core/http-server";

const TEST_CONTROLLER_PATH = "/api/test";
@controller("Controller with blocking request handlers", TEST_CONTROLLER_PATH)
class TestController {
  static readonly getRequests = new Subject<[MicroserviceRequest, unknown]>();
  static getResult: unknown;

  @get("/{pathArgument}")
  static onGET(request: MicroserviceRequest, args: unknown): unknown {
    this.getRequests.next([request, args]);
    return this.getResult;
  }

  @get("/notImplemented")
  static onGET_fail(): unknown {
    throw new HttpError(HttpStatus.NOT_IMPLEMENTED);
  }

  static readonly putRequests = new Subject<[MicroserviceRequest, unknown]>();
  static putResult: unknown;

  @put("/{pathArgument}")
  static onPUT(request: MicroserviceRequest, args: unknown): unknown {
    this.putRequests.next([request, args]);
    return this.putResult;
  }

  @put("/notImplemented")
  static onPUT_fail(): unknown {
    throw new HttpError(HttpStatus.NOT_IMPLEMENTED);
  }

  static readonly postRequests = new Subject<[MicroserviceRequest, unknown]>();
  static postResult: unknown;

  @post("/{pathArgument}")
  static onPOST(request: MicroserviceRequest, args: unknown): unknown {
    this.postRequests.next([request, args]);
    return this.postResult;
  }

  @post("/notImplemented")
  static onPOST_fail(): unknown {
    throw new HttpError(HttpStatus.NOT_IMPLEMENTED);
  }

  static readonly patchRequests = new Subject<[MicroserviceRequest, unknown]>();
  static patchResult: unknown;

  @patch("/{pathArgument}")
  static onPATCH(request: MicroserviceRequest, args: unknown): unknown {
    this.patchRequests.next([request, args]);
    return this.patchResult;
  }

  @post("/notImplemented")
  static onPATCH_fail(): unknown {
    throw new HttpError(HttpStatus.NOT_IMPLEMENTED);
  }

  static readonly deleteRequests = new Subject<
    [MicroserviceRequest, unknown]
  >();
  static deleteResult: unknown;

  @del("/{pathArgument}")
  static onDELETE(request: MicroserviceRequest, args: unknown): unknown {
    this.deleteRequests.next([request, args]);
    return this.deleteResult;
  }

  @del("/notImplemented")
  static onDELETE_fail(): unknown {
    throw new HttpError(HttpStatus.NOT_IMPLEMENTED);
  }
}

describe("Test MicroserviceHttpServer blocking handlers", () => {
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

  test("Fail GET request", () => {
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

          axios
            .get<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/notImplemented`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toBe(HttpStatus.NOT_IMPLEMENTED);
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
          expect(server.listeningPort).not.toEqual(0);

          axios
            .put<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/notImplemented`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toBe(HttpStatus.NOT_IMPLEMENTED);
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
          expect(server.listeningPort).not.toEqual(0);

          axios
            .post<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/notImplemented`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toBe(HttpStatus.NOT_IMPLEMENTED);
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
          expect(server.listeningPort).not.toEqual(0);

          axios
            .post<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/notImplemented`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toBe(HttpStatus.NOT_IMPLEMENTED);
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
          expect(server.listeningPort).not.toEqual(0);

          axios
            .post<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/notImplemented`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toBe(HttpStatus.NOT_IMPLEMENTED);
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

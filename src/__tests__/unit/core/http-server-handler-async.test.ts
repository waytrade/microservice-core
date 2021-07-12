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
import {MicroserviceHttpServer} from "../../../core/http-server";

const TEST_CONTROLLER_PATH = "/api/test";
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
      const server = new MicroserviceHttpServer(context, [TestController]);
      server
        .start(0)
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

  test("Handle PUT request", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, [TestController]);
      server
        .start(0)
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

  test("Handle POST request", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, [TestController]);
      server
        .start(0)
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

  test("Handle PATCH request", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, [TestController]);
      server
        .start(0)
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

  test("Handle DELETE request", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, [TestController]);
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
});

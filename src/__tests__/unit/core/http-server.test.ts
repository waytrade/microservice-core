import axios from "axios";
import path from "path";
import {
  controller,
  del,
  get,
  HttpStatus,
  MicroserviceContext,
  patch,
  post,
  put,
} from "../../../";
import {MicroserviceHttpServer} from "../../../core/http-server";
import {MicroserviceRequest} from "../../../models/microservice-request";

const TEST_CONTROLLER_PATH = "/api/dummy";

const CUSTOMER_RESPONSE_HEADER_KEY = "x-custom-response-header";
const CUSTOMER_RESPONSE_HEADER_VALUE = "custom response header value";

@controller("Controller with an empty request handler", TEST_CONTROLLER_PATH)
class DummyController {
  @get("/}")
  static onGET(): void {
    return;
  }
  @get("/customResponseHeader")
  static onGET_customResponseHeader(req: MicroserviceRequest): void {
    req.writeResponseHeader(
      CUSTOMER_RESPONSE_HEADER_KEY,
      CUSTOMER_RESPONSE_HEADER_VALUE,
    );
  }

  @put("/")
  static onPUT(): void {
    return;
  }
  @post("/")
  static onPOST(): void {
    return;
  }
  @patch("/")
  static onPATCH(): void {
    return;
  }
  @del("/")
  static onDELETE(): void {
    return;
  }
}

describe("Test MicroserviceHttpServer class", () => {
  const context = new MicroserviceContext(
    path.resolve(__dirname, "../../../.."),
  );

  beforeAll(async () => {
    await context.boot();
  });

  test("Start at random port", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, []);
      server
        .start(0)
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);
          expect(server.listeningPort).not.toEqual(0);
          resolve();
        })
        .catch(error => {
          reject(error);
        })
        .finally(() => {
          server.stop();
        });
    });
  });

  test("Start at fixed port", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, []);
      server
        .start(context.config.SERVER_PORT)
        .then(() => {
          expect(server.listeningPort).toEqual(context.config.SERVER_PORT);
          resolve();
        })
        .catch(error => {
          reject(error);
        })
        .finally(() => {
          server.stop();
        });
    });
  });

  test("Test 404 not found", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, [DummyController]);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          axios
            .get<void>(
              `http://127.0.0.1:${server.listeningPort}/some/invlide/path`,
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toBe(HttpStatus.NOT_FOUND);
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

  test("Test 400 bad request", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, [DummyController]);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          axios
            .put<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/`,
              "this is no JSON",
            )
            .then(() => {
              reject();
            })
            .catch(error => {
              expect(error.response.status).toBe(HttpStatus.BAD_REQUEST);
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

  test("Test OPTIONS request", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, [DummyController]);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          axios
            .options(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/`,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.NO_CONTENT);
              expect(res.headers["access-control-allow-methods"]).toEqual(
                "GET, PUT, PATCH, POST, DELETE",
              );
              expect(res.headers["access-control-allow-origin"]).toEqual("*");
              resolve();
            })
            .catch(error => {
              reject();
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

  test("Custom response header", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, [DummyController]);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          axios
            .get(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/customResponseHeader`,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.headers[CUSTOMER_RESPONSE_HEADER_KEY]).toEqual(
                CUSTOMER_RESPONSE_HEADER_VALUE,
              );
              resolve();
            })
            .catch(error => {
              reject();
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

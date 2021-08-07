import axios from "axios";
import path from "path";
import {controller, get, HttpStatus, MicroserviceContext} from "../../..";
import {MicroserviceComponentInstance} from "../../../core/app";
import {MicroserviceHttpServer} from "../../../core/http-server";

const TEST_CONTROLLER_PATH = "/api/dummy";

@controller("Controller with an empty request handler", TEST_CONTROLLER_PATH)
class DummyController {
  @get("/")
  static onGET(): void {
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
      const component: MicroserviceComponentInstance[] = [
        {
          type: DummyController,
          instance: new DummyController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, component);
      expect(server.listeningPort).toBeUndefined();
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          axios
            .get<void>(
              `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/`,
              {
                headers: {
                  "access-control-method": "GET",
                  "access-control-request-headers": "testHeader",
                  origin: `http://127.0.0.1:${server.listeningPort}`,
                },
              },
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.headers["access-control-allow-methods"]).toEqual(
                "GET",
              );
              expect(res.headers["access-control-allow-headers"]).toEqual(
                "testHeader",
              );
              expect(res.headers["access-control-allow-origin"]).toEqual(
                `http://127.0.0.1:${server.listeningPort}`,
              );
              expect(res.headers["access-control-allow-credentials"]).toEqual(
                "true",
              );
              expect(res.headers["access-control-expose-headers"]).toEqual(
                "authorization",
              );
              expect(res.headers["access-control-max-age"]).toEqual("86400");

              resolve();
              server.stop();
            })
            .catch(error => {
              server.stop();
              reject(error);
            });
        })
        .catch(error => {
          server.stop();
          reject(error);
        });
    });
  });
});

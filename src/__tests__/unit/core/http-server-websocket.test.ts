import path from "path";
import WebSocket from "ws";
import {
  controller,
  MicroserviceContext,
  MicroserviceStream,
  websocket,
} from "../../..";
import {MicroserviceHttpServer} from "../../../core/http-server";

const TEST_CONTROLLER_PATH = "/api";
@controller(
  "Controller to echo websocket messages back to sender",
  undefined /* '/api' */,
)
class WebsocketEchoController {
  @websocket("/echo")
  static streaming(stream: MicroserviceStream): void {
    stream.onReceived = (message): void => {
      stream.send(message);
    };
  }
  @websocket("/echo/{dummyPathArguments}")
  static streaming2(stream: MicroserviceStream): void {
    stream.onReceived = (message): void => {
      stream.send(message);
    };
  }
  @websocket("/close")
  static close(stream: MicroserviceStream): void {
    stream.onReceived = (message): void => {
      stream.close();
    };
  }
}

describe("Test MicroserviceHttpServer websocket streaming", () => {
  const context = new MicroserviceContext(
    path.resolve(__dirname, "../../../.."),
  );

  beforeAll(async () => {
    await context.boot();
  });

  test("Echo message", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, [
        WebsocketEchoController,
      ]);

      const testData = {val: Math.random()};

      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const ws = new WebSocket(
            `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/echo/dummy`,
          );

          ws.onopen = (): void => {
            ws.send(JSON.stringify(testData));
          };
          ws.onmessage = (event: any): void => {
            expect(JSON.parse(event.data)).toEqual(testData);
            resolve();
            ws.close();
            server.stop();
          };
          ws.onerror = (event: any): void => {
            reject(event);
            server.stop();
          };
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Send binary data (must fail)", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, [
        WebsocketEchoController,
      ]);

      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const ws = new WebSocket(
            `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/echo/`,
          );

          ws.onopen = (): void => {
            // binary data is not supported, must close immediately.
            ws.send(new ArrayBuffer(32));
          };
          ws.onclose = (): void => {
            resolve();
            server.stop();
          };
          ws.onmessage = (event: any): void => {
            reject();
            server.stop();
          };
          ws.onerror = (event: any): void => {
            reject(event);
            server.stop();
          };
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });

  test("Fore close", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, [
        WebsocketEchoController,
      ]);

      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const ws = new WebSocket(
            `http://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/close`,
          );

          ws.onopen = (): void => {
            ws.send("test");
          };
          ws.onclose = (): void => {
            resolve();
            server.stop();
          };
          ws.onmessage = (event: any): void => {
            reject();
            server.stop();
          };
          ws.onerror = (event: any): void => {
            reject(event);
            server.stop();
          };
        })
        .catch(error => {
          reject(error);
          server.stop();
        });
    });
  });
});

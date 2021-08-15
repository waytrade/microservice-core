import path from "path";
import {firstValueFrom, Subject} from "rxjs";
import WebSocket from "ws";
import {
  controller,
  MicroserviceContext,
  MicroserviceStream,
  WebhookSubscriptionRequest,
  websocket,
  WebSocketAutoConnection,
} from "../../..";
import {MicroserviceComponentInstance} from "../../../core/app";
import {MicroserviceHttpServer} from "../../../core/http-server";
import {requestBody} from "../../../decorators/request-body.decorator";

const TEST_CONTROLLER_PATH = "/api";
@controller(
  "Controller to echo websocket messages back to sender",
  undefined /* '/api' */,
)
class WebsocketTestController {
  @websocket("/echo")
  @requestBody(WebhookSubscriptionRequest)
  streaming(stream: MicroserviceStream): void {
    stream.onReceived = (message): void => {
      stream.send(message);
    };
  }

  @websocket("/echo/{dummyPathArguments}")
  static streaming(stream: MicroserviceStream): void {
    stream.onReceived = (message): void => {
      stream.send(message);
    };
  }

  static closed = false;
  @websocket("/close")
  close(stream: MicroserviceStream): void {
    stream.closed.then(() => {
      WebsocketTestController.closed = true;
      stream.send("alreadyClosed");
    });
    setTimeout(() => {
      stream.close();
    }, 1000);
  }

  @websocket("/reject")
  static reject(stream: MicroserviceStream): void {
    stream.close(4000, "rejected connection");
  }

  @websocket("/empty")
  static empty(stream: MicroserviceStream): void {}
}

const ENDLESS_STREAM_CONTROLLER_PATH = "/test-api";
@controller(
  "Controller to send back and endless stream",
  ENDLESS_STREAM_CONTROLLER_PATH,
)
class WebsocketEndlessStreamController {
  static closed = new Subject<void>();

  @websocket("/endless")
  @requestBody(WebhookSubscriptionRequest)
  static endless(stream: MicroserviceStream): void {
    const data = "this is a message";
    while (true) {
      if (!stream.send(data)) {
        this.closed.next();
        break;
      }
    }
  }
}

describe("Test MicroserviceHttpServer websocket streaming", () => {
  const context = new MicroserviceContext(
    path.resolve(__dirname, "../../../.."),
  );

  beforeAll(async () => {
    await context.boot();
  });

  test("Ping / Pong", () => {
    return new Promise<void>((resolve, reject) => {
      const components: MicroserviceComponentInstance[] = [
        {
          type: WebsocketTestController,
          instance: new WebsocketTestController(),
          running: true,
        },
      ];

      const server = new MicroserviceHttpServer(context, components);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const ws = new WebSocket(
            `ws://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/echo/dummy`,
          );

          ws.onopen = (): void => {
            ws.send("ping");
          };

          ws.onmessage = message => {
            if (message.data === "pong") {
              ws.close();
              server.stop();
              resolve();
            }
          };
        })
        .catch(error => {
          server.stop();
          reject(error);
        });
    });
  });

  test("Echo message", () => {
    return new Promise<void>((resolve, reject) => {
      const testData = {val: Math.random()};
      const components: MicroserviceComponentInstance[] = [
        {
          type: WebsocketTestController,
          instance: new WebsocketTestController(),
          running: true,
        },
      ];

      const server = new MicroserviceHttpServer(context, components);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const wsc = new WebSocketAutoConnection(
            `ws://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/echo/dummy`,
          );

          wsc.onError.subscribe({
            next: error => {
              server.stop();
              reject(error);
            },
          });

          wsc.onConnected.subscribe({
            next: () => {
              wsc.send(JSON.stringify(testData));
            },
          });

          wsc.onMessage.subscribe({
            next: msg => {
              expect(JSON.parse(msg)).toEqual(testData);
              wsc.close();
              server.stop();
              resolve();
            },
          });

          wsc.connect();
        })
        .catch(error => {
          server.stop();
          reject(error);
        });
    });
  });

  test("Send binary data (must be ignored)", () => {
    return new Promise<void>((resolve, reject) => {
      const components: MicroserviceComponentInstance[] = [
        {
          type: WebsocketTestController,
          instance: new WebsocketTestController(),
          running: true,
        },
      ];

      const server = new MicroserviceHttpServer(context, components);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const wsc = new WebSocketAutoConnection(
            `ws://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/echo/`,
          );

          wsc.onError.subscribe({
            next: error => {
              server.stop();
              reject(error);
            },
          });

          wsc.onConnected.subscribe({
            next: () => {
              wsc.send(new ArrayBuffer(32));
            },
          });

          const cancel = new Subject<void>();
          wsc.onMessage.subscribe({
            next: () => {
              cancel.next();
              wsc.close();
              server.stop();
              reject();
            },
          });

          wsc.connect();

          setTimeout(() => {
            wsc.close();
            server.stop();
            resolve();
          }, 1000);
        })
        .catch(error => {
          server.stop();
          reject(error);
        });
    });
  });

  test("Rejected connection", () => {
    return new Promise<void>((resolve, reject) => {
      const components: MicroserviceComponentInstance[] = [
        {
          type: WebsocketTestController,
          instance: new WebsocketTestController(),
          running: true,
        },
      ];

      const server = new MicroserviceHttpServer(context, components);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const ws = new WebSocket(
            `ws://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/reject`,
          );

          ws.onclose = (e): void => {
            expect(e.code).toEqual(4000);
            expect(e.reason).toEqual("rejected connection");
            server.stop();
            resolve();
          };
          ws.onmessage = (event: any): void => {
            server.stop();
            reject(event);
          };
          ws.onerror = (event: any): void => {
            server.stop();
            reject(event);
          };
        })
        .catch(error => {
          server.stop();
          reject(error);
        });
    });
  });

  test("Graceful close", () => {
    return new Promise<void>((resolve, reject) => {
      const components: MicroserviceComponentInstance[] = [
        {
          type: WebsocketTestController,
          instance: new WebsocketTestController(),
          running: true,
        },
      ];

      const server = new MicroserviceHttpServer(context, components);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const ws = new WebSocket(
            `ws://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/close`,
          );

          ws.onclose = (): void => {
            expect(WebsocketTestController.closed).toBeTruthy();

            server.stop();
            resolve();
          };
          ws.onmessage = (event: any): void => {
            server.stop();
            reject();
          };
          ws.onerror = (event: any): void => {
            server.stop();
            reject(event);
          };
        })
        .catch(error => {
          server.stop();
          reject(error);
        });
    });
  });

  test("Close on backpressure", () => {
    return new Promise<void>((resolve, reject) => {
      const components: MicroserviceComponentInstance[] = [
        {
          type: WebsocketEndlessStreamController,
          instance: new WebsocketEndlessStreamController(),
          running: true,
        },
      ];

      const server = new MicroserviceHttpServer(context, components);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const ws = new WebSocket(
            `ws://127.0.0.1:${server.listeningPort}${ENDLESS_STREAM_CONTROLLER_PATH}/endless`,
          );

          firstValueFrom(WebsocketEndlessStreamController.closed).then(() => {
            server.stop();
            resolve();
          });

          ws.onopen = (): void => {
            setTimeout(() => {
              ws.close();
            }, 1000);
          };

          ws.onerror = (error): void => {
            server.stop();
            reject(error);
          };
        })
        .catch(error => {
          server.stop();
          reject(error);
        });
    });
  }, 30000);

  test("No stream handler", () => {
    return new Promise<void>((resolve, reject) => {
      const components: MicroserviceComponentInstance[] = [
        {
          type: WebsocketTestController,
          instance: new WebsocketTestController(),
          running: true,
        },
      ];

      const server = new MicroserviceHttpServer(context, components);
      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);

          const ws = new WebSocket(
            `ws://127.0.0.1:${server.listeningPort}${TEST_CONTROLLER_PATH}/empty`,
          );

          ws.onopen = (): void => {
            ws.send("Test message");
            setTimeout(() => {
              ws.close();
              server.stop();
              resolve();
            }, 100);
          };
          ws.onerror = (event: any): void => {
            server.stop();
            reject(event);
          };
        })
        .catch(error => {
          server.stop();
          reject(error);
        });
    });
  });
});

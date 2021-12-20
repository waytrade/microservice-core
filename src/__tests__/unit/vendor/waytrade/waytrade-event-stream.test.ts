import path from "path";
import * as uWS from "uWebSockets.js";
import {
  controller,
  MicroserviceContext,
  MicroserviceStream,
  websocket,
  WebSocketCloseCode
} from "../../../..";
import {MicroserviceComponentInstance} from "../../../../core/app";
import {MicroserviceHttpServer} from "../../../../core/http-server";
import {
  WaytradeEventMessage,
  WaytradeEventMessageType,
  WaytradeEventStream,
  WaytradeEventStreamCloseSource,
  WaytradeEventStreamConnectionState
} from '../../../../vendor/waytrade';

@controller("Controller to echo websocket messages back to sender", "/echo")
class WebsocketEchoController {
  @websocket("")
  streaming(stream: MicroserviceStream): void {
    stream.onReceived = (message): void => {
      stream.send(message);
    };
  }
}

@controller("Controller that replied with a 'hello' messages", "/hello")
class WebsocketHelloController {
  @websocket("")
  streaming(stream: MicroserviceStream): void {
    stream.send(JSON.stringify({
      topic: "hello",
      data: "hello"
    }));
  }
}

describe("Test WebSocketAutoConnection", () => {
  const TEST_MESSAGE = new WaytradeEventMessage();
  TEST_MESSAGE.topic = "test/topic";

  const context = new MicroserviceContext(
    path.resolve(__dirname, "../../../.."),
  );

  beforeAll(async () => {
    await context.boot();
  });

  const components: MicroserviceComponentInstance[] = [
    {
      type: WebsocketEchoController,
      instance: new WebsocketEchoController(),
      running: true,
    },
    {
      type: WebsocketHelloController,
      instance: new WebsocketHelloController(),
      running: true,
    },
  ];

  test("Connect to invalid URL", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, undefined, () => true);
      server.start().then(() => {
        const ws = new WaytradeEventStream(`ws://127.0.0.1:-1/echo`);
        ws.onError = (error: Error): void => {
          expect(error).toBeDefined();
          ws.close();
          server.stop();
          resolve();
        }
      });
    });
  });

  test("Connect to invalid host", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, undefined, () => true);
      server.start().then(() => {
        const ws = new WaytradeEventStream(`ws://127.0.0.1:0/echo`);
        ws.onError = (error: Error): void => {
          expect(error).toBeDefined();
          ws.close();
          server.stop();
          resolve();
        }
      });
    });
  });

  test("Drop non-JSON data", () => {
    return new Promise<void>((resolve, reject) => {
      const wsApp = uWS.App();
      wsApp.ws("/", {
        compression: uWS.SHARED_COMPRESSOR,
        open: ws => {
          ws.send(new Uint8Array([0x4e, 0x4f]), true); // must be dropped
          ws.send("OK", false); // must be dropped
          ws.send(JSON.stringify({data: "OK"}), false); // must arrive on onMessage
        },
      });

      wsApp.listen(0, socket => {
        const port = uWS.us_socket_local_port(socket);
        const wsc = new WaytradeEventStream(`ws://127.0.0.1:${port}/`);
        wsc.onMessage = (msg): void => {
          expect(msg).toEqual({data: "OK"});
          uWS.us_listen_socket_close(socket);
          wsc.close();
          resolve();
        }
      });
    });
  });

  test("Permanently close", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, undefined, () => true);
      server.start().then(() => {
        const wsc = new WaytradeEventStream(
          `ws://127.0.0.1:${server.listeningPort}/echo`
        );

        wsc.onError = (error: Error): void => {
          reject(error);
        }

        wsc.onConnectionState = (state: WaytradeEventStreamConnectionState): void => {
          switch(state) {
            case WaytradeEventStreamConnectionState.CLOSED:
              server.stop();
              resolve();
              break;
            case WaytradeEventStreamConnectionState.CONNECTED:
              expect(wsc.connectionCloseReason).toBeUndefined();
              wsc.close();
              break;
          }
        }
      });
    });
  });

  test("Send / receive subscribe",  () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, undefined, () => true);
      server.start().then(() => {
        const ws = new WaytradeEventStream(
          `ws://127.0.0.1:${server.listeningPort}/echo`, {
            reconnectDelay: 1
          }
        );

        let connectedStateCount = 0;

        ws.onConnectionState = (state: WaytradeEventStreamConnectionState): void => {
          switch(state) {
            case WaytradeEventStreamConnectionState.CONNECTED:
              if (!connectedStateCount) {
                ws.subscribe("testTopic");
              }
              connectedStateCount++;
              break;
          }
        }

        let subscribeMessageCount = 0;

        ws.onMessage = (msg: WaytradeEventMessage): void => {
          expect(msg.type).toEqual(WaytradeEventMessageType.Subscribe);
          expect(msg.topic).toEqual("testTopic");
          switch(subscribeMessageCount) {
            case 0:
              server.stop();
              setTimeout(() => {
                server.start().then(() => {
                  ws.url = `ws://127.0.0.1:${server.listeningPort}/echo`;
                })
              }, 500);
              break;
            case 1:
              server.stop();
              ws.close();
              resolve();
              break;
          }
          subscribeMessageCount++;
        }
      });
    });
  });

  test("Send / receive subscribe-unsubscribe sequence",  () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, undefined, () => true);
      server.start().then(() => {
        const ws = new WaytradeEventStream(
          `ws://127.0.0.1:${server.listeningPort}/echo`, {
            reconnectDelay: 1,
            disablePingHeartbeat: true
          }
        );

        ws.subscribe("testTopic");

        ws.sendMessage({
          type: WaytradeEventMessageType.Subscribe,
          topic: "testTopic"
        });

        let subscribeMessageCount = 0;

        ws.onMessage = (msg: WaytradeEventMessage): void => {
          switch(subscribeMessageCount) {
            case 0:
              expect(msg.type).toEqual(WaytradeEventMessageType.Subscribe);
              expect(msg.topic).toEqual("testTopic");
              server.stop();
              server.start().then(() => {
                ws.url = `ws://127.0.0.1:${server.listeningPort}/echo`;
              });
              break;
            case 1:
              expect(msg.type).toEqual(WaytradeEventMessageType.Subscribe);
              expect(msg.topic).toEqual("testTopic");

              ws.unsubscribe("testTopic")
              break;
            case 2:
              expect(msg.type).toEqual(WaytradeEventMessageType.Unsubscribe);
              expect(msg.topic).toEqual("testTopic");
              server.stop();
              server.start().then(() => {
                ws.url = `ws://127.0.0.1:${server.listeningPort}/echo`;
              });

              setTimeout(() => {
                server.stop();
                ws.close();
                resolve();
              }, 1000)
              break;
            default:
              reject();
              break;

          }
          subscribeMessageCount++;
        }
      });
    });
  }, 10000);

  test("Send / receive publish",  () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, undefined, () => true);
      server.start().then(() => {
        const ws = new WaytradeEventStream(
          `ws://127.0.0.1:${server.listeningPort}/echo`, {
            reconnectDelay: 1
          }
        );

        let connectedStateCount = 0;

        ws.onConnectionState = (state: WaytradeEventStreamConnectionState): void => {
          switch(state) {
            case WaytradeEventStreamConnectionState.CONNECTED:
              if (!connectedStateCount) {
                ws.publish("testTopic", {data: "OK"});
              }
              connectedStateCount++;
              break;
          }
        }

        ws.onMessage = (msg: WaytradeEventMessage): void => {
          expect(msg.type).toBeUndefined()
          expect(msg.topic).toEqual("testTopic");
          expect(msg.data).toEqual({data: "OK"});
          server.stop();
          ws.close();
          resolve();
        }
      });
    });
  });

  test("Send / receive unpublish",  () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, undefined, () => true);
      server.start().then(() => {
        const ws = new WaytradeEventStream(
          `ws://127.0.0.1:${server.listeningPort}/echo`, {
            reconnectDelay: 1
          }
        );

        let connectedStateCount = 0;

        ws.onConnectionState = (state: WaytradeEventStreamConnectionState): void => {
          switch(state) {
            case WaytradeEventStreamConnectionState.CONNECTED:
              if (!connectedStateCount) {
                ws.unpublish("testTopic");
              }
              connectedStateCount++;
              break;
          }
        }

        ws.onMessage = (msg: WaytradeEventMessage): void => {
          expect(msg.type).toEqual(WaytradeEventMessageType.Unpublish);
          expect(msg.topic).toEqual("testTopic");
          server.stop();
          ws.close();
          resolve();
        }
      });
    });
  });

  const PING_INTERVAL = 1;
  test("Heartbeat verification", () => {
      return new Promise<void>((resolve, reject) => {
        const server = new MicroserviceHttpServer(context, components, {
          pingInterval: PING_INTERVAL,
        }, () => true);
        server.start().then(() => {
          const CLOSE_CODE = WebSocketCloseCode.FIRST_CUSTOM;
          const wsc = new WaytradeEventStream(
            `ws://127.0.0.1:${server.listeningPort}/echo`,
            {
              pingInterval: PING_INTERVAL,
            },
          );

          wsc.onError = (error: Error): void => {
            reject(error);
          }

          wsc.onConnectionState = (state: WaytradeEventStreamConnectionState): void => {
            switch(state) {
              case WaytradeEventStreamConnectionState.CLOSED:
                expect(wsc.connectionCloseReason?.code).toEqual(CLOSE_CODE);
                server.stop();
                resolve();
                break;
              case WaytradeEventStreamConnectionState.CONNECTED:
                setTimeout(() => {
                  wsc.close(CLOSE_CODE);
                }, PING_INTERVAL * 10 * 1000);
                break;
            }
          }
        });
      });
    },
    PING_INTERVAL * 10 * 1000 + 5000,
  );

  test("Stop server while connected", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, {
        disableOpCodeHeartbeat: true, // for testing this code-path
      }, () => true);
      server.start().then(() => {
        const CLOSE_CODE = WebSocketCloseCode.FIRST_CUSTOM + 1;
        const CLOSE_REASON = "test close reason";

        const ws = new WaytradeEventStream(
          `ws://127.0.0.1:${server.listeningPort}/echo`,
        );

        ws.onError = (error: Error): void => {
          reject(error);
        }

        ws.onConnectionState = (state: WaytradeEventStreamConnectionState): void => {
          switch(state) {
            case WaytradeEventStreamConnectionState.CLOSED:
              expect(ws.connectionCloseReason?.source).toEqual(
                WaytradeEventStreamCloseSource.USER,
              );
              expect(ws.connectionCloseReason?.code).toEqual(CLOSE_CODE);
              expect(ws.connectionCloseReason?.reason).toEqual(CLOSE_REASON);
              resolve();
              break;
            case WaytradeEventStreamConnectionState.CONNECTED:
              server.stop();
              break;
            case WaytradeEventStreamConnectionState.DISCONNECTED:
              expect(ws.connectionCloseReason?.source).toEqual(
                WaytradeEventStreamCloseSource.SERVER,
              );
              ws.close(CLOSE_CODE, CLOSE_REASON);
              break;
          }
        }
      });
    });
  });

  test("Auto-reconnect after server restart", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, undefined, () => true);
      server.start().then(() => {
        const CLOSE_CODE = WebSocketCloseCode.FIRST_CUSTOM + 1;
        const CLOSE_REASON = "test close reason";

        let serverPort = server.listeningPort;

        const ws = new WaytradeEventStream(
          `ws://127.0.0.1:${serverPort}/echo`, {
            reconnectDelay: 1
          }
        );

        let connectedStateCount = 0;
        let disconnectedStateCount = 0;

        ws.onConnectionState = (state: WaytradeEventStreamConnectionState): void => {
          switch(state) {
            case WaytradeEventStreamConnectionState.CLOSED:
              expect(ws.connectionCloseReason?.source).toEqual(
                WaytradeEventStreamCloseSource.USER,
              );
              expect(ws.connectionCloseReason?.code).toEqual(CLOSE_CODE);
              expect(ws.connectionCloseReason?.reason).toEqual(CLOSE_REASON);
              server.stop();
              resolve();
              break;
            case WaytradeEventStreamConnectionState.CONNECTED:
              switch(connectedStateCount) {
                case 0:
                  server.stop();
                  break;
                case 1:
                  ws.close(CLOSE_CODE, CLOSE_REASON);
                  break;
              }
              connectedStateCount++;
              break;
            case WaytradeEventStreamConnectionState.DISCONNECTED:
              if (disconnectedStateCount == 0) {
                expect(ws.connectionCloseReason?.source).toEqual(
                  WaytradeEventStreamCloseSource.SERVER,
                );
                setTimeout(() => {
                  server.start().then(() => {
                    serverPort = server.listeningPort;
                    ws.url = `ws://127.0.0.1:${serverPort}/echo`;
                  })
                }, 3000);
              }
              disconnectedStateCount++;
              break;
          }
        }
      });
    });
  }, 10000);

  test("Ping / pong timeout", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, {
        disablePongMessageReply: true,
      }, () => true);

      server.start().then(() => {
        const ws = new WaytradeEventStream(
          `ws://127.0.0.1:${server.listeningPort}/hello`,
          {
            pingInterval: 1,
          },
        );

        ws.onError = (error: Error): void => {
          reject(error);
        }

        ws.onConnectionState = (state: WaytradeEventStreamConnectionState): void => {
          if (state === WaytradeEventStreamConnectionState.DISCONNECTED) {
            expect(ws.connectionCloseReason?.source).toEqual(
              WaytradeEventStreamCloseSource.CLIENT,
            );
            expect(ws.connectionCloseReason?.code).toEqual(
              WebSocketCloseCode.HEARTBEAT_TIMEOUT
            );
            expect(ws.connectionCloseReason?.reason).toEqual(
              "ping/pong message timeout"
            );

            ws.close();
            server.stop();
            resolve();
          }
        }
      });
    });
  });
});

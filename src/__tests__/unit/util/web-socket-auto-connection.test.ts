import path from "path";
import {Subject, takeUntil} from "rxjs";
import * as uWS from "uWebSockets.js";
import {
  controller,
  MicroserviceContext,
  MicroserviceStream,
  websocket,
  WebSocketAutoConnection,
  WebSocketAutoConnectionCloseSource,
  WebSocketAutoConnectionState,
  WebSocketCloseCode,
} from "../../..";
import {MicroserviceComponentInstance} from "../../../core/app";
import {MicroserviceHttpServer} from "../../../core/http-server";

@controller("Controller to echo websocket messages back to sender", "/echo")
class WebsocketEchoController {
  @websocket("")
  streaming(stream: MicroserviceStream): void {
    stream.onReceived = (message): void => {
      stream.send(message);
    };
  }
}

@controller("Controller to echo websocket messages back to sender", "/hello")
class WebsocketHelloController {
  @websocket("")
  streaming(stream: MicroserviceStream): void {
    stream.send("hello");
  }
}

describe("Test WebSocketAutoConnection", () => {
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
      const server = new MicroserviceHttpServer(context, components);
      server.start().then(() => {
        const ws = new WebSocketAutoConnection(`ws://127.0.0.1:-1/echo`);

        ws.onError.then(error => {
          expect(error).toBeDefined();

          ws.close();
          server.stop();
          resolve();
        });

        ws.connect();
      });
    });
  });

  test("Connect to invalid host", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components);
      server.start().then(() => {
        const ws = new WebSocketAutoConnection(`ws://127.0.0.1:0/echo`);

        ws.onError.then(error => {
          expect(error).toBeDefined();

          ws.close();
          server.stop();
          resolve();
        });

        ws.connect();
      });
    });
  });

  test("Multiple connect/close", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components);
      server.start().then(() => {
        const wsc = new WebSocketAutoConnection(
          `ws://127.0.0.1:${server.listeningPort}/echo`,
        );

        wsc.onError.then(error => {
          reject(error);
        });

        wsc.onConnected.then(() => {
          wsc.onClosed.then(() => {
            wsc.onConnected.then(() => {
              // must signal immediatly
              wsc.onConnected.then(() => {
                wsc.onClosed.then(() => {
                  server.stop();
                  resolve();
                });
                wsc.close();
              });
            });
            wsc.connect();
          });
          wsc.close();
        });
        wsc.connect();
        wsc.connect();
        wsc.connect();
      });
    });
  });

  const PING_INTERVAL = 1;
  test(
    "Heartbeat verification",
    () => {
      return new Promise<void>((resolve, reject) => {
        const server = new MicroserviceHttpServer(context, components, {
          pingInterval: PING_INTERVAL,
        });
        server.start().then(() => {
          const CLOSE_CODE = WebSocketCloseCode.FIRST_CUSTOM;
          const wsc = new WebSocketAutoConnection(
            `ws://127.0.0.1:${server.listeningPort}/echo`,
            {
              pingInterval: PING_INTERVAL,
            },
          );

          wsc.onError.then(error => {
            reject(error);
          });
          wsc.onClosed.then(reason => {
            expect(reason.code).toEqual(CLOSE_CODE);

            server.stop();
            resolve();
          });

          wsc.connect();
          setTimeout(() => {
            wsc.close(CLOSE_CODE);
          }, PING_INTERVAL * 10 * 1000);
        });
      });
    },
    PING_INTERVAL * 10 * 1000 + 5000,
  );

  test("Stop server while connected", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, {
        disableOpCodeHeartbeat: true, // for testing this code-path
      });
      server.start().then(() => {
        const CLOSE_CODE = WebSocketCloseCode.FIRST_CUSTOM + 1;
        const CLOSE_REASON = "test close reason";

        const ws = new WebSocketAutoConnection(
          `ws://127.0.0.1:${server.listeningPort}/echo`,
        );

        ws.onError.then(error => {
          reject(error);
        });

        ws.onConnected.then(() => {
          server.stop();
        });

        ws.onLostConnection.then(reason => {
          expect(reason.source).toEqual(
            WebSocketAutoConnectionCloseSource.SERVER,
          );
        });

        ws.onWaitingReconnect.then(() => {
          ws.close(CLOSE_CODE, CLOSE_REASON);
        });

        ws.onClosed.then(reason => {
          expect(reason.source).toEqual(
            WebSocketAutoConnectionCloseSource.USER,
          );
          expect(reason.code).toEqual(CLOSE_CODE);
          expect(reason.reason).toEqual(CLOSE_REASON);

          resolve();
        });

        ws.connect();
      });
    });
  });

  test("Auto-reconnect after server restart", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components);
      server.start().then(() => {
        const AUTO_RECONNECT_DELAY = 1;

        const CLOSE_CODE = WebSocketCloseCode.FIRST_CUSTOM + 1;
        const CLOSE_REASON = "test passed - gracefull close";

        let onConnectedCounter = 0;
        let onWaitingReconnectCounter = 0;

        let serverPort = server.listeningPort;
        const wsc = new WebSocketAutoConnection(
          `ws://127.0.0.1:${serverPort}/echo`,
          {reconnectDelay: AUTO_RECONNECT_DELAY},
        );

        let onWaitingReconnectPromiseResolved = false;
        wsc.onWaitingReconnect.then(delay => {
          expect(delay).toEqual(AUTO_RECONNECT_DELAY);
          onWaitingReconnectPromiseResolved = true;
        });

        let restarted = false;
        const connectionState$ = wsc.connectionState.subscribe({
          next: state => {
            switch (state) {
              case WebSocketAutoConnectionState.CONNECTED:
                expect(wsc.connectionCloseReason).toBeUndefined();
                if (!onConnectedCounter) {
                  // stop server after socket is connected
                  server.stop();
                } else {
                  // close socket (client side) after re-connection
                  wsc.close(CLOSE_CODE, CLOSE_REASON);
                }
                onConnectedCounter++;
                break;
              case WebSocketAutoConnectionState.CONNECTION_LOST:
                expect(wsc.connectionCloseReason?.source).toEqual(
                  WebSocketAutoConnectionCloseSource.SERVER,
                );
                if (!restarted) {
                  restarted = true;
                  setTimeout(() => {
                    server.start().then(() => {
                      serverPort = server.listeningPort;
                      wsc.url = `ws://127.0.0.1:${serverPort}/echo`;
                    });
                  }, AUTO_RECONNECT_DELAY * 2 * 1000);
                }
                break;
              case WebSocketAutoConnectionState.WAITING_RECONNECT:
                onWaitingReconnectCounter++;
                break;
              case WebSocketAutoConnectionState.CLOSED:
                expect(onWaitingReconnectCounter).toBeGreaterThan(0);
                expect(onWaitingReconnectPromiseResolved).toBeTruthy();
                expect(wsc.connectionCloseReason?.source).toEqual(
                  WebSocketAutoConnectionCloseSource.USER,
                );
                expect(wsc.connectionCloseReason?.code).toEqual(CLOSE_CODE);
                expect(wsc.connectionCloseReason?.reason).toEqual(CLOSE_REASON);

                connectionState$.unsubscribe();
                server.stop();
                resolve();
                break;
            }
          },
        });

        wsc.connect();
      });
    });
  });

  test("Connection sequence state changes (Promises)", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, {
        disablePongMessageReply: true,
      });

      server.start().then(() => {
        expect(server.listeningPort).toBeGreaterThan(0);

        const ws = new WebSocketAutoConnection(
          `ws://127.0.0.1:${server.listeningPort}/echo`,
        );

        ws.onError.then(error => {
          reject(error);
        });

        let receivedStates: WebSocketAutoConnectionState[] = [
          ws.currentConnectionState,
        ];

        ws.onConnecting.then(() => {
          receivedStates.push(WebSocketAutoConnectionState.CONNECTING);
        });

        ws.onConnected.then(() => {
          receivedStates.push(WebSocketAutoConnectionState.CONNECTED);
          ws.close();
        });

        ws.onClosed.then(() => {
          receivedStates.push(WebSocketAutoConnectionState.CLOSED);

          expect(receivedStates.length).toEqual(4);
          expect(receivedStates[0]).toEqual(
            WebSocketAutoConnectionState.DISCONNECTED,
          );
          expect(receivedStates[1]).toEqual(
            WebSocketAutoConnectionState.CONNECTING,
          );
          expect(receivedStates[2]).toEqual(
            WebSocketAutoConnectionState.CONNECTED,
          );
          expect(receivedStates[3]).toEqual(
            WebSocketAutoConnectionState.CLOSED,
          );

          server.stop();
          resolve();
        });

        ws.connect();
      });
    });
  });

  test("Connection sequence state changes (Observable)", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, {
        disablePongMessageReply: true,
      });

      server.start().then(() => {
        expect(server.listeningPort).toBeGreaterThan(0);

        const ws = new WebSocketAutoConnection(
          `ws://127.0.0.1:${server.listeningPort}/echo`,
        );

        ws.onError.then(error => {
          reject(error);
        });

        let receivedStates: WebSocketAutoConnectionState[] = [];

        const sub$ = ws.connectionState.subscribe({
          next: state => {
            receivedStates.push(state);
            switch (state) {
              case WebSocketAutoConnectionState.CONNECTED:
                ws.close();
                break;
              case WebSocketAutoConnectionState.CLOSED:
                expect(receivedStates.length).toEqual(4);
                expect(receivedStates[0]).toEqual(
                  WebSocketAutoConnectionState.DISCONNECTED,
                );
                expect(receivedStates[1]).toEqual(
                  WebSocketAutoConnectionState.CONNECTING,
                );
                expect(receivedStates[2]).toEqual(
                  WebSocketAutoConnectionState.CONNECTED,
                );
                expect(receivedStates[3]).toEqual(
                  WebSocketAutoConnectionState.CLOSED,
                );

                sub$.unsubscribe();
                server.stop();
                resolve();
                break;
            }
          },
        });

        ws.connect();
      });
    });
  });

  test("Text message ping / pong timeout", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, {
        disablePongMessageReply: true,
      });

      server.start().then(() => {
        const wsc = new WebSocketAutoConnection(
          `ws://127.0.0.1:${server.listeningPort}/hello`,
          {
            pingInterval: 1,
          },
        );

        wsc.onError.then(error => {
          reject(error);
        });

        wsc.onLostConnection.then(reason => {
          expect(reason.source).toEqual(
            WebSocketAutoConnectionCloseSource.CLIENT,
          );
          expect(reason.code).toEqual(WebSocketCloseCode.HEARTBEAT_TIMEOUT);
          expect(reason.reason).toEqual("ping/pong message timeout");

          wsc.close();
          server.stop();
          resolve();
        });

        wsc.connect();
      });
    });
  });

  test("Send / Receive ping", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, {
        disablePongMessageReply: true,
      });

      server.start().then(() => {
        expect(server.listeningPort).not.toEqual(0);

        const TEST_MESSAGE = "ping";

        const wsc = new WebSocketAutoConnection(
          `ws://127.0.0.1:${server.listeningPort}/echo`,
          {
            disablePingHeartbeat: true,
          },
        );

        wsc.onError.then(error => {
          reject(error);
        });

        wsc.onMessage.subscribe({
          next: message => {
            expect(message).toEqual(TEST_MESSAGE);
            wsc.close();
          },
        });

        wsc.onConnected.then(() => {
          wsc.send(TEST_MESSAGE);
        });

        wsc.onClosed.then(() => {
          wsc.send(TEST_MESSAGE, error => {
            expect(error?.message).toEqual("Not connected");
            server.stop();
            resolve();
          });
        });

        wsc.connect();
      });
    });
  });

  test("Send / Receive text", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components, {
        disablePongMessageReply: false,
      });

      server.start().then(() => {
        expect(server.listeningPort).not.toEqual(0);

        const TEST_MESSAGE = "someText";

        const wsc = new WebSocketAutoConnection(
          `ws://127.0.0.1:${server.listeningPort}/echo`,
          {
            disablePingHeartbeat: false,
          },
        );

        wsc.onError.then(error => {
          reject(error);
        });

        wsc.onMessage.subscribe({
          next: message => {
            expect(message).toEqual(TEST_MESSAGE);
            wsc.close();
          },
        });

        wsc.onConnected.then(() => {
          wsc.send(TEST_MESSAGE);
        });

        wsc.onClosed.then(() => {
          wsc.send(TEST_MESSAGE);
          wsc.send(TEST_MESSAGE, error => {
            expect(error?.message).toEqual("Not connected");
            server.stop();
            resolve();
          });
        });

        wsc.connect();
      });
    });
  });

  test("Auto re-connection (state sequence)", () => {
    return new Promise<void>((resolve, reject) => {
      const server = new MicroserviceHttpServer(context, components);
      server.start().then(() => {
        const AUTO_RECONNECT_DELAY = 1;

        let serverPort = server.listeningPort;
        expect(serverPort).not.toEqual(0);

        const wsc = new WebSocketAutoConnection(
          `ws://127.0.0.1:${server.listeningPort}/echo`,
          {
            pingInterval: 1,
            reconnectDelay: AUTO_RECONNECT_DELAY,
          },
        );

        let receivedStates: WebSocketAutoConnectionState[] = [];

        const cancel = new Subject<void>();
        wsc.connectionState.pipe(takeUntil(cancel)).subscribe({
          next: state => {
            receivedStates.push(state);
            switch (state) {
              case WebSocketAutoConnectionState.CONNECTED:
                if (
                  receivedStates.find(
                    v => v === WebSocketAutoConnectionState.WAITING_RECONNECT,
                  )
                ) {
                  expect(receivedStates.length).toEqual(11);
                  expect(receivedStates[0]).toEqual(
                    WebSocketAutoConnectionState.DISCONNECTED,
                  );
                  expect(receivedStates[1]).toEqual(
                    WebSocketAutoConnectionState.CONNECTING,
                  );
                  expect(receivedStates[2]).toEqual(
                    WebSocketAutoConnectionState.CONNECTED,
                  );
                  expect(receivedStates[3]).toEqual(
                    WebSocketAutoConnectionState.CONNECTION_LOST,
                  );
                  expect(receivedStates[4]).toEqual(
                    WebSocketAutoConnectionState.WAITING_RECONNECT,
                  );
                  expect(receivedStates[5]).toEqual(
                    WebSocketAutoConnectionState.CONNECTING,
                  );
                  expect(receivedStates[6]).toEqual(
                    WebSocketAutoConnectionState.WAITING_RECONNECT,
                  );
                  expect(receivedStates[7]).toEqual(
                    WebSocketAutoConnectionState.CONNECTION_LOST,
                  );
                  expect(receivedStates[8]).toEqual(
                    WebSocketAutoConnectionState.WAITING_RECONNECT,
                  );
                  expect(receivedStates[9]).toEqual(
                    WebSocketAutoConnectionState.CONNECTING,
                  );
                  expect(receivedStates[10]).toEqual(
                    WebSocketAutoConnectionState.CONNECTED,
                  );

                  cancel.next();
                  wsc.close();
                  server.stop();
                  resolve();
                } else {
                  server.stop();
                  setTimeout(() => {
                    server.start().then(() => {
                      serverPort = server.listeningPort;
                      wsc.url = `ws://127.0.0.1:${server.listeningPort}/echo`;
                    });
                  }, AUTO_RECONNECT_DELAY * 2 * 1000);
                }
                break;
            }
          },
        });

        wsc.connect();
      });
    });
  });

  test("Drop non-text data", () => {
    return new Promise<void>((resolve, reject) => {
      const wsApp = uWS.App();
      wsApp.ws("/", {
        compression: uWS.SHARED_COMPRESSOR,
        open: ws => {
          ws.send(new Uint8Array([0x4e, 0x4f]), true); // must be dropped
          ws.send("OK", false); // must arrive on onMessage
        },
      });

      wsApp.listen(0, socket => {
        const port = uWS.us_socket_local_port(socket);
        const wsc = new WebSocketAutoConnection(`ws://127.0.0.1:${port}/`);
        wsc.onMessage.subscribe({
          next: msg => {
            expect(msg).toEqual("OK");

            uWS.us_listen_socket_close(socket);
            wsc.close();
            resolve();
          },
        });
        wsc.connect();
      });
    });
  });
});

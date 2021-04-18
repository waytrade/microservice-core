/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import HttpStatus from "http-status";
import {ParsedUrlQuery} from "querystring";
import URL from "url";
import {TextDecoder} from "util";
import * as uWS from "uWebSockets.js";
import {us_listen_socket_close} from "uWebSockets.js";
import {HttpError} from "..";
import {MicroserviceApp} from "./app";
import {MicroserviceContext} from "./context";

export interface QueryParams {
  [name: string]: string;
}

/** An request to a microservice. */
export class MicroserviceRequest {
  constructor(
    private readonly res: uWS.HttpResponse,
    private readonly req: uWS.HttpRequest,
  ) {
    this.url = this.req.getUrl();
    this.method = this.req.getMethod();
    this.query = this.req.getQuery();
    this.queryParams = URL.parse("/?" + this.query, true).query;
    this.req.forEach((key, value) => {
      this.headers.set(key, value);
    });
    this.remoteAddress = new TextDecoder().decode(res.getRemoteAddressAsText());
  }

  /** The URL including initial /slash   */
  public readonly url: string;

  /** The URL including initial /slash   */
  public readonly method: string;

  /** the raw querystring (the part of URL after ? sign) or empty string.  */
  public readonly query: string;

  /** All query parameters. */
  readonly queryParams: ParsedUrlQuery = {};

  /** All heder values. */
  readonly headers = new Map<string, string>();

  /** The IP address of the remote peer  */
  readonly remoteAddress: string;

  /** Write a header to response. */
  writeResponseHeader(key: string, value: string): void {
    this.res.writeHeader(key, value);
  }
}

/**
 * HTTP/REST server of a microservice.
 */
export class MicroserviceServer {
  /** The uWebSocket App. */
  private readonly wsApp = uWS.App();

  /** The TCP listen socket. */
  private listenSocket?: uWS.us_listen_socket;

  /** Register a HTTP POST route. */
  registerPostRoute(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    path: string,
    contentType: string,
  ): void {
    const i = path.indexOf("{");
    if (i !== -1) {
      path = path.substr(0, i) + "*";
    }
    this.wsApp.post(path, (res, req) => {
      this.handleRequest(target, propertyKey, contentType, res, req);
    });
  }

  /** Register a HTTP PUT route. */
  registerPutRoute(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    path: string,
    contentType: string,
  ): void {
    const i = path.indexOf("{");
    if (i !== -1) {
      path = path.substr(0, i) + "*";
    }
    this.wsApp.put(path, (res, req) => {
      this.handleRequest(target, propertyKey, contentType, res, req);
    });
  }

  /** Register a HTTP GET route. */
  registerGetRoute(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    path: string,
    contentType: string,
  ): void {
    const i = path.indexOf("{");
    if (i !== -1) {
      path = path.substr(0, i) + "*";
    }
    this.wsApp.get(path, (res, req) => {
      this.handleRequest(target, propertyKey, contentType, res, req);
    });
    0;
  }

  /** Register a HTTP PATCH route. */
  registerPatchRoute(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    path: string,
    contentType: string,
  ): void {
    const i = path.indexOf("{");
    if (i !== -1) {
      path = path.substr(0, i) + "*";
    }
    this.wsApp.patch(path, (res, req) => {
      this.handleRequest(target, propertyKey, contentType, res, req);
    });
  }

  /** Register a HTTP DELETE route. */
  registerDeleteRoute(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    path: string,
    contentType: string,
  ): void {
    const i = path.indexOf("{");
    if (i !== -1) {
      path = path.substr(0, i) + "*";
    }
    this.wsApp.del(path, (res, req) => {
      this.handleRequest(target, propertyKey, contentType, res, req);
    });
  }

  /** Start the server. */
  start(port: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.wsApp.any("/*", (res: uWS.HttpResponse, req: uWS.HttpRequest) => {
        res.cork(() => {
          const url = req.getUrl();
          MicroserviceApp.debug(url + " not found.");
          res.writeStatus("404 Not Found");
          this.addCORSResponseHeaders(res);
          res.end();
        });
      });
      this.setupControllerRoutes();
      this.wsApp.listen(port, 1, listenSocket => {
        if (listenSocket) {
          this.listenSocket = listenSocket;
          MicroserviceApp.debug(`Server listening on port ${port}`);
          resolve();
        } else {
          delete this.listenSocket;
          reject(new Error("Failed to create listening socket."));
        }
      });
    });
  }

  /** Stop the server. */
  stop(): void {
    if (this.listenSocket !== undefined) {
      us_listen_socket_close(this.listenSocket);
    }
  }

  /** Setup the routes to controllers.  */
  private setupControllerRoutes(): void {
    this.wsApp.options("/*", (res: uWS.HttpResponse, req: uWS.HttpRequest) => {
      res.writeStatus("204 No Content");
      res.writeHeader("Access-Control-Allow-Origin", "*");
      res.writeHeader(
        "Access-Control-Allow-Methods",
        "GET, PUT, PATCH, POST, DELETE",
      );
      res.writeHeader(
        "Access-Control-Allow-Headers",
        req.getHeader("access-control-request-headers"),
      );
      res.writeHeader("Access-Control-Max-Age", "86400");
      res.end();
    });

    MicroserviceContext.controllers.forEach(controller => {
      controller.methods.forEach(method => {
        if (method?.method && method?.contentType) {
          const url = (controller.baseUrl ?? "") + method.path;
          switch (method.method.toLowerCase()) {
            case "get":
              this.registerGetRoute(
                controller.target,
                method.propertyKey,
                url,
                method.contentType,
              );
              break;
            case "put":
              this.registerPutRoute(
                controller.target,
                method.propertyKey,
                url,
                method.contentType,
              );
              break;
            case "post":
              this.registerPostRoute(
                controller.target,
                method.propertyKey,
                url,
                method.contentType,
              );
              break;
            case "patch":
              this.registerPatchRoute(
                controller.target,
                method.propertyKey,
                url,
                method.contentType,
              );
              break;
            case "delete":
              this.registerDeleteRoute(
                controller.target,
                method.propertyKey,
                url,
                method.contentType,
              );
              break;
            default:
              MicroserviceApp.error(
                "Unknown operation method " + method.method,
              );
          }
        }
      });
    });
  }

  /** Handle a HTTP request. */
  private handleRequest(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    contentType: string,
    res: uWS.HttpResponse,
    req: uWS.HttpRequest,
  ): void {
    res.onAborted(() => {
      res.done = true;
      if (res.abortEvents) {
        res.abortEvents.forEach((f: () => unknown) => f());
      }
    });

    const request = new MicroserviceRequest(res, req);
    const startTime = Date.now();

    let buffer = "";
    const decoder = new TextDecoder();
    res.onData((chunk, isLast) => {
      buffer += decoder.decode(chunk);
      if (isLast) {
        let data: unknown;
        if (buffer.length) {
          try {
            data = JSON.parse(buffer);
          } catch (error) {
            res.cork(() => {
              res.writeStatus("400 Bad Request");
              this.addCORSResponseHeaders(res);
              res.end();
            });
            return;
          }
        }

        let resultCode = 0;
        this.respond(
          () => {
            if (target.prototype && target.prototype[propertyKey]) {
              return target.prototype[propertyKey](request, data);
            } else if (target[propertyKey] !== undefined) {
              return target[propertyKey](request, data);
            } else {
              throw new HttpError(400);
            }
          },
          res,
          contentType,
        )
          .then(code => (resultCode = code))
          .catch(error => (resultCode = error.code))
          .finally(() => {
            const endTime = Date.now();
            resultCode = resultCode ?? 500;
            MicroserviceApp.debug(
              `HTTP ${request.method} ${request.url} -> ${resultCode} (${
                endTime - startTime
              }ms)`,
            );
          });
      }
    });
  }

  /** Write a success response the uWS.HttpResponse */
  private write(
    res: uWS.HttpResponse,
    contentType?: string,
    data?: unknown,
  ): void {
    res.cork(() => {
      contentType = contentType ?? "application/json";
      this.addCORSResponseHeaders(res);
      res.writeHeader("content-type", contentType);
      if (data) {
        if (contentType === "application/json") {
          res.end(JSON.stringify(data));
        } else {
          res.end(data as string);
        }
      } else {
        res.end();
      }
    });
  }

  /** Write an error response the uWS.HttpResponse */
  private writeError(res: uWS.HttpResponse, error: HttpError): void {
    res.cork(() => {
      const code = error.code ?? 500;
      res.writeStatus(`${code} ${HttpStatus[code]}`);
      this.addCORSResponseHeaders(res);
      res.writeHeader("content-type", "application/json");
      if (error.code === undefined) {
        res.end(
          JSON.stringify({
            message: error.message,
            stack: error.stack,
          }),
        );
      } else {
        if (error.message) {
          res.end(
            JSON.stringify({
              message: error.message,
            }),
          );
        } else {
          res.end();
        }
      }
    });
  }

  /** Respond to a request. */
  private async respond(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    func: () => any,
    res: uWS.HttpResponse,
    contentType: string,
  ): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      try {
        const response = func();
        if (response) {
          if (response.then && response.catch) {
            response
              .then((data: unknown) => {
                this.write(res, contentType, data);
                resolve(200);
              })
              .catch((error: HttpError) => {
                this.writeError(res, error);
                reject(error);
              });
          } else {
            this.write(res, contentType, response);
            resolve(200);
          }
        } else {
          this.write(res);
          resolve(200);
        }
      } catch (error) {
        this.writeError(res, error);
        reject(error);
      }
    });
  }

  /** Add CORS response headers. */
  private addCORSResponseHeaders(res: uWS.HttpResponse): void {
    res.writeHeader("Access-Control-Allow-Origin", "*");
    res.writeHeader("Access-Control-Expose-Headers", "authorization");
  }
}

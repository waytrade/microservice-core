import path from "path";
import * as uWS from "uWebSockets.js";
import {MicroserviceApp} from "../core/app";
import {MicroserviceConfig} from "../core/config";

/**
 * The service test application.
 */
export class MicroserviceTestApp extends MicroserviceApp {
  constructor(private readonly remoteAppPort: number, rootFolder: string) {
    super(rootFolder, [], []);
  }

  /** The remote-side app. */
  readonly remote = uWS.App();

  /** The remote-side listening socket */
  private remoteSocket?: uWS.us_listen_socket;

  /** Get the service config */
  get config(): MicroserviceConfig {
    return MicroserviceTestApp.config;
  }

  /** Get the service config */
  static get config(): MicroserviceConfig {
    return <MicroserviceConfig>MicroserviceApp.context.config;
  }

  /** Test setting: fail onBoot with listener creation error. */
  TEST_failWithBootError = false;

  onBoot(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.remote.any("/*", (res: uWS.HttpResponse, req: uWS.HttpRequest) => {
        res.cork(() => {
          const url = req.getUrl();
          MicroserviceTestApp.debug(url + " not found.");
          res.writeStatus("404 Not Found");
          res.end();
        });
      });
      if (this.TEST_failWithBootError) {
        reject();
        return;
      }
      this.remote.listen(this.remoteAppPort, 1, listenSocket => {
        this.remoteSocket = listenSocket;
        resolve();
      });
    });
  }

  /** Start the service app. */
  run(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      super
        .run()
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  /** Shutdown the app. */
  shutdown(): void {
    if (this.remoteSocket !== undefined) {
      uWS.us_listen_socket_close(this.remoteSocket);
    }
    super.shutdown();
  }
}

export class TestApp extends MicroserviceTestApp {
  constructor(remoteAppPort: number) {
    super(remoteAppPort, path.resolve(__dirname, "../.."));
  }
}

import axios from "axios";
import fs from "fs";
import {MicroserviceContext} from "./context";
import {MicroserviceHttpServer} from "./http-server";
import {OpenApi} from "./openapi";

export function exportOpenApiJson(
  path: string,
  context: MicroserviceContext,
  apiControllers: unknown[],
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const server = new MicroserviceHttpServer(context, apiControllers);
    new OpenApi(context, apiControllers, server);

    server
      .start()
      .then(() => {
        axios
          .get(`http://127.0.0.1:${server.listeningPort}/openapi.json`)
          .then(res => {
            fs.writeFileSync(path + "/openapi.json", JSON.stringify(res.data));
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
      });
  });
}

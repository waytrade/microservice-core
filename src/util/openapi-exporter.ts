import axios from "axios";
import fs from "fs";
import {HttpStatus} from "..";
import {MicroserviceContext} from "../core/context";
import {MicroserviceHttpServer} from "../core/http-server";
import {OpenApi} from "../core/openapi";

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
            expect(res.status).toBe(HttpStatus.OK);
            if (!fs.existsSync(path)) {
              fs.mkdirSync(path, {recursive: true});
            }
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

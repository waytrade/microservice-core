import fs from "fs";
import HttpStatus from "http-status";
import {
  CallbacksObject,
  InfoObject,
  OpenApiBuilder,
  OpenAPIObject,
  ParameterObject,
  PathItemObject,
  RequestBodyObject,
  ResponsesObject,
  SchemaObject,
} from "openapi3-ts";
import path from "path";
import SwaggerUI from "swagger-ui-dist";
import {MicroserviceApp} from "..";
import {MapExt} from "../util/map-ext";
import {MicroserviceContext} from "./context";
import {SWAGGER_INDEX_HTML} from "./index.html";
import {ControllerMetadata, EnumModelMetadata, ModelMetadata} from "./metadata";
import {MicroserviceServer} from "./server";

const SWAGGER_UI_CSS_URL = "/swagger-ui.css";
const SWAGGER_UI_BUNDLE_JS_URL = "/swagger-ui-bundle.js";
const SWAGGER_UI_STANDALONE_PRESET_JS_URL = "/swagger-ui-standalone-preset.js";
const OPENAPI_JSON_URL = "/openapi.json";

function isNativeType(type: string): boolean {
  return type === "number" || type === "string" || type === "boolean";
}

/**
 * OpenAPI helper class.
 */
export class OpenApi {
  static readonly OPENAPI_RELATIVE_URL = "openapi.json";

  constructor(server: MicroserviceServer) {
    server.registerGetRoute(this, "getHtml", "/", "text/html");
    server.registerGetRoute(
      this,
      "getSwaggerUiCss",
      SWAGGER_UI_CSS_URL,
      "text/css",
    );
    server.registerGetRoute(
      this,
      "getSwaggerUiBundleJs",
      SWAGGER_UI_BUNDLE_JS_URL,
      "text/javascript",
    );
    server.registerGetRoute(
      this,
      "getSwaggerUiStandalonePresetJs",
      SWAGGER_UI_STANDALONE_PRESET_JS_URL,
      "text/javascript",
    );
    server.registerGetRoute(
      this,
      "getOpenApiModel",
      OPENAPI_JSON_URL,
      "application/json",
    );
  }

  /** Build the OpenApi model. */
  private buildOpenApi(): OpenAPIObject {
    const builder = new OpenApiBuilder();

    // add info

    const info: InfoObject = {
      title: MicroserviceApp.context.config.NAME,
      version: MicroserviceApp.context.config.VERSION,
    };

    if (MicroserviceApp.context.config.DESCRIPTION) {
      info.description = MicroserviceApp.context.config.DESCRIPTION;
    }

    builder.addInfo(info);

    // add object model schemas

    MicroserviceContext.models.forEach(model => {
      if (model.target.name) {
        builder.addSchema(
          model.target.name,
          this.modelToSchema(model.target.name, model),
        );
      }
    });

    // add enum model schemas

    MicroserviceContext.enumModels.forEach(model => {
      if (model.name) {
        builder.addSchema(
          model.name,
          this.enumModelToSchema(model.name, model),
        );
      }
    });

    // collect paths

    let usesBearerAuth = false;
    const paths = new MapExt<string, PathItemObject>();
    MicroserviceContext.controllers.forEach(ctrl => {
      const hasAuth = this.createControllerApi(ctrl, paths);
      usesBearerAuth = usesBearerAuth || hasAuth;
    });

    // add paths

    paths.forEach((item, url) => {
      builder.addPath(url, item);
    });

    // add components

    if (usesBearerAuth) {
      builder.addSecurityScheme("bearerAuth", {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JTW",
      });
    }

    // return spec

    return builder.getSpec();
  }

  private modelToSchema(name: string, model: ModelMetadata): SchemaObject {
    const res: SchemaObject = {
      title: name,
      description: model.description,
      type: "object",
      additionalProperties: false,
      properties: {},
    };

    model.properties.forEach(prop => {
      if (res.properties) {
        const type = String(prop.type);
        const typeLower = type.toLowerCase();
        const nativeType = isNativeType(typeLower);
        if (nativeType) {
          res.properties[prop.propertyKey] = {
            description: prop.description,
            type: typeLower as "string" | "number" | "boolean",
          };
        } else if (typeLower === "array") {
          if (isNativeType((prop.arrayItemType ?? "").toLowerCase())) {
            res.properties[prop.propertyKey] = {
              description: prop.description,
              type: "array",
              items: {
                type: prop.arrayItemType?.toLocaleLowerCase() as "string",
              },
            };
          } else {
            res.properties[prop.propertyKey] = {
              description: prop.description,
              type: "array",
              items: {
                type: "object",
                $ref: `#/components/schemas/${prop.arrayItemType}`,
              },
            };
          }
        } else if (typeLower === "object") {
          res.properties[prop.propertyKey] = {
            description: prop.description,
            type: "object",
          };
        } else {
          res.properties[prop.propertyKey] = {
            description: prop.description,
            $ref: `#/components/schemas/${type}`,
          };
        }
      }
    });
    return res;
  }

  private enumModelToSchema(
    name: string,
    model: EnumModelMetadata,
  ): SchemaObject {
    return {
      title: name,
      description: model.description,
      type: model.type as "number" | "string",
      enum: model.values,
    };
  }

  /** Get the index.html contents. */
  getHtml(): string {
    return SWAGGER_INDEX_HTML;
  }

  /** Get the swagger-ui css file contents. */
  async getSwaggerUiCss(): Promise<string> {
    const swaggerUiPath = SwaggerUI.getAbsoluteFSPath();
    const filePath = path.resolve(swaggerUiPath, "." + SWAGGER_UI_CSS_URL);
    return (await fs.promises.readFile(filePath, "utf-8")) as string;
  }

  /** Get the swagger-ui bundle.js file contents. */
  async getSwaggerUiBundleJs(): Promise<string> {
    const swaggerUiPath = SwaggerUI.getAbsoluteFSPath();
    const filePath = path.resolve(
      swaggerUiPath,
      "." + SWAGGER_UI_BUNDLE_JS_URL,
    );
    return (await fs.promises.readFile(filePath, "utf-8")) as string;
  }

  /** Get the swagger-ui standalone-preset.js file contents. */
  async getSwaggerUiStandalonePresetJs(): Promise<string> {
    const swaggerUiPath = SwaggerUI.getAbsoluteFSPath();
    const filePath = path.resolve(
      swaggerUiPath,
      "." + SWAGGER_UI_STANDALONE_PRESET_JS_URL,
    );
    return (await fs.promises.readFile(filePath, "utf-8")) as string;
  }

  /** Get the OpenApi model. */
  async getOpenApiModel(): Promise<unknown> {
    return this.buildOpenApi();
  }

  /** Create openapi of a controller. */
  private createControllerApi(
    ctrl: ControllerMetadata,
    allPaths: MapExt<string, PathItemObject>,
  ): boolean {
    let usesBearerAuth = false;
    ctrl.methods.forEach(method => {
      if (
        method.method !== "get" &&
        method.method !== "put" &&
        method.method !== "post" &&
        method.method !== "patch" &&
        method.method !== "delete"
      ) {
        return;
      }

      const url = (ctrl.baseUrl ?? "") + method.path;
      const pathItem: PathItemObject = allPaths.getOrAdd(url, () => {
        return {};
      });

      const responses: ResponsesObject = {};
      let hasSuccessCode = false;

      method.responses.forEach(responseMeta => {
        if (responseMeta.code >= 200 && responseMeta.code < 300) {
          hasSuccessCode = true;
        }
        responses[responseMeta.code] = {
          description:
            responseMeta.description ?? HttpStatus[responseMeta.code],
        };
        if (responseMeta.ref) {
          if (responseMeta.ref.toLocaleLowerCase() === "object") {
            responses[responseMeta.code].content = {
              "application/json": {
                schema: {
                  type: "object",
                },
              },
            };
          } else {
            responses[responseMeta.code].content = {
              "application/json": {
                schema: {
                  $ref: `#/components/schemas/${responseMeta.ref}`,
                },
              },
            };
          }
        }
      });

      if (!hasSuccessCode) {
        responses[200] = {
          description: "OK",
        };
      }

      let requestBody: RequestBodyObject | undefined = undefined;
      if (method.requestBodyRef) {
        if (method.requestBodyRef.toLocaleLowerCase() === "object") {
          requestBody = {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                },
              },
            },
          };
        } else {
          requestBody = {
            content: {
              "application/json": {
                schema: {
                  $ref: `#/components/schemas/${method.requestBodyRef}`,
                },
              },
            },
          };
        }
      }

      const callbacks: CallbacksObject = {
        onEvent: {},
      };

      method.callbackRefs.forEach((ref, callbackUrl) => {
        callbacks.onEvent[callbackUrl] = {
          post: {
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    $ref: `#/components/schemas/${ref}`,
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "OK",
              },
            },
          },
        };
      });

      const methodType = method.method;
      if (methodType && method.path && ctrl.endpointName) {
        const item = <Record<string, unknown>>(pathItem[methodType] = {
          responses,
          requestBody,
          tags: [ctrl.endpointName],
        });

        item["x-controller-name"] = ctrl.target.name;

        item["x-operation-name"] = method.propertyKey;
        item["operationId"] = method.propertyKey;

        if (method.summary) {
          item.summary = method.summary;
        }

        if (method.description) {
          item.description = method.description;
        }

        if (method.callbackRefs.size) {
          item.callbacks = callbacks;
        }

        if (method.bearerAuthScopes) {
          usesBearerAuth = true;
          item["security"] = [
            {
              bearerAuth: method.bearerAuthScopes,
            },
          ];
        }

        item.parameters = [];

        method.queryParams.forEach(param => {
          (item.parameters as Array<unknown>).push({
            name: param.name,
            in: param.inType,
            required: param.required,
            description: param.description,
            schema: {
              type: param.type,
            },
          } as ParameterObject);
        });
      }
    });

    return usesBearerAuth;
  }
}

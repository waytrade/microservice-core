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
import {MapExt} from "../util/map-ext";
import {MicroserviceComponentInstance} from "./app";
import {MicroserviceContext} from "./context";
import {MicroserviceHttpServer} from "./http-server";
import {SWAGGER_INDEX_HTML} from "./index.html";
import {
  ControllerMetadata,
  CONTROLLER_METADATA,
  EnumModelMetadata,
  ENUM_MODEL_METADATA,
  ModelMetadata,
  MODEL_METADATA,
} from "./metadata";

const SWAGGER_UI_CSS_URL = "/swagger-ui.css";
const SWAGGER_UI_BUNDLE_JS_URL = "/swagger-ui-bundle.js";
const SWAGGER_UI_STANDALONE_PRESET_JS_URL = "/swagger-ui-standalone-preset.js";
const OPENAPI_JSON_URL = "/openapi.json";

function isNativeType(type?: string): boolean {
  return type === "number" || type === "string" || type === "boolean";
}

/**
 * OpenAPI helper class.
 */
export class OpenApi {
  static readonly OPENAPI_RELATIVE_URL = "openapi.json";

  constructor(
    private context: MicroserviceContext,
    private readonly controllers: unknown[],
    server: MicroserviceHttpServer,
  ) {
    const component: MicroserviceComponentInstance = {
      instance: this,
      type: OpenApi,
      running: true,
    };

    server.registerGetRoute(component, "getHtml", false, "/", "text/html");
    server.registerGetRoute(
      component,
      "getSwaggerUiCss",
      false,
      SWAGGER_UI_CSS_URL,
      "text/css",
    );
    server.registerGetRoute(
      component,
      "getSwaggerUiBundleJs",
      false,
      SWAGGER_UI_BUNDLE_JS_URL,
      "text/javascript",
    );
    server.registerGetRoute(
      component,
      "getSwaggerUiStandalonePresetJs",
      false,
      SWAGGER_UI_STANDALONE_PRESET_JS_URL,
      "text/javascript",
    );
    server.registerGetRoute(
      component,
      "getOpenApiModel",
      false,
      OPENAPI_JSON_URL,
      "application/json",
    );
  }

  /** Build the OpenApi model. */
  private buildOpenApi(): OpenAPIObject {
    const builder = new OpenApiBuilder();

    // add global info

    const info: InfoObject = {
      title: this.context.config.NAME ?? "",
      version: this.context.config.VERSION ?? "",
    };

    if (this.context.config.DESCRIPTION) {
      info.description = this.context.config.DESCRIPTION;
    }

    builder.addInfo(info);

    // collect paths and reference models

    let usesBearerAuth = false;
    const paths = new MapExt<string, PathItemObject>();
    const models = new Map<string, ModelMetadata>();

    this.controllers.forEach(ctrl => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const name = (<any>ctrl).name ?? (<any>ctrl).type.name;
      const ctrlMeta = CONTROLLER_METADATA.get(name);
      if (ctrlMeta) {
        const hasAuth = this.addControllerApi(name, ctrlMeta, paths, models);
        usesBearerAuth = usesBearerAuth || hasAuth;
      }
    });

    // add paths

    paths.forEach((item, url) => {
      builder.addPath(url, item);
    });

    // add models

    models.forEach((modelMetadata, name) => {
      this.addModelToSchemas(builder, name, modelMetadata);
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

  private addModelToSchemas(
    builder: OpenApiBuilder,
    name: string,
    model: ModelMetadata,
  ): void {
    const properties: Record<string, unknown> = {};
    const res: SchemaObject = {
      title: name,
      description: model.description,
      type: "object",
      additionalProperties: false,
      properties: <SchemaObject>properties,
    };

    model.properties.forEach(prop => {
      const type = String(prop.type);
      const typeLower = type.toLowerCase();
      const nativeType = isNativeType(typeLower);
      if (nativeType) {
        properties[prop.propertyKey] = {
          description: prop.description,
          type: typeLower as "string" | "number" | "boolean",
        };
      } else if (typeLower === "array") {
        if (isNativeType(prop.arrayItemType?.toLowerCase())) {
          properties[prop.propertyKey] = {
            description: prop.description,
            type: "array",
            items: {
              type: prop.arrayItemType?.toLocaleLowerCase() as "string",
            },
          };
        } else {
          properties[prop.propertyKey] = {
            description: prop.description,
            type: "array",
            items: {
              type: "object",
              $ref: `#/components/schemas/${prop.arrayItemType}`,
            },
          };
        }
      } else if (typeLower === "object") {
        properties[prop.propertyKey] = {
          description: prop.description,
          type: "object",
        };
      } else {
        const nestedType = MODEL_METADATA.get(type);
        if (nestedType) {
          properties[prop.propertyKey] = {
            description: prop.description,
            $ref: `#/components/schemas/${type}`,
          };
          this.addModelToSchemas(builder, type, nestedType);
        } else {
          const enumModelMeta = ENUM_MODEL_METADATA.get(type);
          if (enumModelMeta) {
            properties[prop.propertyKey] = this.addEnumModelToSchemas(
              builder,
              prop.type,
              enumModelMeta,
            );
          } else {
            properties[prop.propertyKey] = {
              description: prop.description,
              type: "object",
            };
          }
        }
      }
    });

    builder.addSchema(name, res);
  }

  private addEnumModelToSchemas(
    builder: OpenApiBuilder,
    name: string,
    model: EnumModelMetadata,
  ): SchemaObject {
    const obj = {
      title: name,
      description: model.description,
      type: model.type as "number" | "string",
      enum: model.values,
    };
    builder.addSchema(name, obj);
    return obj;
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
  private addControllerApi(
    name: string,
    ctrl: ControllerMetadata,
    allPaths: MapExt<string, PathItemObject>,
    allModels: Map<string, ModelMetadata>,
  ): boolean {
    let usesBearerAuth = false;
    ctrl.methods.forEach(method => {
      const url = ctrl.baseUrl + method.path;
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
            const modelMeta = MODEL_METADATA.get(responseMeta.ref);
            if (modelMeta) {
              allModels.set(responseMeta.ref, modelMeta);
              responses[responseMeta.code].content = {
                "application/json": {
                  schema: {
                    $ref: `#/components/schemas/${responseMeta.ref}`,
                  },
                },
              };
            } else {
              responses[responseMeta.code].content = {
                "application/json": {
                  schema: {
                    type: "object",
                  },
                },
              };
            }
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
          const modelMeta = MODEL_METADATA.get(method.requestBodyRef);
          if (modelMeta) {
            allModels.set(method.requestBodyRef, modelMeta);
          }
        }
      }

      const callbacks: CallbacksObject = {
        onEvent: {},
      };

      method.callbackRefs.forEach((ref, callbackUrl) => {
        const modelMeta = MODEL_METADATA.get(ref);
        if (modelMeta) {
          allModels.set(ref, modelMeta);
        }
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
      const item = <Record<string, unknown>>(pathItem[methodType] = {
        responses,
        requestBody,
        tags: [ctrl.endpointName],
      });

      item["x-controller-name"] = name;
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
    });

    return usesBearerAuth;
  }
}

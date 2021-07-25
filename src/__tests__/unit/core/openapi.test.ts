import axios from "axios";
import {
  OpenAPIObject,
  ParameterObject,
  PathItemObject,
  SchemaObject,
} from "openapi3-ts";
import path from "path";
import {
  arrayProperty,
  bearerAuth,
  callback,
  controller,
  del,
  description,
  enumProperty,
  get,
  HttpStatus,
  MicroserviceContext,
  model,
  patch,
  pathParameter,
  post,
  property,
  put,
  queryParameter,
  requestBody,
  response,
  responseBody,
  summary,
  webhookCallback,
} from "../../..";
import {MicroserviceComponentInstance} from "../../../core/app";
import {MicroserviceHttpServer} from "../../../core/http-server";
import {OpenApi} from "../../../core/openapi";

const TEST_MODEL_DESCRIPTION = "The test model.";
const TEST_SUB_MODEL_DESCRIPTION = "The test sub-model.";
const TEST_MODEL_PROPERTY_DESCRIPTION = "A string property." + Math.random();

const TEST_CONTROLLER_PATH = "/api/pathTest";
const TEST_CONTROLLER_DESCRIPTION = "The test controller.";

const STRING_PATH_PARAM_NAME = "stringPathArgument";
const NUMBER_PATH_PARAM_NAME = "numberPathArgument";
const BOOLEAN_PATH_PARAM_NAME = "booleanPathArgument";
const OBJECT_PATH_PARAM_NAME = "objectPathArgument";
const NO_MODEL_PATH_PARAM_NAME = "noModelPathArgument";
const PATH_PARAM_DESCRIPTION_TEXT = "This is a path parameter" + Math.random();
const ROOT_METHOD_PATH = `/${STRING_PATH_PARAM_NAME}`;
const REST_METHOD_PATH_STRING_ARG = `/testMethod/${STRING_PATH_PARAM_NAME}`;
const REST_METHOD_PATH_OBJECT_ARG = `/testMethod/${OBJECT_PATH_PARAM_NAME}`;
const REST_METHOD_PATH_NO_MODEL_ARG = `/testMethod/${NO_MODEL_PATH_PARAM_NAME}`;
const REST_METHOD_PATH_NUMBER_ARG = `/testMethod/${NUMBER_PATH_PARAM_NAME}`;
const REST_METHOD_PATH_BOOLEAN_ARG = `/testMethod/${BOOLEAN_PATH_PARAM_NAME}`;
const WEBHOOK_SUBSCRIBE_METHOD_PATH = `/webhook/subscribe/${STRING_PATH_PARAM_NAME}`;
const WEBHOOK_CALLBACK_METHOD_PATH = `/webhook/callback/${STRING_PATH_PARAM_NAME}`;
const TEST_SUMMARY_TEXT = "This is the summary " + Math.random();
const TEST_DESCRIPTION_TEXT = "This is the description" + Math.random();
const STRING_QUERY_PARAMETER_NAME = "stringQueryParamName";
const NUMBER_QUERY_PARAMETER_NAME = "stringQueryParamName";
const BOOLEAN_QUERY_PARAMETER_NAME = "stringQueryParamName";
const QUERY_PARAMETER_DESC = "Query parameter description" + Math.random();
const CUSTOM_HTTP_ERROR = 418;
const CUSTOM_HTTP_ERROR_TEXT = "I am a teapot!!";

export enum TestStringEnum {
  EnumValueA = "valA",
  EnumValueB = "valB",
  EnumValueC = "valC",
}

export enum TestNumberEnum {
  EnumValue1 = 1,
  EnumValue2 = 2,
  EnumValue3 = 3,
}

@model("A test model")
class CallbackModel {
  @property(TEST_MODEL_PROPERTY_DESCRIPTION)
  stringProp?: string;
}

class UnknownModel {}

@model(TEST_SUB_MODEL_DESCRIPTION)
class TestSubModel {
  @property(TEST_MODEL_PROPERTY_DESCRIPTION)
  stringProp?: string;
}

@model(TEST_MODEL_DESCRIPTION)
class TestModel {
  @property(TEST_MODEL_PROPERTY_DESCRIPTION)
  stringProp?: string;

  @property(TEST_MODEL_PROPERTY_DESCRIPTION)
  numberProp?: number;

  @property(TEST_MODEL_PROPERTY_DESCRIPTION)
  booleanProp?: boolean;

  @property(TEST_MODEL_PROPERTY_DESCRIPTION)
  objectProp?: Object;

  @property(TEST_MODEL_PROPERTY_DESCRIPTION)
  unknownModelProp?: UnknownModel; // unknown models must become objects

  @property(TEST_MODEL_PROPERTY_DESCRIPTION)
  modelProp?: TestSubModel;

  @arrayProperty(String, TEST_MODEL_PROPERTY_DESCRIPTION)
  stringArrayProp?: string[];

  @arrayProperty(Number, TEST_MODEL_PROPERTY_DESCRIPTION)
  numberArrayProp?: string[];

  @arrayProperty(Boolean, TEST_MODEL_PROPERTY_DESCRIPTION)
  booleanArrayProp?: string[];

  @arrayProperty(TestSubModel, TEST_MODEL_PROPERTY_DESCRIPTION)
  objectArrayProp?: TestSubModel[];

  @enumProperty("TestStringEnum", TestStringEnum)
  stringEnumProp?: TestStringEnum;

  @enumProperty("TestNumberEnum", TestNumberEnum)
  numberEnumProp?: TestNumberEnum;
}

/* this must not appear on openapi.json as it is not decorated with anything */
class NoTestModel {
  dummy?: string;
}

@controller(TEST_CONTROLLER_DESCRIPTION, TEST_CONTROLLER_PATH)
class TestController {
  @get(ROOT_METHOD_PATH)
  @bearerAuth([])
  @summary(TEST_SUMMARY_TEXT)
  @description(TEST_DESCRIPTION_TEXT)
  @pathParameter(STRING_PATH_PARAM_NAME, String, PATH_PARAM_DESCRIPTION_TEXT)
  @pathParameter(STRING_PATH_PARAM_NAME, TestModel, PATH_PARAM_DESCRIPTION_TEXT) // unsupported complex type, must not be on openapi.json
  @queryParameter(
    STRING_QUERY_PARAMETER_NAME,
    String,
    true,
    QUERY_PARAMETER_DESC,
  )
  @queryParameter(
    STRING_QUERY_PARAMETER_NAME,
    TestModel, // unsupported complex type, must not be on openapi.json
    true,
    QUERY_PARAMETER_DESC,
  )
  @requestBody(TestModel)
  @responseBody(TestModel)
  @response(CUSTOM_HTTP_ERROR, CUSTOM_HTTP_ERROR_TEXT)
  static get_root(): void {
    return;
  }

  @get(REST_METHOD_PATH_STRING_ARG)
  @bearerAuth([])
  @summary(TEST_SUMMARY_TEXT)
  @description(TEST_DESCRIPTION_TEXT)
  @pathParameter(STRING_PATH_PARAM_NAME, String, PATH_PARAM_DESCRIPTION_TEXT)
  @queryParameter(
    STRING_QUERY_PARAMETER_NAME,
    String,
    true,
    QUERY_PARAMETER_DESC,
  )
  @requestBody(TestModel)
  @responseBody(TestModel)
  @response(CUSTOM_HTTP_ERROR, CUSTOM_HTTP_ERROR_TEXT)
  static get(): void {
    return;
  }

  @get(REST_METHOD_PATH_OBJECT_ARG)
  @bearerAuth([])
  @summary(TEST_SUMMARY_TEXT)
  @description(TEST_DESCRIPTION_TEXT)
  @pathParameter(STRING_PATH_PARAM_NAME, String, PATH_PARAM_DESCRIPTION_TEXT)
  @queryParameter(
    STRING_QUERY_PARAMETER_NAME,
    String,
    true,
    QUERY_PARAMETER_DESC,
  )
  @requestBody(Object)
  @responseBody(Object)
  @response(CUSTOM_HTTP_ERROR, CUSTOM_HTTP_ERROR_TEXT)
  static get_object(): void {
    return;
  }

  @get(REST_METHOD_PATH_NO_MODEL_ARG)
  @bearerAuth([])
  @summary(TEST_SUMMARY_TEXT)
  @description(TEST_DESCRIPTION_TEXT)
  @pathParameter(STRING_PATH_PARAM_NAME, String, PATH_PARAM_DESCRIPTION_TEXT)
  @queryParameter(
    STRING_QUERY_PARAMETER_NAME,
    String,
    true,
    QUERY_PARAMETER_DESC,
  )
  @requestBody(NoTestModel) // NoTestModel must convert to object type as it is not decorated
  @responseBody(NoTestModel) // NoTestModel must convert to object type as it is not decorated
  @response(CUSTOM_HTTP_ERROR, CUSTOM_HTTP_ERROR_TEXT)
  static get_no_model(): void {
    return;
  }

  @put(REST_METHOD_PATH_NUMBER_ARG)
  @bearerAuth([])
  @summary(TEST_SUMMARY_TEXT)
  @description(TEST_DESCRIPTION_TEXT)
  @pathParameter(NUMBER_PATH_PARAM_NAME, Number, PATH_PARAM_DESCRIPTION_TEXT)
  @queryParameter(
    NUMBER_QUERY_PARAMETER_NAME,
    Number,
    true,
    QUERY_PARAMETER_DESC,
  )
  @requestBody(TestModel)
  @responseBody(TestModel)
  @response(CUSTOM_HTTP_ERROR, CUSTOM_HTTP_ERROR_TEXT)
  static put(): void {
    return;
  }

  @post(REST_METHOD_PATH_BOOLEAN_ARG)
  @bearerAuth([])
  @summary(TEST_SUMMARY_TEXT)
  @description(TEST_DESCRIPTION_TEXT)
  @pathParameter(BOOLEAN_PATH_PARAM_NAME, Boolean, PATH_PARAM_DESCRIPTION_TEXT)
  @queryParameter(
    NUMBER_QUERY_PARAMETER_NAME,
    Number,
    true,
    QUERY_PARAMETER_DESC,
  )
  @requestBody(TestModel)
  @responseBody(TestModel)
  @response(CUSTOM_HTTP_ERROR, CUSTOM_HTTP_ERROR_TEXT)
  static post(): void {
    return;
  }

  @patch(REST_METHOD_PATH_STRING_ARG)
  @bearerAuth([])
  @summary(TEST_SUMMARY_TEXT)
  @description(TEST_DESCRIPTION_TEXT)
  @pathParameter(STRING_PATH_PARAM_NAME, String, PATH_PARAM_DESCRIPTION_TEXT)
  @queryParameter(
    BOOLEAN_QUERY_PARAMETER_NAME,
    Boolean,
    true,
    QUERY_PARAMETER_DESC,
  )
  @requestBody(TestModel)
  @responseBody(TestModel)
  @response(CUSTOM_HTTP_ERROR, CUSTOM_HTTP_ERROR_TEXT)
  static patch(): void {
    return;
  }

  @del(REST_METHOD_PATH_STRING_ARG)
  @bearerAuth([])
  @pathParameter(STRING_PATH_PARAM_NAME, String, PATH_PARAM_DESCRIPTION_TEXT)
  @queryParameter(
    STRING_QUERY_PARAMETER_NAME,
    String,
    true,
    QUERY_PARAMETER_DESC,
  )
  @summary(TEST_SUMMARY_TEXT)
  @description(TEST_DESCRIPTION_TEXT)
  @requestBody(TestModel)
  @responseBody(TestModel)
  @response(CUSTOM_HTTP_ERROR, CUSTOM_HTTP_ERROR_TEXT)
  static del(): void {
    return;
  }

  @post(WEBHOOK_SUBSCRIBE_METHOD_PATH)
  @bearerAuth([])
  @summary(TEST_SUMMARY_TEXT)
  @description(TEST_DESCRIPTION_TEXT)
  @pathParameter(STRING_PATH_PARAM_NAME, String, PATH_PARAM_DESCRIPTION_TEXT)
  @queryParameter(STRING_PATH_PARAM_NAME, String, true, QUERY_PARAMETER_DESC)
  @requestBody(TestModel)
  @responseBody(TestModel)
  @response(CUSTOM_HTTP_ERROR, CUSTOM_HTTP_ERROR_TEXT)
  @callback("{$request.body#/callbackUrl}", CallbackModel)
  static subscribe(): void {
    return;
  }

  @webhookCallback(WEBHOOK_CALLBACK_METHOD_PATH)
  @bearerAuth([])
  @summary(TEST_SUMMARY_TEXT)
  @description(TEST_DESCRIPTION_TEXT)
  @pathParameter(STRING_PATH_PARAM_NAME, String, PATH_PARAM_DESCRIPTION_TEXT)
  @queryParameter(STRING_PATH_PARAM_NAME, String, true, QUERY_PARAMETER_DESC)
  @requestBody(TestModel)
  @responseBody(TestModel)
  @response(CUSTOM_HTTP_ERROR, CUSTOM_HTTP_ERROR_TEXT)
  static callback(): void {
    return;
  }

  @post("/noMetadata")
  static noMetadata(): void {
    return;
  }
}

/* this must not appear on openapi.json as it is not decorated with anything */
class NoTestController {
  static dummy(): void {}
}

describe("Test decorators and OpenAPI", () => {
  const context = new MicroserviceContext(
    path.resolve(__dirname, "../../../.."),
  );

  beforeAll(async () => {
    await context.boot();
  });

  test("Verify info", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
        {
          type: NoTestController,
          instance: new NoTestController(),
          running: true,
        },
      ];

      const server = new MicroserviceHttpServer(context, controllers);
      const openApiGenerator = new OpenApi(context, controllers, server);

      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);
          axios
            .get<void>(`http://127.0.0.1:${server.listeningPort}/openapi.json`)
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              const openapi = (<unknown>res.data) as OpenAPIObject;

              expect(openapi.info.title).toBe(context.config.NAME);
              expect(openapi.info.version).toBe(context.config.VERSION);

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
          server.stop();
        });
    });
  });

  test("Verify paths", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      const openApiGenerator = new OpenApi(context, controllers, server);

      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);
          axios
            .get<void>(`http://127.0.0.1:${server.listeningPort}/openapi.json`)
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);

              const verifyPathObject = (
                obj: PathItemObject,
                operationName: string,
                path: string,
              ): void => {
                expect(obj).toBeDefined();
                expect(obj["x-controller-name"]).toEqual("TestController");
                expect(obj["x-operation-name"]).toEqual(operationName);
                expect(obj.tags.length).toEqual(1);
                expect(obj.tags[0]).toEqual(TEST_CONTROLLER_DESCRIPTION);
                expect(obj.operationId).toEqual(operationName);
                expect(obj.summary).toEqual(TEST_SUMMARY_TEXT);
                expect(obj.description).toEqual(TEST_DESCRIPTION_TEXT);
                expect(obj.security.length).toEqual(1);
                expect(obj.security[0]).toEqual({bearerAuth: []});

                expect(obj.responses[200].description).toEqual("OK");
                if (
                  operationName === "get_object" ||
                  operationName === "get_no_model"
                ) {
                  expect(
                    obj.responses[200]["content"]["application/json"]["schema"]
                      ?.type,
                  ).toEqual("object");
                } else {
                  expect(
                    obj.responses[200]["content"]["application/json"]["schema"][
                      "$ref"
                    ],
                  ).toEqual("#/components/schemas/TestModel");
                }

                expect(obj.responses[CUSTOM_HTTP_ERROR].description).toEqual(
                  CUSTOM_HTTP_ERROR_TEXT,
                );

                expect(obj.parameters?.length).toEqual(2);

                obj.parameters?.forEach(param => {
                  expect(param).toBeDefined();
                  const pathParam = param as ParameterObject;
                  if (pathParam?.in === "path") {
                    expect(pathParam.description).toEqual(
                      PATH_PARAM_DESCRIPTION_TEXT,
                    );
                    switch (path) {
                      case ROOT_METHOD_PATH:
                      case REST_METHOD_PATH_STRING_ARG:
                        expect(pathParam.name).toEqual(STRING_PATH_PARAM_NAME);
                        break;
                      case REST_METHOD_PATH_NUMBER_ARG:
                        expect(pathParam.name).toEqual(NUMBER_PATH_PARAM_NAME);
                        break;
                      case REST_METHOD_PATH_BOOLEAN_ARG:
                        expect(pathParam.name).toEqual(BOOLEAN_PATH_PARAM_NAME);
                        break;
                    }
                    expect(pathParam.required).toEqual(true);
                  } else if (pathParam?.in === "query") {
                    switch (path) {
                      case ROOT_METHOD_PATH:
                      case REST_METHOD_PATH_STRING_ARG:
                        expect(pathParam.name).toEqual(
                          STRING_QUERY_PARAMETER_NAME,
                        );
                        break;
                      case REST_METHOD_PATH_NUMBER_ARG:
                        expect(pathParam.name).toEqual(
                          NUMBER_QUERY_PARAMETER_NAME,
                        );
                        break;
                      case REST_METHOD_PATH_BOOLEAN_ARG:
                        expect(pathParam.name).toEqual(
                          BOOLEAN_QUERY_PARAMETER_NAME,
                        );
                        break;
                    }
                  } else {
                    reject();
                  }
                });
              };

              const openapi = (<unknown>res.data) as OpenAPIObject;

              let path = openapi.paths[TEST_CONTROLLER_PATH + ROOT_METHOD_PATH][
                "get"
              ] as PathItemObject;
              verifyPathObject(path, "get_root", ROOT_METHOD_PATH);

              path = openapi.paths[
                TEST_CONTROLLER_PATH + REST_METHOD_PATH_STRING_ARG
              ]["get"] as PathItemObject;
              verifyPathObject(path, "get", REST_METHOD_PATH_STRING_ARG);

              path = openapi.paths[
                TEST_CONTROLLER_PATH + REST_METHOD_PATH_OBJECT_ARG
              ]["get"] as PathItemObject;
              verifyPathObject(path, "get_object", REST_METHOD_PATH_OBJECT_ARG);

              path = openapi.paths[
                TEST_CONTROLLER_PATH + REST_METHOD_PATH_NO_MODEL_ARG
              ]["get"] as PathItemObject;
              verifyPathObject(
                path,
                "get_no_model",
                REST_METHOD_PATH_OBJECT_ARG,
              );

              path = openapi.paths[
                TEST_CONTROLLER_PATH + REST_METHOD_PATH_NUMBER_ARG
              ]["put"] as PathItemObject;
              verifyPathObject(path, "put", REST_METHOD_PATH_NUMBER_ARG);

              path = openapi.paths[
                TEST_CONTROLLER_PATH + REST_METHOD_PATH_BOOLEAN_ARG
              ]["post"] as PathItemObject;
              verifyPathObject(path, "post", REST_METHOD_PATH_BOOLEAN_ARG);

              path = openapi.paths[
                TEST_CONTROLLER_PATH + REST_METHOD_PATH_STRING_ARG
              ]["patch"] as PathItemObject;
              verifyPathObject(path, "patch", REST_METHOD_PATH_STRING_ARG);

              path = openapi.paths[
                TEST_CONTROLLER_PATH + REST_METHOD_PATH_STRING_ARG
              ]["delete"] as PathItemObject;
              verifyPathObject(path, "del", REST_METHOD_PATH_STRING_ARG);

              path = openapi.paths[
                TEST_CONTROLLER_PATH + WEBHOOK_SUBSCRIBE_METHOD_PATH
              ]["post"] as PathItemObject;
              verifyPathObject(
                path,
                "subscribe",
                WEBHOOK_SUBSCRIBE_METHOD_PATH,
              );
              expect(
                path.callbacks?.onEvent["{$request.body#/callbackUrl}"]["post"][
                  "requestBody"
                ]["content"]["application/json"]["schema"]["$ref"],
              ).toEqual("#/components/schemas/CallbackModel");

              path = openapi.paths[
                TEST_CONTROLLER_PATH + WEBHOOK_CALLBACK_METHOD_PATH
              ]["post"] as PathItemObject;
              verifyPathObject(path, "callback", WEBHOOK_CALLBACK_METHOD_PATH);

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
          server.stop();
        });
    });
  });

  test("Verify models", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      const openApiGenerator = new OpenApi(context, controllers, server);

      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);
          resolve();
          axios
            .get<void>(`http://127.0.0.1:${server.listeningPort}/openapi.json`)
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);

              const openapi = (<unknown>res.data) as OpenAPIObject;

              if (!openapi?.components?.schemas) {
                reject();
                return;
              }

              const testModel = openapi.components.schemas
                .TestModel as SchemaObject;
              expect(testModel).toBeDefined();

              expect(testModel.type).toEqual("object");
              expect(testModel.title).toEqual("TestModel");
              expect(testModel.description).toEqual(TEST_MODEL_DESCRIPTION);
              expect(testModel.properties).toBeDefined();

              if (testModel.properties) {
                const stringProp = testModel.properties[
                  "stringProp"
                ] as SchemaObject;
                expect(stringProp.type).toEqual("string");
                expect(stringProp.description).toEqual(
                  TEST_MODEL_PROPERTY_DESCRIPTION,
                );

                const numberProp = testModel.properties[
                  "numberProp"
                ] as SchemaObject;
                expect(numberProp.type).toEqual("number");
                expect(numberProp.description).toEqual(
                  TEST_MODEL_PROPERTY_DESCRIPTION,
                );

                const booleanProp = testModel.properties[
                  "booleanProp"
                ] as SchemaObject;
                expect(booleanProp.type).toEqual("boolean");
                expect(booleanProp.description).toEqual(
                  TEST_MODEL_PROPERTY_DESCRIPTION,
                );

                const objectProp = testModel.properties[
                  "objectProp"
                ] as SchemaObject;
                expect(objectProp.type).toEqual("object");
                expect(objectProp.description).toEqual(
                  TEST_MODEL_PROPERTY_DESCRIPTION,
                );

                const unknownModelProp = testModel.properties[
                  "unknownModelProp"
                ] as SchemaObject;
                expect(unknownModelProp.type).toEqual("object"); // unknown models must become objects
                expect(unknownModelProp.description).toEqual(
                  TEST_MODEL_PROPERTY_DESCRIPTION,
                );

                const modelProp = testModel.properties[
                  "modelProp"
                ] as SchemaObject;
                expect(modelProp["$ref"]).toEqual(
                  "#/components/schemas/TestSubModel",
                );
                expect(modelProp.description).toEqual(
                  TEST_MODEL_PROPERTY_DESCRIPTION,
                );

                const stringArrayProp = testModel.properties[
                  "stringArrayProp"
                ] as SchemaObject;
                expect(stringArrayProp.type).toEqual("array");
                expect(stringArrayProp.description).toEqual(
                  TEST_MODEL_PROPERTY_DESCRIPTION,
                );
                expect(stringArrayProp.items).toEqual({type: "string"});

                const numberArrayProp = testModel.properties[
                  "numberArrayProp"
                ] as SchemaObject;
                expect(numberArrayProp.type).toEqual("array");
                expect(numberArrayProp.description).toEqual(
                  TEST_MODEL_PROPERTY_DESCRIPTION,
                );
                expect(numberArrayProp.items).toEqual({type: "number"});

                const objectArrayProp = testModel.properties[
                  "objectArrayProp"
                ] as SchemaObject;
                expect(objectArrayProp.type).toEqual("array");
                expect(objectArrayProp.description).toEqual(
                  TEST_MODEL_PROPERTY_DESCRIPTION,
                );
                expect(objectArrayProp.items).toBeDefined();
                const items = objectArrayProp.items as SchemaObject;
                if (items) {
                  expect(items["type"]).toEqual("object");
                  expect(items["$ref"]).toEqual(
                    "#/components/schemas/TestSubModel",
                  );
                }

                const stringEnumProp = testModel.properties[
                  "stringEnumProp"
                ] as SchemaObject;
                expect(stringEnumProp.type).toEqual("string");
                expect(stringEnumProp.title).toEqual("TestStringEnum");
                expect(stringEnumProp.enum).toEqual([
                  TestStringEnum.EnumValueA,
                  TestStringEnum.EnumValueB,
                  TestStringEnum.EnumValueC,
                ]);

                const numberEnumProp = testModel.properties[
                  "numberEnumProp"
                ] as SchemaObject;
                expect(numberEnumProp.type).toEqual("number");
                expect(numberEnumProp.title).toEqual("TestNumberEnum");
                expect(numberEnumProp.enum).toEqual([
                  TestNumberEnum.EnumValue1,
                  TestNumberEnum.EnumValue2,
                  TestNumberEnum.EnumValue3,
                ]);
              }

              const testSubModel = openapi.components.schemas
                .TestSubModel as SchemaObject;
              expect(testSubModel).toBeDefined();

              if (testSubModel.properties) {
                const stringProp = testSubModel.properties[
                  "stringProp"
                ] as SchemaObject;
                expect(stringProp.type).toEqual("string");
                expect(stringProp.description).toEqual(
                  TEST_MODEL_PROPERTY_DESCRIPTION,
                );
              }

              const callbackModel = openapi.components.schemas
                .CallbackModel as SchemaObject;
              expect(testModel).toBeDefined();

              expect(callbackModel.type).toEqual("object");
              expect(callbackModel.title).toEqual("CallbackModel");
              expect(callbackModel.description).toEqual(TEST_MODEL_DESCRIPTION);
              expect(callbackModel.properties).toBeDefined();

              if (callbackModel.properties) {
                const stringProp = callbackModel.properties[
                  "stringProp"
                ] as SchemaObject;
                expect(stringProp.type).toEqual("string");
                expect(stringProp.description).toEqual(
                  TEST_MODEL_PROPERTY_DESCRIPTION,
                );
              }

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
          server.stop();
        });
    });
  });

  test("Download SwaggerUI index.html", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      const openApiGenerator = new OpenApi(context, controllers, server);

      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);
          axios
            .get<void>(`http://127.0.0.1:${server.listeningPort}/`)
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.data).toBeDefined();
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
          server.stop();
        });
    });
  });

  test("Download SwaggerUI swagger-ui.css", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      const openApiGenerator = new OpenApi(context, controllers, server);

      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);
          axios
            .get<void>(
              `http://127.0.0.1:${server.listeningPort}/swagger-ui.css`,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.data).toBeDefined();
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
          server.stop();
        });
    });
  });

  test("Download SwaggerUI swagger-ui-bundle.js", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      const openApiGenerator = new OpenApi(context, controllers, server);

      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);
          axios
            .get<void>(
              `http://127.0.0.1:${server.listeningPort}/swagger-ui-bundle.js`,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.data).toBeDefined();
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
          server.stop();
        });
    });
  });

  test("Download SwaggerUI swagger-ui-standalone-preset.jss", () => {
    return new Promise<void>((resolve, reject) => {
      const controllers: MicroserviceComponentInstance[] = [
        {
          type: TestController,
          instance: new TestController(),
          running: true,
        },
      ];
      const server = new MicroserviceHttpServer(context, controllers);
      const openApiGenerator = new OpenApi(context, controllers, server);

      server
        .start()
        .then(() => {
          expect(server.listeningPort).not.toEqual(0);
          axios
            .get<void>(
              `http://127.0.0.1:${server.listeningPort}/swagger-ui-standalone-preset.js`,
            )
            .then(res => {
              expect(res.status).toBe(HttpStatus.OK);
              expect(res.data).toBeDefined();
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
          server.stop();
        });
    });
  });
});

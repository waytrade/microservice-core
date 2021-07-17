import {
  arrayProperty,
  bearerAuth,
  callback,
  description,
  get,
  model,
  pathParameter,
  post,
  property,
  put,
  queryParameter,
  response,
  responseBody,
  summary,
} from "../../..";
import {CONTROLLER_METADATA, MODEL_METADATA} from "../../../core/metadata";
import {controller} from "../../../decorators/controller.decorator";
import {del, patch} from "../../../decorators/operation.decorator";
import {enumProperty} from "../../../decorators/property.decorator";
import {requestBody} from "../../../decorators/request-body.decorator";
import {websocket} from "../../../decorators/websocket.decorator";

const TEST_MODEL_DESCRIPTION = "Description " + Math.random();
@model(TEST_MODEL_DESCRIPTION)
class TestModel {}

const TEST_MODEL_STRING_PROPERTY_DESCRIPTION = "Description " + Math.random();
class TestModel_stringProp {
  @property(TEST_MODEL_STRING_PROPERTY_DESCRIPTION)
  stringProp?: string;
}

const TEST_MODEL_ARRAY_PROPERTY_DESCRIPTION = "Description " + Math.random();
class TestModel_arrayProp {
  @arrayProperty(String, TEST_MODEL_ARRAY_PROPERTY_DESCRIPTION)
  arrayProp?: [string];
}

enum TestEnum {
  ValA = "ValA",
  ValB = "ValB",
  ValC = "ValC",
}

const TEST_MODEL_ENUM_PROPERTY_DESCRIPTION = "Description " + Math.random();
class TestModel_enumProp {
  @enumProperty("TestEnum", TestEnum, TEST_MODEL_ENUM_PROPERTY_DESCRIPTION)
  enumProp?: [string];
}

const TEST_CONTROLLER_NAME = "My test controller";
const TEST_CONTROLLER_ENDPOINT_PATH = "/endpoint/url";
@controller(TEST_CONTROLLER_NAME, "endpoint/url") // we skip the leading / by intention, framework must add it
class TestController {}

class TestController_get {
  @get("/")
  static testMethod() {
    return;
  }
}

class TestController_put {
  @put("/")
  static testMethod() {
    return;
  }
}

class TestController_post {
  @post("/")
  static testMethod() {
    return;
  }
}

class TestController_patch {
  @patch("/")
  static testMethod() {
    return;
  }
}

class TestController_del {
  @del("/")
  static testMethod() {
    return;
  }
}

class TestController_bearerAuth {
  @bearerAuth([])
  static testMethod() {
    return;
  }
}

const TEST_CONTROLLER_CALLBACK_URL = "/some/url/" + Math.random();
class TestController_callback {
  @callback(TEST_CONTROLLER_CALLBACK_URL, TestModel)
  static testMethod() {
    return;
  }
}

const TEST_CONTROLLER_METHOD_DESCRIPTION = "Description " + Math.random();
class TestController_description {
  @description(TEST_CONTROLLER_METHOD_DESCRIPTION)
  static testMethod() {
    return;
  }
}

const TEST_CONTROLLER_PATH_PARAM_NAME = "pathParamName";
const TEST_CONTROLLER_PATH_PARAM_DESCRIPTION = "Description " + Math.random();
class TestController_pathParameter {
  @pathParameter(
    TEST_CONTROLLER_PATH_PARAM_NAME,
    String,
    TEST_CONTROLLER_PATH_PARAM_DESCRIPTION,
  )
  static testMethod() {
    return;
  }
}

const TEST_CONTROLLER_QUERY_PARAM_NAME = "queryParamName";
const TEST_CONTROLLER_QUERY_PARAM_DESCRIPTION = "Description " + Math.random();
class TestController_queryParameter {
  @queryParameter(
    TEST_CONTROLLER_QUERY_PARAM_NAME,
    String,
    true,
    TEST_CONTROLLER_QUERY_PARAM_DESCRIPTION,
  )
  static testMethod() {
    return;
  }
}

class TestController_requestBody {
  @requestBody(TestModel)
  static testMethod() {
    return;
  }
}

class TestController_responseBody {
  @responseBody(TestModel)
  static testMethod() {
    return;
  }
}

const TEST_CONTROLLER_RESPONSE_CODE = 500;
const TEST_CONTROLLER_RESPONSE_DESCRIPTION = "Description " + Math.random();
class TestController_response {
  @response(TEST_CONTROLLER_RESPONSE_CODE, TEST_CONTROLLER_RESPONSE_DESCRIPTION)
  static testMethod() {
    return;
  }
}

const TEST_CONTROLLER_METHOD_SUMMARY = "Summary " + Math.random();
class TestController_summary {
  @summary(TEST_CONTROLLER_METHOD_SUMMARY)
  static testMethod() {
    return;
  }
}

const TEST_CONTROLLER_WEBSOCKET_PATH = "/some/path ";
class TestController_websocket {
  @websocket(TEST_CONTROLLER_WEBSOCKET_PATH)
  static testMethod() {
    return;
  }
}

describe("Test decorator metadata ", () => {
  test("Verify CONTROLLER_METADATA", () => {
    let controllerMetadata = CONTROLLER_METADATA.get("TestController");
    expect(controllerMetadata?.endpointName).toEqual(TEST_CONTROLLER_NAME);
    expect(controllerMetadata?.baseUrl).toEqual(TEST_CONTROLLER_ENDPOINT_PATH);

    controllerMetadata = CONTROLLER_METADATA.get("TestController_get");
    expect(controllerMetadata).toBeDefined();
    let methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.method).toEqual("get");
    expect(methodMetadata?.contentType).toEqual("application/json");
    expect(methodMetadata?.propertyKey).toEqual("testMethod");
    expect(methodMetadata?.path).toEqual("/");

    controllerMetadata = CONTROLLER_METADATA.get("TestController_put");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.method).toEqual("put");
    expect(methodMetadata?.contentType).toEqual("application/json");
    expect(methodMetadata?.propertyKey).toEqual("testMethod");
    expect(methodMetadata?.path).toEqual("/");

    controllerMetadata = CONTROLLER_METADATA.get("TestController_post");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.method).toEqual("post");
    expect(methodMetadata?.contentType).toEqual("application/json");
    expect(methodMetadata?.propertyKey).toEqual("testMethod");
    expect(methodMetadata?.path).toEqual("/");

    controllerMetadata = CONTROLLER_METADATA.get("TestController_patch");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.method).toEqual("patch");
    expect(methodMetadata?.contentType).toEqual("application/json");
    expect(methodMetadata?.propertyKey).toEqual("testMethod");
    expect(methodMetadata?.path).toEqual("/");

    controllerMetadata = CONTROLLER_METADATA.get("TestController_del");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.method).toEqual("delete");
    expect(methodMetadata?.contentType).toEqual("application/json");
    expect(methodMetadata?.propertyKey).toEqual("testMethod");
    expect(methodMetadata?.path).toEqual("/");

    controllerMetadata = CONTROLLER_METADATA.get("TestController_bearerAuth");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.bearerAuthScopes).toEqual([]);

    controllerMetadata = CONTROLLER_METADATA.get("TestController_callback");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.callbackRefs?.size).toEqual(1);
    expect(
      methodMetadata?.callbackRefs?.get(TEST_CONTROLLER_CALLBACK_URL),
    ).toEqual("TestModel");

    controllerMetadata = CONTROLLER_METADATA.get("TestController_description");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.description).toEqual(
      TEST_CONTROLLER_METHOD_DESCRIPTION,
    );

    controllerMetadata = CONTROLLER_METADATA.get(
      "TestController_pathParameter",
    );
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.queryParams?.length).toEqual(1);
    expect(methodMetadata?.queryParams[0].name).toEqual(
      TEST_CONTROLLER_PATH_PARAM_NAME,
    );
    expect(methodMetadata?.queryParams[0].type).toEqual("string");
    expect(methodMetadata?.queryParams[0].inType).toEqual("path");
    expect(methodMetadata?.queryParams[0].required).toBeTruthy();
    expect(methodMetadata?.queryParams[0].description).toEqual(
      TEST_CONTROLLER_PATH_PARAM_DESCRIPTION,
    );

    controllerMetadata = CONTROLLER_METADATA.get(
      "TestController_queryParameter",
    );
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.queryParams?.length).toEqual(1);
    expect(methodMetadata?.queryParams[0].name).toEqual(
      TEST_CONTROLLER_QUERY_PARAM_NAME,
    );
    expect(methodMetadata?.queryParams[0].type).toEqual("string");
    expect(methodMetadata?.queryParams[0].inType).toEqual("query");
    expect(methodMetadata?.queryParams[0].required).toBeTruthy();
    expect(methodMetadata?.queryParams[0].description).toEqual(
      TEST_CONTROLLER_QUERY_PARAM_DESCRIPTION,
    );

    controllerMetadata = CONTROLLER_METADATA.get("TestController_requestBody");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.requestBodyRef).toEqual("TestModel");

    controllerMetadata = CONTROLLER_METADATA.get("TestController_responseBody");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.responses?.size).toEqual(1);
    expect(methodMetadata?.responses?.get(200)?.code).toEqual(200);
    expect(methodMetadata?.responses?.get(200)?.ref).toEqual("TestModel");

    controllerMetadata = CONTROLLER_METADATA.get("TestController_response");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.responses?.size).toEqual(1);
    expect(
      methodMetadata?.responses?.get(TEST_CONTROLLER_RESPONSE_CODE)?.code,
    ).toEqual(TEST_CONTROLLER_RESPONSE_CODE);
    expect(
      methodMetadata?.responses?.get(TEST_CONTROLLER_RESPONSE_CODE)
        ?.description,
    ).toEqual(TEST_CONTROLLER_RESPONSE_DESCRIPTION);

    controllerMetadata = CONTROLLER_METADATA.get("TestController_summary");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.summary).toEqual(TEST_CONTROLLER_METHOD_SUMMARY);

    controllerMetadata = CONTROLLER_METADATA.get("TestController_websocket");
    expect(controllerMetadata).toBeDefined();
    methodMetadata = controllerMetadata?.methods.get("testMethod");
    expect(methodMetadata?.method).toEqual("get");
    expect(methodMetadata?.path).toEqual(TEST_CONTROLLER_WEBSOCKET_PATH);
    expect(methodMetadata?.contentType).toEqual("application/json");
  });

  test("Verify MODEL_METADATA", () => {
    let modelMetadata = MODEL_METADATA.get("TestModel");
    expect(modelMetadata).toBeDefined();
    expect(modelMetadata?.description).toEqual(TEST_MODEL_DESCRIPTION);

    modelMetadata = MODEL_METADATA.get("TestModel_stringProp");
    expect(modelMetadata).toBeDefined();
    expect(modelMetadata?.properties?.length).toEqual(1);
    expect(modelMetadata?.properties[0].type).toEqual("String");
    expect(modelMetadata?.properties[0].description).toEqual(
      TEST_MODEL_STRING_PROPERTY_DESCRIPTION,
    );
    expect(modelMetadata?.properties[0].propertyKey).toEqual("stringProp");

    modelMetadata = MODEL_METADATA.get("TestModel_arrayProp");
    expect(modelMetadata).toBeDefined();
    expect(modelMetadata?.properties?.length).toEqual(1);
    expect(modelMetadata?.properties[0].type).toEqual("Array");
    expect(modelMetadata?.properties[0].arrayItemType).toEqual("String");
    expect(modelMetadata?.properties[0].description).toEqual(
      TEST_MODEL_ARRAY_PROPERTY_DESCRIPTION,
    );
    expect(modelMetadata?.properties[0].propertyKey).toEqual("arrayProp");

    modelMetadata = MODEL_METADATA.get("TestModel_enumProp");
    expect(modelMetadata).toBeDefined();
    expect(modelMetadata?.properties?.length).toEqual(1);
    expect(modelMetadata?.properties[0].type).toEqual("TestEnum");
    expect(modelMetadata?.properties[0].description).toEqual(
      TEST_MODEL_ENUM_PROPERTY_DESCRIPTION,
    );
    expect(modelMetadata?.properties[0].propertyKey).toEqual("enumProp");
  });
});

import axios from "axios";
import {OpenAPIObject} from "openapi3-ts";
import {
  arrayProperty,
  controller,
  del,
  get,
  HttpError,
  HttpStatus,
  MicroserviceApp,
  model,
  patch,
  post,
  property,
  put,
  response,
  responseBody,
} from "../..";
import {MicroserviceRequest} from "../../core/server";
import {TestApp} from "../test-app";

/** The test controller response sub-model. */
@model("Test Controller SubResponse")
export class TestControllerSubResponse {
  @property()
  text?: string;

  @property()
  num?: number;
}

/** The test controller response model. */
@model("Test Controller Response")
export class TestControllerResponse {
  @property()
  text?: string;

  @property()
  num?: number;

  @property()
  sub?: TestControllerSubResponse;

  @arrayProperty(TestControllerSubResponse)
  subArray?: TestControllerSubResponse[];

  @arrayProperty(String)
  stringArray?: string[];
}

/** The test controller request model. */
@model("Test Controller Request")
export class TestControllerRequest {
  @property()
  message?: string;
}

/** The test controller */
@controller("Test Controller")
export class TestController {
  /** GET with synchronous response */
  @get("/")
  @response(200, "The test controller response")
  @responseBody(TestControllerResponse)
  get(): TestControllerResponse {
    return {text: "sync", num: 43};
  }

  /** DELETE that replies with 200. */
  @del("/")
  del(): void {}

  /** GET with asynchronous response */
  @get("/async")
  async async(): Promise<TestControllerResponse> {
    return {text: "async", num: 43};
  }

  /** GET with empty response */
  @get("/empty")
  empty(): void {}

  /** GET with synchronous error 500 and message */
  @get("/errorSync")
  error(): void {
    throw new Error("errorSyncText");
  }

  /** GET with asynchronous error 500 and message */
  @get("/errorAsync")
  async asyncError(): Promise<TestControllerResponse> {
    throw new Error("errorAsyncText");
  }

  /** GET with error 403 */
  @get("/error403")
  async error403(): Promise<TestControllerResponse> {
    throw new HttpError(403);
  }

  /** PUT that replies with 413 when message is "putData" */
  @put("/putData")
  putData(
    request: MicroserviceRequest,
    args: TestControllerRequest,
  ): TestControllerResponse {
    if (args.message !== "putData") {
      throw new HttpError(HttpStatus.IM_A_TEAPOT);
    }
    return {text: "putResponse", num: 43};
  }

  /** POST that replies with 413 when message is "postData" */
  @post("/postData")
  postData(
    request: MicroserviceRequest,
    args: TestControllerRequest,
  ): TestControllerResponse {
    if (args.message !== "postData") {
      throw new HttpError(HttpStatus.IM_A_TEAPOT);
    }
    return {text: "postResponse", num: 43};
  }

  /** PATCH that replies with 413 when message is "patchData" */
  @patch("/patchData")
  patchData(
    request: MicroserviceRequest,
    args: TestControllerRequest,
  ): TestControllerResponse {
    if (args.message !== "patchData") {
      throw new HttpError(HttpStatus.IM_A_TEAPOT);
    }
    return {text: "patchResponse", num: 43};
  }
}

/**
 * The REST server tests.
 */
describe("REST Server Tests", () => {
  const TEST_SERVER_CALLBACK_PORT = 3999;

  const app: TestApp = new TestApp(TEST_SERVER_CALLBACK_PORT);

  beforeAll(async () => {
    app.run();
  });

  afterAll(() => {
    app.shutdown();
  });

  test("OpenAPI Spec Validation", done => {
    axios
      .get<OpenAPIObject>(`http://127.0.0.1:${app.port}/openapi.json`)
      .then(res => {
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.data.openapi).toBe("3.0.0");
        expect(res.data.info.version).toBe(
          MicroserviceApp.context.config.VERSION,
        );
        expect(res.data.paths["/api/"]["get"]).toBeDefined();
        expect(res.data.paths["/api/"]["delete"]).toBeDefined();
        expect(res.data.paths["/api/async"]["get"]).toBeDefined();
        expect(res.data.paths["/api/empty"]["get"]).toBeDefined();
        expect(res.data.paths["/api/errorSync"]["get"]).toBeDefined();
        expect(res.data.paths["/api/error403"]["get"]).toBeDefined();
        expect(res.data.paths["/api/putData"]["put"]).toBeDefined();
        expect(res.data.paths["/api/postData"]["post"]).toBeDefined();
        expect(res.data.paths["/api/patchData"]["patch"]).toBeDefined();
        // TODO add more checks
        done();
      })
      .catch(error => {
        fail(error);
      });
  });

  test("GET with synchronous response", done => {
    const url = `http://127.0.0.1:${app.port}/api`;
    axios
      .get<TestControllerResponse>(`http://127.0.0.1:${app.port}/api/`)
      .then(res => {
        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.data.text).toEqual("sync");
        expect(res.data.num).toEqual(43);
        done();
      })
      .catch(error => {
        fail(error);
      });
  });

  test("GET with asynchronous response", done => {
    axios
      .get<TestControllerResponse>(`http://127.0.0.1:${app.port}/api/async`)
      .then(res => {
        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.data.text).toEqual("async");
        expect(res.data.num).toEqual(43);
        done();
      })
      .catch(error => fail(error));
  });

  test("GET with empty response", done => {
    axios
      .get<void>(`http://127.0.0.1:${app.port}/api/empty`)
      .then(res => {
        expect(res.headers["content-length"]).toBe("0");
        expect(res.status).toEqual(HttpStatus.OK);
        done();
      })
      .catch(error => fail(error));
  });

  test("GET with synchronous error 500 and message", done => {
    axios
      .get<void>(`http://127.0.0.1:${app.port}/api/errorSync`)
      .then(res => {
        fail(res);
      })
      .catch(error => {
        expect(error.response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.response.data.message).toBe("errorSyncText");
        done();
      });
  });

  test("GET with asynchronous error 500 and message", done => {
    axios
      .get<void>(`http://127.0.0.1:${app.port}/api/errorAsync`)
      .then(res => {
        fail(res);
      })
      .catch(error => {
        expect(error.response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.response.data.message).toBe("errorAsyncText");
        done();
      });
  });

  test("GET with error 403", done => {
    axios
      .get<void>(`http://127.0.0.1:${app.port}/api/error403`)
      .then(res => {
        fail(res);
      })
      .catch(error => {
        expect(error.response.status).toBe(403);
        done();
      });
  });

  test("GET with error 404 on API", done => {
    axios
      .get<void>(`http://127.0.0.1:${app.port}/some/invalie/path`)
      .then(res => {
        fail(res);
      })
      .catch(error => {
        expect(error.response.status).toBe(404);
        done();
      });
  });

  test("GET with error 404 on Callback", done => {
    axios
      .get<void>(
        `http://127.0.0.1:${TEST_SERVER_CALLBACK_PORT}/some/invalie/path`,
      )
      .then(res => {
        fail(res);
      })
      .catch(error => {
        expect(error.response.status).toBe(404);
        done();
      });
  });

  test("PUT valid data", done => {
    axios
      .put<TestControllerResponse>(`http://127.0.0.1:${app.port}/api/putData`, {
        message: "putData",
      })
      .then(res => {
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.data.text).toBe("putResponse");
        done();
      })
      .catch(error => {
        fail(error);
      });
  });

  test("PUT invalid data", done => {
    axios
      .put<void>(`http://127.0.0.1:${app.port}/api/putData`, {
        message: "invalid",
      })
      .then(res => {
        fail(res);
      })
      .catch(error => {
        expect(error.response.status).toBe(HttpStatus.IM_A_TEAPOT);
        done();
      });
  });

  test("PUT malformed data", done => {
    axios
      .put<void>(`http://127.0.0.1:${app.port}/api/putData`, "[{}")
      .then(res => {
        fail(res);
      })
      .catch(error => {
        expect(error.response.status).toBe(HttpStatus.BAD_REQUEST);
        done();
      });
  });

  test("POST valid data", done => {
    axios
      .post<TestControllerResponse>(
        `http://127.0.0.1:${app.port}/api/postData`,
        {
          message: "postData",
        },
      )
      .then(res => {
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.data.text).toBe("postResponse");
        done();
      })
      .catch(error => {
        fail(error);
      });
  });

  test("POST invalid data", done => {
    axios
      .post<void>(`http://127.0.0.1:${app.port}/api/postData`, {
        message: "invalid",
      })
      .then(res => {
        fail(res);
      })
      .catch(error => {
        expect(error.response.status).toBe(HttpStatus.IM_A_TEAPOT);
        done();
      });
  });

  test("POST malformed data", done => {
    axios
      .post<void>(`http://127.0.0.1:${app.port}/api/postData`, "[{}")
      .then(res => {
        fail(res);
      })
      .catch(error => {
        expect(error.response.status).toBe(HttpStatus.BAD_REQUEST);
        done();
      });
  });

  test("PATCH valid data", done => {
    axios
      .patch<TestControllerResponse>(
        `http://127.0.0.1:${app.port}/api/patchData`,
        {
          message: "patchData",
        },
      )
      .then(res => {
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.data.text).toBe("patchResponse");
        done();
      })
      .catch(error => {
        fail(error);
      });
  });

  test("PATCH invalid data", done => {
    axios
      .patch<void>(`http://127.0.0.1:${app.port}/api/patchData`, {
        message: "invalid",
      })
      .then(res => {
        fail(res);
      })
      .catch(error => {
        expect(error.response.status).toBe(HttpStatus.IM_A_TEAPOT);
        done();
      });
  });

  test("PATCH malformed data", done => {
    axios
      .patch<void>(`http://127.0.0.1:${app.port}/api/patchData`, "[{}")
      .then(res => {
        fail(res);
      })
      .catch(error => {
        expect(error.response.status).toBe(HttpStatus.BAD_REQUEST);
        done();
      });
  });

  test("DELETE request", done => {
    axios
      .delete<void>(`http://127.0.0.1:${app.port}/api/`)
      .then(res => {
        expect(res.status).toBe(HttpStatus.OK);
        done();
      })
      .catch(error => {
        fail(error);
      });
  });
});

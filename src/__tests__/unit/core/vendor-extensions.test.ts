import axios from "axios";
import {OpenAPIObject, PathItemObject} from "openapi3-ts";
import path from "path";
import {
  controller,
  get,
  HttpStatus,
  MicroserviceConfig,
  MicroserviceTestApp,
  pathVendorExtension,
} from "../../..";

const EXTENSION_NAME = "my-extension";
const EXTENSION_VALUE = "testValue";

@controller("Test Controller")
class TestController {
  @get("/foo")
  @pathVendorExtension(EXTENSION_NAME, EXTENSION_VALUE)
  foo(): string {
    return "foo";
  }

  @get("/staticFoo")
  @pathVendorExtension(EXTENSION_NAME, EXTENSION_VALUE)
  static staticFoo(): string {
    return "staticFoo";
  }
}

describe("Test OpenAPI vendor extensions", () => {
  const rootFolder = path.resolve(__dirname, "../../../..");
  let app = new MicroserviceTestApp<MicroserviceConfig>(rootFolder, {
    apiControllers: [TestController],
  });

  beforeAll(async () => {
    await app.start({
      SERVER_PORT: undefined,
    });
  });

  afterAll(() => {
    app.stop();
  });

  test("Verify OpenApi model", async () => {
    const response = await axios.get<OpenAPIObject>(
      `http://localhost:${app.apiServerPort}/openapi.json`,
    );
    expect(response.status).toEqual(HttpStatus.OK);

    expect(response.data.paths).toBeDefined();
    if (response.data.paths) {
      expect(response.data.paths["/foo"]).toBeDefined();
      const fooPath = response.data.paths["/foo"] as PathItemObject;
      expect(fooPath.get).toBeDefined();
      if (fooPath.get) {
        expect(fooPath.get["x-" + EXTENSION_NAME]).toEqual(EXTENSION_VALUE);
      }

      expect(response.data.paths["/staticFoo"]).toBeDefined();
      const staticFooPath = response.data.paths["/staticFoo"] as PathItemObject;
      expect(staticFooPath.get).toBeDefined();
      if (staticFooPath.get) {
        expect(staticFooPath.get["x-" + EXTENSION_NAME]).toEqual(
          EXTENSION_VALUE,
        );
      }
    }
  });
});

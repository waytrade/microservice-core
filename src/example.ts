import path from "path";
import {
  arrayProperty,
  bearerAuth,
  callback,
  controller,
  get,
  HttpError,
  MicroserviceApp,
  model,
  pathParameter,
  post,
  property,
  put,
  requestBody,
  response,
  responseBody,
  service,
  websocket,
} from ".";
import {MicroserviceRequest, MicroserviceStream} from "./core/server";
import {description} from "./decorators/description.decorator";
import {queryParameter} from "./decorators/query-parameter.decorator";
import {summary} from "./decorators/summary.decorator";

class App extends MicroserviceApp {
  constructor() {
    super(path.resolve(__dirname, ".."));
  }

  async onBoot(): Promise<void> {
    return;
  }

  /** Called when the microservice has been started. */
  onStarted(): void {
    App.info(`Server is running at port ${App.context.config.SERVER_PORT}`);
  }
}

@model("Test App SubResponse")
export class TestAppSubResponse {
  @property()
  text?: string;

  @property()
  num?: number;
}

@model("Test App Response")
export class TestAppResponse {
  @property()
  text?: string;

  @property()
  num?: number;

  @property()
  sub?: TestAppSubResponse;

  @arrayProperty(TestAppSubResponse)
  subArray?: TestAppSubResponse[];

  @arrayProperty(String)
  nativeArray?: string[];
}

@model("Test App Subscribe Request")
export class TestAppSubscribe {
  @property()
  callbackUrl?: string;
}

@model("Test App Request")
export class TestAppRequest {
  @property("A property description.")
  command?: string;
}

@controller("Test App Controller")
export class TestAppController {
  static async boot(): Promise<void> {
    return;
  }

  @get("/")
  @bearerAuth([])
  @summary("This is the Summary.")
  @queryParameter("id", String, true, "A dummy id")
  @description("This the description.")
  @response(200, "This is the 200 response description")
  @responseBody(TestAppResponse)
  static get(request: MicroserviceRequest): TestAppResponse {
    return {text: "hello", num: 43};
  }

  @get("/async/{id}")
  @pathParameter("id", String, "A dummy id")
  @response(204, "Will return an empty response")
  async async(): Promise<TestAppResponse> {
    throw new HttpError(204);
  }

  @get("/triggerCallback")
  @requestBody(TestAppSubscribe)
  @callback("{$request.body#/callbackUrl}", TestAppResponse)
  triggerCallback(): void {
    return;
  }

  @get("/error")
  static error(): void {
    throw new Error("This is an error");
  }

  @get("/asyncError")
  async asyncError(): Promise<TestAppResponse> {
    throw new Error("This is an error");
  }

  @get("/error403")
  async error403(): Promise<TestAppResponse> {
    throw new HttpError(403);
  }

  @post("/testPost")
  @queryParameter("id", String, false, "A dummy id")
  static testPost(request: MicroserviceRequest): void {
    console.log(request.queryParams.id);
  }

  @put("/")
  @requestBody(TestAppRequest)
  put(args: TestAppRequest): void {
    console.log(args.command);
  }

  static n = 1;

  @websocket("/stream")
  streaming(stream: MicroserviceStream): void {
    // eslint-disable-next-line rxjs/no-ignored-subscription
    stream.onReceived = (message): void => {
      stream.send(message);
    };
  }
}

@service()
class DummyService {
  static async boot(): Promise<void> {
    return;
  }

  static async shutdown(): Promise<void> {
    return;
  }

  foo(): number {
    return 43;
  }
}

if (require.main === module) {
  new App().run();
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import path from "path";
import {
  arrayProperty,
  controller,
  description,
  get,
  HttpStatus,
  inject,
  MicroserviceApp,
  MicroserviceConfig,
  MicroserviceStream,
  model,
  post,
  property,
  responseBody,
  service,
  summary,
  websocket,
} from ".";
import {HttpError} from "./core/http-error";
import {enumProperty} from "./decorators/property.decorator";
import {requestBody} from "./decorators/request-body.decorator";
import {MicroserviceRequest} from "./models/microservice-request";

/**
 * This is an example microservice application.
 */
class ExampleApp extends MicroserviceApp<MicroserviceConfig> {
  constructor() {
    super(path.resolve(__dirname, ".."), {
      apiControllers: [ExampleController],
      services: [ExampleService],
    });
  }

  /**
   * This function is called when the application shall boot up.
   */
  protected async boot(): Promise<void> {
    // verify configuration and initialize app here:

    if (this.config.SERVER_PORT === undefined) {
      throw new Error("SERVER_PORT not configured");
    }
  }
}

/**
 * This is example data model.
 *
 * A model describes data types exposed by your microservice app.
 *
 * Request and response bodies accepted/returned by controllers must be
 * model classes. They will be serialized to JSON on the HTTP endpoint.
 * Returning "plain" data such a string or number type is NOT supported.
 */
@model("Example Item Model")
class ExampleItemModel {
  @property("A string property")
  stringProp?: string;

  @arrayProperty(Number, "A number array property")
  arrayProp?: number[];
}

enum ExampleModelEnum {
  ExampleModelEnumValue = "val1",
}

/**
 * This is example data model.
 *
 * A model describes data types exposed by your microservice app.
 *
 * Request and response bodies accepted/returned by controllers must be
 * model classes. They will be serialized to JSON on the HTTP endpoint.
 * Returning "plain" data such a string or number type is NOT supported.
 */
@model("Example Model")
class ExampleModel {
  @property("A string property")
  stringProp?: string;

  @arrayProperty(Number, "A number array property")
  numberArrayProp?: number[];

  @arrayProperty(ExampleItemModel, "A ExampleItemModel array property")
  modelArrayProp?: ExampleItemModel[];

  @enumProperty(
    "ExampleModelEnum",
    ExampleModelEnum,
    "A ExampleModelEnum enum property",
  )
  modelEnumProp?: ExampleModelEnum[];
}

/**
 * This is an example service.
 *
 * A service is the "back-end" of your application. It is responsible for
 * calling external services, generating, processing or caching data and to
 * provide it to controllers (the "front-end").
 */
@service()
class ExampleService {
  /** This (optional) function is called when the service shall start up. */
  async start(): Promise<void> {
    // implement your controller initialization here
    return;
  }

  /** This (optional) function is called when the service shall stop. */
  stop(): void {
    // implement your controller shutdown here
    return;
  }

  /** This is an example worker-function */
  computeSomething(): ExampleModel {
    return {
      stringProp: "This the result",
      numberArrayProp: [Math.random(), Math.random(), Math.random()],
    };
  }
}

/**
 * This is an example controller.
 *
 * A controller is the "front-end" of your application. It receives requests
 * from the HTTP endpoint and is responsible for validating it, executing it
 * and responding to it.
 *
 * This controller exposed a blocking GET and async POST method, both returning
 * ExampleModel and a websocket endpoint, echoing the received data.
 */
@controller("Example Controller", "/api")
class ExampleController {
  /** App instance can be injected by adding @inject() */
  @inject("ExampleApp")
  app?: ExampleApp;

  /** Service instances be injected by adding @inject() */
  @inject("ExampleService")
  service?: ExampleService;

  /** This (optional) function is called when the controller shall start up. */
  async start(): Promise<void> {
    // implement your controller initialization here
    return;
  }

  /** This (optional) function is called when the controller shall stop. */
  stop(): void {
    // implement your controller shutdown here
    return;
  }

  /** Example function: synchronous GET method handler. */
  @get("/sync")
  @summary("Blocking GET method")
  @description("GET method, implemented as a synchronous function.")
  @responseBody(ExampleModel)
  get_blocking(req: MicroserviceRequest): ExampleModel {
    if (!this.service) {
      throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return this.service.computeSomething();
  }

  /** Example function: asynchronous POST method handler. */
  @post("/async")
  @summary("Async POST method")
  @description("POST method, implemented as an asynchronous function.")
  @requestBody(ExampleModel)
  @responseBody(ExampleModel)
  async get_async(
    req: MicroserviceRequest,
    body: ExampleModel,
  ): Promise<ExampleModel> {
    if (!this.service) {
      throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return this.service.computeSomething();
  }

  /** Example function: websocket echo handler. */
  @websocket("/echoStream")
  @summary("Websocket echo.")
  @description("Websocket endpoint, echoing the received data.")
  echoStream(stream: MicroserviceStream): void {
    stream.onReceived = (message): void => {
      stream.send(message);
    };
  }
}

// start the microservice app
new ExampleApp().start();

// another commonly used function on run-script is:
//  const app = new ExampleApp();
//  app.start()
//    .then(() => {
//      app.exportOpenApi(path.resolve(__dirname, ".."));
//      app.stop();
//    })
// to export the openapi.json file to root folder

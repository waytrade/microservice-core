import axios from "axios";
import {Subject} from "rxjs";
import * as uWS from "uWebSockets.js";
import {
  controller,
  HttpError,
  HttpStatus,
  post,
  WebhookCallbackRegistry,
  WebhookSubscriptionArgs,
} from "../..";
import {MicroserviceRequest} from "../../core/server";
import {TestApp} from "../test-app";

interface TestCallbackData {
  val: number;
}

/** The test controller */
@controller("Test Controller")
export class TestController {
  private static callbacks = new WebhookCallbackRegistry<TestCallbackData>(
    (url, error) => {
      fail(error);
    },
  );

  static value = new Subject<TestCallbackData>();

  @post("/subscribe")
  static subscribe(
    request: MicroserviceRequest,
    args: WebhookSubscriptionArgs,
  ): void {
    //onsole.log("da");
    throw new HttpError(this.callbacks.add(request, args, this.value));
  }
}

/**
 * The REST server tests.
 */
describe("Webhook callback tests", () => {
  const TEST_SERVER_CALLBACK_PORT = 3999;

  const testApp: TestApp = new TestApp(TEST_SERVER_CALLBACK_PORT);

  let apiBaseUrl: string;
  let callbackBaseUrl: string;

  let onCallback: (res: uWS.HttpResponse, req: uWS.HttpRequest) => void;

  beforeAll(async () => {
    testApp.remote.post("/onCallback", (res, req) => {
      if (onCallback) {
        onCallback(res, req);
      }
    });
    await testApp.start();
    apiBaseUrl = "http://127.0.0.1:" + testApp.port;
    callbackBaseUrl = "http://127.0.0.1:" + testApp.callbackPort;
  });

  afterAll(() => {
    testApp.shutdown();
  });

  test("Subscribe (201 CREATED)", () => {
    return new Promise<void>((resolve, reject) => {
      axios
        .post<void>(apiBaseUrl + "/api/subscribe", {
          port: TEST_SERVER_CALLBACK_PORT,
          callbackUrl: "/onMarketData",
        } as WebhookSubscriptionArgs)
        .then(res => {
          expect(res.status).toEqual(HttpStatus.CREATED);
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  });

  test("Re-Subscribe (204 NO_CONTENT)", () => {
    return new Promise<void>((resolve, reject) => {
      axios
        .post<void>(apiBaseUrl + "/api/subscribe", {
          port: TEST_SERVER_CALLBACK_PORT,
          callbackUrl: "/onMarketData",
        } as WebhookSubscriptionArgs)
        .then(res => {
          expect(res.status).toEqual(HttpStatus.NO_CONTENT);
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  });
});

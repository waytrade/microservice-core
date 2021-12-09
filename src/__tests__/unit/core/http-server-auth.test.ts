import axios, {AxiosError} from "axios";
import Cookie from "cookie";
import path from "path";
import {bearerAuth, controller, get, HttpStatus, MicroserviceConfig, MicroserviceTestApp} from "../../..";

const TEST_CONTROLLER_PATH = "/api/test";

@controller("Controller with a request handler secured by bearer auth", TEST_CONTROLLER_PATH)
class BearerAuthController {
  @get("/")
  @bearerAuth(["TEST_SCOPE"])
  static onGET(): void {
    return;
  }
}

/** App with verification for bearer auth */
class BearerAuthVerifyApp extends MicroserviceTestApp<MicroserviceConfig> {
  constructor(projectRootFolder: string) {
    super(projectRootFolder, {
      apiControllers: [BearerAuthController],
      callbackControllers: [BearerAuthController]
    });
  }

  exptectedToken?: string

  /** Verfiy a bearer auth token. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onVerifyBearerAuth = (token: string, scopes: string[]): boolean => {
    if (!this.exptectedToken || this.exptectedToken != token) {
      return false
    }
    return true;
  }
}


/** App with no verification for bearer auth */
class BearerAuthNoVerifyApp extends MicroserviceTestApp<MicroserviceConfig> {
  constructor(projectRootFolder: string) {
    super(projectRootFolder, {
      apiControllers: [BearerAuthController],
      callbackControllers: [BearerAuthController]
    });
  }
}

describe("Test MicroserviceHttpServer class", () => {
  const verifyApp = new BearerAuthVerifyApp(path.resolve(__dirname, "../../../.."))
  const noVerifyApp = new BearerAuthNoVerifyApp(path.resolve(__dirname, "../../../.."))

  beforeAll(async () => {
    await verifyApp.start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
    await noVerifyApp.start({SERVER_PORT: undefined, CALLBACK_PORT: undefined})
  });

  afterAll(() => {
    verifyApp.stop()
    noVerifyApp.stop()
  })

  test("Test bearer auth on API controller (authorization header)", async () => {
    verifyApp.exptectedToken = "Bearer ey" + Math.random();

    const res = await axios.get<void>(
      `http://127.0.0.1:${verifyApp.apiServerPort}${TEST_CONTROLLER_PATH}/`,
      {
        headers: {
          "authorization": verifyApp.exptectedToken
        },
      },
    )

    expect(res.status).toBe(HttpStatus.OK);
  });

  test("Test bearer auth on API controller (cookie header)", async () => {
    verifyApp.exptectedToken = "Bearer ey" + Math.random();

    const res = await axios.get<void>(
      `http://127.0.0.1:${verifyApp.apiServerPort}${TEST_CONTROLLER_PATH}/`,
      {
        headers: {
          "cookie": Cookie.serialize("authorization", verifyApp.exptectedToken)
        },
      },
    )

    expect(res.status).toBe(HttpStatus.OK);
  });

  test("Test bearer auth on API controller (invalid token)", async () => {
    verifyApp.exptectedToken = "Bearer ey" + Math.random();

    try {
      await axios.get<void>(
        `http://127.0.0.1:${verifyApp.apiServerPort}${TEST_CONTROLLER_PATH}/`,
        {
          headers: {
            "authorization": "wrongToken"
          },
        },
      )
      throw "This must fail"
    } catch(e) {
      expect((<AxiosError>e).response?.status).toBe(HttpStatus.UNAUTHORIZED);
    }
  });

  test("Test bearer auth on API controller (no authorization)", async () => {
    verifyApp.exptectedToken = "Bearer ey" + Math.random();

    try {
      await axios.get<void>(
        `http://127.0.0.1:${verifyApp.apiServerPort}${TEST_CONTROLLER_PATH}/`,
        {},
      )
      throw "This must fail"
    } catch(e) {
      expect((<AxiosError>e).response?.status).toBe(HttpStatus.UNAUTHORIZED);
    }
  });

  test("Test bearer auth on API controller (no verfication function)", async () => {
    try {
      await axios.get<void>(
        `http://127.0.0.1:${noVerifyApp.apiServerPort}${TEST_CONTROLLER_PATH}/`,
        {
          headers: {
            "authorization": "someToken"
          },
        }
      )
      throw "This must fail"
    } catch(e) {
      expect((<AxiosError>e).response?.status).toBe(HttpStatus.UNAUTHORIZED);
    }
  });

  test("Test bearer auth on callback controller (authorization header)", async () => {
    verifyApp.exptectedToken = "Bearer ey" + Math.random();

    const res = await axios.get<void>(
      `http://127.0.0.1:${verifyApp.callbackServerPort}${TEST_CONTROLLER_PATH}/`,
      {
        headers: {
          "authorization": verifyApp.exptectedToken
        },
      },
    )

    expect(res.status).toBe(HttpStatus.OK);
  });

  test("Test bearer auth on callback controller (cookie header)", async () => {
    verifyApp.exptectedToken = "Bearer ey" + Math.random();

    const res = await axios.get<void>(
      `http://127.0.0.1:${verifyApp.callbackServerPort}${TEST_CONTROLLER_PATH}/`,
      {
        headers: {
          "cookie": Cookie.serialize("authorization", verifyApp.exptectedToken)
        },
      },
    )

    expect(res.status).toBe(HttpStatus.OK);
  });

  test("Test bearer auth on callback controller (invalid token)", async () => {
    verifyApp.exptectedToken = "Bearer ey" + Math.random();

    try {
      await axios.get<void>(
        `http://127.0.0.1:${verifyApp.callbackServerPort}${TEST_CONTROLLER_PATH}/`,
        {
          headers: {
            "authorization": "wrongToken"
          },
        },
      )
      throw "This must fail"
    } catch(e) {
      expect((<AxiosError>e).response?.status).toBe(HttpStatus.UNAUTHORIZED);
    }
  });

  test("Test bearer auth on callback controller (no authorization)", async () => {
    verifyApp.exptectedToken = "Bearer ey" + Math.random();

    try {
      await axios.get<void>(
        `http://127.0.0.1:${verifyApp.callbackServerPort}${TEST_CONTROLLER_PATH}/`,
        {},
      )
      throw "This must fail"
    } catch(e) {
      expect((<AxiosError>e).response?.status).toBe(HttpStatus.UNAUTHORIZED);
    }
  });

  test("Test bearer auth on callback controller (no verfication function)", async () => {
    try {
      await axios.get<void>(
        `http://127.0.0.1:${noVerifyApp.callbackServerPort}${TEST_CONTROLLER_PATH}/`,
        {
          headers: {
            "authorization": "someToken"
          },
        }
      )
      throw "This must fail"
    } catch(e) {
      expect((<AxiosError>e).response?.status).toBe(HttpStatus.UNAUTHORIZED);
    }
  });
});

import axios from 'axios';
import {OpenAPIObject} from 'openapi3-ts';
import path from 'path';
import {controller, get, MicroserviceConfig, MicroserviceTestApp, websocket} from '../../../..';
import {
  VENDOR_EXTENSION_WAYTRADE_GATEWAY_EXPOSE_ALWAYS,
  VENDOR_EXTENSION_WAYTRADE_GATEWAY_EXPOSE_WITH_PERMISSIONS,
  VENDOR_EXTENSION_WAYTRADE_GATEWAY_PUBLISHED_TOPICS, WaytradeEventMessageTopicDescriptor,
  WaytradeGatewayPermission,
  WaytradeGatewayPermissionType,
  waytradeGateway_ExposeAlways,
  waytradeGateway_ExposeWithPermission,
  waytradeGateway_PublishedTopics
} from '../../../../vendor/waytrade';

/** The app root folder. */
const ROOT_FOLDER = path.resolve(__dirname, "../../../../..");

/** TestController response object */
const TEST_RESPONSE = {val: Math.random()};

const TEST_PERMISSION = new WaytradeGatewayPermission();
TEST_PERMISSION.type = WaytradeGatewayPermissionType.Grant;
TEST_PERMISSION.val ="test/permission"

const TEST_PERMISSIONS: WaytradeGatewayPermission[] = [TEST_PERMISSION, {
  type: WaytradeGatewayPermissionType.TopicMatch,
  val: "test/{idn.id}/topic"
}];

const TEST_TOPIC_DESC = new WaytradeEventMessageTopicDescriptor();
TEST_TOPIC_DESC.topic = "test/topic1";
TEST_TOPIC_DESC.permissions = [{
  type: WaytradeGatewayPermissionType.Grant,
  val: "test/permission1"
}]

const TEST_TOPICS: WaytradeEventMessageTopicDescriptor[] = [TEST_TOPIC_DESC, {
  topic: "test/topic2",
  permissions: [{
    type: WaytradeGatewayPermissionType.Grant,
    val: "test/permission2"
  }],
  cache: true
}];

/** The test controller */
@controller("A Controller that responses a predefined object", "/api")
class TestAppController {
  @get("/exposeAlways")
  @waytradeGateway_ExposeAlways()
  static exposeAlways(): unknown {
    return TEST_RESPONSE;
  }

  @get("/exposeWithPermission")
  @waytradeGateway_ExposeWithPermission(TEST_PERMISSIONS)
  static exposeWithPermission(): unknown {
    return TEST_RESPONSE;
  }

  @websocket("/publishedTopcis")
  @waytradeGateway_PublishedTopics(TEST_TOPICS)
  static publishedTopcis(): unknown {
    return TEST_RESPONSE;
  }
}

/** An app with API and Callback controller */
class TestApp extends MicroserviceTestApp<MicroserviceConfig> {
  constructor() {
    super(ROOT_FOLDER, {
      apiControllers: [TestAppController]
    });
  }
}

/**
 * The test code.
 */
describe("Test waytrade vendor extensions", () => {
  const app = new TestApp();

  beforeAll(async () => {
    await app.start({SERVER_PORT: undefined, CALLBACK_PORT: undefined});
  })

  afterAll(() => {
    app.stop();
  })

  test("Verify name constants", () => {
    expect(VENDOR_EXTENSION_WAYTRADE_GATEWAY_EXPOSE_ALWAYS)
      .toEqual("waytrade-gateway-expose-always")
    expect(VENDOR_EXTENSION_WAYTRADE_GATEWAY_EXPOSE_WITH_PERMISSIONS)
      .toEqual("waytrade-gateway-expose-with-permissions")
    expect(VENDOR_EXTENSION_WAYTRADE_GATEWAY_PUBLISHED_TOPICS)
      .toEqual("waytrade-gateway-published-topics")
  })

  test("Test waytrade-gateway path extensions", async () => {
    const openApi = await axios.get<OpenAPIObject>(
      `http://127.0.0.1:${app.apiServerPort}/openapi.json`);

    expect(openApi.status).toEqual(200);

    expect(openApi.data
      .paths["/api/exposeAlways"]?.get["x-"+VENDOR_EXTENSION_WAYTRADE_GATEWAY_EXPOSE_ALWAYS])
      .toEqual("true")

    expect(JSON.parse(openApi.data
      .paths["/api/exposeWithPermission"]?.get["x-"+VENDOR_EXTENSION_WAYTRADE_GATEWAY_EXPOSE_WITH_PERMISSIONS]))
      .toEqual(TEST_PERMISSIONS)

    expect(JSON.parse(openApi.data
      .paths["/api/publishedTopcis"]?.get["x-"+VENDOR_EXTENSION_WAYTRADE_GATEWAY_PUBLISHED_TOPICS]))
      .toEqual(TEST_TOPICS)
  });
})

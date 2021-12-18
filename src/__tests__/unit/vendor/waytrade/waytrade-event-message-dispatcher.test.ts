import {firstValueFrom, Subject} from 'rxjs';
import {HttpStatus, MicroserviceStream} from '../../../..';
import {
  WaytradeErrorEvent,
  WaytradeEventMessage,
  WaytradeEventMessageDispatcher,
  WaytradeEventMessageType
} from '../../../../vendor/waytrade';

export class MicroserviceStreamMock implements MicroserviceStream {
  url: string = "dummy/url";
  requestHeader = new Map<string, string>();

  onReceived?: (message: string) => void;
  sendToReceive(msg: string): void {
    if (this.onReceived) {
      this.onReceived(msg);
    }
  }

  onReceivedFromSent?: (msg: string) => void;
  send(msg: string): boolean {
    if (this.onReceivedFromSent) {
      this.onReceivedFromSent(msg);
    }
    return true;
  }

  close(): void {
    this._closed.next();
  }
  _closed = new Subject<void>();
  closed = firstValueFrom(this._closed);
}

describe("Test WaytradeEventMessageDispatcher", () => {
  test("Data message dispatch", async () => {
    const TEST_SUB_TOPIC = "testTopicLevel1/#";
    const TEST_PUB_TOPIC = "testTopicLevel1/level2";
    const TEST_DATA = {
      val: Math.random()
    }

    const stream = new MicroserviceStreamMock();

    let dataMessageReceived = 0;
    let errorMessagesReceived = 0;
    stream.onReceivedFromSent = (msgString) => {
      const msg = JSON.parse(msgString) as WaytradeEventMessage;
      if (msg.topic === TEST_PUB_TOPIC) {
        expect(msg.data).toEqual(TEST_DATA);
        dataMessageReceived++;
      } else if (msg.error) {
        expect(msg.error?.code).toEqual(HttpStatus.BAD_REQUEST);
        errorMessagesReceived++;
      }
    }

    const dispatcher = new WaytradeEventMessageDispatcher();

    let onSubscribedCalled = 0;
    dispatcher.onSubscribed = () => {
      onSubscribedCalled++;
      return [{
        topic: TEST_PUB_TOPIC,
        data: TEST_DATA
      }]
    }

    let onReSubscribedCalled = 0;
    dispatcher.onReSubscribed = () => {
      onReSubscribedCalled++;
      return [{
        topic: TEST_PUB_TOPIC,
        data: TEST_DATA
      }]
    }

    let onUnsubscribedCalled = 0;
    dispatcher.onUnsubscribed = () => {
      onUnsubscribedCalled++;
    }

    dispatcher.registerSubscriber(stream);

    stream.sendToReceive(JSON.stringify({
      type: WaytradeEventMessageType.Subscribe,
      topic: ""
    } as WaytradeEventMessage));

    stream.sendToReceive(JSON.stringify({
      type: WaytradeEventMessageType.Subscribe,
      topic: TEST_SUB_TOPIC
    } as WaytradeEventMessage));

    dispatcher.dispatchMessage({
      topic: TEST_PUB_TOPIC,
      data: TEST_DATA
    });

    dispatcher.dispatchMessage({
      topic: "",
      data: TEST_DATA
    });

    stream.sendToReceive(JSON.stringify({
      type: WaytradeEventMessageType.Subscribe,
      topic: TEST_SUB_TOPIC
    } as WaytradeEventMessage));

    stream.sendToReceive(JSON.stringify({
      type: WaytradeEventMessageType.Unsubscribe,
      topic: TEST_SUB_TOPIC
    } as WaytradeEventMessage));

    stream.sendToReceive(JSON.stringify({
      type: WaytradeEventMessageType.Unsubscribe,
      topic: "invalid"
    } as WaytradeEventMessage));

    dispatcher.dispatchMessage({
      topic: TEST_PUB_TOPIC,
      data: TEST_DATA
    });

    await (new Promise<void>(res => {
      setTimeout(() => {
        res();
      }, 50);
    }));

    expect(onSubscribedCalled).toEqual(1);
    expect(onReSubscribedCalled).toEqual(1);
    expect(onUnsubscribedCalled).toEqual(1);
    expect(dataMessageReceived).toEqual(3);
    expect(errorMessagesReceived).toEqual(1);
  });


  test("Error message dispatch", async () => {
    const TEST_SUB_TOPIC = "testTopicLevel1/#";
    const TEST_PUB_TOPIC = "testTopicLevel1/level2";
    const TEST_ERROR: WaytradeErrorEvent = {
      code: Math.random(),
      desc: "error " + Math.random()
    }

    const stream = new MicroserviceStreamMock();

    let errorMessagesReceived = 0;
    stream.onReceivedFromSent = (msgString) => {
      const msg = JSON.parse(msgString) as WaytradeEventMessage;
      expect(msg.error).toEqual(TEST_ERROR);
      errorMessagesReceived++;
    }

    const dispatcher = new WaytradeEventMessageDispatcher();
    dispatcher.registerSubscriber(stream);

    stream.sendToReceive(JSON.stringify({
      type: WaytradeEventMessageType.Subscribe,
      topic: TEST_SUB_TOPIC
    } as WaytradeEventMessage));

    stream.sendToReceive(JSON.stringify({
      type: WaytradeEventMessageType.Subscribe,
      topic: TEST_SUB_TOPIC
    } as WaytradeEventMessage));

    dispatcher.dispatchMessage({
      topic: TEST_PUB_TOPIC,
      error: TEST_ERROR
    });

    stream.sendToReceive(JSON.stringify({
      type: WaytradeEventMessageType.Unsubscribe,
      topic: TEST_SUB_TOPIC
    } as WaytradeEventMessage));

    dispatcher.dispatchMessage({
      topic: TEST_PUB_TOPIC,
      error: TEST_ERROR
    });

    stream.close();

    await (new Promise<void>(res => {
      setTimeout(() => {
        res();
      }, 50);
    }));

    expect(errorMessagesReceived).toEqual(1);
  });

  test("Reject subscription", async () => {
    const TEST_TOPIC = "testTopic";

    const stream = new MicroserviceStreamMock();

    let errorMessagesReceived = 0;
    stream.onReceivedFromSent = (msgString) => {
      const msg = JSON.parse(msgString) as WaytradeEventMessage;
      expect(msg.error?.code).toEqual(HttpStatus.BAD_REQUEST);
      expect(msg.error?.desc).toEqual("Subscription rejected");
      errorMessagesReceived++;
    }

    const dispatcher = new WaytradeEventMessageDispatcher();

    dispatcher.onSubscribed = () => {
      throw new Error("Subscription rejected");
    }

    dispatcher.registerSubscriber(stream);

    stream.sendToReceive(JSON.stringify({
      type: WaytradeEventMessageType.Subscribe,
      topic: TEST_TOPIC
    } as WaytradeEventMessage));

    await (new Promise<void>(res => {
      setTimeout(() => {
        res();
      }, 50);
    }));

    expect(errorMessagesReceived).toEqual(1);
  });

})

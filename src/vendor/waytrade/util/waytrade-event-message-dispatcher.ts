import {WaytradeEventMessage, WaytradeEventMessageType} from "..";
import {HttpStatus, MicroserviceStream} from "../../..";
import {WaytradeEventMessageUtils} from "./waytrade-event-message-utils";

class SubscribedTopic {
  constructor(
    public readonly topic: string,
    public readonly topicTokenized: string[],
  ) {}
}

class TopicSubscription {
  constructor(
    public readonly stream: MicroserviceStream,
    public readonly allowPublish: (topic: string, topicTokenized: string[]) =>
      boolean = (): boolean => true
  ) {}

  public readonly topics: SubscribedTopic[] = [];
}

/** A [WaytradeEventMessage] dispatcher. */
export class WaytradeEventMessageDispatcher {

  private readonly subscribers: TopicSubscription[] = [];

  /**
   * Called when a new topic is subscribed.
   *
   * Shall return the initial messages to be sent to the subscriber,
   * or undefined if no initial messages shall be send.
   * Must throw an Error if sbuscription shall be rejected.
   */
  onSubscribed?: (topic: string, topicTokenized: string[]) =>
    WaytradeEventMessage[] | void;

  /**
   * Called when a new topic has been re-subscribed.
   *
   * Shall return the sync messages to be sent to the subscriber,
   * or undefined if no sync messages shall be send.
   */
  onReSubscribed?: (topic: string, topicTokenized: string[]) =>
    WaytradeEventMessage[] | void;

  /** Called a topic is unsubscribed. */
  onUnsubscribed?: (topic: string, topicTokenized: string[]) => void;

  /** Register a stream for subscribing and receiving messages. */
  registerSubscriber(
    stream: MicroserviceStream,
    allowPublish?: (topic: string, topicTokenized: string[]) => boolean
  ): void {
    const sub = new TopicSubscription(stream, allowPublish);
    const idx = this.subscribers.length;
    this.subscribers.push(sub);

    stream.closed.then(() => {
      this.subscribers.splice(idx, 1);
    });

    stream.onReceived = (data): void => {
      const msg = JSON.parse(data) as WaytradeEventMessage;
      const topicTokenized = WaytradeEventMessageUtils.tokenizeTopic(
        msg.topic,
        (error) => {
          stream.send(JSON.stringify({
            topic: msg.topic,
            error
          } as WaytradeEventMessage));
        }
      );

      if (!topicTokenized) {
        return;
      }

      switch (msg.type) {
        case WaytradeEventMessageType.Subscribe:
          if (sub.topics.findIndex(v => v.topic === msg.topic) === -1) {
            if (this.onSubscribed) {
              try {
                const initMsgs = this.onSubscribed(msg.topic, topicTokenized);
                initMsgs?.forEach(initMsg => {
                  stream.send(JSON.stringify(initMsg));
                });
                sub.topics.push(new SubscribedTopic(
                  msg.topic,
                  topicTokenized
                ));
              } catch (err) {
                stream.send(JSON.stringify({
                  topic: msg.topic,
                  error: {
                    code: HttpStatus.BAD_REQUEST,
                    desc: (<Error>err).message
                  }
                } as WaytradeEventMessage));
              }
            } else {
              sub.topics.push(new SubscribedTopic(
                msg.topic,
                topicTokenized
              ));
            }
          } else {
            if (this.onReSubscribed) {
              const syncMsgs = this.onReSubscribed(msg.topic, topicTokenized);
              syncMsgs?.forEach(syncMsg => {
                stream.send(JSON.stringify(syncMsg));
              });
            }
          }
          break;
        case WaytradeEventMessageType.Unsubscribe:
          const idx = sub.topics.findIndex(v => v.topic === msg.topic);
          if (idx != -1) {
            sub.topics.splice(idx, 1);
            if (this.onUnsubscribed) {
              this.onUnsubscribed(msg.topic, topicTokenized);
            }
          }
          break;
      }
    };
  }

  /** Dispatch a message. */
  dispatchMessage(msg: WaytradeEventMessage): void {
    const messageTopic = WaytradeEventMessageUtils.tokenizeTopic(
      msg.topic
    );

    if (!messageTopic) {
      return;
    }

    const msgString = JSON.stringify(msg);

    this.subscribers.forEach(s => {
      const subscribedTopic = s.topics.find(
        subscribedTopic => WaytradeEventMessageUtils.compareTopic(
          messageTopic,
          subscribedTopic.topicTokenized
        ) && s.allowPublish(msg.topic, messageTopic)
      );
      if (subscribedTopic) {
        s.stream.send(msgString);
      }
    });
  }
}

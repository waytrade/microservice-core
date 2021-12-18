import {WaytradeErrorEvent} from "..";
import {HttpStatus} from "../../..";

/** Collection of [WaytradeEventMessage] utility functions. */
export class WaytradeEventMessageUtils {

  /** Check if a message-topic is equal to a given subscription-topic. */
  static compareTopic(topic0: string[],topic1: string[]): boolean {
    if (!topic0.length || !topic1.length) {
      return false;
    }
    return WaytradeEventMessageUtils.compareTopicInternal(
      [...topic0], [...topic1]
    );
  }

  /** Tokenize a topic string. */
  static tokenizeTopic(
    topic?: string,
    errorCallback?: (error: WaytradeErrorEvent) => void,
  ): string[] | undefined {
    const topicTokenized = topic?.split("/");
    if (topic === "" || !topicTokenized?.length) {
      if (errorCallback) {
        errorCallback({
          code: HttpStatus.BAD_REQUEST,
          desc: "empty topic"
        });
      }
      return;
    } else if (!topicTokenized[0]) {
      if (errorCallback) {
        errorCallback({
          code: HttpStatus.BAD_REQUEST,
          desc: "invalid topic: must not start with '/'"
        });
      }
      return;
    }
    return topicTokenized;
  }

  /**
   * Check if a message-topic is equal to a given subscription-topic.
   * ATTENTION: modifies the topic arrays.
   */
  private static compareTopicInternal(
    topic0: string[],
    topic1: string[]
  ): boolean {
    const t0 = topic0.shift();
    const t1 = topic1.shift();
    if (
      (t1 == undefined && t0 == undefined) ||
      t0 == "#" ||
      t1 == "#"
    ) {
      return true;
    }
    if (
      t1 == t0 ||
      t0 == "+" ||
      t1 == "+"
    ) {
      return this.compareTopicInternal(
        topic0,
        topic1
      );
    }
    return false;
  }
}

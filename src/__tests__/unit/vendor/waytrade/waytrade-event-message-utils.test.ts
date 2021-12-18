import {HttpStatus} from '../../../..';
import {
  WaytradeEventMessageUtils
} from '../../../../vendor/waytrade';

describe("Test WaytradeEventMessageUtils", () => {
  test("compareTopic", () => {
    expect(WaytradeEventMessageUtils.compareTopic([], ["topic"])).toBeFalsy();
    expect(WaytradeEventMessageUtils.compareTopic(["topic"], [])).toBeFalsy();

    expect(WaytradeEventMessageUtils.compareTopic(
      "level0/level1".split("/"),
       "#".split("/"))).toBeTruthy();

    expect(WaytradeEventMessageUtils.compareTopic(
      "level0/level1".split("/"),
      "level0/#".split("/"))).toBeTruthy();

    expect(WaytradeEventMessageUtils.compareTopic(
      "level0/level1".split("/"),
      "levelX/#".split("/"))).toBeFalsy();

    expect(WaytradeEventMessageUtils.compareTopic(
      "level0/level1".split("/"),
      "+/#".split("/"))).toBeTruthy();

    expect(WaytradeEventMessageUtils.compareTopic(
      "level0/level1".split("/"),
      "+/level1".split("/"))).toBeTruthy();

    expect(WaytradeEventMessageUtils.compareTopic(
      "level0/level1".split("/"),
      "+/levelX".split("/"))).toBeFalsy();

    expect(WaytradeEventMessageUtils.compareTopic(
      "level0/level1".split("/"),
      "+/level1/levelX".split("/"))).toBeFalsy();

    expect(WaytradeEventMessageUtils.compareTopic(
      "level0/level1/level2".split("/"),
      "level0/level1".split("/"))).toBeFalsy();

    expect(WaytradeEventMessageUtils.compareTopic(
      "level0/+/level2".split("/"),
      "level0/level1/level2".split("/"))).toBeTruthy();

    expect(WaytradeEventMessageUtils.compareTopic(
      "level0/#".split("/"),
      "level0/level1/level2".split("/"))).toBeTruthy();
  });

  test("WaytradeEventMessageUtils.tokenizeTopic", () => {
    expect(WaytradeEventMessageUtils.tokenizeTopic(
      "level0/level1/level2")).toEqual(["level0", "level1", "level2"]);
  });

  test("tokenizeTopic (undefined)", () => {
    return new Promise<void>(resolve => {
      expect(WaytradeEventMessageUtils.tokenizeTopic(undefined, (e) => {
        expect(e.code).toEqual(HttpStatus.BAD_REQUEST);
        expect(e.desc).toEqual("empty topic");
        resolve();
      }))
      .toEqual([]);
    })
  });

  test("tokenizeTopic (leading slash)", () => {
    return new Promise<void>(resolve => {
      expect(WaytradeEventMessageUtils.tokenizeTopic("/topic", (e) => {
        expect(e.code).toEqual(HttpStatus.BAD_REQUEST);
        expect(e.desc).toEqual("invalid topic: must not start with '/'");
        resolve();
      }))
      .toEqual([]);
    })
  });
})

import {MapExt} from "../../../util/map-ext";

describe("Test MapExt class", () => {
  test("getOrAdd", () => {
    const map = new MapExt<number, number>();

    const testVal1 = Math.random();
    const testVal2 = Math.random();

    // not there, add it

    let hasAdded = false;
    let res = map.getOrAdd(testVal1, () => {
      hasAdded = true;
      return testVal2;
    });

    expect(res).toEqual(testVal2);
    expect(hasAdded).toBeTruthy();
    expect(map.get(testVal1)).toEqual(testVal2);

    // it's there already

    hasAdded = false;
    res = map.getOrAdd(testVal1, () => {
      hasAdded = true;
      return testVal2;
    });

    expect(res).toEqual(testVal2);
    expect(hasAdded).toBeFalsy();
  });
});

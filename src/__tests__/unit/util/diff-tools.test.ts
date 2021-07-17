import {DiffTools} from "../../..";

describe("Test DiffTools class", () => {
  test("no diff", () => {
    const a: any = {
      prop: {
        nestedProp: {
          stringProp: "stingVal",
        },
      },
    };

    const diffResult = DiffTools.diff(a, a);
    expect(diffResult.changed).toBeUndefined();
    expect(diffResult.removed).toBeUndefined();
  });

  test("diff with undefined update", () => {
    const a: any = {
      stringProp: "stingVal",
    };

    const diffResult = DiffTools.diff(undefined, a);
    expect(diffResult.changed).toEqual(a);
    expect(diffResult.removed).toBeUndefined();
  });

  test("diff undefined reference", () => {
    const a: any = {
      stringProp: "stingVal",
    };

    const diffResult = DiffTools.diff(a, undefined);
    expect(diffResult.changed).toBeUndefined();
    expect(diffResult.removed).toEqual(a);
  });

  test("DiffTools.diff primitives", () => {
    const a: any = {
      stringPropA: "stingValA",
      stringPropB: "stingValB",
      numberPropA: 43,
      boolProp: true,
      nothing: undefined,
    };
    const b: any = {
      stringPropA: "stingValA", // unchanged
      stringPropB: "otherValB", // changed
      // numberPropA removed
      numberPropB: 44, // added
      // boolProp removed
      nothing: undefined, // unchanged
    };

    const diffResult = DiffTools.diff(a, b);

    expect(diffResult.changed["stringPropB"]).toEqual("otherValB");
    expect(diffResult.changed["numberPropB"]).toEqual(44);
    expect(diffResult.removed["numberPropA"]).toEqual(43);
    expect(diffResult.removed["boolProp"]).toEqual(true);

    expect(1).toEqual(1);
  });

  test("DiffTools.diff arrays", () => {
    const a: any = {
      numberArrayA: [1, 2, 3, 4],
      numberArrayB: [1, 2, 3, 4],
      numberArrayC: [1, 2, 3, 4],
      stringArray: ["a", "b", "c"],
      mixedArray: [1, "a", 2],
      boolArrayA: [true, false, true],
    };
    const b: any = {
      numberArrayA: [1, 2, 3, 4], // unchanged
      numberArrayB: [1, 2, 3, 4, 5], // len changed
      numberArrayC: [4, 3, 2, 1], // content changed
      // stringArray removed
      mixedArray: [1, "a", "b"], // changed
      // boolArrayA removed
      boolArrayB: [true, false, true], // added
    };

    const diffResult = DiffTools.diff(a, b);

    expect(diffResult.changed["numberArrayB"]).toBeDefined();
    expect(diffResult.changed["numberArrayC"]).toBeDefined();
    expect(diffResult.removed["stringArray"]).toBeDefined();
    expect(diffResult.removed["boolArrayA"]).toBeDefined();
    expect(diffResult.changed["boolArrayB"]).toBeDefined();
    expect(diffResult.changed["mixedArray"]).toBeDefined();
  });

  test("DiffTools.diff all removed", () => {
    const a: any = {
      numberArrayA: [1, 2, 3, 4],
      numberArrayB: [1, 2, 3, 4],
      stringArray: ["a", "b", "c"],
      boolArrayA: [true, false, true],
    };
    const b: any = {};

    const diffResult = DiffTools.diff(a, b);
    expect(diffResult.removed).toEqual(a);
  });

  test("DiffTools.diff nested objects", () => {
    const a: any = {
      numberArrayA: [1, 2, 3, 4],
      subObject: {
        stringArray: ["a", "b", "c"],
        boolArray: [true, false, true],
      },
    };
    const b: any = {
      numberArrayA: [1, 2, 3, 4],
      subObject: {
        stringArray: ["a", "b", "c"],
        boolArray: [], // changed
      },
    };

    const diffResult = DiffTools.diff(a, b);
    expect(diffResult.changed.subObject.boolArray).toEqual([]);
  });

  test("DiffTools.diff complex arrays", () => {
    const a: any = {
      testArray: [3, {val: 3}, {val: "same"}, 0],
    };
    const b: any = {
      testArray: [3, {val: 4}, {val: "same"}, 0],
    };

    const diffResult = DiffTools.diff(a, b);
    expect(Object.keys(diffResult.changed).length).toEqual(1);
    expect(diffResult.changed.testArray).toEqual(b.testArray);
  });
});

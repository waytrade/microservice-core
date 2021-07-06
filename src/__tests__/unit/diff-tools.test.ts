import {DiffTools} from "../..";

/**
 * DiffHelper test code.
 */
describe("DiffTools tests", () => {
  test("DiffTools.diff primitives", () => {
    const a: any = {
      stringPropA: "stingValA",
      stringPropB: "stingValB",
      numberPropA: 43,
      boolProp: true,
    };
    const b: any = {
      stringPropA: "stingValA", // unchanged
      stringPropB: "otherValB", // changed
      // numberPropA removed
      numberPropB: 44, // added
      // boolProp removed
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
      stringArray: ["a", "b", "c"],
      boolArrayA: [true, false, true],
    };
    const b: any = {
      numberArrayA: [1, 2, 3, 4], // unchanged
      numberArrayB: [1, 2, 3, 4, 5], // changed
      // stringArray removed
      // boolArrayA removed
      boolArrayB: [true, false, true], // added
    };

    const diffResult = DiffTools.diff(a, b);

    expect(diffResult.changed["numberArrayB"]).toBeDefined();
    expect(diffResult.removed["stringArray"]).toBeDefined();
    expect(diffResult.removed["boolArrayA"]).toBeDefined();
    expect(diffResult.changed["boolArrayB"]).toBeDefined();
  });
});

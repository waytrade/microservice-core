/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DiffResult<T> {
  changed?: T;
  removed?: T;
}

/** Return true if the given type is a primitive, false if it is an object. */
function isPrimitiveType(typeString: unknown): boolean {
  return (
    typeString === "string" ||
    typeString === "number" ||
    typeString === "boolean"
  );
}

/** A collection of helper functions to diff complex objects. */
export class DiffTools {
  /** Compute the difference between a reference and diff object. */
  static diff<T>(ref: T, diff: T): DiffResult<T> {
    if (ref === undefined) {
      return {changed: diff};
    }
    if (diff === undefined) {
      return {removed: ref};
    }

    const changed: any = {};
    const diffKeys = new Set(Object.keys(diff));
    diffKeys.forEach(key => {
      const diffVal = (<any>diff)[key];
      const diffValType = typeof diffVal;
      const refVal = (<any>ref)[key];
      if (diffVal === undefined && refVal === undefined) {
        return;
      }
      if (isPrimitiveType(diffValType)) {
        if (refVal !== diffVal) {
          changed[key] = diffVal;
        }
      } else if (Array.isArray(diffVal)) {
        if (!this.compareArrayContents(refVal, diffVal)) {
          changed[key] = diffVal;
        }
      } else {
        const changedValues = DiffTools.diff(refVal, diffVal).changed;
        if (changedValues && Object.keys(changedValues).length) {
          changed[key] = changedValues;
        }
      }
    });
    const removed: any = {};
    const refKeys = new Set(Object.keys(ref));
    refKeys.forEach(key => {
      if (!diffKeys.has(key)) {
        removed[key] = (<any>ref)[key];
      }
    });
    return {
      changed: Object.keys(changed).length ? changed : undefined,
      removed: Object.keys(removed).length ? removed : undefined,
    };
  }

  /**
   * Helper to compare the content of arrays.
   * Returns true if arrays are same, false otherwise.
   */
  static compareArrayContents(a: any[], b: any[]): boolean {
    if (a?.length !== b?.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (typeof a[i] !== typeof b[i]) {
        return false;
      } else {
        if (isPrimitiveType(typeof a[i])) {
          if (a[i] !== b[i]) {
            return false;
          }
        } else {
          return this.diff(a[i], b[i]).changed === undefined;
        }
      }
    }
    return true;
  }
}

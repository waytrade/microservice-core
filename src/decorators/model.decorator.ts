/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import {ModelMetadata, MODEL_METADATA} from "../core/metadata";

export function model(description: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any): any => {
    const typeName = target.name ?? target.constructor.name;
    const meta = MODEL_METADATA.getOrAdd(
      typeName,
      () => new ModelMetadata(target),
    );
    meta.description = description;
    return target;
  };
}

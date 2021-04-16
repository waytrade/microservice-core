/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {MicroserviceContext} from "..";
import {ModelMetadata} from "../core/metadata";

export function model(description: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any): any => {
    const typeName = target.name ?? target.constructor.name;
    const meta = MicroserviceContext.models.getOrAdd(
      typeName,
      () => new ModelMetadata(target),
    );
    meta.description = description;
    return target;
  };
}

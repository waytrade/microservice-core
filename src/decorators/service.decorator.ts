/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {MicroserviceContext} from "..";
import {ControllerMetadata} from "../core/metadata";

export function service() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any): any => {
    const typeName = target.name ?? target.constructor.name;
    const meta = MicroserviceContext.services.getOrAdd(
      typeName,
      () => new ControllerMetadata(),
    );
    meta.target = target;

    return target;
  };
}

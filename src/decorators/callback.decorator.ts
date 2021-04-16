/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {MicroserviceContext} from "..";
import {ControllerMetadata, MethodMetadata} from "../core/metadata";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function callback(url: string, model: any) {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const typeName = target.name ?? target.constructor.name;
    const meta = MicroserviceContext.controllers.getOrAdd(
      typeName,
      () => new ControllerMetadata(),
    );
    meta.target = target;
    const propMeta = meta.methods.getOrAdd(
      propertyKey,
      () => new MethodMetadata(propertyKey),
    );

    propMeta.callbackRefs.set(url, model.name);

    return descriptor;
  };
}

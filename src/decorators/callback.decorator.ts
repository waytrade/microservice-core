/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  ControllerMetadata,
  CONTROLLER_METADATA,
  MethodMetadata,
} from "../core/metadata";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function callback(url: string, model: any) {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const meta = CONTROLLER_METADATA.getOrAdd(
      target.name ?? target.constructor.name,
      () => new ControllerMetadata(),
    );

    const isStatic = target.name !== undefined;
    const propMeta = meta.methods.getOrAdd(
      propertyKey + (isStatic ? ":static" : ""),
      () => new MethodMetadata(propertyKey, isStatic),
    );

    propMeta.callbackRefs.set(url, model.name);

    return descriptor;
  };
}

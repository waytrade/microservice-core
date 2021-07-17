/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import {
  ControllerMetadata,
  CONTROLLER_METADATA,
  MethodMetadata,
} from "../core/metadata";

export function websocket(path: string) {
  return function (
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

    propMeta.path = path;
    propMeta.method = "get";
    propMeta.contentType = "application/json";
    propMeta.websocket = true;
    return descriptor;
  };
}

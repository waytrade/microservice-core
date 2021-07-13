/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  ControllerMetadata,
  CONTROLLER_METADATA,
  MethodMetadata,
  ResponseMetadata,
} from "../core/metadata";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function responseBody(model: any) {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const meta = CONTROLLER_METADATA.getOrAdd(
      target.name,
      () => new ControllerMetadata(),
    );

    const propMeta = meta.methods.getOrAdd(
      propertyKey,
      () => new MethodMetadata(propertyKey),
    );

    propMeta.responses.getOrAdd(200, () => new ResponseMetadata(200)).ref =
      model.name;

    return descriptor;
  };
}
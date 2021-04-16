/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {MicroserviceContext} from "..";
import {
  ControllerMetadata,
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
    const typeName = target.name ?? target.constructor.name;
    const meta = MicroserviceContext.controllers.getOrAdd(
      typeName,
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

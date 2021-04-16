/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {MicroserviceContext} from "../core/context";
import {ControllerMetadata, MethodMetadata} from "../core/metadata";

export function operation(method: string, path: string) {
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
    propMeta.path = path;
    propMeta.method = method;
    propMeta.contentType = "application/json";

    return descriptor;
  };
}

export function get(
  path: string,
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => PropertyDescriptor {
  return operation("get", path);
}

export function put(
  path: string,
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => PropertyDescriptor {
  return operation("put", path);
}

export function post(
  path: string,
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => PropertyDescriptor {
  return operation("post", path);
}

export function patch(
  path: string,
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => PropertyDescriptor {
  return operation("patch", path);
}

export function del(
  path: string,
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => PropertyDescriptor {
  return operation("delete", path);
}

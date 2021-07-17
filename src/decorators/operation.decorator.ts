/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  ControllerMetadata,
  CONTROLLER_METADATA,
  MethodMetadata,
} from "../core/metadata";

export function operation(method: string, path: string) {
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

export function webhookCallback(
  path: string,
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => PropertyDescriptor {
  return operation("post", path);
}

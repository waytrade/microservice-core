/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  ControllerMetadata,
  CONTROLLER_METADATA,
  MethodMetadata,
} from "../core/metadata";

/**
 * Add an OpenAPI path vendor extension.
 *
 * The name MUST NOT include the "x-" prefix, this will be added by default.
 * (example: name = "my-extension" will become "x-my-extension" on the
 * OpenAPI model)
 */
export function addPathVendorExtension(
  name: string,
  value: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  propertyKey: string,
): void {
  const meta = CONTROLLER_METADATA.getOrAdd(
    target.name ?? target.constructor.name,
    () => new ControllerMetadata(),
  );

  const isStatic = target.name !== undefined;
  const methodMeta = meta.methods.getOrAdd(
    propertyKey + (isStatic ? ":static" : ""),
    () => new MethodMetadata(propertyKey, isStatic),
  );

  methodMeta.vendorExtensions.set(name, value);
}

/**
 * Add an OpenAPI path vendor extension.
 *
 * The name MUST NOT include the "x-" prefix, this will be added by default.
 * (example: name = "my-extension" will become "x-my-extension" on the
 * OpenAPI model)
 */
export function pathVendorExtension(name: string, value: string) {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    addPathVendorExtension(name, value, target, propertyKey);
    return descriptor;
  };
}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  ControllerMetadata,
  CONTROLLER_METADATA,
  MethodMetadata,
} from "../core/metadata";

export function pathVendorExtension(name: string, value: string) {
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
    const methodMeta = meta.methods.getOrAdd(
      propertyKey + (isStatic ? ":static" : ""),
      () => new MethodMetadata(propertyKey, isStatic),
    );

    methodMeta.vendorExtensions.set(name, value);

    return descriptor;
  };
}

export const VENDOR_EXTENSION_WAYTRADE_EXPOSE_WITH_PERMISSIONS =
  "waytrade-gateway-expose-with-permissions";

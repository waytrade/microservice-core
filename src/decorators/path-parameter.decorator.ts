/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  ControllerMetadata,
  CONTROLLER_METADATA,
  MethodMetadata,
  QueryParamterMetadata,
} from "../core/metadata";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pathParameter(name: string, type: any, description?: string) {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    if (
      type.name !== "Number" &&
      type.name !== "String" &&
      type.name !== "Boolean"
    ) {
      return descriptor;
    }

    const meta = CONTROLLER_METADATA.getOrAdd(
      target.name ?? target.constructor.name,
      () => new ControllerMetadata(),
    );

    const isStatic = target.name !== undefined;
    const propMeta = meta.methods.getOrAdd(
      propertyKey + (isStatic ? ":static" : ""),
      () => new MethodMetadata(propertyKey, isStatic),
    );

    propMeta.queryParams.push(
      new QueryParamterMetadata(
        "path",
        name,
        String(type.name).toLowerCase(),
        true,
        description,
      ),
    );

    return descriptor;
  };
}

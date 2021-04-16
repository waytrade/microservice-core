/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {MicroserviceContext} from "../core/context";
import {
  ControllerMetadata,
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

    const typeName = target.name ?? target.constructor.name;
    const meta = MicroserviceContext.controllers.getOrAdd(
      typeName,
      () => new ControllerMetadata(),
    );

    const propMeta = meta.methods.getOrAdd(
      propertyKey,
      () => new MethodMetadata(propertyKey),
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

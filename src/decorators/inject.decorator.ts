/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  ControllerMetadata,
  CONTROLLER_METADATA,
  InjectedPropertyMetadata,
} from "../core/metadata";

export function inject(typeName: string): any {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const meta = CONTROLLER_METADATA.getOrAdd(
      target.name ?? target.constructor.name,
      () => new ControllerMetadata(),
    );

    meta.injectedProps.push(
      new InjectedPropertyMetadata(
        propertyKey,
        typeName,
        target.name !== undefined,
      ),
    );

    return descriptor;
  };
}

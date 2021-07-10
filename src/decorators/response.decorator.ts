/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  ControllerMetadata,
  CONTROLLER_METADATA,
  MethodMetadata,
  ResponseMetadata,
} from "../core/metadata";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function response(code: number, description?: any) {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const typeName = target.name ?? target.constructor.name;
    const meta = CONTROLLER_METADATA.getOrAdd(
      typeName,
      () => new ControllerMetadata(),
    );

    const propMeta = meta.methods.getOrAdd(
      propertyKey,
      () => new MethodMetadata(propertyKey),
    );

    propMeta.responses.getOrAdd(
      code,
      () => new ResponseMetadata(code),
    ).description = description;

    /*
    console.log(model);
    console.log(
      Reflect.getMetadata("design:type", target as Object, propertyKey),
    );
    // [Function: Function]
    // Checks the types of all params
    console.log(
      Reflect.getMetadata("design:paramtypes", target as Object, propertyKey),
    );
    // [[Function: Number]]
    // Checks the return type
    console.log(
      Reflect.getMetadata("design:returntype", target as Object, propertyKey),
    );*/

    return descriptor;
  };
}

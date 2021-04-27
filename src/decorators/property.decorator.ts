/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import "reflect-metadata";
import {MicroserviceContext} from "..";
import {ModelMetadata, PropertyMetadata} from "../core/metadata";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function property(description?: string): any {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const typeName = target.name ?? target.constructor.name;
    const modelMeta = MicroserviceContext.models.getOrAdd(
      typeName,
      () => new ModelMetadata(target.constructor),
    );
    modelMeta.properties.push(
      new PropertyMetadata(
        propertyKey,
        Reflect.getMetadata("design:type", target, propertyKey)?.name,
        description,
      ),
    );

    return descriptor;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function arrayProperty(itemModel: any, description?: string): any {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const modelMeta = MicroserviceContext.models.getOrAdd(
      target.constructor.name,
      () => new ModelMetadata(target.constructor),
    );
    modelMeta.properties.push(
      new PropertyMetadata(
        propertyKey,
        Reflect.getMetadata("design:type", target, propertyKey)?.name,
        description,
        itemModel.name,
      ),
    );
    return descriptor;
  };
}

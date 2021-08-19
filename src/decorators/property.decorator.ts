/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import "reflect-metadata";
import {
  EnumModelMetadata,
  ENUM_MODEL_METADATA,
  ModelMetadata,
  MODEL_METADATA,
  PropertyMetadata,
} from "../core/metadata";

export function property(description?: string): any {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const modelMeta = MODEL_METADATA.getOrAdd(
      target.constructor.name,
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

export function arrayProperty(itemModel: any, description?: string): any {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const modelMeta = MODEL_METADATA.getOrAdd(
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

export function enumProperty(
  enumName: string,
  enumType: any,
  description?: string,
): any {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const modelMeta = MODEL_METADATA.getOrAdd(
      target.constructor.name,
      () => new ModelMetadata(target.constructor),
    );
    modelMeta.properties.push(
      new PropertyMetadata(propertyKey, enumName, description, enumType.name),
    );

    const enumModelMeta = ENUM_MODEL_METADATA.getOrAdd(
      enumName,
      () => new EnumModelMetadata(),
    );

    enumModelMeta.name = enumName;

    for (const enumMember in enumType) {
      enumModelMeta.type = typeof enumType[enumMember];
      if (!enumModelMeta.values.find(v => v === enumType[enumMember])) {
        enumModelMeta.values.push(enumType[enumMember]);
      }
    }

    switch (enumModelMeta.type) {
      case "number":
        enumModelMeta.values = enumModelMeta.values.filter(
          v => typeof v === "number",
        );
        break;
      case "string":
        enumModelMeta.values = enumModelMeta.values.filter(
          v => typeof v === "string",
        );
        break;
    }

    return descriptor;
  };
}

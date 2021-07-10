import {
  CALLBACKS_METADATA,
  MethodMetadata,
  WebHookCallbackMetadata,
} from "../core/metadata";

export function webhookCallback(path: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const typeName = target.name ?? target.constructor.name;
    const meta = CALLBACKS_METADATA.getOrAdd(
      typeName,
      () => new WebHookCallbackMetadata(),
    );

    meta.target = target;

    const propMeta = meta.methods.getOrAdd(
      propertyKey,
      () => new MethodMetadata(propertyKey),
    );
    propMeta.path = path;
    propMeta.method = "post";
    propMeta.contentType = "application/json";

    return descriptor;
  };
}

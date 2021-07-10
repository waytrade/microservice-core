/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {ServiceMetadata, SERVICE_METADATA} from "../core/metadata";

export function service() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any): any => {
    const typeName = target.name ?? target.constructor.name;
    const meta = SERVICE_METADATA.getOrAdd(
      typeName,
      () => new ServiceMetadata(),
    );
    meta.target = target;

    return target;
  };
}

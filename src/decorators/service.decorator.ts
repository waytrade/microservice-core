/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {ServiceMetadata, SERVICE_METADATA} from "../core/metadata";

export function service() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any): any => {
    const meta = SERVICE_METADATA.getOrAdd(
      target.name,
      () => new ServiceMetadata(),
    );
    meta.target = target;

    return target;
  };
}

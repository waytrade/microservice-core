/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {ControllerMetadata, CONTROLLER_METADATA} from "../core/metadata";

export function controller(endpointName: string, baseUrl?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any): any => {
    const typeName = target.name ?? target.constructor.name;
    const meta = CONTROLLER_METADATA.getOrAdd(
      typeName,
      () => new ControllerMetadata(),
    );

    meta.endpointName = endpointName;
    meta.baseUrl = baseUrl ?? "/api";
    if (!meta.baseUrl.startsWith("/")) {
      meta.baseUrl += "/" + meta.baseUrl;
    }

    return target;
  };
}

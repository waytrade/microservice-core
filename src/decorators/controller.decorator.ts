/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {ControllerMetadata, CONTROLLER_METADATA} from "../core/metadata";

export function controller(endpointName: string, baseUrl?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any): any => {
    const meta = CONTROLLER_METADATA.getOrAdd(
      target.name,
      () => new ControllerMetadata(),
    );

    meta.endpointName = endpointName;
    meta.baseUrl = baseUrl ?? "";
    if (meta.baseUrl.length && !meta.baseUrl.startsWith("/")) {
      meta.baseUrl = "/" + meta.baseUrl;
    }

    return target;
  };
}

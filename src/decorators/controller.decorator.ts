/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {MicroserviceContext} from "..";
import {ControllerMetadata} from "../core/metadata";
import {ControllerType} from "../core/openapi";

export function controller(endpointName: string, baseUrl?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any): any => {
    const typeName = target.name ?? target.constructor.name;
    const meta = MicroserviceContext.controllers.getOrAdd(
      typeName,
      () => new ControllerMetadata(),
    );

    meta.type = ControllerType.API;
    meta.endpointName = endpointName;
    meta.baseUrl = baseUrl ?? "/api";
    if (!meta.baseUrl.startsWith("/")) {
      meta.baseUrl += "/" + meta.baseUrl;
    }

    return target;
  };
}

export function callbackController(endpointName: string, baseUrl?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any): any => {
    const typeName = target.name ?? target.constructor.name;
    const meta = MicroserviceContext.controllers.getOrAdd(
      typeName,
      () => new ControllerMetadata(),
    );

    meta.type = ControllerType.Callback;
    meta.endpointName = endpointName;
    meta.baseUrl = baseUrl ?? "/api";
    if (!meta.baseUrl.startsWith("/")) {
      meta.baseUrl += "/" + meta.baseUrl;
    }

    return target;
  };
}

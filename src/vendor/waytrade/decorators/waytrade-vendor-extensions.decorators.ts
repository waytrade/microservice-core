/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import {addPathVendorExtension} from "../../../decorators/path-vendor-extensions.decorator";
import {WaytradeEventMessageTopicDescriptor} from "../models/waytrade-event-stream.model";
import {WaytradeGatewayPermission} from "../models/waytrade-gateway-permission.model";

export const VENDOR_EXTENSION_WAYTRADE_GATEWAY_EXPOSE_ALWAYS =
  "waytrade-gateway-expose-always";

export const VENDOR_EXTENSION_WAYTRADE_GATEWAY_EXPOSE_WITH_PERMISSIONS =
  "waytrade-gateway-expose-with-permissions";

export const VENDOR_EXTENSION_WAYTRADE_GATEWAY_PUBLISHED_TOPICS =
  "waytrade-gateway-published-topics";

/**
 * When this extension is added, waytrade gateway will expose the decorated
 * function without checking for authentication or granted permissions.
 */
export function pathVendorExtension_WaytradeGatewayExposeAlways() {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    addPathVendorExtension(
      VENDOR_EXTENSION_WAYTRADE_GATEWAY_EXPOSE_ALWAYS,
      "true",
      target,
      propertyKey,
    );
    return descriptor;
  };
}

/**
 * When this extension is added, waytrade gateway only allow access to
 * users that are authenticated and own one of the listed permission grants.
 */
export function pathVendorExtension_WaytradeGatewayExposeWithPermission(
  permissions: WaytradeGatewayPermission[],
) {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    addPathVendorExtension(
      VENDOR_EXTENSION_WAYTRADE_GATEWAY_EXPOSE_WITH_PERMISSIONS,
      JSON.stringify(permissions),
      target,
      propertyKey,
    );
    return descriptor;
  };
}

/**
 * When this extension is added, it describes subscribable messages topics on an
 * event-stream, that shall be published to donwstream clients via the waytrade
 * gateway.
 */
export function pathVendorExtension_WaytradeGatewayPublishedTopcis(
  descriptors: WaytradeEventMessageTopicDescriptor[],
) {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    addPathVendorExtension(
      VENDOR_EXTENSION_WAYTRADE_GATEWAY_PUBLISHED_TOPICS,
      JSON.stringify(descriptors),
      target,
      propertyKey,
    );
    return descriptor;
  };
}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {MapExt} from "../util/map-ext";

/**
 * Metadata of a controller method.
 */
export class ResponseMetadata {
  constructor(public readonly code: number) {}
  description?: string;
  ref?: string;
}

/**
 * Metadata of a query parameter method.
 */
export class QueryParamterMetadata {
  constructor(
    public readonly inType: string,
    public readonly name: string,
    public readonly type: string,
    public readonly required: boolean,
    public readonly description?: string,
  ) {}
}

/**
 * Metadata of a controller method.
 */
export class MethodMetadata {
  constructor(public readonly propertyKey: string) {}
  method?: string;
  path?: string;
  contentType?: string;
  summary?: string;
  description?: string;
  readonly queryParams: QueryParamterMetadata[] = [];
  readonly responses = new MapExt<number, ResponseMetadata>();
  requestBodyRef?: string;
  readonly callbackRefs = new MapExt<string, string>();
  bearerAuthScopes?: string[];
  websocket?: boolean;
}

/**
 * Metadata of a controller.
 */
export class ControllerMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target?: any;
  endpointName?: string;
  baseUrl?: string;
  readonly methods = new MapExt<string, MethodMetadata>();
}

/**
 * Metadata of a service.
 */
export class ServiceMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target?: any;
}

/**
 * Metadata of a webhook callback.
 */
export class WebHookCallbackMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target?: any;
  endpointName?: string;
  readonly methods = new MapExt<string, MethodMetadata>();
}

/**
 * Metadata of a model property.
 */
export class PropertyMetadata {
  constructor(
    public readonly propertyKey: string,
    public readonly type: string,
    public readonly description?: string,
    public readonly arrayItemType?: string,
  ) {}
}

/**
 * Metadata of a model.
 */
export class ModelMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(public readonly target: any) {}
  description?: string;
  readonly properties: PropertyMetadata[] = [];
}

/**
 * Metadata of an enum model.
 */
export class EnumModelMetadata {
  name?: string;
  type?: string;
  description?: string;
  values: string[] = [];
}

/** All model metadata, with target object as key. */
export const CONTROLLER_METADATA: MapExt<string, ControllerMetadata> =
  new MapExt();

/** All service metadata, with target object as key. */
export const SERVICE_METADATA: MapExt<string, ServiceMetadata> = new MapExt();

/** All webhook callback metadata, with target object as key. */
export const CALLBACKS_METADATA: MapExt<string, WebHookCallbackMetadata> =
  new MapExt();

/** All model metadata, with target object as key. */
export const MODEL_METADATA: MapExt<string, ModelMetadata> = new MapExt();

/** All enum model metadata, with target object as key. */
export const ENUM_MODEL_METADATA: MapExt<string, EnumModelMetadata> =
  new MapExt();

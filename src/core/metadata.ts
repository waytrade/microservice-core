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
  constructor(
    public readonly propertyKey: string,
    public readonly isStatic: boolean,
  ) {}
  method = "";
  path = "";
  contentType = "application/json";
  summary?: string;
  description?: string;
  readonly queryParams: QueryParamterMetadata[] = [];
  readonly responses = new MapExt<number, ResponseMetadata>();
  requestBodyRef?: string;
  readonly callbackRefs = new MapExt<string, string>();
  bearerAuthScopes?: string[];
  websocket?: boolean;
  readonly vendorExtensions = new MapExt<string, string>();
}

/**
 * Metadata of an injected property.
 */
export class InjectedPropertyMetadata {
  constructor(
    public readonly propertyKey: string,
    public readonly typeName: string,
    public readonly isStatic: boolean,
  ) {}
}

/**
 * Metadata of a controller.
 */
export class ControllerMetadata {
  endpointName?: string;
  baseUrl = "";
  readonly methods = new MapExt<string, MethodMetadata>();
  readonly injectedProps: InjectedPropertyMetadata[] = [];
}

/**
 * Metadata of a service.
 */
export class ServiceMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target?: any;
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

/** All model metadata, with target object as key. */
export const MODEL_METADATA: MapExt<string, ModelMetadata> = new MapExt();

/** All enum model metadata, with target object as key. */
export const ENUM_MODEL_METADATA: MapExt<string, EnumModelMetadata> =
  new MapExt();

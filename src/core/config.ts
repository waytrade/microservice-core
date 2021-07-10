import * as dotenv from "dotenv";
import {readFileSync} from "fs";
import * as path from "path";

/**
 * The Microservice Configuration.
 */
export interface MicroserviceConfig {
  /** The name of the microservice. */
  NAME?: string;

  /** The version of the microservice. */
  VERSION?: string;

  /** The description of the microservice. */
  DESCRIPTION?: string;

  /** The port of the API server. */
  SERVER_PORT?: number;

  /** The port of the callback server. */
  CALLBACK_PORT?: number;

  /** The log level (error, warn, info, debug or verbose). */
  LOG_LEVEL?: string;

  /**
   * The path for storing the log files.
   * If not specified, log output will be sent to stdout instead.
   */
  LOG_FILE_PATH?: string;

  /** true if running in production environment, false otherwise. */
  isProduction?: boolean;

  /** true if running in development environment, false otherwise. */
  isDevelopment?: boolean;

  /** true if running in test environment, false otherwise. */
  isTest?: boolean;

  /** Other properties. */
  [prop: string]: unknown;
}

/**
 * Helper function to read configuration from json file,
 * or throw an error parsing fails.
 */
function readJson(readPath: string): unknown {
  try {
    const data = readFileSync(readPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (
      error.code !== "ENOENT" ||
      (error.errno !== -4058 && error.errno !== -2)
    ) {
      throw error;
    }
  }
  return {};
}

/**
 * Helper function to read configuration from a json file
 * on ./config directory, or throw an error parsing fails.
 */
function readConfig(rootFolder: string, envName: string): MicroserviceConfig {
  const filePath = path.resolve(rootFolder, `./config/${envName}.json`);
  return readJson(filePath) as MicroserviceConfig;
}

/**
 * Helper function to read package.json from process directory.
 */
function readPackage(rootFolder: string): Record<string, string> {
  const filePath = path.resolve(rootFolder, "./package.json");
  return readJson(filePath) as Record<string, string>;
}

/**
 * Overwrite values on the given [[Configuration]] with
 * value from environment variables.
 */
function assignEnvironment(config: MicroserviceConfig): MicroserviceConfig {
  Object.keys(config).forEach(key => {
    config[key] = process.env[key] ?? config[key];
  });
  return config;
}

/**
 * Load the configuration file for the given environment and
 * overwrite values on the given [[Configuration]] with values from the file.
 */
function loadEnvironmentConfig(
  rootFolder: string,
  config: MicroserviceConfig,
  environment: string,
): MicroserviceConfig {
  let newConfig = config;
  if (environment) {
    const conf = readConfig(rootFolder, environment);
    if (conf) {
      newConfig = {
        ...newConfig,
        ...conf,
      };
    }
  }
  return newConfig;
}

/**
 * Helper function to ensure numbers are number type.
 */
function ensureInteger(config: MicroserviceConfig): void {
  Object.keys(config).forEach(field => {
    const value = config[field] as unknown;
    if (typeof value === "string") {
      const i = parseInt(value, 10);
      if (!isNaN(i)) {
        config[field] = i as never;
      }
    }
  });
}

/**
 * Read the Microservice configuration.
 */
export async function readConfiguration(
  rootFolder: string,
): Promise<MicroserviceConfig> {
  // load .env and package.json file

  dotenv.config();

  // load default config

  const pkg = readPackage(rootFolder);
  let config = readConfig(rootFolder, "default");

  // load environment specific config

  const nodeEnvironment = process.env.NODE_ENV;

  if (nodeEnvironment) {
    config = loadEnvironmentConfig(rootFolder, config, nodeEnvironment);
  }

  // load config from env variables

  config = assignEnvironment(config);

  // convert strings to numbers

  ensureInteger(config);

  // init package values and runtime mode

  config.NAME = pkg?.name ?? "";
  config.VERSION = pkg?.version ?? "";
  config.DESCRIPTION = pkg?.description;

  config.isProduction = nodeEnvironment === "production";
  config.isDevelopment = nodeEnvironment === "development" || !nodeEnvironment;
  config.isTest = nodeEnvironment === "test";

  // overwrite with env vars

  Object.assign(config, process.env);

  // return config

  return config;
}

import {MicroserviceApp, MicroserviceConfig, MicroserviceContext} from "..";

/**
 * Base-class for service test applications. service test application.
 */
export class MicroserviceTestApp extends MicroserviceApp<MicroserviceConfig> {
  constructor(
    projectRootFolder: string,
    controllers: unknown[],
    services: unknown[],
    externalContext: MicroserviceContext,
  ) {
    super(projectRootFolder, controllers, services, externalContext);
  }
}

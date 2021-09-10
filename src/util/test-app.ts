import {MicroserviceApp, MicroserviceConfig} from "..";
import {MicroserviceAppParams, MicroserviceComponentFactory} from "../core/app";

/**
 * Base-class for service test applications.
 */
export class MicroserviceTestApp<
  CONFIG_TYPE extends MicroserviceConfig,
> extends MicroserviceApp<CONFIG_TYPE> {
  constructor(
    projectRootFolder: string,
    params: MicroserviceAppParams,
    componentFactory: MicroserviceComponentFactory = new MicroserviceComponentFactory(),
  ) {
    super(projectRootFolder, params, componentFactory);
  }

  protected async boot(): Promise<void> {
    return;
  }
}

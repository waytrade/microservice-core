import {MicroserviceApp, MicroserviceConfig} from "..";
import {MicroserviceAppParams} from "../core/app";

/**
 * Base-class for service test applications.
 */
export class MicroserviceTestApp<
  CONFIG_TYPE extends MicroserviceConfig,
> extends MicroserviceApp<CONFIG_TYPE> {
  constructor(projectRootFolder: string, params?: MicroserviceAppParams) {
    super(projectRootFolder, params);
  }

  async onBoot(): Promise<void> {
    return;
  }
}

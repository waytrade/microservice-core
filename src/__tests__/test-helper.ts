import path from "path";
import {MicroserviceApp} from "..";

/**
 * The test application.
 */
class TestApp extends MicroserviceApp {
  constructor(private readonly startCallback: () => void) {
    super(path.resolve(__dirname, "../.."));
  }
  async onBoot(): Promise<void> {
    return;
  }
  onStarted(): void {
    this.startCallback();
  }
}

/**
 * Start the TestApp.
 */
export async function startTestApp(): Promise<MicroserviceApp> {
  return new Promise<TestApp>(resolve => {
    const app = new TestApp(() => {
      resolve(app);
    });
    app.run();
  });
}

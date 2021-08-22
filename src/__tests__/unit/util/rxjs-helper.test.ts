import {Subject} from "rxjs";
import {subscribeUntil} from "../../..";

describe("Test RxJS helper", () => {
  test("subscribeUntil", () => {
    return new Promise<void>((resolve, reject) => {
      const cancelSignal = new Subject();
      const observable = new Subject<boolean>();

      subscribeUntil(cancelSignal, observable, {
        next: val => {
          expect(val).toBeTruthy();
          cancelSignal.next(true);
          return;
        },
        complete: () => {
          resolve();
        },
        error: err => {
          reject(err);
        },
      });

      observable.next(true);
    });
  });
});

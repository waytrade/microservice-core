import {Subject} from "rxjs";
import {subscribeUntil} from "../../..";

describe("Test RxJS helper", () => {
  test("subscribeUntil (with Subject<unknown>)", () => {
    return new Promise<void>((resolve, reject) => {
      const cancelSignal = new Subject();
      const observable = new Subject<boolean>();

      subscribeUntil(cancelSignal, observable, {
        next: val => {
          expect(val).toBeTruthy();
          cancelSignal.next(true);
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

  test("subscribeUntil (with Subject<void>)", () => {
    return new Promise<void>((resolve, reject) => {
      const cancelSignal = new Subject<void>();
      const observable = new Subject<boolean>();

      subscribeUntil(cancelSignal, observable, {
        next: val => {
          expect(val).toBeTruthy();
          cancelSignal.next();
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

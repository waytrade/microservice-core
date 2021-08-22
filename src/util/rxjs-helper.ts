import {Observable, Observer, Subject, takeUntil} from "rxjs";

/** Subscribe on the given observable until a value is emiited by cancelSignal. */
export function subscribeUntil<T>(
  cancelSignal: Subject<unknown>,
  observable: Observable<T>,
  observer: Partial<Observer<T>>,
): void {
  // eslint-disable-next-line rxjs/no-ignored-subscription
  observable.pipe(takeUntil(cancelSignal)).subscribe(observer);
}

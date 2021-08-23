import {Observable, Observer, takeUntil} from "rxjs";

/** Subscribe on the given observable until a value is emiited by cancelSignal. */
export function subscribeUntil<OBSERVABLE_TYPE, SIGNAL_TYPE>(
  cancelSignal: Observable<SIGNAL_TYPE>,
  observable: Observable<OBSERVABLE_TYPE>,
  observer: Partial<Observer<OBSERVABLE_TYPE>>,
): void {
  // eslint-disable-next-line rxjs/no-ignored-subscription
  observable.pipe(takeUntil(cancelSignal)).subscribe(observer);
}

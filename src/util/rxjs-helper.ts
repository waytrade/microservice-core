import {firstValueFrom, Observable, Observer} from "rxjs";

/** Subscribe on the given observable until a value is emiited by cancelSignal. */
export function subscribeUntil<OBSERVABLE_TYPE, SIGNAL_TYPE>(
  cancelSignal: Observable<SIGNAL_TYPE>,
  observable: Observable<OBSERVABLE_TYPE>,
  observer: Partial<Observer<OBSERVABLE_TYPE>>,
): Promise<void> {
  return new Promise<void>(res => {
    const sub$ = observable.subscribe(observer);
    firstValueFrom(cancelSignal).then(() => {
      sub$.unsubscribe();
      res();
    });
  });
}

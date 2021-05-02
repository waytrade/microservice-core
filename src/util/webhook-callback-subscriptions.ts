import axios, {AxiosError} from "axios";
import {Observable, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";

/** A Webhook callback subscription. */
interface WebhookCallbackSubscription {
  url: string;
  stopNotifier: Subject<unknown>;
}

/** Webhook callback subscriptions manager. */
export class WebhookCallbackSubscriptions<T> {
  constructor(
    private errorCallback: (url: string, error: AxiosError) => void,
  ) {}

  /** Set of currently active subscription. */
  private readonly callbacks = new Map<string, WebhookCallbackSubscription>();

  /**
   * Add a webhook callback subscription.
   *
   * If the subscription already exists, re-subscription on the up-stream
   * observable will be triggered, causing a full-sync update.
   *
   * @param uuid A unique id of the subscription. Can be used to for e.g.
   * registering multiple market data hooks for different assets, to same
   * webhook callback.
   */
  add(
    remoteAddress: string,
    remotePort: number,
    callbackUrl: string,
    observable: Observable<T>,
    uuid?: string,
  ): boolean {
    // format absolute url

    const isIPv6 = remoteAddress.indexOf(":") !== -1;
    const url = isIPv6
      ? `http://[${remoteAddress}]:${remotePort}${callbackUrl}`
      : `http://${remoteAddress}:${remotePort}${callbackUrl}`;

    // check if already registered

    const id = `${url}:${uuid}`;

    const callback = this.callbacks.get(id);
    if (callback) {
      // already exists: stop previous and re-subscribe
      callback.stopNotifier.next();
    }

    // subscribe on observable

    const stopNotifier = new Subject();

    // eslint-disable-next-line rxjs/no-ignored-subscription
    observable.pipe(takeUntil(stopNotifier)).subscribe({
      next: update => {
        this.invokeCallback(url, update).catch(error => {
          this.callbacks.delete(id);
          this.errorCallback(url, error);
          stopNotifier.next();
        });
      },
    });

    // add to callbacks and return true

    this.callbacks.set(id, {url, stopNotifier});

    return true;
  }

  /** Clear all registered callback subscriptions. */
  clear(): void {
    this.callbacks.forEach(sub => {
      sub.stopNotifier.next();
    });
    this.callbacks.clear();
  }

  /** Invoke a webhook callback. */
  private invokeCallback(url: string, data: unknown): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      axios
        .post(url, data)
        .then(response => {
          if (response.status !== 200) {
            reject();
          } else {
            resolve();
          }
        })
        .catch((error: AxiosError) => {
          reject(error);
        });
    });
  }
}

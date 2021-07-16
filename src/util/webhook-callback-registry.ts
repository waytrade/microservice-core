import axios, {AxiosError} from "axios";
import {Observable, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {
  HttpStatus,
  HttpStatusCode,
  MicroserviceRequest,
  WebhookSubscriptionRequest,
} from "..";

/** A Webhook callback subscription. */
interface WebhookCallbackSubscription {
  url: string;
  stopNotifier: Subject<void>;
}

/** Webhook callback subscription registry. */
export class WebhookCallbackRegistry<T> {
  constructor(
    private errorCallback: (url: string, error: AxiosError) => void,
  ) {}

  /** Set of currently active subscription. */
  private readonly callbacks = new Map<string, WebhookCallbackSubscription>();

  /**
   * Add a webhook callback subscription.
   *
   * @returns HttpStatus.NO_CONTENT if the subscription already exists,
   * HttpStatus.CREATED if the subscription has been added, or
   * HttpStatus.BAD_REQUEST if any arguments are invalid.
   */
  add(
    request: MicroserviceRequest,
    args: WebhookSubscriptionRequest,
    observable: Observable<T>,
  ): HttpStatusCode {
    // verify arguments

    if (!request || !args || !args.port || !args.callbackUrl || !observable) {
      return HttpStatus.BAD_REQUEST;
    }

    // check if already registered

    const url = this.formatCallbackUrl(request, args);
    if (this.callbacks.has(url)) {
      return HttpStatus.NO_CONTENT;
    }

    // subscribe on observable

    const stopNotifier = new Subject<void>();

    // eslint-disable-next-line rxjs/no-ignored-subscription
    observable.pipe(takeUntil(stopNotifier)).subscribe({
      next: update => {
        this.invokeCallback(url, update).catch(error => {
          this.callbacks.delete(url);
          this.errorCallback(url, error);
          stopNotifier.next();
        });
      },
      error: error => {
        this.callbacks.delete(url);
        this.errorCallback(url, error);
      },
    });

    // add to callbacks

    this.callbacks.set(url, {url, stopNotifier});

    return HttpStatus.CREATED;
  }

  /**
   * Remove a webhook callback subscription.
   *
   * @returns HttpStatus.OK if the subscription has been remove,
   * HttpStatus.NOT_FOUND if the subscription does not exist, or
   * HttpStatus.BAD_REQUEST if any arguments are invalid.
   */
  remove(
    request: MicroserviceRequest,
    args: WebhookSubscriptionRequest,
  ): HttpStatusCode {
    // verify arguments

    if (!request || !args || !args.port || !args.callbackUrl) {
      return HttpStatus.BAD_REQUEST;
    }

    // unregister

    const url = this.formatCallbackUrl(request, args);
    const sub = this.callbacks.get(url);
    if (!sub) {
      return HttpStatus.NOT_FOUND;
    }

    sub.stopNotifier.next();
    this.callbacks.delete(url);

    return HttpStatus.OK;
  }

  /** Clear all registered callback subscriptions. */
  clear(): void {
    this.callbacks.forEach(sub => {
      sub.stopNotifier.next();
    });
    this.callbacks.clear();
  }

  /** Invoke the webhook callback function. */
  private invokeCallback(url: string, data: unknown): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      axios
        .post(url, data)
        .then(() => {
          resolve();
        })
        .catch((error: AxiosError) => {
          reject(error);
        });
    });
  }

  /** Format the full absolute URL of a webhook callback. */
  private formatCallbackUrl(
    request: MicroserviceRequest,
    args: WebhookSubscriptionRequest,
  ): string {
    const remoteAddress = args.host ?? request.remoteAddress;
    const isIPv6 = remoteAddress.indexOf(":") !== -1;
    return isIPv6
      ? `http://[${remoteAddress}]:${args.port}${args.callbackUrl}`
      : `http://${remoteAddress}:${args.port}${args.callbackUrl}`;
  }
}

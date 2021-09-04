import {
  BehaviorSubject,
  filter,
  firstValueFrom,
  map,
  Observable,
  Subject,
  Subscription,
  takeUntil,
} from "rxjs";
import {MapExt, MicroserviceStream} from "..";

/** Event stream commands (client -> server).  */
export enum EventStreamCommand {
  /** Subscribe for an event type. */
  Subscribe = "sub",
  /** Unsubscribe from an event type. */
  Unsubscribe = "unsub",
}

/**
 * A class to manage event subscriptions for defined event types and
 * to dispatch events from source Observables to into the event stream.
 *
 * When the MicroserviceStream is closed, all event source Observables
 * will be unsubscribed.
 */
export class EventToStreamDispatcher<EVENT_TYPE extends string, SERVICE_TYPE> {
  constructor(
    private stream: MicroserviceStream,
    private service: SERVICE_TYPE,
    private eventSources: Map<
      EVENT_TYPE,
      (service: SERVICE_TYPE, args: string[]) => Observable<unknown>
    >,
    private customCommandHandler?: (commandMessage: string) => void,
  ) {
    stream.closed.then(() => {
      this.cancelSubscriptions.next();
      this.subscriptions.clear();
      this.closedSubject.next(true);
    });
    stream.onReceived = (message): void => {
      try {
        if (!this.processCommand(message) && this.customCommandHandler) {
          this.customCommandHandler(message);
        }
      } catch (e) {
        stream.close();
      }
    };
  }

  /** Map of all subscriptions on IBApiService with eventType:args as key.*/
  private subscriptions = new MapExt<string, Subscription>();

  /** Cancel all subscriptions. */
  private cancelSubscriptions = new Subject<void>();

  /**
   * Subject signalling when the stream has been closed and dispatcher
   * has unsubscribed on the event sources.
   */
  private readonly closedSubject = new BehaviorSubject<boolean>(false);

  /**
   * Promise signalling when the stream has been closed and dispatcher
   * has unsubscribed on the event sources.
   */
  get closed(): Promise<void> {
    return firstValueFrom(
      this.closedSubject.pipe(
        filter(v => v === true),
        map(() => {
          return;
        }),
      ),
    );
  }

  /**
   * Returns true when the stream has been closed and dispatcher
   * has unsubscribed on the event sources, false otherwise.
   */
  get isClosed(): boolean {
    return this.closedSubject.value;
  }

  /** Process a client command. */
  private processCommand(command: string): boolean {
    const tokens = command.split(":");
    if (tokens.length < 2) {
      this.sendError("Invalid command", command);
      return false;
    }

    const cmd = tokens[0];
    const eventType = tokens[1];
    if (!eventType || !eventType.length) {
      this.sendError("No event type specified", cmd);
    }
    const eventArgs = tokens.length > 2 ? tokens.slice(2) : [];

    switch (cmd) {
      case EventStreamCommand.Subscribe:
        this.subscribeEvents(eventType as EVENT_TYPE, eventArgs);
        break;
      case EventStreamCommand.Unsubscribe:
        this.unsubscribeEvents(eventType as EVENT_TYPE, eventArgs);
        break;
      default:
        this.sendError("Unknown command type", cmd);
        return false;
    }

    return true;
  }

  /** Subscribe on an given event type */
  private subscribeEvents(eventType: EVENT_TYPE, args: string[]): void {
    const key = `${eventType}:${JSON.stringify(args)}`;

    // lookup event source

    const eventSource = this.eventSources.get(eventType);
    if (!eventSource) {
      this.sendError("Invalid event type", eventType);
      return;
    }

    const eventSourceStream = eventSource(this.service, args);

    const oldSubscription = this.subscriptions.get(key);
    const newSubscription = eventSourceStream
      .pipe(takeUntil(this.cancelSubscriptions))
      .subscribe({
        next: update => {
          const obj: Record<string, unknown> = {};
          obj[(<unknown>eventType) as string] = update;

          this.stream.send(JSON.stringify(obj));
        },
        error: err => {
          this.subscriptions.delete(key);

          let argsStr = "";
          args.forEach(arg => (argsStr = argsStr + arg + ":"));
          argsStr = argsStr.substr(0, argsStr.length - 1);

          this.sendError(
            (err as Error).message ?? (err as string),
            `${eventType}:${argsStr}`,
          );
        },
      });

    oldSubscription?.unsubscribe();

    this.subscriptions.set(key, newSubscription);
  }

  /** Unsubscribe from an given event type */
  private unsubscribeEvents(eventType: EVENT_TYPE, args: string[]): void {
    const key = `${eventType}:${JSON.stringify(args)}`;
    const sub = this.subscriptions.get(key);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /** Send an error event to the channel. */
  private sendError(message: string, key?: string): void {
    this.stream.send(
      JSON.stringify({
        error: {
          message,
          key,
        },
      }),
    );
  }
}

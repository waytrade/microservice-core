import {BehaviorSubject, firstValueFrom, Observable, Subject} from "rxjs";
import {EventToStreamDispatcher, MicroserviceStream} from "../../..";
import {subscribeUntil} from "../../../util/rxjs-helper";

class DummyTestService {}

class MicroserviceStreamMock implements MicroserviceStream {
  receivedFromServer = new Subject<string>();
  send = (msg: string): boolean => {
    this.receivedFromServer.next(msg);
    return true;
  };

  url = "";
  requestHeader = new Map();
  onReceived?: (message: string) => void;

  closedSubject = new Subject<void>();
  close = (): void => {
    this.closedSubject.next();
  };
  closed = firstValueFrom(this.closedSubject);
}

describe("Test EventStreamDispatcher class", () => {
  test("Close client stream", () => {
    return new Promise<void>((resolve, reject) => {
      const service = new DummyTestService();
      const eventSources = new Map();
      const clientStream = new MicroserviceStreamMock();

      const dispatcher = new EventToStreamDispatcher(
        clientStream,
        service,
        eventSources,
      );

      setTimeout(() => {
        clientStream.close();
      }, 10);

      dispatcher.closed.then(() => {
        expect(dispatcher.isClosed).toBeTruthy();
        resolve();
      });
    });
  });

  test("Send invalid command", () => {
    return new Promise<void>((resolve, reject) => {
      const service = new DummyTestService();
      const eventSources = new Map();
      const clientStream = new MicroserviceStreamMock();

      new EventToStreamDispatcher(clientStream, service, eventSources);

      const sendFromClientToServer = clientStream.onReceived;
      expect(sendFromClientToServer).toBeDefined();
      if (!sendFromClientToServer) {
        reject();
        return;
      }

      firstValueFrom(clientStream.receivedFromServer).then(message => {
        const event = JSON.parse(message) as Record<
          string,
          Record<string, string>
        >;
        expect(event.error).toBeDefined();
        expect(event.error.message).toEqual("Invalid command");
        expect(event.error.key).toEqual("thisIsNoValidCommand");
        resolve();
      });

      sendFromClientToServer("thisIsNoValidCommand");
    });
  });

  test("Send command without event type", () => {
    return new Promise<void>((resolve, reject) => {
      const service = new DummyTestService();
      const eventSources = new Map();
      const clientStream = new MicroserviceStreamMock();

      new EventToStreamDispatcher(clientStream, service, eventSources);

      const sendFromClientToServer = clientStream.onReceived;
      expect(sendFromClientToServer).toBeDefined();
      if (!sendFromClientToServer) {
        reject();
        return;
      }

      firstValueFrom(clientStream.receivedFromServer).then(message => {
        const event = JSON.parse(message) as Record<
          string,
          Record<string, string>
        >;
        expect(event.error).toBeDefined();
        expect(event.error.message).toEqual("No event type specified");
        expect(event.error.key).toEqual("thisIsNoValidCommand");
        resolve();
      });

      sendFromClientToServer("thisIsNoValidCommand:");
    });
  });

  test("Send unknonwn command", () => {
    return new Promise<void>((resolve, reject) => {
      const service = new DummyTestService();
      const eventSources = new Map();
      const clientStream = new MicroserviceStreamMock();

      new EventToStreamDispatcher(clientStream, service, eventSources, cmd => {
        expect(cmd).toEqual("thisIsNoValidCommand:eventType");
      });

      const sendFromClientToServer = clientStream.onReceived;
      expect(sendFromClientToServer).toBeDefined();
      if (!sendFromClientToServer) {
        reject();
        return;
      }

      firstValueFrom(clientStream.receivedFromServer).then(message => {
        const event = JSON.parse(message) as Record<
          string,
          Record<string, string>
        >;
        expect(event.error).toBeDefined();
        expect(event.error.message).toEqual("Unknown command type");
        expect(event.error.key).toEqual("thisIsNoValidCommand");
        resolve();
      });

      sendFromClientToServer("thisIsNoValidCommand:eventType");
    });
  });

  test("Subscribe for unknown event type", () => {
    return new Promise<void>((resolve, reject) => {
      const service = new DummyTestService();
      const eventSources = new Map();
      const clientStream = new MicroserviceStreamMock();

      new EventToStreamDispatcher(clientStream, service, eventSources);

      const sendFromClientToServer = clientStream.onReceived;
      expect(sendFromClientToServer).toBeDefined();
      if (!sendFromClientToServer) {
        reject();
        return;
      }

      firstValueFrom(clientStream.receivedFromServer).then(message => {
        const event = JSON.parse(message) as Record<
          string,
          Record<string, string>
        >;
        expect(event.error).toBeDefined();
        expect(event.error.message).toEqual("Invalid event type");
        expect(event.error.key).toEqual("thisIsNoValidEvenType");
        resolve();
      });

      sendFromClientToServer("sub:thisIsNoValidEvenType");
    });
  });

  test("Subscribe / Re-Subscribe for event type", () => {
    return new Promise<void>((resolve, reject) => {
      let testValue = Math.random();
      const service = new DummyTestService();
      const eventType1Subject = new BehaviorSubject<number>(testValue);

      const eventSources = new Map([
        [
          "eventType1",
          (serviceArg: DummyTestService): Observable<number> => {
            expect(serviceArg).toBe(service);
            return eventType1Subject;
          },
        ],
      ]);

      const clientStream = new MicroserviceStreamMock();

      new EventToStreamDispatcher(clientStream, service, eventSources);

      const sendFromClientToServer = clientStream.onReceived;
      expect(sendFromClientToServer).toBeDefined();
      if (!sendFromClientToServer) {
        reject();
        return;
      }

      let messagesReceived = 0;

      subscribeUntil(
        new Observable<void>(res => {
          clientStream.closed.then(() => res.next());
        }),
        clientStream.receivedFromServer,
        {
          next: message => {
            const event = JSON.parse(message) as Record<
              string,
              Record<string, string>
            >;
            switch (messagesReceived) {
              case 0:
              case 1:
              case 2:
                expect(event.eventType1).toEqual(testValue);
                const count = messagesReceived;
                setTimeout(() => {
                  if (count === 0) {
                    // re-sub
                    sendFromClientToServer("sub:eventType1");
                  } else {
                    // send new value
                    testValue = Math.random();
                    eventType1Subject.next(testValue);
                  }
                }, 1);
                break;
              case 3:
                resolve();
                break;
            }
            messagesReceived++;
          },
        },
      );

      sendFromClientToServer("sub:eventType1");
    });
  }, 999999);

  test("Subscribe / Unsubscribe for event type", () => {
    return new Promise<void>((resolve, reject) => {
      const testValue = Math.random();
      const service = new DummyTestService();
      const eventType1Subject = new BehaviorSubject<number>(testValue);
      const eventSources = new Map([
        [
          "eventType1",
          (serviceArg: DummyTestService): Observable<number> => {
            expect(serviceArg).toBe(service);
            return eventType1Subject;
          },
        ],
      ]);

      const clientStream = new MicroserviceStreamMock();

      new EventToStreamDispatcher(clientStream, service, eventSources);

      const sendFromClientToServer = clientStream.onReceived;
      expect(sendFromClientToServer).toBeDefined();
      if (!sendFromClientToServer) {
        reject();
        return;
      }

      firstValueFrom(clientStream.receivedFromServer).then(message => {
        const event = JSON.parse(message) as Record<
          string,
          Record<string, string>
        >;
        expect(event.eventType1).toEqual(testValue);

        sendFromClientToServer("unsub:eventType1");
        // just to test code-path for non-existing subscriptions
        sendFromClientToServer("unsub:eventType1");

        eventType1Subject.next(1);

        const succeedTimout = setTimeout(() => {
          resolve();
        }, 50);

        firstValueFrom(clientStream.receivedFromServer).then(message => {
          clearTimeout(succeedTimout);
          reject(message);
        });
      });

      sendFromClientToServer("sub:eventType1");
    });
  });

  test("Emit error from source", () => {
    return new Promise<void>((resolve, reject) => {
      const testValue = Math.random();
      const service = new DummyTestService();
      const eventType1Subject = new BehaviorSubject<number>(testValue);
      const eventSources = new Map([
        [
          "eventType1",
          (serviceArg: DummyTestService): Observable<number> => {
            expect(serviceArg).toBe(service);
            return eventType1Subject;
          },
        ],
      ]);

      const clientStream = new MicroserviceStreamMock();

      new EventToStreamDispatcher(clientStream, service, eventSources);

      const sendFromClientToServer = clientStream.onReceived;
      expect(sendFromClientToServer).toBeDefined();
      if (!sendFromClientToServer) {
        reject();
        return;
      }

      firstValueFrom(clientStream.receivedFromServer).then(message => {
        const event = JSON.parse(message) as Record<
          string,
          Record<string, string>
        >;
        expect(event.eventType1).toEqual(testValue);

        firstValueFrom(clientStream.receivedFromServer).then(message => {
          const event = JSON.parse(message) as Record<
            string,
            Record<string, string>
          >;

          expect(event.error).toBeDefined();
          expect(event.error.message).toEqual("thisIsAnError");
          expect(event.error.key).toEqual("eventType1:argument1:argument2");
          resolve();
        });

        eventType1Subject.error("thisIsAnError");
      });

      sendFromClientToServer("sub:eventType1:argument1:argument2");
    });
  });
});

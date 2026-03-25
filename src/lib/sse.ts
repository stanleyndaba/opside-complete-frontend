export type SSEMessageHandler = (eventName: string, payload: any, rawEvent: MessageEvent) => void;

type EventSourceLike = {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
};

export function registerNamedSSEListeners(
  eventSource: EventSourceLike,
  eventNames: string[],
  handler: SSEMessageHandler
) {
  const listeners = eventNames.map((eventName) => {
    const listener = (event: Event) => {
      const messageEvent = event as MessageEvent;
      try {
        const payload = JSON.parse(messageEvent.data);
        handler(eventName, payload, messageEvent);
      } catch {
        handler(eventName, messageEvent.data, messageEvent);
      }
    };

    eventSource.addEventListener(eventName, listener as EventListener);
    return { eventName, listener };
  });

  return () => {
    listeners.forEach(({ eventName, listener }) => {
      eventSource.removeEventListener(eventName, listener as EventListener);
    });
  };
}

export function parseDefaultSSEMessage(rawEvent: MessageEvent) {
  try {
    return JSON.parse(rawEvent.data);
  } catch {
    return rawEvent.data;
  }
}

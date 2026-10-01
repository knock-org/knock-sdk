type Listener = (payload: unknown) => void;

/** Minimal typed pub/sub. One instance per KnockSDK instance; not exported publicly. */
export class Emitter<EventMap extends object> {
  private readonly handlers = new Map<keyof EventMap, Set<Listener>>();

  on<E extends keyof EventMap>(event: E, handler: (payload: EventMap[E]) => void): () => void {
    const listener = handler as Listener;
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  emit<E extends keyof EventMap>(event: E, payload: EventMap[E]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const listener of set) listener(payload);
  }

  clear(): void {
    this.handlers.clear();
  }
}

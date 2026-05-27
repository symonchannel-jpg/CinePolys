type Listener = (data: string) => void

class SSEEventBus {
  private listeners = new Map<string, Set<Listener>>()

  subscribe(userId: string, listener: Listener) {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set())
    }
    this.listeners.get(userId)!.add(listener)
    return () => this.listeners.get(userId)?.delete(listener)
  }

  emit(userId: string, data: string) {
    this.listeners.get(userId)?.forEach((fn) => fn(data))
  }
}

export const sseBus = new SSEEventBus()

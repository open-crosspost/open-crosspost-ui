/**
 * Simple event bus for authorization-related events
 */

type EventCallback = () => void;

// Rename class
class AuthorizationEventBus {
  private listeners: Record<string, EventCallback[]> = {};

  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback,
      );
    };
  }

  /**
   * Emit an event
   * @param event Event name
   */
  emit(event: string): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach((callback) => callback());
    }
  }
}

// Rename singleton instance
export const authorizationEvents = new AuthorizationEventBus();

// Rename event constants
export const AUTHORIZATION_EVENTS = {
  AUTHORIZATION_REVOKED: "authorization:revoked", // Renamed from INVALIDATED
  AUTHORIZED: "authorization:authorized", // Renamed from VALIDATED
};

/**
 * Signal that authorization has been revoked
 * This should be called when the user explicitly revokes access or an action fails due to lack of authorization.
 */
// Rename signal function
export function signalAuthorizationRevoked(): void {
  // Emit renamed event
  authorizationEvents.emit(AUTHORIZATION_EVENTS.AUTHORIZATION_REVOKED);

  // Remove persisted authorization state
  localStorage.removeItem("crosspost:authorized");

  // Also clear the auth cookie (if still relevant, might be removable later)
  // This assumes the cookie name - adjust if needed
  document.cookie = "nearAuthData=; Max-Age=0; path=/;";
}

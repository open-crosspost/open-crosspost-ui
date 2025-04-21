import { useEffect, useState } from "react";
// Update imports to use renamed files/constants
import {
  AUTHORIZATION_EVENTS,
  authorizationEvents,
} from "../lib/authorization-events";

/**
 * Hook to check if the user has authorized the application.
 * Reads authorization status from localStorage.
 * @returns Boolean indicating authorization status (null while checking)
 */
export function useAuthorizationStatus() {
  // Rename state variable for clarity
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthorization = () => {
      // No longer needs async
      try {
        // Only check localStorage
        const hasAuthorized =
          localStorage.getItem("crosspost:authorized") === "true";
        setIsAuthorized(hasAuthorized);
      } catch (error) {
        // localStorage access might fail in some environments (e.g., SSR, secure contexts)
        console.error(
          "Error checking localStorage authorization status:",
          error,
        );
        setIsAuthorized(false); // Default to not authorized if check fails
      }
    };

    checkAuthorization();

    // Use renamed events
    const unsubscribeRevoked = authorizationEvents.subscribe(
      AUTHORIZATION_EVENTS.AUTHORIZATION_REVOKED,
      () => {
        // No need to remove localStorage here, signalAuthorizationRevoked does it
        setIsAuthorized(false);
      },
    );
    const unsubscribeAuthorized = authorizationEvents.subscribe(
      AUTHORIZATION_EVENTS.AUTHORIZED,
      checkAuthorization,
    );

    return () => {
      // Use updated unsubscribe variable names
      [unsubscribeRevoked, unsubscribeAuthorized].forEach((fn) => fn());
    };
  }, []);

  return isAuthorized;
}

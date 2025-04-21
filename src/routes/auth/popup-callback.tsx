import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react"; // Import useRef
import React from "react";

export const Route = createFileRoute("/auth/popup-callback")({
  component: PopupCallback,
});

function PopupCallback() {
  const messageSentRef = useRef(false); // Add ref to track if message was sent

  useEffect(() => {
    // If we're on x.com during the redirect chain, do nothing
    if (window.location.hostname === "x.com") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const userId = params.get("userId");
    const error = params.get("error");

    // Send result back to opener window only once
    if (window.opener && !messageSentRef.current) {
      console.log("SENDING MESSAGE");
      messageSentRef.current = true; // Set flag to true
      window.opener.postMessage(
        {
          type: "AUTH_CALLBACK",
          data: {
            success: success === "true",
            platform: new URLSearchParams(window.location.search).get(
              "platform",
            ),
            userId,
            error: error || undefined,
            error_description: new URLSearchParams(window.location.search).get(
              "error_description",
            ),
          },
        },
        "http://localhost:5170", // Match the hardcoded origin in the backend
      );

      // Close window after ensuring message was sent
      const closeTimeout = setTimeout(() => window.close(), 100);
      // Cleanup function to clear the timeout if the component unmounts
      return () => clearTimeout(closeTimeout);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return null; // This component doesn't render anything
}

import React from "react";
import * as ReactDOMClient from "react-dom/client";
import App from "./App";
import "./index.css";

// Handle wallet extension conflicts and cross-origin errors
if (typeof window !== "undefined") {
  // Suppress ethereum property redefinition errors
  window.addEventListener("error", (event) => {
    if (
      event.error instanceof TypeError &&
      event.error.message.includes("Cannot redefine property: ethereum")
    ) {
      // Suppress ethereum property redefinition errors
      // This happens when multiple wallet extensions try to inject window.ethereum
      event.preventDefault();
      console.warn("Suppressed ethereum property redefinition error (likely from wallet extensions)");
    }
    
    // Suppress cross-origin errors from wallet extensions (MetaMask, etc.)
    if (
      event.error &&
      typeof event.error === 'object' &&
      'message' in event.error &&
      typeof event.error.message === 'string' &&
      (event.error.message.includes("origins don't match") ||
       event.error.message.includes("postMessage") ||
       event.error.message.includes("metamask"))
    ) {
      // These are non-critical errors from wallet extensions interfering with each other
      event.preventDefault();
      // Don't log these as they're expected when multiple wallet extensions are installed
    }
  });

  // Suppress postMessage warnings from wallet extensions
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0];
    // Filter out MetaMask and wallet-related postMessage warnings
    if (
      typeof message === 'string' &&
      (message.includes("Couldn't parse postMessage") ||
       message.includes("origins don't match") ||
       message.includes("metamask-inpage") ||
       message.includes("metamask-provider"))
    ) {
      // Suppress these warnings - they're from wallet extensions and don't affect functionality
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

ReactDOMClient.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

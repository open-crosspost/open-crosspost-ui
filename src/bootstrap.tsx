import React from "react";
import * as ReactDOMClient from "react-dom/client";
import App from "./App";
import "./index.css";
import { getProfile } from "./lib/social";

const render = async () => {
  const root = document.getElementById("root");
  // Extract accountId from URL (e.g., efiz.near.page)
  const accountId = window.location.hostname.includes("near.page")
    ? window.location.hostname.split(".")[0] + ".near"
    : "crosspost.near"; // Fallback for local development

  // There's more that can be done with the above:
  // pretend, use current user

  // I want to know about createRouter, from @https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts

  // I am exposing this App as a module in rspack federated module runtime, and so it will be passed some auth credentials -- or maybe not? Maybe it should always get from the window?
  // So then can we set the auth context at login

  // web4 auth context: https://github.com/elliotBraem/everything/blob/main/apps/www/src/hooks/use-web4-auth.ts#L31

  try {
    if (root) {
      ReactDOMClient.createRoot(root).render(
        <React.StrictMode>
          {accountId ? (
            <App accountId={accountId} />
          ) : (
            <div>No app found for {accountId}</div>
          )}
        </React.StrictMode>,
      );
    }
  } catch (error) {
    console.error("Error fetching app:", error);
    if (root) {
      ReactDOMClient.createRoot(root).render(
        <React.StrictMode>
          <div>Error loading app. Please try again later.</div>
        </React.StrictMode>,
      );
    }
  }
};

render();

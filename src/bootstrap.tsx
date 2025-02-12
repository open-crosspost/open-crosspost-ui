import React from "react";
import * as ReactDOMClient from "react-dom/client";
import App from "./App";
import "./index.css";

const render = async () => {
  const root = document.getElementById("root");
  
  // TODO: web4 auth context w sync engine: https://github.com/elliotBraem/everything/blob/main/apps/www/src/hooks/use-web4-auth.ts#L31

  try {
    if (root) {
      ReactDOMClient.createRoot(root).render(
        <React.StrictMode>
          <App />
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

import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import "@/i18n";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('RentAll SW registered:', registration.scope);

        // If there's already a waiting worker, surface update prompt.
        if (registration.waiting) {
          window.dispatchEvent(
            new CustomEvent('rentall:update-available', { detail: { registration } })
          );
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.addEventListener('statechange', () => {
            // New service worker installed and waiting to activate.
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(
                new CustomEvent('rentall:update-available', { detail: { registration } })
              );
            }
          });
        });
      })
      .catch((error) => {
        console.log('RentAll SW registration failed:', error);
      });
  });
}

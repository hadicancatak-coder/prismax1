import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { errorLogger } from "./lib/errorLogger";

// Global error handlers
window.addEventListener('error', (event) => {
  errorLogger.logError({
    severity: 'critical',
    type: 'frontend',
    message: event.message,
    stack: event.error?.stack,
    metadata: { 
      filename: event.filename, 
      lineno: event.lineno, 
      colno: event.colno 
    }
  });
});

window.addEventListener('unhandledrejection', (event) => {
  errorLogger.logError({
    severity: 'warning',
    type: 'frontend',
    message: `Unhandled Promise Rejection: ${event.reason}`,
    metadata: { reason: event.reason }
  });
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

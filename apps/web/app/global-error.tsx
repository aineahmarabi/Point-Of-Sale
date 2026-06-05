"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary for the whole app (must render its own <html>).
 * Shows a neutral message and a reload action — no raw error details exposed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 420 }}>
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 1.5rem" }}>
            An unexpected error occurred. Please try reloading the page.
          </p>
          <button
            onClick={reset}
            style={{
              minHeight: 44,
              padding: "0 1.25rem",
              borderRadius: 8,
              border: "none",
              background: "#8e1f38",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

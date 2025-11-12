"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "2rem",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Something went wrong!
      </h1>
      <p style={{ marginBottom: "2rem", color: "#666" }}>
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: "0.5rem",
          border: "none",
          cursor: "pointer"
        }}
      >
        Try again
      </button>
    </div>
  );
}


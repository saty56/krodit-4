import Link from "next/link";

export default function NotFound() {
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
        404 - Page Not Found
      </h1>
      <p style={{ marginBottom: "2rem", color: "#666" }}>
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: "0.5rem",
          textDecoration: "none",
          display: "inline-block"
        }}
      >
        Go back home
      </Link>
    </div>
  );
}


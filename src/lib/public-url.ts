export function publicBaseUrl() {
  const configured = process.env.NEXTAUTH_URL;
  if (!configured && process.env.NODE_ENV !== "production") return "http://localhost:3000";
  if (!configured) throw new Error("Brak NEXTAUTH_URL dla publicznych zaproszeń.");

  const url = new URL(configured);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    (process.env.NODE_ENV === "production" && url.protocol !== "https:") ||
    url.username || url.password || url.pathname !== "/" || url.search || url.hash
  ) {
    throw new Error("NEXTAUTH_URL musi wskazywać publiczny adres aplikacji HTTPS.");
  }
  return url.origin;
}

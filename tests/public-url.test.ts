import { afterEach, describe, expect, it, vi } from "vitest";
import { publicBaseUrl } from "@/lib/public-url";

afterEach(() => vi.unstubAllEnvs());

describe("publiczny adres zaproszeń", () => {
  it("używa dokładnego origin skonfigurowanej domeny HTTPS", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_URL", "https://taskflow.example.org/");
    expect(publicBaseUrl()).toBe("https://taskflow.example.org");
  });

  it("odmawia utworzenia zaproszenia przy brakującym lub niebezpiecznym adresie produkcyjnym", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_URL", "");
    expect(publicBaseUrl).toThrow("Brak NEXTAUTH_URL");
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    expect(publicBaseUrl).toThrow("HTTPS");
    vi.stubEnv("NEXTAUTH_URL", "https://taskflow.example.org/obca-sciezka");
    expect(publicBaseUrl).toThrow("HTTPS");
  });
});

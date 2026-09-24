import { describe, expect, it } from "vitest";
import { labelSchema, linkSchema, registerSchema, taskSchema } from "@/lib/validations";

describe("walidacja danych wejściowych", () => {
  it("normalizuje e-mail i akceptuje mocne hasło", () => {
    const result = registerSchema.parse({ name: " Anna ", email: "ANNA@EXAMPLE.COM ", password: "bardzodlugiehaslo", confirmPassword: "bardzodlugiehaslo" });
    expect(result.email).toBe("anna@example.com"); expect(result.name).toBe("Anna");
  });
  it("odrzuca różne hasła", () => { expect(registerSchema.safeParse({ name: "Anna", email: "a@example.com", password: "bardzodlugiehaslo", confirmPassword: "innehaslo123" }).success).toBe(false); });
  it("odrzuca protokoły inne niż http i https", () => { expect(linkSchema.safeParse({ title: "Plik", url: "file:///etc/passwd" }).success).toBe(false); });
  it("waliduje kolor etykiety", () => { expect(labelSchema.safeParse({ name: "UI", color: "orange" }).success).toBe(false); });
  it("ustawia wartości domyślne zadania", () => { const result = taskSchema.parse({ title: " Test " }); expect(result.title).toBe("Test"); expect(result.status).toBe("TODO"); expect(result.priority).toBe("MEDIUM"); });
});

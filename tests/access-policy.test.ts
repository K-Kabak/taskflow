import { describe, expect, it } from "vitest";
import { canChangeMemberRole, canChangeWorkspace, canDeleteTask, canManageProjects, canRemoveMember } from "@/lib/access-policy";

describe("macierz uprawnień", () => {
  it("pozwala tylko OWNER i ADMIN zarządzać projektami", () => { expect(canManageProjects("OWNER")).toBe(true); expect(canManageProjects("ADMIN")).toBe(true); expect(canManageProjects("MEMBER")).toBe(false); });
  it("chroni nazwę przestrzeni i rolę właściciela", () => { expect(canChangeWorkspace("ADMIN")).toBe(false); expect(canChangeMemberRole("OWNER", "OWNER")).toBe(false); expect(canChangeMemberRole("ADMIN", "MEMBER")).toBe(false); });
  it("egzekwuje reguły usuwania członków", () => { expect(canRemoveMember("ADMIN", "MEMBER")).toBe(true); expect(canRemoveMember("ADMIN", "ADMIN")).toBe(false); expect(canRemoveMember("OWNER", "ADMIN")).toBe(true); expect(canRemoveMember("OWNER", "OWNER")).toBe(false); });
  it("pozwala usunąć zadanie twórcy lub administracji", () => { expect(canDeleteTask("MEMBER", "u1", "u1")).toBe(true); expect(canDeleteTask("MEMBER", "u1", "u2")).toBe(false); expect(canDeleteTask("ADMIN", "u1", "u2")).toBe(true); });
});

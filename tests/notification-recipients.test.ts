import { describe, expect, it } from "vitest";
import { commentRecipients, newlyAssignedRecipients } from "@/lib/notification-recipients";

describe("notification recipients", () => {
  it("notifies only newly assigned people and excludes the actor", () => {
    expect(newlyAssignedRecipients(["a"], ["a", "b", "b", "actor"], "actor")).toEqual(["b"]);
    expect(newlyAssignedRecipients(["a", "b"], ["b", "a"], "actor")).toEqual([]);
  });

  it("notifies assigned people of comments once, except the author", () => {
    expect(commentRecipients(["author", "b", "b", "c"], "author")).toEqual(["b", "c"]);
  });
});

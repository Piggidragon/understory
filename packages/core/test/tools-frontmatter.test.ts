import { describe, it, expect } from "vitest";
import { frontmatterPatchSchema } from "../src/agent/tools.js";

// Issue #39: patch_concept previously accepted z.record(z.unknown()) and serialized
// whatever the model produced straight into YAML frontmatter. The schema must reject
// the corrupted shapes observed in live bundles while accepting normal patches.
describe("frontmatterPatchSchema (issue #39)", () => {
  it("accepts scalar and list values, and null to delete", () => {
    for (const value of [
      { description: "Comprehensive homelab documentation" },
      { tags: ["homelab", "llm", "pc-dev"] },
      { title: null },
      { type: "API Endpoint", resource: "https://example.com/x", custom_key: 42 },
    ]) {
      const result = frontmatterPatchSchema.safeParse(value);
      expect(result.success, JSON.stringify(value)).toBe(true);
    }
  });

  it("rejects the corrupted shapes observed in live bundles", () => {
    for (const value of [
      // tagged "typed placeholder" object instead of a string
      { description: { __type: "string", __value: "text" } },
      // empty object silently wipes the key
      { description: {} },
      // tags as a map of tag -> true
      { tags: { homelab: true, proxmox: true } },
      // tags as a tagged array object
      { tags: { __type: "array", __items: { type: "string" }, value: ["homelab"] } },
      // object nested inside an otherwise-valid list
      { tags: ["ok", { nested: true }] },
    ]) {
      const result = frontmatterPatchSchema.safeParse(value);
      expect(result.success, JSON.stringify(value)).toBe(false);
    }
  });

  it("keeps type non-empty when given (matches write_concept)", () => {
    expect(frontmatterPatchSchema.safeParse({ type: "" }).success).toBe(false);
    expect(frontmatterPatchSchema.safeParse({ type: "T" }).success).toBe(true);
  });
});

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { demoAdapter } from "@/lib/model/adapter";

describe("demo model adapter (property)", () => {
  it("normalize is deterministic and idempotent", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.constantFrom("en" as const, "es" as const), async (input, locale) => {
        const a = await demoAdapter.normalize(input, locale);
        const b = await demoAdapter.normalize(input, locale);
        const again = await demoAdapter.normalize(a.text, locale);
        expect(b).toEqual(a);
        expect(again.text).toBe(a.text);
      }),
    );
  });

  it("always labels its output as generated", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (input) => {
        expect((await demoAdapter.normalize(input, "en")).kind).toBe("generated");
      }),
    );
  });
});

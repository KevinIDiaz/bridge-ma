import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, resolveLocale } from "@/lib/i18n";

describe("resolveLocale (property)", () => {
  it("always returns a supported locale for any input", () => {
    fc.assert(
      fc.property(fc.option(fc.string(), { nil: undefined }), (input) => {
        expect(isLocale(resolveLocale(input))).toBe(true);
      }),
    );
  });

  it("returns Spanish only when the input is 'es' (ignoring case and surrounding spaces)", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const expected = input.trim().toLowerCase() === "es" ? "es" : defaultLocale;
        expect(resolveLocale(input)).toBe(expected);
      }),
    );
  });
});

import { describe, expect, it } from "vitest";
import en from "@/lib/i18n/en.json";
import es from "@/lib/i18n/es.json";
import { getDictionary, locales } from "@/lib/i18n";

/** Flattens nested dictionary objects to dotted keys with their string values. */
function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  return Object.entries(obj).reduce<Record<string, unknown>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") Object.assign(acc, flatten(v as Record<string, unknown>, key));
    else acc[key] = v;
    return acc;
  }, {});
}

describe("locale dictionaries", () => {
  it("English and Spanish have exactly the same keys", () => {
    expect(Object.keys(flatten(es)).sort()).toEqual(Object.keys(flatten(en)).sort());
  });

  it.each(locales)("every %s value is a non-empty string", (locale) => {
    for (const [key, value] of Object.entries(flatten(getDictionary(locale)))) {
      expect(typeof value, key).toBe("string");
      expect((value as string).trim().length, key).toBeGreaterThan(0);
    }
  });
});

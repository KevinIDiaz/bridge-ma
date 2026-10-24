#!/usr/bin/env node
// Locale parity check (Req 12.2). Usage: node scripts/validate-locales.mjs [dir]
// Checks that en.json and es.json have the same keys, every value is a non-empty string,
// and every key uses the same {placeholder} names in both languages.
// Exit code 0 = valid, 1 = problems found (each printed on its own line).
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const dir = resolve(process.argv[2] ?? "src/lib/i18n");
const LOCALES = ["en", "es"];

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

const problems = [];
const dicts = {};
for (const locale of LOCALES) {
  const file = join(dir, `${locale}.json`);
  try {
    dicts[locale] = flatten(JSON.parse(readFileSync(file, "utf8")));
  } catch (err) {
    problems.push(`${locale}: cannot read ${file}: ${err.message}`);
  }
}

if (problems.length === 0) {
  const [ref, ...others] = LOCALES;
  for (const locale of LOCALES) {
    for (const [key, value] of Object.entries(dicts[locale])) {
      if (typeof value !== "string") problems.push(`${locale}: ${key} is not a string`);
      else if (value.trim() === "") problems.push(`${locale}: ${key} is empty`);
      if (typeof value === "string" && /\{\s*\}|\{[^}\w]/.test(value)) problems.push(`${locale}: ${key} has a malformed placeholder`);
    }
  }
  for (const other of others) {
    for (const key of Object.keys(dicts[ref])) {
      if (!(key in dicts[other])) problems.push(`${other}: missing key ${key} (present in ${ref})`);
    }
    for (const key of Object.keys(dicts[other])) {
      if (!(key in dicts[ref])) problems.push(`${ref}: missing key ${key} (present in ${other})`);
    }
    for (const key of Object.keys(dicts[ref])) {
      const a = dicts[ref][key];
      const b = dicts[other][key];
      if (typeof a === "string" && typeof b === "string" && placeholders(a) !== placeholders(b)) {
        problems.push(`${key}: placeholders differ (${ref}: {${placeholders(a)}} vs ${other}: {${placeholders(b)}})`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`Locale validation failed (${problems.length} problem${problems.length === 1 ? "" : "s"}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`Locale validation passed: ${Object.keys(dicts.en).length} keys in ${LOCALES.join(", ")}, placeholders match.`);

// Pure, React-free input validation for intake and the confirm-step edit form.
// It converts raw form strings into stored FactValues, or returns a field-keyed
// error code that maps to an `errors.*` dictionary key (Req 1.7, 1.8, 2.7, 15.7).
//
// Assumptions (documented until the Lead's programs.v2.json FactDefs merge):
// - FactDef kinds are "boolean" | "number" | "choice" | "text" | "date".
// - The only numeric fact with bounds in v1 is household_size (1–20); bounds come
//   from FactDef.min / FactDef.max, so this stays generic.
// - A blank entry or the explicit "I don't know" choice becomes "unknown"
//   (distinct from false). No rule reads text/number facts, so "unknown" there is safe.

import type { FactDef, FactValue, Unknown } from "@/lib/rules/types";

export const UNKNOWN: Unknown = "unknown";

export const TEXT_MAX_LENGTH = 200;

/** Error codes; each maps to an `errors.<code>` dictionary key. */
export type ValidationErrorCode =
  | "text_too_long"
  | "number_required"
  | "number_not_whole"
  | "number_out_of_range"
  | "choice_invalid"
  | "boolean_invalid";

export type ValidationResult =
  | { ok: true; value: FactValue | Unknown }
  | { ok: false; code: ValidationErrorCode };

const BLANK = /^\s*$/;

/** True when the raw input means "I don't know" (explicit marker or blank). */
export function isUnknownInput(raw: string | null | undefined, explicitUnknown = false): boolean {
  return explicitUnknown || raw == null || BLANK.test(raw);
}

/**
 * Validates and normalizes one field's raw value against its FactDef.
 * `raw` is the control's string value; `explicitUnknown` is set when the
 * "I don't know" control is chosen for number/text facts.
 */
export function validateField(
  def: FactDef,
  raw: string | null | undefined,
  explicitUnknown = false,
): ValidationResult {
  switch (def.kind) {
    case "boolean": {
      if (isUnknownInput(raw, explicitUnknown)) return { ok: true, value: UNKNOWN };
      if (raw === "true") return { ok: true, value: true };
      if (raw === "false") return { ok: true, value: false };
      return { ok: false, code: "boolean_invalid" };
    }
    case "choice": {
      if (isUnknownInput(raw, explicitUnknown)) return { ok: true, value: UNKNOWN };
      const options = def.options ?? [];
      if (raw != null && options.includes(raw)) return { ok: true, value: raw };
      return { ok: false, code: "choice_invalid" };
    }
    case "number": {
      if (isUnknownInput(raw, explicitUnknown)) return { ok: true, value: UNKNOWN };
      const trimmed = (raw as string).trim();
      // Whole numbers only: optional sign then digits.
      if (!/^[+-]?\d+$/.test(trimmed)) {
        // Distinguish "not a number at all" from "has a fractional part".
        return { ok: false, code: Number.isNaN(Number(trimmed)) ? "number_required" : "number_not_whole" };
      }
      const n = Number(trimmed);
      const min = def.min ?? Number.NEGATIVE_INFINITY;
      const max = def.max ?? Number.POSITIVE_INFINITY;
      if (n < min || n > max) return { ok: false, code: "number_out_of_range" };
      return { ok: true, value: n };
    }
    case "text":
    case "date": {
      if (isUnknownInput(raw, explicitUnknown)) return { ok: true, value: UNKNOWN };
      const text = raw as string;
      if (text.length > TEXT_MAX_LENGTH) return { ok: false, code: "text_too_long" };
      return { ok: true, value: text };
    }
  }
}

/** A map of fieldId → error code for the fields that failed. Empty = all valid. */
export type FieldErrors = Record<string, ValidationErrorCode>;

/**
 * Validates a whole form keyed by fact ID, returning either the normalized
 * values (all fields valid) or the per-field error codes.
 */
export function validateForm(
  defs: readonly FactDef[],
  raw: Readonly<Record<string, string | null | undefined>>,
  explicitUnknown: Readonly<Record<string, boolean>> = {},
): { ok: true; values: Record<string, FactValue | Unknown> } | { ok: false; errors: FieldErrors } {
  const values: Record<string, FactValue | Unknown> = {};
  const errors: FieldErrors = {};
  for (const def of defs) {
    const result = validateField(def, raw[def.id], explicitUnknown[def.id] ?? false);
    if (result.ok) values[def.id] = result.value;
    else errors[def.id] = result.code;
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values };
}

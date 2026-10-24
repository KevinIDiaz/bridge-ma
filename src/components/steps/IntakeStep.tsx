"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import { session } from "@/lib/session/store";
import { DEMO_FILL, INTAKE_FACT_DEFS } from "@/lib/session/factDefs";
import { type FieldErrors, validateForm } from "@/lib/session/validation";
import { demoAdapter } from "@/lib/model/adapter";
import { StepHeading } from "@/components/StepHeading";
import type { FactDef, FactValue, ResidentFact, Unknown } from "@/lib/rules/types";

interface Props {
  lang: Locale;
}

/** Raw string values keyed by fact ID, plus explicit "I don't know" flags. */
type RawForm = Record<string, string>;
type UnknownFlags = Record<string, boolean>;

function initialRaw(): RawForm {
  const raw: RawForm = {};
  for (const def of INTAKE_FACT_DEFS) raw[def.id] = "";
  return raw;
}

/** Converts a stored demo value into the raw control value + unknown flag. */
function demoToControl(def: FactDef, value: FactValue | Unknown): { raw: string; unknown: boolean } {
  if (value === "unknown") return { raw: "", unknown: true };
  if (def.kind === "boolean") return { raw: String(value), unknown: false };
  return { raw: String(value), unknown: false };
}

export function IntakeStep({ lang }: Props) {
  const router = useRouter();
  const t = getDictionary(lang);
  const defs = INTAKE_FACT_DEFS;

  const [raw, setRaw] = useState<RawForm>(initialRaw);
  const [unknownFlags, setUnknownFlags] = useState<UnknownFlags>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  function setField(id: string, value: string): void {
    setRaw((prev) => ({ ...prev, [id]: value }));
    // Choosing a concrete value clears the "I don't know" flag for that field.
    setUnknownFlags((prev) => ({ ...prev, [id]: false }));
  }

  function setUnknown(id: string, on: boolean): void {
    setUnknownFlags((prev) => ({ ...prev, [id]: on }));
    if (on) setRaw((prev) => ({ ...prev, [id]: "" }));
  }

  function fillDemo(): void {
    const nextRaw: RawForm = {};
    const nextUnknown: UnknownFlags = {};
    for (const def of defs) {
      const { raw: r, unknown } = demoToControl(def, DEMO_FILL[def.id]);
      nextRaw[def.id] = r;
      nextUnknown[def.id] = unknown;
    }
    setRaw(nextRaw);
    setUnknownFlags(nextUnknown);
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const result = validateForm(defs, raw, unknownFlags);
    if (!result.ok) {
      setErrors(result.errors);
      focusFirstInvalid(formRef.current, defs, result.errors);
      return;
    }
    setErrors({});

    // Normalize free-text values locally (trim + NFC) before storing. This is
    // the only use of the model adapter here and it never leaves the browser.
    const facts: ResidentFact[] = [];
    for (const def of defs) {
      let value = result.values[def.id];
      if ((def.kind === "text" || def.kind === "date") && typeof value === "string") {
        const normalized = await demoAdapter.normalize(value, lang);
        value = normalized.text.length === 0 ? "unknown" : normalized.text;
      }
      facts.push({ id: def.id, value, confirmation: "unconfirmed", origin: "user" });
    }
    session.setFacts(facts);
    router.push(`/${lang}/confirm`);
  }

  return (
    <main id="main" className="container">
      <p className="step-label">{t.intake.stepLabel}</p>
      <StepHeading>{t.intake.title}</StepHeading>
      <p>{t.intake.intro}</p>

      <p className="fictional-notice" role="note">
        {t.intake.fictionalNotice}
      </p>

      {Object.keys(errors).length > 0 && (
        <div className="error-summary" role="alert">
          <p>{t.intake.errorSummaryTitle}</p>
          <ul>
            {defs
              .filter((d) => errors[d.id])
              .map((d) => (
                <li key={d.id}>
                  <a href={`#field-${d.id}`}>
                    {t.facts[d.id as keyof typeof t.facts]}: {t.errors[errors[d.id]]}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        {defs.map((def) => (
          <FactControl
            key={def.id}
            def={def}
            dict={t}
            rawValue={raw[def.id]}
            unknown={unknownFlags[def.id] ?? false}
            error={errors[def.id]}
            onValue={(v) => setField(def.id, v)}
            onUnknown={(on) => setUnknown(def.id, on)}
          />
        ))}

        <div className="intake-actions">
          <button type="button" onClick={fillDemo} className="secondary">
            {t.intake.useDemo}
          </button>
          <button type="submit">{t.intake.submit}</button>
        </div>
        <p className="required-note">{t.intake.requiredNote}</p>
      </form>
    </main>
  );
}

interface ControlProps {
  def: FactDef;
  dict: Dictionary;
  rawValue: string;
  unknown: boolean;
  error?: string;
  onValue: (value: string) => void;
  onUnknown: (on: boolean) => void;
}

function FactControl({ def, dict, rawValue, unknown, error, onValue, onUnknown }: ControlProps) {
  const label = dict.facts[def.id as keyof typeof dict.facts];
  const errorId = `error-${def.id}`;
  const describedBy = error ? errorId : undefined;

  const errorNode = error ? (
    <p id={errorId} className="field-error" role="alert">
      {dict.errors[error as keyof typeof dict.errors]}
    </p>
  ) : null;

  if (def.kind === "boolean") {
    return (
      <fieldset id={`field-${def.id}`} aria-describedby={describedBy} className={error ? "has-error" : undefined}>
        <legend>{label}</legend>
        <Radio name={def.id} value="true" checked={rawValue === "true" && !unknown} onChange={onValue}>
          {dict.value.true}
        </Radio>
        <Radio name={def.id} value="false" checked={rawValue === "false" && !unknown} onChange={onValue}>
          {dict.value.false}
        </Radio>
        <RadioUnknown name={def.id} checked={unknown} onChange={onUnknown} label={dict.intake.dontKnow} />
        {errorNode}
      </fieldset>
    );
  }

  if (def.kind === "choice") {
    const options = def.options ?? [];
    const factOptions = (dict.factOptions as Record<string, Record<string, string>>)[def.id] ?? {};
    return (
      <fieldset id={`field-${def.id}`} aria-describedby={describedBy} className={error ? "has-error" : undefined}>
        <legend>{label}</legend>
        {options.map((opt) => (
          <Radio key={opt} name={def.id} value={opt} checked={rawValue === opt && !unknown} onChange={onValue}>
            {factOptions[opt] ?? opt}
          </Radio>
        ))}
        <RadioUnknown name={def.id} checked={unknown} onChange={onUnknown} label={dict.intake.dontKnow} />
        {errorNode}
      </fieldset>
    );
  }

  // number and text/date: one input plus a separate "I don't know" checkbox.
  const inputId = `field-${def.id}`;
  return (
    <fieldset className={error ? "has-error" : undefined}>
      {/* The visible legend also names the input (axe "label" rule; fixed at integration). */}
      <legend id={`${inputId}-label`}>{label}</legend>
      {def.kind === "number" ? (
        <input
          id={inputId}
          aria-labelledby={`${inputId}-label`}
          type="number"
          step="1"
          inputMode="numeric"
          min={def.min}
          max={def.max}
          value={unknown ? "" : rawValue}
          disabled={unknown}
          aria-describedby={describedBy}
          onChange={(e) => onValue(e.target.value)}
        />
      ) : (
        <input
          id={inputId}
          aria-labelledby={`${inputId}-label`}
          type="text"
          maxLength={200}
          value={unknown ? "" : rawValue}
          disabled={unknown}
          aria-describedby={describedBy}
          onChange={(e) => onValue(e.target.value)}
        />
      )}
      <label className="unknown-checkbox">
        <input type="checkbox" checked={unknown} onChange={(e) => onUnknown(e.target.checked)} />
        {dict.intake.dontKnow}
      </label>
      {errorNode}
    </fieldset>
  );
}

function Radio({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="radio-option">
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      {children}
    </label>
  );
}

function RadioUnknown({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: (on: boolean) => void;
  label: string;
}) {
  return (
    <label className="radio-option">
      <input type="radio" name={name} value="unknown" checked={checked} onChange={() => onChange(true)} />
      {label}
    </label>
  );
}

/** Moves focus to the first field (in form order) that failed validation. */
function focusFirstInvalid(form: HTMLFormElement | null, defs: readonly FactDef[], errors: FieldErrors): void {
  if (!form) return;
  for (const def of defs) {
    if (!errors[def.id]) continue;
    const el = form.querySelector<HTMLElement>(`#field-${def.id}`);
    if (el) {
      const focusTarget =
        el.tagName === "FIELDSET" ? el.querySelector<HTMLElement>("input") ?? el : el;
      focusTarget.focus();
      return;
    }
  }
}

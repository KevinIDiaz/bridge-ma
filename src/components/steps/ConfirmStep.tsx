"use client";

import { useState } from "react";
import Link from "next/link";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import { session } from "@/lib/session/store";
import { useSession } from "@/components/useSession";
import { StepHeading } from "@/components/StepHeading";
import { INTAKE_FACT_DEFS } from "@/lib/session/factDefs";
import { validateField, type ValidationErrorCode } from "@/lib/session/validation";
import type { FactDef, FactValue, ResidentFact, Unknown } from "@/lib/rules/types";

interface Props {
  lang: Locale;
}

const defsById = new Map<string, FactDef>(INTAKE_FACT_DEFS.map((d) => [d.id, d]));

export function ConfirmStep({ lang }: Props) {
  const t = getDictionary(lang);
  const { facts } = useSession();
  // RequireSession guarantees facts !== null, but keep a defensive guard.
  const list = facts ?? [];

  const unconfirmedCount = list.filter((f) => f.confirmation === "unconfirmed").length;

  return (
    <main id="main" className="container">
      <p className="step-label">{t.confirm.stepLabel}</p>
      <StepHeading>{t.confirm.title}</StepHeading>
      <p>{t.confirm.intro}</p>

      <p className="unconfirmed-notice" role="status">
        {unconfirmedCount > 0
          ? t.confirm.unconfirmedNotice.replace("{count}", String(unconfirmedCount))
          : t.confirm.allConfirmedNotice}
      </p>

      <ul className="confirm-list">
        {list.map((fact) => (
          <FactRow key={fact.id} fact={fact} dict={t} />
        ))}
      </ul>

      <p className="area-context-note" role="note">
        {t.confirm.areaContextNote}
      </p>

      <Link href={`/${lang}/actions`} className="continue-link">
        {t.confirm.continue}
      </Link>
    </main>
  );
}

function FactRow({ fact, dict }: { fact: ResidentFact; dict: Dictionary }) {
  const [editing, setEditing] = useState(false);
  const def = defsById.get(fact.id);
  const label = dict.facts[fact.id as keyof typeof dict.facts] ?? fact.id;

  return (
    <li
      className="confirm-row"
      data-fact-id={fact.id}
      data-value={String(fact.value)}
      data-confirmation={fact.confirmation}
    >
      <div className="confirm-fact">
        <span className="fact-label">{label}</span>
        <span className="fact-value">{formatValue(def, fact.value, dict)}</span>
        <span className={`fact-status ${fact.confirmation}`}>
          {fact.confirmation === "confirmed" ? dict.confirmation.confirmed : dict.confirmation.unconfirmed}
        </span>
      </div>

      {editing ? (
        <EditForm def={def} current={fact.value} dict={dict} onDone={() => setEditing(false)} />
      ) : (
        <div className="confirm-row-actions">
          {fact.confirmation === "unconfirmed" && (
            <button type="button" onClick={() => session.confirmFact(fact.id)}>
              {dict.confirm.confirm}
            </button>
          )}
          <button type="button" className="secondary" onClick={() => setEditing(true)}>
            {dict.confirm.edit}
          </button>
        </div>
      )}
    </li>
  );
}

function EditForm({
  def,
  current,
  dict,
  onDone,
}: {
  def: FactDef | undefined;
  current: FactValue | Unknown;
  dict: Dictionary;
  onDone: () => void;
}) {
  const [raw, setRaw] = useState<string>(current === "unknown" ? "" : String(current));
  const [unknown, setUnknown] = useState<boolean>(current === "unknown");
  const [error, setError] = useState<ValidationErrorCode | null>(null);

  if (!def) return null;

  function save(e: React.FormEvent): void {
    e.preventDefault();
    const result = validateField(def!, raw, unknown);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    session.updateFact(def!.id, result.value);
    onDone();
  }

  const options = def.kind === "choice" ? def.options ?? [] : [];
  const factOptions = (dict.factOptions as Record<string, Record<string, string>>)[def.id] ?? {};
  const errorId = `edit-error-${def.id}`;

  return (
    <form onSubmit={save} className="edit-form" noValidate>
      {def.kind === "boolean" && (
        <fieldset>
          <legend className="visually-hidden">{dict.facts[def.id as keyof typeof dict.facts]}</legend>
          <EditRadio id={def.id} value="true" checked={raw === "true" && !unknown} onPick={() => { setRaw("true"); setUnknown(false); }}>
            {dict.value.true}
          </EditRadio>
          <EditRadio id={def.id} value="false" checked={raw === "false" && !unknown} onPick={() => { setRaw("false"); setUnknown(false); }}>
            {dict.value.false}
          </EditRadio>
          <EditRadio id={def.id} value="unknown" checked={unknown} onPick={() => { setUnknown(true); setRaw(""); }}>
            {dict.value.unknown}
          </EditRadio>
        </fieldset>
      )}

      {def.kind === "choice" && (
        <fieldset>
          <legend className="visually-hidden">{dict.facts[def.id as keyof typeof dict.facts]}</legend>
          {options.map((opt) => (
            <EditRadio key={opt} id={def.id} value={opt} checked={raw === opt && !unknown} onPick={() => { setRaw(opt); setUnknown(false); }}>
              {factOptions[opt] ?? opt}
            </EditRadio>
          ))}
          <EditRadio id={def.id} value="unknown" checked={unknown} onPick={() => { setUnknown(true); setRaw(""); }}>
            {dict.value.unknown}
          </EditRadio>
        </fieldset>
      )}

      {(def.kind === "number" || def.kind === "text" || def.kind === "date") && (
        <>
          <input
            type={def.kind === "number" ? "number" : "text"}
            step={def.kind === "number" ? "1" : undefined}
            inputMode={def.kind === "number" ? "numeric" : undefined}
            min={def.min}
            max={def.max}
            maxLength={def.kind === "number" ? undefined : 200}
            value={unknown ? "" : raw}
            disabled={unknown}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => { setRaw(e.target.value); setError(null); }}
          />
          <label className="unknown-checkbox">
            <input type="checkbox" checked={unknown} onChange={(e) => { setUnknown(e.target.checked); setError(null); }} />
            {dict.intake.dontKnow}
          </label>
        </>
      )}

      {error && (
        <p id={errorId} className="field-error" role="alert">
          {dict.errors[error]}
        </p>
      )}

      <div className="edit-actions">
        <button type="submit">{dict.confirm.save}</button>
        <button type="button" className="secondary" onClick={onDone}>
          {dict.confirm.cancel}
        </button>
      </div>
    </form>
  );
}

function EditRadio({
  id,
  value,
  checked,
  onPick,
  children,
}: {
  id: string;
  value: string;
  checked: boolean;
  onPick: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="radio-option">
      <input type="radio" name={`edit-${id}`} value={value} checked={checked} onChange={onPick} />
      {children}
    </label>
  );
}

/** Turns a stored value into a display string without changing its meaning. */
function formatValue(def: FactDef | undefined, value: FactValue | Unknown, dict: Dictionary): string {
  if (value === "unknown") return dict.value.unknown;
  if (typeof value === "boolean") return value ? dict.value.true : dict.value.false;
  if (def?.kind === "choice") {
    const factOptions = (dict.factOptions as Record<string, Record<string, string>>)[def.id] ?? {};
    return factOptions[String(value)] ?? String(value);
  }
  return String(value);
}

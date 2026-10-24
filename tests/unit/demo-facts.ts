// Fictional demo persona from design "Expected demo outcome". Test-only data.
import type { Fixture, ResidentFact } from "@/lib/rules/types";
import { fixtureResult } from "@/lib/data/programs";

const values: Record<string, ResidentFact["value"]> = {
  preferred_language: "es",
  city: "Boston",
  neighborhood: "unknown",
  household_size: 2,
  single_parent: true,
  lives_in_ma: true,
  lost_job_recently: true,
  rents_home: true,
  received_notice_to_quit: true,
  has_utility_account: true,
  received_shutoff_notice: "unknown",
};

export function demoFacts(confirmation: ResidentFact["confirmation"]): ResidentFact[] {
  return Object.entries(values).map(([id, value]) => ({ id, value, confirmation, origin: "user" }));
}

export function v2(): Fixture {
  if (!fixtureResult.ok) throw new Error(`v2 fixture invalid: ${JSON.stringify(fixtureResult.errors)}`);
  return structuredClone(fixtureResult.value);
}

export function deepFreeze<T>(o: T): T {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

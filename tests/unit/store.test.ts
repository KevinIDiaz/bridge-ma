import { beforeEach, describe, expect, it } from "vitest";
import { EMPTY_SESSION, session } from "@/lib/session/store";
import type { ResidentFact } from "@/lib/rules/types";

function fact(id: string, value: ResidentFact["value"]): ResidentFact {
  return { id, value, confirmation: "unconfirmed", origin: "user" };
}

/** Resets the module-level store before each test by starting a fresh session. */
function seed(facts: ResidentFact[]): void {
  session.setFacts(facts);
}

describe("session store", () => {
  beforeEach(() => {
    // Clear any prior facts. setFacts replaces the whole session.
    session.setFacts([]);
  });

  it("server snapshot (EMPTY_SESSION) has null facts and no explanations", () => {
    expect(EMPTY_SESSION.facts).toBeNull();
    expect(EMPTY_SESSION.explanations).toEqual({});
  });

  it("setFacts starts a fresh session with all given facts and clears explanations", () => {
    session.setExplanation("A-RAFT:en", { text: "stale", origin: "rule_based" });
    seed([fact("lives_in_ma", true), fact("rents_home", false)]);
    const s = session.get();
    expect(s.facts).toHaveLength(2);
    expect(s.explanations).toEqual({});
    expect(s.facts?.every((f) => f.confirmation === "unconfirmed")).toBe(true);
  });

  it("confirmFact confirms only the targeted fact and keeps its value, including unknown", () => {
    seed([fact("a", true), fact("received_shutoff_notice", "unknown"), fact("c", false)]);
    session.confirmFact("received_shutoff_notice");
    const s = session.get();
    const target = s.facts?.find((f) => f.id === "received_shutoff_notice");
    const others = s.facts?.filter((f) => f.id !== "received_shutoff_notice") ?? [];
    expect(target?.confirmation).toBe("confirmed");
    expect(target?.value).toBe("unknown"); // value untouched
    expect(others.every((f) => f.confirmation === "unconfirmed")).toBe(true);
  });

  it("updateFact changes the value and resets the fact to unconfirmed", () => {
    seed([fact("rents_home", true)]);
    session.confirmFact("rents_home");
    expect(session.get().facts?.[0].confirmation).toBe("confirmed");

    session.updateFact("rents_home", false);
    const f = session.get().facts?.[0];
    expect(f?.value).toBe(false);
    expect(f?.confirmation).toBe("unconfirmed");
  });

  it("updateFact to unknown also resets confirmation to unconfirmed", () => {
    seed([fact("received_shutoff_notice", true)]);
    session.confirmFact("received_shutoff_notice");
    session.updateFact("received_shutoff_notice", "unknown");
    const f = session.get().facts?.[0];
    expect(f?.value).toBe("unknown");
    expect(f?.confirmation).toBe("unconfirmed");
  });

  it("updateFact clears cached explanations", () => {
    seed([fact("rents_home", true)]);
    session.setExplanation("A-RAFT:en", { text: "cached", origin: "rule_based" });
    expect(session.get().explanations["A-RAFT:en"]).toBeDefined();
    session.updateFact("rents_home", false);
    expect(session.get().explanations).toEqual({});
  });

  it("subscribe notifies on writes and unsubscribe stops notifications", () => {
    let calls = 0;
    const unsubscribe = session.subscribe(() => {
      calls += 1;
    });
    seed([fact("a", true)]);
    session.confirmFact("a");
    expect(calls).toBe(2);
    unsubscribe();
    session.updateFact("a", false);
    expect(calls).toBe(2);
  });

  it("setExplanation stores under the given key without touching facts", () => {
    seed([fact("a", true)]);
    session.setExplanation("A-SNAP:es", { text: "hola", origin: "generated" });
    const s = session.get();
    expect(s.explanations["A-SNAP:es"]).toEqual({ text: "hola", origin: "generated" });
    expect(s.facts).toHaveLength(1);
  });
});

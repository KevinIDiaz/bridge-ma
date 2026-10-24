import { afterEach, describe, expect, it, vi } from "vitest";
import { openAIAssistantTurn } from "@/lib/assistant/openai";
import { runAssistant } from "@/lib/assistant/orchestrator";
import type { AssistantRequest } from "@/lib/assistant/types";

const request: AssistantRequest = {
  locale: "en",
  message: "I live in Boston and rent my home.",
  currentFacts: [],
};

const originalKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
});

describe("OpenAI assistant boundary", () => {
  it("parses a strict structured response and revalidates fact values locally", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          reply: "I heard two details.",
          proposedFacts: [
            { id: "city", value: "Boston", confidence: "high" },
            { id: "lives_in_ma", value: "true", confidence: "high" },
            { id: "not_allowed", value: "anything", confidence: "high" },
          ],
          followUpQuestion: "Do you rent your home?",
          readyForReview: true,
        }),
      }),
    })));

    const turn = await openAIAssistantTurn(request, "test-key", 100);
    expect(turn.mode).toBe("live");
    expect(turn.proposedFacts).toEqual([
      { id: "city", value: "Boston", confidence: "high" },
      { id: "lives_in_ma", value: true, confidence: "high" },
    ]);
  });

  it("aborts a provider request at the configured timeout", async () => {
    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      }),
    ));
    await expect(openAIAssistantTurn(request, "test-key", 5)).rejects.toThrow();
  });

  it("returns the deterministic demo assistant when the provider fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));
    const turn = await runAssistant(request);
    expect(turn.mode).toBe("demo");
    expect(turn.proposedFacts.map((fact) => fact.id)).toContain("city");
  });
});


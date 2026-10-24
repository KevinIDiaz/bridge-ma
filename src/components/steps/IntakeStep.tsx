"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n";
import { factValueLabel } from "@/lib/i18n/localize";
import { session } from "@/lib/session/store";
import { INTAKE_FACT_DEFS } from "@/lib/session/factDefs";
import { validateAssistantTurn } from "@/lib/assistant/validation";
import type { AssistantMode, ProposedFact } from "@/lib/assistant/types";
import { StepHeading } from "@/components/StepHeading";
import type { ResidentFact } from "@/lib/rules/types";

interface Props {
  lang: Locale;
}

interface Message {
  id: number;
  speaker: "assistant" | "resident";
  text: string;
}

interface SpeechResultEvent {
  results: { 0: { 0: { transcript: string } } };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function IntakeStep({ lang }: Props) {
  const router = useRouter();
  const t = getDictionary(lang);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, speaker: "assistant", text: t.intake.welcome },
  ]);
  const [draft, setDraft] = useState("");
  const [facts, setFacts] = useState<ProposedFact[]>([]);
  const [followUp, setFollowUp] = useState("");
  const [mode, setMode] = useState<AssistantMode>("demo");
  const [pending, setPending] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");

  const factMap = useMemo(() => new Map(facts.map((fact) => [fact.id, fact])), [facts]);

  async function sendMessage(messageOverride?: string): Promise<void> {
    const message = (messageOverride ?? draft).trim();
    if (!message || pending) return;
    setPending(true);
    setError("");
    setDraft("");
    setMessages((current) => [...current, { id: Date.now(), speaker: "resident", text: message }]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, locale: lang, currentFacts: facts }),
      });
      if (!response.ok) throw new Error("assistant_request_failed");
      const body: unknown = await response.json();
      const reportedMode =
        typeof body === "object" && body !== null && (body as Record<string, unknown>).mode === "live" ? "live" : "demo";
      const turn = validateAssistantTurn(body, reportedMode);
      if (!turn) throw new Error("assistant_response_invalid");
      setFacts(turn.proposedFacts);
      setFollowUp(turn.followUpQuestion);
      setMode(turn.mode);
      const assistantText = [turn.reply, turn.followUpQuestion].filter(Boolean).join(" ");
      setMessages((current) => [...current, { id: Date.now() + 1, speaker: "assistant", text: assistantText }]);
    } catch {
      setError(t.intake.assistantError);
      setDraft(message);
    } finally {
      setPending(false);
    }
  }

  function reviewFacts(): void {
    const residentFacts: ResidentFact[] = INTAKE_FACT_DEFS.map((def) => ({
      id: def.id,
      value: factMap.get(def.id)?.value ?? "unknown",
      confirmation: "unconfirmed",
      origin: "user",
    }));
    session.setFacts(residentFacts);
    router.push(`/${lang}/confirm`);
  }

  function startVoice(): void {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError(t.intake.voiceUnavailable);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = lang === "es" ? "es-US" : "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => setDraft(event.results[0][0].transcript);
    recognition.onerror = () => setError(t.intake.voiceUnavailable);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  return (
    <main id="main" className="container conversational-intake">
      <p className="step-label">{t.intake.stepLabel}</p>
      <StepHeading>{t.intake.title}</StepHeading>
      <p className="lede-small">{t.intake.intro}</p>

      <div className="privacy-strip" role="note">
        <strong>{t.intake.privacyTitle}</strong> {t.intake.fictionalNotice}
      </div>

      <section className="conversation" aria-label={t.intake.conversationLabel}>
        <ol className="message-list" aria-live="polite" aria-relevant="additions">
          {messages.map((message) => (
            <li key={message.id} className={`message message-${message.speaker}`}>
              <span className="message-speaker">
                {message.speaker === "assistant" ? t.intake.bridgeSpeaker : t.intake.youSpeaker}
              </span>
              <p>{message.text}</p>
            </li>
          ))}
          {pending ? (
            <li className="message message-assistant" role="status">
              <span className="message-speaker">{t.intake.bridgeSpeaker}</span>
              <p>{t.intake.thinking}</p>
            </li>
          ) : null}
        </ol>

        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <label htmlFor="story-message">{t.intake.messageLabel}</label>
          <textarea
            id="story-message"
            rows={4}
            maxLength={2000}
            value={draft}
            placeholder={followUp || t.intake.placeholder}
            onChange={(event) => setDraft(event.target.value)}
            disabled={pending}
          />
          <div className="composer-actions">
            <button type="submit" disabled={pending || draft.trim() === ""}>
              {t.intake.send}
            </button>
            <button type="button" className="secondary" onClick={startVoice} disabled={pending || listening}>
              {listening ? t.intake.listening : t.intake.voice}
            </button>
          </div>
        </form>
        {error ? <p className="field-error" role="alert">{error}</p> : null}
        <button type="button" className="demo-story-button" onClick={() => void sendMessage(t.intake.demoStory)} disabled={pending}>
          {t.intake.useDemo}
        </button>
      </section>

      <aside className="understood-panel" aria-labelledby="understood-title">
        <div className="understood-heading">
          <div>
            <p className="eyebrow">{mode === "live" ? t.intake.liveMode : t.intake.demoMode}</p>
            <h2 id="understood-title">{t.intake.understood}</h2>
          </div>
          <span className="count-badge">{facts.length}</span>
        </div>
        {facts.length === 0 ? (
          <p>{t.intake.noFacts}</p>
        ) : (
          <dl className="understood-facts">
            {facts.map((fact) => (
              <div key={fact.id} data-fact-id={fact.id}>
                <dt>{t.facts[fact.id as keyof typeof t.facts] ?? fact.id}</dt>
                <dd>{factValueLabel(t, fact)}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="understood-note">{t.intake.understoodNote}</p>
        <button type="button" className="button-primary review-button" onClick={reviewFacts} disabled={facts.length === 0}>
          {t.intake.review}
        </button>
      </aside>
    </main>
  );
}

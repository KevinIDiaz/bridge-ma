import type { Locale } from "@/lib/i18n";
import type { AssistantRequest, AssistantTurn, ProposedFact } from "./types";
import { mergeProposedFacts } from "./validation";

const MA_CITIES = ["Boston", "Cambridge", "Somerville", "Worcester", "Springfield", "Lowell", "Quincy", "Brockton"];

function fact(id: string, value: ProposedFact["value"], confidence: ProposedFact["confidence"] = "high"): ProposedFact {
  return { id, value, confidence };
}

function has(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function extract(message: string): ProposedFact[] {
  const text = message.normalize("NFC");
  const lower = text.toLocaleLowerCase();
  const facts: ProposedFact[] = [];

  if (has(lower, [/\bspanish\b/, /\bespañol\b/, /\bespanol\b/])) facts.push(fact("preferred_language", "es"));
  else if (has(lower, [/\benglish\b/, /\binglés\b/, /\bingles\b/])) facts.push(fact("preferred_language", "en"));

  const city = MA_CITIES.find((candidate) => new RegExp(`\\b${candidate}\\b`, "i").test(text));
  if (city) {
    facts.push(fact("city", city));
    facts.push(fact("lives_in_ma", true));
  } else if (has(lower, [/massachusetts/, /\bin ma\b/, /\ben ma\b/])) {
    facts.push(fact("lives_in_ma", true));
  }

  const household = lower.match(/(?:household|family|familia|somos)\s+(?:of\s+|de\s+)?(\d{1,2})/);
  if (household) facts.push(fact("household_size", Number(household[1])));

  if (has(lower, [/single (?:mom|mother|dad|father|parent)/, /madre soltera/, /padre soltero/])) {
    facts.push(fact("single_parent", true));
  }
  if (has(lower, [/lost (?:my |a )?job/, /laid off/, /perd[ií].*(?:empleo|trabajo)/, /sin empleo/])) {
    facts.push(fact("lost_job_recently", true));
  }
  if (has(lower, [/\bi rent\b/, /rent my home/, /renter/, /inquilin[oa]/, /\balquilo\b/])) {
    facts.push(fact("rents_home", true));
  }
  if (has(lower, [/no (?:notice to quit|eviction notice)/, /did not receive.*(?:notice to quit|eviction)/, /no recib[ií].*(?:aviso|notice to quit)/])) {
    facts.push(fact("received_notice_to_quit", false));
  } else if (has(lower, [/notice to quit/, /eviction notice/, /aviso (?:para|de) desaloj/, /aviso de desalojo/])) {
    facts.push(fact("received_notice_to_quit", true));
  }
  if (has(lower, [/utility account.*(?:my name|mine)/, /utilities.*(?:my name|mine)/, /cuenta.*servicios.*mi nombre/])) {
    facts.push(fact("has_utility_account", true));
  }
  if (has(lower, [/shutoff notice/, /shut-off notice/, /disconnect notice/, /aviso de corte/, /aviso.*desconexi[oó]n/])) {
    const uncertain = has(lower, [/don.?t know/, /do not know/, /not sure/, /no (?:lo )?s[eé]/]);
    facts.push(fact("received_shutoff_notice", uncertain ? "unknown" : true, uncertain ? "medium" : "high"));
  }

  return facts;
}

function nextQuestion(locale: Locale, facts: readonly ProposedFact[]): string {
  const ids = new Set(facts.map((item) => item.id));
  const questions = locale === "es"
    ? [
        ["lives_in_ma", "¿Vive actualmente en Massachusetts?"],
        ["rents_home", "¿Alquila su vivienda?"],
        ["received_notice_to_quit", "¿Ha recibido un Notice to Quit o un aviso de desalojo?"],
        ["lost_job_recently", "¿Perdió un trabajo recientemente o bajaron sus ingresos?"],
        ["received_shutoff_notice", "¿Recibió un aviso formal de corte de gas o electricidad?"],
      ]
    : [
        ["lives_in_ma", "Do you currently live in Massachusetts?"],
        ["rents_home", "Do you rent your home?"],
        ["received_notice_to_quit", "Have you received a Notice to Quit or eviction notice?"],
        ["lost_job_recently", "Did you recently lose a job or have your income reduced?"],
        ["received_shutoff_notice", "Have you received a formal gas or electric shutoff notice?"],
      ];
  return questions.find(([id]) => !ids.has(id))?.[1] ?? "";
}

function inferShortAnswer(message: string, current: readonly ProposedFact[]): ProposedFact[] {
  const normalized = message.trim().toLocaleLowerCase();
  const value = /^(yes|sí|si)\b/.test(normalized)
    ? true
    : /^(?:i don.?t know|not sure|no (?:lo )?s[eé])(?:$|[,.!\s])/.test(normalized)
        ? "unknown"
        : /^(no)\b/.test(normalized)
          ? false
          : null;
  if (value === null) return [];
  const ids = new Set(current.map((item) => item.id));
  const nextId = ["lives_in_ma", "rents_home", "received_notice_to_quit", "lost_job_recently", "received_shutoff_notice"]
    .find((id) => !ids.has(id));
  return nextId ? [fact(nextId, value)] : [];
}

export function fallbackAssistantTurn(request: AssistantRequest): AssistantTurn {
  const extracted = extract(request.message);
  const proposedFacts = mergeProposedFacts(
    request.currentFacts,
    extracted.length > 0 ? extracted : inferShortAnswer(request.message, request.currentFacts),
  );
  const question = nextQuestion(request.locale, proposedFacts);
  const found = proposedFacts.length - request.currentFacts.length;
  const reply = request.locale === "es"
    ? found > 0
      ? `Entendí ${found} dato${found === 1 ? "" : "s"} nuevo${found === 1 ? "" : "s"}. Revise el resumen y corrija cualquier error.`
      : "No pude identificar un dato nuevo con seguridad. Puede responder con sus propias palabras."
    : found > 0
      ? `I understood ${found} new detail${found === 1 ? "" : "s"}. Please check the summary and correct anything I got wrong.`
      : "I could not identify a new detail with confidence. You can answer in your own words.";
  const essential = new Set(proposedFacts.map((item) => item.id));
  const readyForReview = ["lives_in_ma", "rents_home", "lost_job_recently"].some((id) => essential.has(id)) && proposedFacts.length >= 4;

  return {
    reply,
    proposedFacts,
    followUpQuestion: question,
    readyForReview,
    mode: "demo",
  };
}


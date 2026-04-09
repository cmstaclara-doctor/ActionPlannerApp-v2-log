/**
 * PII sanitizer for GoalGetter — two layers:
 *
 * Layer 1 — sanitizePII()   : regex scrub (emails, phones, URLs)
 * Layer 2 — nerRedact()     : NLP named-entity redaction (people, orgs, places)
 *                             Uses `compromise` — pure JS, runs in-process, no network call.
 *
 * Use nerRedact() for free-form user text (goals, declarations, transcripts, chat).
 * Use sanitizePII() alone for structured numeric/short fields.
 */

/** Add this to every prompt that receives user-generated content. */
export const PRIVACY_CLAUSE =
  "IMPORTANT: Never echo back, reference, or reproduce specific person names, company names, email addresses, phone numbers, or any identifying information from the input in your response.";

// ─── Layer 1: Regex scrub ─────────────────────────────────────────────────────

function scrubEmails(text: string): string {
  return text.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "[EMAIL]");
}

function scrubPhones(text: string): string {
  return text
    .replace(/(\+?63[-.\s]?|0)9\d{2}[-.\s]?\d{3}[-.\s]?\d{4}/g, "[PHONE]")
    .replace(/\b\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g, "[PHONE]");
}

function scrubUrls(text: string): string {
  return text.replace(/https?:\/\/[^\s"'<>]+/g, "[URL]");
}

/**
 * Layer 1: Strip emails, phone numbers, and URLs from any string.
 */
export function sanitizePII(text: string | null | undefined): string {
  if (!text) return text ?? "";
  let t = scrubEmails(text);
  t = scrubPhones(t);
  t = scrubUrls(t);
  return t;
}

// ─── Layer 2: NER redaction ───────────────────────────────────────────────────

let nlpInstance: ReturnType<typeof import("compromise")["default"]> | null = null;

async function getNlp() {
  if (!nlpInstance) {
    // Dynamic import — compromise is a large module, load once and cache
    const { default: nlp } = await import("compromise");
    nlpInstance = nlp as unknown as ReturnType<typeof import("compromise")["default"]>;
  }
  return nlpInstance;
}

/**
 * Layer 2: Detect and replace named entities (people, organizations, places)
 * in free-form text using compromise NLP — runs entirely in-process, no network.
 *
 * Replacements:
 *   Person names  → [PERSON]
 *   Organizations → [ORG]
 *   Places        → [PLACE]
 *
 * Then applies Layer 1 (emails, phones, URLs) on top.
 */
export async function nerRedact(text: string | null | undefined): Promise<string> {
  if (!text) return text ?? "";

  try {
    const nlp = await getNlp();
    // @ts-ignore — compromise types are loose
    const doc = nlp(text);

    let redacted = text;

    // Collect all entity spans and sort by position descending to replace from end
    const entities: { start: number; end: number; tag: string }[] = [];

    // @ts-ignore
    doc.people().forEach((m: { text: () => string; offset: () => { start: number; length: number } }) => {
      const off = m.offset();
      entities.push({ start: off.start, end: off.start + off.length, tag: "[PERSON]" });
    });

    // @ts-ignore
    doc.organizations().forEach((m: { text: () => string; offset: () => { start: number; length: number } }) => {
      const off = m.offset();
      entities.push({ start: off.start, end: off.start + off.length, tag: "[ORG]" });
    });

    // @ts-ignore
    doc.places().forEach((m: { text: () => string; offset: () => { start: number; length: number } }) => {
      const off = m.offset();
      entities.push({ start: off.start, end: off.start + off.length, tag: "[PLACE]" });
    });

    // Sort descending by start so replacements don't shift positions
    entities.sort((a, b) => b.start - a.start);

    for (const { start, end, tag } of entities) {
      redacted = redacted.slice(0, start) + tag + redacted.slice(end);
    }

    // Apply Layer 1 on top
    return sanitizePII(redacted);
  } catch {
    // If NER fails for any reason, fall back to Layer 1 only
    console.warn("[NER] compromise redaction failed, falling back to regex-only sanitization");
    return sanitizePII(text);
  }
}

/**
 * Client-side PII pre-flight scanner.
 *
 * Runs in the browser BEFORE any text is submitted to the server.
 * Detects likely PII patterns and returns warnings so the UI can
 * prompt the user before the data is sent anywhere.
 *
 * This is a UX-layer check — actual NER redaction still happens server-side.
 */

export interface PIIScanResult {
  clean: boolean;
  warnings: string[];
}

// Patterns that strongly suggest PII
const CHECKS: { label: string; pattern: RegExp }[] = [
  {
    label: "email address",
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  },
  {
    label: "Philippine phone number",
    pattern: /(\+?63[-.\s]?|0)9\d{2}[-.\s]?\d{3}[-.\s]?\d{4}/,
  },
  {
    label: "international phone number",
    pattern: /\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/,
  },
  {
    label: "URL / website",
    pattern: /https?:\/\/[^\s]+/,
  },
  {
    label: "honorific + name (e.g. Dr. Santos, Engr. Cruz)",
    pattern: /\b(Dr|Mr|Mrs|Ms|Engr|Atty|Prof|Dra)\.\s+[A-Z][a-z]+/,
  },
  {
    label: "company suffix (Inc., Corp., Ltd., LLC)",
    pattern: /\b[A-Z][a-zA-Z\s]+\s+(Inc\.|Corp\.|Ltd\.|LLC|Co\.|Foundation|Corporation|Company)\b/,
  },
];

/**
 * Scan text for likely PII patterns.
 * Returns { clean: true } if nothing found, or { clean: false, warnings } if hits detected.
 */
export function scanForPII(text: string): PIIScanResult {
  const warnings: string[] = [];
  for (const { label, pattern } of CHECKS) {
    if (pattern.test(text)) {
      warnings.push(label);
    }
  }
  return { clean: warnings.length === 0, warnings };
}

/**
 * Scan multiple fields at once. Returns combined result.
 */
export function scanFields(fields: Record<string, string | null | undefined>): PIIScanResult & { fields: string[] } {
  const allWarnings: string[] = [];
  const affectedFields: string[] = [];

  for (const [fieldName, value] of Object.entries(fields)) {
    if (!value) continue;
    const result = scanForPII(value);
    if (!result.clean) {
      affectedFields.push(fieldName);
      for (const w of result.warnings) {
        if (!allWarnings.includes(w)) allWarnings.push(w);
      }
    }
  }

  return {
    clean: allWarnings.length === 0,
    warnings: allWarnings,
    fields: affectedFields,
  };
}

export type GuardCategory = "religion" | "caste" | "community" | "region" | "surname";
export type GuardVerdict = "ok" | "flag" | "reject";

export interface GuardMatch {
  term: string;
  category: GuardCategory;
}

export interface GuardResult {
  verdict: GuardVerdict;
  matches: GuardMatch[];
}

/** Terms that are never acceptable as a screening criterion. */
const REJECT_TERMS: Record<"religion" | "caste" | "community", string[]> = {
  religion: [
    "hindu", "muslim", "musalman", "islam", "islamic", "christian", "sikh", "jain", "jains",
    "parsi", "buddhist", "jew", "jewish", "atheist", "religion", "religious", "dharm", "dharma",
  ],
  caste: [
    "brahmin", "brahman", "bania", "baniya", "rajput", "kshatriya", "vaishya", "shudra",
    "dalit", "obc", "sc/st", "caste", "jati", "jaati", "kayastha", "lohana",
  ],
  community: ["community", "samaj", "samaaj", "sanatani"],
};

/** Origin terms are rejected only when used to include or exclude people. */
const REGION_TERMS = [
  "gujarati", "marwari", "bihari", "punjabi", "bengali", "madrasi", "south indian",
  "north indian", "up wale", "outsider", "outsiders", "migrant", "migrants",
  "maharashtrian", "rajasthani", "kashmiri", "nepali", "tamil", "malayali", "telugu",
];

/** Surnames are common in addresses and names, so they go to review rather than being rejected. */
const SURNAME_TERMS = [
  "patel", "shah", "mehta", "desai", "joshi", "trivedi", "pandya", "modi", "thakkar",
  "parekh", "gandhi", "sharma", "gupta", "khan", "sheikh", "syed", "singh", "chaudhary", "darbar",
];

/** Non-Latin script terms are matched as substrings. */
const INDIC_REJECT_TERMS: GuardMatch[] = [
  { term: "हिंदू", category: "religion" },
  { term: "हिन्दू", category: "religion" },
  { term: "मुस्लिम", category: "religion" },
  { term: "जैन", category: "religion" },
  { term: "ब्राह्मण", category: "caste" },
  { term: "જૈન", category: "religion" },
  { term: "હિન્દુ", category: "religion" },
  { term: "મુસ્લિમ", category: "religion" },
  { term: "બ્રાહ્મણ", category: "caste" },
  { term: "જ્ઞાતિ", category: "caste" },
  { term: "જાતિ", category: "caste" },
];

const SUBSTITUTIONS: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "@": "a", "$": "s",
};

export function normalise(input: string, oneAs: "i" | "l" = "i"): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[01345@$]/g, (c) => (c === "1" ? oneAs : (SUBSTITUTIONS[c] ?? c)))
    .replace(/[^\p{L}\p{M}\p{N}/\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Joins letters spread out with spaces, e.g. "m u s l i m" becomes "muslim". */
function collapseSpacedLetters(text: string): string {
  return text.replace(/(?:^|\s)((?:\p{L}\s){2,}\p{L})(?=\s|$)/gu, (_, run: string) => " " + run.replace(/\s/g, ""));
}

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

function hasWord(text: string, term: string): boolean {
  return new RegExp(`(^|\\s)${escapeRegex(term)}(\\s|$)`, "u").test(text);
}

const INTENT =
  "(only|prefer|preferred|preferably|strictly|must|required|no|not|non|exclusive|exclusively|wanted|welcome)";

function usedAsFilter(text: string, term: string): boolean {
  const escaped = escapeRegex(term);
  const before = new RegExp(`(^|\\s)${INTENT}\\s+(\\w+\\s+){0,2}${escaped}(\\s|$)`, "u");
  const after = new RegExp(`(^|\\s)${escaped}\\s+(\\w+\\s+){0,1}${INTENT}(\\s|$)`, "u");
  return before.test(text) || after.test(text);
}

/** Everyday property wording that contains a watched word but says nothing about people. */

const NEUTRAL_PHRASES =
  /\b(gated|residential|housing|apartment|township)\s+communit(y|ies)\b|\bcommunity\s+(hall|garden|park|centre|center|gym|clubhouse|area|space|playground)\b/gi;

export function checkText(rawInput: string): GuardResult {
  const input = rawInput.replace(NEUTRAL_PHRASES, " ");
  const variants = new Set<string>();
  for (const one of ["i", "l"] as const) {
    const n = normalise(input, one);
    variants.add(n);
    variants.add(collapseSpacedLetters(n).trim());
  }
  const rank = { ok: 0, flag: 1, reject: 2 } as const;
  return [...variants]
    .map((text) => checkVariant(input, text))
    .reduce((worst, r) => (rank[r.verdict] > rank[worst.verdict] ? r : worst));
}

function checkVariant(input: string, text: string): GuardResult {
  const matches: GuardMatch[] = [];
  let reject = false;

  for (const category of Object.keys(REJECT_TERMS) as Array<keyof typeof REJECT_TERMS>) {
    for (const term of REJECT_TERMS[category]) {
      if (hasWord(text, term)) {
        matches.push({ term, category });
        reject = true;
      }
    }
  }

  for (const entry of INDIC_REJECT_TERMS) {
    if (input.includes(entry.term)) {
      matches.push(entry);
      reject = true;
    }
  }

  for (const term of REGION_TERMS) {
    if (hasWord(text, term)) {
      matches.push({ term, category: "region" });
      if (usedAsFilter(text, term)) reject = true;
    }
  }

  let flag = matches.length > 0;
  for (const term of SURNAME_TERMS) {
    if (hasWord(text, term)) {
      matches.push({ term, category: "surname" });
      flag = true;
    }
  }

  return { verdict: reject ? "reject" : flag ? "flag" : "ok", matches };
}

export const GUARD_MESSAGE =
  "Please describe house rules and practical needs only: food, pets, smoking, visitors, lease. Religion, caste, community, surname and place of origin cannot be used.";

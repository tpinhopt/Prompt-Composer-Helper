// src/matcher_shared.js
const CONTROLLED_SOURCE_TEXT_NORMALIZATION_RULES = Object.freeze([
  [/\bred[\s-]?headed\b/gi, "red hair"],
  [/\bredhaired\b/gi, "red hair"],
  [/\bred[\s-]?haired\b/gi, "red hair"],
  [/\bblack[\s-]?haired\b/gi, "black hair"],
  [/\bblonde[\s-]?haired\b/gi, "blonde hair"],
  [/\bblond[\s-]?haired\b/gi, "blonde hair"],
  [/\bblue[\s-]?eyed\b/gi, "blue eyes"],
  [/\bgreen[\s-]?eyed\b/gi, "green eyes"],
  [/\boff[\s-]?shoulder\b/gi, "off shoulder"],
  [/\bclose[\s-]?up\b/gi, "close up"],
]);
const CONTROLLED_COMPACT_VARIANTS_BY_NORMALIZED_PHRASE = Object.freeze({
  "red hair": Object.freeze(["redheaded", "redhaired"]),
  "black hair": Object.freeze(["blackhaired"]),
  "blonde hair": Object.freeze(["blondehaired", "blondhaired"]),
  "blue eyes": Object.freeze(["blueeyed"]),
  "green eyes": Object.freeze(["greeneyed"]),
  "off shoulder": Object.freeze(["offshoulder"]),
  "close up": Object.freeze(["closeup"]),
});
const CONTROLLED_INFLECTION_GROUPS = Object.freeze([
  Object.freeze(["blush", "blushing"]),
  Object.freeze(["smile", "smiling"]),
  Object.freeze(["laugh", "laughing"]),
  Object.freeze(["cry", "crying"]),
  Object.freeze(["kiss", "kisses", "kissing"]),
]);
const CONTROLLED_INTERVENING_WORDS = Object.freeze([
  "slightly",
  "gently",
  "softly",
  "lightly",
  "her",
  "his",
  "the",
  "other",
  "others",
  "own",
]);
const INTERVENING_TOLERANCE_TAG_ALLOWLIST = new Set([
  "spread_legs",
  "kissing_neck",
  "looking_back",
  "hands_on_own_hips",
  "crossed_legs",
]);
const CONTROLLED_PLURAL_IRREGULAR_TO_SINGULAR = Object.freeze({
  leaves: "leaf",
  wolves: "wolf",
  wives: "wife",
  knives: "knife",
  men: "man",
  women: "woman",
  feet: "foot",
  teeth: "tooth",
});
const CONTROLLED_SINGULAR_IRREGULAR_TO_PLURAL = Object.freeze({
  leaf: "leaves",
  wolf: "wolves",
  wife: "wives",
  knife: "knives",
  man: "men",
  woman: "women",
  foot: "feet",
  tooth: "teeth",
});
const CANONICAL_TAG_LOWER_SET_CACHE = new WeakMap();
const EMPTY_CANONICAL_TAG_SET = new Set();

function normalizeBasicToken(raw) {
  return String(raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function dedupeLower(values) {
  const seen = new Set();
  const out = [];
  for (const value of values || []) {
    const token = normalizeBasicToken(value);
    if (!token) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

const CONTROLLED_INFLECTION_FORMS_BY_TOKEN = (() => {
  const map = new Map();
  for (const group of CONTROLLED_INFLECTION_GROUPS) {
    const forms = dedupeLower(group);
    for (const token of forms) {
      map.set(token, forms);
    }
  }
  return map;
})();

function applyControlledSourceTextNormalization(input) {
  let out = String(input ?? "");
  for (const [pattern, replacement] of CONTROLLED_SOURCE_TEXT_NORMALIZATION_RULES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function preprocessTokenText(input) {
  return applyControlledSourceTextNormalization(String(input ?? ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2019]s\b/gi, "")
    .replace(/[^\w\s]+/g, " ")
    .replace(/_/g, " ")
    .toLowerCase()
    .trim();
}

function stripCombiningMarks(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function foldCharForMatching(rawChar) {
  const stripped = stripCombiningMarks(rawChar).toLowerCase();
  if (stripped.length === 1) return stripped;
  return String(rawChar || "").toLowerCase();
}

function isTokenWordChar(ch) {
  return /[a-z0-9_]/i.test(String(ch || ""));
}

function isPossessiveSuffixAt(source, index) {
  const ch = source[index];
  if (ch !== "'" && ch !== "\u2019") return false;
  const next = source[index + 1];
  if (!next || String(next).toLowerCase() !== "s") return false;
  const after = source[index + 2];
  if (!after) return true;
  return !isTokenWordChar(after);
}

export function normalizeText(input) {
  const cleaned = preprocessTokenText(input);
  return cleaned.replace(/\s+/g, " ").trim();
}

function splitNormalizedTokens(normalized) {
  return String(normalized || "")
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function phraseTokensFromText(input) {
  return splitNormalizedTokens(normalizeText(input));
}

export function tagTokensFromTag(tag) {
  const normalized = normalizeText(String(tag ?? "").replace(/_/g, " "));
  return splitNormalizedTokens(normalized);
}

function singularizeControlledToken(tokenRaw) {
  const token = normalizeText(tokenRaw);
  if (!token) return "";
  const irregular = CONTROLLED_PLURAL_IRREGULAR_TO_SINGULAR[token];
  if (irregular) return irregular;
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (/(?:ches|shes|sses|xes|zes)$/.test(token) && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && token.length > 3 && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

function pluralizeControlledToken(tokenRaw) {
  const token = normalizeText(tokenRaw);
  if (!token) return "";
  const irregular = CONTROLLED_SINGULAR_IRREGULAR_TO_PLURAL[token];
  if (irregular) return irregular;
  if (/[sxz]$/.test(token) || /(?:ch|sh)$/.test(token)) return `${token}es`;
  if (token.endsWith("y") && token.length > 2 && !/[aeiou]y$/.test(token)) {
    return `${token.slice(0, -1)}ies`;
  }
  return `${token}s`;
}

function compactVariantsForPhraseNorm(phraseNorm) {
  const normalizedPhrase = normalizeText(phraseNorm);
  if (!normalizedPhrase) return [];
  const out = new Set();

  const direct = CONTROLLED_COMPACT_VARIANTS_BY_NORMALIZED_PHRASE[normalizedPhrase];
  if (Array.isArray(direct)) {
    for (const value of direct) {
      const normalized = normalizeText(value);
      if (normalized) out.add(normalized);
    }
  }

  for (const [basePhrase, compactList] of Object.entries(
    CONTROLLED_COMPACT_VARIANTS_BY_NORMALIZED_PHRASE
  )) {
    const normalizedBase = normalizeText(basePhrase);
    if (!Array.isArray(compactList) || !compactList.length) continue;
    const normalizedCompacts = compactList.map((value) => normalizeText(value)).filter(Boolean);
    if (!normalizedCompacts.includes(normalizedPhrase)) continue;
    if (normalizedBase) out.add(normalizedBase);
  }

  return Array.from(out).filter(Boolean);
}

export function shouldAllowInterveningWordsForTag(tag) {
  const lower = String(tag ?? "").trim().toLowerCase();
  if (!lower) return false;
  return INTERVENING_TOLERANCE_TAG_ALLOWLIST.has(lower);
}

export function controlledInterveningWords() {
  return CONTROLLED_INTERVENING_WORDS;
}

export function buildControlledPhraseTokenVariants(phraseTokens, tag, canonicalTagSet = new Set()) {
  const tokens = Array.isArray(phraseTokens)
    ? phraseTokens.map((token) => normalizeText(token)).filter(Boolean)
    : [];
  const tagLower = String(tag ?? "").trim().toLowerCase();
  let canonicalLowerSet = EMPTY_CANONICAL_TAG_SET;
  if (canonicalTagSet instanceof Set) {
    const cachedSet = CANONICAL_TAG_LOWER_SET_CACHE.get(canonicalTagSet);
    if (cachedSet instanceof Set) {
      canonicalLowerSet = cachedSet;
    } else {
      let hasMixedCase = false;
      for (const value of canonicalTagSet) {
        const raw = String(value ?? "").trim();
        if (!raw) continue;
        if (raw !== raw.toLowerCase()) {
          hasMixedCase = true;
          break;
        }
      }
      if (!hasMixedCase) {
        canonicalLowerSet = canonicalTagSet;
      } else {
        canonicalLowerSet = new Set();
        for (const value of canonicalTagSet) {
          const lower = String(value ?? "").trim().toLowerCase();
          if (lower) canonicalLowerSet.add(lower);
        }
      }
      CANONICAL_TAG_LOWER_SET_CACHE.set(canonicalTagSet, canonicalLowerSet);
    }
  }
  if (!tokens.length || !tagLower) return [];

  const normalizedPhrase = tokens.join(" ");
  const compactVariants = compactVariantsForPhraseNorm(normalizedPhrase);
  const hasInflectionCandidate = tokens.some((token) => CONTROLLED_INFLECTION_FORMS_BY_TOKEN.has(token));
  const canPluralizeSingle =
    tokens.length === 1 &&
    tokens[0].length > 2 &&
    !CONTROLLED_INFLECTION_FORMS_BY_TOKEN.has(tokens[0]) &&
    !tokens[0].endsWith("ing");
  if (!hasInflectionCandidate && !compactVariants.length && !canPluralizeSingle) {
    return [tokens];
  }

  const maxVariants = 48;
  const variants = new Set([normalizedPhrase]);
  let states = [[]];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const options = new Set([token]);
    const inflections = CONTROLLED_INFLECTION_FORMS_BY_TOKEN.get(token);
    if (Array.isArray(inflections)) {
      for (const form of inflections) options.add(form);
    }

    if (tokens.length === 1 && token.length > 2) {
      const singular = singularizeControlledToken(token);
      const plural = pluralizeControlledToken(token);
      const looksVerbLike = CONTROLLED_INFLECTION_FORMS_BY_TOKEN.has(token) || token.endsWith("ing");
      const tagAligned =
        tagLower === token ||
        tagLower === singular ||
        tagLower.endsWith(`_${token}`) ||
        tagLower.endsWith(`_${singular}`);
      if (!looksVerbLike && tagAligned) {
        if (token === singular) {
          if (plural && plural !== token && !canonicalLowerSet.has(plural)) {
            options.add(plural);
          }
        } else if (!canonicalLowerSet.has(token) && singular && canonicalLowerSet.has(singular)) {
          options.add(singular);
        }
      }
    }

    const nextStates = [];
    for (const state of states) {
      for (const option of options) {
        nextStates.push([...state, option]);
        if (nextStates.length >= maxVariants) break;
      }
      if (nextStates.length >= maxVariants) break;
    }
    states = nextStates.length ? nextStates : states;
    if (states.length >= maxVariants) break;
  }

  for (const state of states) {
    if (!Array.isArray(state) || !state.length) continue;
    variants.add(state.join(" "));
    if (variants.size >= maxVariants) break;
  }

  for (const compact of compactVariants) {
    variants.add(compact);
  }

  return Array.from(variants)
    .map((phraseNorm) => splitNormalizedTokens(phraseNorm))
    .filter((parts) => parts.length > 0);
}

function defaultPhraseFromTag(tag) {
  return String(tag ?? "").replace(/_/g, " ");
}

function normalizeMappingPair(tagRaw, phraseRaw) {
  const tag = String(tagRaw ?? "").trim();
  if (!tag) return null;

  const phrase = String(phraseRaw ?? "").trim() || defaultPhraseFromTag(tag);
  if (!phrase) return null;

  return {
    tag,
    phrase,
  };
}

export function extractMappingPairs(data) {
  const pairs = [];
  let sawSchema = false;

  if (Array.isArray(data?.tags)) {
    sawSchema = true;
    for (const item of data.tags) {
      const tag = String(item?.tag ?? "").trim();
      if (!tag) continue;

      const words = Array.isArray(item?.words) ? item.words : [];
      if (!words.length) {
        const normalized = normalizeMappingPair(tag, item?.phrase);
        if (normalized) pairs.push(normalized);
        continue;
      }

      for (const word of words) {
        const normalized = normalizeMappingPair(tag, word);
        if (normalized) pairs.push(normalized);
      }
    }
  }

  if (Array.isArray(data?.items)) {
    sawSchema = true;
    for (const item of data.items) {
      if (typeof item === "string") {
        const normalized = normalizeMappingPair(item, item);
        if (normalized) pairs.push(normalized);
        continue;
      }

      const normalized = normalizeMappingPair(item?.tag, item?.phrase);
      if (normalized) pairs.push(normalized);
    }
  }

  if (!sawSchema) {
    return {
      pairs: [],
      totalTags: 0,
    };
  }

  const dedupedPairs = [];
  const seen = new Set();
  for (const pair of pairs) {
    const tag = String(pair?.tag ?? "").trim();
    const phrase = String(pair?.phrase ?? "").trim();
    if (!tag || !phrase) continue;

    const key = `${tag.toLowerCase()}::${phrase.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedPairs.push({ tag, phrase });
  }

  const totalTags = new Set(
    dedupedPairs.map((pair) => String(pair?.tag || "").toLowerCase())
  ).size;

  return {
    pairs: dedupedPairs,
    totalTags,
  };
}

export function isStrictTokenSubphrase(phraseTokens, tagTokens) {
  const phrase = Array.isArray(phraseTokens) ? phraseTokens.filter(Boolean) : [];
  const tag = Array.isArray(tagTokens) ? tagTokens.filter(Boolean) : [];
  if (!phrase.length || !tag.length) return false;
  if (phrase.length >= tag.length) return false;

  for (let i = 0; i + phrase.length <= tag.length; i += 1) {
    let ok = true;
    for (let j = 0; j < phrase.length; j += 1) {
      if (phrase[j] !== tag[i + j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

export function escapeRegexLiteral(raw) {
  return String(raw ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildPhraseBoundaryRegexSource(phraseTokens) {
  const tokens = Array.isArray(phraseTokens)
    ? phraseTokens.map((token) => String(token || "").trim()).filter(Boolean)
    : [];
  if (!tokens.length) return "";

  const core =
    tokens.length === 1
      ? escapeRegexLiteral(tokens[0])
      : tokens.map((token) => escapeRegexLiteral(token)).join("(?:\\s+|_|-)");
  return `(^|[^a-z0-9_])(${core})(?=$|[^a-z0-9_])`;
}

export function normalizeTextWithMap(input) {
  const source = String(input ?? "");
  const chars = [];
  const normToRaw = [];
  let prevSpace = true;

  for (let i = 0; i < source.length; i += 1) {
    if (isPossessiveSuffixAt(source, i)) {
      i += 1;
      continue;
    }

    const rawCh = source[i];
    const ch = foldCharForMatching(rawCh);
    if (/[a-z0-9_]/.test(ch)) {
      chars.push(ch);
      normToRaw.push(i);
      prevSpace = false;
      continue;
    }

    if (!prevSpace && (/\s/.test(rawCh) || /[^\w\s]/.test(rawCh))) {
      chars.push(" ");
      normToRaw.push(i);
      prevSpace = true;
    }
  }

  while (chars.length && chars[chars.length - 1] === " ") {
    chars.pop();
    normToRaw.pop();
  }

  return {
    normalized: chars.join(""),
    normToRaw,
  };
}

export function isWordChar(rawChar) {
  return /^[a-z0-9_]$/i.test(String(rawChar || ""));
}

export function isAllowedInterTokenSeparator(rawSeparator) {
  const sep = String(rawSeparator || "");
  if (!sep) return false;
  if (/^\s+$/.test(sep)) return true;
  if (/^_+$/.test(sep)) return true;
  if (/^-+$/.test(sep)) return true;
  return false;
}

// src/app.js
import { buildMatcherFromData } from "./matcher_browser.js";
import { escapeRegexLiteral } from "./matcher_shared.js";

const PACK_MANIFEST_URL = "/data/packs_manifest.json";
const PACK_MANIFEST_EMBED_ID = "pack-manifest";

const POSITIVE_DEFAULT_SCORE_BLOCK = ["score_9", "score_8_up", "score_7_up"];
const POSITIVE_QUALITY = ["best_quality", "highres"];
const RAW_HELPER_DEFAULT_ENABLED = true;
const RAW_HELPER_WEIGHT = 0.35;

const NEGATIVE_BASELINE = [
  "lowres",
  "blurry",
  "bad anatomy",
  "bad hands",
  "extra fingers",
  "missing fingers",
  "fused fingers",
  "deformed",
  "bad feet",
  "bad proportions",
  "bad perspective",
  "extra limbs",
  "missing limbs",
  "malformed limbs",
  "cross-eyed",
  "lazy eye",
  "bad face",
  "bad eyes",
  "mutated hands",
  "extra arms",
  "extra legs",
  "poorly drawn face",
  "poorly drawn hands",
  "bad lighting",
  "jpeg artifacts",
  "text",
  "watermark",
  "logo",
  "signature",
];

const NEGATIVE_SFW_SUPPRESS = [
  "nsfw",
  "nude",
  "nipples",
  "pussy",
  "penis",
  "sex",
  "explicit",
];

const NEGATIVE_SUGGESTIVE_SUPPRESS = ["explicit", "sex", "penis", "pussy"];

const NSFW_INTENT_KEYWORDS = [
  "nsfw",
  "nude",
  "naked",
  "sex",
  "porn",
  "nipples",
  "pussy",
  "penis",
  "blowjob",
  "handjob",
  "anal",
  "fuck",
  "cum",
];

const NEGATIVE_CONTRADICTION_KEYWORDS = ["text", "logo", "watermark", "signature"];
const ACTION_LIKE_KEYWORDS = [
  "walking",
  "standing",
  "sitting",
  "lying",
  "kneeling",
  "staring",
  "smile",
  "smiling",
  "blush",
  "blushing",
  "looking",
  "viewer",
];
const COLLECTIVE_POSE_ACTION_TAG_ALLOWLIST = new Set([
  "standing",
  "sitting",
  "lying",
  "kneeling",
  "walking",
  "running",
]);
const PER_ENTITY_POSE_SPLIT_TAG_SET = new Set([
  "sitting",
  "standing",
  "kneeling",
  "lying",
  "sleeping",
  "crouching",
  "perched",
  "crossed_legs",
  "curled_up",
  "on_stomach",
  "lying_down",
]);
const ACTOR_SIDE_INTERACTION_ACTION_TAG_SET = new Set([
  "petting",
  "pet",
  "holding",
  "hugging",
  "touching",
  "feeding",
  "guiding",
  "riding",
  "playing",
  "watching",
  "following",
  "kissing",
]);

const NEGATIVE_SCORE_BLOCK_BY_TIER = {
  9: ["score_6", "score_5", "score_4"],
  8: ["score_5", "score_4"],
  7: ["score_4"],
  6: [],
  5: [],
};

const SPLIT_MARKER_LIMIT = 280;
const SPLIT_INTRO_PUNCT = new Set([",", ":", "-"]);
const ENTITY_SEGMENT_LIMIT = 6;
const ORDINAL_INDEX_BY_WORD = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
};
const ORDINAL_TOKEN_PATTERN =
  "(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th)";
const NON_HUMAN_ENTITY_NOUN_PATTERN =
  "(?:dog|dogs|cat|cats|fox|foxes|wolf|wolves|dragon|dragons|horse|horses|griffin|griffins|animal|animals|pet|pets|creature|creatures|beast|beasts)";
const ACTION_EQUIVALENCE_GROUPS = [["smile", "smiling"]];
const FLIRTY_EXPRESSION_FALLBACK_TAG_PRIORITY = Object.freeze([
  "seductive_smile",
  "smirk",
]);
const NUMBER_WORD_TO_VALUE = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};
const SCENE_TAG_KEYWORDS = [
  "street",
  "road",
  "city",
  "park",
  "forest",
  "beach",
  "room",
  "bed",
  "bathroom",
  "kitchen",
  "classroom",
  "outside",
  "inside",
  "indoors",
  "outdoors",
];
const ROUTING_CATEGORY_TO_BLOCK = Object.freeze({
  body_parts: "character",
  traits: "character",
  face: "character",
  hair: "character",
  clothing: "character",
  accessories: "character",
  species: "character",
  mood: "character",
  nsfw_mood: "character",
  expression: "character",
  suggestive_body_parts: "character",
  nsfw_body_parts: "character",
  suggestive_clothing: "character",
  nsfw_clothing: "character",
  action: "actions",
  poses: "actions",
  suggestive_action: "actions",
  suggestive_pose: "actions",
  nsfw_action: "actions",
  nsfw_pose: "actions",
  interaction: "interaction",
  suggestive_interaction: "interaction",
  nsfw_interaction: "interaction",
  nsfw_position: "interaction",
  environment: "environment",
  scenario: "environment",
  lighting: "cameraLighting",
  camera: "cameraLighting",
  composition: "composition",
  time_of_day: "environment",
  vehicles: "props",
  animals: "character",
  props: "props",
  fluids: "global",
  nsfw_fluids: "global",
  nsfw_camera: "cameraLighting",
  nsfw_props: "props",
  exposure: "global",
  character_count: "global",
  aesthetics: "global",
  meta_quality: "global",
  meta_theme: "global",
  meta_time: "global",
  meta_world: "global",
  meta_content: "global",
});
const ROUTING_CATEGORY_PRIORITY = Object.freeze([
  "body_parts",
  "traits",
  "face",
  "hair",
  "clothing",
  "accessories",
  "species",
  "mood",
  "nsfw_mood",
  "expression",
  "suggestive_body_parts",
  "nsfw_body_parts",
  "suggestive_clothing",
  "nsfw_clothing",
  "action",
  "poses",
  "suggestive_action",
  "suggestive_pose",
  "nsfw_action",
  "nsfw_pose",
  "interaction",
  "suggestive_interaction",
  "nsfw_interaction",
  "nsfw_position",
  "environment",
  "scenario",
  "lighting",
  "camera",
  "composition",
  "time_of_day",
  "vehicles",
  "animals",
  "props",
  "fluids",
  "nsfw_fluids",
  "nsfw_camera",
  "nsfw_props",
  "exposure",
  "character_count",
  "aesthetics",
  "meta_quality",
  "meta_theme",
  "meta_time",
  "meta_world",
  "meta_content",
]);

const BASIC_COLORS = [
  "red",
  "blue",
  "black",
  "white",
  "green",
  "yellow",
  "pink",
  "purple",
  "orange",
  "brown",
  "gray",
  "grey",
];
const OPTIONAL_POSE_ADVERBS = Object.freeze(["slightly", "gently", "softly"]);
const VARIANT_OPTIONAL_ADVERB_SLOT = "{adverb?}";
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
const CONTROLLED_SOURCE_TEXT_NORMALIZATION_RULES = Object.freeze([
  [/\bred[\s-]?headed\b/gi, "red hair"],
  [/\bredhaired\b/gi, "red hair"],
  [/\bred[\s-]?haired\b/gi, "red hair"],
  [/\bblack[\s-]?haired\b/gi, "black hair"],
  [/\bblonde[\s-]?haired\b/gi, "blonde hair"],
  [/\bblond[\s-]?haired\b/gi, "blonde hair"],
  [/\bblue[\s-]?eyed\b/gi, "blue eyes"],
  [/\bgreen[\s-]?eyed\b/gi, "green eyes"],
  [/\bshort[\s-]?haired\b/gi, "short hair"],
  [/\blong[\s-]?haired\b/gi, "long hair"],
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
const CONTROLLED_INFLECTION_FORMS_BY_TOKEN = (() => {
  const map = new Map();
  for (const group of CONTROLLED_INFLECTION_GROUPS) {
    const forms = dedupePreserveOrder(group).map((token) => normalizePhrase(token));
    for (const token of forms) {
      if (!token) continue;
      map.set(token, forms);
    }
  }
  return map;
})();
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
const INTERVENING_TOLERANCE_TAG_ALLOWLIST = new Set([
  "spread_legs",
  "kissing_neck",
  "looking_back",
  "hands_on_own_hips",
  "crossed_legs",
]);
const CONTEXT_SUPPRESSION_WEAK_TAG_EXCLUSIONS = Object.freeze(
  new Set([
    ...BASIC_COLORS,
    "long",
    "short",
    "small",
    "large",
    "big",
    "medium",
    "tall",
    "slim",
    "skinny",
    "day",
    "night",
    "sunrise",
    "sunset",
    "twilight",
    "morning",
    "evening",
  ])
);
const DISAMBIGUATION_CONTEXT_BY_QUALIFIER = Object.freeze({
  chess: Object.freeze(["armor", "sword", "warrior", "weapon", "blade", "shield"]),
});
const CONTEXT_FRAGMENT_SUPPRESSIONS_BY_STEM = Object.freeze({
  cross: Object.freeze(["cross", "cross_(weapon)"]),
  hold: Object.freeze(["holding"]),
  trench: Object.freeze(["trench"]),
  pearl: Object.freeze(["pearl_(gemstone)"]),
  leg: Object.freeze(["leg", "legs"]),
  stomach: Object.freeze(["stomach", "stomach_(organ)"]),
  back: Object.freeze(["back", "over_shoulder"]),
  kiss: Object.freeze(["neck"]),
  wine: Object.freeze(["glass"]),
  living: Object.freeze(["room"]),
  fall: Object.freeze(["leaves"]),
  spread: Object.freeze(["leg", "legs"]),
  cover: Object.freeze(["cover"]),
  surround: Object.freeze(["surrounded"]),
  tail: Object.freeze(["tail"]),
});
const CONTEXT_SINGLETON_SUPPRESSIONS_BY_STEM = Object.freeze({
  bent: Object.freeze(["leg", "legs"]),
});
const CONTEXT_WEAK_TAG_CONTEXT_SUPPRESSIONS_BY_TAG = Object.freeze({
  bent: Object.freeze(["leg"]),
});
const STRONG_TAG_SUPPRESSION_RULES = Object.freeze([
  Object.freeze({
    strongPattern: /^holding_[a-z0-9_]+$/,
    weakTags: Object.freeze(["holding"]),
  }),
  Object.freeze({
    strongTags: Object.freeze(["pearl_earrings"]),
    weakTags: Object.freeze(["pearl_(gemstone)", "pearl"]),
  }),
  Object.freeze({
    strongTags: Object.freeze(["trench_coat"]),
    weakTags: Object.freeze(["trench"]),
  }),
  Object.freeze({
    strongTags: Object.freeze(["holding_sword"]),
    weakTags: Object.freeze(["holding"]),
  }),
  Object.freeze({
    strongTags: Object.freeze(["crossed_legs", "spread_legs"]),
    weakTags: Object.freeze(["legs", "leg"]),
  }),
  Object.freeze({
    strongTags: Object.freeze(["on_stomach"]),
    weakTags: Object.freeze(["stomach_(organ)", "stomach"]),
  }),
  Object.freeze({
    strongTags: Object.freeze(["living_room"]),
    weakTags: Object.freeze(["room"]),
  }),
  Object.freeze({
    strongTags: Object.freeze(["wine_glass"]),
    weakTags: Object.freeze(["glass"]),
  }),
  Object.freeze({
    strongTags: Object.freeze(["falling_leaves"]),
    weakTags: Object.freeze(["leaves", "leaf", "cover"]),
  }),
  Object.freeze({
    strongTags: Object.freeze(["kissing_neck"]),
    weakTags: Object.freeze(["neck"]),
  }),
  Object.freeze({
    strongTags: Object.freeze(["looking_back"]),
    weakTags: Object.freeze(["back", "over_shoulder"]),
  }),
]);
const CONTROLLED_WEAK_FRAGMENT_STEM_ALLOWLIST = new Set([
  "tail",
  "neck",
  "surround",
  "cover",
  "leg",
  "stomach",
  "glass",
  "room",
  "leave",
  "leav",
]);

const POSE_FALLBACK_TAGS = ["sunbathing", "perched"];
const ENVIRONMENT_FALLBACK_TAGS = ["jungle", "pond", "summer", "day"];

const HAIR_COLOR_MAP = {
  gray: "gray_hair",
  grey: "gray_hair",
  blonde: "blonde_hair",
  blond: "blonde_hair",
  black: "black_hair",
  brown: "brown_hair",
  red: "red_hair",
  white: "white_hair",
  silver: "silver_hair",
  pink: "pink_hair",
  blue: "blue_hair",
  green: "green_hair",
  purple: "purple_hair",
};

const HAIR_STYLE_MAP = {
  short: "short_hair",
  long: "long_hair",
  "very long": "very_long_hair",
  medium: "medium_hair",
  braided: "braid",
  curly: "curly_hair",
  wavy: "wavy_hair",
  straight: "straight_hair",
  messy: "messy_hair",
  spiky: "spiky_hair",
};

const SINGLE_TOKEN_HAIR_LENGTH_STYLE_MAP = Object.fromEntries(
  Object.entries(HAIR_STYLE_MAP).filter(([key]) => !key.includes(" "))
);
const TRAIT_ALIAS_OVERRIDES = new Map([
  ["big_ass", "large_ass"],
  ["big_breasts", "large_breasts"],
]);
const BODY_SIZE_TRAIT_RE = /^(small|medium|large|huge|gigantic|massive)_(breasts|ass)$/;
const BODY_SIZE_TRAIT_ALIAS_SET = new Set(
  Array.from(TRAIT_ALIAS_OVERRIDES.entries())
    .filter(([, target]) => {
      const lowerTarget = String(target || "").toLowerCase();
      return lowerTarget === "large_ass" || lowerTarget === "large_breasts";
    })
    .map(([source]) => String(source || "").toLowerCase())
);

const $ = (id) => document.getElementById(id);
const KNOWN_CHARACTER_TAG_SET = new Set();
const KNOWN_COLOR_TAG_SET = new Set();
const MAIN_TEXTAREA_ID = "mainText";
const PARSER_STATUS_ID = "parserStatus";
const INPUT_RECOMPUTE_DEBOUNCE_MS = 140;
const BACKGROUND_PREP_TASKS_PER_BATCH = 4;
const BACKGROUND_PREP_MIN_TIME_REMAINING_MS = 6;
const PHRASE_REGEX_CACHE_LIMIT = 4000;
const NORMALIZE_WITH_MAP_CACHE_LIMIT = 60;
const TEXT_TOKEN_SET_CACHE_LIMIT = 80;
const PER_PREPARED_TEXT_CACHE_LIMIT = 24;
const MATCHER_RESULT_CACHE_LIMIT = 24;

const PHRASE_BOUNDARY_REGEX_CACHE = new Map();
const NORMALIZE_WITH_MAP_CACHE = new Map();
const TEXT_TOKEN_SET_CACHE = new Map();
const EXTRACT_TAGS_CACHE_BY_PREPARED = new WeakMap();
const EXTRACT_RAW_SPANS_CACHE_BY_PREPARED = new WeakMap();
const EXTRACT_NORMALIZED_SPANS_CACHE_BY_PREPARED = new WeakMap();
const MATCHER_TAG_CACHE_BY_MATCHER = new WeakMap();

function memoizeMapValue(map, key, factory, maxEntries) {
  if (map.has(key)) {
    const value = map.get(key);
    map.delete(key);
    map.set(key, value);
    return value;
  }
  const value = factory();
  map.set(key, value);
  if (map.size > maxEntries) {
    const oldestKey = map.keys().next().value;
    map.delete(oldestKey);
  }
  return value;
}

function getOrCreateWeakMemoBucket(weakMap, keyObj) {
  let bucket = weakMap.get(keyObj);
  if (bucket) return bucket;
  bucket = new Map();
  weakMap.set(keyObj, bucket);
  return bucket;
}

function memoizeByPreparedEntriesAndText(
  weakMap,
  preparedEntries,
  text,
  factory,
  maxEntries = PER_PREPARED_TEXT_CACHE_LIMIT
) {
  if (!Array.isArray(preparedEntries)) return factory();
  const bucket = getOrCreateWeakMemoBucket(weakMap, preparedEntries);
  return memoizeMapValue(bucket, text, factory, maxEntries);
}

function hasAllTokens(textTokenSet, requiredTokens) {
  if (!(textTokenSet instanceof Set)) return false;
  const required = Array.isArray(requiredTokens) ? requiredTokens : [];
  if (!required.length) return true;
  for (const token of required) {
    if (!textTokenSet.has(token)) return false;
  }
  return true;
}

function buildTokenSetFromLowerText(lowerText) {
  const key = String(lowerText || "");
  if (!key) return new Set();
  return memoizeMapValue(
    TEXT_TOKEN_SET_CACHE,
    key,
    () => {
      const normalized = normalizeLooseText(key);
      if (!normalized) return new Set();
      return new Set(normalized.split(" ").filter(Boolean));
    },
    TEXT_TOKEN_SET_CACHE_LIMIT
  );
}

function debounce(fn, waitMs) {
  let timerId = null;
  const wrapped = (...args) => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, waitMs);
  };
  wrapped.cancel = () => {
    if (timerId === null) return;
    clearTimeout(timerId);
    timerId = null;
  };
  return wrapped;
}

function cancelIdleTask(handle) {
  if (!handle || typeof handle !== "object") return;
  if (handle.kind === "idle") {
    if (typeof window !== "undefined" && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(handle.id);
    }
    return;
  }
  clearTimeout(handle.id);
}

function readMainTextareaValue() {
  const el = $(MAIN_TEXTAREA_ID);
  if (!(el instanceof HTMLTextAreaElement)) return "";
  return String(el.value || "");
}

function looksLikeCharacterTag(tag) {
  const lower = String(tag || "").toLowerCase().trim();
  if (!lower) return false;
  return KNOWN_CHARACTER_TAG_SET.has(lower);
}

function dedupePreserveOrder(items) {
  const seen = new Set();
  const out = [];
  for (const item of items || []) {
    const value = String(item || "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function normalizeTagForOutput(tagRaw) {
  return String(tagRaw || "").trim().toLowerCase();
}

function normalizeTagListForOutput(tags) {
  return dedupePreserveOrder(
    (Array.isArray(tags) ? tags : [])
      .map((tag) => normalizeTagForOutput(tag))
      .filter(Boolean)
  );
}

function canonicalizeTraitAliasTags(tags) {
  const remapped = [];
  for (const tag of tags || []) {
    const raw = String(tag || "").trim();
    if (!raw) continue;
    const mapped = TRAIT_ALIAS_OVERRIDES.get(raw.toLowerCase()) || raw;
    remapped.push(mapped);
  }
  return dedupePreserveOrder(remapped);
}

function addTraitAliasHintsFromText(tags, rawText) {
  const out = [...(tags || [])];
  const normalized = normalizeForContains(rawText);
  if (containsNormalizedPhrase(normalized, "big ass")) {
    out.push("large_ass");
  }
  if (containsNormalizedPhrase(normalized, "big breasts")) {
    out.push("large_breasts");
  }
  return canonicalizeTraitAliasTags(out);
}

function resolveExpressionFallbackTagsFromText(
  userText,
  existingExpressionTags = [],
  expressionCatalogSet = new Set()
) {
  const normalized = normalizeForContains(userText);
  const hasFlirtyCue =
    containsNormalizedPhrase(normalized, "flirty expression") ||
    containsNormalizedPhrase(normalized, "flirty look") ||
    containsNormalizedPhrase(normalized, "flirty smile") ||
    containsNormalizedPhrase(normalized, "flirty");
  if (!hasFlirtyCue) return [];

  const existingTagSet = buildTagSet(existingExpressionTags || []);
  for (const preferredTagRaw of FLIRTY_EXPRESSION_FALLBACK_TAG_PRIORITY) {
    const preferredTag = String(preferredTagRaw || "").toLowerCase();
    if (preferredTag && existingTagSet.has(preferredTag)) return [];
  }

  const catalogSet = expressionCatalogSet instanceof Set ? expressionCatalogSet : new Set();
  for (const preferredTagRaw of FLIRTY_EXPRESSION_FALLBACK_TAG_PRIORITY) {
    const preferredTag = String(preferredTagRaw || "").toLowerCase();
    if (!preferredTag) continue;
    if (!catalogSet.has(preferredTag)) continue;
    return [preferredTag];
  }

  return [];
}

function isBodySizeTraitTag(tag) {
  const lower = String(tag || "").trim().toLowerCase();
  if (!lower) return false;
  if (BODY_SIZE_TRAIT_RE.test(lower)) return true;
  if (lower === "big_ass" || lower === "big_breasts") return true;
  if (BODY_SIZE_TRAIT_ALIAS_SET.has(lower)) return true;

  const mapped = String(TRAIT_ALIAS_OVERRIDES.get(lower) || "").toLowerCase();
  if (!mapped) return false;
  if (mapped === "large_ass" || mapped === "large_breasts") return true;
  return BODY_SIZE_TRAIT_RE.test(mapped);
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

function foldTextForMatchingPreserveLength(text) {
  const source = String(text || "");
  if (!source) return "";
  let out = "";
  for (let i = 0; i < source.length; i += 1) {
    out += foldCharForMatching(source[i]);
  }
  return out;
}

function applyControlledSourceTextNormalization(text) {
  let out = String(text || "");
  if (!out) return out;
  for (const [pattern, replacement] of CONTROLLED_SOURCE_TEXT_NORMALIZATION_RULES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function normalizeLooseText(text) {
  const normalizedSource = applyControlledSourceTextNormalization(String(text || ""));
  return stripCombiningMarks(normalizedSource)
    .replace(/['\u2019]s\b/gi, "")
    .replace(/[^\w\s]+/g, " ")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhrase(phrase) {
  return normalizeLooseText(phrase);
}

function normalizeForContains(text) {
  const norm = normalizeLooseText(text);
  return ` ${norm} `;
}

function normalizeForMatchingWithMap(text) {
  const source = String(text || "");
  if (!source) {
    return {
      normalized: "",
      normToRaw: [],
    };
  }
  const cached = NORMALIZE_WITH_MAP_CACHE.get(source);
  if (cached) {
    return cached;
  }

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

  const result = {
    normalized: chars.join(""),
    normToRaw,
  };
  memoizeMapValue(
    NORMALIZE_WITH_MAP_CACHE,
    source,
    () => result,
    NORMALIZE_WITH_MAP_CACHE_LIMIT
  );
  return result;
}

function tokenizeNormalizedPhrase(phraseNorm) {
  return String(phraseNorm || "")
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function tokenizeTagForPhraseMatching(tag) {
  return tokenizeNormalizedPhrase(normalizePhrase(String(tag || "").replace(/_/g, " ")));
}

function isStrictTokenSubphraseLocal(phraseTokens, tagTokens) {
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

function buildPhraseBoundaryRegexFromTokens(phraseTokens, options = {}) {
  const tokens = Array.isArray(phraseTokens)
    ? phraseTokens.map((token) => String(token || "").trim()).filter(Boolean)
    : [];
  if (!tokens.length) return null;
  const allowInterveningWords = Boolean(options?.allowInterveningWords);

  const cacheKey = `${allowInterveningWords ? "1" : "0"}\u001e${tokens.join("\u001f")}`;
  const cached = PHRASE_BOUNDARY_REGEX_CACHE.get(cacheKey);
  if (cached) return cached;

  let core = "";
  if (tokens.length === 1) {
    core = escapeRegexLiteral(tokens[0]);
  } else {
    const separator = "(?:\\s+|_|-)";
    if (!allowInterveningWords) {
      core = tokens.map((token) => escapeRegexLiteral(token)).join(separator);
    } else {
      const ignoredWordAlternation = CONTROLLED_INTERVENING_WORDS.map((word) =>
        escapeRegexLiteral(word)
      ).join("|");
      const betweenTokens = `${separator}(?:(?:${ignoredWordAlternation})${separator})*`;
      core = tokens.map((token) => escapeRegexLiteral(token)).join(betweenTokens);
    }
  }
  const regex = new RegExp(`(^|[^a-z0-9_])(${core})(?=$|[^a-z0-9_])`, "g");
  return memoizeMapValue(
    PHRASE_BOUNDARY_REGEX_CACHE,
    cacheKey,
    () => regex,
    PHRASE_REGEX_CACHE_LIMIT
  );
}

function findPhraseMatchesInLowerText(lowerText, phraseTokens, options = {}) {
  const text = foldTextForMatchingPreserveLength(String(lowerText || ""));
  if (!text) return [];

  const regex = buildPhraseBoundaryRegexFromTokens(phraseTokens, options);
  if (!regex) return [];
  regex.lastIndex = 0;

  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const leftBoundary = String(match[1] || "");
    const core = String(match[2] || "");
    if (!core) {
      if (match.index === regex.lastIndex) regex.lastIndex += 1;
      continue;
    }

    const start = match.index + leftBoundary.length;
    const end = start + core.length;
    if (end > start) {
      matches.push({ start, end });
    }
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }

  return matches;
}

function findPhraseMatchesWithBoundaries(rawText, phraseTokens) {
  return findPhraseMatchesInLowerText(String(rawText || "").toLowerCase(), phraseTokens);
}

function containsNormalizedPhrase(normalizedPaddedText, phrase) {
  const phraseNorm = normalizePhrase(phrase);
  if (!phraseNorm) return false;
  return normalizedPaddedText.includes(` ${phraseNorm} `);
}

function unionByTag(arr1, arr2) {
  const map = new Map();
  for (const item of [...(arr1 || []), ...(arr2 || [])]) {
    if (!item?.tag) continue;
    map.set(String(item.tag).toLowerCase(), item);
  }
  return Array.from(map.values());
}

function normalizePhraseTagItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((entry) => {
      if (typeof entry === "string") {
        const tag = String(entry).trim();
        if (!tag) return null;
        return {
          phrase: tag.replace(/_/g, " "),
          tag,
        };
      }

      const tag = String(entry?.tag || "").trim();
      if (!tag) return null;
      return {
        phrase: String(entry?.phrase || "").trim() || tag.replace(/_/g, " "),
        tag,
      };
    })
    .filter(Boolean);
}

function getPackItems(data, keys) {
  for (const key of keys || []) {
    if (Array.isArray(data?.[key])) {
      return normalizePhraseTagItems(data[key]);
    }
  }
  return [];
}

function getPackItemsFromKnownKeys(data) {
  return getPackItems(data, [
    "items",
    "tags",
    "actions",
    "scenes",
    "poses",
    "moods",
    "expressions",
    "environments",
    "props",
    "composition",
    "compositions",
    "traits",
    "characters",
    "interactions",
    "colors",
    "clothing",
  ]);
}

function splitVariantPatternTokens(patternRaw) {
  return String(patternRaw || "")
    .trim()
    .split(/\s+/)
    .map((token) => String(token || "").trim())
    .filter(Boolean);
}

function expandVariantPhrasePattern(patternRaw, optionalAdverbs) {
  const patternTokens = splitVariantPatternTokens(patternRaw);
  if (!patternTokens.length) return [];

  const adverbs = dedupePreserveOrder(
    (Array.isArray(optionalAdverbs) ? optionalAdverbs : [])
      .map((word) => normalizePhrase(word))
      .filter(Boolean)
  );
  let states = [""];

  for (const token of patternTokens) {
    if (token.toLowerCase() === VARIANT_OPTIONAL_ADVERB_SLOT) {
      const expanded = [];
      for (const state of states) {
        expanded.push(state);
        for (const adverb of adverbs) {
          expanded.push(state ? `${state} ${adverb}` : adverb);
        }
      }
      states = expanded;
      continue;
    }

    states = states.map((state) => (state ? `${state} ${token}` : token));
  }

  return dedupePreserveOrder(
    states
      .map((phrase) => String(phrase || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
  );
}

function collectVariantDefPhrases(variantDef) {
  const explicitPhrases = Array.isArray(variantDef?.phrases) ? variantDef.phrases : [];
  const phrasePatterns = Array.isArray(variantDef?.phrasePatterns) ? variantDef.phrasePatterns : [];
  if (!phrasePatterns.length) return explicitPhrases;

  const optionalAdverbs = Array.isArray(variantDef?.optionalAdverbs)
    ? variantDef.optionalAdverbs
    : OPTIONAL_POSE_ADVERBS;
  const expandedPatterns = [];
  for (const pattern of phrasePatterns) {
    expandedPatterns.push(...expandVariantPhrasePattern(pattern, optionalAdverbs));
  }
  return dedupePreserveOrder([...explicitPhrases, ...expandedPatterns]);
}

function appendPhraseVariants(items, variantDefs) {
  const normalizedItems = normalizePhraseTagItems(items);
  if (!normalizedItems.length) return normalizedItems;

  const canonicalTagByLower = new Map();
  const seen = new Set();
  for (const item of normalizedItems) {
    const tag = String(item?.tag || "").trim();
    const phrase = String(item?.phrase || "").trim();
    const tagLower = tag.toLowerCase();
    if (!tag || !phrase || !tagLower) continue;
    if (!canonicalTagByLower.has(tagLower)) canonicalTagByLower.set(tagLower, tag);
    seen.add(`${normalizePhrase(phrase)}::${tagLower}`);
  }

  const out = [...normalizedItems];
  for (const variantDef of Array.isArray(variantDefs) ? variantDefs : []) {
    const targetTagLower = String(variantDef?.tag || "").trim().toLowerCase();
    if (!targetTagLower || !canonicalTagByLower.has(targetTagLower)) continue;
    const canonicalTag = String(canonicalTagByLower.get(targetTagLower) || "").trim();
    if (!canonicalTag) continue;

    for (const phraseRaw of collectVariantDefPhrases(variantDef)) {
      const phrase = String(phraseRaw || "").trim();
      const phraseNorm = normalizePhrase(phrase);
      if (!phrase || !phraseNorm) continue;

      const key = `${phraseNorm}::${targetTagLower}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ phrase, tag: canonicalTag });
    }
  }

  return out;
}

function tagToUiLabel(tag) {
  return String(tag || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toUiOptionItemsFromPackItems(items) {
  const byId = new Map();
  for (const item of normalizePhraseTagItems(items)) {
    const tag = String(item?.tag || "").trim();
    if (!tag) continue;
    if (byId.has(tag)) continue;
    const phrase = String(item?.phrase || "").trim();
    byId.set(tag, {
      id: tag,
      label: phrase || tagToUiLabel(tag),
      tags: [tag],
    });
  }
  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
}

const CURATED_COMPOSITION_TOGGLE_DEFS = [
  { tag: "simple_background", label: "Simple background" },
  { tag: "detailed_background", label: "Detailed background" },
  { tag: "transparent_background", label: "Transparent background" },
  { tag: "symmetry", label: "Symmetry" },
  { tag: "rotational_symmetry", label: "Rotational symmetry" },
  { tag: "split_screen", label: "Split screen" },
  { tag: "perspective", label: "Perspective" },
  { tag: "vanishing_point", label: "Vanishing point" },
  { tag: "size_comparison", label: "Size comparison" },
  { tag: "turnaround", label: "Turnaround" },
  { tag: "rule_of_thirds", label: "Rule of thirds" },
  { tag: "foreground_framing", label: "Foreground framing" },
];

const COMPOSITION_BACKGROUND_EXCLUSIVE_TAGS = Object.freeze([
  "simple_background",
  "detailed_background",
  "transparent_background",
]);

const CURATED_CAMERA_FRAMING_DEFS = [
  { tags: ["close"], label: "close shot" },
  { tags: ["close_up", "close-up"], label: "close-up" },
  { tags: ["headshot"], label: "headshot" },
  { tags: ["upper_body"], label: "upper body" },
  { tags: ["full_body"], label: "full body" },
  { tags: ["cowboy_shot"], label: "cowboy shot" },
  { tags: ["wide_shot"], label: "wide shot" },
  { tags: ["very_wide_shot"], label: "very wide shot" },
  { tags: ["distant"], label: "distant shot" },
  { tags: ["panoramic"], label: "panoramic" },
  { tags: ["depth_of_field"], label: "depth of field" },
  { tags: ["eyes_out_of_frame"], label: "eyes out of frame" },
  { tags: ["feet_out_of_frame"], label: "feet out of frame" },
];

const CURATED_CAMERA_ANGLE_DEFS = [
  { tags: ["eye_level"], label: "eye level" },
  { tags: ["high_angle"], label: "high angle" },
  { tags: ["low_angle"], label: "low angle" },
  { tags: ["from_above"], label: "from above" },
  { tags: ["from_below"], label: "from below" },
  { tags: ["from_behind"], label: "from behind" },
  { tags: ["profile"], label: "profile" },
  { tags: ["overhead"], label: "overhead" },
  { tags: ["bird's_eye", "birds_eye", "birds-eye", "bird's eye"], label: "bird's eye" },
  { tags: ["aerial"], label: "aerial" },
  { tags: ["ground_level"], label: "ground level" },
  { tags: ["dutch_angle"], label: "dutch angle" },
  { tags: ["isometric"], label: "isometric" },
  { tags: ["fisheye"], label: "fisheye" },
  { tags: ["fish_eye", "fish-eye", "fish eye"], label: "fish eye" },
  { tags: ["under_shot"], label: "under shot" },
];

const CURATED_LIGHTING_DEFS = [
  { tag: "ambient_soft_glow", label: "ambient soft glow" },
  { tag: "backlighting", label: "backlighting" },
  { tag: "bioluminescence", label: "bioluminescence" },
  { tag: "candlelight", label: "candlelight" },
  { tag: "caustics", label: "caustics" },
  { tag: "dappled_sunlight", label: "dappled sunlight" },
  { tag: "darkness", label: "darkness" },
  { tag: "diffused_sunset_hue", label: "diffused sunset hue" },
  { tag: "dim_lighting", label: "dim lighting" },
  { tag: "fluorescent_lamp", label: "fluorescent lamp" },
  { tag: "heavy_lens_flare", label: "heavy lens flare" },
  { tag: "light_rays", label: "light rays" },
  { tag: "luminous_glow", label: "luminous glow" },
  { tag: "moonlight", label: "moonlight" },
  { tag: "neon_lights", label: "neon lights" },
  { tag: "night_light", label: "night light" },
  { tag: "overcast", label: "overcast" },
  { tag: "refraction", label: "refraction" },
  { tag: "ring_light", label: "ring light" },
  { tag: "screen_light", label: "screen light" },
  { tag: "sidelighting", label: "sidelighting" },
  { tag: "spotlight", label: "spotlight" },
  { tag: "stage_lights", label: "stage lights" },
  { tag: "sun_glare", label: "sun glare" },
  { tag: "sunlight", label: "sunlight" },
  { tag: "underlighting", label: "underlighting" },
  { tag: "vignetting", label: "vignetting" },
  { tag: "window_light", label: "window light" },
];

const CURATED_TIME_OF_DAY_DEFS = [
  { tag: "sunrise", label: "at sunrise" },
  { tag: "day", label: "at day" },
  { tag: "evening", label: "at evening" },
  { tag: "sunset", label: "at sunset" },
  { tag: "twilight", label: "at twilight" },
  { tag: "night", label: "at night" },
];

const HAIR_PHRASE_VARIANTS = Object.freeze([
  { tag: "blonde_hair", phrases: ["blonde", "the blonde", "one blonde"] },
  { tag: "brown_hair", phrases: ["brunette", "the brunette", "one brunette"] },
  { tag: "red_hair", phrases: ["redhead", "the redhead", "one redhead"] },
  { tag: "braid", phrases: ["braided hair"] },
]);

const TRAIT_PHRASE_VARIANTS = Object.freeze([
  { tag: "skinny", phrases: ["slim", "slim woman", "slim girl", "slim figure"] },
  {
    tag: "tall_female",
    phrases: ["tall woman", "tall girl", "tall female", "tall slim woman", "tall skinny woman"],
  },
  { tag: "tall_male", phrases: ["tall man", "tall boy", "tall male"] },
]);

const TRAIT_EXTERNAL_PHRASE_ITEMS = Object.freeze([
  { phrase: "blue eyes", tag: "blue_eyes" },
  { phrase: "with blue eyes", tag: "blue_eyes" },
  { phrase: "green eyes", tag: "green_eyes" },
  { phrase: "with green eyes", tag: "green_eyes" },
]);

const ACTION_PHRASE_VARIANTS = Object.freeze([
  { tag: "sleeping", phrases: ["sleeps", "sleeping beside", "sleeps beside"] },
  { tag: "leaning", phrases: ["leans", "leans on", "leaning on"] },
  {
    tag: "looking_back",
    phrases: [
      "looking back over shoulder",
      "looking back over her shoulder",
      "looking back over his shoulder",
      "looking back over their shoulder",
    ],
  },
]);

const INTERACTION_PHRASE_VARIANTS = Object.freeze([
  {
    tag: "holding_hands",
    phrases: [
      "holds her hand",
      "holding her hand",
      "holds his hand",
      "holding his hand",
      "holds their hand",
      "holding their hand",
      "holds hand",
      "holding hand",
    ],
  },
  {
    tag: "hug",
    phrases: ["embracing", "hugging", "is embracing", "is hugging"],
  },
]);

const SCENE_PHRASE_VARIANTS = Object.freeze([
  { tag: "Cafe", phrases: ["cafe"] },
  { tag: "mountain", phrases: ["mountains", "with mountains"] },
  { tag: "flower_field", phrases: ["wildflowers", "with wildflowers"] },
]);

const POSE_PHRASE_VARIANTS = Object.freeze([
  { tag: "standing", phrases: ["standing"] },
  { tag: "crossed_legs", phrases: ["cross-legged", "cross legged", "legs crossed"] },
  {
    tag: "on_stomach",
    phrases: [
      "lying on stomach",
      "lying on her stomach",
      "lying on his stomach",
      "lying on their stomach",
    ],
  },
  {
    tag: "hands_on_own_hips",
    phrases: ["hands on hips", "hands on her hips", "hands on his hips", "hands on their hips"],
  },
  {
    tag: "spread_legs",
    phrasePatterns: ["legs {adverb?} spread", "with legs {adverb?} spread"],
    optionalAdverbs: OPTIONAL_POSE_ADVERBS,
  },
]);

const ENVIRONMENT_PHRASE_VARIANTS = Object.freeze([
  { tag: "palm_tree", phrases: ["palm trees", "with palm trees"] },
  { tag: "mountain", phrases: ["mountains", "with mountains"] },
]);

const CLOTHING_EXTERNAL_PHRASE_ITEMS = Object.freeze([
  { phrase: "lingerie", tag: "lingerie" },
  { phrase: "wearing lingerie", tag: "lingerie" },
  { phrase: "lace lingerie", tag: "lingerie" },
  { phrase: "wearing lace lingerie", tag: "lingerie" },
]);

const PROPS_PHRASE_VARIANTS = Object.freeze([
  {
    tag: "wine_glass",
    phrases: ["glass of wine", "holding a glass of wine", "holding glass of wine"],
  },
  { tag: "statue", phrases: ["statues", "broken statue", "broken statues"] },
  { tag: "book", phrases: ["books", "a stack of books", "with books"] },
]);

const PROPS_EXTERNAL_PHRASE_ITEMS = Object.freeze([
  { phrase: "dog", tag: "dog" },
  { phrase: "small dog", tag: "dog" },
  { phrase: "with dog", tag: "dog" },
]);

const AESTHETICS_GLOBAL_TAG_ALLOWLIST = Object.freeze(
  new Set(["smoke", "black_smoke", "colored_smoke", "smoke_trail", "smoke_ring"])
);

const TIME_OF_DAY_LIGHTING_ASSIST_TAGS = Object.freeze({
  sunrise: ["dappled_sunlight", "sunlight", "diffused_sunset_hue"],
  day: ["sunlight", "dappled_sunlight", "overcast"],
  evening: ["dim_lighting", "diffused_sunset_hue", "sunlight"],
  sunset: ["diffused_sunset_hue", "sunlight", "dim_lighting"],
  twilight: ["dim_lighting", "darkness", "moonlight"],
  night: ["night_light", "darkness", "moonlight"],
});

const CURATED_PRESET_DEFS = [
  { id: "pony_default", label: "Default", positive_tags: [], negative_tags: [] },
  {
    id: "preset_photorealistic",
    label: "Photorealistic",
    positive_tags: ["photorealistic", "realistic"],
    negative_tags: [],
  },
  {
    id: "preset_anime_cel",
    label: "Anime",
    positive_tags: ["lineart", "cel_rendering"],
    negative_tags: [],
  },
  {
    id: "preset_cartoon",
    label: "Cartoon",
    positive_tags: ["cartoonized", "toon_(style)"],
    negative_tags: [],
  },
  {
    id: "preset_painterly",
    label: "Painterly",
    positive_tags: ["painterly", "watercolor_effect"],
    negative_tags: [],
  },
  {
    id: "preset_cinematic",
    label: "Cinematic",
    positive_tags: ["realistic", "bokeh"],
    negative_tags: [],
  },
];

const CURATED_STYLE_MODIFIER_DEFS = [
  { id: "mod_painterly", label: "Painterly", positive_tags: ["painterly"] },
  { id: "mod_watercolor", label: "Watercolor", positive_tags: ["watercolor_effect"] },
  { id: "mod_lineart", label: "Lineart", positive_tags: ["lineart"] },
  { id: "mod_cel", label: "Cel rendering", positive_tags: ["cel_rendering"] },
  { id: "mod_chibi", label: "Chibi", positive_tags: ["chibi"] },
  { id: "mod_pixel", label: "Pixel art", positive_tags: ["pixel_art"] },
  { id: "mod_retro", label: "Retro", positive_tags: ["retro_artstyle"] },
  { id: "mod_cyberpunk", label: "Cyberpunk", positive_tags: ["cyberpunk"] },
  { id: "mod_vaporwave", label: "Vaporwave", positive_tags: ["vaporwave"] },
  { id: "mod_low_poly", label: "Low poly", positive_tags: ["low_poly"] },
];

const PRESET_STYLE_COMPATIBILITY_ALLOWED_TAGS = Object.freeze({
  pony_default: null,
  preset_photorealistic: [
    "painterly",
    "watercolor_effect",
    "cyberpunk",
    "vaporwave",
    "neon",
    "neon_palette",
    "concept_art",
    "oil_painting",
  ],
  preset_anime_cel: [
    "cel_rendering",
    "chibi",
    "lineart",
    "watercolor_effect",
    "cyberpunk",
    "vaporwave",
    "sketch",
    "comic",
    "concept_art",
    "painterly",
    "retro_artstyle",
    "pixel_art",
    "low_poly",
  ],
  preset_cartoon: [
    "cel_rendering",
    "chibi",
    "lineart",
    "retro_artstyle",
    "pixel_art",
    "sketch",
    "comic",
    "low_poly",
  ],
  preset_painterly: [
    "painterly",
    "watercolor_effect",
    "lineart",
    "concept_art",
    "oil_painting",
    "sketch",
  ],
  preset_cinematic: [
    "painterly",
    "watercolor_effect",
    "cyberpunk",
    "vaporwave",
    "neon",
    "neon_palette",
    "concept_art",
  ],
});

function mapPackTagsByLower(data, keys = ["items", "tags"]) {
  const map = new Map();
  const items = getPackItems(data, keys);
  for (const item of items) {
    const tag = String(item?.tag || "").trim();
    if (!tag) continue;
    const lower = tag.toLowerCase();
    if (map.has(lower)) continue;
    map.set(lower, tag);
  }
  return map;
}

function mergeTagMaps(...maps) {
  const merged = new Map();
  for (const map of maps) {
    for (const [lower, tag] of map || []) {
      if (merged.has(lower)) continue;
      merged.set(lower, tag);
    }
  }
  return merged;
}

function resolveAvailableTags(tagMap, requestedTags) {
  return dedupePreserveOrder(
    (Array.isArray(requestedTags) ? requestedTags : [])
      .map((tag) => {
        const key = String(tag || "").trim().toLowerCase();
        if (!key) return "";
        return String(tagMap.get(key) || "");
      })
      .filter(Boolean)
  );
}

function normalizePresetUiItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const id = String(item?.id || "").trim();
      if (!id) return null;
      return {
        id,
        label: String(item?.label || "").trim() || tagToUiLabel(id),
        positive_tags: Array.isArray(item?.positive_tags)
          ? dedupePreserveOrder(item.positive_tags)
          : [],
        negative_tags: Array.isArray(item?.negative_tags)
          ? dedupePreserveOrder(item.negative_tags)
          : [],
      };
    })
    .filter(Boolean);
}

function normalizeModifierUiItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const id = String(item?.id || "").trim();
      if (!id) return null;
      return {
        id,
        label: String(item?.label || "").trim() || tagToUiLabel(id),
        positive_tags: Array.isArray(item?.positive_tags)
          ? dedupePreserveOrder(item.positive_tags)
          : [],
        negative_tags: Array.isArray(item?.negative_tags)
          ? dedupePreserveOrder(item.negative_tags)
          : [],
      };
    })
    .filter(Boolean);
}

function buildCuratedCompositionToggles(compositionItems) {
  const byLowerTag = new Map();
  for (const item of normalizePhraseTagItems(compositionItems)) {
    const tag = String(item?.tag || "").trim();
    if (!tag) continue;
    const lower = tag.toLowerCase();
    if (byLowerTag.has(lower)) continue;
    byLowerTag.set(lower, tag);
  }

  const curated = [];
  for (const def of CURATED_COMPOSITION_TOGGLE_DEFS) {
    const tag = String(byLowerTag.get(String(def.tag).toLowerCase()) || "").trim();
    if (!tag) continue;
    curated.push({
      id: tag,
      label: String(def.label || "").trim() || tagToUiLabel(tag),
      tags: [tag],
    });
  }

  if (curated.length) return curated;

  const blockedToggleRe =
    /\b(ass|armpit|breast|crotch|cum|dick|penis|vagina|nipple|pubic|sex|nude|nsfw)\b/i;
  return toUiOptionItemsFromPackItems(compositionItems)
    .filter((item) => !blockedToggleRe.test(String(item?.id || "")))
    .slice(0, 12);
}

function buildCuratedCameraFramingOptions(framingItems) {
  const byLowerTag = new Map();
  for (const item of normalizePhraseTagItems(framingItems)) {
    const tag = String(item?.tag || "").trim();
    if (!tag) continue;
    const lower = tag.toLowerCase();
    if (byLowerTag.has(lower)) continue;
    byLowerTag.set(lower, tag);
  }

  const curated = [];
  for (const def of CURATED_CAMERA_FRAMING_DEFS) {
    const candidateTags = Array.isArray(def?.tags) ? def.tags : [];
    let resolvedTag = "";
    for (const candidate of candidateTags) {
      const found = String(byLowerTag.get(String(candidate || "").toLowerCase()) || "").trim();
      if (!found) continue;
      resolvedTag = found;
      break;
    }
    if (!resolvedTag) continue;

    curated.push({
      id: resolvedTag,
      label: String(def.label || "").trim() || tagToUiLabel(resolvedTag),
      tags: [resolvedTag],
    });
  }

  if (curated.length) return curated;
  return toUiOptionItemsFromPackItems(framingItems);
}

function buildCuratedCameraAngleOptions(cameraItems) {
  const byLowerTag = new Map();
  for (const item of normalizePhraseTagItems(cameraItems)) {
    const tag = String(item?.tag || "").trim();
    if (!tag) continue;
    const lower = tag.toLowerCase();
    if (byLowerTag.has(lower)) continue;
    byLowerTag.set(lower, tag);
  }

  const curated = [];
  for (const def of CURATED_CAMERA_ANGLE_DEFS) {
    const candidateTags = Array.isArray(def?.tags) ? def.tags : [];
    let resolvedTag = "";
    for (const candidate of candidateTags) {
      const found = String(byLowerTag.get(String(candidate || "").toLowerCase()) || "").trim();
      if (!found) continue;
      resolvedTag = found;
      break;
    }
    if (!resolvedTag) continue;
    curated.push({
      id: resolvedTag,
      label: String(def.label || "").trim() || tagToUiLabel(resolvedTag),
      tags: [resolvedTag],
    });
  }

  if (curated.length) return curated;
  return toUiOptionItemsFromPackItems(cameraItems);
}

function buildCuratedLightingOptions(lightingItems) {
  const byLowerTag = new Map();
  for (const item of normalizePhraseTagItems(lightingItems)) {
    const tag = String(item?.tag || "").trim();
    if (!tag) continue;
    const lower = tag.toLowerCase();
    if (byLowerTag.has(lower)) continue;
    byLowerTag.set(lower, tag);
  }

  const curated = [];
  for (const def of CURATED_LIGHTING_DEFS) {
    const resolvedTag = String(byLowerTag.get(String(def.tag).toLowerCase()) || "").trim();
    if (!resolvedTag) continue;
    curated.push({
      id: resolvedTag,
      label: String(def.label || "").trim() || tagToUiLabel(resolvedTag),
      tags: [resolvedTag],
    });
  }

  if (curated.length) return curated;
  return toUiOptionItemsFromPackItems(lightingItems);
}

function buildCuratedTimeOfDayOptions(timeItems) {
  const byLowerTag = new Map();
  for (const item of normalizePhraseTagItems(timeItems)) {
    const tag = String(item?.tag || "").trim();
    if (!tag) continue;
    const lower = tag.toLowerCase();
    if (byLowerTag.has(lower)) continue;
    byLowerTag.set(lower, tag);
  }

  const curated = [];
  for (const def of CURATED_TIME_OF_DAY_DEFS) {
    const resolvedTag = String(byLowerTag.get(String(def.tag).toLowerCase()) || "").trim();
    if (!resolvedTag) continue;
    curated.push({
      id: resolvedTag,
      label: String(def.label || "").trim() || tagToUiLabel(resolvedTag),
      tags: [resolvedTag],
    });
  }

  if (curated.length) return curated;
  return toUiOptionItemsFromPackItems(timeItems);
}

function normalizeCameraPackData(cameraData, compositionData = null) {
  const hasLegacyShape =
    Array.isArray(cameraData?.framing) ||
    Array.isArray(cameraData?.angle) ||
    Array.isArray(cameraData?.composition_toggles);
  if (hasLegacyShape) {
    return {
      framing: Array.isArray(cameraData?.framing) ? cameraData.framing : [],
      angle: Array.isArray(cameraData?.angle) ? cameraData.angle : [],
      composition_toggles: Array.isArray(cameraData?.composition_toggles)
        ? cameraData.composition_toggles
        : [],
    };
  }

  const cameraItems = getPackItems(cameraData, ["items", "camera", "tags"]);
  const compositionItems = getPackItems(compositionData, [
    "items",
    "composition",
    "compositions",
  ]);

  const angleHintRe =
    /\b(angle|from_(above|below|side|behind)|profile|three[-_ ]quarter|dutch|overhead|bird'?s[-_ ]eye|worm'?s[-_ ]eye)\b/i;
  const angleItems = [];
  const framingItems = [];
  for (const item of cameraItems) {
    const phrase = String(item?.phrase || "");
    const tag = String(item?.tag || "");
    if (angleHintRe.test(phrase) || angleHintRe.test(tag)) {
      angleItems.push(item);
    } else {
      framingItems.push(item);
    }
  }

  const resolvedFraming = framingItems.length ? framingItems : cameraItems;
  return {
    framing: buildCuratedCameraFramingOptions(resolvedFraming),
    angle: buildCuratedCameraAngleOptions(cameraItems),
    composition_toggles: buildCuratedCompositionToggles(compositionItems),
  };
}

function normalizeLightingPackData(lightingData, timeOfDayData = null) {
  const hasLegacyShape =
    Array.isArray(lightingData?.lighting) || Array.isArray(lightingData?.time_of_day);
  if (hasLegacyShape) {
    return {
      lighting: Array.isArray(lightingData?.lighting) ? lightingData.lighting : [],
      time_of_day: Array.isArray(lightingData?.time_of_day) ? lightingData.time_of_day : [],
    };
  }

  const lightingItems = getPackItems(lightingData, ["items", "lighting", "tags"]);
  const explicitTimeItems = getPackItems(timeOfDayData, ["items", "time_of_day", "tags"]);

  const timeHintRe = /\b(dawn|day|daytime|dusk|evening|morning|night|sunrise|sunset|twilight)\b/i;
  const inferredTimeItems = [];
  const resolvedLightingItems = [];
  for (const item of lightingItems) {
    const phrase = String(item?.phrase || "");
    const tag = String(item?.tag || "");
    if (!explicitTimeItems.length && (timeHintRe.test(phrase) || timeHintRe.test(tag))) {
      inferredTimeItems.push(item);
    } else {
      resolvedLightingItems.push(item);
    }
  }

  return {
    lighting: buildCuratedLightingOptions(resolvedLightingItems),
    time_of_day: buildCuratedTimeOfDayOptions(
      explicitTimeItems.length ? explicitTimeItems : inferredTimeItems
    ),
  };
}

function normalizePresetsData(presetsData, modifiersData = null) {
  const legacyPresets = normalizePresetUiItems(presetsData?.presets);
  if (legacyPresets.length) {
    return legacyPresets;
  }

  const presetTags = mapPackTagsByLower(presetsData, ["items", "presets", "tags"]);
  const modifierTags = mapPackTagsByLower(modifiersData, ["items", "modifiers", "tags"]);
  const availableTags = mergeTagMaps(presetTags, modifierTags);

  const curated = [];
  for (const def of CURATED_PRESET_DEFS) {
    const positiveTags = resolveAvailableTags(availableTags, def.positive_tags);
    const negativeTags = resolveAvailableTags(availableTags, def.negative_tags);
    if (def.id !== "pony_default" && !positiveTags.length && !negativeTags.length) continue;
    curated.push({
      id: def.id,
      label: def.label,
      positive_tags: positiveTags,
      negative_tags: negativeTags,
    });
  }

  return curated.length
    ? curated
    : [{ id: "pony_default", label: "Default", positive_tags: [], negative_tags: [] }];
}

function normalizeModifiersData(modifiersData, presetsData = null) {
  const legacyModifiers = normalizeModifierUiItems(modifiersData?.modifiers);
  if (legacyModifiers.length) {
    return legacyModifiers;
  }

  const modifierTags = mapPackTagsByLower(modifiersData, ["items", "modifiers", "tags"]);
  const presetTags = mapPackTagsByLower(presetsData, ["items", "presets", "tags"]);
  const availableTags = mergeTagMaps(modifierTags, presetTags);

  const curated = [];
  for (const def of CURATED_STYLE_MODIFIER_DEFS) {
    const positiveTags = resolveAvailableTags(availableTags, def.positive_tags);
    if (!positiveTags.length) continue;
    curated.push({
      id: def.id,
      label: def.label,
      positive_tags: positiveTags,
      negative_tags: [],
    });
  }

  return curated;
}

function buildPresetStyleCompatibilityMap(modifiers) {
  const allModifierIds = new Set(
    (Array.isArray(modifiers) ? modifiers : [])
      .map((modifier) => String(modifier?.id || "").trim())
      .filter(Boolean)
  );
  const map = new Map();

  for (const presetDef of CURATED_PRESET_DEFS) {
    const presetId = String(presetDef?.id || "").trim();
    if (!presetId) continue;

    const allowedTagsRaw = PRESET_STYLE_COMPATIBILITY_ALLOWED_TAGS[presetId];
    if (!Array.isArray(allowedTagsRaw) || !allowedTagsRaw.length) {
      map.set(presetId, new Set(allModifierIds));
      continue;
    }

    const allowedTags = new Set(
      allowedTagsRaw.map((tag) => String(tag || "").trim().toLowerCase()).filter(Boolean)
    );
    const allowedIds = new Set();

    for (const modifier of modifiers || []) {
      const id = String(modifier?.id || "").trim();
      if (!id) continue;

      const positiveTags = Array.isArray(modifier?.positive_tags) ? modifier.positive_tags : [];
      const compatible = positiveTags.some((tagRaw) =>
        allowedTags.has(String(tagRaw || "").trim().toLowerCase())
      );
      if (compatible) allowedIds.add(id);
    }

    map.set(presetId, allowedIds);
  }

  return map;
}

function applyStyleModifierCompatibilityForPreset(
  containerEl,
  presetId,
  compatibilityMap,
  { clearIncompatibleSelection = true } = {}
) {
  const container = resolveUiElement(containerEl);
  if (!container) return false;

  const normalizedPresetId = String(presetId || "").trim();
  const allowedIds =
    compatibilityMap instanceof Map ? compatibilityMap.get(normalizedPresetId) : null;
  const hasAllowedSet = allowedIds instanceof Set;
  let changedSelection = false;

  for (const checkbox of container.querySelectorAll("input[type=checkbox]")) {
    const id = String(checkbox.value || "").trim();
    const compatible = !hasAllowedSet || allowedIds.has(id);
    const row = checkbox.closest(".toggleRow");

    if (!compatible && clearIncompatibleSelection && checkbox.checked) {
      checkbox.checked = false;
      changedSelection = true;
    }

    checkbox.disabled = !compatible;
    checkbox.setAttribute("aria-disabled", compatible ? "false" : "true");
    if (row) {
      row.classList.toggle("is-disabled", !compatible);
      row.title = compatible ? "" : "Not compatible with selected preset";
    }
  }

  return changedSelection;
}

function hasMatcherMappings(data) {
  return Boolean(Array.isArray(data?.tags) || Array.isArray(data?.items));
}

function buildMatcherFallbackData(packs) {
  const items = [];
  const seen = new Set();

  for (const pack of packs || []) {
    const packItems = getPackItemsFromKnownKeys(pack);
    for (const item of packItems) {
      const tag = String(item?.tag || "").trim();
      const phrase = String(item?.phrase || "").trim() || tag.replace(/_/g, " ");
      if (!tag || !phrase) continue;
      const key = `${tag.toLowerCase()}::${phrase.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ phrase, tag });
    }
  }

  return {
    version: "derived.matcher.items.v1",
    items,
  };
}

function singularizeControlledToken(tokenRaw) {
  const token = normalizePhrase(tokenRaw);
  if (!token) return "";
  const irregular = CONTROLLED_PLURAL_IRREGULAR_TO_SINGULAR[token];
  if (irregular) return irregular;
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  if (/(?:ches|shes|sses|xes|zes)$/.test(token) && token.length > 4) {
    return token.slice(0, -2);
  }
  if (token.endsWith("s") && token.length > 3 && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
}

function pluralizeControlledToken(tokenRaw) {
  const token = normalizePhrase(tokenRaw);
  if (!token) return "";
  const irregular = CONTROLLED_SINGULAR_IRREGULAR_TO_PLURAL[token];
  if (irregular) return irregular;
  if (/[sxz]$/.test(token) || /(?:ch|sh)$/.test(token)) {
    return `${token}es`;
  }
  if (token.endsWith("y") && token.length > 2 && !/[aeiou]y$/.test(token)) {
    return `${token.slice(0, -1)}ies`;
  }
  return `${token}s`;
}

function expandControlledInflectionForms(tokenRaw) {
  const token = normalizePhrase(tokenRaw);
  if (!token) return [];
  const forms = CONTROLLED_INFLECTION_FORMS_BY_TOKEN.get(token);
  if (!Array.isArray(forms) || !forms.length) return [token];
  return forms;
}

function getCompactVariantsForPhraseNorm(phraseNorm) {
  const normalizedPhrase = normalizePhrase(phraseNorm);
  if (!normalizedPhrase) return [];

  const out = new Set();
  if (Array.isArray(CONTROLLED_COMPACT_VARIANTS_BY_NORMALIZED_PHRASE[normalizedPhrase])) {
    for (const variant of CONTROLLED_COMPACT_VARIANTS_BY_NORMALIZED_PHRASE[normalizedPhrase]) {
      const normalized = normalizePhrase(variant);
      if (normalized) out.add(normalized);
    }
  }

  for (const [basePhrase, compactVariants] of Object.entries(
    CONTROLLED_COMPACT_VARIANTS_BY_NORMALIZED_PHRASE
  )) {
    const normalizedBase = normalizePhrase(basePhrase);
    if (!Array.isArray(compactVariants) || !compactVariants.length) continue;
    const normalizedCompacts = compactVariants.map((variant) => normalizePhrase(variant));
    if (!normalizedCompacts.includes(normalizedPhrase)) continue;
    if (normalizedBase) out.add(normalizedBase);
  }

  return Array.from(out).filter(Boolean);
}

function shouldAllowInterveningWordsForTag(tagLower, phraseTokens) {
  if (!INTERVENING_TOLERANCE_TAG_ALLOWLIST.has(String(tagLower || "").toLowerCase())) return false;
  return Array.isArray(phraseTokens) && phraseTokens.length >= 2;
}

function buildControlledPhraseVariantNorms(phraseNorm, tagLower, canonicalTagLowerSet) {
  const normalizedPhrase = normalizePhrase(phraseNorm);
  if (!normalizedPhrase) return [];
  const baseTokens = tokenizeNormalizedPhrase(normalizedPhrase);
  if (!baseTokens.length) return [];

  const compactVariants = getCompactVariantsForPhraseNorm(normalizedPhrase);
  const hasInflectionCandidate = baseTokens.some((token) =>
    CONTROLLED_INFLECTION_FORMS_BY_TOKEN.has(token)
  );
  const canPluralizeSingle =
    baseTokens.length === 1 &&
    baseTokens[0].length > 2 &&
    !CONTROLLED_INFLECTION_FORMS_BY_TOKEN.has(baseTokens[0]) &&
    !baseTokens[0].endsWith("ing");
  if (!hasInflectionCandidate && !compactVariants.length && !canPluralizeSingle) {
    return [normalizedPhrase];
  }

  const variantNorms = new Set([normalizedPhrase]);
  const maxVariants = 48;

  let states = [[]];
  for (let i = 0; i < baseTokens.length; i += 1) {
    const token = baseTokens[i];
    const tokenOptions = new Set([token]);
    for (const inflected of expandControlledInflectionForms(token)) {
      if (inflected) tokenOptions.add(inflected);
    }

    if (baseTokens.length === 1 && token && token.length > 2) {
      const singular = singularizeControlledToken(token);
      const plural = pluralizeControlledToken(token);
      const looksVerbLike = CONTROLLED_INFLECTION_FORMS_BY_TOKEN.has(token) || token.endsWith("ing");
      const tagAlignsToToken =
        tagLower === singular ||
        tagLower === token ||
        tagLower.endsWith(`_${singular}`) ||
        tagLower.endsWith(`_${token}`);
      if (!looksVerbLike && tagAlignsToToken) {
        if (token === singular) {
          if (plural && plural !== token && !canonicalTagLowerSet.has(plural)) {
            tokenOptions.add(plural);
          }
        } else if (!canonicalTagLowerSet.has(token) && singular && canonicalTagLowerSet.has(singular)) {
          tokenOptions.add(singular);
        }
      }
    }

    const nextStates = [];
    for (const state of states) {
      for (const option of tokenOptions) {
        nextStates.push([...state, option]);
        if (nextStates.length >= maxVariants) break;
      }
      if (nextStates.length >= maxVariants) break;
    }
    states = nextStates.length ? nextStates : states;
    if (states.length >= maxVariants) break;
  }

  for (const tokens of states) {
    if (!Array.isArray(tokens) || !tokens.length) continue;
    variantNorms.add(tokens.join(" "));
    if (variantNorms.size >= maxVariants) break;
  }

  for (const compactVariant of compactVariants) {
    if (compactVariant) variantNorms.add(compactVariant);
  }

  return Array.from(variantNorms).filter(Boolean);
}

function preparePhraseEntries(items, phraseKey, tagKey, options = {}) {
  const dropStrictTagSubphrases = Boolean(options?.dropStrictTagSubphrases);
  const applyControlledNormalization = Boolean(options?.applyControlledNormalization);
  const sourceEntries = Array.isArray(items) ? items : [];
  const candidateRows = [];
  const canonicalTagLowerSet = new Set();

  for (const entry of sourceEntries) {
    const phrase = String(entry?.[phraseKey] || "");
    const phraseNorm = normalizePhrase(phrase);
    const tag = String(entry?.[tagKey] || "").trim();
    const tagLower = tag.toLowerCase();
    if (!phraseNorm || !tag) continue;
    canonicalTagLowerSet.add(tagLower);
    candidateRows.push({
      phrase,
      phraseNorm,
      tag,
      tagLower,
      tagTokens: tokenizeTagForPhraseMatching(tag),
    });
  }

  const prepared = [];
  const seen = new Set();

  for (const row of candidateRows) {
    const phraseVariants = applyControlledNormalization
      ? buildControlledPhraseVariantNorms(row.phraseNorm, row.tagLower, canonicalTagLowerSet)
      : [row.phraseNorm];
    for (const phraseNorm of phraseVariants) {
      const phraseTokens = tokenizeNormalizedPhrase(phraseNorm);
      if (!phraseTokens.length) continue;

      const key = `${phraseNorm}::${row.tagLower}`;
      if (seen.has(key)) continue;
      seen.add(key);

      prepared.push({
        phrase: row.phrase,
        phraseNorm,
        phraseTokens,
        requiredTokens: Array.from(
          new Set(
            phraseTokens.filter(
              (token) =>
                !shouldAllowInterveningWordsForTag(row.tagLower, phraseTokens) ||
                !CONTROLLED_INTERVENING_WORDS.includes(token)
            )
          )
        ),
        tag: row.tag,
        allowInterveningWords:
          applyControlledNormalization &&
          shouldAllowInterveningWordsForTag(row.tagLower, phraseTokens),
        skipPartialTagAlias:
          dropStrictTagSubphrases && isStrictTokenSubphraseLocal(phraseTokens, row.tagTokens),
      });
    }
  }

  return prepared.sort((a, b) => {
    if (b.phraseNorm.length !== a.phraseNorm.length) {
      return b.phraseNorm.length - a.phraseNorm.length;
    }
    return a.phraseNorm.localeCompare(b.phraseNorm);
  });
}

function createLazy(factory) {
  let hasValue = false;
  let value;
  const lazy = () => {
    if (!hasValue) {
      value = factory();
      hasValue = true;
    }
    return value;
  };
  lazy.isPrepared = () => hasValue;
  lazy.setPreparedValue = (nextValue) => {
    if (hasValue) return value;
    value = nextValue;
    hasValue = true;
    return value;
  };
  return lazy;
}

function prepareUnionWithPhraseVariants(unionItems, v1Items, v2Items, phraseKey, tagKey, options) {
  const unionPrepared = preparePhraseEntries(unionItems, phraseKey, tagKey, options);
  if (v1Items === unionItems && v2Items === unionItems) {
    return unionPrepared;
  }
  const variantsPrepared = preparePhraseEntries(
    [...(v1Items || []), ...(v2Items || [])],
    phraseKey,
    tagKey,
    options
  );
  return mergePhraseEntryLists(unionPrepared, variantsPrepared);
}

function mergePhraseEntryLists(primary, secondary) {
  const out = [];
  const seenPhraseNorm = new Set();
  const seenPhraseTag = new Set();

  const append = (entry, skipDuplicatePhraseNorm) => {
    const phraseNorm = String(entry?.phraseNorm || "");
    const tag = String(entry?.tag || "").trim();
    if (!phraseNorm || !tag) return;

    const key = `${phraseNorm}::${tag.toLowerCase()}`;
    if (skipDuplicatePhraseNorm && seenPhraseNorm.has(phraseNorm)) return;
    if (seenPhraseTag.has(key)) return;

    seenPhraseNorm.add(phraseNorm);
    seenPhraseTag.add(key);
    const phraseTokens = Array.isArray(entry?.phraseTokens)
      ? entry.phraseTokens.filter(Boolean)
      : tokenizeNormalizedPhrase(phraseNorm);
    const requiredTokens = Array.isArray(entry?.requiredTokens)
      ? entry.requiredTokens.filter(Boolean)
      : Array.from(new Set(phraseTokens));
    out.push({
      phrase: String(entry?.phrase || ""),
      phraseNorm,
      phraseTokens,
      requiredTokens,
      tag,
      allowInterveningWords: Boolean(entry?.allowInterveningWords),
      skipPartialTagAlias: Boolean(entry?.skipPartialTagAlias),
    });
  };

  for (const entry of primary || []) append(entry, false);
  for (const entry of secondary || []) append(entry, true);

  return out;
}

function sortPreparedPhraseEntries(entries) {
  return [...(entries || [])].sort((a, b) => {
    const aPhrase = String(a?.phraseNorm || "");
    const bPhrase = String(b?.phraseNorm || "");
    if (bPhrase.length !== aPhrase.length) {
      return bPhrase.length - aPhrase.length;
    }
    return aPhrase.localeCompare(bPhrase);
  });
}

function tagListToPhraseEntries(tags) {
  const rawEntries = [];

  for (const item of Array.isArray(tags) ? tags : []) {
    if (typeof item === "string") {
      const tag = String(item).trim();
      if (!tag) continue;
      const phraseFromTag = tag.replace(/_/g, " ");
      rawEntries.push({ phrase: phraseFromTag, tag });
      if (phraseFromTag !== tag) {
        rawEntries.push({ phrase: tag, tag });
      }
      continue;
    }

    const tag = String(item?.tag || "").trim();
    if (!tag) continue;

    const phrase = String(item?.phrase || "").trim();
    if (phrase) rawEntries.push({ phrase, tag });

    const phraseFromTag = tag.replace(/_/g, " ");
    rawEntries.push({ phrase: phraseFromTag, tag });
    if (phraseFromTag !== tag) {
      rawEntries.push({ phrase: tag, tag });
    }
  }

  return preparePhraseEntries(rawEntries, "phrase", "tag");
}

function extractTagsFromPhraseEntries(userText, preparedEntries) {
  const rawText = String(userText || "");
  if (!rawText || !Array.isArray(preparedEntries) || !preparedEntries.length) return [];

  return memoizeByPreparedEntriesAndText(
    EXTRACT_TAGS_CACHE_BY_PREPARED,
    preparedEntries,
    rawText,
    () => {
      const textLower = rawText.toLowerCase();
      const textTokenSet = buildTokenSetFromLowerText(textLower);
      const tags = [];
      for (const entry of preparedEntries) {
        if (entry?.skipPartialTagAlias) continue;
        const phraseTokens = Array.isArray(entry?.phraseTokens)
          ? entry.phraseTokens
          : tokenizeNormalizedPhrase(entry?.phraseNorm || "");
        if (!phraseTokens.length) continue;
        const requiredTokens = Array.isArray(entry?.requiredTokens)
          ? entry.requiredTokens
          : phraseTokens;
        if (!hasAllTokens(textTokenSet, requiredTokens)) continue;
        if (
          !findPhraseMatchesInLowerText(textLower, phraseTokens, {
            allowInterveningWords: Boolean(entry?.allowInterveningWords),
          }).length
        ) {
          continue;
        }
        tags.push(entry.tag);
      }
      return dedupePreserveOrder(tags);
    }
  );
}

function extractTagsWithRawSpans(rawText, preparedEntries) {
  const text = String(rawText || "");
  if (!text || !Array.isArray(preparedEntries) || !preparedEntries.length) {
    return { tags: [], spans: [] };
  }

  return memoizeByPreparedEntriesAndText(
    EXTRACT_RAW_SPANS_CACHE_BY_PREPARED,
    preparedEntries,
    text,
    () => {
      const textLower = text.toLowerCase();
      const textTokenSet = buildTokenSetFromLowerText(textLower);
      const occupied = new Array(textLower.length).fill(false);
      const accepted = [];

      for (const entry of preparedEntries) {
        if (entry?.skipPartialTagAlias) continue;
        const phraseTokens = Array.isArray(entry?.phraseTokens)
          ? entry.phraseTokens
          : tokenizeNormalizedPhrase(entry?.phraseNorm || "");
        if (!phraseTokens.length) continue;
        const requiredTokens = Array.isArray(entry?.requiredTokens)
          ? entry.requiredTokens
          : phraseTokens;
        if (!hasAllTokens(textTokenSet, requiredTokens)) continue;

        const matches = findPhraseMatchesInLowerText(textLower, phraseTokens, {
          allowInterveningWords: Boolean(entry?.allowInterveningWords),
        });
        for (const match of matches) {
          const start = Number(match?.start);
          const end = Number(match?.end);
          if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;

          let overlaps = false;
          for (let i = start; i < end; i += 1) {
            if (occupied[i]) {
              overlaps = true;
              break;
            }
          }
          if (overlaps) continue;

          for (let i = start; i < end; i += 1) occupied[i] = true;
          accepted.push({
            start,
            end,
            tag: entry.tag,
          });
        }
      }

      accepted.sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        return (b.end - b.start) - (a.end - a.start);
      });

      const tags = dedupePreserveOrder(accepted.map((entry) => entry.tag));
      return { tags, spans: accepted };
    }
  );
}

function extractTagsWithSpans(normalizedText, preparedEntries) {
  const text = String(normalizedText || "");
  if (!text || !Array.isArray(preparedEntries) || !preparedEntries.length) {
    return { tags: [], spans: [] };
  }

  return memoizeByPreparedEntriesAndText(
    EXTRACT_NORMALIZED_SPANS_CACHE_BY_PREPARED,
    preparedEntries,
    text,
    () => {
      const textLower = text.toLowerCase();
      const textTokenSet = buildTokenSetFromLowerText(textLower);
      const occupied = new Array(textLower.length).fill(false);
      const accepted = [];

      for (const entry of preparedEntries) {
        if (entry?.skipPartialTagAlias) continue;
        const phraseTokens = Array.isArray(entry?.phraseTokens)
          ? entry.phraseTokens
          : tokenizeNormalizedPhrase(entry?.phraseNorm || "");
        if (!phraseTokens.length) continue;
        const requiredTokens = Array.isArray(entry?.requiredTokens)
          ? entry.requiredTokens
          : phraseTokens;
        if (!hasAllTokens(textTokenSet, requiredTokens)) continue;

        const matches = findPhraseMatchesInLowerText(textLower, phraseTokens, {
          allowInterveningWords: Boolean(entry?.allowInterveningWords),
        });
        for (const match of matches) {
          const start = Number(match?.start);
          const end = Number(match?.end);
          if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;

          let overlaps = false;
          for (let i = start; i < end; i += 1) {
            if (occupied[i]) {
              overlaps = true;
              break;
            }
          }
          if (overlaps) continue;

          for (let i = start; i < end; i += 1) occupied[i] = true;
          accepted.push({
            start,
            end,
            tag: entry.tag,
          });
        }
      }

      accepted.sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        return (b.end - b.start) - (a.end - a.start);
      });

      const tags = dedupePreserveOrder(accepted.map((entry) => entry.tag));
      return { tags, spans: accepted };
    }
  );
}

function extractInteractionTagsWithSpans(normalizedText, preparedEntries) {
  const result = extractTagsWithSpans(normalizedText, preparedEntries);
  return {
    interactionTags: result.tags,
    spans: result.spans,
  };
}

function includesAnyKeyword(userText, keywords) {
  const normalized = normalizeForContains(userText);
  return keywords.some((keyword) => containsNormalizedPhrase(normalized, keyword));
}

function spansToRawRanges(spans, normToRaw) {
  const ranges = [];
  for (const span of spans || []) {
    if (!normToRaw?.length) continue;
    const startIdx = span.start;
    const endIdx = span.end - 1;
    if (startIdx < 0 || endIdx < 0) continue;
    if (startIdx >= normToRaw.length || endIdx >= normToRaw.length) continue;

    const rawStart = normToRaw[startIdx];
    const rawEnd = normToRaw[endIdx] + 1;
    if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd) || rawEnd <= rawStart) {
      continue;
    }

    ranges.push({ start: rawStart, end: rawEnd });
  }

  if (!ranges.length) return [];

  ranges.sort((a, b) => a.start - b.start);
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i += 1) {
    const prev = merged[merged.length - 1];
    const curr = ranges[i];
    if (curr.start <= prev.end) {
      prev.end = Math.max(prev.end, curr.end);
    } else {
      merged.push({ ...curr });
    }
  }

  return merged;
}

function findNormalizedPhraseRawStartIndices(rawText, phrases, minRawStart = 0) {
  const lowerText = String(rawText || "").toLowerCase();
  if (!lowerText) return [];

  const indices = [];
  for (const phrase of phrases || []) {
    const phraseTokens = tokenizeNormalizedPhrase(normalizePhrase(phrase));
    if (!phraseTokens.length) continue;
    const matches = findPhraseMatchesInLowerText(lowerText, phraseTokens);
    for (const match of matches) {
      const start = Number(match?.start);
      if (Number.isFinite(start) && start >= minRawStart) {
        indices.push(start);
      }
    }
  }

  if (!indices.length) return [];
  indices.sort((a, b) => a - b);
  const unique = [];
  let prev = null;
  for (const idx of indices) {
    if (idx === prev) continue;
    unique.push(idx);
    prev = idx;
  }
  return unique;
}

function maskRawTextByRanges(rawText, ranges) {
  const chars = Array.from(String(rawText || ""));
  for (const range of ranges || []) {
    const start = Math.max(0, Math.min(chars.length, range.start));
    const end = Math.max(start, Math.min(chars.length, range.end));
    for (let i = start; i < end; i += 1) {
      chars[i] = " ";
    }
  }
  return chars.join("");
}

function tokenizeNormalizedWithOffsets(normalizedText) {
  const text = String(normalizedText || "");
  if (!text) return [];

  const tokens = [];
  let i = 0;
  while (i < text.length) {
    while (i < text.length && text[i] === " ") i += 1;
    if (i >= text.length) break;

    const start = i;
    while (i < text.length && text[i] !== " ") i += 1;
    const end = i;
    tokens.push({
      token: text.slice(start, end),
      start,
      end,
    });
  }

  return tokens;
}

function tokenizeNormalized(text) {
  return normalizeLooseText(text).split(" ").filter(Boolean);
}

function findColorTokenHits(tokens, colorWordsSet) {
  const hits = [];
  for (let i = 0; i < (tokens || []).length; i += 1) {
    const token = String(tokens[i] || "");
    if (!token) continue;
    if (!colorWordsSet?.has(token)) continue;
    hits.push({ idx: i, color: token });
  }
  return hits;
}

function findClothingHits(tokens, clothingPhrasesTokens) {
  const out = [];
  const source = tokens || [];
  for (const phraseTokens of clothingPhrasesTokens || []) {
    const parts = Array.isArray(phraseTokens) ? phraseTokens : [];
    if (parts.length < 1 || parts.length > 2) continue;

    for (let i = 0; i + parts.length <= source.length; i += 1) {
      let ok = true;
      for (let j = 0; j < parts.length; j += 1) {
        if (source[i + j] !== parts[j]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      out.push({
        startIdx: i,
        endIdx: i + parts.length - 1,
      });
    }
  }
  return out;
}

function extractBoundClothingColors(rawSegmentText, colorsPrepared, clothingNounsNorm) {
  const tokens = tokenizeNormalized(rawSegmentText);
  if (!tokens.length) return [];

  const colorWordsSet = new Set();
  const colorTagByWord = new Map();
  for (const entry of colorsPrepared || []) {
    const word = normalizePhrase(entry?.phraseNorm || entry?.phrase || "");
    const tag = String(entry?.tag || "").trim().toLowerCase();
    if (!word || !tag) continue;
    if (word.includes(" ")) continue;
    colorWordsSet.add(word);
    colorTagByWord.set(word, tag);
  }

  const clothingPhrasesTokens = [];
  for (const phrase of clothingNounsNorm || []) {
    const parts = tokenizeNormalized(phrase);
    if (parts.length < 1 || parts.length > 2) continue;
    clothingPhrasesTokens.push(parts);
  }

  const colorHits = findColorTokenHits(tokens, colorWordsSet);
  const clothingHits = findClothingHits(tokens, clothingPhrasesTokens);
  if (!colorHits.length || !clothingHits.length) return [];

  const out = [];
  for (const colorHit of colorHits) {
    const colorIdx = colorHit.idx;
    const bound = clothingHits.some((clothingHit) => {
      return (
        Math.abs(colorIdx - clothingHit.startIdx) <= 2 ||
        Math.abs(colorIdx - clothingHit.endIdx) <= 2
      );
    });
    if (!bound) continue;
    const tag = colorTagByWord.get(colorHit.color);
    if (tag) out.push(tag);
  }

  return dedupePreserveOrder(out);
}

function extractBoundClothingLengthTags(rawSegmentText, clothingNounsNorm) {
  const tokens = tokenizeNormalized(rawSegmentText);
  if (!tokens.length) return [];

  const clothingPhrasesTokens = [];
  for (const phrase of clothingNounsNorm || []) {
    const parts = tokenizeNormalized(phrase);
    if (parts.length < 1 || parts.length > 2) continue;
    clothingPhrasesTokens.push(parts);
  }

  const clothingHits = findClothingHits(tokens, clothingPhrasesTokens);
  if (!clothingHits.length) return [];

  const out = [];
  for (const clothingHit of clothingHits) {
    const lookbehindStart = Math.max(0, clothingHit.startIdx - 2);
    const beforeTokens = tokens.slice(lookbehindStart, clothingHit.startIdx);
    if (!beforeTokens.includes("short")) continue;

    const garmentTokens = tokens.slice(clothingHit.startIdx, clothingHit.endIdx + 1);
    if (!garmentTokens.length) continue;
    out.push(`short_${garmentTokens.join("_")}`);
  }

  return dedupePreserveOrder(out);
}

function normalizeHairColorTag(baseColor) {
  const normalized = String(baseColor || "").toLowerCase();
  if (!normalized) return "";
  if (normalized === "grey" || normalized === "gray") return "gray_hair";
  return `${normalized}_hair`;
}

function buildHairColorPreparedFromCat0(cat0Data) {
  const outByColor = new Map();
  const source = Array.isArray(cat0Data?.tags)
    ? cat0Data.tags
    : getPackItems(cat0Data, ["items", "tags"]).map((item) => ({ tag: item.tag }));

  for (const item of source) {
    const tag = String(item?.tag || "").trim().toLowerCase();
    if (!tag.endsWith("_hair")) continue;

    const baseColor = tag.slice(0, -5).trim();
    if (!baseColor) continue;
    if (SINGLE_TOKEN_HAIR_LENGTH_STYLE_MAP[baseColor]) continue;
    if (baseColor.includes("hair")) continue;

    const colorNorm = normalizeLooseText(baseColor.replace(/_/g, " "));
    if (!colorNorm || colorNorm.includes(" ")) continue;

    outByColor.set(colorNorm, {
      color: colorNorm,
      tag: normalizeHairColorTag(baseColor),
    });
  }

  if (outByColor.has("grey") && !outByColor.has("gray")) {
    outByColor.set("gray", { color: "gray", tag: "gray_hair" });
  }
  if (outByColor.has("gray") && !outByColor.has("grey")) {
    outByColor.set("grey", { color: "grey", tag: "gray_hair" });
  }

  return Array.from(outByColor.values()).sort((a, b) => a.color.localeCompare(b.color));
}

function extractHairLengthAndColorOverlap(segmentText, hairColorPrepared) {
  const mapping = normalizeForMatchingWithMap(segmentText);
  const tokens = tokenizeNormalizedWithOffsets(mapping.normalized);
  if (tokens.length < 3) return { tags: [], ranges: [] };

  const colorToTag = new Map();
  for (const entry of hairColorPrepared || []) {
    const color = normalizeLooseText(entry?.color || "");
    const tag = String(entry?.tag || "").trim();
    if (!color || !tag || color.includes(" ")) continue;
    colorToTag.set(color, tag);
  }

  const used = new Array(tokens.length).fill(false);
  const spans = [];
  const tags = [];

  for (let i = 0; i <= tokens.length - 3; i += 1) {
    if (used[i] || used[i + 1] || used[i + 2]) continue;

    const t0 = tokens[i].token;
    const t1 = tokens[i + 1].token;
    const t2 = tokens[i + 2].token;
    if (t2 !== "hair") continue;

    let colorTag = "";
    let lengthTag = "";

    if (colorToTag.has(t0) && SINGLE_TOKEN_HAIR_LENGTH_STYLE_MAP[t1]) {
      colorTag = colorToTag.get(t0);
      lengthTag = SINGLE_TOKEN_HAIR_LENGTH_STYLE_MAP[t1];
    } else if (SINGLE_TOKEN_HAIR_LENGTH_STYLE_MAP[t0] && colorToTag.has(t1)) {
      colorTag = colorToTag.get(t1);
      lengthTag = SINGLE_TOKEN_HAIR_LENGTH_STYLE_MAP[t0];
    }

    if (!colorTag || !lengthTag) continue;

    used[i] = true;
    used[i + 1] = true;
    used[i + 2] = true;

    tags.push(colorTag, lengthTag);
    spans.push({
      start: tokens[i].start,
      end: tokens[i + 2].end,
    });
  }

  return {
    tags: dedupePreserveOrder(tags),
    ranges: spansToRawRanges(spans, mapping.normToRaw),
  };
}

function buildClothingPreparedFromCat0(cat0Data) {
  const outByTag = new Map();
  const source = Array.isArray(cat0Data?.tags)
    ? cat0Data.tags
    : getPackItems(cat0Data, ["items", "tags"]).map((item) => ({ tag: item.tag }));

  for (const item of source) {
    const tag = String(item?.tag || "").trim();
    if (!tag) continue;
    if (classifyCharacterTag(tag) !== 6) continue;

    const tagLower = tag.toLowerCase();
    const phraseNorm = normalizePhrase(tagLower.replace(/_/g, " "));
    if (!phraseNorm) continue;

    const tokens = phraseNorm.split(" ").filter(Boolean);
    if (!tokens.length) continue;

    outByTag.set(tagLower, {
      tag: tagLower,
      phraseNorm,
      tokens,
    });
  }

  return Array.from(outByTag.values()).sort((a, b) => {
    if (b.tokens.length !== a.tokens.length) return b.tokens.length - a.tokens.length;
    if (b.phraseNorm.length !== a.phraseNorm.length) {
      return b.phraseNorm.length - a.phraseNorm.length;
    }
    return a.phraseNorm.localeCompare(b.phraseNorm);
  });
}

function indexPreparedByFirstToken(entries) {
  const byFirst = new Map();
  for (const entry of entries || []) {
    const first = String(entry?.tokens?.[0] || "");
    if (!first) continue;
    if (!byFirst.has(first)) byFirst.set(first, []);
    byFirst.get(first).push(entry);
  }
  return byFirst;
}

function extractClothingColorBindings(segmentText, clothingByFirstToken) {
  const mapping = normalizeForMatchingWithMap(segmentText);
  const tokens = tokenizeNormalizedWithOffsets(mapping.normalized);
  if (!tokens.length) return { tags: [], ranges: [] };

  const basicColorSet = new Set(BASIC_COLORS.map((color) => color.toLowerCase()));
  const used = new Array(tokens.length).fill(false);
  const spans = [];
  const tags = [];

  for (let i = 0; i < tokens.length; i += 1) {
    if (used[i]) continue;

    const colorToken = tokens[i].token;
    if (!basicColorSet.has(colorToken)) continue;

    let binding = null;

    for (let gap = 1; gap <= 3; gap += 1) {
      const clothingStart = i + gap;
      if (clothingStart >= tokens.length) break;
      if (used[clothingStart]) continue;

      const candidates = clothingByFirstToken.get(tokens[clothingStart].token) || [];
      for (const candidate of candidates) {
        const tokenCount = candidate.tokens.length;
        const clothingEnd = clothingStart + tokenCount;
        if (clothingEnd > tokens.length) continue;

        let overlaps = false;
        for (let k = clothingStart; k < clothingEnd; k += 1) {
          if (used[k]) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) continue;

        let allMatch = true;
        for (let k = 0; k < tokenCount; k += 1) {
          if (tokens[clothingStart + k].token !== candidate.tokens[k]) {
            allMatch = false;
            break;
          }
        }
        if (!allMatch) continue;

        binding = {
          clothingTag: candidate.tag,
          startToken: i,
          endToken: clothingEnd,
        };
        break;
      }

      if (binding) break;
    }

    if (!binding) continue;

    const clothingTag = binding.clothingTag;
    tags.push(clothingTag);

    for (let k = binding.startToken; k < binding.endToken; k += 1) {
      used[k] = true;
    }

    spans.push({
      start: tokens[binding.startToken].start,
      end: tokens[binding.endToken - 1].end,
    });
  }

  return {
    tags: dedupePreserveOrder(tags),
    ranges: spansToRawRanges(spans, mapping.normToRaw),
  };
}

function sanitizeRawHelperText(text) {
  let out = String(text || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/"/g, "'");

  if (!out) return "";

  const tokens = out.split(" ");
  const dedupedTokens = [];
  for (const token of tokens) {
    const current = String(token || "");
    if (!current) continue;
    const prev = dedupedTokens[dedupedTokens.length - 1] || "";
    if (prev && normalizeLooseText(prev) === normalizeLooseText(current)) {
      continue;
    }
    dedupedTokens.push(current);
  }
  out = dedupedTokens.join(" ").trim();

  out = out.replace(/([,;:.!?])(?:\s*[,;:.!?])+$/g, "$1");
  out = out.replace(/,\s*$/g, "");
  out = out.trim();

  if (!out) return "";

  return out;
}

function buildRawHelperBlock(userText) {
  const t = sanitizeRawHelperText(userText);
  if (!t) return "";
  return `(${t}:${RAW_HELPER_WEIGHT})`;
}

function extractHairComboTags(segmentText) {
  const normalizedPadded = normalizeForContains(segmentText);
  if (!normalizedPadded.trim()) return [];

  const out = [];
  const colorKeys = Object.keys(HAIR_COLOR_MAP).sort((a, b) => b.length - a.length);
  const styleKeys = Object.keys(HAIR_STYLE_MAP).sort((a, b) => b.length - a.length);

  for (const color of colorKeys) {
    for (const style of styleKeys) {
      if (
        containsNormalizedPhrase(normalizedPadded, `${color} ${style} hair`) ||
        containsNormalizedPhrase(normalizedPadded, `${style} ${color} hair`)
      ) {
        out.push(HAIR_COLOR_MAP[color], HAIR_STYLE_MAP[style]);
      }
    }
  }

  for (const color of colorKeys) {
    if (containsNormalizedPhrase(normalizedPadded, `${color} hair`)) {
      out.push(HAIR_COLOR_MAP[color]);
    }
  }

  for (const style of styleKeys) {
    if (containsNormalizedPhrase(normalizedPadded, `${style} hair`)) {
      out.push(HAIR_STYLE_MAP[style]);
    }
  }

  const normalizedLoose = normalizeLooseText(segmentText);
  if (/\b(?:one|the|a|an)?\s*blonde\b/.test(normalizedLoose)) {
    out.push("blonde_hair");
  }
  if (/\b(?:one|the|a|an)?\s*brunette\b/.test(normalizedLoose)) {
    out.push("brown_hair");
  }
  if (/\b(?:one|the|a|an)?\s*redhead\b/.test(normalizedLoose)) {
    out.push("red_hair");
  }

  return dedupePreserveOrder(out);
}

function normalizeForSplit(maskedRawText) {
  const source = String(maskedRawText || "");
  const chars = [];
  for (let i = 0; i < source.length; i += 1) {
    if (isPossessiveSuffixAt(source, i)) {
      i += 1;
      continue;
    }
    const ch = source[i].toLowerCase();
    if (/[a-z0-9]/.test(ch)) {
      chars.push(ch);
      continue;
    }
    if (ch === "." || ch === "," || ch === ":" || ch === "-" || ch === ";" || ch === "\n") {
      chars.push(ch);
      continue;
    }
    chars.push(" ");
  }
  return chars.join("");
}

function setOptions(selectEl, items, placeholder = "-") {
  selectEl.innerHTML = "";

  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = placeholder;
  selectEl.appendChild(ph);

  for (const item of items || []) {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.label;
    selectEl.appendChild(opt);
  }
}

function setCheckboxList(containerEl, items) {
  containerEl.innerHTML = "";
  for (const item of items || []) {
    const row = document.createElement("label");
    row.className = "toggleRow";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = item.id;
    const isDisabled = Boolean(item?.disabled);
    cb.disabled = isDisabled;
    cb.setAttribute("aria-disabled", isDisabled ? "true" : "false");

    const span = document.createElement("span");
    span.textContent = item.label;

    row.classList.toggle("is-disabled", isDisabled);
    row.appendChild(cb);
    row.appendChild(span);
    containerEl.appendChild(row);
  }
}

const DEFAULT_ACTIVE_PILL_SELECTOR =
  '[aria-pressed="true"], [data-selected="true"], .active, .selected';
const DEFAULT_PILL_INTERACTION_SELECTOR =
  "button, [role='button'], [aria-pressed], [data-selected], .active, .selected";

function resolveUiElement(containerOrEl) {
  if (!containerOrEl) return null;
  if (typeof containerOrEl === "string") return $(containerOrEl);
  if (containerOrEl instanceof Element) return containerOrEl;
  return null;
}

function safeCssEscape(value) {
  const raw = String(value || "");
  if (!raw) return "";
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(raw);
  }
  return raw.replace(/["\\]/g, "\\$&");
}

function readSelectableIdFromElement(el) {
  if (!(el instanceof Element)) return "";

  const inputValue = "value" in el ? String(el.value || "").trim() : "";
  if (inputValue && inputValue.toLowerCase() !== "on") return inputValue;

  const dataValue = String(el.getAttribute("data-value") || "").trim();
  if (dataValue) return dataValue;

  const dataId = String(el.getAttribute("data-id") || "").trim();
  if (dataId) return dataId;

  const id = String(el.id || "").trim();
  if (id) return id;

  return "";
}

function getSingleSelectedId(
  containerOrEl,
  { fallbackSelectId = "", radioName = "", pillSelector = "" } = {}
) {
  const root = resolveUiElement(containerOrEl);
  const fallback = fallbackSelectId ? resolveUiElement(fallbackSelectId) : null;
  const activePillSelector = String(pillSelector || "").trim() || DEFAULT_ACTIVE_PILL_SELECTOR;

  const readSelectValue = (el) => {
    if (!el) return "";
    if (el instanceof HTMLSelectElement) {
      return String(el.value || "").trim();
    }
    if (typeof el.querySelector === "function") {
      const nested = el.querySelector("select");
      if (nested instanceof HTMLSelectElement) {
        return String(nested.value || "").trim();
      }
    }
    return "";
  };

  const fromRootSelect = readSelectValue(root);
  if (fromRootSelect) return fromRootSelect;

  const fromFallbackSelect = readSelectValue(fallback);
  if (fromFallbackSelect) return fromFallbackSelect;

  const escapedRadioName = safeCssEscape(radioName);
  const namedRadioSelector = escapedRadioName
    ? `input[type="radio"][name="${escapedRadioName}"]:checked`
    : "";
  const anyRadioSelector = 'input[type="radio"]:checked';

  const readRadioId = (el) => {
    if (!el || typeof el.querySelector !== "function") return "";
    const radio = namedRadioSelector ? el.querySelector(namedRadioSelector) : el.querySelector(anyRadioSelector);
    return readSelectableIdFromElement(radio);
  };

  const fromRootRadio = readRadioId(root);
  if (fromRootRadio) return fromRootRadio;

  const fromFallbackRadio = readRadioId(fallback);
  if (fromFallbackRadio) return fromFallbackRadio;

  if (namedRadioSelector) {
    const globalNamedRadio = document.querySelector(namedRadioSelector);
    const globalNamedId = readSelectableIdFromElement(globalNamedRadio);
    if (globalNamedId) return globalNamedId;
  }

  const fromGlobalRadio = readSelectableIdFromElement(document.querySelector(anyRadioSelector));
  if (fromGlobalRadio && !namedRadioSelector) return fromGlobalRadio;

  const readPillId = (el) => {
    if (!el || typeof el.querySelector !== "function") return "";
    const pill = el.querySelector(activePillSelector);
    return readSelectableIdFromElement(pill);
  };

  const fromRootPill = readPillId(root);
  if (fromRootPill) return fromRootPill;

  const fromFallbackPill = readPillId(fallback);
  if (fromFallbackPill) return fromFallbackPill;

  return "";
}

function getMultiSelectedIds(
  containerEl,
  {
    checkboxSelector = 'input[type="checkbox"]:checked, input[type="radio"]:checked',
    pillActiveSelector = DEFAULT_ACTIVE_PILL_SELECTOR,
  } = {}
) {
  const root = resolveUiElement(containerEl);
  if (!root || typeof root.querySelectorAll !== "function") return [];

  const fromInputs = Array.from(root.querySelectorAll(checkboxSelector))
    .map((el) => readSelectableIdFromElement(el))
    .filter(Boolean);
  if (fromInputs.length) return dedupePreserveOrder(fromInputs);

  const fromPills = Array.from(root.querySelectorAll(pillActiveSelector))
    .map((el) => readSelectableIdFromElement(el))
    .filter(Boolean);
  return dedupePreserveOrder(fromPills);
}

function getCheckedIds(containerEl) {
  return getMultiSelectedIds(containerEl, {
    checkboxSelector: 'input[type="checkbox"]:checked',
  });
}

async function copyText(text) {
  const value = String(text || "");

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fallback below
    }
  }

  try {
    const tempTextarea = document.createElement("textarea");
    tempTextarea.value = value;
    tempTextarea.setAttribute("readonly", "");
    tempTextarea.style.position = "fixed";
    tempTextarea.style.opacity = "0";
    tempTextarea.style.pointerEvents = "none";
    tempTextarea.style.left = "-9999px";
    document.body.appendChild(tempTextarea);

    tempTextarea.focus();
    tempTextarea.select();
    tempTextarea.setSelectionRange(0, tempTextarea.value.length);
    const copied = document.execCommand("copy");
    document.body.removeChild(tempTextarea);
    return Boolean(copied);
  } catch {
    return false;
  }
}

function setCopyStatus(message) {
  const el = $("copyStatus");
  if (!el) return;
  el.textContent = String(message || "");
}

function setParserStatus(message) {
  const el = $(PARSER_STATUS_ID);
  if (!el) return;
  el.textContent = String(message || "");
}

function currentRatingValue() {
  if ($("ratingExplicit")?.checked) return "explicit";
  if ($("ratingNsfw")?.checked) return "nsfw";
  if ($("ratingSuggestive")?.checked) return "suggestive";
  return "sfw";
}

function readUiSelectionState() {
  const styleModifierSelection = getMultiSelectedIds($("styleModifiers"));
  const compositionSelection = getMultiSelectedIds($("compositionToggles"));
  return {
    rating: currentRatingValue(),
    rawHelperEnabled: $("rawHelperToggle")?.checked ?? RAW_HELPER_DEFAULT_ENABLED,
    presetId: getSingleSelectedId($("presetPicker"), {
      fallbackSelectId: "presetPicker",
      radioName: "presetPicker",
    }),
    styleModifierIds: styleModifierSelection.length ? [styleModifierSelection[0]] : [],
    cameraFramingId: getSingleSelectedId($("cameraFraming"), {
      fallbackSelectId: "cameraFraming",
      radioName: "cameraFraming",
    }),
    cameraAngleId: getSingleSelectedId($("cameraAngle"), {
      fallbackSelectId: "cameraAngle",
      radioName: "cameraAngle",
    }),
    compositionToggleIds: dedupePreserveOrder(compositionSelection),
    lightingId: getSingleSelectedId($("lighting"), {
      fallbackSelectId: "lighting",
      radioName: "lighting",
    }),
    timeOfDayId: getSingleSelectedId($("timeOfDay"), {
      fallbackSelectId: "timeOfDay",
      radioName: "timeOfDay",
    }),
  };
}

function ratingPositiveTag(rating) {
  if (rating === "sfw") return "rating_safe";
  if (rating === "suggestive") return "rating_questionable";
  if (rating === "nsfw") return "nsfw";
  if (rating === "explicit") return "rating_explicit";
  return "rating_safe";
}

function ratingSuppressionTags(rating, hasNsfwIntent) {
  if (hasNsfwIntent) return [];
  if (rating === "sfw") return NEGATIVE_SFW_SUPPRESS;
  if (rating === "suggestive") return NEGATIVE_SUGGESTIVE_SUPPRESS;
  return [];
}

function detectHighestPositiveTier(positiveText) {
  const text = String(positiveText || "").toLowerCase();
  if (/\bscore_9\b/.test(text)) return 9;
  if (/\bscore_8_up\b/.test(text)) return 8;
  if (/\bscore_7_up\b/.test(text)) return 7;
  if (/\bscore_6_up\b/.test(text)) return 6;
  if (/\bscore_5_up\b/.test(text)) return 5;
  return 9;
}

function buildNegativeScoreBlockFromPositive(positiveText) {
  const tier = detectHighestPositiveTier(positiveText);
  return NEGATIVE_SCORE_BLOCK_BY_TIER[tier] || [];
}

function extractMatcherTags(matcher, text) {
  const userText = String(text || "");
  if (!userText || !matcher || typeof matcher.extract !== "function") return [];
  const cacheBucket = getOrCreateWeakMemoBucket(MATCHER_TAG_CACHE_BY_MATCHER, matcher);
  return memoizeMapValue(
    cacheBucket,
    userText,
    () => {
      const result = matcher.extract(userText);
      const matched = Array.isArray(result?.matchedTags) ? result.matchedTags : [];
      return dedupePreserveOrder(matched);
    },
    MATCHER_RESULT_CACHE_LIMIT
  );
}

function extractTagsBySourcePrecedence({
  matcher,
  text,
  preparedAliases,
  sourcePreparedEntries,
}) {
  const out = [];
  const seen = new Set();
  const appendTags = (tags) => {
    for (const tag of tags || []) {
      const value = String(tag || "").trim();
      if (!value) continue;
      const lower = value.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      out.push(value);
    }
  };

  // Enforce source matching precedence before cat0 fallback:
  // environment -> camera -> lighting -> composition -> clothing -> actions -> character -> props
  for (const prepared of sourcePreparedEntries || []) {
    if (!Array.isArray(prepared) || !prepared.length) continue;
    appendTags(extractTagsFromPhraseEntries(text, prepared));
  }

  appendTags(extractTagsFromPhraseEntries(text, preparedAliases));
  appendTags(extractMatcherTags(matcher, text));
  return out;
}

function inferExplicitTagRouteBlock(tag, blockCategorySets = {}) {
  const lower = String(tag || "").trim().toLowerCase();
  if (!lower) return "";
  if (isBodySizeTraitTag(lower)) return "character";

  const categoryTagSets = blockCategorySets.categoryTagSets || {};
  const categoryToBlock = blockCategorySets.categoryToBlock || {};
  const categoryPriority = Array.isArray(blockCategorySets.categoryPriority)
    ? blockCategorySets.categoryPriority
    : ROUTING_CATEGORY_PRIORITY;

  for (const category of categoryPriority) {
    const set = categoryTagSets?.[category];
    if (!(set instanceof Set)) continue;
    if (!set.has(lower)) continue;
    const route = String(categoryToBlock?.[category] || "").trim();
    if (route) return route;
  }

  return "";
}

function blockTypeAcceptsRoute(blockType, routeBlock) {
  const normalizedBlock = String(blockType || "").trim().toLowerCase();
  const normalizedRoute = String(routeBlock || "").trim().toLowerCase();
  if (!normalizedBlock || !normalizedRoute) return false;
  return normalizedBlock === normalizedRoute;
}

function inferTagRouteBlock(tag, blockCategorySets = {}) {
  const lower = String(tag || "").trim().toLowerCase();
  if (!lower) return "";

  const explicitRoute = inferExplicitTagRouteBlock(lower, blockCategorySets);
  if (explicitRoute) return explicitRoute;

  const env = blockCategorySets.environment || new Set();
  const cam = blockCategorySets.camera || new Set();
  const light = blockCategorySets.lighting || new Set();
  const comp = blockCategorySets.composition || new Set();
  const action = blockCategorySets.action || new Set();
  const interaction = blockCategorySets.interaction || new Set();
  const clothes = blockCategorySets.clothing || new Set();
  const charTrait = blockCategorySets.character || new Set();
  const props = blockCategorySets.props || new Set();

  if (props.has(lower)) return "props";
  if (env.has(lower)) return "environment";
  if (cam.has(lower) || light.has(lower)) return "cameraLighting";
  if (comp.has(lower)) return "composition";
  if (interaction.has(lower)) return "interaction";
  if (action.has(lower)) return "actions";
  if (clothes.has(lower) || charTrait.has(lower)) return "character";
  return "";
}

function validateTagForBlock(tag, blockType, blockCategorySets = {}) {
  const lower = String(tag || "").trim().toLowerCase();
  if (!lower) return false;

  const explicitRoute = inferExplicitTagRouteBlock(lower, blockCategorySets);
  if (explicitRoute) {
    return blockTypeAcceptsRoute(blockType, explicitRoute);
  }

  const env = blockCategorySets.environment || new Set();
  const cam = blockCategorySets.camera || new Set();
  const light = blockCategorySets.lighting || new Set();
  const comp = blockCategorySets.composition || new Set();
  const action = blockCategorySets.action || new Set();
  const interaction = blockCategorySets.interaction || new Set();
  const clothes = blockCategorySets.clothing || new Set();
  const charTrait = blockCategorySets.character || new Set();
  const props = blockCategorySets.props || new Set();

  switch (String(blockType || "").toLowerCase()) {
    case "character":
      if (env.has(lower) || cam.has(lower) || light.has(lower) || comp.has(lower)) {
        return false;
      }
      return true;
    case "environment":
      if (action.has(lower) || interaction.has(lower) || clothes.has(lower) || props.has(lower)) {
        return false;
      }
      return true;
    case "actions":
      if (interaction.has(lower)) return false;
      if (env.has(lower) || cam.has(lower) || light.has(lower) || comp.has(lower)) {
        return false;
      }
      return true;
    case "interaction":
      if (env.has(lower) || cam.has(lower) || light.has(lower) || comp.has(lower)) {
        return false;
      }
      if (action.has(lower) || clothes.has(lower) || charTrait.has(lower) || props.has(lower)) {
        return false;
      }
      return true;
    case "props":
      if (env.has(lower) || cam.has(lower) || light.has(lower) || comp.has(lower)) {
        return false;
      }
      if (action.has(lower) || interaction.has(lower) || charTrait.has(lower) || clothes.has(lower)) {
        return false;
      }
      return true;
    case "composition":
      if (env.has(lower) || cam.has(lower) || light.has(lower) || action.has(lower)) {
        return false;
      }
      return true;
    case "cameralighting":
      if (action.has(lower) || interaction.has(lower) || clothes.has(lower) || charTrait.has(lower)) {
        return false;
      }
      if (props.has(lower) || env.has(lower) || comp.has(lower)) {
        return false;
      }
      return true;
    default:
      return true;
  }
}

function inferPeopleCountHint(tags) {
  let maxCount = 0;
  for (const tag of tags || []) {
    const m = String(tag).match(/^(\d+)(girls|boys)$/i);
    if (!m) continue;
    const count = Number(m[1]);
    if (Number.isFinite(count) && count > maxCount) {
      maxCount = count;
    }
  }
  return maxCount;
}

function extractInlineGroupTagsFromText(userText) {
  const normalized = normalizeLooseText(userText);
  if (!normalized) return [];

  const tags = [];
  const regex = /\b(\d+)\s*(girls|boys)\b/gi;
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    tags.push(`${match[1]}${match[2].toLowerCase()}`);
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return dedupePreserveOrder(tags);
}

function cleanSegmentText(text) {
  return String(text || "")
    .replace(/^[\s,;:.!?"'()[\]{}-]+|[\s,;:.!?"'()[\]{}-]+$/g, "")
    .replace(/\band$/i, "")
    .trim();
}

function findNextNonSpace(text, index) {
  let i = index;
  while (i < text.length && text[i] === " ") i += 1;
  return i;
}

function findPrevNonSpace(text, index) {
  let i = index;
  while (i >= 0 && text[i] === " ") i -= 1;
  return i;
}

function isWordBoundaryChar(ch) {
  return !/[a-z0-9]/.test(ch || "");
}

function findPhraseMatchesInSplitText(text, phraseRegex) {
  const matches = [];
  const regex = new RegExp(phraseRegex.source, "gi");
  let match;
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const prev = start === 0 ? " " : text[start - 1];
    const next = end >= text.length ? " " : text[end];
    if (isWordBoundaryChar(prev) && isWordBoundaryChar(next)) {
      matches.push({ start, end, text: match[0] });
    }
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return matches;
}

function advancePastMarkerAndIntro(text, markerEnd) {
  let i = findNextNonSpace(text, markerEnd);
  if (i < text.length && SPLIT_INTRO_PUNCT.has(text[i])) {
    i += 1;
  }
  return findNextNonSpace(text, i);
}

function findSplitPointInMaskedText(maskTextForSplit) {
  const text = String(maskTextForSplit || "");
  if (!text.trim()) return null;

  const pairMatches = findPhraseMatchesInSplitText(text, /one[\s\S]*?the\s+other/gi);
  for (const pair of pairMatches) {
    const localOther = /the\s+other/i.exec(pair.text);
    const localOne = /\bone\b/i.exec(pair.text);
    if (!localOther || !localOne) continue;

    const markerStart = pair.start + localOther.index;
    const markerEnd = markerStart + localOther[0].length;
    if (markerStart > SPLIT_MARKER_LIMIT) continue;

    const nextAfterOther = text.slice(markerEnd).replace(/^\s+/, "");
    if (/^hand\b/i.test(nextAfterOther)) continue;

    const oneStart = pair.start + localOne.index;
    const oneEnd = oneStart + localOne[0].length;
    const char2Start = advancePastMarkerAndIntro(text, markerEnd);

    return {
      markerStart,
      markerEnd,
      char1Start: oneEnd,
      char1End: markerStart,
      char2Start,
    };
  }

  const fallbackPhraseDefs = [
    { regex: /the\s+other/gi, order: 0 },
    { regex: /\banother\b/gi, order: 1 },
    { regex: /\bsecond\b/gi, order: 2 },
    { regex: /\bother\b/gi, order: 3 },
  ];

  const candidates = [];
  for (const phraseDef of fallbackPhraseDefs) {
    const phraseMatches = findPhraseMatchesInSplitText(text, phraseDef.regex);
    for (const match of phraseMatches) {
      if (match.start > SPLIT_MARKER_LIMIT) continue;

      const prevIdx = findPrevNonSpace(text, match.start - 1);
      const prevChar = prevIdx >= 0 ? text[prevIdx] : "";
      const startsSentence = prevIdx < 0 || prevChar === "." || prevChar === "\n";
      if (!startsSentence) continue;

      const introIdx = findNextNonSpace(text, match.end);
      const introChar = introIdx < text.length ? text[introIdx] : "";
      if (!SPLIT_INTRO_PUNCT.has(introChar)) continue;

      candidates.push({
        order: phraseDef.order,
        markerStart: match.start,
        markerEnd: match.end,
        char1Start: 0,
        char1End: match.start,
        char2Start: findNextNonSpace(text, introIdx + 1),
      });
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    if (a.markerStart !== b.markerStart) return a.markerStart - b.markerStart;
    return a.order - b.order;
  });
  return candidates[0];
}

function splitIntoTwoCharacterSegments(userText, maskTextForSplit) {
  const splitPoint = findSplitPointInMaskedText(maskTextForSplit);
  if (!splitPoint) return null;

  const raw = String(userText || "");
  const len = raw.length;
  const char1Start = Math.max(0, Math.min(len, splitPoint.char1Start));
  const char1End = Math.max(char1Start, Math.min(len, splitPoint.char1End));
  const char2Start = Math.max(0, Math.min(len, splitPoint.char2Start));

  const char1Text = cleanSegmentText(raw.slice(char1Start, char1End));
  const char2Text = cleanSegmentText(raw.slice(char2Start));
  if (!char1Text || !char2Text) return null;

  return {
    char1Text,
    char2Text,
    char1StartRaw: char1Start,
    char1EndRaw: char1End,
    char2StartRaw: char2Start,
  };
}

function splitByRelationalPartnerCue(userText) {
  const raw = String(userText || "");
  if (!raw.trim()) return null;

  const markerMatch = /\b(?:and|while|but)\s+(?:her|his|their)\s+(?:girlfriend|boyfriend)\b/i.exec(
    raw
  );
  if (!markerMatch) return null;

  const markerStart = Math.max(0, Number(markerMatch.index) || 0);
  const char1Text = cleanSegmentText(raw.slice(0, markerStart));
  const char2Text = cleanSegmentText(
    raw.slice(markerStart).replace(/^(?:\s*)(?:and|while|but)\s+/i, "")
  );
  if (!char1Text || !char2Text) return null;

  return {
    char1Text,
    char2Text,
  };
}

function buildPeopleTagsFromCounts(girlsCount, boysCount) {
  const tags = [];
  if (girlsCount > 0) {
    tags.push(girlsCount === 1 ? "1girl" : `${girlsCount}girls`);
  }
  if (boysCount > 0) {
    tags.push(boysCount === 1 ? "1boy" : `${boysCount}boys`);
  }
  return tags;
}

function extractCharacterMatchesWithRawOffsets(userText, charactersPrepared) {
  const spans = extractTagsWithRawSpans(userText, charactersPrepared).spans || [];
  if (!spans.length) return [];

  const matches = [];
  for (const span of spans) {
    const rawStart = Number(span?.start);
    const rawEnd = Number(span?.end);
    if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd) || rawEnd <= rawStart) continue;

    matches.push({
      tag: String(span?.tag || ""),
      rawStart,
      rawEnd,
    });
  }

  matches.sort((a, b) => {
    if (a.rawStart !== b.rawStart) return a.rawStart - b.rawStart;
    return a.rawEnd - b.rawEnd;
  });
  return matches;
}

function isKnownCharacterSeparator(textBetween) {
  const raw = String(textBetween || "");
  if (!raw.trim()) return false;

  const hasDelimiter = /,|&|\+|\band\b|\bx\b/i.test(raw);
  if (!hasDelimiter) return false;

  const remainder = raw
    .toLowerCase()
    .replace(/\band\b/g, " ")
    .replace(/\bx\b/g, " ")
    .replace(/[,&+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return remainder.length === 0;
}

const KNOWN_CHARACTER_FIRST_ORDINAL_RE =
  /(^|[^a-z0-9])(first|1st|one|#1|1\)|1\.)(?=$|[^a-z0-9])/gi;
const KNOWN_CHARACTER_SECOND_ORDINAL_RE =
  /(^|[^a-z0-9])(second|2nd|two|#2|2\)|2\.)(?=$|[^a-z0-9])/gi;

function selectDistinctKnownCharacterAnchors(matches) {
  const out = [];
  const seenTags = new Set();
  for (const match of matches || []) {
    const tag = String(match?.tag || "").trim();
    const lowerTag = tag.toLowerCase();
    if (!tag || seenTags.has(lowerTag)) continue;
    seenTags.add(lowerTag);
    out.push({
      tag,
      rawStart: Number(match?.rawStart),
      rawEnd: Number(match?.rawEnd),
    });
  }
  return out.filter(
    (anchor) =>
      Number.isFinite(anchor.rawStart) &&
      Number.isFinite(anchor.rawEnd) &&
      anchor.rawEnd > anchor.rawStart
  );
}

function collectOrdinalMarkerPositions(rawText, markerRegex) {
  const text = String(rawText || "");
  const regex = new RegExp(markerRegex.source, markerRegex.flags);
  const out = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const prefix = String(match[1] || "");
    const marker = String(match[2] || "");
    const markerStart = match.index + prefix.length;
    if (marker && markerStart >= 0) out.push(markerStart);
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }

  return out;
}

function findNearestMatchIndexToMarkers(matches, markerPositions, maxDistance = 120) {
  if (!matches.length || !markerPositions.length) return -1;

  let bestMatchIdx = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < matches.length; i += 1) {
    const matchStart = Number(matches[i]?.rawStart);
    if (!Number.isFinite(matchStart)) continue;

    for (const markerPos of markerPositions) {
      const distance = Math.abs(matchStart - Number(markerPos));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatchIdx = i;
      }
    }
  }

  if (!Number.isFinite(bestDistance) || bestDistance > maxDistance) return -1;
  return bestMatchIdx;
}

function isPureKnownCharacterListInput(rawText, anchors) {
  const raw = String(rawText || "");
  if ((anchors || []).length < 2) return false;

  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (/[a-z0-9]/i.test(raw.slice(0, first.rawStart))) return false;
  if (/[a-z0-9]/i.test(raw.slice(last.rawEnd))) return false;

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const between = raw.slice(anchors[i].rawEnd, anchors[i + 1].rawStart);
    if (!isKnownCharacterSeparator(between)) return false;
  }
  return true;
}

function hasKnownCharacterSplitCue(rawText, anchors) {
  const raw = String(rawText || "");
  if ((anchors || []).length < 2) return false;

  if (isPureKnownCharacterListInput(raw, anchors)) return true;

  const peopleCountTags = inferPeopleCountTagsFromText(raw);
  if (peopleCountTags.some((tag) => /^([2-9]\d*)(girls|boys)$/i.test(String(tag || "")))) {
    return true;
  }
  const normalized = normalizeLooseText(raw);
  if (/\b(\d+|two|three|four|five)\s+(people|persons|characters)\b/i.test(normalized)) {
    return true;
  }

  const firstMarkers = collectOrdinalMarkerPositions(raw, KNOWN_CHARACTER_FIRST_ORDINAL_RE);
  const secondMarkers = collectOrdinalMarkerPositions(raw, KNOWN_CHARACTER_SECOND_ORDINAL_RE);
  if (firstMarkers.length && secondMarkers.length) return true;

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const between = raw.slice(anchors[i].rawEnd, anchors[i + 1].rawStart);
    if (!between.trim()) continue;
    if (/(^|[^a-z0-9])(and|x)(?=$|[^a-z0-9])/i.test(between)) return true;
    if (/&|\+/.test(between)) return true;
    if (/[.;\n]/.test(between)) return true;
  }
  return false;
}

function selectKnownCharacterAnchorsByOrdinalMarkers(rawText, anchors) {
  const raw = String(rawText || "");
  if ((anchors || []).length < 2) return null;

  const firstMarkers = collectOrdinalMarkerPositions(raw, KNOWN_CHARACTER_FIRST_ORDINAL_RE);
  const secondMarkers = collectOrdinalMarkerPositions(raw, KNOWN_CHARACTER_SECOND_ORDINAL_RE);
  if (!firstMarkers.length || !secondMarkers.length) return null;

  const hasOrderedMarkers = firstMarkers.some((firstPos) =>
    secondMarkers.some((secondPos) => secondPos > firstPos)
  );
  if (!hasOrderedMarkers) return null;

  const firstMatchIdx = findNearestMatchIndexToMarkers(anchors, firstMarkers);
  const secondMatchIdx = findNearestMatchIndexToMarkers(anchors, secondMarkers);
  if (firstMatchIdx < 0 || secondMatchIdx < 0 || firstMatchIdx === secondMatchIdx) {
    return null;
  }

  const out = [anchors[firstMatchIdx], anchors[secondMatchIdx]];
  const picked = new Set([firstMatchIdx, secondMatchIdx]);
  for (let i = 0; i < anchors.length; i += 1) {
    if (picked.has(i)) continue;
    out.push(anchors[i]);
  }
  return out;
}

function findRefinedBoundaryBeforeNextAnchor(rawText, currentAnchorEnd, nextAnchorStart) {
  const raw = String(rawText || "");
  const from = Math.max(0, Math.min(raw.length, Number(currentAnchorEnd) || 0));
  const to = Math.max(from, Math.min(raw.length, Number(nextAnchorStart) || 0));
  if (to <= from) return to;

  const windowStart = Math.max(from, to - 60);
  const windowText = raw.slice(windowStart, to);
  const clauseBoundaryRegex = /(?:\band\b|[;\.\n])/gi;
  let match;
  let boundaryIdx = -1;

  while ((match = clauseBoundaryRegex.exec(windowText)) !== null) {
    boundaryIdx = windowStart + match.index;
    if (match.index === clauseBoundaryRegex.lastIndex) clauseBoundaryRegex.lastIndex += 1;
  }

  if (!Number.isFinite(boundaryIdx) || boundaryIdx < from || boundaryIdx >= to) {
    return to;
  }
  return boundaryIdx;
}

function buildKnownCharacterSegments(rawText, anchors) {
  const raw = String(rawText || "");
  const out = [];

  for (let i = 0; i < (anchors || []).length; i += 1) {
    const anchor = anchors[i];
    const start = Math.max(0, Math.min(raw.length, Number(anchor.rawStart) || 0));
    const nextStart =
      i + 1 < anchors.length
        ? Math.max(0, Math.min(raw.length, Number(anchors[i + 1].rawStart) || raw.length))
        : raw.length;
    const defaultEnd = i + 1 < anchors.length ? nextStart : raw.length;
    const refinedEnd =
      i + 1 < anchors.length
        ? findRefinedBoundaryBeforeNextAnchor(raw, Number(anchor.rawEnd) || start, nextStart)
        : defaultEnd;
    const end = Math.max(start, Math.min(defaultEnd, refinedEnd));

    let segmentText = cleanSegmentText(raw.slice(start, end));
    if (!segmentText) {
      segmentText = cleanSegmentText(raw.slice(start, defaultEnd));
    }
    if (!segmentText) {
      segmentText = String(anchor.tag || "").replace(/_/g, " ");
    }

    out.push({
      label: `char${out.length + 1}`,
      text: segmentText,
      characterTag: String(anchor.tag || "").trim(),
    });
  }

  return out.filter((segment) => String(segment.text || "").trim());
}

function stripKnownCharacterMentionsExceptTag(rawSegmentText, charactersPrepared, keepTag) {
  const raw = String(rawSegmentText || "");
  const keep = String(keepTag || "").toLowerCase().trim();
  if (!raw.trim() || !keep) return raw;

  const matches = extractCharacterMatchesWithRawOffsets(raw, charactersPrepared);
  if (!matches.length) return raw;

  const chars = Array.from(raw);
  for (const match of matches) {
    const matchTag = String(match?.tag || "").toLowerCase().trim();
    if (!matchTag || matchTag === keep) continue;
    const start = Math.max(0, Math.min(chars.length, Number(match?.rawStart) || 0));
    const end = Math.max(start, Math.min(chars.length, Number(match?.rawEnd) || start));
    for (let i = start; i < end; i += 1) chars[i] = " ";
  }
  return chars.join("");
}

function inferKnownCharacterGender(tag, knownFemaleCharacterTagSet) {
  const lower = String(tag || "").toLowerCase().trim();
  if (!lower) return "unknown";

  if (/(^|[^a-z])male([^a-z]|$)/.test(lower)) return "boy";
  if (/(^|[^a-z])female([^a-z]|$)/.test(lower)) return "girl";
  if (knownFemaleCharacterTagSet?.has(lower)) return "girl";
  return "unknown";
}

function splitKnownCharactersIntoSegments(userText, charactersPrepared, knownFemaleCharacterTagSet) {
  const raw = String(userText || "");
  if (!raw.trim()) return null;

  const matches = extractCharacterMatchesWithRawOffsets(raw, charactersPrepared);
  if (matches.length < 2) return null;
  const anchors = selectDistinctKnownCharacterAnchors(matches);
  if (anchors.length < 2) return null;
  if (!hasKnownCharacterSplitCue(raw, anchors)) return null;

  const ordinalOrderedAnchors = selectKnownCharacterAnchorsByOrdinalMarkers(raw, anchors);
  const selectedAnchors = ordinalOrderedAnchors || anchors;
  const segments = buildKnownCharacterSegments(raw, selectedAnchors);
  if (segments.length < 2) return null;

  const genders = [];
  for (const segment of segments) {
    genders.push(
      inferKnownCharacterGender(segment.characterTag, knownFemaleCharacterTagSet)
    );
  }

  let girlsCount = genders.filter((gender) => gender === "girl").length;
  let boysCount = genders.filter((gender) => gender === "boy").length;
  const unknownCount = genders.filter((gender) => gender !== "girl" && gender !== "boy").length;

  if (girlsCount === 0 && boysCount === 0) {
    girlsCount = segments.length;
  } else if (girlsCount > 0 && boysCount === 0) {
    girlsCount += unknownCount;
  } else if (boysCount > 0 && girlsCount === 0) {
    boysCount += unknownCount;
  }

  return {
    segments,
    peopleTags: buildPeopleTagsFromCounts(girlsCount, boysCount),
  };
}

function splitTextIntoSentences(userText) {
  const raw = String(userText || "");
  if (!raw.trim()) return [];

  const out = [];
  const paragraphs = raw.split(/\r?\n+/);
  for (const paragraph of paragraphs) {
    const trimmed = String(paragraph || "").trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/[.?!]+/);
    for (const part of parts) {
      const sentence = String(part || "").trim();
      if (sentence) out.push(sentence);
    }
  }
  return out;
}

function parseNumberToken(rawToken) {
  const token = String(rawToken || "").toLowerCase().trim();
  if (!token) return 0;
  if (/^\d+$/.test(token)) return Number(token);
  return Number(NUMBER_WORD_TO_VALUE[token] || 0);
}

function parseOrdinalTokenToIndex(rawToken) {
  const token = String(rawToken || "").toLowerCase().trim();
  if (!token) return 0;
  if (ORDINAL_INDEX_BY_WORD[token]) return Number(ORDINAL_INDEX_BY_WORD[token]);
  const numericMatch = token.match(/^(\d+)(st|nd|rd|th)$/);
  if (!numericMatch) return 0;
  const value = Number(numericMatch[1]);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value;
}

function extractOrdinalIndexFromNormalizedText(normalizedText) {
  const normalized = String(normalizedText || "").toLowerCase();
  if (!normalized) return 0;
  const match = new RegExp(`\\b${ORDINAL_TOKEN_PATTERN}\\b`, "i").exec(normalized);
  if (!match) return 0;
  return parseOrdinalTokenToIndex(match[1]);
}

function normalizeHairAdjectiveAliases(text) {
  const source = applyControlledSourceTextNormalization(String(text || ""));
  return source
    .replace(/cum\s+on\s+(?:her|his|the)\s+([a-z_]+)/gi, "cum on $1")
    .replace(/cum\s+in\s+(?:her|his|the)\s+([a-z_]+)/gi, "cum in $1")
    .replace(/\b(a|an)\s+(woman|man|girl|boy)\b/gi, "one $2");
}

function buildGlobalActionSuppressionTagSet(actionTags) {
  const emittedActions = buildTagSet(actionTags || []);
  const suppressed = new Set();
  for (const group of ACTION_EQUIVALENCE_GROUPS) {
    const lowered = (group || []).map((tag) => String(tag || "").toLowerCase()).filter(Boolean);
    if (!lowered.length) continue;
    if (!lowered.some((tag) => emittedActions.has(tag))) continue;
    for (const tag of lowered) suppressed.add(tag);
  }
  const emittedActionList = Array.from(emittedActions);
  if (emittedActionList.some((tag) => /^holding_[a-z0-9_]+$/.test(String(tag || "")))) {
    suppressed.add("holding");
  }
  return suppressed;
}

function normalizeEntityGenderHint(rawValue) {
  const value = String(rawValue || "").toLowerCase().trim();
  if (!value) return "";
  if (value === "girl" || value === "woman" || value === "female") return "girl";
  if (value === "boy" || value === "man" || value === "male") return "boy";
  return "";
}

function explicitNounToKind(nounRaw) {
  const noun = String(nounRaw || "").toLowerCase().trim();
  if (!noun) return "";
  if (noun === "women" || noun === "woman" || noun === "girls" || noun === "girl") return "girl";
  if (noun === "girlfriend" || noun === "girlfriends") return "girl";
  if (noun === "men" || noun === "man" || noun === "boys" || noun === "boy") return "boy";
  if (noun === "boyfriend" || noun === "boyfriends") return "boy";
  if (
    noun === "people" ||
    noun === "persons" ||
    noun === "person" ||
    noun === "characters" ||
    noun === "character"
  ) {
    return "person";
  }
  return "";
}

function inferArticleEntityGenderHints(userText) {
  const normalized = normalizeLooseText(userText);
  if (!normalized) return [];
  const out = [];
  const regex =
    /\b(a|an|one)\s+(?:(?!and\b|or\b|with\b|another\b)[a-z0-9]+\s+){0,2}(woman|girl|man|boy|girlfriend|boyfriend)\b/gi;
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const gender = normalizeEntityGenderHint(match[2] || match[3]);
    if (gender === "girl" || gender === "boy") out.push(gender);
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return out;
}

function inferMixedKnownGenericEntityHint(userText, knownCharacterCount) {
  const articleGenderHints = inferArticleEntityGenderHints(userText);
  const hasHint = Number(knownCharacterCount || 0) >= 1 && articleGenderHints.length >= 1;
  return {
    hasHint,
    minEntityCount: hasHint ? Math.max(2, Number(knownCharacterCount || 0) + 1) : 0,
    additionalGender: hasHint ? articleGenderHints[0] : "",
  };
}

function normalizeSubjectKind(rawValue) {
  const value = String(rawValue || "").toLowerCase().trim();
  if (value === "human" || value === "nonhuman" || value === "unknown") return value;
  return "";
}

function hasHumanEntityCueInNormalizedText(normalizedText) {
  const normalized = String(normalizedText || "").toLowerCase();
  if (!normalized) return false;
  return /\b(women|woman|girls|girl|men|man|boys|boy|person|people|character|characters|girlfriend|boyfriend|knight|knights|warrior|warriors|rider|riders|she|her|he|his|him)\b/.test(
    normalized
  );
}

function shouldSuppressKnightChessTagInRidingContext(text) {
  const normalized = normalizeLooseText(text);
  if (!normalized) return false;
  if (!/\bknight\b/.test(normalized)) return false;
  return /\b(ride|rides|riding|mounted|mounting)\b/.test(normalized);
}

function canonicalizeNonHumanEntityNoun(rawNoun) {
  const noun = String(rawNoun || "").toLowerCase().trim();
  if (!noun) return "";
  if (noun === "dogs") return "dog";
  if (noun === "cats") return "cat";
  if (noun === "foxes") return "fox";
  if (noun === "wolves") return "wolf";
  if (noun === "dragons") return "dragon";
  if (noun === "horses") return "horse";
  if (noun === "griffins") return "griffin";
  if (noun === "animals") return "animal";
  if (noun === "pets") return "pet";
  if (noun === "creatures") return "creature";
  if (noun === "beasts") return "beast";
  return noun;
}

const NON_HUMAN_STATE_ACTION_TOKEN_TO_TAG = Object.freeze({
  lying: "lying",
  lie: "lying",
  lies: "lying",
  sleeping: "sleeping",
  sleep: "sleeping",
  sleeps: "sleeping",
  standing: "standing",
  stand: "standing",
  stands: "standing",
  sitting: "sitting",
  sit: "sitting",
  sits: "sitting",
  walking: "walking",
  walk: "walking",
  walks: "walking",
  running: "running",
  run: "running",
  runs: "running",
  kneeling: "kneeling",
  kneel: "kneeling",
  kneels: "kneeling",
  crouching: "crouching",
  crouch: "crouching",
  crouches: "crouching",
  flying: "flying",
  fly: "flying",
  flies: "flying",
  howling: "howling",
  howl: "howling",
  howls: "howling",
});
const SEMANTIC_ROLE_TOKEN_TO_TAG = Object.freeze({
  ...NON_HUMAN_STATE_ACTION_TOKEN_TO_TAG,
  lean: "leaning",
  leans: "leaning",
  leaning: "leaning",
  petting: "petting",
  pet: "petting",
  pets: "petting",
  riding: "riding",
  ride: "riding",
  rides: "riding",
  watching: "watching",
  watch: "watching",
  watches: "watching",
  looking: "watching",
  looks: "watching",
  seeing: "watching",
  sees: "watching",
});
const SEMANTIC_ROLE_TOKEN_PATTERN = Object.keys(SEMANTIC_ROLE_TOKEN_TO_TAG).join("|");
const NON_HUMAN_PLURAL_NOUN_SET = new Set([
  "dogs",
  "cats",
  "foxes",
  "wolves",
  "dragons",
  "horses",
  "griffins",
  "animals",
  "pets",
  "creatures",
  "beasts",
]);
const HUMAN_GENDER_NOUN_TOKEN_TO_GENDER = Object.freeze({
  woman: "girl",
  women: "girl",
  girl: "girl",
  girls: "girl",
  female: "girl",
  man: "boy",
  men: "boy",
  boy: "boy",
  boys: "boy",
  male: "boy",
});
const OBSERVER_ROLE_VERB_REGEX = /\b(?:watching|watch|watches|looking\s+at|look\s+at|looks\s+at|seeing|see|sees)\b/i;
const RIDER_ROLE_VERB_REGEX = /\b(?:riding|ride|rides|mounted|mounting)\b/i;
const MOUNT_LOCOMOTION_TAG_SET = new Set([
  "flying",
  "running",
  "walking",
  "standing",
  "sitting",
  "sleeping",
  "lying",
  "kneeling",
  "crouching",
  "howling",
]);

function extractSemanticRoleTagsFromText(text) {
  const normalized = normalizeLooseText(text);
  if (!normalized) return [];
  const regex = new RegExp(`\\b(${SEMANTIC_ROLE_TOKEN_PATTERN})\\b`, "gi");
  const out = [];
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const token = String(match[1] || "").toLowerCase().trim();
    const mapped = SEMANTIC_ROLE_TOKEN_TO_TAG[token];
    if (mapped) out.push(mapped);
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return dedupePreserveOrder(out);
}

function extractNonHumanStatePoseMentionsFromText(text) {
  const normalized = normalizeLooseText(text);
  if (!normalized) return [];
  const tokenToPoseTag = {
    lying: "lying",
    lie: "lying",
    lies: "lying",
    sleeping: "sleeping",
    sleep: "sleeping",
    sleeps: "sleeping",
    standing: "standing",
    stand: "standing",
    stands: "standing",
    sitting: "sitting",
    sit: "sitting",
    sits: "sitting",
    walking: "walking",
    walk: "walking",
    walks: "walking",
    running: "running",
    run: "running",
    runs: "running",
    kneeling: "kneeling",
    kneel: "kneeling",
    kneels: "kneeling",
    crouching: "crouching",
    crouch: "crouching",
    crouches: "crouching",
    perched: "perched",
    perches: "perched",
    curl: "curled_up",
    curled: "curled_up",
    curls: "curled_up",
  };
  const actionTokenPattern = Object.keys(tokenToPoseTag).join("|");
  const out = [];
  const regex = new RegExp(
    `\\b(?:(her|his|their|the|a|an|one)\\s+)?(?:(?!one\\b|the\\b|a\\b|an\\b|her\\b|his\\b|their\\b|while\\b|and\\b|but\\b|or\\b)[a-z0-9]+\\s+){0,2}(${NON_HUMAN_ENTITY_NOUN_PATTERN})(?:\\s+(?:that|which|who)\\s+)?(?:is|are|was|were|looks|seems|appears)?\\s*(${actionTokenPattern})\\b`,
    "gi"
  );
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const determiner = String(match[1] || "").toLowerCase().trim();
    const nounRaw = String(match[2] || "").toLowerCase().trim();
    const subjectTag = canonicalizeNonHumanEntityNoun(nounRaw);
    const token = String(match[3] || "").toLowerCase().trim();
    const poseTag = tokenToPoseTag[token];
    const hasSingularSelector =
      determiner === "one" ||
      ((determiner === "the" || determiner === "a" || determiner === "an") &&
        !NON_HUMAN_PLURAL_NOUN_SET.has(nounRaw));
    if (subjectTag && poseTag) {
      out.push({
        subjectTag,
        poseTag,
        determiner,
        nounRaw,
        hasSingularSelector,
      });
    }
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return out;
}

function extractNonHumanStateActionMentionsFromText(text) {
  const normalized = normalizeLooseText(text);
  if (!normalized) return [];
  const actionTokenPattern = Object.keys(NON_HUMAN_STATE_ACTION_TOKEN_TO_TAG).join("|");
  const out = [];
  const regex = new RegExp(
    `\\b(?:(her|his|their|the|a|an|one)\\s+)?(?:(?!one\\b|the\\b|a\\b|an\\b|her\\b|his\\b|their\\b|while\\b|and\\b|but\\b|or\\b)[a-z0-9]+\\s+){0,2}(${NON_HUMAN_ENTITY_NOUN_PATTERN})(?:\\s+(?:that|which|who)\\s+)?(?:is|are|was|were|looks|seems|appears)?\\s*(${actionTokenPattern})\\b`,
    "gi"
  );
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const determiner = String(match[1] || "").toLowerCase().trim();
    const nounRaw = String(match[2] || "").toLowerCase().trim();
    const subjectTag = canonicalizeNonHumanEntityNoun(nounRaw);
    const token = String(match[3] || "").toLowerCase().trim();
    const actionTag = NON_HUMAN_STATE_ACTION_TOKEN_TO_TAG[token];
    const hasSingularSelector =
      determiner === "one" ||
      ((determiner === "the" || determiner === "a" || determiner === "an") &&
        !NON_HUMAN_PLURAL_NOUN_SET.has(nounRaw));
    if (subjectTag && actionTag) {
      out.push({
        subjectTag,
        actionTag,
        determiner,
        nounRaw,
        hasSingularSelector,
      });
    }
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return out;
}

function extractLexicalNonHumanEntityTagsFromNormalizedText(normalizedText) {
  const normalized = String(normalizedText || "").toLowerCase();
  if (!normalized) return [];
  const out = [];
  const regex = new RegExp(
    `\\b(?:(?:the|a|an|her|his|their)\\s+)?(?:[a-z0-9]+\\s+){0,2}(${NON_HUMAN_ENTITY_NOUN_PATTERN})\\b`,
    "gi"
  );
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const canonical = canonicalizeNonHumanEntityNoun(match[1]);
    if (canonical) out.push(canonical);
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return dedupePreserveOrder(out);
}

function extractNonHumanStateActionSuppressionTagsFromText(text) {
  const normalized = normalizeLooseText(text);
  if (!normalized) return [];

  const actionTokenPattern = Object.keys(NON_HUMAN_STATE_ACTION_TOKEN_TO_TAG).join("|");
  const out = [];
  const regex = new RegExp(
    `\\b(?:(?:her|his|their)\\s+)?(?:[a-z0-9]+\\s+){0,2}(?:${NON_HUMAN_ENTITY_NOUN_PATTERN})(?:\\s+(?:that|which|who)\\s+)?(?:is|are|was|were|looks|seems|appears)?\\s*(${actionTokenPattern})\\b`,
    "gi"
  );
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const token = String(match[1] || "").toLowerCase().trim();
    const mapped = NON_HUMAN_STATE_ACTION_TOKEN_TO_TAG[token];
    if (mapped) out.push(mapped);
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return dedupePreserveOrder(out);
}

function extractNonHumanStateActionBindingsFromText(text) {
  const normalized = normalizeLooseText(text);
  if (!normalized) return [];

  const actionTokenPattern = Object.keys(NON_HUMAN_STATE_ACTION_TOKEN_TO_TAG).join("|");
  const seen = new Set();
  const out = [];
  const regex = new RegExp(
    `\\b(?:(?:her|his|their)\\s+)?(?:[a-z0-9]+\\s+){0,2}(${NON_HUMAN_ENTITY_NOUN_PATTERN})(?:\\s+(?:that|which|who)\\s+)?(?:is|are|was|were|looks|seems|appears)?\\s*(${actionTokenPattern})\\b`,
    "gi"
  );
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const subjectTag = canonicalizeNonHumanEntityNoun(match[1]);
    const token = String(match[2] || "").toLowerCase().trim();
    const actionTag = NON_HUMAN_STATE_ACTION_TOKEN_TO_TAG[token];
    const key = `${subjectTag}::${actionTag}`;
    if (subjectTag && actionTag && !seen.has(key)) {
      seen.add(key);
      out.push({ subjectTag, actionTag });
    }
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return out;
}

function extractAmbientActionSuppressionTagsFromText(text) {
  const normalized = normalizeLooseText(text);
  if (!normalized) return [];
  const tokenToActionTag = {
    blowing: "blowing",
    blow: "blowing",
    blows: "blowing",
    falling: "falling",
    fall: "falling",
    falls: "falling",
    drifting: "drifting",
    drift: "drifting",
    drifts: "drifting",
    swirling: "swirling",
    swirl: "swirling",
    swirls: "swirling",
  };
  const subjectPattern =
    "(?:wind|winds|breeze|breezes|air|rain|snow|fog|mist|smoke|dust|sand|leaves|leaf|water|wave|waves)";
  const actionPattern = Object.keys(tokenToActionTag).join("|");
  const out = [];
  const regex = new RegExp(
    `\\b(?:the\\s+)?${subjectPattern}\\s+(?:(?:is|are|was|were)\\s+)?(${actionPattern})\\b`,
    "gi"
  );
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const token = String(match[1] || "").toLowerCase().trim();
    const mapped = tokenToActionTag[token];
    if (mapped) out.push(mapped);
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return dedupePreserveOrder(out);
}

function extractNonHumanStatePoseBindingsFromText(text) {
  const normalized = normalizeLooseText(text);
  if (!normalized) return [];

  const tokenToPoseTag = {
    lying: "lying",
    lie: "lying",
    lies: "lying",
    sleeping: "sleeping",
    sleep: "sleeping",
    sleeps: "sleeping",
    standing: "standing",
    stand: "standing",
    stands: "standing",
    sitting: "sitting",
    sit: "sitting",
    sits: "sitting",
    walking: "walking",
    walk: "walking",
    walks: "walking",
    running: "running",
    run: "running",
    runs: "running",
    kneeling: "kneeling",
    kneel: "kneeling",
    kneels: "kneeling",
    crouching: "crouching",
    crouch: "crouching",
    crouches: "crouching",
    perched: "perched",
    perches: "perched",
    curl: "curled_up",
    curled: "curled_up",
    curls: "curled_up",
  };
  const actionTokenPattern = Object.keys(tokenToPoseTag).join("|");
  const seen = new Set();
  const out = [];
  const regex = new RegExp(
    `\\b(?:(?:her|his|their)\\s+)?(?:[a-z0-9]+\\s+){0,2}(${NON_HUMAN_ENTITY_NOUN_PATTERN})(?:\\s+(?:that|which|who)\\s+)?(?:is|are|was|were|looks|seems|appears)?\\s*(${actionTokenPattern})\\b`,
    "gi"
  );
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const subjectTag = canonicalizeNonHumanEntityNoun(match[1]);
    const token = String(match[2] || "").toLowerCase().trim();
    const poseTag = tokenToPoseTag[token];
    const key = `${subjectTag}::${poseTag}`;
    if (subjectTag && poseTag && !seen.has(key)) {
      seen.add(key);
      out.push({ subjectTag, poseTag });
    }
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return out;
}

function extractOwnedNonHumanSubjectTagsFromNormalizedText(normalizedText) {
  const normalized = String(normalizedText || "").toLowerCase();
  if (!normalized) return [];
  const out = [];
  const regex = new RegExp(
    `\\b(?:her|his|their)\\s+(?:[a-z0-9]+\\s+){0,2}(${NON_HUMAN_ENTITY_NOUN_PATTERN})\\b`,
    "gi"
  );
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const canonical = canonicalizeNonHumanEntityNoun(match[1]);
    if (canonical) out.push(canonical);
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return dedupePreserveOrder(out);
}

function collectNonHumanSubjectTagsFromText({
  text,
  matcherTags = [],
  subjectEntityPrepared = [],
  speciesTagSet,
  animalsTagSet,
}) {
  const rawText = String(text || "");
  if (!rawText) return [];
  const speciesSet = speciesTagSet instanceof Set ? speciesTagSet : new Set();
  const animalSet = animalsTagSet instanceof Set ? animalsTagSet : new Set();
  const phraseTags = extractTagsFromPhraseEntries(rawText, subjectEntityPrepared);
  const orderedCandidates = dedupePreserveOrder([...(phraseTags || []), ...(matcherTags || [])]);
  const out = [];
  for (const candidate of orderedCandidates) {
    const lower = String(candidate || "").toLowerCase().trim();
    if (!lower) continue;
    if (!speciesSet.has(lower) && !animalSet.has(lower)) continue;
    out.push(lower);
  }
  return dedupePreserveOrder(out);
}

function inferEntitySubjectHintsFromText(text, options = {}) {
  const rawText = String(text || "");
  const normalized = normalizeLooseText(rawText);
  const inferredNonHumanTags = collectNonHumanSubjectTagsFromText({
    text: rawText,
    matcherTags: options?.matcherTags || [],
    subjectEntityPrepared: options?.subjectEntityPrepared || [],
    speciesTagSet: options?.speciesTagSet,
    animalsTagSet: options?.animalsTagSet,
  });
  const ownedNonHumanTags = extractOwnedNonHumanSubjectTagsFromNormalizedText(normalized);
  const lexicalNonHumanTags = extractLexicalNonHumanEntityTagsFromNormalizedText(normalized);
  const nonHumanTags = dedupePreserveOrder([
    ...ownedNonHumanTags,
    ...lexicalNonHumanTags,
    ...(inferredNonHumanTags || []),
  ]);
  const hasHumanCue = hasHumanEntityCueInNormalizedText(normalized);
  const hasNonHumanLexicalCue = lexicalNonHumanTags.length > 0;
  const primaryOwnedNonHumanTag = String(ownedNonHumanTags[0] || "").toLowerCase().trim();
  const hasOwnedNonHumanCue = Boolean(primaryOwnedNonHumanTag);
  const primaryNonHumanTag = String(nonHumanTags[0] || "").toLowerCase().trim();
  const hasNonHumanCue = Boolean(primaryNonHumanTag) || hasNonHumanLexicalCue;
  return {
    hasHumanCue,
    hasNonHumanCue,
    hasNonHumanLexicalCue,
    hasOwnedNonHumanCue,
    nonHumanTags,
    lexicalNonHumanTags,
    ownedNonHumanTags,
    primaryOwnedNonHumanTag,
    primaryNonHumanTag,
  };
}

function extractExplicitPluralNonHumanEntityCountsFromText(text) {
  const normalized = normalizeLooseText(text);
  if (!normalized) {
    return {
      totalCount: 0,
      countsByTag: new Map(),
    };
  }

  const countsByTag = new Map();
  const numberPattern = "(?:\\d+|two|three|four|five|six|seven|eight|nine|ten)";
  const regex = new RegExp(
    `\\b(${numberPattern})\\s+(?:(?!and\\b|or\\b|with\\b|while\\b)[a-z0-9]+\\s+){0,2}(${NON_HUMAN_ENTITY_NOUN_PATTERN})\\b`,
    "gi"
  );
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const count = parseNumberToken(match[1]);
    if (!Number.isFinite(count) || count <= 1) {
      if (match.index === regex.lastIndex) regex.lastIndex += 1;
      continue;
    }
    const subjectTag = canonicalizeNonHumanEntityNoun(match[2]);
    if (subjectTag) {
      countsByTag.set(subjectTag, (countsByTag.get(subjectTag) || 0) + count);
    }
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }

  let totalCount = 0;
  for (const value of countsByTag.values()) {
    totalCount += Number(value) || 0;
  }
  return {
    totalCount,
    countsByTag,
  };
}

function extractExplicitEntityDeclarations(userText) {
  const normalized = normalizeLooseText(normalizeHairAdjectiveAliases(userText));
  if (!normalized) {
    return {
      declarations: [],
      hasExplicitCounts: false,
      girlsCount: 0,
      boysCount: 0,
      genericCount: 0,
    };
  }

  const allDeclarations = [];
  const pushDeclaration = (matchObj, countRaw, nounRaw) => {
    const count = parseNumberToken(countRaw);
    const kind = explicitNounToKind(nounRaw);
    if (!Number.isFinite(count) || count <= 0 || !kind) return;
    const start = Number(matchObj?.index) || 0;
    const rawMatch = String(matchObj?.[0] || "");
    allDeclarations.push({
      start,
      end: start + rawMatch.length,
      count,
      kind,
    });
  };

  let compactMatch;
  const compactRegex =
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(girls|boys)\b/gi;
  while ((compactMatch = compactRegex.exec(normalized)) !== null) {
    pushDeclaration(compactMatch, compactMatch[1], compactMatch[2]);
    if (compactMatch.index === compactRegex.lastIndex) compactRegex.lastIndex += 1;
  }

  let countedMatch;
  const countedRegex =
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(women|men|woman|man|girl|boy|girlfriend|boyfriend|people|persons|person|characters|character)\b/gi;
  while ((countedMatch = countedRegex.exec(normalized)) !== null) {
    pushDeclaration(countedMatch, countedMatch[1], countedMatch[2]);
    if (countedMatch.index === countedRegex.lastIndex) countedRegex.lastIndex += 1;
  }

  allDeclarations.sort((a, b) => a.start - b.start);
  const declarations = [];
  if (allDeclarations.length) {
    const connectorOnlyRe = /^\s*(?:,|and|&|\+)?\s*$/;
    declarations.push(allDeclarations[0]);
    let clusterEnd = Number(allDeclarations[0].end) || Number(allDeclarations[0].start) || 0;
    for (let i = 1; i < allDeclarations.length; i += 1) {
      const current = allDeclarations[i];
      const between = normalized.slice(clusterEnd, current.start);
      if (!connectorOnlyRe.test(between)) break;
      declarations.push(current);
      clusterEnd = Number(current.end) || Number(current.start) || clusterEnd;
    }
  }

  let girlsCount = 0;
  let boysCount = 0;
  let genericCount = 0;
  for (const declaration of declarations) {
    if (declaration.kind === "girl") girlsCount += declaration.count;
    if (declaration.kind === "boy") boysCount += declaration.count;
    if (declaration.kind === "person") genericCount += declaration.count;
  }

  const hasStrongDeclaration = declarations.some(
    (declaration) => Number(declaration?.count || 0) > 1
  );
  const hasExplicitCounts = declarations.length > 1 || hasStrongDeclaration;

  return {
    declarations,
    hasExplicitCounts,
    girlsCount,
    boysCount,
    genericCount,
  };
}

function buildExplicitEntityPlanFromText(userText) {
  const explicit = extractExplicitEntityDeclarations(userText);
  const genderSpecificTotal = explicit.girlsCount + explicit.boysCount;
  const entityCount = Math.max(genderSpecificTotal, explicit.genericCount);
  if (!explicit.hasExplicitCounts || entityCount <= 0) {
    return {
      hasExplicitCounts: false,
      entityCount: 0,
      entitySlots: [],
      groupTags: [],
      girlsCount: 0,
      boysCount: 0,
      genericCount: 0,
      declarations: [],
    };
  }

  const entitySlots = Array.from({ length: entityCount }, () => ({
    gender: "",
    anchorTag: "",
  }));
  const orderedSpecificGenders = [];
  for (const declaration of explicit.declarations) {
    if (declaration.kind !== "girl" && declaration.kind !== "boy") continue;
    for (let i = 0; i < declaration.count; i += 1) {
      orderedSpecificGenders.push(declaration.kind);
    }
  }
  for (let i = 0; i < Math.min(entitySlots.length, orderedSpecificGenders.length); i += 1) {
    const gender = orderedSpecificGenders[i];
    entitySlots[i] = {
      gender,
      anchorTag: gender,
    };
  }

  return {
    hasExplicitCounts: true,
    entityCount,
    entitySlots,
    groupTags: buildPeopleTagsFromCounts(explicit.girlsCount, explicit.boysCount),
    girlsCount: explicit.girlsCount,
    boysCount: explicit.boysCount,
    genericCount: explicit.genericCount,
    declarations: explicit.declarations,
  };
}

function inferExplicitEntityCountsFromText(userText) {
  const normalized = normalizeLooseText(userText);
  if (!normalized) {
    return {
      entityCount: 0,
      girlsCount: 0,
      boysCount: 0,
      genericCount: 0,
      peopleTags: [],
      hasExplicitCounts: false,
    };
  }

  const explicit = extractExplicitEntityDeclarations(userText);
  let explicitGirlsCount = explicit.hasExplicitCounts ? explicit.girlsCount : 0;
  let explicitBoysCount = explicit.hasExplicitCounts ? explicit.boysCount : 0;
  let explicitGenericCount = explicit.hasExplicitCounts ? explicit.genericCount : 0;
  let incrementalGirlsCount = 0;
  let incrementalBoysCount = 0;
  let incrementalGenericCount = 0;

  const addCountByNoun = (count, nounRaw, source = "explicit") => {
    const kind = explicitNounToKind(nounRaw);
    if (!Number.isFinite(count) || count <= 0) return;
    const isExplicit = source === "explicit";
    if (kind === "girl") {
      if (isExplicit) explicitGirlsCount += count;
      else incrementalGirlsCount += count;
      return;
    }
    if (kind === "boy") {
      if (isExplicit) explicitBoysCount += count;
      else incrementalBoysCount += count;
      return;
    }
    if (kind === "person") {
      if (isExplicit) explicitGenericCount += count;
      else incrementalGenericCount += count;
    }
  };

  const countMatches = (regex, onMatch) => {
    let match;
    while ((match = regex.exec(normalized)) !== null) {
      onMatch(match);
      if (match.index === regex.lastIndex) regex.lastIndex += 1;
    }
  };

  countMatches(/\banother\s+(woman|man|girl|boy|girlfriend|boyfriend|person|character)\b/gi, (match) => {
    addCountByNoun(1, match[1], "incremental");
  });

  countMatches(
    /\bone\s+(?:(?!and\b|or\b|with\b|another\b)[a-z0-9]+\s+){0,2}(woman|man|girl|boy|girlfriend|boyfriend|person|character)\b/gi,
    (match) => {
      addCountByNoun(1, match[1], "incremental");
    }
  );

  countMatches(
    /\b(a|an)\s+(?:(?!and\b|or\b|with\b|another\b)[a-z0-9]+\s+){0,2}(woman|man|girl|boy|girlfriend|boyfriend|person|character)\b/gi,
    (match) => {
      addCountByNoun(1, match[2], "incremental");
    }
  );

  countMatches(/\b(?:her|his|their)\s+(girlfriend|boyfriend)\b/gi, (match) => {
    addCountByNoun(1, match[1], "incremental");
  });

  const resolveCount = (explicitCount, incrementalCount) =>
    explicitCount > 0 ? explicitCount : incrementalCount;
  const girlsCount = resolveCount(explicitGirlsCount, incrementalGirlsCount);
  const boysCount = resolveCount(explicitBoysCount, incrementalBoysCount);
  const genericCount = resolveCount(explicitGenericCount, incrementalGenericCount);
  const genderSpecificTotal = girlsCount + boysCount;
  const entityCount = Math.max(genderSpecificTotal, genericCount);
  const peopleTags = buildPeopleTagsFromCounts(girlsCount, boysCount);

  return {
    entityCount,
    girlsCount,
    boysCount,
    genericCount,
    peopleTags,
    hasExplicitCounts: explicit.hasExplicitCounts,
  };
}

function collectOrdinalEntityMarkers(userText) {
  const raw = String(userText || "");
  if (!raw.trim()) return [];

  const markers = [];
  const regex = new RegExp(`\\b${ORDINAL_TOKEN_PATTERN}\\b`, "gi");
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const ordinalWord = String(match[1] || "").toLowerCase();
    const entityIndex = parseOrdinalTokenToIndex(ordinalWord);
    if (entityIndex > 0) {
      markers.push({
        entityIndex,
        start: match.index,
      });
    }
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return markers;
}

function inferOrdinalEntityCountFromText(userText) {
  let maxIndex = 0;
  for (const marker of collectOrdinalEntityMarkers(userText)) {
    const idx = Number(marker?.entityIndex || 0);
    if (idx > maxIndex) maxIndex = idx;
  }
  return maxIndex;
}

function inferPeopleTagsFromKnownAnchors(anchors, knownFemaleCharacterTagSet) {
  if (!Array.isArray(anchors) || anchors.length < 2) return [];

  const genders = anchors.map((anchor) =>
    inferKnownCharacterGender(anchor?.tag, knownFemaleCharacterTagSet)
  );
  let girlsCount = genders.filter((gender) => gender === "girl").length;
  let boysCount = genders.filter((gender) => gender === "boy").length;
  const unknownCount = genders.length - girlsCount - boysCount;

  if (girlsCount === 0 && boysCount === 0) {
    girlsCount = anchors.length;
  } else if (girlsCount > 0 && boysCount === 0) {
    girlsCount += unknownCount;
  } else if (boysCount > 0 && girlsCount === 0) {
    boysCount += unknownCount;
  }
  return buildPeopleTagsFromCounts(girlsCount, boysCount);
}

function inferDefaultEntityFallbackTag(peopleTags) {
  const lowered = (peopleTags || []).map((tag) => String(tag || "").toLowerCase());
  const hasGirls = lowered.some((tag) => /^\d+girls$/.test(tag));
  const hasBoys = lowered.some((tag) => /^\d+boys$/.test(tag));
  if (hasBoys && !hasGirls) return "man";
  return "woman";
}

function inferSegmentFallbackEntityTag(text, defaultTag = "woman") {
  const normalized = normalizeLooseText(text);
  const nonHumanLexicalTags = extractLexicalNonHumanEntityTagsFromNormalizedText(normalized);
  const firstNonHumanTag = String(nonHumanLexicalTags[0] || "").toLowerCase().trim();
  if (firstNonHumanTag) return firstNonHumanTag;
  if (/\bgirlfriend\b/.test(normalized)) return "girl";
  if (/\bboyfriend\b/.test(normalized)) return "boy";
  if (/\bgirl\b/.test(normalized)) return "girl";
  if (/\bboy\b/.test(normalized)) return "boy";
  if (/\bknight\b/.test(normalized)) return "boy";
  if (/\bwoman\b/.test(normalized)) return "woman";
  if (/\bman\b/.test(normalized)) return "man";
  return defaultTag;
}

function inferPeopleTagsFromSegmentFallbacks(segments) {
  let girlsCount = 0;
  let boysCount = 0;
  for (const segment of segments || []) {
    const text = cleanSegmentText(String(segment?.text || ""));
    const subjectKind = normalizeSubjectKind(segment?.subjectKind);
    const hasAnchorTag =
      Boolean(String(segment?.characterTag || "").trim()) ||
      Boolean(String(segment?.subjectTag || "").trim());
    if (!text && !hasAnchorTag) continue;
    if (subjectKind === "nonhuman") continue;
    const fallback = String(segment?.fallbackEntityTag || "").toLowerCase();
    if (fallback === "girl" || fallback === "woman") girlsCount += 1;
    if (fallback === "boy" || fallback === "man") boysCount += 1;
  }
  return buildPeopleTagsFromCounts(girlsCount, boysCount);
}

function buildPeopleTagsFromEntitySlots(entitySlots) {
  let girlsCount = 0;
  let boysCount = 0;
  for (const slot of entitySlots || []) {
    const gender = normalizeEntityGenderHint(slot?.gender);
    if (gender === "girl") girlsCount += 1;
    if (gender === "boy") boysCount += 1;
  }
  return buildPeopleTagsFromCounts(girlsCount, boysCount);
}

function inferSlotGenderHintFromSegment(segment, knownFemaleCharacterTagSet) {
  const segmentSubjectKind = normalizeSubjectKind(segment?.subjectKind);
  const segmentSubjectTag = String(segment?.subjectTag || "").toLowerCase().trim();
  if (segmentSubjectKind === "nonhuman" || segmentSubjectTag) return "";

  const segmentText = cleanSegmentText(String(segment?.text || ""));
  const segmentCharacterTag = String(segment?.characterTag || "").trim();
  if (!segmentText && !segmentCharacterTag) return "";

  const knownGender = inferKnownCharacterGender(
    segmentCharacterTag,
    knownFemaleCharacterTagSet
  );
  if (knownGender === "girl" || knownGender === "boy") return knownGender;

  const fallbackGender = normalizeEntityGenderHint(
    inferSegmentFallbackEntityTag(String(segment?.text || ""), "")
  );
  if (fallbackGender === "girl" || fallbackGender === "boy") return fallbackGender;

  return "";
}

function ensureEntitySlotsHaveAnchors(entitySlots, defaultGender = "girl") {
  const fallbackGender = normalizeEntityGenderHint(defaultGender);
  return (entitySlots || []).map((slot) => {
    const subjectTag = String(slot?.subjectTag || "")
      .toLowerCase()
      .trim();
    const explicitSubjectKind = normalizeSubjectKind(slot?.subjectKind);
    const subjectKind = explicitSubjectKind || (subjectTag ? "nonhuman" : "");
    if (subjectKind === "nonhuman") {
      return {
        gender: "",
        anchorTag: "",
        subjectKind,
        subjectTag,
      };
    }

    const gender = normalizeEntityGenderHint(slot?.gender) || fallbackGender || "";
    return {
      gender,
      anchorTag: gender ? (gender === "boy" ? "boy" : "girl") : "",
      subjectKind: subjectKind || (gender ? "human" : ""),
      subjectTag,
    };
  });
}

function assignKnownCharacterTagsToSegments(segments, knownAnchors, charactersPrepared) {
  const anchorTags = (knownAnchors || [])
    .map((anchor) => String(anchor?.tag || "").trim())
    .filter(Boolean);
  const used = new Set();

  return (segments || []).map((segment, idx) => {
    const currentTag = String(segment?.characterTag || "").trim();
    const localMatches = dedupePreserveOrder(
      extractTagsFromPhraseEntries(String(segment?.text || ""), charactersPrepared)
    );
    const candidates = dedupePreserveOrder([
      currentTag,
      ...localMatches,
      anchorTags[idx] || "",
    ]);

    let characterTag = "";
    for (const candidate of candidates) {
      const lower = String(candidate || "").toLowerCase();
      if (!lower) continue;
      if (used.has(lower)) continue;
      characterTag = candidate;
      used.add(lower);
      break;
    }

    return {
      ...segment,
      characterTag,
    };
  });
}

function splitKnownCharactersByAnchors(userText, charactersPrepared, knownFemaleCharacterTagSet) {
  const raw = String(userText || "");
  if (!raw.trim()) return null;

  const matches = extractCharacterMatchesWithRawOffsets(raw, charactersPrepared);
  if (matches.length < 2) return null;

  const anchors = selectDistinctKnownCharacterAnchors(matches);
  if (anchors.length < 2) return null;

  const ordinalOrderedAnchors = selectKnownCharacterAnchorsByOrdinalMarkers(raw, anchors);
  const selectedAnchors = ordinalOrderedAnchors || anchors;
  const rawSegments = buildKnownCharacterSegments(raw, selectedAnchors);
  if (rawSegments.length < 2) return null;

  const defaultFallbackTag = inferDefaultEntityFallbackTag(
    inferPeopleTagsFromKnownAnchors(selectedAnchors, knownFemaleCharacterTagSet)
  );
  const segments = rawSegments.map((segment) => {
    const gender = inferKnownCharacterGender(segment.characterTag, knownFemaleCharacterTagSet);
    const byGender = gender === "boy" ? "boy" : gender === "girl" ? "girl" : "";
    return {
      ...segment,
      fallbackEntityTag:
        byGender ||
        inferSegmentFallbackEntityTag(String(segment.text || ""), defaultFallbackTag),
    };
  });

  return {
    anchors: selectedAnchors,
    segments,
    peopleTags: inferPeopleTagsFromKnownAnchors(selectedAnchors, knownFemaleCharacterTagSet),
  };
}

function buildOrdinalSegmentsFromText(userText, entityCount, defaultFallbackTag = "woman") {
  const raw = String(userText || "");
  if (!raw.trim() || entityCount < 2) return null;

  const markers = collectOrdinalEntityMarkers(raw).sort((a, b) => a.start - b.start);
  if (markers.length < 2) return null;

  const uniqueEntityIndices = new Set(markers.map((marker) => marker.entityIndex));
  if (uniqueEntityIndices.size < 2) return null;

  const buckets = Array.from({ length: entityCount }, () => []);
  for (let i = 0; i < markers.length; i += 1) {
    const marker = markers[i];
    const entityIndex = Number(marker?.entityIndex || 0);
    if (entityIndex < 1 || entityIndex > entityCount) continue;

    const start = Math.max(0, Math.min(raw.length, Number(marker?.start) || 0));
    const end =
      i + 1 < markers.length
        ? Math.max(start, Math.min(raw.length, Number(markers[i + 1]?.start) || raw.length))
        : raw.length;
    const text = cleanSegmentText(raw.slice(start, end));
    if (!text) continue;
    buckets[entityIndex - 1].push(text);
  }

  const segments = buckets.map((parts, idx) => {
    const text = cleanSegmentText(parts.join(". "));
    return {
      label: `char${idx + 1}`,
      text,
      fallbackEntityTag: inferSegmentFallbackEntityTag(text, defaultFallbackTag),
    };
  });
  const nonEmptyCount = segments.filter((segment) => String(segment.text || "").trim()).length;
  if (nonEmptyCount < 2) return null;
  return segments;
}

function splitSentenceIntoEntityClauses(sentenceText) {
  const sentence = cleanSegmentText(sentenceText);
  if (!sentence) return [];
  const ordinalEntityCuePattern = `(?:the\\s+)?(?:${ORDINAL_TOKEN_PATTERN})`;
  const relationEntityCuePattern =
    "(?:(?:her|his|their)\\s+(?:girlfriend|boyfriend)|girlfriend|boyfriend)";
  const ownedNonHumanEntityCuePattern =
    `(?:(?:her|his|their)\\s+(?:[a-z0-9]+\\s+){0,2}${NON_HUMAN_ENTITY_NOUN_PATTERN})`;
  const nonHumanEntityCuePattern =
    `(?:${NON_HUMAN_ENTITY_NOUN_PATTERN}|(?:a|an|the)\\s+(?:[a-z0-9]+\\s+){0,2}${NON_HUMAN_ENTITY_NOUN_PATTERN}|${ownedNonHumanEntityCuePattern})`;
  const startsEntityCueRegex = new RegExp(
    `^(?:another\\b|one\\b|the\\s+other\\b|${ordinalEntityCuePattern}\\b|${relationEntityCuePattern}\\b|(?:a|an)\\s+(?:[a-z0-9]+\\s+){0,2}(?:woman|man|girl|boy|girlfriend|boyfriend)\\b|(?:woman|man|girl|boy|girlfriend|boyfriend)\\b|${nonHumanEntityCuePattern}\\b)`,
    "i"
  );
  const conjunctionSplitRegex = new RegExp(
    `\\s+\\b(?:and|while|but)\\b\\s+(?=(?:another\\s+|the\\s+other\\s+|${ordinalEntityCuePattern}\\b|${relationEntityCuePattern}\\b|(?:a|an)\\s+(?:[a-z0-9]+\\s+){0,2}(?:woman|man|girl|boy|girlfriend|boyfriend)\\b|(?:woman|man|girl|boy|girlfriend|boyfriend)\\b|${nonHumanEntityCuePattern}\\b))`,
    "i"
  );

  const hairPairMatch = /\bone\s+(blonde|brunette|redhead)\s+(?:and\s+)?one\s+(blonde|brunette|redhead)\b/i.exec(
    sentence
  );
  if (hairPairMatch) {
    return [
      `one ${String(hairPairMatch[1] || "").toLowerCase()}`,
      `one ${String(hairPairMatch[2] || "").toLowerCase()}`,
    ];
  }

  const relationalPartnerSplit = sentence
    .split(/\s+\b(?:and|while|but)\b\s+(?=(?:her|his|their)\s+(?:girlfriend|boyfriend)\b)/i)
    .map((part) => cleanSegmentText(part))
    .filter(Boolean);
  if (relationalPartnerSplit.length > 1) {
    return relationalPartnerSplit;
  }

  const commaPartsRaw = sentence
    .split(/\s*,\s*/g)
    .map((part) => cleanSegmentText(part))
    .filter(Boolean);
  if (commaPartsRaw.length > 1) {
    const commaParts = [commaPartsRaw[0]];
    const startsEntityCue = (part) => startsEntityCueRegex.test(String(part || ""));
    for (let i = 1; i < commaPartsRaw.length; i += 1) {
      const part = commaPartsRaw[i];
      if (startsEntityCue(part)) {
        commaParts.push(part);
      } else {
        const lastIdx = commaParts.length - 1;
        commaParts[lastIdx] = cleanSegmentText(`${commaParts[lastIdx]}, ${part}`);
      }
    }
    return commaParts.filter(Boolean);
  }

  const conjunctionParts = sentence
    .split(conjunctionSplitRegex)
    .map((part) => cleanSegmentText(part))
    .filter(Boolean);
  if (conjunctionParts.length > 1) return conjunctionParts;

  return [sentence];
}

function isEntityCountIntroChunk(text) {
  const normalized = normalizeLooseText(text);
  if (!normalized) return false;
  if (
    /^(?:there\s+are\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(women|men|girls|boys|people|persons|characters)$/.test(
      normalized
    )
  ) {
    return true;
  }
  return false;
}

function buildSequentialSegmentsFromText(
  userText,
  entityCount,
  maskTextForSplit,
  defaultFallbackTag = "woman",
  explicitEntitySlots = null
) {
  if (entityCount < 2) return null;

  if (entityCount === 2) {
    const pairSplit = splitIntoTwoCharacterSegments(userText, maskTextForSplit);
    if (pairSplit) {
      const char1Text = cleanSegmentText(pairSplit.char1Text);
      const char2Text = cleanSegmentText(pairSplit.char2Text);
      return [
        {
          label: "char1",
          text: char1Text,
          fallbackEntityTag: inferSegmentFallbackEntityTag(char1Text, defaultFallbackTag),
        },
        {
          label: "char2",
          text: char2Text,
          fallbackEntityTag: inferSegmentFallbackEntityTag(char2Text, defaultFallbackTag),
        },
      ];
    }

    const partnerSplit = splitByRelationalPartnerCue(userText);
    if (partnerSplit) {
      const char1Text = cleanSegmentText(partnerSplit.char1Text);
      const char2Text = cleanSegmentText(partnerSplit.char2Text);
      return [
        {
          label: "char1",
          text: char1Text,
          fallbackEntityTag: inferSegmentFallbackEntityTag(char1Text, defaultFallbackTag),
        },
        {
          label: "char2",
          text: char2Text,
          fallbackEntityTag: inferSegmentFallbackEntityTag(char2Text, defaultFallbackTag),
        },
      ];
    }
  }

  const sentenceChunks = splitTextIntoSentences(userText);
  const baseChunks = sentenceChunks.length ? sentenceChunks : [String(userText || "")];

  let chunks = baseChunks
    .map((chunk) => cleanSegmentText(chunk))
    .filter(Boolean);
  if (chunks.length >= 2 && isEntityCountIntroChunk(chunks[0])) {
    chunks = chunks.slice(1);
  }
  const expandedChunks = [];
  for (const chunk of chunks) {
    const clauses = splitSentenceIntoEntityClauses(chunk);
    if (clauses.length > 1) {
      expandedChunks.push(...clauses);
    } else {
      expandedChunks.push(chunk);
    }
  }
  chunks = expandedChunks.map((chunk) => cleanSegmentText(chunk)).filter(Boolean);
  if (chunks.length >= 2 && isEntityCountIntroChunk(chunks[0])) {
    chunks = chunks.slice(1);
  }

  const buckets = Array.from({ length: entityCount }, () => []);
  const knownIndexByGender = {
    girl: -1,
    boy: -1,
  };
  const knownIndexByHair = {
    blonde: -1,
    brunette: -1,
    redhead: -1,
  };
  const explicitSlotGenders = (explicitEntitySlots || []).map((slot) =>
    normalizeEntityGenderHint(slot?.gender)
  );
  const chooseNextSlotByGender = (gender) => {
    const candidates = [];
    for (let i = 0; i < Math.min(entityCount, explicitSlotGenders.length); i += 1) {
      if (explicitSlotGenders[i] === gender) candidates.push(i);
    }
    if (!candidates.length) return -1;
    for (const idx of candidates) {
      if (!(buckets[idx] || []).length) return idx;
    }
    let bestIdx = candidates[0];
    let bestScore = Number.POSITIVE_INFINITY;
    for (const idx of candidates) {
      const score = (buckets[idx] || []).join(" ").length;
      if (score < bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    }
    return bestIdx;
  };
  let cursor = 0;
  for (const chunk of chunks) {
    const normalizedChunk = normalizeLooseText(chunk);
    const hasGirlSeed = /\b(?:a|an|one)\s+(?:[a-z0-9]+\s+){0,2}(woman|girl)\b/.test(normalizedChunk);
    const hasBoySeed = /\b(?:a|an|one)\s+(?:[a-z0-9]+\s+){0,2}(man|boy)\b/.test(normalizedChunk);
    const hairMentions = [];
    if (/\bblonde\b/.test(normalizedChunk)) hairMentions.push("blonde");
    if (/\bbrunette\b/.test(normalizedChunk)) hairMentions.push("brunette");
    if (/\bredhead\b/.test(normalizedChunk)) hairMentions.push("redhead");
    let explicitTargetIndex = -1;
    const ordinalIndex = extractOrdinalIndexFromNormalizedText(normalizedChunk);
    if (ordinalIndex > 0) explicitTargetIndex = ordinalIndex - 1;
    if (/\bthe\s+blonde\b/.test(normalizedChunk) && knownIndexByHair.blonde >= 0) {
      explicitTargetIndex = knownIndexByHair.blonde;
    }
    if (/\bthe\s+brunette\b/.test(normalizedChunk) && knownIndexByHair.brunette >= 0) {
      explicitTargetIndex = knownIndexByHair.brunette;
    }
    if (/\bthe\s+redhead\b/.test(normalizedChunk) && knownIndexByHair.redhead >= 0) {
      explicitTargetIndex = knownIndexByHair.redhead;
    }
    if (/\bthe\s+(woman|girl)\b/.test(normalizedChunk) && knownIndexByGender.girl >= 0) {
      explicitTargetIndex = knownIndexByGender.girl;
    }
    if (/\bthe\s+(man|boy)\b/.test(normalizedChunk) && knownIndexByGender.boy >= 0) {
      explicitTargetIndex = knownIndexByGender.boy;
    }
    if (/\bthe\s+other\b/.test(normalizedChunk) && entityCount >= 2) {
      explicitTargetIndex = Math.min(1, entityCount - 1);
    }
    const entityRefMatch = /\b(one|a|an|the)\s+(woman|girl|man|boy)\b/.exec(normalizedChunk);
    const entityRefGender = normalizeEntityGenderHint(entityRefMatch?.[2] || "");
    if (explicitTargetIndex < 0 && explicitSlotGenders.length && entityRefGender) {
      const targetByGender = chooseNextSlotByGender(entityRefGender);
      if (targetByGender >= 0) {
        explicitTargetIndex = targetByGender;
      }
    }

    const targetIndex =
      explicitTargetIndex >= 0
        ? Math.min(explicitTargetIndex, entityCount - 1)
        : Math.min(cursor, entityCount - 1);
    buckets[targetIndex].push(chunk);
    if (hasGirlSeed && !hasBoySeed && knownIndexByGender.girl < 0) {
      knownIndexByGender.girl = targetIndex;
    }
    if (hasBoySeed && !hasGirlSeed && knownIndexByGender.boy < 0) {
      knownIndexByGender.boy = targetIndex;
    }
    if (hairMentions.length === 1) {
      const hair = hairMentions[0];
      if (knownIndexByHair[hair] < 0) {
        knownIndexByHair[hair] = targetIndex;
      }
    }
    if (explicitTargetIndex < 0 && cursor < entityCount - 1) cursor += 1;
  }

  return buckets.map((parts, idx) => {
    const text = cleanSegmentText(parts.join(". "));
    return {
      label: `char${idx + 1}`,
      text,
      fallbackEntityTag: inferSegmentFallbackEntityTag(text, defaultFallbackTag),
    };
  });
}

function splitSegmentIntoRefinementClauses(text) {
  const raw = String(text || "");
  if (!raw.trim()) return [];
  const sentenceParts = raw
    .split(/[\r\n]+|[.?!]+/)
    .map((part) => cleanSegmentText(part))
    .filter(Boolean);
  const clauses = [];
  for (const sentence of sentenceParts.length ? sentenceParts : [raw]) {
    const commaParts = String(sentence)
      .split(/\s*,\s*/g)
      .map((part) => cleanSegmentText(part))
      .filter(Boolean);
    if (commaParts.length > 1) {
      clauses.push(...commaParts);
      continue;
    }
    const singlePart = commaParts[0] || "";
    const nonHumanRelativeClauseMatch = new RegExp(
      `\\b((?:her|his|their)\\s+((?:[a-z0-9]+\\s+){0,2}(?:${NON_HUMAN_ENTITY_NOUN_PATTERN})))\\s+((?:that|which|who)\\s+(?:is|was|are|were)\\b[\\s\\S]*)`,
      "i"
    ).exec(singlePart);
    if (nonHumanRelativeClauseMatch) {
      const ownedSubject = String(nonHumanRelativeClauseMatch[1] || "");
      const nonHumanSubject = String(nonHumanRelativeClauseMatch[2] || "");
      const relativeTail = String(nonHumanRelativeClauseMatch[3] || "");
      const matchStart = Number(nonHumanRelativeClauseMatch.index || 0);
      const leadToOwned = cleanSegmentText(singlePart.slice(0, matchStart + ownedSubject.length));
      const nonHumanRelativeClause = cleanSegmentText(`${nonHumanSubject} ${relativeTail}`);
      if (leadToOwned && nonHumanRelativeClause) {
        clauses.push(leadToOwned, nonHumanRelativeClause);
        continue;
      }
    }
    const companionActionMatch = new RegExp(
      `\\b(?:petting|pet|holding|touching|hugging|feeding|guiding|riding|playing|walking|watching|following)\\s+(?:(?:her|his|their|a|an|the)\\s+)?(?:[a-z0-9]+\\s+){0,2}(?:${NON_HUMAN_ENTITY_NOUN_PATTERN})\\b`,
      "i"
    ).exec(singlePart);
    if (companionActionMatch && Number(companionActionMatch.index || 0) > 0) {
      const splitAt = Number(companionActionMatch.index || 0);
      const leadText = cleanSegmentText(singlePart.slice(0, splitAt));
      const tailText = cleanSegmentText(singlePart.slice(splitAt));
      const leadNormalized = normalizeLooseText(leadText);
      const leadTokenCount = leadNormalized.split(/\s+/).filter(Boolean).length;
      const hasLeadHumanCue = hasHumanEntityCueInNormalizedText(leadNormalized);
      const leadStartsWithNonHumanCue = new RegExp(
        `^(?:(?:the|a|an|her|his|their)\\s+)?(?:[a-z0-9]+\\s+){0,2}${NON_HUMAN_ENTITY_NOUN_PATTERN}\\b`,
        "i"
      ).test(leadNormalized);
      if (
        leadText &&
        tailText &&
        leadTokenCount >= 2 &&
        (hasLeadHumanCue || !leadStartsWithNonHumanCue)
      ) {
        clauses.push(leadText, tailText);
        continue;
      }
    }
    if (singlePart) clauses.push(singlePart);
  }
  return clauses.filter(Boolean);
}

function isLikelyEntityDeclarationOnlyClause(clauseText) {
  const normalized = normalizeLooseText(clauseText);
  if (!normalized) return false;
  const numberPattern = "(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten)";
  const nounPattern =
    "(?:women|men|girls|boys|people|persons|person|characters|character|woman|man|girl|boy|girlfriend|boyfriend)";
  const declarationPattern = new RegExp(
    `^(?:there\\s+are\\s+)?${numberPattern}\\s+${nounPattern}(?:\\s*(?:,|and)\\s*${numberPattern}\\s+${nounPattern})*$`,
    "i"
  );
  return declarationPattern.test(normalized);
}

function inferEntityReferenceFromClause(clauseText) {
  const normalized = normalizeLooseText(clauseText);
  if (!normalized) {
    return {
      ordinalIndex: 0,
      gender: "",
      determiner: "",
      hasTraitCue: false,
    };
  }

  const ordinalIndex = extractOrdinalIndexFromNormalizedText(normalized);
  const entityRefMatch = /\b(one|a|an|the)\s+(woman|girl|man|boy|girlfriend|boyfriend)\b/.exec(
    normalized
  );
  const determiner = String(entityRefMatch?.[1] || "").toLowerCase();
  const gender = normalizeEntityGenderHint(entityRefMatch?.[2] || "");
  const tokenCount = normalized.split(/\s+/).filter(Boolean).length;
  const hasHairCue = /\b(?:blonde|brunette|redhead|red hair|black hair|brown hair|white hair|pink hair|blue hair|green hair)\b/.test(
    normalized
  );
  const hasTraitCue =
    /\bwith\b/.test(normalized) ||
    hasHairCue ||
    /\b(?:breasts|ass|dress|top|skirt|jacket|smile|smiling|walking|standing|sitting)\b/.test(
      normalized
    ) ||
    tokenCount >= 6;

  return {
    ordinalIndex,
    gender,
    determiner,
    hasTraitCue,
  };
}

function clauseTraitWeight(clauseText) {
  const normalized = normalizeLooseText(clauseText);
  if (!normalized) return 0;
  return normalized
    .split(/\s+/)
    .filter((token) => token && !["a", "an", "the", "one", "and", "with"].includes(token))
    .length;
}

function rebalanceExplicitEntityRefClauses(segments, entitySlots) {
  const slotGenders = (entitySlots || []).map((slot) => normalizeEntityGenderHint(slot?.gender));
  if (!slotGenders.length) return segments;

  const buckets = (segments || []).map((segment, idx) => {
    const clauses = splitSegmentIntoRefinementClauses(segment?.text || "").map((text) => ({
      text,
      slotIndex: idx,
    }));
    return clauses;
  });
  const allClauses = [];
  for (const bucket of buckets) {
    for (const clause of bucket) allClauses.push(clause);
  }
  if (!allClauses.length) return segments;

  const pickSlotByGender = (gender, ordinalIndex, determiner, currentSlot, lastByGender) => {
    const candidates = [];
    for (let i = 0; i < slotGenders.length; i += 1) {
      if (slotGenders[i] === gender) candidates.push(i);
    }
    if (!candidates.length) return currentSlot;

    if (ordinalIndex > 0) {
      const ordinalSlot = ordinalIndex - 1;
      if (ordinalSlot >= 0 && ordinalSlot < slotGenders.length && slotGenders[ordinalSlot] === gender) {
        return ordinalSlot;
      }
    }

    if (determiner === "the" && Number.isInteger(lastByGender[gender]) && lastByGender[gender] >= 0) {
      return lastByGender[gender];
    }

    for (const idx of candidates) {
      if (!(buckets[idx] || []).length) return idx;
    }

    let bestIdx = candidates[0];
    let bestScore = Number.POSITIVE_INFINITY;
    for (const idx of candidates) {
      const score = (buckets[idx] || []).reduce((acc, clause) => acc + clauseTraitWeight(clause.text), 0);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    }
    return bestIdx;
  };

  const lastReferencedByGender = { girl: -1, boy: -1 };
  for (const clause of allClauses) {
    const ref = inferEntityReferenceFromClause(clause.text);
    if (!ref.gender || !ref.hasTraitCue || isLikelyEntityDeclarationOnlyClause(clause.text)) {
      continue;
    }
    const currentSlot = clause.slotIndex;
    const targetSlot = pickSlotByGender(
      ref.gender,
      Number(ref.ordinalIndex || 0),
      ref.determiner,
      currentSlot,
      lastReferencedByGender
    );
    if (targetSlot !== currentSlot) {
      const sourceBucket = buckets[currentSlot] || [];
      const sourceIdx = sourceBucket.indexOf(clause);
      if (sourceIdx >= 0) sourceBucket.splice(sourceIdx, 1);
      (buckets[targetSlot] || []).push(clause);
      clause.slotIndex = targetSlot;
    }
    lastReferencedByGender[ref.gender] = clause.slotIndex;
  }

  return (segments || []).map((segment, idx) => {
    const text = cleanSegmentText((buckets[idx] || []).map((clause) => clause.text).join(". "));
    return {
      ...segment,
      text,
    };
  });
}

function extractKnownCharacterAnchorsFromText(userText, charactersPrepared) {
  const matches = extractCharacterMatchesWithRawOffsets(userText, charactersPrepared);
  return selectDistinctKnownCharacterAnchors(matches || []);
}

function extractOrdinalIndexFromClauseText(clauseText) {
  const normalized = normalizeLooseText(clauseText);
  const fromWord = extractOrdinalIndexFromNormalizedText(normalized);
  if (fromWord > 0) return fromWord;

  const raw = String(clauseText || "").toLowerCase();
  const hashMatch = /(?:^|[^a-z0-9])#(\d+)(?=$|[^0-9])/.exec(raw);
  if (hashMatch) {
    const value = Number(hashMatch[1]);
    if (Number.isFinite(value) && value > 0) return value;
  }

  const markerMatch = /(?:^|[^a-z0-9])(\d+)[\)\.](?=$|[^0-9])/.exec(raw);
  if (markerMatch) {
    const value = Number(markerMatch[1]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 0;
}

function inferHairAnchorFromNormalizedClauseText(normalizedClauseText) {
  const normalized = String(normalizedClauseText || "").toLowerCase();
  if (!normalized) return "";
  if (/\bbrunette\b/.test(normalized)) return "brown_hair";
  if (/\bblonde\b/.test(normalized)) return "blonde_hair";
  if (/\bredhead\b/.test(normalized) || /\bred\s+hair\b/.test(normalized)) return "red_hair";
  return "";
}

function inferPronounGenderFromNormalizedClauseText(normalizedClauseText) {
  const normalized = String(normalizedClauseText || "").toLowerCase();
  if (!normalized) return "";
  if (/\b(she|her)\b/.test(normalized)) return "girl";
  if (/\b(he|him)\b/.test(normalized)) return "boy";
  return "";
}

function inferExplicitGenderFromNormalizedClauseText(normalizedClauseText) {
  const normalized = String(normalizedClauseText || "").toLowerCase();
  if (!normalized) return "";
  const hasBoy = /\b(man|boy|male|boyfriend)\b/.test(normalized);
  const hasGirl = /\b(woman|girl|female|girlfriend)\b/.test(normalized);
  if (hasBoy && hasGirl) return "";
  if (hasBoy) return "boy";
  if (hasGirl) return "girl";
  return "";
}

function isCollectiveEntityClauseForBinding(normalizedClauseText, slotCount) {
  const normalized = String(normalizedClauseText || "").toLowerCase();
  if (!normalized || Number(slotCount || 0) < 2) return false;

  if (/\b(they|them|their|theirs|themselves)\b/.test(normalized)) return true;
  if (/\bboth\b/.test(normalized)) return true;
  if (/\b(each\s+other|together|all\s+together)\b/.test(normalized)) return true;
  if (/\ball\s+of\s+them\b/.test(normalized)) return true;
  if (/\ball\s+(are|were|have|had|do|did|can|could|will|would|should|seem|appear)\b/.test(normalized)) {
    return true;
  }
  if (
    /\b(both|all)\s+(women|men|girls|boys|people|persons|characters)\b/.test(normalized)
  ) {
    return true;
  }
  if (
    /\b(\d+|two|three|four|five|six|seven|eight|nine|ten)\s+(women|men|girls|boys|people|persons|characters)\b/.test(
      normalized
    )
  ) {
    return true;
  }

  const hasPluralSubject = /\b(women|men|girls|boys|people|persons|characters)\s+are\b/.test(
    normalized
  );
  const hasPerEntityCue = new RegExp(`\\b(${ORDINAL_TOKEN_PATTERN}|one|another)\\b`).test(
    normalized
  );
  if (hasPluralSubject && !hasPerEntityCue) return true;

  return false;
}

function splitTextIntoBinderClauses(userText, charactersPrepared) {
  const sentences = splitTextIntoSentences(userText);
  const sourceSentences = sentences.length ? sentences : [String(userText || "")];
  const out = [];

  for (const sentence of sourceSentences) {
    const entityClauses = splitSentenceIntoEntityClauses(sentence);
    const coarseParts = entityClauses.length ? entityClauses : [sentence];
    for (const coarsePart of coarseParts) {
      const refinedParts = splitSegmentIntoRefinementClauses(coarsePart);
      const clauseParts = refinedParts.length ? refinedParts : [coarsePart];
      for (const clausePart of clauseParts) {
        const cleanedClause = cleanSegmentText(clausePart);
        if (!cleanedClause) continue;

        const knownAnchors = extractKnownCharacterAnchorsFromText(cleanedClause, charactersPrepared);
        if (knownAnchors.length >= 2) {
          const knownSegments = buildKnownCharacterSegments(cleanedClause, knownAnchors);
          for (const knownSegment of knownSegments) {
            const splitText = cleanSegmentText(String(knownSegment?.text || ""));
            if (splitText) out.push(splitText);
          }
          continue;
        }

        out.push(cleanedClause);
      }
    }
  }

  return out.filter(Boolean);
}

function bindClausesToEntitySlots({
  userText,
  segments,
  entitySlots,
  charactersPrepared,
  knownCharacterAnchors,
  knownFemaleCharacterTagSet,
  defaultFallbackTag = "woman",
  subjectEntityPrepared = [],
  speciesTagSet,
  animalsTagSet,
}) {
  const slotCount = Math.max(
    Number(entitySlots?.length || 0),
    Number(segments?.length || 0)
  );
  if (slotCount < 2) {
    return {
      segments: ensureSegmentsForEntityCount(segments || [], Math.max(1, slotCount), defaultFallbackTag),
      unassignedClausesText: "",
    };
  }

  const sourceSegments = ensureSegmentsForEntityCount(
    segments || [],
    slotCount,
    defaultFallbackTag
  );
  const knownTagSet = new Set(
    (knownCharacterAnchors || [])
      .map((anchor) => String(anchor?.tag || "").toLowerCase().trim())
      .filter(Boolean)
  );
  for (const segment of sourceSegments) {
    const lower = String(segment?.characterTag || "").toLowerCase().trim();
    if (lower) knownTagSet.add(lower);
  }

  const slotMeta = Array.from({ length: slotCount }, (_, idx) => {
    const segment = sourceSegments[idx] || {};
    const genderAnchor =
      normalizeEntityGenderHint(entitySlots?.[idx]?.gender) ||
      normalizeEntityGenderHint(segment?.slotGender) ||
      normalizeEntityGenderHint(segment?.fallbackEntityTag) ||
      "";
    let knownCharTag = String(segment?.characterTag || "").toLowerCase().trim();
    if (knownTagSet.size && knownCharTag && !knownTagSet.has(knownCharTag)) {
      knownCharTag = "";
    }
    const explicitSlotSubjectTag = String(entitySlots?.[idx]?.subjectTag || "")
      .toLowerCase()
      .trim();
    const segmentSubjectTag = String(segment?.subjectTag || "")
      .toLowerCase()
      .trim();
    const shouldUseSegmentSubjectTag = !normalizeEntityGenderHint(genderAnchor);
    const subjectTag = String(
      explicitSlotSubjectTag || (shouldUseSegmentSubjectTag ? segmentSubjectTag : "")
    )
      .toLowerCase()
      .trim();
    const hasHumanGenderAnchor = Boolean(normalizeEntityGenderHint(genderAnchor));
    const subjectKind =
      normalizeSubjectKind(entitySlots?.[idx]?.subjectKind) ||
      (hasHumanGenderAnchor ? "human" : normalizeSubjectKind(segment?.subjectKind)) ||
      (subjectTag ? "nonhuman" : genderAnchor ? "human" : "");
    return {
      slotIndex: idx + 1,
      genderAnchor,
      knownCharTag,
      subjectKind,
      subjectTag,
      hairAnchor: String(segment?.binderHairAnchor || "").toLowerCase().trim(),
      lastMentionOrder: idx + 1,
    };
  });

  const orderedKnownTags = (knownCharacterAnchors || [])
    .map((anchor) => String(anchor?.tag || "").toLowerCase().trim())
    .filter(Boolean);
  for (let i = 0; i < Math.min(slotMeta.length, orderedKnownTags.length); i += 1) {
    if (!slotMeta[i].knownCharTag) {
      slotMeta[i].knownCharTag = orderedKnownTags[i];
    }
  }

  const clauses = splitTextIntoBinderClauses(userText, charactersPrepared);
  if (!clauses.length) {
    return {
      segments: sourceSegments,
      unassignedClausesText: "",
    };
  }
  const normalizedBinderClauses = clauses
    .map((clause) => normalizeLooseText(normalizeHairAdjectiveAliases(clause)))
    .filter(Boolean);
  const hasExplicitOneOtherPairPattern =
    normalizedBinderClauses.some((clause) => /^one\b/.test(clause)) &&
    normalizedBinderClauses.some((clause) => /^(?:the\s+other|other)\b/.test(clause));

  const buckets = Array.from({ length: slotCount }, () => []);
  const unassignedClauses = [];
  let mentionOrder = slotCount;
  let fallbackCursor = 0;
  let lastResolvedIndex = -1;

  const allSlotIndices = Array.from({ length: slotCount }, (_, idx) => idx);
  const pickMostRecentSlot = (indices) => {
    if (!indices.length) return -1;
    let bestIdx = indices[0];
    for (const idx of indices) {
      const candidate = slotMeta[idx];
      const best = slotMeta[bestIdx];
      if ((candidate?.lastMentionOrder || 0) > (best?.lastMentionOrder || 0)) {
        bestIdx = idx;
        continue;
      }
      if (
        (candidate?.lastMentionOrder || 0) === (best?.lastMentionOrder || 0) &&
        (candidate?.slotIndex || 0) < (best?.slotIndex || 0)
      ) {
        bestIdx = idx;
      }
    }
    return bestIdx;
  };
  const pickLowestSlot = (indices) => {
    if (!indices.length) return -1;
    let bestIdx = indices[0];
    for (const idx of indices) {
      if ((slotMeta[idx]?.slotIndex || 0) < (slotMeta[bestIdx]?.slotIndex || 0)) bestIdx = idx;
    }
    return bestIdx;
  };
  const pickSlotByGender = (gender, preferMostRecent = false) => {
    if (gender !== "girl" && gender !== "boy") return -1;
    const candidates = allSlotIndices.filter((idx) => slotMeta[idx].genderAnchor === gender);
    if (!candidates.length) return -1;
    if (preferMostRecent) return pickMostRecentSlot(candidates);
    const empty = candidates.filter((idx) => !(buckets[idx] || []).length);
    return pickLowestSlot(empty.length ? empty : candidates);
  };
  const pickSlotBySubjectKind = (subjectKind, preferMostRecent = false) => {
    const kind = normalizeSubjectKind(subjectKind);
    if (!kind) return -1;
    let candidates = allSlotIndices.filter(
      (idx) => normalizeSubjectKind(slotMeta[idx]?.subjectKind) === kind
    );
    if (!candidates.length && kind === "nonhuman") {
      candidates = allSlotIndices.filter((idx) => !normalizeEntityGenderHint(slotMeta[idx]?.genderAnchor));
    }
    if (!candidates.length && kind === "human") {
      candidates = allSlotIndices.filter((idx) =>
        normalizeEntityGenderHint(slotMeta[idx]?.genderAnchor)
      );
    }
    if (!candidates.length) return -1;
    if (preferMostRecent) return pickMostRecentSlot(candidates);
    const empty = candidates.filter((idx) => !(buckets[idx] || []).length);
    return pickLowestSlot(empty.length ? empty : candidates);
  };
  const pickSlotForNonHumanTag = (tag, preferMostRecent = false) => {
    const normalizedTag = String(tag || "").toLowerCase().trim();
    if (!normalizedTag) return pickSlotBySubjectKind("nonhuman", preferMostRecent);

    let candidates = allSlotIndices.filter(
      (idx) => String(slotMeta[idx]?.subjectTag || "").toLowerCase().trim() === normalizedTag
    );
    if (!candidates.length) {
      candidates = allSlotIndices.filter(
        (idx) => normalizeSubjectKind(slotMeta[idx]?.subjectKind) === "nonhuman"
      );
    }
    if (!candidates.length) {
      candidates = allSlotIndices.filter((idx) => !normalizeEntityGenderHint(slotMeta[idx]?.genderAnchor));
    }
    if (!candidates.length) return -1;
    if (preferMostRecent) return pickMostRecentSlot(candidates);
    const empty = candidates.filter((idx) => !(buckets[idx] || []).length);
    return pickLowestSlot(empty.length ? empty : candidates);
  };
  const pickSlotForKnownTag = (knownTag) => {
    const normalizedTag = String(knownTag || "").toLowerCase().trim();
    if (!normalizedTag) return -1;

    const existingIdx = slotMeta.findIndex((slot) => slot.knownCharTag === normalizedTag);
    if (existingIdx >= 0) return existingIdx;

    const knownGender = inferKnownCharacterGender(normalizedTag, knownFemaleCharacterTagSet);
    const emptyGenderCompatible = allSlotIndices.filter((idx) => {
      const slot = slotMeta[idx];
      if (slot.knownCharTag) return false;
      if (knownGender === "girl" || knownGender === "boy") {
        return slot.genderAnchor === knownGender;
      }
      return true;
    });
    const emptyAny = allSlotIndices.filter((idx) => !slotMeta[idx].knownCharTag);
    const target =
      pickLowestSlot(emptyGenderCompatible) >= 0
        ? pickLowestSlot(emptyGenderCompatible)
        : pickLowestSlot(emptyAny) >= 0
        ? pickLowestSlot(emptyAny)
        : pickLowestSlot(allSlotIndices);
    if (target >= 0) slotMeta[target].knownCharTag = normalizedTag;
    return target;
  };

  for (const clauseTextRaw of clauses) {
    const clauseText = cleanSegmentText(clauseTextRaw);
    if (!clauseText) continue;
    if (isEntityCountIntroChunk(clauseText) || isLikelyEntityDeclarationOnlyClause(clauseText)) {
      continue;
    }

    const normalizedClauseText = normalizeLooseText(normalizeHairAdjectiveAliases(clauseText));
    if (isCollectiveEntityClauseForBinding(normalizedClauseText, slotCount)) {
      unassignedClauses.push(clauseText);
      continue;
    }
    const clauseHairAnchor = inferHairAnchorFromNormalizedClauseText(normalizedClauseText);
    const clauseKnownMentions = extractKnownCharacterAnchorsFromText(
      clauseText,
      charactersPrepared
    )
      .map((anchor) => String(anchor?.tag || "").toLowerCase().trim())
      .filter((tag) => (knownTagSet.size ? knownTagSet.has(tag) : Boolean(tag)));
    const clauseSubjectHints = inferEntitySubjectHintsFromText(clauseText, {
      subjectEntityPrepared,
      speciesTagSet,
      animalsTagSet,
    });
    const clauseHasHumanCue = Boolean(clauseSubjectHints?.hasHumanCue);
    const clauseHasNonHumanCue = Boolean(clauseSubjectHints?.hasNonHumanCue);
    const clauseNonHumanTag = String(clauseSubjectHints?.primaryNonHumanTag || "")
      .toLowerCase()
      .trim();
    const clauseStartsWithNonHumanCue = new RegExp(
      `^(?:(?:the|a|an|her|his|their)\\s+)?(?:[a-z0-9]+\\s+){0,2}${NON_HUMAN_ENTITY_NOUN_PATTERN}\\b`,
      "i"
    ).test(normalizedClauseText);
    const clauseHasInteractionCue =
      /\b(petting|pet|holding|touching|hugging|feeding|guiding|riding|playing|walking|watching|following)\b/.test(
        normalizedClauseText
      );

    let targetIndex = -1;

    if (targetIndex < 0 && hasExplicitOneOtherPairPattern && slotCount >= 2) {
      if (/^one\b/.test(normalizedClauseText)) {
        targetIndex = 0;
      } else if (/^(?:the\s+other|other)\b/.test(normalizedClauseText)) {
        targetIndex = 1;
      }
    }

    if (clauseKnownMentions.length) {
      targetIndex = pickSlotForKnownTag(clauseKnownMentions[0]);
    }

    if (targetIndex < 0) {
      const ordinalIndex = extractOrdinalIndexFromClauseText(clauseText);
      if (ordinalIndex > 0 && ordinalIndex <= slotCount) {
        targetIndex = ordinalIndex - 1;
      }
    }

    if (targetIndex < 0 && clauseHasNonHumanCue && !clauseHasHumanCue) {
      if (clauseHasInteractionCue && lastResolvedIndex >= 0) {
        const lastSlotKind = normalizeSubjectKind(slotMeta[lastResolvedIndex]?.subjectKind);
        if (lastSlotKind === "human") {
          targetIndex = lastResolvedIndex;
        }
      }
    }

    if (targetIndex < 0 && clauseHasNonHumanCue && !clauseHasHumanCue) {
      const preferMostRecent = /\bthe\b/.test(normalizedClauseText);
      targetIndex = pickSlotForNonHumanTag(clauseNonHumanTag, preferMostRecent);
    }

    if (targetIndex < 0 && clauseHasHumanCue && clauseHasNonHumanCue) {
      if (clauseStartsWithNonHumanCue) {
        targetIndex = pickSlotForNonHumanTag(clauseNonHumanTag, true);
      } else if (clauseHasInteractionCue) {
        targetIndex = pickSlotBySubjectKind("human", true);
      }
    }

    if (targetIndex < 0 && clauseHairAnchor) {
      const explicitGender = inferExplicitGenderFromNormalizedClauseText(normalizedClauseText);
      const preferredGender = explicitGender || "girl";
      let byHairAnchor = allSlotIndices.filter((idx) => {
        const slot = slotMeta[idx];
        if (slot.hairAnchor !== clauseHairAnchor) return false;
        if (explicitGender === "girl" || explicitGender === "boy") {
          return slot.genderAnchor === explicitGender;
        }
        return true;
      });
      if (!explicitGender && byHairAnchor.length) {
        const femaleByHair = byHairAnchor.filter((idx) => slotMeta[idx].genderAnchor === "girl");
        if (femaleByHair.length) byHairAnchor = femaleByHair;
      }
      if (byHairAnchor.length) {
        targetIndex = pickMostRecentSlot(byHairAnchor);
      } else {
        let candidates = allSlotIndices.filter(
          (idx) => slotMeta[idx].genderAnchor === preferredGender
        );
        if (!candidates.length && explicitGender) {
          candidates = allSlotIndices.filter(
            (idx) => slotMeta[idx].genderAnchor === explicitGender
          );
        }
        if (!candidates.length) candidates = [...allSlotIndices];
        const available = candidates.filter((idx) => !slotMeta[idx].hairAnchor);
        let pool = available.length ? available : candidates;
        const nonKnownPool = pool.filter((idx) => !slotMeta[idx].knownCharTag);
        if (nonKnownPool.length) pool = nonKnownPool;
        targetIndex = pickLowestSlot(pool);
      }
    }

    if (targetIndex < 0) {
      const pronounGender = inferPronounGenderFromNormalizedClauseText(normalizedClauseText);
      if (pronounGender === "girl" || pronounGender === "boy") {
        const candidates = allSlotIndices.filter(
          (idx) => slotMeta[idx].genderAnchor === pronounGender
        );
        targetIndex = pickMostRecentSlot(candidates);
      }
    }

    if (targetIndex < 0) {
      const explicitGender = inferExplicitGenderFromNormalizedClauseText(normalizedClauseText);
      if (explicitGender === "girl" || explicitGender === "boy") {
        const preferMostRecent = /\bthe\s+(woman|girl|man|boy)\b/.test(normalizedClauseText);
        targetIndex = pickSlotByGender(explicitGender, preferMostRecent);
      }
    }

    if (targetIndex < 0 && clauseHasNonHumanCue) {
      targetIndex = pickSlotForNonHumanTag(clauseNonHumanTag, /\bthe\b/.test(normalizedClauseText));
    }

    if (targetIndex < 0) {
      if (lastResolvedIndex >= 0 && lastResolvedIndex < slotCount) {
        targetIndex = lastResolvedIndex;
      } else {
        targetIndex = Math.min(fallbackCursor, slotCount - 1);
        if (fallbackCursor < slotCount - 1) fallbackCursor += 1;
      }
    }
    if (targetIndex < 0 || targetIndex >= slotCount) continue;

    const targetSlot = slotMeta[targetIndex];
    if (!targetSlot.knownCharTag && clauseKnownMentions.length) {
      targetSlot.knownCharTag = clauseKnownMentions[0];
    }
    if (clauseHairAnchor && !targetSlot.hairAnchor) {
      targetSlot.hairAnchor = clauseHairAnchor;
    }
    const slotHasHumanAnchor = Boolean(normalizeEntityGenderHint(targetSlot.genderAnchor));
    const slotSubjectKind = normalizeSubjectKind(targetSlot.subjectKind);
    const hasHumanActorInteractionLead =
      clauseHasHumanCue && clauseHasInteractionCue && !clauseStartsWithNonHumanCue;
    if (hasHumanActorInteractionLead) {
      targetSlot.subjectKind = "human";
      targetSlot.subjectTag = "";
    } else if (
      clauseNonHumanTag &&
      !slotHasHumanAnchor &&
      slotSubjectKind !== "human" &&
      !clauseHasHumanCue
    ) {
      targetSlot.subjectKind = "nonhuman";
      if (!targetSlot.subjectTag) targetSlot.subjectTag = clauseNonHumanTag;
    } else if (
      clauseHasNonHumanCue &&
      !slotHasHumanAnchor &&
      slotSubjectKind !== "human" &&
      !targetSlot.subjectKind &&
      !clauseHasHumanCue
    ) {
      targetSlot.subjectKind = "nonhuman";
    } else if (clauseHasHumanCue && !targetSlot.subjectKind) {
      targetSlot.subjectKind = "human";
    }

    buckets[targetIndex].push(clauseText);
    mentionOrder += 1;
    targetSlot.lastMentionOrder = mentionOrder;
    lastResolvedIndex = targetIndex;
  }

  const hasAssignedClauses = buckets.some((bucket) => (bucket || []).length > 0);
  const assignedSegments = sourceSegments.map((segment, idx) => {
    const slot = slotMeta[idx] || {};
    const bucketText = cleanSegmentText((buckets[idx] || []).join(". "));
    const sourceText = cleanSegmentText(String(segment?.text || ""));
    const slotSubjectTag = String(slot?.subjectTag || "")
      .toLowerCase()
      .trim();
    const slotSubjectKind = normalizeSubjectKind(slot?.subjectKind) || (slotSubjectTag ? "nonhuman" : "");
    const segmentFallbackTag = String(segment?.fallbackEntityTag || "")
      .toLowerCase()
      .trim();
    const segmentFallbackNonHuman =
      segmentFallbackTag &&
      ((speciesTagSet instanceof Set && speciesTagSet.has(segmentFallbackTag)) ||
        (animalsTagSet instanceof Set && animalsTagSet.has(segmentFallbackTag)));
    const fallbackEntityTag =
      (slotSubjectKind === "nonhuman"
        ? slotSubjectTag || (segmentFallbackNonHuman ? segmentFallbackTag : "")
        : "") ||
      normalizeEntityGenderHint(slot.genderAnchor) ||
      normalizeEntityGenderHint(segment?.fallbackEntityTag) ||
      normalizeEntityGenderHint(defaultFallbackTag) ||
      "girl";
    return {
      ...segment,
      text: hasAssignedClauses ? bucketText : sourceText,
      characterTag: String(slot.knownCharTag || segment?.characterTag || "").trim(),
      fallbackEntityTag,
      binderHairAnchor: String(slot.hairAnchor || "").trim(),
      subjectKind:
        slotSubjectKind ||
        normalizeSubjectKind(segment?.subjectKind) ||
        (normalizeEntityGenderHint(slot.genderAnchor) ? "human" : ""),
      subjectTag:
        slotSubjectTag ||
        (slotSubjectKind === "nonhuman"
          ? String(segment?.subjectTag || "").toLowerCase().trim()
          : ""),
    };
  });
  return {
    segments: assignedSegments,
    unassignedClausesText: cleanSegmentText(unassignedClauses.join(". ")),
  };
}

function ensureSegmentsForEntityCount(segments, entityCount, defaultFallbackTag = "woman") {
  const out = [];
  for (let i = 0; i < entityCount; i += 1) {
    const source = segments?.[i] || {};
    const text = cleanSegmentText(String(source.text || ""));
    const characterTag = String(source.characterTag || "").trim();
    const fallbackEntityTag =
      String(source.fallbackEntityTag || "").trim().toLowerCase() ||
      inferSegmentFallbackEntityTag(text, defaultFallbackTag);
    const subjectTag = String(source.subjectTag || "")
      .trim()
      .toLowerCase();
    const subjectKind = normalizeSubjectKind(source.subjectKind) || (subjectTag ? "nonhuman" : "");
    out.push({
      label: `char${i + 1}`,
      text,
      characterTag,
      fallbackEntityTag,
      subjectTag,
      subjectKind,
    });
  }
  return out;
}

function buildEntitySegmentationPlan({
  userText,
  maskTextForSplit,
  charactersPrepared,
  knownFemaleCharacterTagSet,
  matcherTagsFromFullText = [],
  subjectEntityPrepared = [],
  speciesTagSet,
  animalsTagSet,
}) {
  const rawText = String(userText || "");
  const cleanedSingleText = cleanSegmentText(rawText);
  const fullTextSubjectHints = inferEntitySubjectHintsFromText(rawText, {
    matcherTags: matcherTagsFromFullText,
    subjectEntityPrepared,
    speciesTagSet,
    animalsTagSet,
  });
  const knownCharacterAnchors = extractKnownCharacterAnchorsFromText(rawText, charactersPrepared);
  const knownCharacterCount = knownCharacterAnchors.length;
  const mixedKnownGenericHint = inferMixedKnownGenericEntityHint(rawText, knownCharacterCount);
  const explicitPlan = buildExplicitEntityPlanFromText(rawText);
  const explicitCounts = inferExplicitEntityCountsFromText(rawText);
  const hasExplicitCounts = explicitPlan.hasExplicitCounts;
  const hasStrongHumanCue =
    fullTextSubjectHints.hasHumanCue ||
    knownCharacterCount > 0 ||
    Number(explicitPlan.entityCount || 0) > 0 ||
    Number(explicitCounts.entityCount || 0) > 0;
  const shouldAvoidHumanDefaults =
    fullTextSubjectHints.hasNonHumanCue && !hasStrongHumanCue;
  const inferredNonHumanEntityTags = dedupePreserveOrder([
    ...(fullTextSubjectHints.ownedNonHumanTags || []),
    ...(fullTextSubjectHints.lexicalNonHumanTags || []),
  ]);
  const explicitPluralNonHumanCounts = extractExplicitPluralNonHumanEntityCountsFromText(rawText);
  if (!inferredNonHumanEntityTags.length && fullTextSubjectHints.primaryNonHumanTag) {
    inferredNonHumanEntityTags.push(fullTextSubjectHints.primaryNonHumanTag);
  }
  const nonHumanEntityCount = Math.max(
    inferredNonHumanEntityTags.length,
    Number(explicitPluralNonHumanCounts.totalCount || 0)
  );
  const minimumHumanEntityCount = Math.max(
    Number(explicitPlan.entityCount || 0),
    Number(explicitCounts.entityCount || 0),
    hasStrongHumanCue ? 1 : 0
  );
  const mixedHumanNonHumanMinEntityCount =
    hasStrongHumanCue && nonHumanEntityCount > 0
      ? Math.max(2, minimumHumanEntityCount + nonHumanEntityCount)
      : nonHumanEntityCount >= 2
      ? nonHumanEntityCount
      : 0;
  const ordinalCount = inferOrdinalEntityCountFromText(rawText);
  const knownCharacterSplit = splitKnownCharactersByAnchors(
    rawText,
    charactersPrepared,
    knownFemaleCharacterTagSet
  );
  const knownCharacterSplitCount = knownCharacterSplit?.anchors?.length || 0;

  const inferredEntityCount = hasExplicitCounts
    ? Math.max(
        1,
        Number(explicitPlan.entityCount || 0),
        Number(ordinalCount || 0),
        Number(knownCharacterSplitCount || 0),
        Number(knownCharacterCount || 0),
        Number(mixedHumanNonHumanMinEntityCount || 0)
      )
    : Math.max(
        1,
        Number(explicitCounts.entityCount || 0),
        Number(ordinalCount || 0),
        Number(knownCharacterSplitCount || 0),
        Number(knownCharacterCount || 0),
        Number(mixedKnownGenericHint.minEntityCount || 0),
        Number(mixedHumanNonHumanMinEntityCount || 0)
      );
  const entityCount = Math.max(1, Math.min(ENTITY_SEGMENT_LIMIT, inferredEntityCount));
  const multiEntityMode = entityCount >= 2;

  let baselinePeopleTags = hasExplicitCounts
    ? dedupePreserveOrder(explicitPlan.groupTags || [])
    : dedupePreserveOrder(explicitCounts.peopleTags || []);
  if (!baselinePeopleTags.length && knownCharacterSplit?.peopleTags?.length) {
    baselinePeopleTags = dedupePreserveOrder(knownCharacterSplit.peopleTags);
  }
  const defaultFallbackTag = inferDefaultEntityFallbackTag(baselinePeopleTags);

  let segments;
  if (!multiEntityMode) {
    segments = [
      {
        label: "char1",
        text: cleanedSingleText,
        characterTag: "",
        fallbackEntityTag:
          (shouldAvoidHumanDefaults && fullTextSubjectHints.primaryNonHumanTag) ||
          inferSegmentFallbackEntityTag(cleanedSingleText, defaultFallbackTag),
      },
    ];
  } else if (hasExplicitCounts) {
    segments = buildOrdinalSegmentsFromText(rawText, entityCount, defaultFallbackTag);
    if (!segments && knownCharacterSplit?.segments?.length >= 2) {
      segments = knownCharacterSplit.segments;
    }
    if (!segments) {
      segments = buildSequentialSegmentsFromText(
        rawText,
        entityCount,
        maskTextForSplit,
        defaultFallbackTag,
        explicitPlan.entitySlots
      );
    }
  } else {
    segments = buildOrdinalSegmentsFromText(rawText, entityCount, defaultFallbackTag);
    if (!segments && knownCharacterSplit?.segments?.length >= 2) {
      segments = knownCharacterSplit.segments;
    }
    if (!segments) {
      segments = buildSequentialSegmentsFromText(
        rawText,
        entityCount,
        maskTextForSplit,
        defaultFallbackTag
      );
    }
  }

  segments = ensureSegmentsForEntityCount(segments || [], entityCount, defaultFallbackTag);
  if (hasExplicitCounts) {
    segments = rebalanceExplicitEntityRefClauses(segments, explicitPlan.entitySlots);
    segments = ensureSegmentsForEntityCount(segments || [], entityCount, defaultFallbackTag);
  }
  const knownAnchorsForAssignment = knownCharacterSplit?.anchors?.length
    ? knownCharacterSplit.anchors
    : knownCharacterAnchors;
  segments = assignKnownCharacterTagsToSegments(
    segments,
    knownAnchorsForAssignment,
    charactersPrepared
  );
  const segmentSubjectHints = (segments || []).map((segment) =>
    inferEntitySubjectHintsFromText(String(segment?.text || ""), {
      subjectEntityPrepared,
      speciesTagSet,
      animalsTagSet,
    })
  );
  const humanLockedSlotSet = new Set();
  if (hasExplicitCounts) {
    for (let i = 0; i < entityCount; i += 1) {
      const explicitGender = normalizeEntityGenderHint(explicitPlan?.entitySlots?.[i]?.gender);
      if (!explicitGender) continue;
      humanLockedSlotSet.add(i);
    }
  }
  const findPreferredNonHumanIndex = (predicate) => {
    for (let idx = entityCount - 1; idx >= 0; idx -= 1) {
      if (humanLockedSlotSet.has(idx)) continue;
      const hint = segmentSubjectHints[idx];
      if (predicate(hint)) return idx;
    }
    return -1;
  };
  let seededNonHumanIndex = -1;
  if (fullTextSubjectHints.hasHumanCue && fullTextSubjectHints.hasNonHumanCue && entityCount >= 2) {
    seededNonHumanIndex = findPreferredNonHumanIndex(
      (hint) => hint?.hasNonHumanCue && !hint?.hasHumanCue
    );
    if (seededNonHumanIndex < 0) {
      const fallbackIndex = Math.min(1, entityCount - 1);
      seededNonHumanIndex = humanLockedSlotSet.has(fallbackIndex) ? -1 : fallbackIndex;
    }
  } else if (shouldAvoidHumanDefaults && fullTextSubjectHints.primaryNonHumanTag) {
    seededNonHumanIndex = 0;
  }
  segments = (segments || []).map((segment, idx) => {
    const hint = segmentSubjectHints[idx] || {};
    const isHumanLockedSlot = humanLockedSlotSet.has(idx);
    const seededSubjectTag =
      idx === seededNonHumanIndex
        ? String(hint?.primaryNonHumanTag || fullTextSubjectHints.primaryNonHumanTag || "")
        : "";
    const localNonHumanOnlyTag =
      hint?.hasNonHumanCue && !hint?.hasHumanCue ? String(hint?.primaryNonHumanTag || "") : "";
    const subjectTag = String(isHumanLockedSlot ? "" : seededSubjectTag || localNonHumanOnlyTag)
      .toLowerCase()
      .trim();
    const subjectKind = isHumanLockedSlot
      ? "human"
      : subjectTag
      ? "nonhuman"
      : hint?.hasHumanCue
      ? "human"
      : String(segment?.subjectKind || "").toLowerCase();
    return {
      ...segment,
      subjectTag,
      subjectKind: normalizeSubjectKind(subjectKind),
    };
  });

  let entitySlots;
  if (hasExplicitCounts) {
    entitySlots = (explicitPlan.entitySlots || []).map((slot) => ({
      gender: normalizeEntityGenderHint(slot?.gender) || "",
      anchorTag: normalizeEntityGenderHint(slot?.anchorTag) || "",
      subjectKind: normalizeSubjectKind(slot?.subjectKind),
      subjectTag: String(slot?.subjectTag || "").toLowerCase().trim(),
    }));
  } else {
    entitySlots = Array.from({ length: entityCount }, () => ({
      gender: "",
      anchorTag: "",
      subjectKind: "",
      subjectTag: "",
    }));
    const inferredSeedGenders = [];
    for (let i = 0; i < Number(explicitCounts.girlsCount || 0); i += 1) {
      inferredSeedGenders.push("girl");
    }
    for (let i = 0; i < Number(explicitCounts.boysCount || 0); i += 1) {
      inferredSeedGenders.push("boy");
    }
    for (let i = 0; i < Math.min(entityCount, inferredSeedGenders.length); i += 1) {
      const gender = inferredSeedGenders[i];
      entitySlots[i] = {
        ...entitySlots[i],
        gender,
        anchorTag: gender,
      };
    }
  }
  while (entitySlots.length < entityCount) {
    entitySlots.push({ gender: "", anchorTag: "", subjectKind: "", subjectTag: "" });
  }
  entitySlots = entitySlots.slice(0, entityCount);

  for (let i = 0; i < entitySlots.length; i += 1) {
    const segmentSubjectTag = String(segments?.[i]?.subjectTag || "")
      .toLowerCase()
      .trim();
    const segmentSubjectKind =
      normalizeSubjectKind(segments?.[i]?.subjectKind) || (segmentSubjectTag ? "nonhuman" : "");
    const presetGender = normalizeEntityGenderHint(entitySlots[i]?.gender);
    if (presetGender) {
      entitySlots[i] = {
        ...entitySlots[i],
        gender: presetGender,
        anchorTag: presetGender,
        subjectKind: "human",
        subjectTag: "",
      };
      continue;
    }

    const hintedGender =
      segmentSubjectKind === "nonhuman"
        ? ""
        : inferSlotGenderHintFromSegment(segments[i], knownFemaleCharacterTagSet);
    entitySlots[i] = {
      ...entitySlots[i],
      gender: hintedGender || "",
      anchorTag: hintedGender || "",
      subjectKind:
        segmentSubjectKind ||
        (hintedGender ? "human" : normalizeSubjectKind(entitySlots[i]?.subjectKind)),
      subjectTag: segmentSubjectTag || String(entitySlots[i]?.subjectTag || "").toLowerCase(),
    };
  }

  const nonHumanSeedTags = dedupePreserveOrder([
    ...(inferredNonHumanEntityTags || []),
    ...(segmentSubjectHints || []).map((hint) =>
      String(hint?.primaryNonHumanTag || "").toLowerCase().trim()
    ),
    ...(segments || []).map((segment) => String(segment?.subjectTag || "").toLowerCase().trim()),
  ]).filter((tag) => {
    if (!tag) return false;
    return speciesTagSet.has(tag) || animalsTagSet.has(tag);
  });
  const pickNonHumanSeedSlotIndex = () => {
    for (let idx = entitySlots.length - 1; idx >= 0; idx -= 1) {
      if (humanLockedSlotSet.has(idx)) continue;
      const slot = entitySlots[idx] || {};
      const slotGender = normalizeEntityGenderHint(slot?.gender);
      const slotSubjectKind = normalizeSubjectKind(slot?.subjectKind);
      const slotSubjectTag = String(slot?.subjectTag || "").toLowerCase().trim();
      const slotText = cleanSegmentText(String(segments?.[idx]?.text || ""));
      if (slotSubjectKind === "nonhuman" && !slotSubjectTag) return idx;
      if (!slotGender && !slotSubjectTag && !slotText) return idx;
    }
    for (let idx = entitySlots.length - 1; idx >= 0; idx -= 1) {
      if (humanLockedSlotSet.has(idx)) continue;
      const slot = entitySlots[idx] || {};
      const slotGender = normalizeEntityGenderHint(slot?.gender);
      if (!slotGender) return idx;
    }
    return -1;
  };
  for (const nonHumanTag of nonHumanSeedTags) {
    const existingIdx = entitySlots.findIndex((slot) => {
      const slotTag = String(slot?.subjectTag || "").toLowerCase().trim();
      if (slotTag !== nonHumanTag) return false;
      return normalizeSubjectKind(slot?.subjectKind) === "nonhuman";
    });
    if (existingIdx >= 0) continue;
    const targetIdx = pickNonHumanSeedSlotIndex();
    if (targetIdx < 0) break;
    entitySlots[targetIdx] = {
      ...entitySlots[targetIdx],
      gender: "",
      anchorTag: "",
      subjectKind: "nonhuman",
      subjectTag: nonHumanTag,
    };
    segments[targetIdx] = {
      ...(segments[targetIdx] || { label: `char${targetIdx + 1}`, text: "" }),
      subjectKind: "nonhuman",
      subjectTag: nonHumanTag,
      fallbackEntityTag:
        String(segments?.[targetIdx]?.fallbackEntityTag || "").toLowerCase().trim() || nonHumanTag,
    };
  }
  for (const [nonHumanTagRaw, desiredCountRaw] of explicitPluralNonHumanCounts.countsByTag.entries()) {
    const nonHumanTag = String(nonHumanTagRaw || "").toLowerCase().trim();
    const desiredCount = Math.max(0, Number(desiredCountRaw) || 0);
    if (!nonHumanTag || desiredCount <= 1) continue;
    let assignedCount = entitySlots.filter((slot) => {
      const slotTag = String(slot?.subjectTag || "").toLowerCase().trim();
      if (slotTag !== nonHumanTag) return false;
      return normalizeSubjectKind(slot?.subjectKind) === "nonhuman";
    }).length;
    while (assignedCount < desiredCount) {
      const targetIdx = pickNonHumanSeedSlotIndex();
      if (targetIdx < 0) break;
      entitySlots[targetIdx] = {
        ...entitySlots[targetIdx],
        gender: "",
        anchorTag: "",
        subjectKind: "nonhuman",
        subjectTag: nonHumanTag,
      };
      segments[targetIdx] = {
        ...(segments[targetIdx] || { label: `char${targetIdx + 1}`, text: "" }),
        subjectKind: "nonhuman",
        subjectTag: nonHumanTag,
        fallbackEntityTag:
          String(segments?.[targetIdx]?.fallbackEntityTag || "").toLowerCase().trim() ||
          nonHumanTag,
      };
      assignedCount += 1;
    }
  }

  if (
    mixedKnownGenericHint.hasHint &&
    (mixedKnownGenericHint.additionalGender === "girl" ||
      mixedKnownGenericHint.additionalGender === "boy")
  ) {
    const hasAdditionalGender = entitySlots.some(
      (slot) => normalizeEntityGenderHint(slot?.gender) === mixedKnownGenericHint.additionalGender
    );
    if (!hasAdditionalGender) {
      const emptyIdx = entitySlots.findIndex((slot) => {
        if (normalizeSubjectKind(slot?.subjectKind) === "nonhuman") return false;
        return !normalizeEntityGenderHint(slot?.gender);
      });
      if (emptyIdx >= 0) {
        entitySlots[emptyIdx] = {
          ...entitySlots[emptyIdx],
          gender: mixedKnownGenericHint.additionalGender,
          anchorTag: mixedKnownGenericHint.additionalGender,
          subjectKind: "human",
        };
      }
    }
  }

  const hasNonHumanCueInScene = Boolean(fullTextSubjectHints.hasNonHumanCue);
  const hasUnanchoredSlots = entitySlots.some((slot) => {
    if (normalizeSubjectKind(slot?.subjectKind) === "nonhuman") return false;
    return !normalizeEntityGenderHint(slot?.gender);
  });
  const slotFallbackGender =
    shouldAvoidHumanDefaults || (hasNonHumanCueInScene && hasUnanchoredSlots)
      ? ""
      : normalizeEntityGenderHint(defaultFallbackTag) || "girl";
  entitySlots = ensureEntitySlotsHaveAnchors(entitySlots, slotFallbackGender);
  let unassignedClausesText = "";
  if (multiEntityMode) {
    const bindResult = bindClausesToEntitySlots({
      userText: rawText,
      segments,
      entitySlots,
      charactersPrepared,
      knownCharacterAnchors: knownAnchorsForAssignment,
      knownFemaleCharacterTagSet,
      defaultFallbackTag,
      subjectEntityPrepared,
      speciesTagSet,
      animalsTagSet,
    });
    segments = bindResult?.segments || segments;
    unassignedClausesText = String(bindResult?.unassignedClausesText || "").trim();
    segments = ensureSegmentsForEntityCount(segments || [], entityCount, defaultFallbackTag);
    segments = assignKnownCharacterTagsToSegments(
      segments,
      knownAnchorsForAssignment,
      charactersPrepared
    );
  }
  segments = segments.map((segment, idx) => {
    const slot = entitySlots[idx] || {
      gender: "",
      anchorTag: "",
      subjectKind: "",
      subjectTag: "",
    };
    const slotSubjectKind = normalizeSubjectKind(slot.subjectKind);
    const slotSubjectTag = String(slot.subjectTag || "").toLowerCase().trim();
    const fallbackEntityTag =
      slotSubjectKind === "nonhuman"
        ? slotSubjectTag
        : String(slot.gender || "").toLowerCase().trim();
    return {
      ...segment,
      fallbackEntityTag:
        fallbackEntityTag ||
        String(segment?.fallbackEntityTag || "").toLowerCase().trim(),
      slotGender: slot.gender,
      anchorTag: slot.anchorTag,
      subjectKind:
        slotSubjectKind || normalizeSubjectKind(segment?.subjectKind) || (slot.gender ? "human" : ""),
      subjectTag:
        slotSubjectTag ||
        (slotSubjectKind === "nonhuman"
          ? String(segment?.subjectTag || "").toLowerCase().trim()
          : ""),
    };
  });

  let peopleTags = buildPeopleTagsFromEntitySlots(entitySlots);
  if (!peopleTags.length && hasExplicitCounts) {
    peopleTags = dedupePreserveOrder(explicitPlan.groupTags || []);
  }
  if (!peopleTags.length) {
    peopleTags = inferPeopleTagsFromSegmentFallbacks(segments);
  }
  if (!peopleTags.length && !hasExplicitCounts && explicitCounts.genericCount >= 2) {
    peopleTags = [`${Math.min(entityCount, explicitCounts.genericCount)}girls`];
  }

  return {
    multiEntityMode,
    entityCount,
    peopleTags,
    entitySlots,
    hasExplicitCounts,
    segments,
    unassignedClausesText,
  };
}

function buildEntitySegmentsFromText(userText) {
  const sentences = splitTextIntoSentences(userText);
  // Keep one-sentence prompts on the legacy deterministic split path.
  if (sentences.length < 2) return null;

  const NUMBER_TOKEN_TO_COUNT = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
  };
  const ORDINAL_TO_INDEX = {
    first: 1,
    second: 2,
    third: 3,
  };
  const ENTITY_LIMIT = 4;
  const entities = [];
  const sentenceByEntityId = new Map();
  const pendingBeforeEntities = [];
  let lastReferencedEntity = null;
  const lastReferencedByGender = {
    girl: null,
    boy: null,
    unknown: null,
  };

  const getEntitiesByGender = (gender) =>
    entities.filter((entity) => String(entity.gender) === String(gender));
  const getChar1 = () => entities[0] || null;
  const assignSentenceToEntity = (entity, sentenceText) => {
    if (!entity) return;
    const sentence = cleanSegmentText(sentenceText);
    if (!sentence) return;
    const list = sentenceByEntityId.get(entity.id) || [];
    list.push(sentence);
    sentenceByEntityId.set(entity.id, list);
  };
  const markEntityReferenced = (entity) => {
    if (!entity) return;
    lastReferencedEntity = entity;
    const gender = String(entity.gender || "unknown");
    if (gender === "girl" || gender === "boy" || gender === "unknown") {
      lastReferencedByGender[gender] = entity;
    }
    lastReferencedByGender.unknown = entity;
  };
  const flushPendingToChar1 = () => {
    const char1 = getChar1();
    if (!char1 || !pendingBeforeEntities.length) return;
    for (const pending of pendingBeforeEntities) {
      assignSentenceToEntity(char1, pending);
    }
    pendingBeforeEntities.length = 0;
  };
  const createEntity = (gender, createdBy) => {
    if (entities.length >= ENTITY_LIMIT) {
      return {
        entity: entities[ENTITY_LIMIT - 1] || null,
        isNew: false,
        overflow: true,
      };
    }

    const entity = {
      id: entities.length + 1,
      label: `char${entities.length + 1}`,
      gender: gender === "girl" || gender === "boy" ? gender : "unknown",
      hairLabel: "",
      createdBy,
    };
    entities.push(entity);
    sentenceByEntityId.set(entity.id, sentenceByEntityId.get(entity.id) || []);
    flushPendingToChar1();
    return {
      entity,
      isNew: true,
      overflow: false,
    };
  };
  const setHairLabelFromSentence = (entity, sentenceNorm) => {
    if (!entity) return;
    const hairMentions = [];
    const hairRegex = /\b(blonde|brunette|redhead)\b/gi;
    let match;
    while ((match = hairRegex.exec(sentenceNorm)) !== null) {
      const value = String(match[1] || "").toLowerCase();
      if (value && !hairMentions.includes(value)) hairMentions.push(value);
      if (match.index === hairRegex.lastIndex) hairRegex.lastIndex += 1;
    }
    if (hairMentions.length === 1) {
      entity.hairLabel = hairMentions[0];
    }
  };
  const inferGenderHintFromSentence = (sentenceNorm) => {
    if (/\b(woman|girl)\b/i.test(sentenceNorm)) return "girl";
    if (/\b(man|boy)\b/i.test(sentenceNorm)) return "boy";
    return "";
  };
  const resolveTargetEntity = (sentenceNorm) => {
    // 1) Ordinal references.
    const ordinalRegex = /\bthe\s+(first|second|third)\s+(woman|girl|man|boy)\b/gi;
    let ordinalMatch;
    while ((ordinalMatch = ordinalRegex.exec(sentenceNorm)) !== null) {
      const ordinal = String(ordinalMatch[1] || "").toLowerCase();
      const noun = String(ordinalMatch[2] || "").toLowerCase();
      const gender = noun === "woman" || noun === "girl" ? "girl" : "boy";
      const ordinalIndex = ORDINAL_TO_INDEX[ordinal] || 0;
      const byGender = getEntitiesByGender(gender);
      const target = ordinalIndex > 0 ? byGender[ordinalIndex - 1] : null;
      return target || getChar1();
    }

    // 2) "the other woman/man".
    const otherMatch = /\bthe\s+other\s+(woman|girl|man|boy)\b/i.exec(sentenceNorm);
    if (otherMatch) {
      const noun = String(otherMatch[1] || "").toLowerCase();
      const gender = noun === "woman" || noun === "girl" ? "girl" : "boy";
      const byGender = getEntitiesByGender(gender);
      if (byGender.length === 2) {
        const recent = lastReferencedByGender[gender];
        if (recent && byGender.includes(recent)) {
          return byGender[0] === recent ? byGender[1] : byGender[0];
        }
        return byGender[1];
      }
      return byGender[1] || getChar1();
    }

    // 3) Hair label references.
    const hairMatch = /\bthe\s+(blonde|brunette|redhead)\b/i.exec(sentenceNorm);
    if (hairMatch) {
      const hairLabel = String(hairMatch[1] || "").toLowerCase();
      const exact = entities.filter(
        (entity) => String(entity.hairLabel || "").toLowerCase() === hairLabel
      );
      if (exact.length === 1) return exact[0];

      const genderHint = inferGenderHintFromSentence(sentenceNorm);
      if (genderHint && lastReferencedByGender[genderHint]) {
        return lastReferencedByGender[genderHint];
      }
      return getChar1();
    }

    // 4) "the woman/man" references.
    const nounMatch = /\bthe\s+(woman|girl|man|boy)\b/i.exec(sentenceNorm);
    if (nounMatch) {
      const noun = String(nounMatch[1] || "").toLowerCase();
      const gender = noun === "woman" || noun === "girl" ? "girl" : "boy";
      const byGender = getEntitiesByGender(gender);
      if (byGender.length === 1) return byGender[0];
      if (lastReferencedByGender[gender]) return lastReferencedByGender[gender];
      return getChar1();
    }

    return null;
  };

  for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex += 1) {
    const sentenceText = sentences[sentenceIndex];
    const sentenceNorm = normalizeLooseText(sentenceText);
    if (!sentenceNorm) continue;

    const createdGirls = [];
    const createdBoys = [];
    const entitiesAtSentenceStart = entities.length;
    let overflowInSentence = false;

    const explicitCountRegex = /\b(\d+|two|three|four|five)\s+(women|men|girls|boys)\b/gi;
    let countMatch;
    while ((countMatch = explicitCountRegex.exec(sentenceNorm)) !== null) {
      const countToken = String(countMatch[1] || "").toLowerCase();
      const noun = String(countMatch[2] || "").toLowerCase();
      const count = Number(NUMBER_TOKEN_TO_COUNT[countToken] || 0);
      if (count <= 0) continue;

      const gender = noun === "women" || noun === "girls" ? "girl" : "boy";
      for (let i = 0; i < count; i += 1) {
        const created = createEntity(gender, `explicit:${countToken}_${noun}`);
        if (created.overflow) overflowInSentence = true;
        if (!created.isNew || !created.entity) continue;
        if (gender === "girl") createdGirls.push(created.entity);
        if (gender === "boy") createdBoys.push(created.entity);
      }
      if (countMatch.index === explicitCountRegex.lastIndex) {
        explicitCountRegex.lastIndex += 1;
      }
    }

    // Seed creation only when there are no existing entities yet.
    if (entitiesAtSentenceStart === 0) {
      const hasWomanSeed = /\b(a|the)\s+woman\b/i.test(sentenceNorm);
      const hasManSeed = /\b(a|the)\s+man\b/i.test(sentenceNorm);

      if (sentenceIndex === 0 && hasWomanSeed && hasManSeed) {
        const createdGirl = createEntity("girl", "seed:first_sentence_woman");
        const createdBoy = createEntity("boy", "seed:first_sentence_man");
        if (createdGirl.overflow || createdBoy.overflow) overflowInSentence = true;
        if (createdGirl.isNew && createdGirl.entity) createdGirls.push(createdGirl.entity);
        if (createdBoy.isNew && createdBoy.entity) createdBoys.push(createdBoy.entity);
      } else if (hasWomanSeed) {
        const createdGirl = createEntity("girl", "seed:first_woman");
        if (createdGirl.overflow) overflowInSentence = true;
        if (createdGirl.isNew && createdGirl.entity) createdGirls.push(createdGirl.entity);
      } else if (hasManSeed) {
        const createdBoy = createEntity("boy", "seed:first_man");
        if (createdBoy.overflow) overflowInSentence = true;
        if (createdBoy.isNew && createdBoy.entity) createdBoys.push(createdBoy.entity);
      }
    }

    const incrementalRegex = /\banother\s+(woman|man)\b/gi;
    let incrementalMatch;
    while ((incrementalMatch = incrementalRegex.exec(sentenceNorm)) !== null) {
      const noun = String(incrementalMatch[1] || "").toLowerCase();
      const gender = noun === "woman" ? "girl" : "boy";
      const created = createEntity(gender, `incremental:another_${noun}`);
      if (created.overflow) overflowInSentence = true;
      if (created.isNew && created.entity) {
        if (gender === "girl") createdGirls.push(created.entity);
        if (gender === "boy") createdBoys.push(created.entity);
      }
      if (incrementalMatch.index === incrementalRegex.lastIndex) {
        incrementalRegex.lastIndex += 1;
      }
    }

    let skipDefaultSentenceRouting = false;
    const hairPairMatch = /\bone\s+(blonde|brunette|redhead)\s+(?:and\s+)?one\s+(blonde|brunette|redhead)\b/i.exec(
      sentenceNorm
    );
    if (hairPairMatch) {
      const firstHair = String(hairPairMatch[1] || "").toLowerCase();
      const secondHair = String(hairPairMatch[2] || "").toLowerCase();
      if (createdGirls.length === 2 && createdBoys.length === 0) {
        createdGirls[0].hairLabel = firstHair;
        createdGirls[1].hairLabel = secondHair;
        assignSentenceToEntity(createdGirls[0], firstHair);
        assignSentenceToEntity(createdGirls[1], secondHair);
        skipDefaultSentenceRouting = true;
      }
      if (createdBoys.length === 2 && createdGirls.length === 0) {
        createdBoys[0].hairLabel = firstHair;
        createdBoys[1].hairLabel = secondHair;
        assignSentenceToEntity(createdBoys[0], firstHair);
        assignSentenceToEntity(createdBoys[1], secondHair);
        skipDefaultSentenceRouting = true;
      }
    }

    if (!entities.length) {
      pendingBeforeEntities.push(sentenceText);
      continue;
    }

    if (skipDefaultSentenceRouting) {
      if (!lastReferencedEntity) {
        markEntityReferenced(entities[0]);
      }
      continue;
    }

    let targetEntity = resolveTargetEntity(sentenceNorm);
    if (!targetEntity) {
      if (overflowInSentence && entities.length >= ENTITY_LIMIT) {
        targetEntity = entities[ENTITY_LIMIT - 1];
      } else {
        targetEntity = lastReferencedEntity || getChar1();
      }
    }
    if (!targetEntity) {
      pendingBeforeEntities.push(sentenceText);
      continue;
    }

    assignSentenceToEntity(targetEntity, sentenceText);
    setHairLabelFromSentence(targetEntity, sentenceNorm);
    markEntityReferenced(targetEntity);
  }

  if (entities.length < 2) return null;

  const orderedEntities = [...entities].sort((a, b) => {
    const priority = { girl: 0, boy: 1, unknown: 2 };
    const aPriority = priority[String(a.gender || "unknown")] ?? 2;
    const bPriority = priority[String(b.gender || "unknown")] ?? 2;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.id - b.id;
  });

  const segments = orderedEntities.map((entity, idx) => {
    entity.label = `char${idx + 1}`;
    const sentenceList = sentenceByEntityId.get(entity.id) || [];
    const text = cleanSegmentText(sentenceList.join(". "));
    return {
      label: entity.label,
      text,
    };
  });

  const girlsCount = orderedEntities.filter((entity) => entity.gender === "girl").length;
  const boysCount = orderedEntities.filter((entity) => entity.gender === "boy").length;
  const peopleTags = buildPeopleTagsFromCounts(girlsCount, boysCount);

  return {
    segments,
    peopleTags,
  };
}

function findSceneTailBoundaryRawIndex(rawText, minRawStart = 0) {
  const text = String(rawText || "");
  if (!text) return -1;

  const candidates = [];
  const prefixBoundary =
    /(?:\.|\n)\s*(in|on|at|inside|outside|during|under|near)\b/gi;
  let match;
  while ((match = prefixBoundary.exec(text)) !== null) {
    const marker = match[1];
    if (!marker) continue;
    const markerOffset = match[0].toLowerCase().indexOf(marker.toLowerCase());
    const start = markerOffset >= 0 ? match.index + markerOffset : match.index;
    if (start >= minRawStart) candidates.push(start);
    if (match.index === prefixBoundary.lastIndex) prefixBoundary.lastIndex += 1;
  }

  const explicitStarts = findNormalizedPhraseRawStartIndices(
    text,
    [
      "in the street",
      "on the bed",
      "in a room",
      "in the room",
      "outside",
      "indoors",
      "outdoors",
    ],
    minRawStart
  );
  candidates.push(...explicitStarts);

  if (!candidates.length) return -1;
  candidates.sort((a, b) => a - b);
  return candidates[0];
}

function findGroupTag(tags) {
  for (const tag of tags || []) {
    const m = String(tag).match(/^(\d+)(girls|boys)$/i);
    if (!m) continue;
    const count = Number(m[1]);
    if (Number.isFinite(count) && count >= 2) {
      return String(tag);
    }
  }
  return "";
}

function inferCharacterGenderFallback(groupTag) {
  const raw = String(groupTag || "").toLowerCase();
  if (/^\d+girls$/.test(raw)) return "1girl";
  if (/^\d+boys$/.test(raw)) return "1boy";
  return "";
}

function inferGenderFromUserText(userText) {
  const normalized = normalizeForContains(userText);
  if (containsNormalizedPhrase(normalized, "male")) return "1boy";
  if (containsNormalizedPhrase(normalized, "man")) return "1boy";
  if (containsNormalizedPhrase(normalized, "women")) return "1girl";
  if (containsNormalizedPhrase(normalized, "woman")) return "1girl";
  if (containsNormalizedPhrase(normalized, "girls")) return "1girl";
  if (containsNormalizedPhrase(normalized, "girl")) return "1girl";
  if (containsNormalizedPhrase(normalized, "men")) return "1boy";
  if (containsNormalizedPhrase(normalized, "boys")) return "1boy";
  if (containsNormalizedPhrase(normalized, "boy")) return "1boy";
  return "";
}

function hasExplicitHumanEntityTerms(userText) {
  const normalized = normalizeLooseText(userText);
  if (!normalized) return false;
  return /\b(women|woman|girls|girl|men|man|boys|boy|person|people|character|characters|girlfriend|boyfriend)\b/.test(
    normalized
  );
}

function inferPeopleCountTagsFromText(userText) {
  const explicitCounts = inferExplicitEntityCountsFromText(userText);
  return dedupePreserveOrder(explicitCounts.peopleTags || []);
}

function hasSingleCharacterGenderTag(tags) {
  const lowered = (tags || []).map((tag) => String(tag).toLowerCase());
  return lowered.includes("1girl") || lowered.includes("1boy");
}

function removeSingleCharacterGenderTags(tags) {
  return dedupePreserveOrder(tags).filter((tag) => {
    const lower = String(tag || "").toLowerCase();
    return lower !== "1girl" && lower !== "1boy";
  });
}

function ensureCharacterGenderTag(tags, fallbackGenderTag) {
  const deduped = dedupePreserveOrder(tags);
  if (!fallbackGenderTag) return deduped;
  if (hasSingleCharacterGenderTag(deduped)) return deduped;
  return dedupePreserveOrder([fallbackGenderTag, ...deduped]);
}

function cleanupRedundantCharacterTags(tags) {
  const deduped = dedupePreserveOrder(tags);
  const lower = deduped.map((t) => String(t).toLowerCase());
  const set = new Set(lower);

  const hasAny = (arr) => arr.some((t) => set.has(t));
  const remove = (t) => set.delete(t);

  // breasts: if specific size exists, remove generic "breasts"
  const breastSpecific = [
    "small_breasts",
    "medium_breasts",
    "large_breasts",
    "huge_breasts",
    "gigantic_breasts",
    "flat_chest",
  ];
  if (hasAny(breastSpecific)) remove("breasts");

  // ass: if specific size exists, remove generic "ass"
  const assSpecific = ["large_ass", "huge_ass", "flat_ass"];
  if (hasAny(assSpecific)) remove("ass");

  // hair: if a length/style tag exists, remove generic "hair"
  const hairSpecific = [
    "long_hair",
    "short_hair",
    "very_long_hair",
    "medium_hair",
    "curly_hair",
    "wavy_hair",
    "straight_hair",
    "messy_hair",
    "spiky_hair",
  ];
  if (hasAny(hairSpecific)) remove("hair");

  // material/descriptor cleanup when stronger clothing tags are present
  if (set.has("leather") && Array.from(set).some((tag) => tag.startsWith("leather_"))) {
    remove("leather");
  }
  if (set.has("heavy") && (set.has("armor") || set.has("heavy_armor"))) {
    remove("heavy");
  }
  if (
    set.has("fur_(clothing)") &&
    Array.from(set).some((tag) => tag !== "fur_(clothing)" && tag.startsWith("fur_"))
  ) {
    remove("fur_(clothing)");
  }

  // Rebuild in original order (stable)
  const out = [];
  for (let i = 0; i < deduped.length; i += 1) {
    const key = lower[i];
    if (set.has(key)) out.push(deduped[i]);
  }
  return out;
}

function dropRedundantColorGarmentTags(charTags, rawUserText) {
  const tags = dedupePreserveOrder(charTags || []);
  if (!tags.length) return tags;

  const lowerTags = tags.map((tag) => String(tag).toLowerCase());
  const tagSet = new Set(lowerTags);
  const normalized = normalizeForContains(rawUserText);
  const bikiniModifiers = ["micro", "mini"];
  const bikiniColors = ["red", "black", "white", "blue", "pink"];
  const remove = new Set();

  for (const color of bikiniColors) {
    for (const modifier of bikiniModifiers) {
      const specificBikiniTag = `${modifier}_bikini`;
      if (!tagSet.has(specificBikiniTag)) continue;
      if (!containsNormalizedPhrase(normalized, `${color} ${modifier} bikini`)) continue;

      const genericColorBikiniTag = `${color}_bikini`;
      if (tagSet.has(genericColorBikiniTag)) {
        remove.add(genericColorBikiniTag);
      }
    }
  }

  if (!remove.size) return tags;

  return tags.filter((tag) => !remove.has(String(tag).toLowerCase()));
}

function dropStandaloneColorsImpliedByColoredGarments(charTags, clothingNounsNorm) {
  const tags = dedupePreserveOrder(charTags || []);
  if (!tags.length) return tags;

  const garmentNouns = new Set();
  for (const phrase of clothingNounsNorm || []) {
    const normalized = normalizePhrase(phrase);
    if (!normalized) continue;
    const underscored = normalized.replace(/\s+/g, "_");
    if (underscored) garmentNouns.add(underscored);
    const parts = normalized.split(" ").filter(Boolean);
    const tail = parts[parts.length - 1];
    if (tail) garmentNouns.add(tail);
  }
  if (!garmentNouns.size) return tags;

  const colorsImpliedByColoredGarments = new Set();
  for (const tag of tags) {
    const lower = String(tag || "").toLowerCase().trim();
    if (!lower.includes("_")) continue;

    const idx = lower.indexOf("_");
    const colorPrefix = lower.slice(0, idx);
    const remainder = lower.slice(idx + 1);
    if (!colorPrefix || !remainder) continue;
    if (!KNOWN_COLOR_TAG_SET.has(colorPrefix)) continue;

    const hasGarmentNoun = Array.from(garmentNouns).some((noun) => {
      return (
        remainder === noun ||
        remainder.startsWith(`${noun}_`) ||
        remainder.endsWith(`_${noun}`) ||
        remainder.includes(`_${noun}_`)
      );
    });
    if (!hasGarmentNoun) continue;

    colorsImpliedByColoredGarments.add(colorPrefix);
  }

  if (!colorsImpliedByColoredGarments.size) return tags;
  return tags.filter((tag) => !colorsImpliedByColoredGarments.has(String(tag || "").toLowerCase()));
}

function dropRedundantAtomicNounsWhenVariantPresent(tagsInput, preparedEntries, nounPhrases) {
  const tags = dedupePreserveOrder(tagsInput || []);
  if (!tags.length) return tags;

  const atomicNounSet = new Set();
  for (const phrase of nounPhrases || []) {
    const normalizedPhrase = normalizePhrase(phrase);
    if (!normalizedPhrase) continue;

    const underscored = normalizedPhrase.replace(/\s+/g, "_");
    if (underscored) atomicNounSet.add(underscored);

    const parts = normalizedPhrase.split(" ").filter(Boolean);
    const tail = parts[parts.length - 1];
    if (tail) atomicNounSet.add(tail);
  }
  for (const entry of preparedEntries || []) {
    const tag = String(entry?.tag || "").trim().toLowerCase();
    if (!tag) continue;
    if (!tag.includes("_")) {
      atomicNounSet.add(tag);
    }
  }
  if (!atomicNounSet.size) return tags;

  const atomicNounsBySpecificity = Array.from(atomicNounSet).sort((a, b) => {
    const aParts = a.split("_").length;
    const bParts = b.split("_").length;
    if (bParts !== aParts) return bParts - aParts;
    return b.length - a.length;
  });

  const atomicNounsToRemove = new Set();
  for (const tag of tags) {
    const lower = String(tag || "").trim().toLowerCase();
    if (!lower.includes("_")) continue;

    for (const noun of atomicNounsBySpecificity) {
      if (!noun) continue;
      if (lower === noun) continue;
      if (!lower.endsWith(`_${noun}`)) continue;
      atomicNounsToRemove.add(noun);
    }
  }

  if (!atomicNounsToRemove.size) return tags;
  return tags.filter((tag) => !atomicNounsToRemove.has(String(tag || "").trim().toLowerCase()));
}

function dropRedundantClothingAtomicsWhenComboPresent(
  traitTags,
  colorsPrepared,
  clothingNounsNorm,
  clothingPrepared
) {
  return dropRedundantAtomicNounsWhenVariantPresent(
    traitTags,
    clothingPrepared,
    clothingNounsNorm
  );
}

function dropRedundantAtomicGarmentsWhenVariantPresent(
  traitTags,
  clothingNounsNorm,
  clothingPrepared
) {
  return dropRedundantAtomicNounsWhenVariantPresent(
    traitTags,
    clothingPrepared,
    clothingNounsNorm
  );
}

function dropRedundantEnvironmentTags(tagsInput) {
  const tags = dedupePreserveOrder(tagsInput || []);
  if (!tags.length) return tags;
  const tagSet = buildTagSet(tags);
  if (!tagSet.has("skyline") || !tagSet.has("city")) return tags;
  return tags.filter((tag) => String(tag || "").trim().toLowerCase() !== "city");
}

function dropRedundantGenericCumBodypartTags(tagsInput) {
  const tags = dedupePreserveOrder(tagsInput || []);
  if (!tags.length) return tags;

  const specificCumTags = new Set();
  const suppressedGenerics = new Set();

  for (const tagRaw of tags) {
    const lower = String(tagRaw || "").trim().toLowerCase();
    if (!lower) continue;
    const match = /^cum_(?:in|on)_(.+)$/.exec(lower);
    if (!match) continue;

    const bodypart = String(match[1] || "").trim().toLowerCase();
    specificCumTags.add(lower);
    suppressedGenerics.add("cum");
    if (bodypart) suppressedGenerics.add(bodypart);
  }

  if (!suppressedGenerics.size) return tags;

  return tags.filter((tagRaw) => {
    const lower = String(tagRaw || "").trim().toLowerCase();
    if (!lower) return false;
    if (specificCumTags.has(lower)) return true;
    return !suppressedGenerics.has(lower);
  });
}

function dropRedundantBaseActionTagsWhenSpecificPresent(tagsInput, actionTagSet) {
  const tags = dedupePreserveOrder(tagsInput || []);
  if (!tags.length) return tags;
  const actionSet = actionTagSet instanceof Set ? actionTagSet : new Set();
  const loweredTags = tags.map((tagRaw) => String(tagRaw || "").trim().toLowerCase());
  const presentSet = new Set(loweredTags.filter(Boolean));
  const suppressSet = new Set();

  for (const lower of loweredTags) {
    if (!lower) continue;
    const match = /^([a-z]+)_.+/.exec(lower);
    if (!match) continue;
    const baseAction = String(match[1] || "").toLowerCase();
    if (!baseAction) continue;
    if (!actionSet.has(baseAction)) continue;
    if (!presentSet.has(baseAction)) continue;
    suppressSet.add(baseAction);
  }

  if (!suppressSet.size) return tags;
  return tags.filter((tagRaw) => !suppressSet.has(String(tagRaw || "").trim().toLowerCase()));
}

function normalizeContextSuppressionToken(rawToken) {
  return String(rawToken || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function stemContextSuppressionToken(rawToken) {
  let token = normalizeContextSuppressionToken(rawToken);
  if (!token) return "";
  if (token.endsWith("ies") && token.length > 4) {
    token = `${token.slice(0, -3)}y`;
  } else if (token.endsWith("ing") && token.length > 5) {
    token = token.slice(0, -3);
  } else if (token.endsWith("ed") && token.length > 4) {
    token = token.slice(0, -2);
  } else if (token.endsWith("es") && token.length > 4) {
    token = token.slice(0, -2);
  } else if (token.endsWith("s") && token.length > 3 && !token.endsWith("ss")) {
    token = token.slice(0, -1);
  }
  return token;
}

function buildContextSuppressionTagInfo(tagRaw) {
  const lower = String(tagRaw || "").trim().toLowerCase();
  if (!lower) return null;

  const senseMatch = /^(.+?)_\(([^)]+)\)$/.exec(lower);
  const lexicalTag = senseMatch ? senseMatch[1] : lower;
  const tokenList = String(lexicalTag || "")
    .split("_")
    .map((token) => normalizeContextSuppressionToken(token))
    .filter(Boolean);
  const tokenStems = tokenList
    .map((token) => stemContextSuppressionToken(token))
    .filter(Boolean);
  const qualifierStem = senseMatch ? stemContextSuppressionToken(senseMatch[2]) : "";

  return {
    lower,
    tokenList,
    tokenStems,
    firstToken: tokenList[0] || "",
    firstStem: tokenStems[0] || "",
    qualifierStem,
    isSenseTag: Boolean(senseMatch),
  };
}

function collectStrongTagRuleSuppressions(presentTagSet, infos, strongInfos) {
  const suppressSet = new Set();
  if (!(presentTagSet instanceof Set) || !presentTagSet.size) return suppressSet;

  for (const rule of STRONG_TAG_SUPPRESSION_RULES) {
    const strongTags = Array.isArray(rule?.strongTags) ? rule.strongTags : [];
    const weakTags = Array.isArray(rule?.weakTags) ? rule.weakTags : [];
    const strongPattern = rule?.strongPattern instanceof RegExp ? rule.strongPattern : null;

    const hasStrongExact = strongTags.some((tag) => presentTagSet.has(String(tag || "").toLowerCase()));
    const hasStrongPattern =
      strongPattern &&
      Array.from(presentTagSet).some((tag) => strongPattern.test(String(tag || "").toLowerCase()));
    if (!hasStrongExact && !hasStrongPattern) continue;

    for (const weakTag of weakTags) {
      const lower = String(weakTag || "").toLowerCase().trim();
      if (!lower || !presentTagSet.has(lower)) continue;
      suppressSet.add(lower);
    }
  }

  const singleTokenInfos = (infos || []).filter((info) => !info?.isSenseTag && info?.tokenStems?.length === 1);
  for (const info of singleTokenInfos) {
    const weakStem = info.firstStem;
    if (!weakStem || !CONTROLLED_WEAK_FRAGMENT_STEM_ALLOWLIST.has(weakStem)) continue;
    const appearsInsideStrong = (strongInfos || []).some((strongInfo) =>
      (strongInfo?.tokenStems || []).some((stem) => stem === weakStem)
    );
    if (!appearsInsideStrong) continue;
    suppressSet.add(info.lower);
  }

  return suppressSet;
}

function dropContextuallyAmbiguousWeakTags(tagsInput) {
  const tags = dedupePreserveOrder(tagsInput || []);
  if (tags.length < 2) return tags;

  const infos = tags.map((tag) => buildContextSuppressionTagInfo(tag)).filter(Boolean);
  if (infos.length < 2) return tags;
  const presentTagSet = new Set(infos.map((info) => info.lower).filter(Boolean));

  const contextStemSet = new Set();
  for (const info of infos) {
    for (const stem of info.tokenStems) contextStemSet.add(stem);
  }

  const strongInfos = infos.filter((info) => info.tokenStems.length >= 2);
  const strongStemSet = new Set();
  const strongInfosByFirstStem = new Map();
  for (const info of strongInfos) {
    for (const stem of info.tokenStems) strongStemSet.add(stem);
    if (!info.firstStem) continue;
    if (!strongInfosByFirstStem.has(info.firstStem)) strongInfosByFirstStem.set(info.firstStem, []);
    strongInfosByFirstStem.get(info.firstStem).push(info);
  }

  const qualifierContextStemMap = new Map();
  for (const [qualifierRaw, contextWords] of Object.entries(DISAMBIGUATION_CONTEXT_BY_QUALIFIER)) {
    const qualifierStem = stemContextSuppressionToken(qualifierRaw);
    if (!qualifierStem) continue;
    qualifierContextStemMap.set(
      qualifierStem,
      new Set(
        (Array.isArray(contextWords) ? contextWords : [])
          .map((word) => stemContextSuppressionToken(word))
          .filter(Boolean)
      )
    );
  }

  const suppressSet = new Set();

  for (const info of infos) {
    if (!info.isSenseTag) continue;
    const rootStem = info.firstStem;
    if (rootStem && strongStemSet.has(rootStem)) {
      suppressSet.add(info.lower);
      continue;
    }

    const qualifierContextStems = qualifierContextStemMap.get(info.qualifierStem);
    if (!qualifierContextStems || !qualifierContextStems.size) continue;

    const hasQualifierContext = Array.from(qualifierContextStems).some((stem) =>
      contextStemSet.has(stem)
    );
    if (hasQualifierContext) suppressSet.add(info.lower);
  }

  for (const info of infos) {
    if (info.isSenseTag) continue;
    if (info.tokenStems.length !== 1) continue;

    const weakStem = info.firstStem;
    if (!weakStem) continue;
    if (CONTEXT_SUPPRESSION_WEAK_TAG_EXCLUSIONS.has(weakStem)) continue;

    const strongCandidates = strongInfosByFirstStem.get(weakStem) || [];
    const hasSpecificPrefix = strongCandidates.some((candidate) => {
      if (!candidate || !candidate.firstToken || !info.firstToken) return false;
      if (candidate.firstToken === info.firstToken) return true;
      return /(?:ed|ing|s)$/.test(candidate.firstToken);
    });
    if (hasSpecificPrefix) suppressSet.add(info.lower);
  }

  for (const info of strongInfos) {
    for (const stem of info.tokenStems) {
      const mapped = CONTEXT_FRAGMENT_SUPPRESSIONS_BY_STEM[stem];
      if (!Array.isArray(mapped) || !mapped.length) continue;
      for (const rawTag of mapped) {
        const lower = String(rawTag || "").trim().toLowerCase();
        if (!lower || !presentTagSet.has(lower)) continue;
        suppressSet.add(lower);
      }
    }
  }

  for (const info of infos) {
    if (info.isSenseTag) continue;
    if (info.tokenStems.length !== 1) continue;
    const stem = info.firstStem;
    const mapped = CONTEXT_SINGLETON_SUPPRESSIONS_BY_STEM[stem];
    if (!Array.isArray(mapped) || !mapped.length) continue;
    for (const rawTag of mapped) {
      const lower = String(rawTag || "").trim().toLowerCase();
      if (!lower || !presentTagSet.has(lower)) continue;
      suppressSet.add(lower);
    }
  }

  for (const info of infos) {
    if (info.isSenseTag) continue;
    if (info.tokenStems.length !== 1) continue;
    const tagLower = info.lower;
    const contextNeeds = CONTEXT_WEAK_TAG_CONTEXT_SUPPRESSIONS_BY_TAG[tagLower];
    if (!Array.isArray(contextNeeds) || !contextNeeds.length) continue;

    // Keep weak tag when a more specific same-root variant is present.
    if ((strongInfosByFirstStem.get(info.firstStem) || []).length) continue;

    const hasContextNeed = contextNeeds.some((stemRaw) => {
      const stem = stemContextSuppressionToken(stemRaw);
      return stem && contextStemSet.has(stem);
    });
    if (hasContextNeed) suppressSet.add(tagLower);
  }

  const strongRuleSuppressionSet = collectStrongTagRuleSuppressions(
    presentTagSet,
    infos,
    strongInfos
  );
  for (const tag of strongRuleSuppressionSet) {
    suppressSet.add(tag);
  }

  if (!suppressSet.size) return tags;
  return tags.filter((tagRaw) => {
    const lower = String(tagRaw || "").trim().toLowerCase();
    if (!lower) return false;
    return !suppressSet.has(lower);
  });
}

function pickPreferredTagByPhraseOrder(tags, segmentText, phraseByTag) {
  const sourceTags = dedupePreserveOrder(tags || []);
  if (sourceTags.length <= 1) return sourceTags;

  const normalized = normalizeLooseText(segmentText);
  let bestTag = "";
  let bestIdx = Number.POSITIVE_INFINITY;

  for (const tag of sourceTags) {
    const lower = String(tag || "").toLowerCase();
    const phrase = String(phraseByTag[lower] || "").toLowerCase();
    if (!phrase) continue;
    const idx = normalized.indexOf(phrase);
    if (idx >= 0 && idx < bestIdx) {
      bestIdx = idx;
      bestTag = lower;
    }
  }

  if (!bestTag) {
    return sourceTags.slice(0, 1);
  }
  return sourceTags.filter((tag) => String(tag || "").toLowerCase() === bestTag);
}

function resolveMultiEntityHairConflicts(tagsInput, segmentText) {
  const tags = dedupePreserveOrder(tagsInput || []);
  if (!tags.length) return tags;

  const hairColorTags = [
    "black_hair",
    "brown_hair",
    "blonde_hair",
    "red_hair",
    "white_hair",
    "silver_hair",
    "gray_hair",
    "grey_hair",
    "pink_hair",
    "blue_hair",
    "green_hair",
    "purple_hair",
  ];
  const hairLengthTags = ["long_hair", "very_long_hair", "medium_hair", "short_hair"];
  const hairColorPhraseByTag = {
    black_hair: "black hair",
    brown_hair: "brown hair",
    blonde_hair: "blonde hair",
    red_hair: "red hair",
    white_hair: "white hair",
    silver_hair: "silver hair",
    gray_hair: "gray hair",
    grey_hair: "grey hair",
    pink_hair: "pink hair",
    blue_hair: "blue hair",
    green_hair: "green hair",
    purple_hair: "purple hair",
  };
  const hairLengthPhraseByTag = {
    long_hair: "long hair",
    very_long_hair: "very long hair",
    medium_hair: "medium hair",
    short_hair: "short hair",
  };

  const presentColorTags = tags.filter((tag) => hairColorTags.includes(String(tag || "").toLowerCase()));
  const presentLengthTags = tags.filter((tag) =>
    hairLengthTags.includes(String(tag || "").toLowerCase())
  );
  const preferredColorTags = pickPreferredTagByPhraseOrder(
    presentColorTags,
    segmentText,
    hairColorPhraseByTag
  );
  const preferredLengthTags = pickPreferredTagByPhraseOrder(
    presentLengthTags,
    segmentText,
    hairLengthPhraseByTag
  );
  const keepColorSet = buildTagSet(preferredColorTags);
  const keepLengthSet = buildTagSet(preferredLengthTags);

  return tags.filter((tag) => {
    const lower = String(tag || "").toLowerCase();
    if (presentColorTags.length > 1 && hairColorTags.includes(lower)) {
      return keepColorSet.has(lower);
    }
    if (presentLengthTags.length > 1 && hairLengthTags.includes(lower)) {
      return keepLengthSet.has(lower);
    }
    return true;
  });
}

function extractFlexibleTwoTokenClothingTags(rawSegmentText, clothingPrepared) {
  const tokens = tokenizeNormalized(rawSegmentText);
  if (tokens.length < 2) return [];

  const out = [];
  for (const entry of clothingPrepared || []) {
    const phraseNorm = String(entry?.phraseNorm || "");
    const tag = String(entry?.tag || "").trim();
    if (!phraseNorm || !tag) continue;

    const parts = phraseNorm.split(" ").filter(Boolean);
    if (parts.length !== 2) continue;
    const [first, second] = parts;

    for (let i = 0; i < tokens.length - 1; i += 1) {
      if (tokens[i] !== first) continue;
      if (tokens[i + 1] === second || tokens[i + 2] === second) {
        out.push(tag);
        break;
      }
    }
  }
  return dedupePreserveOrder(out);
}

function canonicalizeGreySpelling(tags) {
  const source = Array.isArray(tags) ? tags : [];
  const rewritten = [];
  for (const tag of source) {
    const raw = String(tag || "").trim();
    if (!raw) continue;
    const lower = raw.toLowerCase();
    if (lower.startsWith("gray_")) {
      rewritten.push(`grey_${lower.slice(5)}`);
      continue;
    }
    if (lower.startsWith("grey_")) {
      rewritten.push(lower);
      continue;
    }
    rewritten.push(raw);
  }
  return dedupePreserveOrder(rewritten);
}

function normalizeGrayWordsToGrey(text) {
  return String(text || "").replace(/\bgray\b/gi, "grey");
}

function classifyCharacterTag(tag) {
  const lower = String(tag || "").toLowerCase();
  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);
  const tokenSet = new Set(tokens);

  if (looksLikeCharacterTag(lower)) return 0;
  if (lower === "1girl" || lower === "1boy") return 1;

  const isHairColorTag =
    /_hair$/.test(lower) &&
    !/^(long_hair|short_hair|very_long_hair|medium_hair|curly_hair|wavy_hair|straight_hair|messy_hair|spiky_hair|hair)$/.test(
      lower
    );
  if (isHairColorTag) return 2;
  
     // Hair accessories that shouldn't be treated as hair style
  if (
    lower.includes("hairband") ||
    lower.includes("headband") ||
    lower.includes("hairclip") ||
    lower.includes("hair_clip") ||
    lower.includes("hair_ornament") ||
    lower.includes("hairpin") ||
    lower.includes("hair_pin")
  ) {
    return 9;
  }
  if (lower.includes("hair")) return 3;

  if (/_eyes$/.test(lower)) return 4;

  const bodyTokens = [
    "breasts",
    "breast",
    "chest",
    "ass",
    "hips",
    "hip",
    "waist",
    "height",
    "skinny",
    "curvy",
    "muscular",
    "petite",
    "slim",
    "chubby",
    "plump",
    "thick",
    "athletic",
    "abs",
    "thigh",
    "thighs",
  ];
  if (bodyTokens.some((token) => tokenSet.has(token) || lower.includes(token))) return 5;
  if (KNOWN_COLOR_TAG_SET.has(lower)) return 6;

  const clothingTokens = [
    "dress",
    "skirt",
    "shirt",
    "blouse",
    "jacket",
    "coat",
    "hoodie",
    "sweater",
    "cardigan",
    "vest",
    "bra",
    "panties",
    "lingerie",
    "pajamas",
    "nightgown",
    "shorts",
    "jeans",
    "pants",
    "trousers",
    "stockings",
    "pantyhose",
    "socks",
    "thighhighs",
    "kimono",
    "uniform",
    "bikini",
    "swimsuit",
    "bodysuit",
    "apron",
    "gloves",
    "scarf",
    "cape",
    "robe",
    "underwear",
    "corset",
    "shoes",
    "shoe",
    "boots",
    "heels",
    "sandals",
    "sneakers",
  ];
  const isClothingTag = clothingTokens.some((token) => tokenSet.has(token) || lower.includes(token));
  if (isClothingTag) {
    const isColorBoundClothing = BASIC_COLORS.some((color) => lower.startsWith(`${color}_`));
    return isColorBoundClothing ? 8 : 7;
  }

  const accessoryTokens = [
    "glasses",
    "goggles",
    "earring",
    "earrings",
    "necklace",
    "bracelet",
    "ring",
    "watch",
    "hat",
    "cap",
    "crown",
    "tiara",
    "ribbon",
    "bow",
    "headband",
    "hairband",
    "weapon",
    "sword",
    "gun",
    "knife",
    "phone",
    "camera",
    "book",
    "bag",
    "purse",
    "backpack",
    "umbrella",
    "staff",
    "shield",
    "microphone",
  ];
  if (accessoryTokens.some((token) => tokenSet.has(token) || lower.includes(token))) return 9;

  return 10;
}

function sortCharacterTags(tags) {
  const deduped = dedupePreserveOrder(tags);
  const mapped = deduped.map((tag, idx) => ({
    tag,
    idx,
    priority: classifyCharacterTag(tag),
  }));
  mapped.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.idx - b.idx;
  });
  return mapped.map((item) => item.tag);
}

function buildCharacterBlock(label, tags) {
  const cleaned = normalizeTagListForOutput(cleanupRedundantCharacterTags(tags));
  const ordered = sortCharacterTags(cleaned);
  if (!ordered.length) return "";
  const text = ordered.join(", ");
  return `(${label}: ${text})`;
}

function buildActionBlock(label, tags) {
  const ordered = normalizeTagListForOutput(tags);
  if (!ordered.length) return "";
  return `(${label}_action: ${ordered.join(", ")})`;
}

function buildPoseBlock(label, tags) {
  const ordered = normalizeTagListForOutput(tags);
  if (!ordered.length) return "";
  return `(${label}_pose: ${ordered.join(", ")})`;
}

function removeActionLikeTags(tags, actionTagSet) {
  return (tags || []).filter((tag) => {
    const lower = String(tag).toLowerCase();
    if (actionTagSet.has(lower)) return false;
    return !ACTION_LIKE_KEYWORDS.some(
      (keyword) => lower === keyword || lower.includes(`_${keyword}`) || lower.includes(keyword)
    );
  });
}

function resolveLightingAssistOptionByTimeId(timeId, lightingOptions) {
  const normalizedTimeId = String(timeId || "").trim().toLowerCase();
  if (!normalizedTimeId) return null;

  const candidateTags = Array.isArray(TIME_OF_DAY_LIGHTING_ASSIST_TAGS[normalizedTimeId])
    ? TIME_OF_DAY_LIGHTING_ASSIST_TAGS[normalizedTimeId]
    : [];
  if (!candidateTags.length) return null;

  const options = Array.isArray(lightingOptions) ? lightingOptions : [];
  for (const candidateTag of candidateTags) {
    const wanted = String(candidateTag || "").trim().toLowerCase();
    if (!wanted) continue;

    const match = options.find((item) => {
      const id = String(item?.id || "").trim().toLowerCase();
      if (id === wanted) return true;
      const tags = Array.isArray(item?.tags) ? item.tags : [];
      return tags.some((tag) => String(tag || "").trim().toLowerCase() === wanted);
    });
    if (match) return match;
  }

  return null;
}

function collectCameraLightingTags(cameraData, lightingData, selectionState = null) {
  const out = [];

  const framingId = String(
    selectionState?.cameraFramingId ||
      getSingleSelectedId($("cameraFraming"), {
        fallbackSelectId: "cameraFraming",
        radioName: "cameraFraming",
      })
  );
  const angleId = String(
    selectionState?.cameraAngleId ||
      getSingleSelectedId($("cameraAngle"), {
        fallbackSelectId: "cameraAngle",
        radioName: "cameraAngle",
      })
  );
  const lightingId = String(
    selectionState?.lightingId ||
      getSingleSelectedId($("lighting"), {
        fallbackSelectId: "lighting",
        radioName: "lighting",
      })
  );
  const timeId = String(
    selectionState?.timeOfDayId ||
      getSingleSelectedId($("timeOfDay"), {
        fallbackSelectId: "timeOfDay",
        radioName: "timeOfDay",
      })
  );

  const framing = (cameraData?.framing || []).find((item) => item.id === framingId);
  const angle = (cameraData?.angle || []).find((item) => item.id === angleId);
  if (framing) out.push(...(framing.tags || []));
  if (angle) out.push(...(angle.tags || []));

  const rawCompIds = Array.isArray(selectionState?.compositionToggleIds)
    ? selectionState.compositionToggleIds
    : getMultiSelectedIds($("compositionToggles"));
  const compIds = dedupePreserveOrder((rawCompIds || []).map((id) => String(id || "").trim()).filter(Boolean));
  for (const id of compIds) {
    const comp = (cameraData?.composition_toggles || []).find((item) => item.id === id);
    if (comp) out.push(...(comp.tags || []));
  }

  const lighting = (lightingData?.lighting || []).find((item) => item.id === lightingId);
  const timeOfDay = (lightingData?.time_of_day || []).find((item) => item.id === timeId);
  if (lighting) out.push(...(lighting.tags || []));
  if (!lighting && timeOfDay) {
    const assistedLighting = resolveLightingAssistOptionByTimeId(
      timeOfDay.id,
      lightingData?.lighting || []
    );
    if (assistedLighting) out.push(...(assistedLighting.tags || []));
  }
  if (timeOfDay) out.push(...(timeOfDay.tags || []));

  return normalizeTagListForOutput(out);
}

function selectedPreset(presetById, presetIdOverride = "") {
  const presetId = String(presetIdOverride || $("presetPicker")?.value || "");
  const preset = presetById.get(presetId);
  if (!preset) return { positive_tags: [], negative_tags: [] };
  return {
    positive_tags: Array.isArray(preset.positive_tags) ? preset.positive_tags : [],
    negative_tags: Array.isArray(preset.negative_tags) ? preset.negative_tags : [],
  };
}

function selectedModifierTags(modifierById, selectedIds = null) {
  const rawIds = Array.isArray(selectedIds) ? selectedIds : getMultiSelectedIds($("styleModifiers"));
  const ids = rawIds.length ? [rawIds[0]] : [];
  const positive = [];
  const negative = [];

  for (const id of ids) {
    const mod = modifierById.get(id);
    if (!mod) continue;
    if (Array.isArray(mod.positive_tags)) positive.push(...mod.positive_tags);
    if (Array.isArray(mod.negative_tags)) negative.push(...mod.negative_tags);
  }

  return {
    positive: dedupePreserveOrder(positive),
    negative: dedupePreserveOrder(negative),
  };
}

function parseLoraTriggerTokens(rawInput) {
  const out = [];
  const seen = new Set();

  for (const item of String(rawInput || "").split(",")) {
    const token = String(item || "").trim();
    if (!token) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }

  return out;
}

function collectPromptTagTokenSet(blocks) {
  const out = new Set();

  for (const block of blocks || []) {
    const cleaned = cleanBlockBoundary(block);
    if (!cleaned) continue;

    const namedMatch = cleaned.match(/^\((?:char\d+|char\d+_action|char\d+_pose):\s*([\s\S]*)\)$/i);
    const inner = namedMatch ? namedMatch[1] : cleaned;

    for (const tokenRaw of String(inner || "").split(",")) {
      const token = String(tokenRaw || "").trim();
      if (!token) continue;
      out.add(token);
    }
  }

  return out;
}

function tokenizeCommaSeparatedTags(text) {
  return String(text || "")
    .split(",")
    .map((tokenRaw) => String(tokenRaw || "").trim())
    .filter(Boolean);
}

function parseNamedTagBlocks(blocksInput, kind = "trait") {
  const out = [];
  const pattern = (() => {
    switch (kind) {
      case "action":
        return /^\((char\d+)_action:\s*([\s\S]*)\)$/i;
      case "pose":
        return /^\((char\d+)_pose:\s*([\s\S]*)\)$/i;
      default:
        return /^\((char\d+):\s*([\s\S]*)\)$/i;
    }
  })();

  for (const blockRaw of blocksInput || []) {
    const cleaned = cleanBlockBoundary(blockRaw);
    if (!cleaned) continue;
    const match = cleaned.match(pattern);
    if (!match) continue;
    out.push({
      label: String(match[1] || "").toLowerCase(),
      tags: dedupePreserveOrder(tokenizeCommaSeparatedTags(match[2])),
    });
  }

  return out;
}

function buildSemanticRoleMetaByLabel({
  segments,
  parsedTraitBlocks,
  speciesTagSet,
  animalsTagSet,
}) {
  const traitTagsByLabel = new Map(
    (parsedTraitBlocks || []).map((block) => [
      String(block?.label || "").toLowerCase().trim(),
      dedupePreserveOrder((block?.tags || []).map((tag) => String(tag || "").toLowerCase().trim())),
    ])
  );
  const speciesSet = speciesTagSet instanceof Set ? speciesTagSet : new Set();
  const animalSet = animalsTagSet instanceof Set ? animalsTagSet : new Set();

  return (segments || []).map((segment, idx) => {
    const label = String(segment?.label || `char${idx + 1}`).toLowerCase().trim();
    const slotIndex = idx + 1;
    const traitTags = dedupePreserveOrder(
      (traitTagsByLabel.get(label) || []).filter((tag) => String(tag || "").trim())
    );
    const subjectTag = String(segment?.subjectTag || "").toLowerCase().trim();
    const fallbackTag = String(segment?.fallbackEntityTag || "").toLowerCase().trim();
    const slotGender =
      normalizeEntityGenderHint(segment?.slotGender) ||
      normalizeEntityGenderHint(segment?.anchorTag) ||
      normalizeEntityGenderHint(fallbackTag);
    const subjectKind =
      normalizeSubjectKind(segment?.subjectKind) ||
      (slotGender ? "human" : subjectTag ? "nonhuman" : "");

    const nonHumanTags = new Set();
    if (subjectTag && (speciesSet.has(subjectTag) || animalSet.has(subjectTag) || subjectKind === "nonhuman")) {
      nonHumanTags.add(subjectTag);
    }
    if (
      fallbackTag &&
      (speciesSet.has(fallbackTag) || animalSet.has(fallbackTag) || subjectKind === "nonhuman")
    ) {
      nonHumanTags.add(fallbackTag);
    }
    for (const tag of traitTags) {
      if (
        speciesSet.has(tag) ||
        animalSet.has(tag) ||
        (subjectKind === "nonhuman" && !String(tag || "").includes("_") && /^[a-z0-9]+$/.test(tag))
      ) {
        nonHumanTags.add(tag);
      }
    }

    const entityTokens = new Set();
    if (slotGender === "girl") {
      ["girl", "girls", "woman", "women", "female", "person", "people", "character", "characters"].forEach(
        (token) => entityTokens.add(token)
      );
    } else if (slotGender === "boy") {
      ["boy", "boys", "man", "men", "male", "person", "people", "character", "characters"].forEach(
        (token) => entityTokens.add(token)
      );
    } else if (subjectKind === "human") {
      ["person", "people", "character", "characters"].forEach((token) => entityTokens.add(token));
    }
    for (const nonHumanTag of nonHumanTags) {
      entityTokens.add(nonHumanTag);
    }
    for (const traitTag of traitTags) {
      if (!traitTag || traitTag.includes("_")) continue;
      if (!/^[a-z0-9]+$/.test(traitTag)) continue;
      if (SEMANTIC_ROLE_TOKEN_TO_TAG[traitTag]) continue;
      entityTokens.add(traitTag);
    }
    if (fallbackTag && !fallbackTag.includes("_") && /^[a-z0-9]+$/.test(fallbackTag)) {
      entityTokens.add(fallbackTag);
    }

    return {
      label,
      slotIndex,
      subjectKind,
      slotGender,
      traitTags,
      nonHumanTags: dedupePreserveOrder(Array.from(nonHumanTags)),
      entityTokens: dedupePreserveOrder(Array.from(entityTokens)),
    };
  });
}

function resolveSemanticRoleLabelFromTextFragment(fragmentText, roleMeta, options = {}) {
  const normalized = normalizeLooseText(fragmentText);
  if (!normalized) return "";
  const preferredKind = normalizeSubjectKind(options?.preferredKind);
  const excludeLabel = String(options?.excludeLabel || "").toLowerCase().trim();
  const preferMostRecent = Boolean(options?.preferMostRecent);
  const pickLabel = (items) => {
    const filtered = (items || []).filter(
      (item) => item && String(item.label || "").toLowerCase().trim() !== excludeLabel
    );
    if (!filtered.length) return "";
    const sorted = [...filtered].sort((a, b) =>
      preferMostRecent ? b.slotIndex - a.slotIndex : a.slotIndex - b.slotIndex
    );
    return String(sorted[0]?.label || "");
  };

  const ordinalIndex = extractOrdinalIndexFromNormalizedText(normalized);
  if (ordinalIndex > 0) {
    const ordinalLabel = `char${ordinalIndex}`;
    if (ordinalLabel !== excludeLabel) return ordinalLabel;
  }

  const genderMatch = /\b(women|woman|girls|girl|female|men|man|boys|boy|male)\b/.exec(normalized);
  const explicitGender = normalizeEntityGenderHint(
    HUMAN_GENDER_NOUN_TOKEN_TO_GENDER[String(genderMatch?.[1] || "").toLowerCase()] || ""
  );
  if (explicitGender === "girl" || explicitGender === "boy") {
    const byGender = (roleMeta || []).filter((item) => item.slotGender === explicitGender);
    const picked = pickLabel(byGender);
    if (picked) return picked;
  }

  for (const item of roleMeta || []) {
    for (const token of item?.nonHumanTags || []) {
      if (!token) continue;
      if (new RegExp(`\\b${escapeRegexLiteral(token)}\\b`, "i").test(normalized)) {
        return pickLabel([item]) || "";
      }
    }
  }
  for (const item of roleMeta || []) {
    for (const token of item?.entityTokens || []) {
      if (!token) continue;
      if (new RegExp(`\\b${escapeRegexLiteral(token)}\\b`, "i").test(normalized)) {
        return pickLabel([item]) || "";
      }
    }
  }

  if (preferredKind) {
    const byKind = (roleMeta || []).filter((item) => normalizeSubjectKind(item?.subjectKind) === preferredKind);
    const picked = pickLabel(byKind);
    if (picked) return picked;
  }

  return pickLabel(roleMeta || []);
}

function applyFinalSemanticRoleRefinement({
  userText,
  segments,
  traitBlocks,
  actionBlocks,
  poseBlocks,
  speciesTagSet,
  animalsTagSet,
}) {
  const normalizedUserText = normalizeLooseText(userText);
  if (!normalizedUserText) {
    return {
      traitBlocks,
      actionBlocks,
      poseBlocks,
      traitUnion: dedupePreserveOrder(
        parseNamedTagBlocks(traitBlocks, "trait").flatMap((block) => block.tags || [])
      ),
      actionUnion: dedupePreserveOrder(
        parseNamedTagBlocks(actionBlocks, "action").flatMap((block) => block.tags || [])
      ),
      poseUnion: dedupePreserveOrder(
        parseNamedTagBlocks(poseBlocks, "pose").flatMap((block) => block.tags || [])
      ),
    };
  }

  const parsedTraitBlocks = parseNamedTagBlocks(traitBlocks, "trait");
  const parsedActionBlocks = parseNamedTagBlocks(actionBlocks, "action");
  const parsedPoseBlocks = parseNamedTagBlocks(poseBlocks, "pose");
  const labelsInOrder = dedupePreserveOrder(
    (segments || []).map((segment, idx) => String(segment?.label || `char${idx + 1}`).toLowerCase().trim())
  );
  const traitTagsByLabel = new Map(
    parsedTraitBlocks.map((block) => [String(block.label || "").toLowerCase(), [...(block.tags || [])]])
  );
  const actionTagsByLabel = new Map(
    parsedActionBlocks.map((block) => [String(block.label || "").toLowerCase(), [...(block.tags || [])]])
  );
  const poseTagsByLabel = new Map(
    parsedPoseBlocks.map((block) => [String(block.label || "").toLowerCase(), [...(block.tags || [])]])
  );
  for (const label of labelsInOrder) {
    if (!traitTagsByLabel.has(label)) traitTagsByLabel.set(label, []);
    if (!actionTagsByLabel.has(label)) actionTagsByLabel.set(label, []);
    if (!poseTagsByLabel.has(label)) poseTagsByLabel.set(label, []);
  }

  const roleMeta = buildSemanticRoleMetaByLabel({
    segments,
    parsedTraitBlocks,
    speciesTagSet,
    animalsTagSet,
  });
  const roleMetaByLabel = new Map(
    roleMeta.map((item) => [String(item?.label || "").toLowerCase(), item])
  );
  const isPoseLikeTag = (tagRaw) => {
    const lower = String(tagRaw || "").toLowerCase().trim();
    if (!lower) return false;
    if (PER_ENTITY_POSE_SPLIT_TAG_SET.has(lower)) return true;
    if (lower === "leaning") return true;
    return false;
  };
  const assignTagToLabel = (labelRaw, tagRaw) => {
    const label = String(labelRaw || "").toLowerCase().trim();
    const tag = String(tagRaw || "").toLowerCase().trim();
    if (!label || !tag) return;
    if (isPoseLikeTag(tag)) {
      poseTagsByLabel.set(label, dedupePreserveOrder([...(poseTagsByLabel.get(label) || []), tag]));
      actionTagsByLabel.set(
        label,
        (actionTagsByLabel.get(label) || []).filter((candidate) => String(candidate || "").toLowerCase() !== tag)
      );
      return;
    }
    actionTagsByLabel.set(label, dedupePreserveOrder([...(actionTagsByLabel.get(label) || []), tag]));
  };
  const removeTagFromLabel = (labelRaw, tagRaw) => {
    const label = String(labelRaw || "").toLowerCase().trim();
    const tag = String(tagRaw || "").toLowerCase().trim();
    if (!label || !tag) return;
    actionTagsByLabel.set(
      label,
      (actionTagsByLabel.get(label) || []).filter((candidate) => String(candidate || "").toLowerCase() !== tag)
    );
    poseTagsByLabel.set(
      label,
      (poseTagsByLabel.get(label) || []).filter((candidate) => String(candidate || "").toLowerCase() !== tag)
    );
  };

  // Keep pose-like state tags in pose blocks, not action blocks.
  for (const label of labelsInOrder) {
    const poseTags = poseTagsByLabel.get(label) || [];
    const actionTags = actionTagsByLabel.get(label) || [];
    const keepAction = [];
    for (const actionTag of actionTags) {
      const lower = String(actionTag || "").toLowerCase().trim();
      if (!isPoseLikeTag(lower)) {
        keepAction.push(actionTag);
        continue;
      }
      poseTags.push(lower);
    }
    actionTagsByLabel.set(label, dedupePreserveOrder(keepAction));
    poseTagsByLabel.set(label, dedupePreserveOrder(poseTags));
  }

  // One-of-many nonhuman singled-out state/action mentions.
  const segmentByLabel = new Map(
    (segments || []).map((segment, idx) => [
      String(segment?.label || `char${idx + 1}`).toLowerCase().trim(),
      segment,
    ])
  );
  const collectNonHumanCandidateLabels = (subjectTagRaw) => {
    const subjectTag = String(subjectTagRaw || "").toLowerCase().trim();
    if (!subjectTag) return [];
    const byRoleMeta = roleMeta.filter((item) =>
      (item?.nonHumanTags || []).some((tag) => String(tag || "").toLowerCase() === subjectTag)
    );
    const byTraitTag = labelsInOrder.filter((label) =>
      (traitTagsByLabel.get(label) || []).some(
        (tag) => String(tag || "").toLowerCase().trim() === subjectTag
      )
    );
    const bySegmentTag = labelsInOrder.filter((label) => {
      const segment = segmentByLabel.get(label) || {};
      const explicit = String(segment?.subjectTag || "").toLowerCase().trim();
      const fallback = String(segment?.fallbackEntityTag || "").toLowerCase().trim();
      return explicit === subjectTag || fallback === subjectTag;
    });
    return dedupePreserveOrder([
      ...byRoleMeta.map((item) => String(item?.label || "").toLowerCase().trim()),
      ...byTraitTag,
      ...bySegmentTag,
    ]).filter(Boolean);
  };
  const pickNonHumanTargetLabel = (subjectTagRaw) => {
    const candidates = collectNonHumanCandidateLabels(subjectTagRaw);
    if (!candidates.length) return "";
    return String(candidates[0] || "");
  };
  const clearTagFromPeerNonHumans = (subjectTagRaw, tagRaw, keepLabelRaw) => {
    const keepLabel = String(keepLabelRaw || "").toLowerCase().trim();
    for (const label of collectNonHumanCandidateLabels(subjectTagRaw)) {
      if (!label || label === keepLabel) continue;
      removeTagFromLabel(label, tagRaw);
    }
  };
  for (const mention of extractNonHumanStatePoseMentionsFromText(userText)) {
    if (!mention?.hasSingularSelector) continue;
    const targetLabel = pickNonHumanTargetLabel(mention.subjectTag);
    if (!targetLabel) continue;
    clearTagFromPeerNonHumans(mention.subjectTag, mention.poseTag, targetLabel);
    assignTagToLabel(targetLabel, mention.poseTag);
  }
  for (const mention of extractNonHumanStateActionMentionsFromText(userText)) {
    if (!mention?.hasSingularSelector) continue;
    const targetLabel = pickNonHumanTargetLabel(mention.subjectTag);
    if (!targetLabel) continue;
    clearTagFromPeerNonHumans(mention.subjectTag, mention.actionTag, targetLabel);
    assignTagToLabel(targetLabel, mention.actionTag);
  }

  // Singled-out human references like "the woman ...", "one man ...".
  for (const clause of splitTextIntoBinderClauses(userText, [])) {
    const normalizedClause = normalizeLooseText(clause);
    const humanRef = /\b(one|the)\s+(woman|girl|man|boy)\b/i.exec(normalizedClause);
    if (!humanRef) continue;
    const determiner = String(humanRef[1] || "").toLowerCase().trim();
    const gender = normalizeEntityGenderHint(
      HUMAN_GENDER_NOUN_TOKEN_TO_GENDER[String(humanRef[2] || "").toLowerCase()] || ""
    );
    if (gender !== "girl" && gender !== "boy") continue;
    const roleTags = extractSemanticRoleTagsFromText(clause).filter((tag) => tag !== "watching");
    if (!roleTags.length) continue;
    const candidates = roleMeta.filter(
      (item) => normalizeSubjectKind(item?.subjectKind) === "human" && item?.slotGender === gender
    );
    if (!candidates.length) continue;
    const sorted = [...candidates].sort((a, b) =>
      determiner === "the" ? b.slotIndex - a.slotIndex : a.slotIndex - b.slotIndex
    );
    const targetLabel = String(sorted[0]?.label || "").toLowerCase().trim();
    if (!targetLabel) continue;
    for (const candidate of candidates) {
      const label = String(candidate?.label || "").toLowerCase().trim();
      if (!label || label === targetLabel) continue;
      for (const roleTag of roleTags) removeTagFromLabel(label, roleTag);
    }
    for (const roleTag of roleTags) assignTagToLabel(targetLabel, roleTag);
  }

  // Observer vs actor: move observed action/state from watcher to observed target.
  for (const clause of splitTextIntoBinderClauses(userText, [])) {
    const normalizedClause = normalizeLooseText(clause);
    if (!OBSERVER_ROLE_VERB_REGEX.test(normalizedClause)) continue;
    const match =
      /^(.*)\b(watching|watch|watches|looking\s+at|look\s+at|looks\s+at|seeing|see|sees)\b([\s\S]*)$/i.exec(
        normalizedClause
      );
    if (!match) continue;
    const observerLead = String(match[1] || "").trim();
    const observedTail = String(match[3] || "").trim();
    const observerLabel = resolveSemanticRoleLabelFromTextFragment(observerLead, roleMeta, {
      preferredKind: "human",
    });
    const observedLabel =
      resolveSemanticRoleLabelFromTextFragment(observedTail, roleMeta, {
        preferredKind: "nonhuman",
        excludeLabel: observerLabel,
      }) ||
      resolveSemanticRoleLabelFromTextFragment(observedTail, roleMeta, {
        excludeLabel: observerLabel,
      });
    if (!observerLabel || !observedLabel || observerLabel === observedLabel) continue;
    const observedTags = extractSemanticRoleTagsFromText(observedTail).filter(
      (tag) => tag && tag !== "watching"
    );
    for (const observedTag of observedTags) {
      removeTagFromLabel(observerLabel, observedTag);
      assignTagToLabel(observedLabel, observedTag);
    }
  }

  // Rider/mount separation for mixed actor+creature scenes.
  for (const clause of splitTextIntoBinderClauses(userText, [])) {
    const normalizedClause = normalizeLooseText(clause);
    if (!RIDER_ROLE_VERB_REGEX.test(normalizedClause)) continue;
    const match = /^(.*)\b(riding|ride|rides|mounted|mounting)\b([\s\S]*)$/i.exec(normalizedClause);
    if (!match) continue;
    const riderLead = String(match[1] || "").trim();
    const mountTail = String(match[3] || "").trim();
    const riderLabel = resolveSemanticRoleLabelFromTextFragment(riderLead, roleMeta, {
      preferredKind: "human",
    });
    const mountLabel =
      resolveSemanticRoleLabelFromTextFragment(mountTail, roleMeta, {
        preferredKind: "nonhuman",
        excludeLabel: riderLabel,
      }) ||
      resolveSemanticRoleLabelFromTextFragment(mountTail, roleMeta, {
        excludeLabel: riderLabel,
      });
    if (!riderLabel || !mountLabel || riderLabel === mountLabel) continue;

    removeTagFromLabel(mountLabel, "riding");
    assignTagToLabel(riderLabel, "riding");

    const mountTags = extractSemanticRoleTagsFromText(mountTail).filter((tag) =>
      MOUNT_LOCOMOTION_TAG_SET.has(String(tag || "").toLowerCase())
    );
    for (const mountTag of mountTags) {
      removeTagFromLabel(riderLabel, mountTag);
      assignTagToLabel(mountLabel, mountTag);
    }

    const mountMeta = roleMetaByLabel.get(String(mountLabel || "").toLowerCase().trim());
    if (mountMeta?.nonHumanTags?.length) {
      const riderTraits = traitTagsByLabel.get(riderLabel) || [];
      traitTagsByLabel.set(
        riderLabel,
        riderTraits.filter(
          (tag) => !mountMeta.nonHumanTags.includes(String(tag || "").toLowerCase().trim())
        )
      );
    }
  }

  const nextTraitBlocks = [];
  const nextActionBlocks = [];
  const nextPoseBlocks = [];
  const traitUnion = [];
  const actionUnion = [];
  const poseUnion = [];
  for (const label of labelsInOrder) {
    const traitTags = dedupePreserveOrder(traitTagsByLabel.get(label) || []);
    const poseTags = dedupePreserveOrder(poseTagsByLabel.get(label) || []);
    const actionTags = dedupePreserveOrder(
      (actionTagsByLabel.get(label) || []).filter((tag) => {
        const lower = String(tag || "").toLowerCase().trim();
        if (!lower) return false;
        if (isPoseLikeTag(lower) && poseTags.includes(lower)) return false;
        return true;
      })
    );
    traitUnion.push(...traitTags);
    poseUnion.push(...poseTags);
    actionUnion.push(...actionTags);
    const traitBlock = buildCharacterBlock(label, traitTags);
    if (traitBlock) nextTraitBlocks.push(traitBlock);
    const poseBlock = buildPoseBlock(label, poseTags);
    if (poseBlock) nextPoseBlocks.push(poseBlock);
    const actionBlock = buildActionBlock(label, actionTags);
    if (actionBlock) nextActionBlocks.push(actionBlock);
  }

  return {
    traitBlocks: nextTraitBlocks,
    actionBlocks: nextActionBlocks,
    poseBlocks: nextPoseBlocks,
    traitUnion: dedupePreserveOrder(traitUnion),
    actionUnion: dedupePreserveOrder(actionUnion),
    poseUnion: dedupePreserveOrder(poseUnion),
  };
}

function applyAtomicVariantSuppressionAcrossBlocks({
  traitBlocks,
  actionBlocks,
  poseBlocks,
  poseTags,
  environmentTags,
  propsTags,
  expressionsTags,
  moodStateTags,
  nsfwPositionTags,
  interactionTags,
  nsfwInteractionTags,
  sceneTags,
  globalTags,
  compositionTextTags,
  cameraLightingTags,
}) {
  const parsedTraitBlocks = parseNamedTagBlocks(traitBlocks, "trait");
  const parsedActionBlocks = parseNamedTagBlocks(actionBlocks, "action");
  const parsedPoseBlocks = parseNamedTagBlocks(poseBlocks, "pose");

  const mergedTags = dedupePreserveOrder([
    ...parsedTraitBlocks.flatMap((block) => block.tags),
    ...parsedActionBlocks.flatMap((block) => block.tags),
    ...parsedPoseBlocks.flatMap((block) => block.tags),
    ...(poseTags || []),
    ...(environmentTags || []),
    ...(propsTags || []),
    ...(expressionsTags || []),
    ...(moodStateTags || []),
    ...(nsfwPositionTags || []),
    ...(interactionTags || []),
    ...(nsfwInteractionTags || []),
    ...(sceneTags || []),
    ...(globalTags || []),
    ...(compositionTextTags || []),
    ...(cameraLightingTags || []),
  ]);

  if (!mergedTags.length) {
    return {
      traitBlocks: dedupePreserveOrder(traitBlocks || []),
      actionBlocks: dedupePreserveOrder(actionBlocks || []),
      poseBlocks: dedupePreserveOrder(poseBlocks || []),
      poseTags: dedupePreserveOrder(poseTags || []),
      environmentTags: dedupePreserveOrder(environmentTags || []),
      propsTags: dedupePreserveOrder(propsTags || []),
      expressionsTags: dedupePreserveOrder(expressionsTags || []),
      moodStateTags: dedupePreserveOrder(moodStateTags || []),
      nsfwPositionTags: dedupePreserveOrder(nsfwPositionTags || []),
      interactionTags: dedupePreserveOrder(interactionTags || []),
      nsfwInteractionTags: dedupePreserveOrder(nsfwInteractionTags || []),
      sceneTags: dedupePreserveOrder(sceneTags || []),
      globalTags: dedupePreserveOrder(globalTags || []),
      compositionTextTags: dedupePreserveOrder(compositionTextTags || []),
      cameraLightingTags: dedupePreserveOrder(cameraLightingTags || []),
    };
  }

  const mergedPreparedEntries = mergedTags.map((tag) => ({ tag }));
  const suppressedAtomicMergedTags = dropRedundantAtomicNounsWhenVariantPresent(
    mergedTags,
    mergedPreparedEntries
  );
  const suppressedMergedTags = dropContextuallyAmbiguousWeakTags(suppressedAtomicMergedTags);
  const keepTagSet = buildTagSet(suppressedMergedTags);
  const keepSuppressedTags = (tagsInput) =>
    dedupePreserveOrder(tagsInput || []).filter((tagRaw) => {
      const lower = String(tagRaw || "").trim().toLowerCase();
      if (!lower) return false;
      return keepTagSet.has(lower);
    });

  const suppressedTraitBlocks = parsedTraitBlocks.map((block) =>
    buildCharacterBlock(block.label, keepSuppressedTags(block.tags))
  );
  const suppressedActionBlocks = parsedActionBlocks
    .map((block) => buildActionBlock(block.label, keepSuppressedTags(block.tags)))
    .filter(Boolean);
  const suppressedPoseBlocks = parsedPoseBlocks
    .map((block) => buildPoseBlock(block.label, keepSuppressedTags(block.tags)))
    .filter(Boolean);

  return {
    traitBlocks: suppressedTraitBlocks,
    actionBlocks: suppressedActionBlocks,
    poseBlocks: suppressedPoseBlocks,
    poseTags: keepSuppressedTags(poseTags),
    environmentTags: keepSuppressedTags(environmentTags),
    propsTags: keepSuppressedTags(propsTags),
    expressionsTags: keepSuppressedTags(expressionsTags),
    moodStateTags: keepSuppressedTags(moodStateTags),
    nsfwPositionTags: keepSuppressedTags(nsfwPositionTags),
    interactionTags: keepSuppressedTags(interactionTags),
    nsfwInteractionTags: keepSuppressedTags(nsfwInteractionTags),
    sceneTags: keepSuppressedTags(sceneTags),
    globalTags: keepSuppressedTags(globalTags),
    compositionTextTags: keepSuppressedTags(compositionTextTags),
    cameraLightingTags: keepSuppressedTags(cameraLightingTags),
  };
}

function buildTagSet(tags) {
  return new Set((tags || []).map((tag) => String(tag).toLowerCase()));
}

function collectPackTagCatalog(packItems) {
  const out = [];
  for (const item of packItems || []) {
    const tags = Array.isArray(item?.tags) ? item.tags : [];
    for (const tag of tags) out.push(tag);
  }
  return dedupePreserveOrder(out);
}

function markTagsAsUsed(usedTagLower, tags) {
  for (const tag of dedupePreserveOrder(tags || [])) {
    const lower = String(tag || "").toLowerCase();
    if (!lower) continue;
    usedTagLower.add(lower);
  }
}

function dedupeTagsByUsedSet(tags, usedTagLower) {
  const out = [];
  for (const tag of dedupePreserveOrder(tags || [])) {
    const lower = String(tag || "").toLowerCase();
    if (!lower) continue;
    if (usedTagLower.has(lower)) continue;
    usedTagLower.add(lower);
    out.push(tag);
  }
  return out;
}

function isCompositionCountTag(tag) {
  const raw = String(tag || "").toLowerCase();
  if (raw === "1girl" || raw === "1boy") return true;
  return /^(\d+)(girls|boys)$/i.test(raw);
}

function isGroupCountTag(tag) {
  return /^(\d+)(girls|boys)$/i.test(String(tag));
}

function isSceneTag(tagLower) {
  return SCENE_TAG_KEYWORDS.some(
    (keyword) => tagLower === keyword || tagLower.includes(keyword)
  );
}

function cleanBlockBoundary(block) {
  return String(block || "")
    .trim()
    .replace(/,\s*$/g, "");
}

function joinTagBlocks(blocks) {
  const cleaned = (blocks || []).map(cleanBlockBoundary).filter(Boolean);
  if (!cleaned.length) return "";
  return cleaned.join(",\n\n").replace(/,\s*,/g, ",");
}

function assemblePositivePrompt({
  rating,
  presetPositiveTags,
  modifierPositiveTags,
  loraTriggerTags,
  groupOrGenderTag,
  traitBlocks,
  actionBlocks,
  poseBlocks,
  poseTags,
  environmentTags,
  propsTags,
  expressionsTags,
  moodStateTags,
  nsfwPositionTags,
  interactionTags,
  nsfwInteractionTags,
  sceneTags,
  globalTags,
  compositionTextTags,
  cameraLightingTags,
  rawHelperBlock,
}) {
  const crossBlockSuppressed = applyAtomicVariantSuppressionAcrossBlocks({
    traitBlocks,
    actionBlocks,
    poseBlocks,
    poseTags,
    environmentTags,
    propsTags,
    expressionsTags,
    moodStateTags,
    nsfwPositionTags,
    interactionTags,
    nsfwInteractionTags,
    sceneTags,
    globalTags,
    compositionTextTags,
    cameraLightingTags,
  });
  const mergedTraitBlocks = crossBlockSuppressed.traitBlocks;
  const mergedActionBlocks = crossBlockSuppressed.actionBlocks;
  const mergedPoseBlocks = crossBlockSuppressed.poseBlocks;
  const mergedPoseTags = crossBlockSuppressed.poseTags;
  const mergedEnvironmentTags = crossBlockSuppressed.environmentTags;
  const mergedPropsTags = crossBlockSuppressed.propsTags;
  const mergedExpressionsTags = crossBlockSuppressed.expressionsTags;
  const mergedMoodStateTags = crossBlockSuppressed.moodStateTags;
  const mergedNsfwPositionTags = crossBlockSuppressed.nsfwPositionTags;
  const mergedInteractionTags = crossBlockSuppressed.interactionTags;
  const mergedNsfwInteractionTags = crossBlockSuppressed.nsfwInteractionTags;
  const mergedSceneTags = crossBlockSuppressed.sceneTags;
  const mergedGlobalTags = crossBlockSuppressed.globalTags;
  const mergedCompositionTextTags = crossBlockSuppressed.compositionTextTags;
  const mergedCameraLightingTags = crossBlockSuppressed.cameraLightingTags;

  const headBlock = dedupePreserveOrder([
    ...POSITIVE_DEFAULT_SCORE_BLOCK,
    ...POSITIVE_QUALITY,
    ratingPositiveTag(rating),
    ...presetPositiveTags,
    ...modifierPositiveTags,
  ]).join(", ");
  const poseBlock = normalizeTagListForOutput(mergedPoseTags).join(", ");
  const environmentBlock = normalizeTagListForOutput(mergedEnvironmentTags).join(", ");
  const propsBlock = normalizeTagListForOutput(mergedPropsTags).join(", ");
  const expressionsBlock = normalizeTagListForOutput(mergedExpressionsTags).join(", ");
  const moodStateBlock = normalizeTagListForOutput(mergedMoodStateTags).join(", ");
  const scenesBlock = normalizeTagListForOutput(mergedSceneTags).join(", ");
  const charLevelTokenSet = collectPromptTagTokenSet([
    ...(mergedTraitBlocks || []),
    ...(mergedPoseBlocks || []),
    ...(mergedActionBlocks || []),
  ]);
  const charLevelTokenLowerSet = new Set(
    Array.from(charLevelTokenSet)
      .map((token) => String(token || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const charLevelTokens = Array.from(charLevelTokenSet).map((token) => String(token || "").trim());
  const filterCharLevelTags = (tags) =>
    (tags || []).filter((tagRaw) => {
      const tag = String(tagRaw || "").trim();
      if (!tag) return false;
      return !charLevelTokenLowerSet.has(tag.toLowerCase());
    });
  const applyCharCumHierarchySuppression = (tags) => {
    const source = dedupePreserveOrder(tags || []);
    if (!source.length) return source;
    const reduced = dropRedundantGenericCumBodypartTags([...charLevelTokens, ...source]);
    const reducedSet = buildTagSet(reduced);
    return source.filter((tagRaw) => {
      const lower = String(tagRaw || "").trim().toLowerCase();
      return lower && reducedSet.has(lower);
    });
  };
  const filteredInteractionTags = normalizeTagListForOutput(
    applyCharCumHierarchySuppression(
    filterCharLevelTags(mergedInteractionTags)
  ));
  const filteredNsfwPositionTags = normalizeTagListForOutput(
    applyCharCumHierarchySuppression(
    filterCharLevelTags(mergedNsfwPositionTags)
  ));
  const filteredNsfwInteractionTags = normalizeTagListForOutput(
    applyCharCumHierarchySuppression(
    filterCharLevelTags(mergedNsfwInteractionTags)
  ));
  const nsfwPositionBlock = filteredNsfwPositionTags.length
    ? filteredNsfwPositionTags.join(", ")
    : "";
  const interactionsBlock = filteredInteractionTags.length
    ? filteredInteractionTags.join(", ")
    : "";
  const nsfwInteractionBlock = filteredNsfwInteractionTags.length
    ? filteredNsfwInteractionTags.join(", ")
    : "";
  const filteredGlobalTags = normalizeTagListForOutput(
    applyCharCumHierarchySuppression(filterCharLevelTags(mergedGlobalTags))
  );
  const globalBlock = filteredGlobalTags.length
    ? filteredGlobalTags.join(", ")
    : "";
  const compositionTextBlock = normalizeTagListForOutput(mergedCompositionTextTags).join(", ");
  const cameraLightingBlock = normalizeTagListForOutput(mergedCameraLightingTags).join(", ");
  const blocksWithoutLora = [
    headBlock,
    groupOrGenderTag || "",
    ...(mergedTraitBlocks || []),
    ...(mergedPoseBlocks || []),
    ...(mergedActionBlocks || []),
    interactionsBlock,
    nsfwPositionBlock,
    nsfwInteractionBlock,
    poseBlock,
    environmentBlock,
    scenesBlock,
    propsBlock,
    expressionsBlock,
    moodStateBlock,
    compositionTextBlock,
    globalBlock,
    cameraLightingBlock,
  ];
  const existingTokenSet = collectPromptTagTokenSet(blocksWithoutLora);
  const loraBlock = dedupePreserveOrder(loraTriggerTags || [])
    .filter((tokenRaw) => {
      const token = String(tokenRaw || "").trim();
      if (!token) return false;
      if (existingTokenSet.has(token)) return false;
      existingTokenSet.add(token);
      return true;
    })
    .join(", ");

  return joinTagBlocks([
    headBlock,
    loraBlock,
    groupOrGenderTag || "",
    ...(mergedTraitBlocks || []),
    ...(mergedPoseBlocks || []),
    ...(mergedActionBlocks || []),
    interactionsBlock,
    nsfwPositionBlock,
    nsfwInteractionBlock,
    poseBlock,
    environmentBlock,
    scenesBlock,
    propsBlock,
    expressionsBlock,
    moodStateBlock,
    compositionTextBlock,
    globalBlock,
    cameraLightingBlock,
    rawHelperBlock || "",
  ]);
}

function buildNegativeBaseline(userText) {
  const normalized = normalizeForContains(userText);
  const remove = new Set();
  for (const keyword of NEGATIVE_CONTRADICTION_KEYWORDS) {
    if (containsNormalizedPhrase(normalized, keyword)) {
      remove.add(keyword);
    }
  }

  return NEGATIVE_BASELINE.filter((tag) => !remove.has(String(tag).toLowerCase()));
}

function buildNegativePrompt({
  rating,
  userText,
  positiveForScore,
  presetNegativeTags,
  modifierNegativeTags,
}) {
  const hasNsfwIntent = includesAnyKeyword(userText, NSFW_INTENT_KEYWORDS);
  const scoreLine = buildNegativeScoreBlockFromPositive(positiveForScore).join(", ");
  const suppressionLine = dedupePreserveOrder(
    ratingSuppressionTags(rating, hasNsfwIntent)
  ).join(", ");
  const styleLine = dedupePreserveOrder([
    ...presetNegativeTags,
    ...modifierNegativeTags,
  ]).join(", ");
  const baselineLine = dedupePreserveOrder(buildNegativeBaseline(userText)).join(", ");

  return [scoreLine, suppressionLine, styleLine, baselineLine].join("\n").trimEnd();
}

function readEmbeddedJson(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const raw = el.textContent ?? "";
  try {
    return JSON.parse(raw);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid embedded JSON in #${id}: ${detail}`);
  }
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Manifest must be an object");
  }
  if (!manifest.active || typeof manifest.active !== "object" || Array.isArray(manifest.active)) {
    throw new Error("Manifest must include an active object");
  }
}

function readEmbeddedPack(packKey) {
  return readEmbeddedJson(`pack-${packKey}`);
}

async function fetchJsonOrThrow(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.httpStatus = res.status;
    throw err;
  }
  return await res.json();
}

function normalizeBaseUrl(baseUrl) {
  const value = String(baseUrl || "").trim() || "/data/";
  return value.endsWith("/") ? value : `${value}/`;
}

function resolvePackUrl(packKey, manifest) {
  const filename = String(manifest?.active?.[packKey] || "").trim();
  if (!filename) {
    throw new Error(`Manifest missing active filename for pack '${packKey}'`);
  }
  return `${normalizeBaseUrl(manifest?.baseUrl)}${filename}`;
}

async function loadManifest() {
  let embeddedError = null;

  try {
    const embedded = readEmbeddedJson(PACK_MANIFEST_EMBED_ID);
    if (embedded !== null) {
      validateManifest(embedded);
      return embedded;
    }
  } catch (err) {
    embeddedError = err;
  }

  try {
    const fetched = await fetchJsonOrThrow(PACK_MANIFEST_URL);
    validateManifest(fetched);
    return fetched;
  } catch (fetchErr) {
    const fetchMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    if (embeddedError) {
      const embeddedMsg =
        embeddedError instanceof Error ? embeddedError.message : String(embeddedError);
      throw new Error(
        `Failed to load manifest. Embedded parse failed (${embeddedMsg}). Fetch failed (${fetchMsg}).`
      );
    }
    throw new Error(`Failed to load manifest: ${fetchMsg}`);
  }
}

async function loadPack(packKey, manifest) {
  let embeddedError = null;
  try {
    const embedded = readEmbeddedPack(packKey);
    if (embedded !== null) {
      return embedded;
    }
  } catch (err) {
    embeddedError = err;
  }

  const packUrl = resolvePackUrl(packKey, manifest);
  try {
    return await fetchJsonOrThrow(packUrl);
  } catch (fetchErr) {
    const fetchMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    if (embeddedError) {
      const embeddedMsg =
        embeddedError instanceof Error ? embeddedError.message : String(embeddedError);
      throw new Error(
        `Failed to load pack '${packKey}'. Embedded parse failed (${embeddedMsg}). Fetch failed (${fetchMsg}).`
      );
    }
    throw new Error(`Failed to load pack '${packKey}' from ${packUrl}: ${fetchMsg}`);
  }
}

async function loadPackOptional(packKey, manifest) {
  if (!manifest?.active || !Object.prototype.hasOwnProperty.call(manifest.active, packKey)) {
    return null;
  }
  try {
    return await loadPack(packKey, manifest);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("HTTP 404") || msg.includes("Failed to fetch")) {
      return null;
    }
    throw err;
  }
}

async function main() {
  const manifest = await loadManifest();
  window.__PACK_MANIFEST_VERSION__ = String(manifest?.version || "");

  const [
    cat0Data,
    cameraDataRaw,
    lightingDataRaw,
    presetsData,
    modifiersData,
    aliasesData,
    interactionsData,
    actionsData,
    scenesData,
    poseData,
    moodStatesData,
    expressionsData,
    environmentData,
    propsData,
    wearablePropsData,
    compositionTextData,
    lightingRenderV1Data,
    traitExtraData,
    clothingData,
    colorsData,
    clothingNounsData,
    characterData,
    speciesData,
    animalsData,
    faceData,
    fluidsData,
    vehiclesData,
    exposureData,
    characterCountData,
    metaTimeData,
    metaWorldData,
    bodyPartsData,
    suggestiveBodyData,
    suggestiveActionData,
    suggestiveClothingData,
    suggestiveInteractionData,
    suggestivePoseData,
    nsfwBodyData,
    nsfwCameraData,
    nsfwMoodData,
    nsfwPositionData,
    nsfwPoseData,
    nsfwActionData,
    nsfwInteractionData,
    nsfwClothingStateData,
    nsfwFluidsData,
    nsfwPropsData,
    timeOfDayData,
    hairData,
    westernFemaleCharacterAllowlistData,
  ] =
    await Promise.all([
      loadPackOptional("cat0", manifest),
      loadPack("camera", manifest),
      loadPack("lighting", manifest),
      loadPackOptional("presets", manifest),
      loadPackOptional("modifiers", manifest),
      loadPackOptional("aliases", manifest),
      loadPack("interactions", manifest),
      loadPack("actions", manifest),
      loadPack("scenes", manifest),
      loadPack("pose", manifest),
      loadPack("moodStates", manifest),
      loadPack("expressions", manifest),
      loadPack("environment", manifest),
      loadPack("props", manifest),
      loadPackOptional("wearableProps", manifest),
      loadPack("compositionText", manifest),
      loadPackOptional("lightingRenderV1", manifest),
      loadPackOptional("traitExtra", manifest),
      loadPack("clothing", manifest),
      loadPackOptional("colors", manifest),
      loadPackOptional("clothingNouns", manifest),
      loadPack("characters", manifest),
      loadPackOptional("species", manifest),
      loadPackOptional("animals", manifest),
      loadPackOptional("face", manifest),
      loadPackOptional("fluids", manifest),
      loadPackOptional("vehicles", manifest),
      loadPackOptional("exposure", manifest),
      loadPackOptional("characterCount", manifest),
      loadPackOptional("metaTime", manifest),
      loadPackOptional("metaWorld", manifest),
      loadPackOptional("bodyParts", manifest),
      loadPackOptional("suggestiveBody", manifest),
      loadPackOptional("suggestiveAction", manifest),
      loadPackOptional("suggestiveClothing", manifest),
      loadPackOptional("suggestiveInteraction", manifest),
      loadPackOptional("suggestivePose", manifest),
      loadPack("nsfwBody", manifest),
      loadPackOptional("nsfwCamera", manifest),
      loadPackOptional("nsfwMood", manifest),
      loadPack("nsfwPosition", manifest),
      loadPackOptional("nsfwPose", manifest),
      loadPackOptional("nsfwAction", manifest),
      loadPack("nsfwInteraction", manifest),
      loadPack("nsfwClothingState", manifest),
      loadPack("nsfwFluids", manifest),
      loadPackOptional("nsfwProps", manifest),
      loadPackOptional("timeOfDay", manifest),
      loadPackOptional("hair", manifest),
      (location.protocol === "file:"
        ? Promise.resolve(null)
        : fetchJsonOrThrow("/data/western_female_character_allowlist_v1.json").catch(() => null)),
    ]);

  const cameraData = normalizeCameraPackData(cameraDataRaw, compositionTextData);
  const lightingData = normalizeLightingPackData(lightingDataRaw, timeOfDayData);

  const matcherFallbackPacks = [
    cameraDataRaw,
    lightingDataRaw,
    modifiersData,
    interactionsData,
    actionsData,
    scenesData,
    poseData,
    moodStatesData,
    expressionsData,
    environmentData,
    propsData,
    wearablePropsData,
    compositionTextData,
    lightingRenderV1Data,
    traitExtraData,
    clothingData,
    colorsData,
    characterData,
    speciesData,
    animalsData,
    faceData,
    fluidsData,
    vehiclesData,
    exposureData,
    characterCountData,
    metaTimeData,
    metaWorldData,
    bodyPartsData,
    suggestiveBodyData,
    suggestiveActionData,
    suggestiveClothingData,
    suggestiveInteractionData,
    suggestivePoseData,
    nsfwBodyData,
    nsfwCameraData,
    nsfwMoodData,
    nsfwPositionData,
    nsfwPoseData,
    nsfwActionData,
    nsfwInteractionData,
    nsfwClothingStateData,
    nsfwFluidsData,
    nsfwPropsData,
    timeOfDayData,
    hairData,
  ];
  const getMatcherSourceData = createLazy(() =>
    hasMatcherMappings(cat0Data) ? cat0Data : buildMatcherFallbackData(matcherFallbackPacks)
  );
  const getMatcher = createLazy(() => buildMatcherFromData(getMatcherSourceData()));

  const presets = normalizePresetsData(presetsData, modifiersData);
  const modifiers = normalizeModifiersData(modifiersData, presetsData);
  const aliasItems = getPackItems(aliasesData, ["overrides", "aliases", "items"]);
  const getAliasesPrepared = createLazy(() => preparePhraseEntries(aliasItems, "phrase", "tag"));
  const interactionItemsBase = getPackItems(interactionsData, ["interactions", "items"]);
  const interactionItems = appendPhraseVariants(
    interactionItemsBase,
    INTERACTION_PHRASE_VARIANTS
  );
  const getInteractionsPrepared = createLazy(() =>
    preparePhraseEntries(interactionItems, "phrase", "tag", {
      applyControlledNormalization: true,
    })
  );
  const characterItems = getPackItems(characterData, ["characters", "items"]);
  const getCharactersPrepared = createLazy(() =>
    preparePhraseEntries(characterItems, "phrase", "tag", {
      dropStrictTagSubphrases: true,
    })
  );
  const speciesItems = getPackItems(speciesData, ["items", "species", "tags"]);
  const animalsItems = getPackItems(animalsData, ["items", "animals", "tags"]);
  const getSpeciesPrepared = createLazy(() =>
    preparePhraseEntries(speciesItems, "phrase", "tag", {
      applyControlledNormalization: true,
    })
  );
  const getAnimalsPrepared = createLazy(() =>
    preparePhraseEntries(animalsItems, "phrase", "tag", {
      applyControlledNormalization: true,
    })
  );
  const getSubjectEntityPrepared = createLazy(() =>
    sortPreparedPhraseEntries(mergePhraseEntryLists(getSpeciesPrepared(), getAnimalsPrepared()))
  );
  const faceItems = getPackItems(faceData, ["items", "face", "tags"]);
  const fluidsItems = getPackItems(fluidsData, ["items", "fluids", "tags"]);
  const vehiclesItems = getPackItems(vehiclesData, ["items", "vehicles", "tags"]);
  const exposureItems = getPackItems(exposureData, ["items", "exposure", "tags"]);
  const characterCountItems = getPackItems(characterCountData, [
    "items",
    "character_count",
    "characterCount",
    "tags",
  ]);
  const metaTimeItems = getPackItems(metaTimeData, ["items", "meta_time", "metaTime", "tags"]);
  const metaWorldItems = getPackItems(metaWorldData, [
    "items",
    "meta_world",
    "metaWorld",
    "tags",
  ]);
  KNOWN_CHARACTER_TAG_SET.clear();
  for (const entry of characterItems) {
    const lower = String(entry?.tag || "").toLowerCase().trim();
    if (!lower) continue;
    KNOWN_CHARACTER_TAG_SET.add(lower);
  }
  const knownFemaleCharacterTagSet = new Set(
    (Array.isArray(westernFemaleCharacterAllowlistData?.tags)
      ? westernFemaleCharacterAllowlistData.tags
      : []
    )
      .map((tag) => String(tag || "").toLowerCase().trim())
      .filter(Boolean)
  );
  const actionItemsBase = getPackItems(actionsData, ["items", "actions"]);
  const actionItems = appendPhraseVariants(actionItemsBase, ACTION_PHRASE_VARIANTS);
  const legacyActionAllItems = normalizePhraseTagItems(actionItems);
  const actionItemTagSet = buildTagSet(actionItems.map((entry) => entry?.tag));
  const legacyActionVariantItems = legacyActionAllItems.filter((entry) =>
    actionItemTagSet.has(String(entry?.tag).toLowerCase())
  );
  const sceneItemsBase = getPackItems(scenesData, ["scenes", "items"]);
  const sceneItems = appendPhraseVariants(sceneItemsBase, SCENE_PHRASE_VARIANTS);
  const poseItemsBase = getPackItems(poseData, ["poses", "items"]);
  const poseItems = appendPhraseVariants(poseItemsBase, POSE_PHRASE_VARIANTS);
  const moodStateItems = getPackItems(moodStatesData, ["moods", "items"]);
  const expressionItems = getPackItems(expressionsData, ["expressions", "items"]);
  const environmentItemsBase = getPackItems(environmentData, ["environments", "items"]);
  const environmentItems = appendPhraseVariants(
    environmentItemsBase,
    ENVIRONMENT_PHRASE_VARIANTS
  );
  const propsItemsBase = getPackItems(propsData, ["props", "items"]);
  const propsItems = normalizePhraseTagItems([
    ...appendPhraseVariants(propsItemsBase, PROPS_PHRASE_VARIANTS),
    ...PROPS_EXTERNAL_PHRASE_ITEMS,
  ]);
  const wearablePropsItems = getPackItems(wearablePropsData, ["props", "items"]);
  const compositionBaseItems = getPackItems(compositionTextData, [
    "composition",
    "compositions",
    "items",
  ]);
  const traitExtraItemsBase = getPackItems(traitExtraData, ["traits", "items"]);
  const traitExtraItems = normalizePhraseTagItems([
    ...appendPhraseVariants(traitExtraItemsBase, TRAIT_PHRASE_VARIANTS),
    ...TRAIT_EXTERNAL_PHRASE_ITEMS,
  ]);
  const bodyPartsItems = getPackItems(bodyPartsData, ["items", "body_parts", "tags"]);
  const clothingItemsBase = getPackItems(clothingData, ["items"]);
  const clothingItems = normalizePhraseTagItems([
    ...clothingItemsBase,
    ...CLOTHING_EXTERNAL_PHRASE_ITEMS,
  ]);
  const hairItemsBase = getPackItems(hairData, ["items", "hair", "tags"]);
  const hairItems = appendPhraseVariants(hairItemsBase, HAIR_PHRASE_VARIANTS);
  const timeOfDayItems = getPackItems(timeOfDayData, ["items", "time_of_day", "tags"]);
  const aestheticsItems = getPackItems(modifiersData, ["items", "tags"]);
  const aestheticsGlobalItems = appendPhraseVariants(
    aestheticsItems.filter((entry) =>
      AESTHETICS_GLOBAL_TAG_ALLOWLIST.has(String(entry?.tag || "").toLowerCase())
    ),
    [{ tag: "smoke", phrases: ["smoke rising", "rising smoke"] }]
  );
  const metaQualityItems = getPackItems(presetsData, ["items", "tags"]);
  const lightingRenderItems = getPackItems(lightingRenderV1Data, [
    "items",
    "lighting_render",
    "lightingRender",
  ]);
  const compositionItems = unionByTag(compositionBaseItems, lightingRenderItems);
  const getFacePrepared = createLazy(() =>
    preparePhraseEntries(faceItems, "phrase", "tag", {
      applyControlledNormalization: true,
    })
  );
  const getFluidsPrepared = createLazy(() =>
    preparePhraseEntries(fluidsItems, "phrase", "tag", {
      applyControlledNormalization: true,
    })
  );
  const getVehiclesPrepared = createLazy(() =>
    preparePhraseEntries(vehiclesItems, "phrase", "tag", {
      applyControlledNormalization: true,
    })
  );
  const getMetaTimePrepared = createLazy(() =>
    preparePhraseEntries(metaTimeItems, "phrase", "tag")
  );
  const getMetaWorldPrepared = createLazy(() =>
    preparePhraseEntries(metaWorldItems, "phrase", "tag")
  );
  const getMetaQualityPrepared = createLazy(() =>
    preparePhraseEntries(metaQualityItems, "phrase", "tag")
  );

  const getActionsPrepared = createLazy(() =>
    prepareUnionWithPhraseVariants(
      actionItems,
      actionItems,
      legacyActionVariantItems,
      "phrase",
      "tag",
      { applyControlledNormalization: true }
    )
  );
  const getScenesPrepared = createLazy(() =>
    prepareUnionWithPhraseVariants(
      sceneItems,
      sceneItems,
      sceneItems,
      "phrase",
      "tag",
      { applyControlledNormalization: true }
    )
  );
  const getPosesPrepared = createLazy(() =>
    prepareUnionWithPhraseVariants(
      poseItems,
      poseItems,
      poseItems,
      "phrase",
      "tag",
      { applyControlledNormalization: true }
    )
  );
  const getEnvironmentsPrepared = createLazy(() =>
    preparePhraseEntries(environmentItems, "phrase", "tag", {
      applyControlledNormalization: true,
    })
  );
  const getPropsPrepared = createLazy(() =>
    preparePhraseEntries(propsItems, "phrase", "tag", {
      applyControlledNormalization: true,
    })
  );
  const getWearablePropsPrepared = createLazy(() =>
    preparePhraseEntries(wearablePropsItems, "phrase", "tag")
  );
  const getAestheticsGlobalPrepared = createLazy(() =>
    preparePhraseEntries(aestheticsGlobalItems, "phrase", "tag")
  );
  const getMoodStatesPrepared = createLazy(() =>
    preparePhraseEntries(moodStateItems, "phrase", "tag")
  );
  const getExpressionsPrepared = createLazy(() => {
    const expressionsBasePrepared = preparePhraseEntries(expressionItems, "phrase", "tag", {
      applyControlledNormalization: true,
    });
    const expressionTagSetForVariants = buildTagSet(
      expressionsBasePrepared.map((entry) => entry.tag)
    );
    const legacyExpressionVariantItems = legacyActionAllItems.filter((entry) =>
      expressionTagSetForVariants.has(String(entry?.tag).toLowerCase())
    );
    return mergePhraseEntryLists(
      expressionsBasePrepared,
      preparePhraseEntries(legacyExpressionVariantItems, "phrase", "tag")
    );
  });
  const getCompositionsPrepared = createLazy(() => {
    const compositionsBasePrepared = preparePhraseEntries(compositionBaseItems, "phrase", "tag");
    const lightingRenderPrepared = preparePhraseEntries(lightingRenderItems, "phrase", "tag");
    return mergePhraseEntryLists(compositionsBasePrepared, lightingRenderPrepared);
  });
  const getTraitExtraPrepared = createLazy(() =>
    preparePhraseEntries(traitExtraItems, "phrase", "tag", {
      applyControlledNormalization: true,
    })
  );
  const getBodyPartsPrepared = createLazy(() =>
    preparePhraseEntries(bodyPartsItems, "phrase", "tag")
  );
  const getClothingPrepared = createLazy(() =>
    preparePhraseEntries(clothingItems, "phrase", "tag")
  );
  const colorItems = getPackItems(colorsData, ["colors", "items"]);
  const getColorsPrepared = createLazy(() =>
    preparePhraseEntries(colorItems, "phrase", "tag")
  );
  const clothingNounItems = getPackItems(clothingNounsData, ["clothing", "items"]);
  const explicitClothingNouns = Array.isArray(clothingNounsData?.clothing)
    ? clothingNounsData.clothing
    : [];
  const derivedClothingNouns = clothingNounItems.length
    ? clothingNounItems.map((entry) => entry?.phrase || String(entry?.tag || "").replace(/_/g, " "))
    : [];
  const clothingNouns = dedupePreserveOrder(
    explicitClothingNouns.length
      ? explicitClothingNouns
      : derivedClothingNouns.length
      ? derivedClothingNouns
      : clothingItems.map((entry) => String(entry?.tag || "").replace(/_/g, " "))
  );
  const clothingNounsNorm = clothingNouns.map(normalizePhrase).filter(Boolean);

  KNOWN_COLOR_TAG_SET.clear();
  for (const entry of colorItems) {
    const lower = String(entry?.tag || "").toLowerCase().trim();
    if (!lower) continue;
    KNOWN_COLOR_TAG_SET.add(lower);
  }

  const getHairColorPrepared = createLazy(() =>
    buildHairColorPreparedFromCat0(getMatcherSourceData())
  );
  const getClothingByFirstToken = createLazy(() => {
    const clothingBindingPrepared = buildClothingPreparedFromCat0(getMatcherSourceData());
    return indexPreparedByFirstToken(clothingBindingPrepared);
  });

  const poseFallbackPrepared = tagListToPhraseEntries(POSE_FALLBACK_TAGS);
  const environmentFallbackPrepared = tagListToPhraseEntries(ENVIRONMENT_FALLBACK_TAGS);
  const getPoseMaskPreparedSfw = createLazy(() =>
    sortPreparedPhraseEntries(mergePhraseEntryLists(getPosesPrepared(), poseFallbackPrepared))
  );

  const actionsTags = dedupePreserveOrder(actionItems.map((entry) => entry?.tag));
  const sceneTagsCatalog = dedupePreserveOrder(sceneItems.map((entry) => entry?.tag));
  const poseTagsCatalog = dedupePreserveOrder([
    ...poseItems.map((entry) => entry?.tag),
    ...POSE_FALLBACK_TAGS,
  ]);
  const environmentTagsCatalog = dedupePreserveOrder([
    ...environmentItems.map((entry) => entry?.tag),
    ...ENVIRONMENT_FALLBACK_TAGS,
  ]);
  const propsTagsCatalog = dedupePreserveOrder(propsItems.map((entry) => entry?.tag));
  const wearablePropsTagsCatalog = dedupePreserveOrder(
    wearablePropsItems.map((entry) => entry?.tag)
  );
  const moodStateTagsCatalog = dedupePreserveOrder(
    moodStateItems.map((entry) => entry?.tag)
  );
  const expressionTagsCatalog = dedupePreserveOrder(
    expressionItems.map((entry) => entry?.tag)
  );
  const expressionTagsCatalogSet = buildTagSet(expressionTagsCatalog);
  const clothingTagsCatalog = dedupePreserveOrder(
    clothingItems.map((entry) => entry?.tag)
  );
  const hairTagsCatalog = dedupePreserveOrder(hairItems.map((entry) => entry?.tag));
  const hairColorTagsCatalog = dedupePreserveOrder(
    Object.values(HAIR_COLOR_MAP).map((tag) => String(tag || "").toLowerCase())
  );
  const timeOfDayTagsCatalog = dedupePreserveOrder(timeOfDayItems.map((entry) => entry?.tag));
  const aestheticsTagsCatalog = dedupePreserveOrder(
    aestheticsItems.map((entry) => entry?.tag)
  );
  const metaQualityTagsCatalog = dedupePreserveOrder(
    metaQualityItems.map((entry) => entry?.tag)
  );
  const metaThemeTagsCatalog = dedupePreserveOrder(aliasItems.map((entry) => entry?.tag));
  const metaContentTagsCatalog = dedupePreserveOrder(colorItems.map((entry) => entry?.tag));
  const metaTimeTagsCatalog = dedupePreserveOrder(metaTimeItems.map((entry) => entry?.tag));
  const metaWorldTagsCatalog = dedupePreserveOrder(metaWorldItems.map((entry) => entry?.tag));
  const exposureTagsCatalog = dedupePreserveOrder(exposureItems.map((entry) => entry?.tag));
  const characterCountTagsCatalog = dedupePreserveOrder(
    characterCountItems.map((entry) => entry?.tag)
  );
  const compositionTagsCatalog = dedupePreserveOrder(
    compositionItems.map((entry) => entry?.tag)
  );
  const characterTagsCatalog = dedupePreserveOrder(characterItems.map((entry) => entry?.tag));
  const traitExtraTagsCatalog = dedupePreserveOrder(traitExtraItems.map((entry) => entry?.tag));
  const speciesTagsCatalog = dedupePreserveOrder(speciesItems.map((entry) => entry?.tag));
  const animalsTagsCatalog = dedupePreserveOrder(animalsItems.map((entry) => entry?.tag));
  const faceTagsCatalog = dedupePreserveOrder(faceItems.map((entry) => entry?.tag));
  const fluidsTagsCatalog = dedupePreserveOrder(fluidsItems.map((entry) => entry?.tag));
  const vehiclesTagsCatalog = dedupePreserveOrder(vehiclesItems.map((entry) => entry?.tag));
  const cameraUiTagsCatalog = dedupePreserveOrder([
    ...collectPackTagCatalog(cameraData?.framing),
    ...collectPackTagCatalog(cameraData?.angle),
    ...collectPackTagCatalog(cameraData?.composition_toggles),
  ]);
  const lightingUiTagsCatalog = dedupePreserveOrder([
    ...collectPackTagCatalog(lightingData?.lighting),
    ...collectPackTagCatalog(lightingData?.time_of_day),
  ]);
  const interactionTagsCatalog = dedupePreserveOrder(
    interactionItems.map((entry) => entry?.tag)
  );
  const bodyPartsTagsCatalog = dedupePreserveOrder(
    bodyPartsItems.map((entry) => entry?.tag)
  );
  const cameraTagsPrepared = tagListToPhraseEntries(cameraUiTagsCatalog);
  const lightingTagsPrepared = tagListToPhraseEntries(lightingUiTagsCatalog);
  const getEnvironmentMatcherPrepared = createLazy(() =>
    mergePhraseEntryLists(getEnvironmentsPrepared(), environmentFallbackPrepared)
  );
  const getPropsMatcherPrepared = createLazy(() =>
    mergePhraseEntryLists(getPropsPrepared(), getWearablePropsPrepared())
  );
  const getOrderedMatcherSourcePrepared = createLazy(() => [
    getEnvironmentMatcherPrepared(),
    cameraTagsPrepared,
    lightingTagsPrepared,
    getCompositionsPrepared(),
    getAestheticsGlobalPrepared(),
    getClothingPrepared(),
    getBodyPartsPrepared(),
    getActionsPrepared(),
    getCharactersPrepared(),
    getPropsMatcherPrepared(),
  ]);

  const suggestiveBodyItems = getPackItems(suggestiveBodyData, ["items", "tags"]);
  const suggestiveActionItems = getPackItems(suggestiveActionData, ["items", "tags", "actions"]);
  const suggestiveClothingItems = getPackItems(suggestiveClothingData, [
    "items",
    "tags",
    "clothing",
  ]);
  const suggestiveInteractionItems = getPackItems(suggestiveInteractionData, [
    "items",
    "tags",
    "interactions",
  ]);
  const suggestivePoseItems = getPackItems(suggestivePoseData, ["items", "tags", "poses"]);
  const nsfwBodyItems = getPackItems(nsfwBodyData, ["items", "tags"]);
  const nsfwCameraItems = getPackItems(nsfwCameraData, ["items", "tags", "camera"]);
  const nsfwMoodItems = getPackItems(nsfwMoodData, ["items", "tags", "moods"]);
  const nsfwPositionItems = getPackItems(nsfwPositionData, ["items", "tags"]);
  const nsfwPoseItems = getPackItems(nsfwPoseData, ["items", "tags", "poses"]);
  const nsfwActionItems = getPackItems(nsfwActionData, ["items", "tags"]);
  const nsfwInteractionItems = normalizePhraseTagItems([
    ...getPackItems(nsfwInteractionData, ["items", "tags"]),
    ...nsfwActionItems,
  ]);
  const nsfwClothingStateItems = getPackItems(nsfwClothingStateData, ["items", "tags"]);
  const nsfwFluidsItems = getPackItems(nsfwFluidsData, ["items", "tags"]);
  const nsfwPropsItems = getPackItems(nsfwPropsData, ["props", "items", "tags"]);
  const getSuggestiveBodyPrepared = createLazy(() =>
    preparePhraseEntries(suggestiveBodyItems, "phrase", "tag")
  );
  const getSuggestiveActionPrepared = createLazy(() =>
    preparePhraseEntries(suggestiveActionItems, "phrase", "tag")
  );
  const getSuggestiveClothingPrepared = createLazy(() =>
    preparePhraseEntries(suggestiveClothingItems, "phrase", "tag")
  );
  const getSuggestiveInteractionPrepared = createLazy(() =>
    preparePhraseEntries(suggestiveInteractionItems, "phrase", "tag")
  );
  const getSuggestivePosePrepared = createLazy(() =>
    preparePhraseEntries(suggestivePoseItems, "phrase", "tag")
  );
  const getNsfwBodyPrepared = createLazy(() => preparePhraseEntries(nsfwBodyItems, "phrase", "tag"));
  const getNsfwCameraPrepared = createLazy(() =>
    preparePhraseEntries(nsfwCameraItems, "phrase", "tag")
  );
  const getNsfwMoodPrepared = createLazy(() => preparePhraseEntries(nsfwMoodItems, "phrase", "tag"));
  const getNsfwPositionPrepared = createLazy(() =>
    preparePhraseEntries(nsfwPositionItems, "phrase", "tag")
  );
  const getNsfwPosePrepared = createLazy(() => preparePhraseEntries(nsfwPoseItems, "phrase", "tag"));
  const getNsfwInteractionPrepared = createLazy(() =>
    preparePhraseEntries(nsfwInteractionItems, "phrase", "tag")
  );
  const getNsfwPropsPrepared = createLazy(() => preparePhraseEntries(nsfwPropsItems, "phrase", "tag"));
  const getNsfwClothingStatePrepared = createLazy(() =>
    preparePhraseEntries(nsfwClothingStateItems, "phrase", "tag")
  );
  const getNsfwFluidsPrepared = createLazy(() =>
    preparePhraseEntries(nsfwFluidsItems, "phrase", "tag")
  );
  const getActionsPreparedSuggestive = createLazy(() =>
    mergePhraseEntryLists(getActionsPrepared(), getSuggestiveActionPrepared())
  );
  const getInteractionsPreparedSuggestive = createLazy(() =>
    mergePhraseEntryLists(getInteractionsPrepared(), getSuggestiveInteractionPrepared())
  );
  const getClothingPreparedSuggestive = createLazy(() =>
    mergePhraseEntryLists(getClothingPrepared(), getSuggestiveClothingPrepared())
  );
  const getPosesPreparedSuggestive = createLazy(() =>
    mergePhraseEntryLists(getPosesPrepared(), getSuggestivePosePrepared())
  );
  const getPosesPreparedNsfw = createLazy(() =>
    mergePhraseEntryLists(getPosesPreparedSuggestive(), getNsfwPosePrepared())
  );
  const getPoseMaskPreparedSuggestive = createLazy(() =>
    sortPreparedPhraseEntries(mergePhraseEntryLists(getPosesPreparedSuggestive(), poseFallbackPrepared))
  );
  const getPoseMaskPreparedNsfw = createLazy(() =>
    sortPreparedPhraseEntries(mergePhraseEntryLists(getPosesPreparedNsfw(), poseFallbackPrepared))
  );
  const getMoodStatesPreparedNsfw = createLazy(() =>
    mergePhraseEntryLists(getMoodStatesPrepared(), getNsfwMoodPrepared())
  );
  const nsfwPositionTagsCatalog = dedupePreserveOrder([
    ...nsfwPositionItems.map((entry) => entry?.tag),
    ...nsfwClothingStateItems.map((entry) => entry?.tag),
    ...nsfwFluidsItems.map((entry) => entry?.tag),
  ]);
  const nsfwPositionOnlyTagsCatalog = dedupePreserveOrder(
    nsfwPositionItems.map((entry) => entry?.tag)
  );
  const nsfwActionTagsCatalog = dedupePreserveOrder(
    nsfwActionItems.map((entry) => entry?.tag)
  );
  const suggestiveActionTagsCatalog = dedupePreserveOrder(
    suggestiveActionItems.map((entry) => entry?.tag)
  );
  const suggestivePoseTagsCatalog = dedupePreserveOrder(
    suggestivePoseItems.map((entry) => entry?.tag)
  );
  const suggestiveInteractionTagsCatalog = dedupePreserveOrder(
    suggestiveInteractionItems.map((entry) => entry?.tag)
  );
  const suggestiveClothingTagsCatalog = dedupePreserveOrder(
    suggestiveClothingItems.map((entry) => entry?.tag)
  );
  const nsfwClothingTagsCatalog = dedupePreserveOrder(
    nsfwClothingStateItems.map((entry) => entry?.tag)
  );
  const nsfwPoseTagsCatalog = dedupePreserveOrder(
    nsfwPoseItems.map((entry) => entry?.tag)
  );
  const nsfwMoodTagsCatalog = dedupePreserveOrder(
    nsfwMoodItems.map((entry) => entry?.tag)
  );
  const nsfwCameraTagsCatalog = dedupePreserveOrder(
    nsfwCameraItems.map((entry) => entry?.tag)
  );
  const nsfwFluidsTagsCatalog = dedupePreserveOrder(
    nsfwFluidsItems.map((entry) => entry?.tag)
  );
  const nsfwBodyTagsCatalog = dedupePreserveOrder(
    nsfwBodyItems.map((entry) => entry?.tag)
  );
  const suggestiveBodyTagsCatalog = dedupePreserveOrder(
    suggestiveBodyItems.map((entry) => entry?.tag)
  );
  const nsfwPropsTagsCatalog = dedupePreserveOrder(
    nsfwPropsItems.map((entry) => entry?.tag)
  );
  const nsfwInteractionTagsCatalog = dedupePreserveOrder(
    nsfwInteractionItems.map((entry) => entry?.tag)
  );
  const actionTagsCatalog = dedupePreserveOrder([
    ...actionsTags,
    ...suggestiveActionTagsCatalog,
    ...nsfwActionTagsCatalog,
  ]);
  const actionTagsCatalogSet = buildTagSet(actionTagsCatalog);
  const poseTagsCatalogAll = dedupePreserveOrder([
    ...poseTagsCatalog,
    ...suggestivePoseTagsCatalog,
    ...nsfwPoseTagsCatalog,
  ]);
  const poseTagsCatalogAllSet = buildTagSet(poseTagsCatalogAll);
  const isPerEntityPoseTag = (tagRaw) => {
    const lower = String(tagRaw || "").toLowerCase().trim();
    if (!lower) return false;
    return poseTagsCatalogAllSet.has(lower) || PER_ENTITY_POSE_SPLIT_TAG_SET.has(lower);
  };
  const interactionTagsCatalogAll = dedupePreserveOrder([
    ...interactionTagsCatalog,
    ...suggestiveInteractionTagsCatalog,
    ...nsfwInteractionTagsCatalog,
    ...nsfwPositionOnlyTagsCatalog,
  ]);
  const moodStateTagsCatalogAll = dedupePreserveOrder([
    ...moodStateTagsCatalog,
    ...nsfwMoodTagsCatalog,
  ]);
  const cameraTagsCatalogAll = dedupePreserveOrder([
    ...cameraUiTagsCatalog,
    ...nsfwCameraTagsCatalog,
  ]);
  const clothingTagsCatalogAll = dedupePreserveOrder([
    ...clothingTagsCatalog,
    ...suggestiveClothingTagsCatalog,
    ...nsfwClothingTagsCatalog,
  ]);
  const suggestiveBodySet = buildTagSet(suggestiveBodyTagsCatalog);
  const nsfwBodySet = buildTagSet(nsfwBodyTagsCatalog);
  const nsfwPositionSet = buildTagSet(nsfwPositionTagsCatalog);
  const nsfwPropsSet = buildTagSet(nsfwPropsTagsCatalog);
  const nsfwInteractionSet = buildTagSet(nsfwInteractionTagsCatalog);
  const speciesTagSet = buildTagSet(speciesTagsCatalog);
  const animalsTagSet = buildTagSet(animalsTagsCatalog);
  const propsRouteTagSet = buildTagSet([
    ...propsTagsCatalog,
    ...vehiclesTagsCatalog,
  ]);
  const routingCategoryTagSets = {
    body_parts: buildTagSet([
      ...bodyPartsTagsCatalog,
      ...suggestiveBodyTagsCatalog,
      ...nsfwBodyTagsCatalog,
      ...nsfwPositionOnlyTagsCatalog,
    ]),
    traits: buildTagSet(traitExtraTagsCatalog),
    face: buildTagSet(faceTagsCatalog),
    hair: buildTagSet([
      ...hairTagsCatalog,
      ...hairColorTagsCatalog,
    ]),
    clothing: buildTagSet(clothingTagsCatalog),
    accessories: buildTagSet(wearablePropsTagsCatalog),
    species: buildTagSet([...characterTagsCatalog, ...speciesTagsCatalog]),
    mood: buildTagSet(moodStateTagsCatalog),
    nsfw_mood: buildTagSet(nsfwMoodTagsCatalog),
    expression: buildTagSet(expressionTagsCatalog),
    suggestive_body_parts: buildTagSet(suggestiveBodyTagsCatalog),
    nsfw_body_parts: buildTagSet(nsfwBodyTagsCatalog),
    suggestive_clothing: buildTagSet(suggestiveClothingTagsCatalog),
    nsfw_clothing: buildTagSet(nsfwClothingTagsCatalog),
    action: buildTagSet(actionsTags),
    poses: buildTagSet(poseTagsCatalog),
    suggestive_action: buildTagSet(suggestiveActionTagsCatalog),
    suggestive_pose: buildTagSet(suggestivePoseTagsCatalog),
    nsfw_action: buildTagSet(nsfwActionTagsCatalog),
    nsfw_pose: buildTagSet(nsfwPoseTagsCatalog),
    interaction: buildTagSet(interactionTagsCatalog),
    suggestive_interaction: buildTagSet(suggestiveInteractionTagsCatalog),
    nsfw_interaction: buildTagSet(nsfwInteractionTagsCatalog),
    nsfw_position: buildTagSet(nsfwPositionOnlyTagsCatalog),
    environment: buildTagSet(environmentTagsCatalog),
    scenario: buildTagSet(sceneTagsCatalog),
    lighting: buildTagSet(lightingUiTagsCatalog),
    camera: buildTagSet(cameraUiTagsCatalog),
    composition: buildTagSet(compositionTagsCatalog),
    time_of_day: buildTagSet(timeOfDayTagsCatalog),
    vehicles: buildTagSet(vehiclesTagsCatalog),
    animals: buildTagSet(animalsTagsCatalog),
    props: buildTagSet([...propsTagsCatalog, ...animalsTagsCatalog, ...vehiclesTagsCatalog]),
    fluids: buildTagSet(fluidsTagsCatalog),
    nsfw_fluids: buildTagSet(nsfwFluidsTagsCatalog),
    nsfw_camera: buildTagSet(nsfwCameraTagsCatalog),
    nsfw_props: buildTagSet(nsfwPropsTagsCatalog),
    exposure: buildTagSet(exposureTagsCatalog),
    character_count: buildTagSet(characterCountTagsCatalog),
    aesthetics: buildTagSet(aestheticsTagsCatalog),
    meta_quality: buildTagSet(metaQualityTagsCatalog),
    meta_theme: buildTagSet(metaThemeTagsCatalog),
    meta_time: buildTagSet(metaTimeTagsCatalog),
    meta_world: buildTagSet(metaWorldTagsCatalog),
    meta_content: buildTagSet(metaContentTagsCatalog),
  };
  const blockCategorySets = {
    categoryTagSets: routingCategoryTagSets,
    categoryToBlock: ROUTING_CATEGORY_TO_BLOCK,
    categoryPriority: ROUTING_CATEGORY_PRIORITY,
    environment: buildTagSet([...environmentTagsCatalog, ...sceneTagsCatalog, ...timeOfDayTagsCatalog]),
    camera: buildTagSet(cameraTagsCatalogAll),
    lighting: buildTagSet(lightingUiTagsCatalog),
    composition: buildTagSet(compositionTagsCatalog),
    clothing: buildTagSet(clothingTagsCatalogAll),
    action: buildTagSet([...actionTagsCatalog, ...poseTagsCatalogAll]),
    interaction: buildTagSet(interactionTagsCatalogAll),
    character: buildTagSet([
      ...characterTagsCatalog,
      ...speciesTagsCatalog,
      ...animalsTagsCatalog,
      ...traitExtraTagsCatalog,
      ...faceTagsCatalog,
      ...hairTagsCatalog,
      ...clothingTagsCatalogAll,
      ...wearablePropsTagsCatalog,
      ...moodStateTagsCatalogAll,
      ...expressionTagsCatalog,
      ...bodyPartsTagsCatalog,
      ...suggestiveBodyTagsCatalog,
      ...nsfwBodyTagsCatalog,
      ...nsfwClothingTagsCatalog,
      ...nsfwPositionOnlyTagsCatalog,
    ]),
    props: buildTagSet([
      ...propsTagsCatalog,
      ...vehiclesTagsCatalog,
      ...nsfwPropsTagsCatalog,
    ]),
  };
  const wearablePropSet = buildTagSet(wearablePropsTagsCatalog);
  const strictGlobalPropTagSet = buildTagSet([
    ...propsTagsCatalog,
    ...vehiclesTagsCatalog,
    ...environmentTagsCatalog,
    ...sceneTagsCatalog,
    "bench",
    "chair",
    "park_bench",
    "beach_chair",
  ]);
  const environmentLightingTagSet = buildTagSet([
    ...environmentTagsCatalog,
    ...lightingUiTagsCatalog,
    ...cameraTagsCatalogAll,
  ]);
  const globalOnlyCharTraitTagSet = buildTagSet([
    ...environmentTagsCatalog,
    ...lightingUiTagsCatalog,
    ...sceneTagsCatalog,
    ...cameraTagsCatalogAll,
    ...compositionTagsCatalog,
  ]);
  const globalOnlyPhraseTokenSet = new Set();
  const addGlobalOnlyPhraseTokens = (entries) => {
    for (const entry of entries || []) {
      const phraseNorm = String(entry?.phraseNorm || "");
      if (!phraseNorm) continue;
      const tokens = phraseNorm.split(" ").filter(Boolean);
      if (tokens.length < 2) continue;
      const tail = tokens[tokens.length - 1];
      if (tail) globalOnlyPhraseTokenSet.add(tail);
    }
  };
  const addGlobalOnlyTagTokens = (tags) => {
    for (const rawTag of tags || []) {
      const normalized = normalizePhrase(String(rawTag || ""));
      if (!normalized) continue;
      const tokens = normalized.split(" ").filter(Boolean);
      if (tokens.length < 2) continue;
      const tail = tokens[tokens.length - 1];
      if (tail) globalOnlyPhraseTokenSet.add(tail);
    }
  };
  addGlobalOnlyTagTokens(environmentTagsCatalog);
  addGlobalOnlyTagTokens(sceneTagsCatalog);
  addGlobalOnlyTagTokens(compositionTagsCatalog);
  addGlobalOnlyTagTokens(cameraTagsCatalogAll);
  addGlobalOnlyTagTokens(lightingUiTagsCatalog);
  const clothingTagSet = buildTagSet(clothingTagsCatalogAll);
  const nonTraitTagSet = new Set(
    [
      ...actionTagsCatalog,
      ...poseTagsCatalogAll,
      ...environmentTagsCatalog,
      ...cameraTagsCatalogAll,
      ...lightingUiTagsCatalog,
      ...moodStateTagsCatalogAll,
      ...expressionTagsCatalog,
      ...propsTagsCatalog,
      ...animalsTagsCatalog,
      ...vehiclesTagsCatalog,
      ...wearablePropsTagsCatalog,
      ...clothingTagsCatalogAll,
      ...compositionTagsCatalog,
      ...sceneTagsCatalog,
      ...interactionTagsCatalogAll,
      ...suggestiveBodyTagsCatalog,
      ...suggestiveActionTagsCatalog,
      ...suggestivePoseTagsCatalog,
      ...suggestiveInteractionTagsCatalog,
      ...nsfwPositionTagsCatalog,
      ...nsfwPoseTagsCatalog,
      ...nsfwMoodTagsCatalog,
      ...nsfwCameraTagsCatalog,
      ...nsfwPropsTagsCatalog,
      ...nsfwInteractionTagsCatalog,
      ...fluidsTagsCatalog,
      ...exposureTagsCatalog,
      ...characterCountTagsCatalog,
      ...metaTimeTagsCatalog,
      ...metaWorldTagsCatalog,
      "sidewalk",
    ]
      .map((tag) => String(tag || "").toLowerCase())
      .filter(Boolean)
  );
  const suggestiveAllTagList = dedupePreserveOrder([
    ...suggestiveBodyTagsCatalog,
    ...suggestiveActionTagsCatalog,
    ...suggestiveClothingTagsCatalog,
    ...suggestiveInteractionTagsCatalog,
    ...suggestivePoseTagsCatalog,
  ]);
  const nsfwAllTagList = dedupePreserveOrder([
    ...nsfwBodyTagsCatalog,
    ...nsfwPositionTagsCatalog,
    ...nsfwPropsTagsCatalog,
    ...nsfwInteractionTagsCatalog,
    ...nsfwPoseTagsCatalog,
    ...nsfwMoodTagsCatalog,
    ...nsfwCameraTagsCatalog,
  ]);
  const nsfwFluidsTagSet = buildTagSet(nsfwFluidsTagsCatalog);
  const nsfwBlockedSensitiveTagList = nsfwInteractionTagsCatalog.filter((tag) => {
    const lowerTag = String(tag || "").toLowerCase();
    if (!lowerTag) return false;
    if (nsfwPositionSet.has(lowerTag)) return false;
    if (nsfwPropsSet.has(lowerTag)) return false;
    if (nsfwFluidsTagSet.has(lowerTag)) return false;
    if (lowerTag === "cum" || lowerTag.includes("cum")) return false;
    return true;
  });
  const safeBlockedSensitiveTagSet = buildTagSet([
    ...suggestiveAllTagList,
    ...nsfwAllTagList,
    "panties_aside",
  ]);
  const suggestiveBlockedSensitiveTagSet = buildTagSet([
    ...nsfwAllTagList,
    "panties_aside",
  ]);
  const nsfwBlockedSensitiveTagSet = buildTagSet(nsfwBlockedSensitiveTagList);

  const presetById = new Map(presets.map((item) => [item.id, item]));
  const modifierById = new Map(modifiers.map((item) => [item.id, item]));
  const presetStyleCompatibilityById = buildPresetStyleCompatibilityMap(modifiers);

  setOptions($("cameraFraming"), cameraData.framing, "Framing");
  setOptions($("cameraAngle"), cameraData.angle, "Angle");
  setCheckboxList($("compositionToggles"), cameraData.composition_toggles);
  setOptions($("lighting"), lightingData.lighting, "Lighting");
  setOptions($("timeOfDay"), lightingData.time_of_day, "Time of day (optional)");

  setOptions($("presetPicker"), presets, "Preset");
  setCheckboxList($("styleModifiers"), modifiers);

  if (presetById.has("pony_default")) {
    $("presetPicker").value = "pony_default";
  }
  const applyCurrentStyleModifierCompatibility = ({
    clearIncompatibleSelection = true,
  } = {}) =>
    applyStyleModifierCompatibilityForPreset(
      $("styleModifiers"),
      String($("presetPicker")?.value || ""),
      presetStyleCompatibilityById,
      { clearIncompatibleSelection }
    );
  applyCurrentStyleModifierCompatibility({ clearIncompatibleSelection: true });

  const hasSelectedRating =
    $("ratingSfw")?.checked ||
    $("ratingSuggestive")?.checked ||
    $("ratingNsfw")?.checked ||
    $("ratingExplicit")?.checked;
  if (!hasSelectedRating) {
    $("ratingSfw").checked = true;
  }
  if ($("rawHelperToggle")) {
    $("rawHelperToggle").checked = RAW_HELPER_DEFAULT_ENABLED;
  }

  let positiveLockedByUser = false;
  let negativeLockedByUser = false;
  let copyStatusTimer = null;
  let selectedCharacterPhrases = [];
  let recomputeForSessionResetDebounced = null;

  function showCopyStatus(message, clearAfterMs = 0) {
    setCopyStatus(message);
    if (copyStatusTimer) {
      clearTimeout(copyStatusTimer);
      copyStatusTimer = null;
    }
    if (clearAfterMs > 0) {
      copyStatusTimer = setTimeout(() => {
        setCopyStatus("");
        copyStatusTimer = null;
      }, clearAfterMs);
    }
  }

  const completedBackgroundPrepTaskIds = new Set();
  let backgroundPrepHandle = null;
  let backgroundPrepStarted = false;
  let pendingCriticalPrepRecompute = false;
  let pendingCriticalPrepResetLocks = false;

  const warmLazyGetter = (getter) => {
    if (typeof getter !== "function") return;
    if (typeof getter.isPrepared === "function" && getter.isPrepared()) return;
    getter();
  };

  const backgroundPrepTasksByStage = {
    high: [
      { id: "traits", run: () => warmLazyGetter(getTraitExtraPrepared) },
      { id: "hair", run: () => warmLazyGetter(getHairColorPrepared) },
      { id: "clothing", run: () => warmLazyGetter(getClothingPrepared) },
      { id: "accessories", run: () => warmLazyGetter(getWearablePropsPrepared) },
      { id: "action", run: () => warmLazyGetter(getActionsPrepared) },
      { id: "poses", run: () => warmLazyGetter(getPosesPrepared) },
      { id: "interaction", run: () => warmLazyGetter(getInteractionsPrepared) },
      { id: "environment", run: () => warmLazyGetter(getEnvironmentsPrepared) },
      { id: "props", run: () => warmLazyGetter(getPropsPrepared) },
      { id: "expression", run: () => warmLazyGetter(getExpressionsPrepared) },
      { id: "face", run: () => warmLazyGetter(getFacePrepared) },
      { id: "body_parts", run: () => warmLazyGetter(getBodyPartsPrepared) },
      { id: "characters", run: () => warmLazyGetter(getCharactersPrepared) },
      { id: "clothing_colors", run: () => warmLazyGetter(getColorsPrepared) },
      { id: "clothing_bindings", run: () => warmLazyGetter(getClothingByFirstToken) },
      { id: "pose_mask_sfw", run: () => warmLazyGetter(getPoseMaskPreparedSfw) },
      { id: "matcher_sources", run: () => warmLazyGetter(getOrderedMatcherSourcePrepared) },
      { id: "matcher_source_data", run: () => warmLazyGetter(getMatcherSourceData) },
      { id: "matcher", run: () => warmLazyGetter(getMatcher) },
    ],
    low: [
      { id: "species", run: () => warmLazyGetter(getSpeciesPrepared) },
      { id: "animals", run: () => warmLazyGetter(getAnimalsPrepared) },
      { id: "vehicles", run: () => warmLazyGetter(getVehiclesPrepared) },
      { id: "fluids", run: () => warmLazyGetter(getFluidsPrepared) },
      { id: "meta_quality", run: () => warmLazyGetter(getMetaQualityPrepared) },
      { id: "meta_theme", run: () => warmLazyGetter(getAliasesPrepared) },
      { id: "meta_time", run: () => warmLazyGetter(getMetaTimePrepared) },
      { id: "meta_world", run: () => warmLazyGetter(getMetaWorldPrepared) },
      { id: "meta_content", run: () => warmLazyGetter(getColorsPrepared) },
      { id: "scenes", run: () => warmLazyGetter(getScenesPrepared) },
      { id: "mood_states", run: () => warmLazyGetter(getMoodStatesPrepared) },
      { id: "compositions", run: () => warmLazyGetter(getCompositionsPrepared) },
      { id: "aesthetics_global", run: () => warmLazyGetter(getAestheticsGlobalPrepared) },
      { id: "subject_entities", run: () => warmLazyGetter(getSubjectEntityPrepared) },
    ],
    suggestive: [
      { id: "suggestive_body", run: () => warmLazyGetter(getSuggestiveBodyPrepared) },
      { id: "suggestive_action", run: () => warmLazyGetter(getSuggestiveActionPrepared) },
      { id: "suggestive_clothing", run: () => warmLazyGetter(getSuggestiveClothingPrepared) },
      {
        id: "suggestive_interaction",
        run: () => warmLazyGetter(getSuggestiveInteractionPrepared),
      },
      { id: "suggestive_pose", run: () => warmLazyGetter(getSuggestivePosePrepared) },
      { id: "actions_suggestive", run: () => warmLazyGetter(getActionsPreparedSuggestive) },
      {
        id: "interactions_suggestive",
        run: () => warmLazyGetter(getInteractionsPreparedSuggestive),
      },
      {
        id: "clothing_suggestive",
        run: () => warmLazyGetter(getClothingPreparedSuggestive),
      },
      { id: "poses_suggestive", run: () => warmLazyGetter(getPosesPreparedSuggestive) },
      {
        id: "pose_mask_suggestive",
        run: () => warmLazyGetter(getPoseMaskPreparedSuggestive),
      },
    ],
    nsfw: [
      { id: "nsfw_body", run: () => warmLazyGetter(getNsfwBodyPrepared) },
      { id: "nsfw_camera", run: () => warmLazyGetter(getNsfwCameraPrepared) },
      { id: "nsfw_mood", run: () => warmLazyGetter(getNsfwMoodPrepared) },
      { id: "nsfw_position", run: () => warmLazyGetter(getNsfwPositionPrepared) },
      { id: "nsfw_pose", run: () => warmLazyGetter(getNsfwPosePrepared) },
      { id: "nsfw_interaction", run: () => warmLazyGetter(getNsfwInteractionPrepared) },
      { id: "nsfw_props", run: () => warmLazyGetter(getNsfwPropsPrepared) },
      {
        id: "nsfw_clothing_state",
        run: () => warmLazyGetter(getNsfwClothingStatePrepared),
      },
      { id: "nsfw_fluids", run: () => warmLazyGetter(getNsfwFluidsPrepared) },
      { id: "poses_nsfw", run: () => warmLazyGetter(getPosesPreparedNsfw) },
      { id: "pose_mask_nsfw", run: () => warmLazyGetter(getPoseMaskPreparedNsfw) },
      { id: "mood_states_nsfw", run: () => warmLazyGetter(getMoodStatesPreparedNsfw) },
    ],
  };

  const criticalPrepTaskIdsByRating = Object.freeze({
    sfw: Object.freeze(["matcher_sources", "matcher_source_data", "matcher"]),
    suggestive: Object.freeze(["matcher_sources", "matcher_source_data", "matcher"]),
    nsfw: Object.freeze(["matcher_sources", "matcher_source_data", "matcher"]),
    explicit: Object.freeze(["matcher_sources", "matcher_source_data", "matcher"]),
  });

  function criticalPrepTaskIdsForRating(rating) {
    const key = String(rating || "").toLowerCase();
    return criticalPrepTaskIdsByRating[key] || criticalPrepTaskIdsByRating.sfw;
  }

  function isCriticalPrepReadyForRating(rating) {
    for (const taskId of criticalPrepTaskIdsForRating(rating)) {
      if (!completedBackgroundPrepTaskIds.has(taskId)) {
        return false;
      }
    }
    return true;
  }

  function queueCriticalPrepRecompute({ resetLocks = false } = {}) {
    pendingCriticalPrepRecompute = true;
    if (resetLocks) pendingCriticalPrepResetLocks = true;
    setParserStatus("Initializing parser...");
    scheduleBackgroundPrep();
  }

  function flushDeferredRecomputeIfReady() {
    if (!pendingCriticalPrepRecompute) return;

    const userText = readMainTextareaValue();
    if (!String(userText || "").trim()) {
      const shouldResetLocks = pendingCriticalPrepResetLocks;
      pendingCriticalPrepRecompute = false;
      pendingCriticalPrepResetLocks = false;
      setParserStatus("");
      recompute({ resetLocks: shouldResetLocks, allowCriticalPrepDefer: false });
      return;
    }

    const rating = currentRatingValue();
    if (!isCriticalPrepReadyForRating(rating)) {
      scheduleBackgroundPrep();
      return;
    }

    const shouldResetLocks = pendingCriticalPrepResetLocks;
    pendingCriticalPrepRecompute = false;
    pendingCriticalPrepResetLocks = false;
    setParserStatus("");
    recompute({ resetLocks: shouldResetLocks, allowCriticalPrepDefer: false });
  }

  function currentBackgroundPrepStageOrder() {
    const rating = currentRatingValue();
    if (rating === "nsfw" || rating === "explicit") {
      return ["high", "suggestive", "nsfw", "low"];
    }
    if (rating === "suggestive") {
      return ["high", "suggestive", "low", "nsfw"];
    }
    return ["high", "low", "suggestive", "nsfw"];
  }

  function pickNextBackgroundPrepTask() {
    const stageOrder = currentBackgroundPrepStageOrder();
    for (const stage of stageOrder) {
      const tasks = backgroundPrepTasksByStage[stage] || [];
      for (const task of tasks) {
        if (completedBackgroundPrepTaskIds.has(task.id)) continue;
        return task;
      }
    }
    return null;
  }

  function runBackgroundPrepBatch(deadline) {
    backgroundPrepHandle = null;
    const maxTasksPerBatch = pendingCriticalPrepRecompute ? 1 : BACKGROUND_PREP_TASKS_PER_BATCH;
    let processedCount = 0;
    while (processedCount < maxTasksPerBatch) {
      if (
        processedCount > 0 &&
        deadline &&
        !deadline.didTimeout &&
        typeof deadline.timeRemaining === "function" &&
        deadline.timeRemaining() < BACKGROUND_PREP_MIN_TIME_REMAINING_MS
      ) {
        break;
      }

      const task = pickNextBackgroundPrepTask();
      if (!task) {
        flushDeferredRecomputeIfReady();
        return;
      }
      try {
        task.run();
      } catch (err) {
        console.warn(`[background-prep] Failed '${task.id}'`, err);
      } finally {
        completedBackgroundPrepTaskIds.add(task.id);
      }
      processedCount += 1;
    }

    flushDeferredRecomputeIfReady();
    scheduleBackgroundPrep();
  }

  function scheduleBackgroundPrep() {
    if (backgroundPrepHandle !== null) return;
    const nextTask = pickNextBackgroundPrepTask();
    if (!nextTask) {
      flushDeferredRecomputeIfReady();
      return;
    }
    backgroundPrepHandle = {
      kind: "timeout",
      id: setTimeout(() => {
        runBackgroundPrepBatch({
          didTimeout: true,
          timeRemaining: () => 0,
        });
      }, 0),
    };
  }

  function startBackgroundPrepAfterBoot() {
    if (backgroundPrepStarted) return;
    backgroundPrepStarted = true;
    setTimeout(() => {
      scheduleBackgroundPrep();
    }, 0);
  }

  function computePromptState() {
    const userText = readMainTextareaValue();
    const loraTriggerTags = parseLoraTriggerTokens($("loraTriggers")?.value || "");
    const uiSelection = readUiSelectionState();
    const rating = uiSelection.rating;
    const rawHelperEnabled = uiSelection.rawHelperEnabled;
    const isSuggestiveOrHigher = rating !== "sfw";
    const isNsfwBaseRating = rating === "nsfw" || rating === "explicit";
    const isExplicitRating = rating === "explicit";
    const preset = selectedPreset(presetById, uiSelection.presetId);
    const selectedModifiers = selectedModifierTags(modifierById, uiSelection.styleModifierIds);
    let blockedSensitiveTagSet = new Set();
    if (rating === "sfw") {
      blockedSensitiveTagSet = safeBlockedSensitiveTagSet;
    } else if (rating === "suggestive") {
      blockedSensitiveTagSet = suggestiveBlockedSensitiveTagSet;
    } else if (rating === "nsfw") {
      blockedSensitiveTagSet = nsfwBlockedSensitiveTagSet;
    }
    if (!String(userText || "").trim()) {
      const rawHelperBlock = rawHelperEnabled ? buildRawHelperBlock(userText) : "";
      const positive = assemblePositivePrompt({
        rating,
        presetPositiveTags: preset.positive_tags,
        modifierPositiveTags: selectedModifiers.positive,
        loraTriggerTags,
        groupOrGenderTag: "",
        traitBlocks: [],
        poseBlocks: [],
        actionBlocks: [],
        poseTags: [],
        environmentTags: [],
        propsTags: [],
        expressionsTags: [],
        moodStateTags: [],
        nsfwPositionTags: [],
        interactionTags: [],
        nsfwInteractionTags: [],
        sceneTags: [],
        globalTags: [],
        compositionTextTags: [],
        cameraLightingTags: [],
        rawHelperBlock,
      });
      return {
        userText,
        rating,
        preset,
        selectedModifiers,
        positive,
      };
    }
    const activeInteractionsPrepared = isSuggestiveOrHigher
      ? getInteractionsPreparedSuggestive()
      : getInteractionsPrepared();
    const activeActionsPrepared = isSuggestiveOrHigher
      ? getActionsPreparedSuggestive()
      : getActionsPrepared();
    const activeClothingPrepared = isSuggestiveOrHigher
      ? getClothingPreparedSuggestive()
      : getClothingPrepared();
    const activePosesPrepared = isNsfwBaseRating
      ? getPosesPreparedNsfw()
      : isSuggestiveOrHigher
      ? getPosesPreparedSuggestive()
      : getPosesPrepared();
    const activePoseMaskPrepared = isNsfwBaseRating
      ? getPoseMaskPreparedNsfw()
      : isSuggestiveOrHigher
      ? getPoseMaskPreparedSuggestive()
      : getPoseMaskPreparedSfw();
    const activeMoodStatesPrepared = isNsfwBaseRating
      ? getMoodStatesPreparedNsfw()
      : getMoodStatesPrepared();

    const makeRoutingBuckets = () => ({
      character: [],
      actions: [],
      interaction: [],
      environment: [],
      props: [],
      composition: [],
      cameraLighting: [],
      global: [],
    });
    const validateTagsForOutputBlock = (tags, blockType, routedBuckets) => {
      const kept = [];
      for (const tag of dedupePreserveOrder(tags || [])) {
        if (validateTagForBlock(tag, blockType, blockCategorySets)) {
          kept.push(tag);
          continue;
        }
        const targetBlock = inferTagRouteBlock(tag, blockCategorySets);
        if (
          targetBlock === "character" ||
          targetBlock === "actions" ||
          targetBlock === "interaction" ||
          targetBlock === "environment" ||
          targetBlock === "props" ||
          targetBlock === "composition" ||
          targetBlock === "cameraLighting"
        ) {
          routedBuckets[targetBlock].push(tag);
        } else {
          routedBuckets.global.push(tag);
        }
      }
      return dedupePreserveOrder(kept);
    };

    const reroutedEnvironmentTags = [];
    const reroutedPropsTags = [];
    const reroutedCompositionTextTags = [];
    const reroutedCameraLightingTags = [];
    const reroutedInteractionTags = [];
    const reroutedNsfwInteractionTags = [];
    const reroutedNsfwPositionTags = [];
    const reroutedGlobalTags = [];

    // 1-3) Normalize full text, extract interactions, map spans back to raw, and mask.
    const normalizedForMatching = normalizeForMatchingWithMap(userText);
    const interactionResult = extractInteractionTagsWithSpans(
      normalizedForMatching.normalized,
      activeInteractionsPrepared
    );

    const interactionRawRanges = spansToRawRanges(
      interactionResult.spans,
      normalizedForMatching.normToRaw
    );
    const maskedRawText = maskRawTextByRanges(userText, interactionRawRanges);
    const maskTextForSplit = normalizeForSplit(maskedRawText);
    const matcher = getMatcher();
    const matcherTagsFromFullText = extractMatcherTags(matcher, userText);
    const subjectHintsFromFullText = inferEntitySubjectHintsFromText(userText, {
      matcherTags: matcherTagsFromFullText,
      subjectEntityPrepared: getSubjectEntityPrepared(),
      speciesTagSet,
      animalsTagSet,
    });
    const suppressKnightChessTag = shouldSuppressKnightChessTagInRidingContext(userText);

    // 4) Determine entity count and build segments before trait extraction.
    const segmentationPlan = buildEntitySegmentationPlan({
      userText,
      maskTextForSplit,
      charactersPrepared: getCharactersPrepared(),
      knownFemaleCharacterTagSet,
      matcherTagsFromFullText,
      subjectEntityPrepared: getSubjectEntityPrepared(),
      speciesTagSet,
      animalsTagSet,
    });
    const explicitPeopleCountTags = inferPeopleCountTagsFromText(userText);
    const hasKnownCharacterHint =
      extractTagsFromPhraseEntries(userText, getCharactersPrepared()).length > 0;
    const hasExplicitHumanEntityHint =
      hasExplicitHumanEntityTerms(userText) ||
      subjectHintsFromFullText.hasHumanCue ||
      explicitPeopleCountTags.length > 0 ||
      hasKnownCharacterHint;
    const hasNonHumanPrimaryHint = subjectHintsFromFullText.hasNonHumanCue;
    const nonHumanPrimaryFallbackTag = String(
      subjectHintsFromFullText.primaryNonHumanTag || ""
    ).toLowerCase();
    const suppressHumanEntityDefaults =
      hasNonHumanPrimaryHint && !hasExplicitHumanEntityHint;
    const multiEntityMode = segmentationPlan.multiEntityMode;
    const segments = segmentationPlan.segments;

    const compositionTextTags = extractTagsFromPhraseEntries(
      userText,
      getCompositionsPrepared()
    ).filter((tag) => {
      const lower = String(tag).toLowerCase();
      if (blockedSensitiveTagSet.has(lower)) return false;
      if (nsfwPositionSet.has(lower)) return false;
      if (nsfwInteractionSet.has(lower)) return false;
      return true;
    });
    const compositionTextTagSet = buildTagSet(compositionTextTags);

    const directExpressionsTags = extractTagsFromPhraseEntries(userText, getExpressionsPrepared());
    const expressionsTags = dedupePreserveOrder([
      ...directExpressionsTags,
      ...resolveExpressionFallbackTagsFromText(
        userText,
        directExpressionsTags,
        expressionTagsCatalogSet
      ),
    ]).filter((tag) => {
      const lower = String(tag).toLowerCase();
      if (blockedSensitiveTagSet.has(lower)) return false;
      if (nsfwPositionSet.has(lower)) return false;
      if (nsfwInteractionSet.has(lower)) return false;
      return true;
    });
    const expressionsTagSet = buildTagSet(expressionsTags);

    const moodStateTags = extractTagsFromPhraseEntries(userText, activeMoodStatesPrepared).filter(
      (tag) => {
        const lower = String(tag).toLowerCase();
        if (blockedSensitiveTagSet.has(lower)) return false;
        if (nsfwPositionSet.has(lower)) return false;
        if (nsfwInteractionSet.has(lower)) return false;
        if (expressionsTagSet.has(lower)) return false;
        if (actionTagsCatalogSet.has(lower)) return false;
        return true;
      }
    );

    const poseTags = dedupePreserveOrder([
      ...extractTagsFromPhraseEntries(userText, activePosesPrepared),
      ...extractTagsFromPhraseEntries(userText, poseFallbackPrepared),
    ]).filter((tag) => {
      const lower = String(tag).toLowerCase();
      if (blockedSensitiveTagSet.has(lower)) return false;
      if (nsfwPositionSet.has(lower)) return false;
      if (nsfwInteractionSet.has(lower)) return false;
      return true;
    });
    const unassignedClausesText = String(segmentationPlan?.unassignedClausesText || "").trim();
    const collectiveGlobalActionLikeTags =
      multiEntityMode && unassignedClausesText
        ? dedupePreserveOrder([
            ...extractTagsFromPhraseEntries(unassignedClausesText, activePoseMaskPrepared).filter((tag) =>
              COLLECTIVE_POSE_ACTION_TAG_ALLOWLIST.has(String(tag || "").toLowerCase()) ||
              actionTagsCatalogSet.has(String(tag || "").toLowerCase())
            ),
            ...extractTagsFromPhraseEntries(unassignedClausesText, activeActionsPrepared),
          ]).filter((tag) => {
            const lower = String(tag || "").toLowerCase();
            if (!lower) return false;
            if (blockedSensitiveTagSet.has(lower)) return false;
            if (nsfwPositionSet.has(lower)) return false;
            if (nsfwInteractionSet.has(lower)) return false;
            return true;
          })
        : [];

    const rawPropsTags = dedupePreserveOrder([
      ...extractTagsFromPhraseEntries(userText, getPropsPrepared()),
      ...matcherTagsFromFullText.filter((tag) =>
        propsRouteTagSet.has(String(tag || "").toLowerCase())
      ),
    ]).filter((tag) => {
      const lower = String(tag).toLowerCase();
      if (suppressKnightChessTag && lower === "knight_(chess)") return false;
      if (blockedSensitiveTagSet.has(lower)) return false;
      if (nsfwPositionSet.has(lower)) return false;
      if (nsfwInteractionSet.has(lower)) return false;
      if (nsfwPropsSet.has(lower)) return false;
      return true;
    });
    const propsTags = dropRedundantAtomicNounsWhenVariantPresent(
      rawPropsTags,
      getPropsPrepared()
    );
    const propsTagSet = buildTagSet(propsTags);
    const suppressedPropsAtomicTags = rawPropsTags.filter((tag) => {
      const lower = String(tag || "").toLowerCase();
      return lower && !propsTagSet.has(lower);
    });

    const traitExtraTags = multiEntityMode
      ? []
      : addTraitAliasHintsFromText(
          extractTagsFromPhraseEntries(userText, getTraitExtraPrepared()).filter((tag) => {
            const lower = String(tag).toLowerCase();
            if (blockedSensitiveTagSet.has(lower) && !isBodySizeTraitTag(lower)) return false;
            if (nsfwPositionSet.has(lower)) return false;
            if (nsfwInteractionSet.has(lower)) return false;
            if (propsTagSet.has(lower)) return false;
            if (compositionTextTagSet.has(lower)) return false;
            return true;
          }),
          userText
        );
    const traitExtraTagSet = buildTagSet(traitExtraTags);
    const clothingGlobalTags = multiEntityMode
      ? []
      : extractTagsFromPhraseEntries(userText, activeClothingPrepared).filter((tag) => {
          const lower = String(tag).toLowerCase();
          if (blockedSensitiveTagSet.has(lower)) return false;
          if (nsfwPositionSet.has(lower)) return false;
          if (nsfwInteractionSet.has(lower)) return false;
          return true;
        });

    const rawEnvironmentTags = dedupePreserveOrder([
      ...extractTagsFromPhraseEntries(userText, getEnvironmentsPrepared()),
      ...extractTagsFromPhraseEntries(userText, environmentFallbackPrepared),
    ]).filter((tag) => {
      const lower = String(tag).toLowerCase();
      if (blockedSensitiveTagSet.has(lower)) return false;
      if (nsfwPositionSet.has(lower)) return false;
      if (nsfwInteractionSet.has(lower)) return false;
      if (propsTagSet.has(lower)) return false;
      if (compositionTextTagSet.has(lower)) return false;
      if (traitExtraTagSet.has(lower)) return false;
      return true;
    });
    const environmentTags = dropRedundantEnvironmentTags(
      dropRedundantAtomicNounsWhenVariantPresent(
        rawEnvironmentTags,
        getEnvironmentsPrepared()
      )
    );
    const environmentTagSet = buildTagSet(environmentTags);
    const suppressedEnvironmentAtomicTags = rawEnvironmentTags.filter((tag) => {
      const lower = String(tag || "").toLowerCase();
      return lower && !environmentTagSet.has(lower);
    });
    const newGlobalTagSet = buildTagSet([
      ...compositionTextTags,
      ...poseTags,
      ...environmentTags,
      ...propsTags,
      ...expressionsTags,
      ...moodStateTags,
      ...traitExtraTags,
      ...clothingGlobalTags,
    ]);

    const interactionTags = dedupePreserveOrder(
      interactionResult.interactionTags.filter((tag) => {
        const lower = String(tag).toLowerCase();
        if (blockedSensitiveTagSet.has(lower)) return false;
        return true;
      })
    );
    const interactionTagSet = buildTagSet(interactionTags);

    const rawSceneTags = extractTagsFromPhraseEntries(userText, getScenesPrepared()).filter((tag) => {
      const lower = String(tag).toLowerCase();
      if (blockedSensitiveTagSet.has(lower)) return false;
      return true;
    });
    const sceneTags = dropRedundantAtomicNounsWhenVariantPresent(
      rawSceneTags,
      getScenesPrepared()
    );
    const sceneTagSet = buildTagSet(sceneTags);
    const suppressedSceneAtomicTags = rawSceneTags.filter((tag) => {
      const lower = String(tag || "").toLowerCase();
      return lower && !sceneTagSet.has(lower);
    });
    const nsfwPositionTags = !multiEntityMode && isNsfwBaseRating
      ? extractTagsFromPhraseEntries(userText, getNsfwPositionPrepared())
      : [];
    const nsfwClothingStateTags = !multiEntityMode && isNsfwBaseRating
      ? extractTagsFromPhraseEntries(userText, getNsfwClothingStatePrepared())
      : [];
    const nsfwFluidsTags = !multiEntityMode && isNsfwBaseRating
      ? extractTagsFromPhraseEntries(userText, getNsfwFluidsPrepared())
      : [];
    const nsfwPropsTags = !multiEntityMode && isNsfwBaseRating
      ? extractTagsFromPhraseEntries(userText, getNsfwPropsPrepared())
      : [];
    const nsfwCameraTags = !multiEntityMode && isNsfwBaseRating
      ? extractTagsFromPhraseEntries(userText, getNsfwCameraPrepared())
      : [];
    const nsfwPositionLikeTags = dedupePreserveOrder([
      ...nsfwPositionTags,
      ...nsfwClothingStateTags,
      ...nsfwFluidsTags,
      ...nsfwPropsTags,
    ]);
    const nsfwInteractionTags = !multiEntityMode && isExplicitRating
      ? extractTagsFromPhraseEntries(userText, getNsfwInteractionPrepared())
      : [];
    const suggestiveBodyTags = !multiEntityMode && isSuggestiveOrHigher
      ? extractTagsFromPhraseEntries(userText, getSuggestiveBodyPrepared())
      : [];
    const suggestiveBodyTagSet = buildTagSet(suggestiveBodyTags);
    const nsfwPositionTagSet = buildTagSet(nsfwPositionLikeTags);
    const nsfwInteractionTagSet = buildTagSet(nsfwInteractionTags);
    const actionTagSet = buildTagSet(activeActionsPrepared.map((entry) => entry.tag));

    const globalTagsAll = multiEntityMode
      ? []
      : extractTagsBySourcePrecedence({
          matcher,
          text: userText,
          preparedAliases: getAliasesPrepared(),
          sourcePreparedEntries: getOrderedMatcherSourcePrepared(),
        }).filter((tag) => {
          const lower = String(tag).toLowerCase();
          if (blockedSensitiveTagSet.has(lower) && !isBodySizeTraitTag(lower)) return false;
          if (clothingTagSet.has(lower)) return false;
          if (newGlobalTagSet.has(lower)) return false;
          return true;
        });

    // 5-6) Per-character actions/poses (with masking) and per-character traits.
    const traitBlocks = [];
    const poseBlocks = [];
    const actionBlocks = [];
    const traitUnion = [];
    const poseUnion = [];
    const actionUnion = [];
    const suggestiveBodyUnion = [];
    const nsfwBodyUnion = [];
    const segmentSubjectKinds = (segments || []).map((segment) => {
      const explicitKind = normalizeSubjectKind(segment?.subjectKind);
      if (explicitKind) return explicitKind;
      const subjectTag = String(segment?.subjectTag || "").toLowerCase().trim();
      if (subjectTag && (speciesTagSet.has(subjectTag) || animalsTagSet.has(subjectTag))) {
        return "nonhuman";
      }
      const fallback = String(segment?.fallbackEntityTag || "").toLowerCase().trim();
      if (fallback && (speciesTagSet.has(fallback) || animalsTagSet.has(fallback))) {
        return "nonhuman";
      }
      const gender =
        normalizeEntityGenderHint(segment?.slotGender) ||
        normalizeEntityGenderHint(segment?.anchorTag) ||
        normalizeEntityGenderHint(segment?.fallbackEntityTag);
      if (gender) return "human";
      return "";
    });
    const hasAnyNonHumanSegment = segmentSubjectKinds.some((kind) => kind === "nonhuman");
    const nonHumanPoseTransfersByTargetIndex = new Map();
    const nonHumanPoseRemovalsBySourceIndex = new Map();
    const nonHumanActionTransfersByTargetIndex = new Map();
    const nonHumanActionRemovalsBySourceIndex = new Map();
    const resolveSegmentNonHumanTag = (segment) => {
      const explicit = String(segment?.subjectTag || "").toLowerCase().trim();
      if (explicit && (speciesTagSet.has(explicit) || animalsTagSet.has(explicit))) return explicit;
      const fallback = String(segment?.fallbackEntityTag || "").toLowerCase().trim();
      if (fallback && (speciesTagSet.has(fallback) || animalsTagSet.has(fallback))) return fallback;
      return "";
    };
    const isHumanAnchoredSegment = (segment) =>
      Boolean(
        normalizeEntityGenderHint(segment?.slotGender) ||
          normalizeEntityGenderHint(segment?.anchorTag) ||
          normalizeSubjectKind(segment?.subjectKind) === "human"
      );
    const findTargetNonHumanSegmentIndex = (subjectTag) => {
      const wanted = String(subjectTag || "").toLowerCase().trim();
      if (!wanted) return -1;
      const exactNonHuman = (segments || []).findIndex((segment) => {
        const segTag = resolveSegmentNonHumanTag(segment);
        if (segTag !== wanted) return false;
        return normalizeSubjectKind(segment?.subjectKind) === "nonhuman";
      });
      if (exactNonHuman >= 0) return exactNonHuman;
      const exactNonHumanLike = (segments || []).findIndex((segment) => {
        const segTag = resolveSegmentNonHumanTag(segment);
        if (segTag !== wanted) return false;
        return !isHumanAnchoredSegment(segment);
      });
      if (exactNonHumanLike >= 0) return exactNonHumanLike;
      return (segments || []).findIndex(
        (segment) => normalizeSubjectKind(segment?.subjectKind) === "nonhuman"
      );
    };
    for (let idx = 0; idx < segments.length; idx += 1) {
      const segmentTextRaw = String(segments[idx]?.text || "");
      const bindings = extractNonHumanStatePoseBindingsFromText(segmentTextRaw);
      for (const binding of bindings) {
        const subjectTag = String(binding?.subjectTag || "").toLowerCase().trim();
        const poseTag = String(binding?.poseTag || "").toLowerCase().trim();
        if (!subjectTag || !poseTag) continue;
        const targetIdx = findTargetNonHumanSegmentIndex(subjectTag);
        if (targetIdx < 0 || targetIdx === idx) continue;
        nonHumanPoseTransfersByTargetIndex.set(
          targetIdx,
          dedupePreserveOrder([
            ...(nonHumanPoseTransfersByTargetIndex.get(targetIdx) || []),
            poseTag,
          ])
        );
        nonHumanPoseRemovalsBySourceIndex.set(
          idx,
          dedupePreserveOrder([
            ...(nonHumanPoseRemovalsBySourceIndex.get(idx) || []),
            poseTag,
          ])
        );
      }
      const actionBindings = extractNonHumanStateActionBindingsFromText(segmentTextRaw);
      for (const binding of actionBindings) {
        const subjectTag = String(binding?.subjectTag || "").toLowerCase().trim();
        const actionTag = String(binding?.actionTag || "").toLowerCase().trim();
        if (!subjectTag || !actionTag) continue;
        const targetIdx = findTargetNonHumanSegmentIndex(subjectTag);
        if (targetIdx < 0 || targetIdx === idx) continue;
        nonHumanActionTransfersByTargetIndex.set(
          targetIdx,
          dedupePreserveOrder([
            ...(nonHumanActionTransfersByTargetIndex.get(targetIdx) || []),
            actionTag,
          ])
        );
        nonHumanActionRemovalsBySourceIndex.set(
          idx,
          dedupePreserveOrder([
            ...(nonHumanActionRemovalsBySourceIndex.get(idx) || []),
            actionTag,
          ])
        );
      }
    }

    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
      const segment = segments[segmentIndex];
      const segmentTextRaw = String(segment.text || "");
      const segmentCharacterTag = String(segment.characterTag || "").trim();
      const segmentAnchorTag = String(segment.anchorTag || "")
        .trim()
        .toLowerCase();
      const segmentFallbackEntityTag = String(segment.fallbackEntityTag || "")
        .trim()
        .toLowerCase();
      const segmentExplicitSubjectTag = String(segment.subjectTag || "")
        .trim()
        .toLowerCase();
      const segmentSubjectKindFromPlan = normalizeSubjectKind(segment.subjectKind);
      const effectiveSegmentAnchorTag = suppressHumanEntityDefaults ? "" : segmentAnchorTag;
      const effectiveSegmentFallbackEntityTag = suppressHumanEntityDefaults
        ? String(nonHumanPrimaryFallbackTag || "").toLowerCase()
        : segmentFallbackEntityTag;
      const fallbackLooksNonHuman =
        Boolean(effectiveSegmentFallbackEntityTag) &&
        (speciesTagSet.has(effectiveSegmentFallbackEntityTag) ||
          animalsTagSet.has(effectiveSegmentFallbackEntityTag));
      const hasHumanSlotAnchor = Boolean(
        normalizeEntityGenderHint(segment?.slotGender) ||
          normalizeEntityGenderHint(segment?.anchorTag)
      );
      const fallbackForcedSubjectTag =
        fallbackLooksNonHuman &&
        segmentSubjectKindFromPlan !== "human" &&
        !hasHumanSlotAnchor
          ? effectiveSegmentFallbackEntityTag
          : "";
      const forcedSubjectTag = String(
        segmentExplicitSubjectTag || fallbackForcedSubjectTag
      )
        .toLowerCase()
        .trim();
      const segmentSubjectKind =
        segmentSubjectKindFromPlan ||
        (forcedSubjectTag ? "nonhuman" : normalizeEntityGenderHint(segmentFallbackEntityTag) ? "human" : "");
      const shouldSuppressAnimalBodyPartLeakage =
        hasAnyNonHumanSegment && segmentSubjectKind === "human";
      const transferredPoseTagsForSegment = dedupePreserveOrder(
        nonHumanPoseTransfersByTargetIndex.get(segmentIndex) || []
      );
      const transferredActionTagsForSegment = dedupePreserveOrder(
        nonHumanActionTransfersByTargetIndex.get(segmentIndex) || []
      );
      const removedPoseTagSetForSegment = buildTagSet(
        nonHumanPoseRemovalsBySourceIndex.get(segmentIndex) || []
      );
      const removedActionTagSetForSegment = buildTagSet(
        nonHumanActionRemovalsBySourceIndex.get(segmentIndex) || []
      );
      const ambientActionTagSetForSegment = buildTagSet(
        extractAmbientActionSuppressionTagsFromText(segmentTextRaw)
      );
      const segmentTextBase = segmentCharacterTag
        ? stripKnownCharacterMentionsExceptTag(
            segmentTextRaw,
            getCharactersPrepared(),
            segmentCharacterTag
          )
        : segmentTextRaw;
      const segmentText = normalizeHairAdjectiveAliases(segmentTextBase);
      const segmentNormalized = normalizeForMatchingWithMap(segmentText);
      const poseResult = extractTagsWithSpans(
        segmentNormalized.normalized,
        activePoseMaskPrepared
      );
      const poseRawRanges = spansToRawRanges(poseResult.spans, segmentNormalized.normToRaw);
      const poseMaskedText = maskRawTextByRanges(segmentText, poseRawRanges);

      const actionNormalized = normalizeForMatchingWithMap(poseMaskedText);
      const actionResult = extractTagsWithSpans(
        actionNormalized.normalized,
        activeActionsPrepared
      );
      const actionRawRanges = spansToRawRanges(actionResult.spans, actionNormalized.normToRaw);
      const actionMaskedText = maskRawTextByRanges(poseMaskedText, actionRawRanges);

      const hairOverlapResult = extractHairLengthAndColorOverlap(
        actionMaskedText,
        getHairColorPrepared()
      );
      const hairMaskedText = maskRawTextByRanges(actionMaskedText, hairOverlapResult.ranges);

      const clothingBindingResult = extractClothingColorBindings(
        hairMaskedText,
        getClothingByFirstToken()
      );
      const traitSourceText = maskRawTextByRanges(
        hairMaskedText,
        clothingBindingResult.ranges
      );

      let poseTagsForSegment = (poseResult.tags || []).filter((tag) => {
        const lower = String(tag || "").toLowerCase();
        if (!lower) return false;
        if (blockedSensitiveTagSet.has(lower)) return false;
        if (nsfwPositionSet.has(lower)) return false;
        if (nsfwInteractionSet.has(lower)) return false;
        return true;
      });
      const segmentNsfwInteractionTags = isNsfwBaseRating
        ? extractTagsFromPhraseEntries(segmentText, getNsfwInteractionPrepared())
        : [];
      const segmentActorInteractionActionTags =
        segmentSubjectKind === "nonhuman"
          ? []
          : extractTagsFromPhraseEntries(segmentText, activeInteractionsPrepared).filter((tag) =>
              ACTOR_SIDE_INTERACTION_ACTION_TAG_SET.has(String(tag || "").toLowerCase())
            );
      const segmentNsfwFluidLikeInteractionTags = segmentNsfwInteractionTags.filter((tag) => {
        const lower = String(tag || "").toLowerCase();
        if (!lower) return false;
        if (nsfwPropsSet.has(lower)) return true;
        if (lower === "cum" || lower.includes("cum")) return true;
        return false;
      });
      const segmentNsfwActionLikeInteractionTags = segmentNsfwInteractionTags.filter((tag) => {
        const lower = String(tag || "").toLowerCase();
        if (!lower) return false;
        if (segmentNsfwFluidLikeInteractionTags.some((item) => String(item).toLowerCase() === lower)) {
          return false;
        }
        return true;
      });
      const segmentNsfwCharacterInteractionTags = segmentNsfwActionLikeInteractionTags;
      let actionTags = dedupePreserveOrder([
        ...segmentActorInteractionActionTags,
        ...actionResult.tags,
        ...segmentNsfwActionLikeInteractionTags,
      ]).filter((tag) => {
        const lower = String(tag).toLowerCase();
        if (sceneTagSet.has(lower)) return false;
        if (!multiEntityMode && interactionTagSet.has(lower)) return false;
        if (blockedSensitiveTagSet.has(lower)) return false;
        if (nsfwPositionSet.has(lower)) return false;
        if (nsfwInteractionSet.has(lower)) return false;
        return true;
      });
      if (removedActionTagSetForSegment.size) {
        actionTags = actionTags.filter(
          (tag) => !removedActionTagSetForSegment.has(String(tag || "").toLowerCase())
        );
      }
      if (ambientActionTagSetForSegment.size) {
        actionTags = actionTags.filter(
          (tag) => !ambientActionTagSetForSegment.has(String(tag || "").toLowerCase())
        );
      }
      if (transferredActionTagsForSegment.length) {
        actionTags = dedupePreserveOrder([
          ...transferredActionTagsForSegment,
          ...actionTags,
        ]);
      }
      const poseLikeActionTags = actionTags.filter((tag) =>
        isPerEntityPoseTag(tag)
      );
      if (poseLikeActionTags.length) {
        poseTagsForSegment = dedupePreserveOrder([...poseTagsForSegment, ...poseLikeActionTags]);
        actionTags = actionTags.filter(
          (tag) => !isPerEntityPoseTag(tag)
        );
      }
      if (removedPoseTagSetForSegment.size) {
        poseTagsForSegment = poseTagsForSegment.filter(
          (tag) => !removedPoseTagSetForSegment.has(String(tag || "").toLowerCase())
        );
      }
      if (transferredPoseTagsForSegment.length) {
        poseTagsForSegment = dedupePreserveOrder([
          ...transferredPoseTagsForSegment,
          ...poseTagsForSegment,
        ]);
      }
      if (shouldSuppressAnimalBodyPartLeakage) {
        const nonHumanStateActionTags = extractNonHumanStateActionSuppressionTagsFromText(segmentTextRaw);
        if (nonHumanStateActionTags.length) {
          const nonHumanStateActionTagSet = buildTagSet(nonHumanStateActionTags);
          poseTagsForSegment = poseTagsForSegment.filter(
            (tag) => !nonHumanStateActionTagSet.has(String(tag || "").toLowerCase())
          );
          actionTags = actionTags.filter(
            (tag) => !nonHumanStateActionTagSet.has(String(tag || "").toLowerCase())
          );
        }
      }

      const segmentSubjectEntityTags =
        segmentSubjectKind === "nonhuman"
          ? extractTagsFromPhraseEntries(segmentTextRaw, getSubjectEntityPrepared())
          : [];
      let characterTags = extractTagsFromPhraseEntries(segmentTextRaw, getCharactersPrepared());
      characterTags = dedupePreserveOrder([
        forcedSubjectTag,
        effectiveSegmentAnchorTag,
        segmentCharacterTag,
        ...segmentSubjectEntityTags,
        ...characterTags,
      ]);
      const segmentSuggestiveBodyTags = isSuggestiveOrHigher
        ? extractTagsFromPhraseEntries(segmentText, getSuggestiveBodyPrepared())
        : [];
      const nsfwBodyTags = isNsfwBaseRating
        ? extractTagsFromPhraseEntries(segmentText, getNsfwBodyPrepared())
        : [];
      const segmentNsfwPositionTags = isNsfwBaseRating
        ? extractTagsFromPhraseEntries(segmentText, getNsfwPositionPrepared())
        : [];
      const segmentNsfwClothingStateTags = isNsfwBaseRating
        ? extractTagsFromPhraseEntries(segmentText, getNsfwClothingStatePrepared())
        : [];
      const segmentNsfwFluidsTags = isNsfwBaseRating
        ? extractTagsFromPhraseEntries(segmentText, getNsfwFluidsPrepared())
        : [];
      const segmentNsfwPropsTags = isNsfwBaseRating
        ? extractTagsFromPhraseEntries(segmentText, getNsfwPropsPrepared())
        : [];
      const segmentTextGreyCanonical = normalizeGrayWordsToGrey(segmentText);
      const traitSourceTextGreyCanonical = normalizeGrayWordsToGrey(traitSourceText);
      const segmentWearablePropsTags = extractTagsFromPhraseEntries(
        segmentTextGreyCanonical,
        getWearablePropsPrepared()
      ).filter((tag) => {
        const lower = String(tag || "").toLowerCase();
        if (!lower) return false;
        if (!wearablePropSet.has(lower)) return false;
        if (blockedSensitiveTagSet.has(lower)) return false;
        if (nsfwPositionSet.has(lower)) return false;
        if (nsfwInteractionSet.has(lower)) return false;
        return true;
      });
      const hairComboTags = extractHairComboTags(traitSourceTextGreyCanonical);
      const traitExtraDirect = extractTagsFromPhraseEntries(
        traitSourceTextGreyCanonical,
        getTraitExtraPrepared()
      );
      const clothingTraitTags = dedupePreserveOrder([
        ...extractTagsFromPhraseEntries(traitSourceTextGreyCanonical, activeClothingPrepared),
        ...extractTagsFromPhraseEntries(segmentTextGreyCanonical, activeClothingPrepared),
        ...extractFlexibleTwoTokenClothingTags(segmentTextGreyCanonical, activeClothingPrepared),
      ]);

      let traitTags = dedupePreserveOrder([
        ...traitExtraDirect,
        ...extractTagsBySourcePrecedence({
          matcher,
          text: traitSourceTextGreyCanonical,
          preparedAliases: getAliasesPrepared(),
          sourcePreparedEntries: getOrderedMatcherSourcePrepared(),
        }),
      ]).filter((tag) => {
        const lower = String(tag).toLowerCase();
        if (blockedSensitiveTagSet.has(lower) && !isBodySizeTraitTag(lower)) return false;
        if (nonTraitTagSet.has(lower)) return false;
        return true;
      });
      traitTags = removeActionLikeTags(traitTags, actionTagSet);
      traitTags = dedupePreserveOrder([
        ...characterTags,
        ...segmentSuggestiveBodyTags,
        ...nsfwBodyTags,
        ...segmentNsfwPositionTags,
        ...segmentNsfwClothingStateTags,
        ...segmentNsfwFluidsTags,
        ...segmentNsfwPropsTags,
        ...segmentWearablePropsTags,
        ...segmentNsfwFluidLikeInteractionTags,
        ...segmentNsfwCharacterInteractionTags,
        ...hairOverlapResult.tags,
        ...clothingBindingResult.tags,
        ...clothingTraitTags,
        ...hairComboTags,
        ...traitTags,
      ]);
      if (segmentCharacterTag && looksLikeCharacterTag(segmentCharacterTag)) {
        const keepCharacterTag = String(segmentCharacterTag || "").toLowerCase();
        traitTags = traitTags.filter((tag) => {
          const lower = String(tag || "").toLowerCase();
          if (!lower) return false;
          if (lower === keepCharacterTag) return true;
          if (KNOWN_CHARACTER_TAG_SET.has(lower)) return false;
          return true;
        });
      }
      traitTags = canonicalizeTraitAliasTags(traitTags);
      if (!traitTags.length) {
        traitTags = dedupePreserveOrder([
          forcedSubjectTag,
          effectiveSegmentAnchorTag,
          segmentCharacterTag,
          effectiveSegmentFallbackEntityTag,
        ]);
      }
      traitTags = dropRedundantColorGarmentTags(traitTags, segmentText);
      const boundColors = extractBoundClothingColors(
        segmentText,
        getColorsPrepared(),
        clothingNounsNorm
      );
      const boundLengths = extractBoundClothingLengthTags(
        segmentText,
        clothingNounsNorm
      );
      traitTags = dedupePreserveOrder([...traitTags, ...boundColors, ...boundLengths]);
      traitTags = dropStandaloneColorsImpliedByColoredGarments(
        traitTags,
        clothingNounsNorm
      );
      traitTags = dropRedundantClothingAtomicsWhenComboPresent(
        traitTags,
        getColorsPrepared(),
        clothingNounsNorm,
        activeClothingPrepared
      );
      traitTags = dropRedundantAtomicGarmentsWhenVariantPresent(
        traitTags,
        clothingNounsNorm,
        activeClothingPrepared
      );
      traitTags = canonicalizeTraitAliasTags(traitTags);
      traitTags = canonicalizeGreySpelling(traitTags);
      traitTags = traitTags.filter((tag) => {
        const lower = String(tag || "").toLowerCase();
        if (!lower) return false;
        if (wearablePropSet.has(lower)) return true;
        if (strictGlobalPropTagSet.has(lower) && lower !== forcedSubjectTag) return false;
        if (/_chair$|_bench$/.test(lower)) return false;
        return true;
      });
      traitTags = traitTags.filter((tag) => {
        const lower = String(tag).toLowerCase();
        // Prefer global routing for ambiguous environment/lighting terms (e.g., "hot").
        if (environmentLightingTagSet.has(lower)) return false;
        if (globalOnlyCharTraitTagSet.has(lower)) return false;
        if (!lower.includes("_") && globalOnlyPhraseTokenSet.has(lower)) return false;
        if (sceneTagSet.has(lower)) return false;
        if (isCompositionCountTag(lower)) return false;
        return true;
      });
      if (forcedSubjectTag) {
        traitTags = dedupePreserveOrder([forcedSubjectTag, ...traitTags]);
      }
      if (hasAnyNonHumanSegment && segmentSubjectKind === "human") {
        traitTags = traitTags.filter((tag) => {
          const lower = String(tag || "").toLowerCase().trim();
          if (!lower) return false;
          if (speciesTagSet.has(lower) || animalsTagSet.has(lower)) return false;
          return true;
        });
      }
      if (shouldSuppressAnimalBodyPartLeakage) {
        traitTags = traitTags.filter((tag) => {
          const lower = String(tag || "").toLowerCase().trim();
          if (!lower) return false;
          if (lower === forcedSubjectTag) return true;
          if (lower === "tail") return false;
          if (/_tail$/.test(lower) || /_tail_/.test(lower)) return false;
          return true;
        });
      }
      traitTags = dropRedundantGenericCumBodypartTags(traitTags);
      traitTags = dropRedundantBaseActionTagsWhenSpecificPresent(traitTags, actionTagSet);
      if (multiEntityMode) {
        traitTags = resolveMultiEntityHairConflicts(traitTags, segmentTextRaw);
      }
      if (!traitTags.length) {
        traitTags = dedupePreserveOrder([
          forcedSubjectTag,
          effectiveSegmentAnchorTag,
          segmentCharacterTag,
          effectiveSegmentFallbackEntityTag,
        ]);
      }

      const segmentRoutingBuckets = makeRoutingBuckets();
      let validatedActionTags = validateTagsForOutputBlock(
        actionTags,
        "actions",
        segmentRoutingBuckets
      );
      let validatedPoseTags = validateTagsForOutputBlock(
        poseTagsForSegment,
        "actions",
        segmentRoutingBuckets
      );
      let validatedTraitTags = validateTagsForOutputBlock(
        traitTags,
        "character",
        segmentRoutingBuckets
      );

      const routedActionLikeTagsPass1 = dedupePreserveOrder(segmentRoutingBuckets.actions);
      const routedPoseTagsPass1 = routedActionLikeTagsPass1.filter((tag) =>
        isPerEntityPoseTag(tag)
      );
      const routedActionTagsPass1 = routedActionLikeTagsPass1.filter(
        (tag) => !isPerEntityPoseTag(tag)
      );
      validatedActionTags = dedupePreserveOrder([
        ...validatedActionTags,
        ...routedActionTagsPass1,
      ]);
      validatedPoseTags = dedupePreserveOrder([
        ...validatedPoseTags,
        ...routedPoseTagsPass1,
      ]);
      validatedTraitTags = dedupePreserveOrder([
        ...validatedTraitTags,
        ...segmentRoutingBuckets.character,
      ]);
      segmentRoutingBuckets.actions = [];
      segmentRoutingBuckets.character = [];

      validatedActionTags = validateTagsForOutputBlock(
        validatedActionTags,
        "actions",
        segmentRoutingBuckets
      );
      validatedPoseTags = validateTagsForOutputBlock(
        validatedPoseTags,
        "actions",
        segmentRoutingBuckets
      );
      validatedTraitTags = validateTagsForOutputBlock(
        validatedTraitTags,
        "character",
        segmentRoutingBuckets
      );
      const routedActionLikeTagsPass2 = dedupePreserveOrder(segmentRoutingBuckets.actions);
      const routedPoseTagsPass2 = routedActionLikeTagsPass2.filter((tag) =>
        isPerEntityPoseTag(tag)
      );
      const routedActionTagsPass2 = routedActionLikeTagsPass2.filter(
        (tag) => !isPerEntityPoseTag(tag)
      );
      validatedActionTags = dedupePreserveOrder([
        ...validatedActionTags,
        ...routedActionTagsPass2,
      ]);
      validatedPoseTags = dedupePreserveOrder([
        ...validatedPoseTags,
        ...routedPoseTagsPass2,
      ]);
      validatedTraitTags = dedupePreserveOrder([
        ...validatedTraitTags,
        ...segmentRoutingBuckets.character,
      ]);

      if (
        segmentSubjectKind !== "nonhuman" &&
        Array.isArray(segmentRoutingBuckets.interaction) &&
        segmentRoutingBuckets.interaction.length
      ) {
        const actorReroutedActionTags = segmentRoutingBuckets.interaction.filter((tag) =>
          ACTOR_SIDE_INTERACTION_ACTION_TAG_SET.has(String(tag || "").toLowerCase())
        );
        if (actorReroutedActionTags.length) {
          validatedActionTags = dedupePreserveOrder([
            ...validatedActionTags,
            ...actorReroutedActionTags,
          ]);
          segmentRoutingBuckets.interaction = segmentRoutingBuckets.interaction.filter(
            (tag) => !ACTOR_SIDE_INTERACTION_ACTION_TAG_SET.has(String(tag || "").toLowerCase())
          );
        }
      }
      if (removedPoseTagSetForSegment.size) {
        validatedPoseTags = validatedPoseTags.filter(
          (tag) => !removedPoseTagSetForSegment.has(String(tag || "").toLowerCase())
        );
      }
      if (transferredPoseTagsForSegment.length) {
        validatedPoseTags = dedupePreserveOrder([
          ...transferredPoseTagsForSegment,
          ...validatedPoseTags,
        ]);
      }
      if (removedActionTagSetForSegment.size) {
        validatedActionTags = validatedActionTags.filter(
          (tag) => !removedActionTagSetForSegment.has(String(tag || "").toLowerCase())
        );
      }
      if (ambientActionTagSetForSegment.size) {
        validatedActionTags = validatedActionTags.filter(
          (tag) => !ambientActionTagSetForSegment.has(String(tag || "").toLowerCase())
        );
      }
      if (transferredActionTagsForSegment.length) {
        validatedActionTags = dedupePreserveOrder([
          ...transferredActionTagsForSegment,
          ...validatedActionTags,
        ]);
      }

      if (
        forcedSubjectTag &&
        !validatedTraitTags.some((tag) => String(tag || "").toLowerCase() === forcedSubjectTag)
      ) {
        validatedTraitTags = dedupePreserveOrder([forcedSubjectTag, ...validatedTraitTags]);
      }
      if (!validatedTraitTags.length) {
        validatedTraitTags = dedupePreserveOrder([
          forcedSubjectTag,
          effectiveSegmentAnchorTag,
          segmentCharacterTag,
          effectiveSegmentFallbackEntityTag,
        ]);
      }

      reroutedEnvironmentTags.push(...segmentRoutingBuckets.environment);
      reroutedPropsTags.push(...segmentRoutingBuckets.props);
      reroutedCompositionTextTags.push(...segmentRoutingBuckets.composition);
      reroutedCameraLightingTags.push(...segmentRoutingBuckets.cameraLighting);
      for (const reroutedInteractionTag of segmentRoutingBuckets.interaction) {
        const lower = String(reroutedInteractionTag || "").toLowerCase();
        if (!lower) continue;
        if (nsfwInteractionSet.has(lower)) {
          reroutedNsfwInteractionTags.push(reroutedInteractionTag);
          continue;
        }
        if (nsfwPositionSet.has(lower)) {
          reroutedNsfwPositionTags.push(reroutedInteractionTag);
          continue;
        }
        reroutedInteractionTags.push(reroutedInteractionTag);
      }
      reroutedGlobalTags.push(...segmentRoutingBuckets.global);

      actionTags = validatedActionTags;
      poseTagsForSegment = validatedPoseTags;
      traitTags = validatedTraitTags;

      suggestiveBodyUnion.push(...segmentSuggestiveBodyTags);
      nsfwBodyUnion.push(...nsfwBodyTags);
      traitUnion.push(...traitTags);
      poseUnion.push(...poseTagsForSegment);
      actionUnion.push(...actionTags);
      const traitBlock = buildCharacterBlock(segment.label, traitTags);
      if (traitBlock) traitBlocks.push(traitBlock);

      const poseBlock = buildPoseBlock(segment.label, poseTagsForSegment);
      if (poseBlock) poseBlocks.push(poseBlock);

      const actionBlock = buildActionBlock(segment.label, actionTags);
      if (actionBlock) actionBlocks.push(actionBlock);
    }
    if (multiEntityMode && actionBlocks.length) {
      const actorVerbToActionTag = {
        petting: "petting",
        pet: "petting",
        holding: "holding",
        hold: "holding",
        holds: "holding",
        touching: "touching",
        touch: "touching",
        touches: "touching",
        hugging: "hugging",
        hug: "hugging",
        hugs: "hugging",
        feeding: "feeding",
        feed: "feeding",
        feeds: "feeding",
        guiding: "guiding",
        guide: "guiding",
        guides: "guiding",
        riding: "riding",
        ride: "riding",
        rides: "riding",
        playing: "playing",
        play: "playing",
        plays: "playing",
        walking: "walking",
        walk: "walking",
        walks: "walking",
        following: "following",
        follow: "following",
        follows: "following",
      };
      const actorVerbPattern = Object.keys(actorVerbToActionTag).join("|");
      const normalizedForActorCorrection = normalizeLooseText(userText);
      const actorCompanionActionTags = [];
      const actorRegex = new RegExp(
        `\\b(${actorVerbPattern})\\s+(?:(?:her|his|their|a|an|the)\\s+)?(?:[a-z0-9]+\\s+){0,2}(?:${NON_HUMAN_ENTITY_NOUN_PATTERN})\\b`,
        "gi"
      );
      let match;
      while ((match = actorRegex.exec(normalizedForActorCorrection)) !== null) {
        const token = String(match[1] || "").toLowerCase().trim();
        const mappedTag = actorVerbToActionTag[token];
        const leadWindow = normalizedForActorCorrection.slice(Math.max(0, match.index - 80), match.index);
        if (mappedTag && hasHumanEntityCueInNormalizedText(leadWindow)) {
          actorCompanionActionTags.push(mappedTag);
        }
        if (match.index === actorRegex.lastIndex) actorRegex.lastIndex += 1;
      }
      const normalizedActorActionTags = dedupePreserveOrder(actorCompanionActionTags);
      if (normalizedActorActionTags.length) {
        const parsedActionBlocks = parseNamedTagBlocks(actionBlocks, "action");
        const actionTagsByLabel = new Map(
          parsedActionBlocks.map((block) => [
            String(block.label || "").toLowerCase(),
            [...(block.tags || [])],
          ])
        );
        const humanLabels = dedupePreserveOrder(
          (segments || [])
            .filter((segment) => normalizeSubjectKind(segment?.subjectKind) === "human")
            .map((segment) => String(segment?.label || "").toLowerCase().trim())
            .filter(Boolean)
        );
        const nonHumanLabels = dedupePreserveOrder(
          (segments || [])
            .filter((segment) => normalizeSubjectKind(segment?.subjectKind) === "nonhuman")
            .map((segment) => String(segment?.label || "").toLowerCase().trim())
            .filter(Boolean)
        );
        const actorTargetLabel = String(humanLabels[0] || "").toLowerCase().trim();
        if (actorTargetLabel) {
          for (const label of nonHumanLabels) {
            actionTagsByLabel.set(
              label,
              (actionTagsByLabel.get(label) || []).filter(
                (tag) => !normalizedActorActionTags.includes(String(tag || "").toLowerCase().trim())
              )
            );
          }
          actionTagsByLabel.set(
            actorTargetLabel,
            dedupePreserveOrder([
              ...(actionTagsByLabel.get(actorTargetLabel) || []),
              ...normalizedActorActionTags,
            ])
          );
          actionBlocks.length = 0;
          actionUnion.length = 0;
          for (const segment of segments || []) {
            const label = String(segment?.label || "").toLowerCase().trim();
            if (!label) continue;
            const tags = dedupePreserveOrder(actionTagsByLabel.get(label) || []);
            actionUnion.push(...tags);
            const block = buildActionBlock(label, tags);
            if (block) actionBlocks.push(block);
          }
        }
      }
    }

    if (hasAnyNonHumanSegment && poseBlocks.length) {
      const parsedPoseBlocks = parseNamedTagBlocks(poseBlocks, "pose");
      const parsedTraitBlocksForPoseReassign = parseNamedTagBlocks(traitBlocks, "trait");
      const poseTagsByLabel = new Map(
        parsedPoseBlocks.map((block) => [String(block.label || "").toLowerCase(), [...(block.tags || [])]])
      );
      const nonHumanLabelByTag = new Map();
      const nonHumanLabelSet = new Set();
      const humanLabelSet = new Set();
      for (const traitBlock of parsedTraitBlocksForPoseReassign) {
        const label = String(traitBlock?.label || "").toLowerCase().trim();
        if (!label) continue;
        const nonHumanTags = (traitBlock?.tags || [])
          .map((tag) => String(tag || "").toLowerCase().trim())
          .filter((tag) => tag && (speciesTagSet.has(tag) || animalsTagSet.has(tag)));
        if (nonHumanTags.length) {
          nonHumanLabelSet.add(label);
          for (const tag of nonHumanTags) {
            if (!nonHumanLabelByTag.has(tag)) nonHumanLabelByTag.set(tag, label);
          }
        } else {
          humanLabelSet.add(label);
        }
      }
      const nonHumanReassignPoseTagSet = new Set([
        "sitting",
        "standing",
        "walking",
        "running",
        "kneeling",
        "sleeping",
        "lying",
        "lying_down",
        "curled_up",
        "on_stomach",
        "crouching",
        "perched",
      ]);
      const resolveSegmentNonHumanTag = (segment) => {
        const explicit = String(segment?.subjectTag || "").toLowerCase().trim();
        if (explicit && (speciesTagSet.has(explicit) || animalsTagSet.has(explicit))) return explicit;
        const fallback = String(segment?.fallbackEntityTag || "").toLowerCase().trim();
        if (fallback && (speciesTagSet.has(fallback) || animalsTagSet.has(fallback))) return fallback;
        return "";
      };
      const findNonHumanTargetLabel = (subjectTag) => {
        const wanted = String(subjectTag || "").toLowerCase().trim();
        if (!wanted) return "";
        if (nonHumanLabelByTag.has(wanted)) return String(nonHumanLabelByTag.get(wanted) || "");
        if (nonHumanLabelSet.size) return String(Array.from(nonHumanLabelSet)[0] || "");
        const exact = (segments || []).find((segment) => {
          const segTag = resolveSegmentNonHumanTag(segment);
          return segTag === wanted;
        });
        if (exact?.label) return String(exact.label).toLowerCase().trim();
        return "";
      };
      const statePoseBindings = extractNonHumanStatePoseBindingsFromText(userText);
      for (const binding of statePoseBindings) {
        const poseTag = String(binding?.poseTag || "").toLowerCase().trim();
        if (!nonHumanReassignPoseTagSet.has(poseTag)) continue;
        const targetLabel = findNonHumanTargetLabel(binding?.subjectTag);
        if (!targetLabel) continue;
        for (const candidate of parsedTraitBlocksForPoseReassign) {
          const label = String(candidate?.label || "").toLowerCase().trim();
          if (!label || label === targetLabel) continue;
          if (!humanLabelSet.has(label)) continue;
          if (!poseTagsByLabel.has(label)) continue;
          poseTagsByLabel.set(
            label,
            (poseTagsByLabel.get(label) || []).filter(
              (tag) => String(tag || "").toLowerCase() !== poseTag
            )
          );
        }
        poseTagsByLabel.set(
          targetLabel,
          dedupePreserveOrder([...(poseTagsByLabel.get(targetLabel) || []), poseTag])
        );
      }
      poseBlocks.length = 0;
      for (const segment of segments || []) {
        const label = String(segment?.label || "").toLowerCase().trim();
        if (!label) continue;
        const tags = dedupePreserveOrder(poseTagsByLabel.get(label) || []);
        const block = buildPoseBlock(label, tags);
        if (block) poseBlocks.push(block);
      }
    }
    if (multiEntityMode) {
      const normalizedUserTextForSharedHuman = normalizeLooseText(userText);
      const normalizedUnassignedClauses = normalizeLooseText(unassignedClausesText);
      const hasCollectiveHumanCue = /\b(?:both|all|two|three|four|five|six|seven|eight|nine|ten)\s+(?:women|men|girls|boys|people|persons|characters)\b/.test(
        normalizedUnassignedClauses
      );
      const hasPairTogetherCue =
        /\b(?:a|one)\s+(?:woman|girl|man|boy)\s+and\s+(?:a|one)\s+(?:woman|girl|man|boy)\b/.test(
          normalizedUserTextForSharedHuman
        ) && /\btogether\b/.test(normalizedUserTextForSharedHuman);
      if (hasCollectiveHumanCue || hasPairTogetherCue) {
        const nonHumanOwnedPoseTagSet = buildTagSet(
          extractNonHumanStatePoseBindingsFromText(userText).map((binding) =>
            String(binding?.poseTag || "").toLowerCase().trim()
          )
        );
        const humanLabels = dedupePreserveOrder(
          (segments || [])
            .filter((segment) => normalizeSubjectKind(segment?.subjectKind) === "human")
            .map((segment) => String(segment?.label || "").toLowerCase().trim())
            .filter(Boolean)
        );
        if (humanLabels.length >= 2) {
          const parsedPoseBlocks = parseNamedTagBlocks(poseBlocks, "pose");
          const poseTagsByLabel = new Map(
            parsedPoseBlocks.map((block) => [
              String(block.label || "").toLowerCase(),
              [...(block.tags || [])],
            ])
          );
          const sharedCollectivePoseTags = dedupePreserveOrder(
            (collectiveGlobalActionLikeTags || []).filter((tag) => {
              const lower = String(tag || "").toLowerCase().trim();
              if (!lower) return false;
              if (nonHumanOwnedPoseTagSet.has(lower)) return false;
              return (
                COLLECTIVE_POSE_ACTION_TAG_ALLOWLIST.has(lower) || PER_ENTITY_POSE_SPLIT_TAG_SET.has(lower)
              );
            })
          );
          const sharedHumanPoseTagsFromAssignedBlocks = dedupePreserveOrder(
            humanLabels.flatMap((label) =>
              (poseTagsByLabel.get(label) || []).filter((tag) => {
                const lower = String(tag || "").toLowerCase().trim();
                if (!lower) return false;
                if (nonHumanOwnedPoseTagSet.has(lower)) return false;
                return (
                  COLLECTIVE_POSE_ACTION_TAG_ALLOWLIST.has(lower) ||
                  PER_ENTITY_POSE_SPLIT_TAG_SET.has(lower)
                );
              })
            )
          );
          const sharedTextPoseTags = hasPairTogetherCue
            ? dedupePreserveOrder(
                extractTagsFromPhraseEntries(userText, activePoseMaskPrepared).filter((tag) => {
                  const lower = String(tag || "").toLowerCase().trim();
                  if (!lower) return false;
                  if (nonHumanOwnedPoseTagSet.has(lower)) return false;
                  return (
                    COLLECTIVE_POSE_ACTION_TAG_ALLOWLIST.has(lower) ||
                    PER_ENTITY_POSE_SPLIT_TAG_SET.has(lower)
                  );
                })
              )
            : [];
          const sharedTextTokenPoseTags = hasPairTogetherCue
            ? dedupePreserveOrder([
                /\b(sitting|sit|sits)\b/.test(normalizedUserTextForSharedHuman) ? "sitting" : "",
                /\b(standing|stand|stands)\b/.test(normalizedUserTextForSharedHuman) ? "standing" : "",
                /\b(kneeling|kneel|kneels)\b/.test(normalizedUserTextForSharedHuman) ? "kneeling" : "",
                /\b(walking|walk|walks)\b/.test(normalizedUserTextForSharedHuman) ? "walking" : "",
                /\b(running|run|runs)\b/.test(normalizedUserTextForSharedHuman) ? "running" : "",
                /\b(lying|lie|lies)\b/.test(normalizedUserTextForSharedHuman) ? "lying" : "",
                /\b(sleeping|sleep|sleeps)\b/.test(normalizedUserTextForSharedHuman) ? "sleeping" : "",
              ]).filter((tag) => {
                const lower = String(tag || "").toLowerCase().trim();
                if (!lower) return false;
                if (nonHumanOwnedPoseTagSet.has(lower)) return false;
                return (
                  COLLECTIVE_POSE_ACTION_TAG_ALLOWLIST.has(lower) || PER_ENTITY_POSE_SPLIT_TAG_SET.has(lower)
                );
              })
            : [];
          const sharedPoseTags = dedupePreserveOrder([
            ...sharedCollectivePoseTags,
            ...sharedHumanPoseTagsFromAssignedBlocks,
            ...sharedTextPoseTags,
            ...sharedTextTokenPoseTags,
          ]);
          if (sharedPoseTags.length) {
            for (const label of humanLabels) {
              poseTagsByLabel.set(
                label,
                dedupePreserveOrder([...(poseTagsByLabel.get(label) || []), ...sharedPoseTags])
              );
            }
            poseBlocks.length = 0;
            for (const segment of segments || []) {
              const label = String(segment?.label || "").toLowerCase().trim();
              if (!label) continue;
              const tags = dedupePreserveOrder(poseTagsByLabel.get(label) || []);
              const block = buildPoseBlock(label, tags);
              if (block) poseBlocks.push(block);
            }
          }
        }
      }
    }
    if (multiEntityMode && poseBlocks.length) {
      const explicitPluralNonHumanCountsForPose = extractExplicitPluralNonHumanEntityCountsFromText(
        userText
      );
      if ((explicitPluralNonHumanCountsForPose.totalCount || 0) > 1) {
        const resolveSegmentNonHumanTagForPose = (segment) => {
          const explicit = String(segment?.subjectTag || "").toLowerCase().trim();
          if (explicit && (speciesTagSet.has(explicit) || animalsTagSet.has(explicit))) return explicit;
          const fallback = String(segment?.fallbackEntityTag || "").toLowerCase().trim();
          if (fallback && (speciesTagSet.has(fallback) || animalsTagSet.has(fallback))) return fallback;
          return "";
        };
        const statePoseMentions = extractNonHumanStatePoseMentionsFromText(userText);
        const poseBySpeciesTag = new Map();
        for (const mention of statePoseMentions) {
          if (mention?.hasSingularSelector) continue;
          const subjectTag = String(mention?.subjectTag || "").toLowerCase().trim();
          const poseTag = String(mention?.poseTag || "").toLowerCase().trim();
          if (!subjectTag || !poseTag) continue;
          poseBySpeciesTag.set(
            subjectTag,
            dedupePreserveOrder([...(poseBySpeciesTag.get(subjectTag) || []), poseTag])
          );
        }
        if (poseBySpeciesTag.size) {
          const parsedPoseBlocks = parseNamedTagBlocks(poseBlocks, "pose");
          const poseTagsByLabel = new Map(
            parsedPoseBlocks.map((block) => [
              String(block.label || "").toLowerCase(),
              [...(block.tags || [])],
            ])
          );
          let didApplySharedNonHumanPose = false;
          for (const [tagRaw, countRaw] of explicitPluralNonHumanCountsForPose.countsByTag.entries()) {
            const tag = String(tagRaw || "").toLowerCase().trim();
            const count = Math.max(0, Number(countRaw) || 0);
            if (!tag || count <= 1) continue;
            const sharedPoseTags = dedupePreserveOrder(poseBySpeciesTag.get(tag) || []);
            if (!sharedPoseTags.length) continue;
            const labels = dedupePreserveOrder(
              (segments || [])
                .filter(
                  (segment) =>
                    normalizeSubjectKind(segment?.subjectKind) === "nonhuman" &&
                    resolveSegmentNonHumanTagForPose(segment) === tag
                )
                .map((segment) => String(segment?.label || "").toLowerCase().trim())
                .filter(Boolean)
            );
            if (labels.length < 2) continue;
            for (const label of labels) {
              poseTagsByLabel.set(
                label,
                dedupePreserveOrder([...(poseTagsByLabel.get(label) || []), ...sharedPoseTags])
              );
            }
            didApplySharedNonHumanPose = true;
          }
          if (didApplySharedNonHumanPose) {
            poseBlocks.length = 0;
            for (const segment of segments || []) {
              const label = String(segment?.label || "").toLowerCase().trim();
              if (!label) continue;
              const tags = dedupePreserveOrder(poseTagsByLabel.get(label) || []);
              const block = buildPoseBlock(label, tags);
              if (block) poseBlocks.push(block);
            }
          }
        }
      }
    }

    if (multiEntityMode && (segments || []).length >= 2) {
      const semanticRoleRefined = applyFinalSemanticRoleRefinement({
        userText,
        segments,
        traitBlocks,
        actionBlocks,
        poseBlocks,
        speciesTagSet,
        animalsTagSet,
      });
      traitBlocks.length = 0;
      traitBlocks.push(...(semanticRoleRefined?.traitBlocks || []));
      actionBlocks.length = 0;
      actionBlocks.push(...(semanticRoleRefined?.actionBlocks || []));
      poseBlocks.length = 0;
      poseBlocks.push(...(semanticRoleRefined?.poseBlocks || []));
      traitUnion.length = 0;
      traitUnion.push(...(semanticRoleRefined?.traitUnion || []));
      actionUnion.length = 0;
      actionUnion.push(...(semanticRoleRefined?.actionUnion || []));
      poseUnion.length = 0;
      poseUnion.push(...(semanticRoleRefined?.poseUnion || []));
    }

    // 8) Global leftovers, excluding per-character, interactions, scenes, and actions.
    const charUnionSet = buildTagSet(traitUnion);
    const charActionUnionSet = buildTagSet([...actionUnion, ...poseUnion]);
    const globalActionSuppressionTagSet = buildGlobalActionSuppressionTagSet([
      ...actionUnion,
      ...poseUnion,
    ]);
    const emittedSensitiveTagSet = buildTagSet([
      ...suggestiveBodyUnion,
      ...suggestiveBodyTags,
      ...nsfwBodyUnion,
      ...nsfwPositionLikeTags,
      ...nsfwInteractionTags,
      ...traitUnion.filter((tag) => suggestiveBodySet.has(String(tag).toLowerCase())),
      ...traitUnion.filter((tag) => nsfwBodySet.has(String(tag).toLowerCase())),
      ...traitUnion.filter((tag) => nsfwPositionSet.has(String(tag).toLowerCase())),
      ...traitUnion.filter((tag) => nsfwPropsSet.has(String(tag).toLowerCase())),
      ...traitUnion.filter((tag) => nsfwInteractionSet.has(String(tag).toLowerCase())),
    ]);
    let dedupedGlobalTags = dedupePreserveOrder(
      [...globalTagsAll, ...reroutedGlobalTags].filter((tag) => {
        const lower = String(tag).toLowerCase();
        if (newGlobalTagSet.has(lower)) return false;
        if (interactionTagSet.has(lower)) return false;
        if (sceneTagSet.has(lower)) return false;
        if (suggestiveBodySet.has(lower)) return false;
        if (nsfwBodySet.has(lower)) return false;
        if (nsfwPositionSet.has(lower)) return false;
        if (nsfwInteractionSet.has(lower)) return false;
        if (suggestiveBodyTagSet.has(lower)) return false;
        if (nsfwPositionTagSet.has(lower)) return false;
        if (nsfwInteractionTagSet.has(lower)) return false;
        if (clothingTagSet.has(lower)) return false;
        if (emittedSensitiveTagSet.has(lower)) return false;
        if (isCompositionCountTag(tag)) return false;
        if (charUnionSet.has(lower) && !isGroupCountTag(tag)) {
          return false;
        }
        if (charActionUnionSet.has(lower)) return false;
        if (globalActionSuppressionTagSet.has(lower)) return false;

        return true;
      })
    );
    const normalizedUserText = normalizeLooseText(userText);
    const hasBrokenStatuePhrase =
      /\bbroken\s+statue\b/.test(normalizedUserText) ||
      /\bbroken\s+statues\b/.test(normalizedUserText);
    const concreteContextTags = buildTagSet([
      ...sceneTags,
      ...environmentTags,
      ...propsTags,
      ...reroutedEnvironmentTags,
      ...reroutedPropsTags,
      ...reroutedCompositionTextTags,
    ]);
    const hasConcreteBrokenContext =
      hasBrokenStatuePhrase ||
      Array.from(concreteContextTags).some(
        (tag) =>
          tag === "statue" ||
          tag.includes("statue") ||
          tag.includes("smoke") ||
          tag === "ruins" ||
          tag === "battlefield" ||
          tag.startsWith("broken_")
      );
    if (hasConcreteBrokenContext) {
      dedupedGlobalTags = dedupedGlobalTags.filter(
        (tag) => String(tag || "").toLowerCase() !== "broken"
      );
    }

    const globalWithoutPeopleCounts = dedupedGlobalTags.filter(
      (tag) => !isCompositionCountTag(tag)
    );
    const hasCharacterDetected = traitBlocks.length > 0;
    const inferredPeopleCountTags = explicitPeopleCountTags;
    const peopleCountTags = suppressHumanEntityDefaults
      ? []
      : segmentationPlan?.peopleTags?.length
      ? segmentationPlan.peopleTags
      : inferredPeopleCountTags.length
      ? inferredPeopleCountTags
      : hasCharacterDetected
      ? [inferGenderFromUserText(userText) || "1girl"]
      : [];
    const groupOrGenderTag = peopleCountTags.join(", ");

    const cameraLightingTags = collectCameraLightingTags(cameraData, lightingData, uiSelection);
    const usedTagLower = new Set();
    markTagsAsUsed(usedTagLower, traitUnion);
    markTagsAsUsed(usedTagLower, poseUnion);
    markTagsAsUsed(usedTagLower, actionUnion);
    markTagsAsUsed(usedTagLower, suppressedEnvironmentAtomicTags);
    markTagsAsUsed(usedTagLower, suppressedPropsAtomicTags);
    markTagsAsUsed(usedTagLower, suppressedSceneAtomicTags);
    const dedupedCameraLightingTags = dedupePreserveOrder([
      ...cameraLightingTags,
      ...nsfwCameraTags,
      ...reroutedCameraLightingTags,
    ]);
    const dedupedCompositionTextTags = dedupePreserveOrder([
      ...compositionTextTags,
      ...reroutedCompositionTextTags,
    ]);
    markTagsAsUsed(usedTagLower, dedupedCameraLightingTags);
    markTagsAsUsed(usedTagLower, dedupedCompositionTextTags);

    const dedupedPoseTags = (
      multiEntityMode
        ? dedupeTagsByUsedSet(collectiveGlobalActionLikeTags, usedTagLower)
        : dedupeTagsByUsedSet(poseTags, usedTagLower)
    ).filter((tag) => !globalActionSuppressionTagSet.has(String(tag || "").toLowerCase()));
    const dedupedExpressionsTags = dedupeTagsByUsedSet(
      (expressionsTags || []).filter(
        (tag) => !globalActionSuppressionTagSet.has(String(tag || "").toLowerCase())
      ),
      usedTagLower
    );
    const dedupedMoodStateTags = multiEntityMode
      ? []
      : dedupeTagsByUsedSet(moodStateTags, usedTagLower);
    const dedupedPropsTags = dedupeTagsByUsedSet(
      dedupePreserveOrder([...propsTags, ...reroutedPropsTags]),
      usedTagLower
    );
    const dedupedEnvironmentTags = dedupeTagsByUsedSet(
      dedupePreserveOrder([...environmentTags, ...reroutedEnvironmentTags]),
      usedTagLower
    );
    const dedupedSceneTags = dedupeTagsByUsedSet(sceneTags, usedTagLower);
    const dedupedInteractionTags = dedupeTagsByUsedSet(
      dedupePreserveOrder([...interactionTags, ...reroutedInteractionTags]),
      usedTagLower
    );
    const dedupedNsfwPositionTags = multiEntityMode
      ? []
      : dedupeTagsByUsedSet(
          dedupePreserveOrder([...nsfwPositionLikeTags, ...reroutedNsfwPositionTags]),
          usedTagLower
        );
    const dedupedNsfwInteractionTags = multiEntityMode
      ? []
      : dedupeTagsByUsedSet(
          dedupePreserveOrder([...nsfwInteractionTags, ...reroutedNsfwInteractionTags]),
          usedTagLower
        );
    const dedupedGlobalWithoutGroup = multiEntityMode
      ? []
      : dedupeTagsByUsedSet(
          [
            ...dedupePreserveOrder(traitExtraTags),
            ...globalWithoutPeopleCounts,
            ...reroutedGlobalTags,
          ],
          usedTagLower
        );
    const finalRoutingBuckets = makeRoutingBuckets();
    const validatedPoseTags = validateTagsForOutputBlock(
      dedupedPoseTags,
      "actions",
      finalRoutingBuckets
    );
    const validatedEnvironmentTags = validateTagsForOutputBlock(
      dedupedEnvironmentTags,
      "environment",
      finalRoutingBuckets
    );
    const validatedPropsTags = validateTagsForOutputBlock(
      dedupedPropsTags,
      "props",
      finalRoutingBuckets
    );
    const validatedInteractionTags = validateTagsForOutputBlock(
      dedupedInteractionTags,
      "interaction",
      finalRoutingBuckets
    );
    const validatedNsfwInteractionTags = validateTagsForOutputBlock(
      dedupedNsfwInteractionTags,
      "interaction",
      finalRoutingBuckets
    );
    const validatedNsfwPositionTags = validateTagsForOutputBlock(
      dedupedNsfwPositionTags,
      "interaction",
      finalRoutingBuckets
    );
    const validatedCompositionTextTags = validateTagsForOutputBlock(
      dedupedCompositionTextTags,
      "composition",
      finalRoutingBuckets
    );
    const validatedCameraLightingTags = validateTagsForOutputBlock(
      dedupedCameraLightingTags,
      "cameraLighting",
      finalRoutingBuckets
    );
    const validatedGlobalWithoutGroup = validateTagsForOutputBlock(
      dedupedGlobalWithoutGroup,
      "global",
      finalRoutingBuckets
    );
    const finalPoseTags = dedupePreserveOrder([
      ...validatedPoseTags,
      ...finalRoutingBuckets.actions,
    ]);
    let finalEnvironmentTags = dedupePreserveOrder([
      ...validatedEnvironmentTags,
      ...finalRoutingBuckets.environment,
    ]);
    let finalPropsTags = dedupePreserveOrder([
      ...validatedPropsTags,
      ...finalRoutingBuckets.props,
    ]);
    if (suppressKnightChessTag) {
      finalPropsTags = finalPropsTags.filter(
        (tag) => String(tag || "").toLowerCase() !== "knight_(chess)"
      );
    }
    const finalReroutedInteractionTags = (finalRoutingBuckets.interaction || []).filter((tag) => {
      const lower = String(tag || "").toLowerCase();
      if (!lower) return false;
      return !nsfwInteractionSet.has(lower) && !nsfwPositionSet.has(lower);
    });
    const finalReroutedNsfwInteractionTags = (finalRoutingBuckets.interaction || []).filter((tag) =>
      nsfwInteractionSet.has(String(tag || "").toLowerCase())
    );
    const finalReroutedNsfwPositionTags = (finalRoutingBuckets.interaction || []).filter((tag) =>
      nsfwPositionSet.has(String(tag || "").toLowerCase())
    );
    const finalInteractionTags = dedupePreserveOrder([
      ...validatedInteractionTags,
      ...finalReroutedInteractionTags,
    ]);
    const finalNsfwInteractionTags = dedupePreserveOrder([
      ...validatedNsfwInteractionTags,
      ...finalReroutedNsfwInteractionTags,
    ]);
    const finalNsfwPositionTags = dedupePreserveOrder([
      ...validatedNsfwPositionTags,
      ...finalReroutedNsfwPositionTags,
    ]);
    const finalCompositionTextTags = dedupePreserveOrder([
      ...validatedCompositionTextTags,
      ...finalRoutingBuckets.composition,
    ]);
    const finalCameraLightingTags = dedupePreserveOrder([
      ...validatedCameraLightingTags,
      ...finalRoutingBuckets.cameraLighting,
    ]);
    const reroutedCharacterTags = dedupePreserveOrder(finalRoutingBuckets.character);
    if (reroutedCharacterTags.length && traitBlocks.length === 1) {
      const parsedTraitBlocks = parseNamedTagBlocks(traitBlocks, "trait");
      if (parsedTraitBlocks.length === 1) {
        const only = parsedTraitBlocks[0];
        traitBlocks[0] = buildCharacterBlock(
          only.label,
          dedupePreserveOrder([...(only.tags || []), ...reroutedCharacterTags])
        );
      }
    }
    const shouldKeepReroutedCharacterGlobal = traitBlocks.length !== 1;
    let finalGlobalWithoutGroup = dedupePreserveOrder([
      ...validatedGlobalWithoutGroup,
      ...finalRoutingBuckets.global,
      ...(shouldKeepReroutedCharacterGlobal ? reroutedCharacterTags : []),
    ]);
    if (suppressKnightChessTag) {
      finalGlobalWithoutGroup = finalGlobalWithoutGroup.filter(
        (tag) => String(tag || "").toLowerCase() !== "knight_(chess)"
      );
    }
    const finalBrokenContextTags = buildTagSet([
      ...finalEnvironmentTags,
      ...finalPropsTags,
      ...dedupedSceneTags,
      ...finalCompositionTextTags,
      ...finalCameraLightingTags,
    ]);
    const shouldSuppressFinalBroken =
      /\bbroken\s+statue\b/.test(normalizedUserText) ||
      /\bbroken\s+statues\b/.test(normalizedUserText) ||
      Array.from(finalBrokenContextTags).some(
        (tag) =>
          tag === "statue" ||
          tag.includes("statue") ||
          tag.includes("smoke") ||
          tag === "ruins" ||
          tag === "battlefield" ||
          tag.startsWith("broken_")
      );
    if (shouldSuppressFinalBroken) {
      finalGlobalWithoutGroup = finalGlobalWithoutGroup.filter(
        (tag) => String(tag || "").toLowerCase() !== "broken"
      );
    }
    const skylineContext = buildTagSet([
      ...finalEnvironmentTags,
      ...finalPropsTags,
      ...dedupedSceneTags,
      ...finalGlobalWithoutGroup,
    ]);
    if (skylineContext.has("skyline")) {
      finalEnvironmentTags = finalEnvironmentTags.filter(
        (tag) => String(tag || "").toLowerCase() !== "city"
      );
      finalPropsTags = finalPropsTags.filter(
        (tag) => String(tag || "").toLowerCase() !== "city"
      );
      finalGlobalWithoutGroup = finalGlobalWithoutGroup.filter(
        (tag) => String(tag || "").toLowerCase() !== "city"
      );
    }
    const rawHelperSourceText = readMainTextareaValue();
    const rawHelperBlock = rawHelperEnabled
      ? buildRawHelperBlock(rawHelperSourceText)
      : "";

    const positive = assemblePositivePrompt({
      rating,
      presetPositiveTags: preset.positive_tags,
      modifierPositiveTags: selectedModifiers.positive,
      loraTriggerTags,
      groupOrGenderTag,
      traitBlocks,
      poseBlocks,
      actionBlocks,
      poseTags: finalPoseTags,
      environmentTags: finalEnvironmentTags,
      propsTags: finalPropsTags,
      expressionsTags: dedupedExpressionsTags,
      moodStateTags: dedupedMoodStateTags,
      nsfwPositionTags: finalNsfwPositionTags,
      interactionTags: finalInteractionTags,
      nsfwInteractionTags: finalNsfwInteractionTags,
      sceneTags: dedupedSceneTags,
      globalTags: finalGlobalWithoutGroup,
      compositionTextTags: finalCompositionTextTags,
      cameraLightingTags: finalCameraLightingTags,
      rawHelperBlock,
    });

    return {
      userText,
      rating,
      preset,
      selectedModifiers,
      positive,
    };
  }

  function refreshNegativeFromCurrentPositive(userText, rating, preset, modifierTags) {
    if (negativeLockedByUser) return;
    const positiveForScore = $("positiveOut").value || POSITIVE_DEFAULT_SCORE_BLOCK.join(", ");
    $("negativeOut").value = buildNegativePrompt({
      rating,
      userText,
      positiveForScore,
      presetNegativeTags: preset.negative_tags,
      modifierNegativeTags: modifierTags.negative,
    });
  }

  function recompute({ resetLocks = false, allowCriticalPrepDefer = true } = {}) {
    recomputeForSessionResetDebounced?.cancel?.();

    const hasUserText = Boolean(String(readMainTextareaValue() || "").trim());
    if (allowCriticalPrepDefer && hasUserText) {
      const rating = currentRatingValue();
      if (!isCriticalPrepReadyForRating(rating)) {
        queueCriticalPrepRecompute({ resetLocks });
        return;
      }
      setParserStatus("");
    } else if (!hasUserText) {
      pendingCriticalPrepRecompute = false;
      pendingCriticalPrepResetLocks = false;
      setParserStatus("");
    }

    if (resetLocks) {
      positiveLockedByUser = false;
      negativeLockedByUser = false;
    }

    const state = computePromptState();

    if (!positiveLockedByUser) {
      const positiveOutEl = $("positiveOut");
      if (positiveOutEl.value !== state.positive) {
        positiveOutEl.value = state.positive;
      }
    }

    if (!negativeLockedByUser) {
      const positiveForScore = $("positiveOut").value || state.positive;
      const negativePrompt = buildNegativePrompt({
        rating: state.rating,
        userText: state.userText,
        positiveForScore,
        presetNegativeTags: state.preset.negative_tags,
        modifierNegativeTags: state.selectedModifiers.negative,
      });
      const negativeOutEl = $("negativeOut");
      if (negativeOutEl.value !== negativePrompt) {
        negativeOutEl.value = negativePrompt;
      }
    }
  }

  const recomputeForSessionReset = () => recompute({ resetLocks: true });

  const stripCharactersHeaderFromTop = (text) => {
    const normalized = String(text || "").replace(/\r\n/g, "\n");
    const lines = normalized.split("\n");
    if (!lines.length) return normalized;
    if (!/^(?:\uFEFF)?[ \t]*characters:/i.test(lines[0])) return normalized;

    let startIndex = 1;
    if (startIndex < lines.length && lines[startIndex].trim() === "") {
      startIndex += 1;
    }
    return lines.slice(startIndex).join("\n");
  };

  const applyCharactersHeaderToMainText = (phrases) => {
    const mainTextEl = $("mainText");
    if (!mainTextEl) return;

    const body = stripCharactersHeaderFromTop(mainTextEl.value || "");
    const cleanedPhrases = dedupePreserveOrder(phrases || []);
    if (!cleanedPhrases.length) {
      mainTextEl.value = body;
      return;
    }

    const header = `Characters: ${cleanedPhrases.join(", ")}`;
    mainTextEl.value = body ? `${header}\n\n${body}` : header;
  };

  const enforceSingleSelectInContainer = (containerId) => {
    const container = $(containerId);
    if (!container) return;

    container.addEventListener("change", (event) => {
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement) ||
        (target.type !== "checkbox" && target.type !== "radio")
      ) {
        return;
      }

      if (target.checked) {
        for (const input of container.querySelectorAll("input[type=checkbox], input[type=radio]")) {
          if (input !== target) {
            input.checked = false;
          }
        }
      }

      recomputeForSessionReset();
    });

    container.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const pill = target.closest(DEFAULT_PILL_INTERACTION_SELECTOR);
      if (!pill || !container.contains(pill)) return;
      queueMicrotask(recomputeForSessionReset);
    });
  };

  const enforceExclusiveCheckboxGroupInContainer = (containerId, exclusiveIds) => {
    const container = $(containerId);
    if (!container) return;

    const normalizedExclusiveIds = new Set(
      (Array.isArray(exclusiveIds) ? exclusiveIds : [])
        .map((id) => String(id || "").trim().toLowerCase())
        .filter(Boolean)
    );

    container.addEventListener("change", (event) => {
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement) ||
        (target.type !== "checkbox" && target.type !== "radio")
      ) {
        return;
      }

      if (target.checked) {
        const targetId = String(target.value || "").trim().toLowerCase();
        if (normalizedExclusiveIds.has(targetId)) {
          for (const input of container.querySelectorAll("input[type=checkbox], input[type=radio]")) {
            if (input === target) continue;
            const inputId = String(input.value || "").trim().toLowerCase();
            if (normalizedExclusiveIds.has(inputId)) {
              input.checked = false;
            }
          }
        }
      }

      recomputeForSessionReset();
    });

    container.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const pill = target.closest(DEFAULT_PILL_INTERACTION_SELECTOR);
      if (!pill || !container.contains(pill)) return;
      queueMicrotask(recomputeForSessionReset);
    });
  };

  const clearCheckboxesInContainer = (containerId) => {
    const container = $(containerId);
    if (!container) return;
    for (const checkbox of container.querySelectorAll("input[type=checkbox]")) {
      checkbox.checked = false;
    }
  };

  const characterModal = $("characterModal");
  const openCharacterModalButton = $("openCharacterModal");
  const closeCharacterModalButton = $("closeCharacterModal");
  const clearCharactersButton = $("clearCharacters");
  const characterSearchInput = $("characterSearch");
  const characterListEl = $("characterList");
  const applyCharactersButton = $("applyCharacters");
  const CHARACTER_NO_MATCHES_ROW_ID = "characterNoMatchesRow";
  let draftSelectedCharacterPhrases = [];

  const characterListEntries = (() => {
    const out = [];
    const seen = new Set();
    for (const entry of characterItems) {
      const phrase = String(entry?.phrase || "").trim();
      const tag = String(entry?.tag || "").trim();
      if (!phrase || !tag) continue;
      const key = `${phrase.toLowerCase()}::${tag.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ phrase, tag });
    }
    out.sort((a, b) => a.phrase.localeCompare(b.phrase));
    return out;
  })();

  const updateCharacterButtonLabel = () => {
    if (!openCharacterModalButton) return;
    openCharacterModalButton.textContent = `Characters (${selectedCharacterPhrases.length})`;
  };

  const buildCharacterList = () => {
    if (!characterListEl) return;
    characterListEl.innerHTML = "";

    const selectedSet = new Set(
      draftSelectedCharacterPhrases.map((phrase) => phrase.toLowerCase())
    );

    for (const entry of characterListEntries) {
      const phrase = String(entry.phrase || "");

      const row = document.createElement("label");
      row.className = "characterItem";
      row.dataset.phrase = phrase;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = selectedSet.has(phrase.toLowerCase());
      checkbox.dataset.phrase = phrase;
      checkbox.dataset.tag = String(entry.tag || "");

      const text = document.createElement("span");
      text.textContent = phrase;

      row.appendChild(checkbox);
      row.appendChild(text);
      characterListEl.appendChild(row);
    }
  };

  const applyCharacterSearchFilter = () => {
    if (!characterListEl) return;
    const query = String(characterSearchInput?.value || "").trim().toLowerCase();
    let visibleCount = 0;

    for (const row of characterListEl.querySelectorAll(".characterItem")) {
      const phrase = String(row.dataset.phrase || row.textContent || "").toLowerCase();
      const shouldShow = query === "" || phrase.includes(query);
      row.style.display = shouldShow ? "" : "none";
      if (shouldShow) visibleCount += 1;
    }

    const existingNoMatchesRow = characterListEl.querySelector(
      `#${CHARACTER_NO_MATCHES_ROW_ID}`
    );
    const shouldShowNoMatches = query !== "" && visibleCount === 0;

    if (shouldShowNoMatches) {
      if (!existingNoMatchesRow) {
        const noMatchesRow = document.createElement("div");
        noMatchesRow.id = CHARACTER_NO_MATCHES_ROW_ID;
        noMatchesRow.textContent = "No matches";
        noMatchesRow.setAttribute("aria-live", "polite");
        noMatchesRow.style.padding = "0.35rem 0.15rem";
        noMatchesRow.style.color = "var(--text-2)";
        noMatchesRow.style.fontSize = "0.86rem";
        noMatchesRow.style.pointerEvents = "none";
        characterListEl.appendChild(noMatchesRow);
      }
    } else if (existingNoMatchesRow) {
      existingNoMatchesRow.remove();
    }
  };

  const getCheckedCharacterPhrasesFromList = () => {
    if (!characterListEl) return [];
    return dedupePreserveOrder(
      Array.from(characterListEl.querySelectorAll("input[type=checkbox]:checked"))
        .map((el) => String(el.dataset.phrase || "").trim())
        .filter(Boolean)
    );
  };

  const setCharacterModalVisible = (visible) => {
    if (!characterModal) return;
    if (visible) {
      characterModal.classList.remove("hidden");
      characterModal.setAttribute("aria-hidden", "false");
    } else {
      characterModal.classList.add("hidden");
      characterModal.setAttribute("aria-hidden", "true");
    }
  };

  const showCharacterModal = () => {
    draftSelectedCharacterPhrases = [...selectedCharacterPhrases];
    if (characterSearchInput) {
      characterSearchInput.value = "";
    }
    buildCharacterList();
    applyCharacterSearchFilter();
    setCharacterModalVisible(true);
    characterSearchInput?.focus();
  };

  const hideCharacterModal = () => {
    setCharacterModalVisible(false);
  };

  const clearCharactersSelection = ({ shouldCloseModal = true, shouldRecompute = true } = {}) => {
    selectedCharacterPhrases = [];
    draftSelectedCharacterPhrases = [];
    if (characterSearchInput) {
      characterSearchInput.value = "";
    }
    if (characterListEl) {
      for (const checkbox of characterListEl.querySelectorAll("input[type=checkbox]")) {
        checkbox.checked = false;
      }
    }
    buildCharacterList();
    applyCharacterSearchFilter();
    updateCharacterButtonLabel();
    applyCharactersHeaderToMainText([]);
    if (shouldCloseModal) {
      hideCharacterModal();
    }
    if (shouldRecompute) {
      recomputeForSessionReset();
    }
  };

  const resetAllUi = () => {
    selectedCharacterPhrases = [];
    draftSelectedCharacterPhrases = [];
    updateCharacterButtonLabel();

    if ($("mainText")) $("mainText").value = "";
    if ($("loraTriggers")) $("loraTriggers").value = "";
    if ($("rawHelperToggle")) {
      $("rawHelperToggle").checked = RAW_HELPER_DEFAULT_ENABLED;
    }

    if ($("ratingSfw")) $("ratingSfw").checked = true;
    if ($("ratingSuggestive")) $("ratingSuggestive").checked = false;
    if ($("ratingNsfw")) $("ratingNsfw").checked = false;
    if ($("ratingExplicit")) $("ratingExplicit").checked = false;

    if ($("cameraFraming")) $("cameraFraming").value = "";
    if ($("cameraAngle")) $("cameraAngle").value = "";
    if ($("lighting")) $("lighting").value = "";
    if ($("timeOfDay")) $("timeOfDay").value = "";
    if ($("presetPicker")) {
      $("presetPicker").value = presetById.has("pony_default") ? "pony_default" : "";
    }

    clearCheckboxesInContainer("compositionToggles");
    clearCheckboxesInContainer("styleModifiers");
    applyCurrentStyleModifierCompatibility({ clearIncompatibleSelection: true });
    if (characterSearchInput) characterSearchInput.value = "";
    buildCharacterList();
    applyCharacterSearchFilter();
    hideCharacterModal();

    setCopyStatus("");
    recompute({ resetLocks: true });
  };

  buildCharacterList();
  applyCharacterSearchFilter();
  updateCharacterButtonLabel();

  recomputeForSessionResetDebounced = debounce(
    recomputeForSessionReset,
    INPUT_RECOMPUTE_DEBOUNCE_MS
  );

  $("mainText").addEventListener("input", recomputeForSessionResetDebounced);
  $("mainText").addEventListener("input", scheduleBackgroundPrep);
  $("loraTriggers")?.addEventListener("input", recomputeForSessionResetDebounced);
  $("loraTriggers")?.addEventListener("input", scheduleBackgroundPrep);
  $("presetPicker").addEventListener("change", () => {
    applyCurrentStyleModifierCompatibility({ clearIncompatibleSelection: true });
    recomputeForSessionReset();
    scheduleBackgroundPrep();
  });
  $("cameraFraming").addEventListener("change", recomputeForSessionReset);
  $("cameraAngle").addEventListener("change", recomputeForSessionReset);
  $("lighting").addEventListener("change", recomputeForSessionReset);
  $("timeOfDay").addEventListener("change", recomputeForSessionReset);
  $("ratingSfw").addEventListener("change", recomputeForSessionReset);
  $("ratingSuggestive").addEventListener("change", recomputeForSessionReset);
  $("ratingNsfw").addEventListener("change", recomputeForSessionReset);
  $("ratingExplicit").addEventListener("change", recomputeForSessionReset);
  $("ratingSfw").addEventListener("change", scheduleBackgroundPrep);
  $("ratingSuggestive").addEventListener("change", scheduleBackgroundPrep);
  $("ratingNsfw").addEventListener("change", scheduleBackgroundPrep);
  $("ratingExplicit").addEventListener("change", scheduleBackgroundPrep);
  $("rawHelperToggle")?.addEventListener("change", recomputeForSessionReset);
  enforceExclusiveCheckboxGroupInContainer(
    "compositionToggles",
    COMPOSITION_BACKGROUND_EXCLUSIVE_TAGS
  );
  enforceSingleSelectInContainer("styleModifiers");

  $("positiveOut").addEventListener("input", () => {
    positiveLockedByUser = true;

    if (!negativeLockedByUser) {
      const rating = currentRatingValue();
      const preset = selectedPreset(presetById);
      const mods = selectedModifierTags(modifierById);
      const userText = readMainTextareaValue();
      refreshNegativeFromCurrentPositive(userText, rating, preset, mods);
    }
  });

  $("negativeOut").addEventListener("input", () => {
    negativeLockedByUser = true;
  });

  $("resetTags").addEventListener("click", () => {
    resetAllUi();
  });

  openCharacterModalButton?.addEventListener("click", showCharacterModal);
  closeCharacterModalButton?.addEventListener("click", hideCharacterModal);
  clearCharactersButton?.addEventListener("click", () => {
    clearCharactersSelection({ shouldCloseModal: true, shouldRecompute: true });
  });
  characterSearchInput?.addEventListener("input", applyCharacterSearchFilter);
  characterListEl?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
      return;
    }

    draftSelectedCharacterPhrases = getCheckedCharacterPhrasesFromList();
  });
  applyCharactersButton?.addEventListener("click", () => {
    selectedCharacterPhrases = getCheckedCharacterPhrasesFromList();
    draftSelectedCharacterPhrases = [...selectedCharacterPhrases];
    applyCharactersHeaderToMainText(selectedCharacterPhrases);
    updateCharacterButtonLabel();
    hideCharacterModal();
    recomputeForSessionReset();
  });
  characterModal?.addEventListener("click", (event) => {
    if (event.target === characterModal) {
      hideCharacterModal();
    }
  });

  $("copyPositive").addEventListener("click", async () => {
    const ok = await copyText($("positiveOut").value);
    showCopyStatus(ok ? "Copied!" : "Copy failed", ok ? 1200 : 0);
  });

  $("copyNegative").addEventListener("click", async () => {
    const ok = await copyText($("negativeOut").value);
    showCopyStatus(ok ? "Copied!" : "Copy failed", ok ? 1200 : 0);
  });

  recompute();
  startBackgroundPrepAfterBoot();

  window.addEventListener("beforeunload", () => {
    if (backgroundPrepHandle !== null) {
      cancelIdleTask(backgroundPrepHandle);
      backgroundPrepHandle = null;
    }
  });
}

main().catch((err) => {
  console.error(err);
  const bootError = $("bootError");
  if (bootError) {
    bootError.textContent = String(err?.message || err);
  }
});

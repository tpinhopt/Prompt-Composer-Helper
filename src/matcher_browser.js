// src/matcher_browser.js
import {
  buildControlledPhraseTokenVariants,
  controlledInterveningWords,
  extractMappingPairs,
  isAllowedInterTokenSeparator,
  isWordChar,
  normalizeTextWithMap,
  phraseTokensFromText,
  shouldAllowInterveningWordsForTag,
} from "./matcher_shared.js";

function tokenizeWithSpans(normalized) {
  const tokens = [];
  const spans = [];

  let i = 0;
  while (i < normalized.length) {
    while (i < normalized.length && normalized[i] === " ") i += 1;
    if (i >= normalized.length) break;

    const start = i;
    while (i < normalized.length && normalized[i] !== " ") i += 1;
    const end = i;

    tokens.push(normalized.slice(start, end));
    spans.push({ start, end });
  }

  return { tokens, spans };
}

function matchRespectsRawBoundaries(rawTextLower, normToRaw, spans, startTokenIdx, endTokenIdxExclusive) {
  if (!Array.isArray(spans) || !spans.length) return false;
  if (!Array.isArray(normToRaw) || !normToRaw.length) return false;
  if (!Number.isFinite(startTokenIdx) || !Number.isFinite(endTokenIdxExclusive)) return false;
  if (endTokenIdxExclusive <= startTokenIdx) return false;

  const first = spans[startTokenIdx];
  const last = spans[endTokenIdxExclusive - 1];
  if (!first || !last) return false;
  if (last.end <= first.start) return false;
  if (first.start >= normToRaw.length || last.end - 1 >= normToRaw.length) return false;

  const rawStart = normToRaw[first.start];
  const rawEnd = normToRaw[last.end - 1] + 1;
  if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd) || rawEnd <= rawStart) return false;

  const prev = rawStart === 0 ? "" : rawTextLower[rawStart - 1];
  const next = rawEnd >= rawTextLower.length ? "" : rawTextLower[rawEnd];
  if (prev && isWordChar(prev)) return false;
  if (next && isWordChar(next)) return false;

  if (endTokenIdxExclusive - startTokenIdx <= 1) return true;

  for (let i = startTokenIdx; i < endTokenIdxExclusive - 1; i += 1) {
    const left = spans[i];
    const right = spans[i + 1];
    if (!left || !right) return false;
    if (left.end <= left.start || right.end <= right.start) return false;
    if (left.end - 1 >= normToRaw.length || right.start >= normToRaw.length) return false;

    const sepStart = normToRaw[left.end - 1] + 1;
    const sepEnd = normToRaw[right.start];
    if (!Number.isFinite(sepStart) || !Number.isFinite(sepEnd) || sepEnd <= sepStart) {
      return false;
    }

    const separator = rawTextLower.slice(sepStart, sepEnd);
    if (!isAllowedInterTokenSeparator(separator)) return false;
  }

  return true;
}

function findMatchEndIndex(tokens, used, startIndex, entry, ignorableWordsSet) {
  const expectedTokens = Array.isArray(entry?.tokens) ? entry.tokens : [];
  if (!expectedTokens.length) return -1;
  if (startIndex >= tokens.length || used[startIndex]) return -1;
  if (tokens[startIndex] !== expectedTokens[0]) return -1;

  let cursor = startIndex;
  for (let j = 1; j < expectedTokens.length; j += 1) {
    cursor += 1;
    if (entry?.allowInterveningWords) {
      while (cursor < tokens.length && !used[cursor] && ignorableWordsSet.has(tokens[cursor])) {
        cursor += 1;
      }
    }
    if (cursor >= tokens.length || used[cursor]) return -1;
    if (tokens[cursor] !== expectedTokens[j]) return -1;
  }

  return cursor + 1;
}

export function buildMatcherFromData(data) {
  const { pairs, totalTags } = extractMappingPairs(data);
  if (!pairs.length) {
    throw new Error("Invalid mapping JSON: expected { tags: [...] } or { items: [...] }");
  }

  const canonicalTagSet = new Set(
    pairs.map((pair) => String(pair?.tag ?? "").trim().toLowerCase()).filter(Boolean)
  );
  const ignorableWordsSet = new Set(controlledInterveningWords());
  const entries = [];
  const seenEntryKeys = new Set();
  for (const pair of pairs) {
    const tag = String(pair?.tag ?? "").trim();
    const phraseTokens = phraseTokensFromText(pair?.phrase);
    if (!tag || !phraseTokens.length) continue;

    const tokenVariants = buildControlledPhraseTokenVariants(phraseTokens, tag, canonicalTagSet);
    for (const tokens of tokenVariants) {
      if (!Array.isArray(tokens) || !tokens.length) continue;
      const phraseNorm = tokens.join(" ");
      const key = `${String(tag).toLowerCase()}::${phraseNorm}`;
      if (seenEntryKeys.has(key)) continue;
      seenEntryKeys.add(key);

      const allowInterveningWords =
        shouldAllowInterveningWordsForTag(tag) && tokens.length >= 2;
      const requiredTokens = Array.from(
        new Set(
          tokens.filter(
            (token) => !allowInterveningWords || !ignorableWordsSet.has(String(token || ""))
          )
        )
      );
      entries.push({
        tag,
        phrase: phraseNorm,
        tokens,
        requiredTokens,
        allowInterveningWords,
        first: tokens[0],
        wordCount: tokens.length,
        charCount: phraseNorm.length,
      });
    }
  }

  entries.sort((a, b) => {
    if (b.wordCount !== a.wordCount) return b.wordCount - a.wordCount;
    if (b.charCount !== a.charCount) return b.charCount - a.charCount;
    if (a.phrase !== b.phrase) return a.phrase < b.phrase ? -1 : 1;
    if (a.tag !== b.tag) return a.tag < b.tag ? -1 : 1;
    return 0;
  });

  const byFirst = new Map();
  for (const e of entries) {
    if (!byFirst.has(e.first)) byFirst.set(e.first, []);
    byFirst.get(e.first).push(e);
  }

  function extract(userText) {
    const rawTextLower = String(userText ?? "").toLowerCase();
    const { normalized, normToRaw } = normalizeTextWithMap(rawTextLower);
    if (!normalized) return { matchedTags: [], matchedPhrases: [], normalized };

    const { tokens, spans } = tokenizeWithSpans(normalized);
    if (!tokens.length) return { matchedTags: [], matchedPhrases: [], normalized };

    const used = new Array(tokens.length).fill(false);
    const tokenSet = new Set(tokens);

    const matchedPhrases = [];
    const matchedTags = [];
    const seenTags = new Set();

    for (let i = 0; i < tokens.length; i++) {
      if (used[i]) continue;

      const candidates = byFirst.get(tokens[i]);
      if (!candidates) continue;

      let matchedEntry = null;

      for (const e of candidates) {
        const requiredTokens = Array.isArray(e.requiredTokens) ? e.requiredTokens : e.tokens;
        if (requiredTokens.some((token) => !tokenSet.has(token))) continue;

        const end = findMatchEndIndex(tokens, used, i, e, ignorableWordsSet);
        if (end <= i) continue;
        if (!matchRespectsRawBoundaries(rawTextLower, normToRaw, spans, i, end)) continue;

        matchedEntry = { entry: e, end };
        break;
      }

      if (matchedEntry) {
        const matched = matchedEntry.entry;
        const end = matchedEntry.end;
        for (let k = i; k < end; k++) used[k] = true;

        matchedPhrases.push({ tag: matched.tag, phrase: matched.phrase });

        if (!seenTags.has(matched.tag)) {
          seenTags.add(matched.tag);
          matchedTags.push(matched.tag);
        }

        i = end - 1;
      }
    }

    return { matchedTags, matchedPhrases, normalized };
  }

  return {
    extract,
    stats: {
      totalEntries: entries.length,
      totalTags,
      uniqueFirstTokens: byFirst.size,
      version: data.version ?? null,
    },
  };
}

// same logic as before, but loads mapping via fetch instead of fs
export async function buildMatcherFromUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const data = await res.json();

  try {
    return buildMatcherFromData(data);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Invalid mapping JSON")) {
      throw new Error(
        `Invalid mapping JSON at ${url}: expected { tags: [...] } or { items: [...] }`
      );
    }
    throw err;
  }
}

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function stripModuleSyntax(source) {
  return String(source)
    // remove all import lines (best-effort)
    .replace(/^\s*import[\s\S]*?;\s*$/gm, "")
    // remove "export default ..."
    .replace(/^\s*export\s+default\s+/gm, "")
    // remove "export { ... }" blocks (single or multi-line)
    .replace(/^\s*export\s*\{[\s\S]*?\}\s*;?\s*$/gm, "")
    // remove "export " keyword for declarations
    .replace(/^\s*export\s+/gm, "")
    .trim();
}

function escapeScriptContent(text) {
  return String(text).replace(/<\/script/gi, "<\\/script");
}

async function read(file) {
  return fs.readFile(path.join(ROOT, file), "utf8");
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Manifest must be an object");
  }
  if (!manifest.active || typeof manifest.active !== "object" || Array.isArray(manifest.active)) {
    throw new Error("Manifest must include an active object");
  }
}

function toPackEmbedId(packKey) {
  return `pack-${packKey}`;
}

function parseJsonOrThrow(raw, sourceLabel) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON in ${sourceLabel}: ${detail}`);
  }
}

async function buildBundle() {
  const sharedSrc = await read("src/matcher_shared.js");
  const browserSrc = await read("src/matcher_browser.js");
  const appSrc = await read("src/app.js");

  const sharedInline = stripModuleSyntax(sharedSrc);
  const browserInline = stripModuleSyntax(browserSrc);
  const appInline = stripModuleSyntax(appSrc);

  return [
    "const __pc_modules = Object.create(null);",
    "",
    "// inlined module: src/matcher_shared.js",
    "__pc_modules.matcher_shared = (() => {",
    sharedInline,
    "  return {",
    "    buildControlledPhraseTokenVariants,",
    "    controlledInterveningWords,",
    "    extractMappingPairs,",
    "    isAllowedInterTokenSeparator,",
    "    isWordChar,",
    "    normalizeTextWithMap,",
    "    phraseTokensFromText,",
    "    shouldAllowInterveningWordsForTag,",
    "    escapeRegexLiteral,",
    "  };",
    "})();",
    "",
    "// inlined module: src/matcher_browser.js",
    "__pc_modules.matcher_browser = (() => {",
    "  const {",
    "    buildControlledPhraseTokenVariants,",
    "    controlledInterveningWords,",
    "    extractMappingPairs,",
    "    isAllowedInterTokenSeparator,",
    "    isWordChar,",
    "    normalizeTextWithMap,",
    "    phraseTokensFromText,",
    "    shouldAllowInterveningWordsForTag,",
    "  } = __pc_modules.matcher_shared;",
    browserInline,
    "  return {",
    "    buildMatcherFromData,",
    "    buildMatcherFromUrl,",
    "  };",
    "})();",
    "",
    "// inlined module: src/app.js",
    "(() => {",
    "  const { buildMatcherFromData } = __pc_modules.matcher_browser;",
    "  const { escapeRegexLiteral } = __pc_modules.matcher_shared;",
    appInline,
    "})();",
    "",
  ].join("\n");
}

async function buildJsonBlocks() {
  const manifestRaw = await read("data/packs_manifest.json");
  const manifest = parseJsonOrThrow(manifestRaw, "data/packs_manifest.json");
  validateManifest(manifest);

  const blocks = [];
  const compactManifest = escapeScriptContent(JSON.stringify(manifest));
  blocks.push(
    `<script type="application/json" id="pack-manifest">${compactManifest}</script>`
  );

  for (const [packKey, fileNameRaw] of Object.entries(manifest.active)) {
    const fileName = String(fileNameRaw || "").trim();
    if (!fileName) {
      throw new Error(`Manifest pack '${packKey}' must map to a JSON filename`);
    }
    const relativeFile = path.posix.join("data", fileName);
    const raw = await read(relativeFile);
    const parsed = parseJsonOrThrow(raw, relativeFile);
    const compact = escapeScriptContent(JSON.stringify(parsed));
    blocks.push(
      `<script type="application/json" id="${toPackEmbedId(packKey)}">${compact}</script>`
    );
  }
  return blocks.join("\n");
}

function buildOutputHtml(templateHtml, cssText, jsonBlocks, moduleCode) {
  let html = templateHtml;

  html = html.replace(
    /\s*<link\s+rel="stylesheet"\s+href="\/src\/styles\.css"\s*\/>\s*/i,
    "\n"
  );
  html = html.replace(
    /\s*<script\s+type="module"\s+src="\/src\/app\.js"><\/script>\s*/i,
    "\n"
  );

  html = html.replace(/<\/head>/i, () => `  <style>\n${cssText}\n  </style>\n</head>`);

  const bodyInjection = [
    jsonBlocks,
    `<script type="module">\n${escapeScriptContent(moduleCode)}\n</script>`,
  ].join("\n");

  html = html.replace(/<\/body>/i, () => `${bodyInjection}\n  </body>`);

  return html;
}

async function main() {
  const [templateHtml, cssText, moduleCode, jsonBlocks] = await Promise.all([
    read("src/index.html"),
    read("src/styles.css"),
    buildBundle(),
    buildJsonBlocks(),
  ]);

  const outputHtml = buildOutputHtml(templateHtml, cssText, jsonBlocks, moduleCode);
  const distDir = path.join(ROOT, "dist");
  const outFile = path.join(distDir, "index.html");

  await fs.mkdir(distDir, { recursive: true });
  await fs.writeFile(outFile, outputHtml, "utf8");

  console.log(`Built ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

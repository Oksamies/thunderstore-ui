/**
 * Regenerates the *-latin.woff2 companions next to each full font, and appends
 * a matching latin @font-face to each font CSS file.
 *
 * The shipped fonts carry the full Inter/Hubot charset — 2857 codepoints for
 * Inter-Regular, including Cyrillic, Greek, Vietnamese and ~1000 symbols up to
 * U+1F852 — which costs ~106 KiB per weight. A latin subset is ~26 KiB.
 *
 * How the two faces cooperate: per the CSS Fonts spec, when several @font-face
 * rules share a family/weight/style, the LAST one declaring a given codepoint
 * wins. So the full font is declared first with no unicode-range (it covers
 * everything) and the latin subset second. Latin text therefore resolves to the
 * subset and the full file is never fetched; text outside the range still
 * resolves to the full file, so nothing renders in a fallback font. A page
 * mixing both scripts fetches both, which is the deliberate trade — sampled
 * listing pages are 100% latin.
 *
 * Run manually when the font files change (needs `npm i subset-font` in a
 * scratch dir; it is not a repo dependency since this runs about never):
 *   node scripts/subset-fonts.mjs /path/to/node_modules/subset-font
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONT_ROOT = path.join(HERE, "..", "src", "styles", "fonts");
const DIRS = ["inter", "hubot-sans"];

// Google Fonts' "latin" range, plus the handful of characters our own UI uses
// outside it. Anything the chrome renders has to be in here, otherwise a single
// glyph pulls the whole ~106 KiB fallback file on every page: the footer's
// U+2764 heart was doing exactly that. User-authored text (a mod description
// with IPA, say) will still reach for the fallback, which is fine — that is
// rare and genuinely needs the glyphs.
const LATIN_RANGE =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, " +
  "U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, " +
  "U+2193, U+2212, U+2215, U+2764, U+FE0F, U+FEFF, U+FFFD";

const rangeChars = () => {
  const out = [];
  for (const part of LATIN_RANGE.split(",")) {
    const m = part.trim().match(/^U\+([0-9A-F]+)(?:-([0-9A-F]+))?$/i);
    if (!m) continue;
    const lo = parseInt(m[1], 16);
    const hi = m[2] ? parseInt(m[2], 16) : lo;
    for (let c = lo; c <= hi; c++) out.push(String.fromCodePoint(c));
  }
  return out.join("");
};

const modArg = process.argv[2];
const subsetFont = (
  await import(
    modArg ? pathToFileURL(path.resolve(modArg)).href : "subset-font"
  )
).default;
const wanted = rangeChars();
let saved = 0;

for (const dir of DIRS) {
  const abs = path.join(FONT_ROOT, dir);
  for (const file of fs.readdirSync(abs)) {
    if (!file.endsWith(".woff2") || file.includes("-latin.")) continue;
    const src = fs.readFileSync(path.join(abs, file));
    const out = await subsetFont(src, wanted, { targetFormat: "woff2" });
    const dest = file.replace(/\.woff2$/, "-latin.woff2");
    fs.writeFileSync(path.join(abs, dest), out);
    saved += src.length - out.length;
    console.log(
      `${dir}/${file}: ${(src.length / 1024).toFixed(1)} -> ${(
        out.length / 1024
      ).toFixed(1)} KiB`
    );
  }

  // Append a latin face after every existing one, leaving the originals as-is.
  for (const css of fs.readdirSync(abs).filter((f) => f.endsWith(".css"))) {
    const p = path.join(abs, css);
    let text = fs.readFileSync(p, "utf8");
    if (text.includes("-latin.woff2")) {
      console.log(`  ${css}: already has latin faces, skipping`);
      continue;
    }
    text = text.replace(/( *)@font-face \{[\s\S]*?\n\1\}/g, (block, indent) => {
      const url = block.match(/url\("([^"]+\.woff2)"\)/);
      if (!url) return block;
      const latin = block
        .replace(url[1], url[1].replace(/\.woff2$/, "-latin.woff2"))
        .replace(
          /(\n\1?\s*font-display: swap;)/,
          `$1\n${indent}  unicode-range: ${LATIN_RANGE};`
        );
      return `${block}\n\n${latin}`;
    });
    fs.writeFileSync(p, text);
    console.log(`  ${css}: latin faces appended`);
  }
}

console.log(
  `\ntotal saved for latin-only pages: ${(saved / 1024).toFixed(0)} KiB`
);

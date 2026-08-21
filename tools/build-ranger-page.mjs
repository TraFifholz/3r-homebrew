import { readFile, writeFile } from "node:fs/promises";

const sourcePath = new URL("../sources/ranger-update.txt", import.meta.url);
const outputPath = new URL("../ranger-update.html", import.meta.url);
const source = (await readFile(sourcePath, "utf8")).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();

const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const formatValue = (value) => escapeHtml(value.trim()).replace(/\n+/g, "<br>");

function between(start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Missing boundary: ${start} -> ${end}`);
  return source.slice(startIndex + start.length, endIndex).trim();
}

function parseFieldChunks(block, headingPattern, fields) {
  const matches = [...block.matchAll(headingPattern)];
  return matches.map((match, index) => {
    const chunk = block.slice(match.index + match[0].length, matches[index + 1]?.index ?? block.length).trim();
    const parsed = {};
    const fieldPattern = new RegExp(`^(${fields.join("|")})：`, "gm");
    const fieldMatches = [...chunk.matchAll(fieldPattern)];
    for (let fieldIndex = 0; fieldIndex < fieldMatches.length; fieldIndex += 1) {
      const field = fieldMatches[fieldIndex];
      parsed[field[1]] = chunk.slice(field.index + field[0].length, fieldMatches[fieldIndex + 1]?.index ?? chunk.length).trim();
    }
    return { name: match[1].trim(), fields: parsed };
  });
}

const feats = parseFieldChunks(
  between("巡林客专长：", "巡林客职业替换能力："),
  /^([^\n]+)\[一般\]\s*$/gm,
  ["前提", "效果", "特殊"],
);

const animalMarker = "\n动物之力：\n\n獾（Badger）：";
const firstVariantBlock = between("巡林客职业替换能力：", animalMarker);
const laterVariantMarker = "\n\n游侠奇术\n\n限制：";
const animalBlock = `獾（Badger）：\n${between(animalMarker, laterVariantMarker)}`;
const laterVariantBlock = `游侠奇术\n\n限制：${source.slice(source.indexOf(laterVariantMarker) + laterVariantMarker.length).trim()}`;
const variantPattern = /^([^\n：]+)\n\n限制：/gm;
const variants = [
  ...parseFieldChunks(firstVariantBlock, variantPattern, ["限制", "等级", "失去", "得到", "特殊"]),
  ...parseFieldChunks(laterVariantBlock, variantPattern, ["限制", "等级", "失去", "得到", "特殊"]),
];

const animals = parseFieldChunks(
  animalBlock,
  /^([^\n]+（[^）]+）)：?\s*$/gm,
  ["基础", "次级", "中级", "高级"],
);

if (feats.length !== 3 || variants.length !== 7 || animals.length !== 26) {
  throw new Error(`Unexpected counts: ${JSON.stringify({ feats: feats.length, variants: variants.length, animals: animals.length })}`);
}

let sequence = 0;
function renderEntries(entries, category, label, order) {
  return entries.map((entry) => {
    sequence += 1;
    const id = `ranger-${category}-${String(sequence).padStart(2, "0")}`;
    const fieldHtml = order.filter((field) => entry.fields[field]).map((field) => `<div><dt>${field}</dt><dd>${formatValue(entry.fields[field])}</dd></div>`).join("\n");
    return `<article class="scout-entry" id="${id}" data-category="${category}">
      <header><div><p class="type-label">${label}</p><h3>${escapeHtml(entry.name)}</h3></div><button class="copy-link" type="button" data-anchor="${id}">链接</button></header>
      <dl class="entry-fields">${fieldHtml}</dl>
    </article>`;
  }).join("\n");
}

const totalEntries = feats.length + variants.length + animals.length;
const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#16130f" />
    <meta name="description" content="D&D 3.5e 中文房规：巡林客专长、职业替换能力与动物之力更新。" />
    <meta property="og:title" content="巡林客更新｜3R Homebrew" />
    <meta property="og:description" content="巡林客专长、职业替换能力与26种动物之力面相。" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://trafifholz.github.io/3r-homebrew/ranger-update.html" />
    <meta name="twitter:card" content="summary" />
    <title>巡林客更新｜3R Homebrew</title>
    <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="styles.css" />
    <script src="ranger-library.js" defer></script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">3R</span><strong>Homebrew</strong></a>
      <nav aria-label="主导航"><a href="index.html">扩展技法</a><a href="domain-feats.html">领域专长</a><a href="feats.html">专长</a><a href="cleric-variants.html">牧师</a><a href="scout-rework.html">斥候</a><a href="ranger-update.html" aria-current="page">巡林客</a><a href="rogue-update.html">游荡者</a><a href="bard-movements.html">诗人</a><a href="prestige-classes.html">进阶职业</a><a href="harrowing.html">哈罗占卜</a><a href="harrow-equipment.html">装备</a><a href="https://github.com/TraFifholz/3r-homebrew" target="_blank" rel="noreferrer">GitHub ↗</a></nav>
    </header>
    <main>
      <section class="library section-shell ranger-library" id="library" aria-labelledby="library-title">
        <div class="section-heading library-heading"><div><p class="eyebrow">职业更新 · ${totalEntries} 项规则条目</p><h2 id="library-title">巡林客（Ranger）</h2></div><p id="result-count" role="status" aria-live="polite">共 ${totalEntries} 项</p></div>
        <div class="toolbar scout-toolbar" aria-label="巡林客规则筛选工具">
          <label class="search-box"><span class="sr-only">搜索巡林客规则</span><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="搜索专长、替换能力、动物或规则文字…" autocomplete="off" /><kbd>/</kbd></label>
          <div class="type-filters" id="ranger-filters" role="group" aria-label="按规则分类筛选"><button class="filter is-active" type="button" data-category="全部" aria-pressed="true">全部</button><button class="filter" type="button" data-category="feat" aria-pressed="false">专长</button><button class="filter" type="button" data-category="variant" aria-pressed="false">职业替换</button><button class="filter" type="button" data-category="animal" aria-pressed="false">动物之力</button></div>
        </div>
        <section class="scout-section" data-section="feat"><h3>巡林客专长 <span>${feats.length}</span></h3><div class="scout-entries">${renderEntries(feats, "feat", "一般专长", ["前提", "效果", "特殊"])}</div></section>
        <section class="scout-section" data-section="variant"><h3>职业替换能力 <span>${variants.length}</span></h3><div class="scout-entries">${renderEntries(variants, "variant", "职业替换能力", ["限制", "等级", "失去", "得到", "特殊"])}</div></section>
        <section class="scout-section" data-section="animal"><h3>动物之力面相 <span>${animals.length}</span></h3><div class="scout-entries">${renderEntries(animals, "animal", "动物之力", ["基础", "次级", "中级", "高级"])}</div></section>
        <div class="empty-state" id="ranger-empty" hidden><p class="empty-glyph" aria-hidden="true">∅</p><h3>没有找到对应规则</h3><p>试试缩短关键词或切换分类。</p><button class="button button-ghost" id="clear-ranger" type="button">清除筛选</button></div>
      </section>
    </main>
  </body>
</html>`;

await writeFile(outputPath, `${html}\n`, "utf8");
console.log(JSON.stringify({ output: outputPath.pathname, feats: feats.length, variants: variants.length, animals: animals.length, totalEntries }, null, 2));

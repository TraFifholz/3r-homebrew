import { readFile, writeFile } from "node:fs/promises";

const sourcePath = new URL("../sources/bard-movements.txt", import.meta.url);
const outputPath = new URL("../bard-movements.html", import.meta.url);
const source = (await readFile(sourcePath, "utf8")).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();

const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const formatValue = (value) => escapeHtml(value.trim()).replace(/\n+/g, "<br>");
const categories = [
  { key: "basic", name: "基础", label: "基础乐章" },
  { key: "lesser", name: "次级", label: "次级乐章" },
  { key: "greater", name: "高级", label: "高级乐章" },
  { key: "epic", name: "史诗", label: "史诗乐章" },
];

const firstMarker = "基础乐章：";
const introStart = source.indexOf("诗人乐章") + "诗人乐章".length;
const introEnd = source.indexOf(firstMarker);
if (introStart < "诗人乐章".length || introEnd < 0) throw new Error("Missing bard movement introduction");
const intro = source.slice(introStart, introEnd).trim();

function parseCategory(category, index) {
  const marker = `${category.name}乐章：`;
  const start = source.indexOf(marker);
  const nextMarker = categories[index + 1] ? `${categories[index + 1].name}乐章：` : null;
  const end = nextMarker ? source.indexOf(nextMarker, start + marker.length) : source.length;
  if (start < 0 || end < 0) throw new Error(`Missing category boundary: ${category.name}`);
  const block = source.slice(start + marker.length, end).replace(/^—+|—+$/gm, "").trim();
  const matches = [...block.matchAll(/^([^\n：—]+)：?\s*\n\s*\n前提：/gm)];
  return matches.map((match, entryIndex) => {
    const chunk = block.slice(match.index + match[1].length, matches[entryIndex + 1]?.index ?? block.length).replace(/^：/, "").trim();
    const fields = {};
    const fieldMatches = [...chunk.matchAll(/^(前提|类别|启动|持续时间|专注维持|维持专注|效果)：/gm)];
    fieldMatches.forEach((field, fieldIndex) => {
      const name = field[1] === "维持专注" ? "专注维持" : field[1];
      fields[name] = chunk.slice(field.index + field[0].length, fieldMatches[fieldIndex + 1]?.index ?? chunk.length).replace(/\n—+\s*$/g, "").trim();
    });
    return { name: match[1].trim(), fields };
  });
}

const parsed = categories.map((category, index) => ({ ...category, entries: parseCategory(category, index) }));
const expected = [13, 24, 16, 5];
parsed.forEach((category, index) => {
  if (category.entries.length !== expected[index]) throw new Error(`Unexpected ${category.name} count: ${category.entries.length}`);
  category.entries.forEach((entry) => {
    for (const field of ["前提", "类别", "启动", "持续时间", "专注维持", "效果"]) {
      if (!entry.fields[field]) throw new Error(`Missing ${field}: ${entry.name}`);
    }
  });
});

let sequence = 0;
function renderEntries(category) {
  return category.entries.map((entry) => {
    sequence += 1;
    const id = `bard-${category.key}-${String(sequence).padStart(2, "0")}`;
    const fieldHtml = ["前提", "类别", "启动", "持续时间", "专注维持", "效果"].map((field) => `<div><dt>${field}</dt><dd>${formatValue(entry.fields[field])}</dd></div>`).join("\n");
    return `<article class="scout-entry" id="${id}" data-category="${category.key}">
      <header><div><p class="type-label">${category.label}</p><h3>${escapeHtml(entry.name)}</h3></div><button class="copy-link" type="button" data-anchor="${id}">链接</button></header>
      <dl class="entry-fields">${fieldHtml}</dl>
    </article>`;
  }).join("\n");
}

const totalEntries = parsed.reduce((sum, category) => sum + category.entries.length, 0);
const sectionHtml = parsed.map((category) => `<section class="scout-section" data-section="${category.key}"><h3>${category.label} <span>${category.entries.length}</span></h3><div class="scout-entries">${renderEntries(category)}</div></section>`).join("\n");
const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#16130f" />
    <meta name="description" content="D&D 3.5e 中文房规：吟游诗人的基础、次级、高级与史诗乐章。" />
    <meta property="og:title" content="诗人乐章｜3R Homebrew" />
    <meta property="og:description" content="58首吟游诗人乐章及其取得与替换规则。" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://trafifholz.github.io/3r-homebrew/bard-movements.html" />
    <meta name="twitter:card" content="summary" />
    <title>诗人乐章｜3R Homebrew</title>
    <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="styles.css" />
    <script src="bard-library.js" defer></script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">3R</span><strong>Homebrew</strong></a>
      <nav aria-label="主导航"><a href="index.html">扩展技法</a><a href="domain-feats.html">领域专长</a><a href="feats.html">专长</a><a href="cleric-variants.html">牧师</a><a href="scout-rework.html">斥候</a><a href="ranger-update.html">巡林客</a><a href="rogue-update.html">游荡者</a><a href="bard-movements.html" aria-current="page">诗人</a><a href="prestige-classes.html">进阶职业</a><a href="harrowing.html">哈罗占卜</a><a href="harrow-equipment.html">装备</a><a href="https://github.com/TraFifholz/3r-homebrew" target="_blank" rel="noreferrer">GitHub ↗</a></nav>
    </header>
    <main>
      <section class="library section-shell ranger-library" id="library" aria-labelledby="library-title">
        <div class="section-heading library-heading"><div><p class="eyebrow">吟唱扩展 · ${totalEntries} 首乐章</p><h2 id="library-title">诗人乐章</h2></div><p id="result-count" role="status" aria-live="polite">共 ${totalEntries} 首</p></div>
        <article class="scout-entry" id="bard-rules"><header><div><p class="type-label">使用规则</p><h3>取得与替换乐章</h3></div><button class="copy-link" type="button" data-anchor="bard-rules">链接</button></header><div class="entry-fields"><div><dt>规则</dt><dd>${formatValue(intro)}</dd></div></div></article>
        <div class="toolbar scout-toolbar" aria-label="诗人乐章筛选工具">
          <label class="search-box"><span class="sr-only">搜索诗人乐章</span><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="搜索乐章、前提、类别或效果…" autocomplete="off" /><kbd>/</kbd></label>
          <div class="type-filters" id="bard-filters" role="group" aria-label="按乐章等级筛选"><button class="filter is-active" type="button" data-category="全部" aria-pressed="true">全部</button><button class="filter" type="button" data-category="basic" aria-pressed="false">基础</button><button class="filter" type="button" data-category="lesser" aria-pressed="false">次级</button><button class="filter" type="button" data-category="greater" aria-pressed="false">高级</button><button class="filter" type="button" data-category="epic" aria-pressed="false">史诗</button></div>
        </div>
        ${sectionHtml}
        <div class="empty-state" id="bard-empty" hidden><p class="empty-glyph" aria-hidden="true">∅</p><h3>没有找到对应乐章</h3><p>试试缩短关键词或切换等级。</p><button class="button button-ghost" id="clear-bard" type="button">清除筛选</button></div>
      </section>
    </main>
  </body>
</html>`;

await writeFile(outputPath, `${html}\n`, "utf8");
console.log(JSON.stringify({ output: outputPath.pathname, categories: Object.fromEntries(parsed.map((category) => [category.name, category.entries.length])), totalEntries }, null, 2));

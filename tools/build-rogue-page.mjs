import { readFile, writeFile } from "node:fs/promises";

const sourcePath = new URL("../sources/rogue-update.txt", import.meta.url);
const outputPath = new URL("../rogue-update.html", import.meta.url);
const source = (await readFile(sourcePath, "utf8")).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();

const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const formatValue = (value) => escapeHtml(value.trim()).replace(/\n+/g, "<br>");

function between(start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Missing boundary: ${start} -> ${end}`);
  return source.slice(startIndex + start.length, endIndex).trim();
}

const featBlock = between("游荡者专长", "游荡者职业替换能力");
const featMatches = [...featBlock.matchAll(/^([^\n]+)\[一般\]\s*$/gm)];
const feats = featMatches.map((match, index) => {
  const chunk = featBlock.slice(match.index + match[0].length, featMatches[index + 1]?.index ?? featBlock.length).trim();
  const prerequisite = chunk.match(/^先决条件：([^\n]+)$/m)?.[1]?.trim();
  const specialIndex = chunk.indexOf("\n特殊：");
  const effectStart = chunk.indexOf("\n") + 1;
  return {
    name: match[1].trim(),
    fields: {
      "先决条件": prerequisite,
      "效果": chunk.slice(effectStart, specialIndex < 0 ? chunk.length : specialIndex).trim(),
      ...(specialIndex < 0 ? {} : { "特殊": chunk.slice(specialIndex + "\n特殊：".length).trim() }),
    },
  };
});

const variantBlock = source.slice(source.indexOf("游荡者职业替换能力") + "游荡者职业替换能力".length).trim();
const variantMatches = [...variantBlock.matchAll(/^([^\n：]+)\n+限制：/gm)];
const variants = variantMatches.map((match, index) => {
  const chunk = variantBlock.slice(match.index + match[1].length, variantMatches[index + 1]?.index ?? variantBlock.length).trim();
  const fields = {};
  const fieldMatches = [...chunk.matchAll(/^(限制|等级|失去|得到)：/gm)];
  fieldMatches.forEach((field, fieldIndex) => {
    fields[field[1]] = chunk.slice(field.index + field[0].length, fieldMatches[fieldIndex + 1]?.index ?? chunk.length).trim();
  });
  return { name: match[1].trim(), fields };
});

if (feats.length !== 3 || variants.length !== 5) throw new Error(`Unexpected counts: ${JSON.stringify({ feats: feats.length, variants: variants.length })}`);

let sequence = 0;
function renderEntries(entries, category, label, order) {
  return entries.map((entry) => {
    sequence += 1;
    const id = `rogue-${category}-${String(sequence).padStart(2, "0")}`;
    const fieldHtml = order.filter((field) => entry.fields[field]).map((field) => `<div><dt>${field}</dt><dd>${formatValue(entry.fields[field])}</dd></div>`).join("\n");
    return `<article class="scout-entry" id="${id}" data-category="${category}">
      <header><div><p class="type-label">${label}</p><h3>${escapeHtml(entry.name)}</h3></div><button class="copy-link" type="button" data-anchor="${id}">链接</button></header>
      <dl class="entry-fields">${fieldHtml}</dl>
    </article>`;
  }).join("\n");
}

const totalEntries = feats.length + variants.length;
const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#16130f" />
    <meta name="description" content="D&D 3.5e 中文房规：游荡者专长与职业替换能力更新。" />
    <meta property="og:title" content="游荡者更新｜3R Homebrew" />
    <meta property="og:description" content="游荡者专长与职业替换能力。" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://trafifholz.github.io/3r-homebrew/rogue-update.html" />
    <meta name="twitter:card" content="summary" />
    <title>游荡者更新｜3R Homebrew</title>
    <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="styles.css" />
    <script src="rogue-library.js" defer></script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">3R</span><strong>Homebrew</strong></a>
      <nav aria-label="主导航"><a href="index.html">扩展技法</a><a href="domain-feats.html">领域专长</a><a href="cleric-variants.html">职业替换</a><a href="scout-rework.html">斥候重做</a><a href="ranger-update.html">巡林客更新</a><a href="rogue-update.html" aria-current="page">游荡者更新</a><a href="https://github.com/TraFifholz/3r-homebrew" target="_blank" rel="noreferrer">GitHub ↗</a></nav>
    </header>
    <main>
      <section class="library section-shell ranger-library" id="library" aria-labelledby="library-title">
        <div class="section-heading library-heading"><div><p class="eyebrow">职业更新 · ${totalEntries} 项规则条目</p><h2 id="library-title">游荡者（Rogue）</h2></div><p id="result-count" role="status" aria-live="polite">共 ${totalEntries} 项</p></div>
        <div class="toolbar scout-toolbar" aria-label="游荡者规则筛选工具">
          <label class="search-box"><span class="sr-only">搜索游荡者规则</span><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="搜索专长、替换能力或规则文字…" autocomplete="off" /><kbd>/</kbd></label>
          <div class="type-filters" id="rogue-filters" role="group" aria-label="按规则分类筛选"><button class="filter is-active" type="button" data-category="全部" aria-pressed="true">全部</button><button class="filter" type="button" data-category="feat" aria-pressed="false">专长</button><button class="filter" type="button" data-category="variant" aria-pressed="false">职业替换</button></div>
        </div>
        <section class="scout-section" data-section="feat"><h3>游荡者专长 <span>${feats.length}</span></h3><div class="scout-entries">${renderEntries(feats, "feat", "一般专长", ["先决条件", "效果", "特殊"])}</div></section>
        <section class="scout-section" data-section="variant"><h3>职业替换能力 <span>${variants.length}</span></h3><div class="scout-entries">${renderEntries(variants, "variant", "职业替换能力", ["限制", "等级", "失去", "得到"])}</div></section>
        <div class="empty-state" id="rogue-empty" hidden><p class="empty-glyph" aria-hidden="true">∅</p><h3>没有找到对应规则</h3><p>试试缩短关键词或切换分类。</p><button class="button button-ghost" id="clear-rogue" type="button">清除筛选</button></div>
      </section>
    </main>
  </body>
</html>`;

await writeFile(outputPath, `${html}\n`, "utf8");
console.log(JSON.stringify({ output: outputPath.pathname, feats: feats.length, variants: variants.length, totalEntries }, null, 2));

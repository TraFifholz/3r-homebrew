import { readFile, writeFile } from "node:fs/promises";

const sourcePath = new URL("../sources/scout-rework.txt", import.meta.url);
const outputPath = new URL("../scout-rework.html", import.meta.url);
const source = (await readFile(sourcePath, "utf8")).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const paragraphs = (value) => value
  .trim()
  .split(/\n\s*\n/)
  .map((paragraph) => `<p>${escapeHtml(paragraph.replace(/\s*\n\s*/g, ""))}</p>`)
  .join("\n");

function between(start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Missing section boundary: ${start} -> ${end}`);
  return source.slice(startIndex + start.length, endIndex).trim();
}

function parseColonEntries(block) {
  const clean = block.replace(/^劇透\s*-\s*:\s*$/gm, "").trim();
  const pattern = /^\s*([^\n：]{1,32}?)(?:（([^）\n]+)）)?：/gm;
  const matches = [...clean.matchAll(pattern)];
  return matches.map((match, index) => ({
    name: match[1].trim(),
    subtype: match[2]?.trim() ?? "",
    body: clean.slice(match.index + match[0].length, matches[index + 1]?.index ?? clean.length).trim(),
  }));
}

function parseFeatEntries(block) {
  const pattern = /^([^\n]+)\[一般\]\s*$/gm;
  const matches = [...block.matchAll(pattern)];
  return matches.map((match, index) => {
    const chunk = block.slice(match.index + match[0].length, matches[index + 1]?.index ?? block.length).trim();
    const fields = {};
    const fieldMatches = [...chunk.matchAll(/^(前提|效果|特殊)：/gm)];
    for (let fieldIndex = 0; fieldIndex < fieldMatches.length; fieldIndex += 1) {
      const field = fieldMatches[fieldIndex];
      fields[field[1]] = chunk.slice(field.index + field[0].length, fieldMatches[fieldIndex + 1]?.index ?? chunk.length).trim().replace(/\s*\n\s*/g, "");
    }
    return { name: match[1].trim(), fields };
  });
}

function parseVariantEntries(block) {
  const pattern = /^([^\n：]+)\n\n限制：/gm;
  const matches = [...block.matchAll(pattern)];
  return matches.map((match, index) => {
    const chunk = block.slice(match.index + match[1].length, matches[index + 1]?.index ?? block.length).trim();
    const fields = {};
    const fieldMatches = [...chunk.matchAll(/^(限制|等级|失去|得到|特殊)：/gm)];
    for (let fieldIndex = 0; fieldIndex < fieldMatches.length; fieldIndex += 1) {
      const field = fieldMatches[fieldIndex];
      fields[field[1]] = chunk.slice(field.index + field[0].length, fieldMatches[fieldIndex + 1]?.index ?? chunk.length).trim().replace(/\s*\n\s*/g, "");
    }
    return { name: match[1].trim(), fields };
  });
}

const hitDie = source.match(/生命骰：([^\n]+)/)?.[1].trim();
const alignment = source.match(/阵营：([^\n]+)/)?.[1].trim();
const classSkills = source.match(/斥候的本职技能包括：([\s\S]*?)\n\n技能点：/)?.[1].trim().replace(/\s*\n\s*/g, "");
const skillPoints = source.match(/技能点：([^\n]+)/)?.[1].trim();

const tableBlock = between("等级 基本攻击加值    强韧 反射 意志  特殊能力", "武器和防具擅长：");
const levels = tableBlock.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
  const match = line.match(/^(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+)$/);
  if (!match) throw new Error(`Could not parse class table row: ${line}`);
  return { level: match[1], bab: match[2], fort: match[3], reflex: match[4], will: match[5], special: match[6] };
});

const classAbilities = parseColonEntries(`武器和防具擅长：${between("武器和防具擅长：", "\n斥候奇术\n\n")}`);
const tricks = parseColonEntries(between("\n斥候奇术\n\n", "\n斥候陷阱："));
const traps = parseColonEntries(between("\n斥候陷阱：", "\n斥候专长："));
const feats = parseFeatEntries(between("\n斥候专长：", "\n斥候职业替换能力："));
const variantMarker = "\n斥候职业替换能力：";
const variants = parseVariantEntries(source.slice(source.indexOf(variantMarker) + variantMarker.length).trim());

if (levels.length !== 20 || classAbilities.length !== 15 || tricks.length !== 24 || traps.length !== 15 || feats.length !== 8 || variants.length !== 5) {
  throw new Error(`Unexpected parsed counts: ${JSON.stringify({ levels: levels.length, classAbilities: classAbilities.length, tricks: tricks.length, traps: traps.length, feats: feats.length, variants: variants.length })}`);
}

let sequence = 0;
function renderTextEntries(entries, category, label) {
  return entries.map((entry) => {
    sequence += 1;
    const id = `scout-${category}-${String(sequence).padStart(2, "0")}`;
    return `<article class="scout-entry" id="${id}" data-category="${category}">
      <header><div><p class="type-label">${escapeHtml(label)}${entry.subtype ? ` · ${escapeHtml(entry.subtype)}` : ""}</p><h3>${escapeHtml(entry.name)}</h3></div><button class="copy-link" type="button" data-anchor="${id}">链接</button></header>
      <div class="entry-body">${paragraphs(entry.body)}</div>
    </article>`;
  }).join("\n");
}

function renderFieldEntries(entries, category, label, order) {
  return entries.map((entry) => {
    sequence += 1;
    const id = `scout-${category}-${String(sequence).padStart(2, "0")}`;
    const fields = order.filter((field) => entry.fields[field]).map((field) => `<div><dt>${field}</dt><dd>${escapeHtml(entry.fields[field])}</dd></div>`).join("\n");
    return `<article class="scout-entry" id="${id}" data-category="${category}">
      <header><div><p class="type-label">${escapeHtml(label)}</p><h3>${escapeHtml(entry.name)}</h3></div><button class="copy-link" type="button" data-anchor="${id}">链接</button></header>
      <dl class="entry-fields">${fields}</dl>
    </article>`;
  }).join("\n");
}

const totalEntries = classAbilities.length + tricks.length + traps.length + feats.length + variants.length;
const tableRows = levels.map((row) => `<tr><th scope="row">${row.level}</th><td>${row.bab}</td><td>${row.fort}</td><td>${row.reflex}</td><td>${row.will}</td><td>${escapeHtml(row.special)}</td></tr>`).join("\n");

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#16130f" />
    <meta name="description" content="D&D 3.5e 中文房规：斥候职业重做，包含20级进展、斥候奇术、陷阱、专长与职业替换能力。" />
    <meta property="og:title" content="斥候重做｜3R Homebrew" />
    <meta property="og:description" content="完整的 D&D 3.5e 斥候职业重做规则。" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://trafifholz.github.io/3r-homebrew/scout-rework.html" />
    <meta name="twitter:card" content="summary" />
    <title>斥候重做｜3R Homebrew</title>
    <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="styles.css" />
    <script src="scout-library.js" defer></script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">3R</span><strong>Homebrew</strong></a>
      <nav aria-label="主导航">
        <a href="index.html">扩展技法</a><a href="domain-feats.html">领域专长</a><a href="feats.html">专长</a><a href="cleric-variants.html">牧师</a><a href="scout-rework.html" aria-current="page">斥候</a><a href="ranger-update.html">巡林客</a><a href="rogue-update.html">游荡者</a><a href="bard-movements.html">诗人</a><a href="prestige-classes.html">进阶职业</a><a href="harrowing.html">哈罗占卜</a><a href="harrow-equipment.html">装备</a><a href="https://github.com/TraFifholz/3r-homebrew" target="_blank" rel="noreferrer">GitHub ↗</a>
      </nav>
    </header>
    <main>
      <section class="library section-shell scout-library" id="library" aria-labelledby="library-title">
        <div class="section-heading library-heading"><div><p class="eyebrow">职业重做 · ${totalEntries} 项规则条目</p><h2 id="library-title">斥候（Scout）</h2></div><p id="result-count" role="status" aria-live="polite">共 ${totalEntries} 项</p></div>
        <div class="scout-summary"><dl><div><dt>生命骰</dt><dd>${escapeHtml(hitDie)}</dd></div><div><dt>阵营</dt><dd>${escapeHtml(alignment)}</dd></div><div><dt>技能点</dt><dd>${escapeHtml(skillPoints)}</dd></div></dl><p><strong>本职技能：</strong>${escapeHtml(classSkills)}</p></div>
        <div class="toolbar scout-toolbar" aria-label="斥候规则筛选工具">
          <label class="search-box"><span class="sr-only">搜索斥候规则</span><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="搜索能力、奇术、陷阱或规则文字…" autocomplete="off" /><kbd>/</kbd></label>
          <div class="type-filters" id="scout-filters" role="group" aria-label="按规则分类筛选"><button class="filter is-active" type="button" data-category="全部" aria-pressed="true">全部</button><button class="filter" type="button" data-category="ability" aria-pressed="false">职业能力</button><button class="filter" type="button" data-category="trick" aria-pressed="false">奇术</button><button class="filter" type="button" data-category="trap" aria-pressed="false">陷阱</button><button class="filter" type="button" data-category="feat" aria-pressed="false">专长</button><button class="filter" type="button" data-category="variant" aria-pressed="false">职业替换</button></div>
        </div>
        <section class="scout-progress" aria-labelledby="progress-title"><h3 id="progress-title">职业进展</h3><div class="class-table-wrap"><table><thead><tr><th>等级</th><th>基本攻击加值</th><th>强韧</th><th>反射</th><th>意志</th><th>特殊能力</th></tr></thead><tbody>${tableRows}</tbody></table></div></section>
        <section class="scout-section" data-section="ability"><h3>职业能力 <span>${classAbilities.length}</span></h3><div class="scout-entries">${renderTextEntries(classAbilities, "ability", "职业能力")}</div></section>
        <section class="scout-section" data-section="trick"><h3>斥候奇术 <span>${tricks.length}</span></h3><div class="scout-entries">${renderTextEntries(tricks, "trick", "斥候奇术")}</div></section>
        <section class="scout-section" data-section="trap"><h3>斥候陷阱 <span>${traps.length}</span></h3><div class="scout-entries">${renderTextEntries(traps, "trap", "斥候陷阱")}</div></section>
        <section class="scout-section" data-section="feat"><h3>斥候专长 <span>${feats.length}</span></h3><div class="scout-entries">${renderFieldEntries(feats, "feat", "一般专长", ["前提", "效果", "特殊"])}</div></section>
        <section class="scout-section" data-section="variant"><h3>职业替换能力 <span>${variants.length}</span></h3><div class="scout-entries">${renderFieldEntries(variants, "variant", "职业替换能力", ["限制", "等级", "失去", "得到", "特殊"])}</div></section>
        <div class="empty-state" id="scout-empty" hidden><p class="empty-glyph" aria-hidden="true">∅</p><h3>没有找到对应规则</h3><p>试试缩短关键词或切换分类。</p><button class="button button-ghost" id="clear-scout" type="button">清除筛选</button></div>
      </section>
    </main>
  </body>
</html>`;

await writeFile(outputPath, `${html}\n`, "utf8");
console.log(JSON.stringify({ output: outputPath.pathname, levels: levels.length, classAbilities: classAbilities.length, tricks: tricks.length, traps: traps.length, feats: feats.length, variants: variants.length, totalEntries }, null, 2));

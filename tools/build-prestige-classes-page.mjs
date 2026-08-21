import { readFile, writeFile } from "node:fs/promises";

const source = (await readFile(new URL("../sources/feats-prestige.txt", import.meta.url), "utf8")).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
const outputPath = new URL("../prestige-classes.html", import.meta.url);
const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const definitions = [
  { name: "历史探索者（Pathfinder Chronicler）", marker: "历史探索者（Pathfinder Chronicler）", table: "表：历史探索者", columns: ["等级", "基本攻击加值", "强韧", "反射", "意志", "特殊能力"] },
  { name: "间谍大师（Master Spy）", marker: "间谍大师（Master Spy）", table: "表：间谍大师", columns: ["等级", "基本攻击加值", "强韧", "反射", "意志", "特殊能力"] },
  { name: "密文法师（Cyphermage）", marker: "谜港城（Riddleport）的密文法师", includeMarker: true, table: "表：密文法师", columns: ["等级", "基本攻击加值", "强韧", "反射", "意志", "特殊能力", "每日法术"] },
  { name: "刺青秘法师（Tattooed Mystic）", marker: "刺青秘法师（Tattooed Mystic）", table: "表：刺青秘法师", columns: ["等级", "BAB", "强韧", "反射", "意志", "职业能力", "每日法术"], inlineTable: true },
  { name: "哈罗牌大师（Harrower）", marker: "哈罗牌大师（Harrower）", endMarker: "附：哈罗占卜（Harrowing）", table: "表：哈罗牌大师", columns: ["等级", "基本攻击加值", "强韧", "反射", "意志", "特殊能力", "每日法术"], extraTables: [{ marker: "表：哈罗套牌阵营组合", title: "哈罗套牌阵营组合", columns: ["自身阵营", "对立阵营", "部分相符"], rows: 9 }] },
  { name: "晨花隐者（Dawnflower Anchorite）", marker: "晨花隐者（Dawnflower Anchorite）", table: "表：晨花隐者", columns: ["等级", "BAB", "强韧", "反射", "意志", "特殊能力", "每日法术"], inlineTable: true },
  { name: "天体颂唱者（Sphere Singer）", marker: "天体颂唱者（Sphere Singer）", table: "表：天体颂唱者", columns: ["等级", "BAB", "强韧", "反射", "意志", "特殊能力", "每日法术"], inlineTable: true },
];

function extractClasses() {
  const searchStart = source.indexOf("新进阶职业：");
  return definitions.map((definition, index) => {
    const start = source.indexOf(definition.marker, searchStart);
    const nextMarker = definition.endMarker ?? definitions[index + 1]?.marker;
    const end = nextMarker ? source.indexOf(nextMarker, start + definition.marker.length) : source.length;
    if (start < 0 || end < 0) throw new Error(`Missing class boundary: ${definition.name}`);
    const contentStart = definition.includeMarker ? start : start + definition.marker.length;
    return { ...definition, raw: source.slice(contentStart, end).trim() };
  });
}

function nonEmptyLineMatches(text) {
  return [...text.matchAll(/^.*$/gm)].filter((match) => match[0].trim() && !/^-{5,}$/.test(match[0].trim()));
}

function parseInlineRow(line, columns, className) {
  const match = line.trim().match(/^(\d+)级\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+?)\s+(－|\+1.*)$/);
  if (!match) throw new Error(`Could not parse ${className} table row: ${line}`);
  const row = [match[1], match[2], match[3], match[4], match[5], match[6], match[7]];
  if (row.length !== columns.length) throw new Error(`Wrong table width: ${className}`);
  return row;
}

function extractTable(raw, { marker, title, columns, rows = 10, inlineTable = false }, className) {
  const start = raw.indexOf(marker);
  if (start < 0) throw new Error(`Missing table ${marker}: ${className}`);
  const afterStart = start + marker.length;
  const after = raw.slice(afterStart);
  const lines = nonEmptyLineMatches(after);
  let tableRows;
  let lastMatch;
  if (inlineTable) {
    const rowGroups = [];
    for (const line of lines.slice(1)) {
      if (/^\s*\d+级(?:\s|$)/.test(line[0])) rowGroups.push({ text: line[0].trim(), lastMatch: line });
      else if (rowGroups.length) {
        rowGroups.at(-1).text += ` ${line[0].trim()}`;
        rowGroups.at(-1).lastMatch = line;
      }
      if (rowGroups.length === rows && /(－|\+1.*)$/.test(rowGroups.at(-1).text)) break;
      if (rowGroups.length > rows) break;
    }
    const selectedRows = rowGroups.slice(0, rows);
    if (selectedRows.length !== rows) throw new Error(`Incomplete table: ${className}`);
    tableRows = selectedRows.map((row) => parseInlineRow(row.text, columns, className));
    lastMatch = selectedRows.at(-1).lastMatch;
  } else {
    const needed = columns.length + rows * columns.length;
    const cells = lines.slice(0, needed);
    if (cells.length !== needed) throw new Error(`Incomplete table: ${className}`);
    tableRows = Array.from({ length: rows }, (_, rowIndex) => cells.slice(columns.length + rowIndex * columns.length, columns.length + (rowIndex + 1) * columns.length).map((match) => match[0].trim()));
    lastMatch = cells.at(-1);
  }
  const end = afterStart + lastMatch.index + lastMatch[0].length;
  return { title: title ?? marker.replace(/^表：/, ""), columns, rows: tableRows, raw: `${raw.slice(0, start)}\n\n${raw.slice(end)}` };
}

const headingMap = new Map([
  ["进阶要求", "进阶要求"], ["先决条件（Requirements）", "进阶要求"], ["进阶条件（Requirements）", "进阶要求"],
  ["本职技能", "本职技能"], ["本职技能（Class Skills）", "本职技能"],
  ["职业特性", "职业特性"], ["职业能力（Class Features）", "职业特性"],
]);

function splitSections(raw) {
  const sections = { "概览": [], "进阶要求": [], "本职技能": [], "职业特性": [] };
  let active = "概览";
  for (const rawLine of raw.replace(/[ \t]+$/gm, "").split("\n")) {
    const line = rawLine.trim();
    if (/^-{5,}$/.test(line)) continue;
    if (line === "返回目录" || /^https?:\/\//.test(line) || /^译者[：:]/.test(line)) continue;
    const heading = headingMap.get(line);
    if (heading) { active = heading; continue; }
    sections[active].push(rawLine);
  }
  return Object.fromEntries(Object.entries(sections).map(([name, lines]) => [name, lines.join("\n").trim()]));
}

const embeddedRuleBlocks = [
  { start: "狂舞（战斗）", end: "神圣光辉（Divine Light" },
  { start: "日光召唤\n", end: "日光屏障（Solar Defense" },
  { start: "优雅繁星（战斗）", end: "星之声（Starsong" },
  { start: "梦中盛宴（Dream Feast；黛丝娜法术，出自Inner Sea Gods）", end: "化蝶（Butterfly）" },
  { start: "寻梦师\nLucid Dreamer", end: "跨界旅者（Tapestry Traveler" },
];

function stripEmbeddedRules(raw) {
  for (const block of embeddedRuleBlocks) {
    const start = raw.indexOf(block.start);
    if (start < 0) continue;
    const end = raw.indexOf(block.end, start + block.start.length);
    if (end < 0) throw new Error(`Missing embedded rule boundary: ${block.start}`);
    raw = `${raw.slice(0, start)}\n\n${raw.slice(end)}`;
  }
  return raw;
}

function renderParagraph(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return "";
  return lines.map((line) => {
    const colon = line.indexOf("：");
    if (colon > 0 && colon < 72) return `<div class="prestige-rule"><h5>${escapeHtml(line.slice(0, colon))}</h5><p>${escapeHtml(line.slice(colon + 1).trim())}</p></div>`;
    return `<p>${escapeHtml(line)}</p>`;
  }).join("");
}

function renderSection(title, text) {
  if (!text) return "";
  const paragraphs = text.split(/\n\s*\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
  return `<section class="prestige-subsection"><h4>${title}</h4><div class="prestige-copy">${paragraphs.map(renderParagraph).join("")}</div></section>`;
}

function renderTable(table, mainTitle = "") {
  const head = table.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("");
  const body = table.rows.map((row) => `<tr>${row.map((cell, index) => index === 0 ? `<th scope="row">${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  const title = table.title === mainTitle ? "职业进展" : table.title;
  return `<section class="prestige-subsection prestige-advancement"><h4>${escapeHtml(title)}</h4><div class="class-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></section>`;
}

const classes = extractClasses().map((classEntry) => {
  let raw = classEntry.raw;
  const main = extractTable(raw, { marker: classEntry.table, title: classEntry.table.replace(/^表：/, ""), columns: classEntry.columns, inlineTable: classEntry.inlineTable }, classEntry.name);
  raw = main.raw;
  const extraTables = [];
  for (const tableDefinition of classEntry.extraTables ?? []) {
    const extra = extractTable(raw, tableDefinition, classEntry.name);
    raw = extra.raw;
    extraTables.push(extra);
  }
  raw = stripEmbeddedRules(raw);
  return { ...classEntry, sections: splitSections(raw), mainTable: main, extraTables };
});

function renderClass(classEntry, index) {
  const id = `prestige-classes-prestige-${String(index + 1).padStart(2, "0")}`;
  const mainTitle = classEntry.table.replace(/^表：/, "");
  return `<article class="scout-entry prestige-entry" id="${id}" data-category="prestige"><header><div><p class="type-label">进阶职业</p><h3>${escapeHtml(classEntry.name)}</h3></div><button class="copy-link" type="button" data-anchor="${id}">链接</button></header><div class="prestige-content">${renderSection("概览", classEntry.sections["概览"])}${renderSection("进阶要求", classEntry.sections["进阶要求"])}${renderSection("本职技能", classEntry.sections["本职技能"])}${renderTable(classEntry.mainTable, mainTitle)}${classEntry.extraTables.map((table) => renderTable(table)).join("")}${renderSection("职业特性", classEntry.sections["职业特性"])}</div></article>`;
}

const entriesHtml = classes.map(renderClass).join("\n");
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="theme-color" content="#16130f" /><meta name="description" content="D&D与Pathfinder中文规则资料：七个完整进阶职业。" /><meta property="og:title" content="进阶职业｜3R Homebrew" /><meta property="og:description" content="七个结构化整理的完整进阶职业。" /><meta property="og:type" content="article" /><meta property="og:url" content="https://trafifholz.github.io/3r-homebrew/prestige-classes.html" /><meta name="twitter:card" content="summary" /><title>进阶职业｜3R Homebrew</title><link rel="icon" href="assets/favicon.svg" type="image/svg+xml" /><link rel="stylesheet" href="styles.css" /><script src="catalog-library.js" defer></script></head>
<body data-unit="项"><header class="site-header"><a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">3R</span><strong>Homebrew</strong></a><nav aria-label="主导航"><a href="index.html">扩展技法</a><a href="feats.html">专长</a><a href="cleric-variants.html">牧师</a><a href="scout-rework.html">斥候</a><a href="ranger-update.html">巡林客</a><a href="rogue-update.html">游荡者</a><a href="bard-movements.html">诗人</a><a href="soulknife.html">魂刃</a><a href="prestige-classes.html" aria-current="page">进阶职业</a><a href="harrowing.html">法术</a><a href="equipment.html">装备</a><a href="https://github.com/TraFifholz/3r-homebrew" target="_blank" rel="noreferrer">GitHub ↗</a></nav></header><main><section class="library section-shell ranger-library" id="library" aria-labelledby="library-title"><div class="section-heading library-heading"><div><p class="eyebrow">职业资料 · 7个完整进阶职业</p><h2 id="library-title">进阶职业</h2></div><p id="result-count" role="status" aria-live="polite">共 7 项</p></div><div class="toolbar scout-toolbar" aria-label="进阶职业筛选工具"><label class="search-box"><span class="sr-only">搜索进阶职业</span><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="搜索职业、进阶条件、能力或等级表…" autocomplete="off" /><kbd>/</kbd></label></div><section class="scout-section" data-section="prestige"><h3>进阶职业 <span>7</span></h3><div class="scout-entries">${entriesHtml}</div></section><div class="empty-state" id="catalog-empty" hidden><p class="empty-glyph" aria-hidden="true">∅</p><h3>没有找到对应资料</h3><p>试试缩短关键词。</p><button class="button button-ghost" id="clear-catalog" type="button">清除筛选</button></div></section></main></body></html>`;
await writeFile(outputPath, `${html}\n`, "utf8");
console.log(JSON.stringify({ total: classes.length, tables: classes.reduce((sum, item) => sum + 1 + item.extraTables.length, 0), sections: ["概览", "进阶要求", "本职技能", "职业进展", "职业特性"] }, null, 2));

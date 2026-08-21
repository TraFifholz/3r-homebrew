import { writeFile } from "node:fs/promises";

export const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
export const formatValue = (value) => escapeHtml(value.trim()).replace(/\n{2,}/g, "<br><br>").replace(/\n/g, "<br>");

export function extractEntries(source, definitions, endMarker, searchFrom = 0) {
  return definitions.map((definition, index) => {
    const start = source.indexOf(definition.marker, searchFrom);
    const nextMarker = definition.endMarker ?? definitions[index + 1]?.marker ?? endMarker;
    const end = nextMarker ? source.indexOf(nextMarker, start + definition.marker.length) : source.length;
    if (start < 0 || end < 0) throw new Error(`Missing boundary: ${definition.marker}`);
    const body = source.slice(start + definition.marker.length, end).trim();
    searchFrom = start + definition.marker.length;
    return { name: definition.name, fields: definition.fields ?? [{ label: "正文", value: definition.includeMarker ? `${definition.marker}${body ? ` ${body}` : ""}` : body }] };
  });
}

const nav = (current) => [
  ["index.html", "扩展技法"], ["feats.html", "专长"],
  ["cleric-variants.html", "牧师"], ["scout-rework.html", "斥候"], ["ranger-update.html", "巡林客"],
  ["rogue-update.html", "游荡者"], ["bard-movements.html", "诗人"], ["prestige-classes.html", "进阶职业"],
  ["harrowing.html", "哈罗占卜"], ["equipment.html", "装备"],
].map(([href, label]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`).join("") + '<a href="https://github.com/TraFifholz/3r-homebrew" target="_blank" rel="noreferrer">GitHub ↗</a>';

export async function writeCatalogPage({ outputPath, slug, title, eyebrow, description, sections, unit = "项", placeholder }) {
  let sequence = 0;
  const total = sections.reduce((sum, section) => sum + section.entries.length, 0);
  const filters = sections.length > 1 ? `<div class="type-filters" id="catalog-filters" role="group" aria-label="按分类筛选"><button class="filter is-active" type="button" data-category="全部" aria-pressed="true">全部</button>${sections.map((section) => `<button class="filter" type="button" data-category="${section.key}" aria-pressed="false">${section.shortLabel ?? section.label}</button>`).join("")}</div>` : "";
  const sectionHtml = sections.map((section) => {
    const entries = section.entries.map((entry) => {
      sequence += 1;
      const id = `${slug}-${section.key}-${String(sequence).padStart(2, "0")}`;
      const fields = entry.fields.map((field) => `<div><dt>${escapeHtml(field.label)}</dt><dd>${formatValue(field.value)}</dd></div>`).join("\n");
      return `<article class="scout-entry" id="${id}" data-category="${section.key}"><header><div><p class="type-label">${escapeHtml(entry.typeLabel ?? section.entryLabel ?? section.label)}</p><h3>${escapeHtml(entry.name)}</h3></div><button class="copy-link" type="button" data-anchor="${id}">链接</button></header><dl class="entry-fields">${fields}</dl></article>`;
    }).join("\n");
    return `<section class="scout-section" data-section="${section.key}"><h3>${escapeHtml(section.label)} <span>${section.entries.length}</span></h3><div class="scout-entries">${entries}</div></section>`;
  }).join("\n");

  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="theme-color" content="#16130f" /><meta name="description" content="${escapeHtml(description)}" /><meta property="og:title" content="${escapeHtml(title)}｜3R Homebrew" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:type" content="article" /><meta property="og:url" content="https://trafifholz.github.io/3r-homebrew/${slug}.html" /><meta name="twitter:card" content="summary" /><title>${escapeHtml(title)}｜3R Homebrew</title><link rel="icon" href="assets/favicon.svg" type="image/svg+xml" /><link rel="stylesheet" href="styles.css" /><script src="catalog-library.js" defer></script></head>
<body data-unit="${escapeHtml(unit)}"><header class="site-header"><a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">3R</span><strong>Homebrew</strong></a><nav aria-label="主导航">${nav(`${slug}.html`)}</nav></header><main><section class="library section-shell ranger-library" id="library" aria-labelledby="library-title"><div class="section-heading library-heading"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h2 id="library-title">${escapeHtml(title)}</h2></div><p id="result-count" role="status" aria-live="polite">共 ${total} ${escapeHtml(unit)}</p></div><div class="toolbar scout-toolbar" aria-label="${escapeHtml(title)}筛选工具"><label class="search-box"><span class="sr-only">搜索${escapeHtml(title)}</span><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="${escapeHtml(placeholder)}" autocomplete="off" /><kbd>/</kbd></label>${filters}</div>${sectionHtml}<div class="empty-state" id="catalog-empty" hidden><p class="empty-glyph" aria-hidden="true">∅</p><h3>没有找到对应资料</h3><p>试试缩短关键词或切换分类。</p><button class="button button-ghost" id="clear-catalog" type="button">清除筛选</button></div></section></main></body></html>`;
  await writeFile(outputPath, `${html}\n`, "utf8");
  return { total, sections: Object.fromEntries(sections.map((section) => [section.label, section.entries.length])) };
}

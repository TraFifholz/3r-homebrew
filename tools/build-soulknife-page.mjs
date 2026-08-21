import { readFile } from "node:fs/promises";
import { escapeHtml, formatValue, writeCatalogPage } from "./catalog-page-helpers.mjs";

const source = (await readFile(new URL("../sources/gifted-blade.txt", import.meta.url), "utf8")).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
const tableMarker = "表：天赋之刃";
const firstPowerMarker = "1级天赋之刃异能";
const tableBoundary = source.indexOf(`\n${tableMarker}\n`);
const powersBoundary = source.indexOf(`\n${firstPowerMarker}\n`);
if (tableBoundary < 0 || powersBoundary < 0) throw new Error("Missing Gifted Blade section boundaries");
const tableStart = tableBoundary + 1;
const powersStart = powersBoundary + 1;

const abilityText = source.slice(0, tableStart).trim();
const abilityName = abilityText.match(/^([^\n]+)$/m)?.[1];
const intro = abilityText.split("\n\n")[1]?.trim();
if (!abilityName || !intro) throw new Error("Missing Gifted Blade heading or introduction");
const fieldValue = (name) => {
  const match = abilityText.match(new RegExp(`^${name}：([^\\n]+)$`, "m"));
  if (!match) throw new Error(`Missing Gifted Blade field: ${name}`);
  return match[1].trim();
};
const manifestMarker = "显能（Manifesting）：";
const manifestStart = abilityText.indexOf(manifestMarker);
if (manifestStart < 0) throw new Error("Missing Manifesting rules");
const manifesting = abilityText.slice(manifestStart + manifestMarker.length).trim();

const tableLines = source.slice(tableStart + tableMarker.length, powersStart).trim().split("\n").filter(Boolean);
const progressionColumns = tableLines[0].split("|");
const progressionRows = tableLines.slice(1).map((line) => line.split("|"));
if (progressionColumns.length !== 4 || progressionRows.length !== 18 || progressionRows.some((row) => row.length !== 4)) throw new Error("Invalid Gifted Blade progression table");
const tableHead = progressionColumns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("");
const tableBody = progressionRows.map((row) => `<tr>${row.map((cell, index) => index === 0 ? `<th scope="row">${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
const manifestHtml = `<div class="gifted-blade-rules">${formatValue(manifesting)}</div><section class="gifted-blade-progression"><h4>职业进展</h4><div class="class-table-wrap"><table><thead><tr>${tableHead}</tr></thead><tbody>${tableBody}</tbody></table></div></section>`;
const abilityEntry = {
  name: abilityName,
  typeLabel: "魂刃者职业替换能力",
  className: "gifted-blade-entry",
  fields: [
    { label: "概览", value: intro },
    { label: "限制", value: fieldValue("限制") },
    { label: "等级", value: fieldValue("等级") },
    { label: "失去", value: fieldValue("失去") },
    { label: "得到", value: fieldValue("得到") },
    { label: "显能", value: manifesting, html: manifestHtml },
  ],
};

const powerSource = source.slice(powersStart);
const powerHeadings = [...powerSource.matchAll(/^([1-4])级天赋之刃异能$/gm)];
const powerSections = powerHeadings.map((heading, index) => {
  const level = Number(heading[1]);
  const block = powerSource.slice(heading.index + heading[0].length, powerHeadings[index + 1]?.index ?? powerSource.length);
  const entries = block.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("- ")).map((line) => {
    const match = line.match(/^- (.+?)（(.+)）：(.+)$/);
    if (!match) throw new Error(`Invalid Gifted Blade power: ${line}`);
    return { name: `${match[1]}（${match[2]}）`, typeLabel: `${level}级异能`, fields: [{ label: "效果", value: match[3].trim() }] };
  });
  return { key: `power-${level}`, label: `${level}级异能`, shortLabel: `${level}级`, entryLabel: `${level}级异能`, entries };
});
const powerCount = powerSections.reduce((sum, section) => sum + section.entries.length, 0);
if (powerCount !== 80) throw new Error(`Unexpected Gifted Blade power count: ${powerCount}`);

const result = await writeCatalogPage({
  outputPath: new URL("../soulknife.html", import.meta.url),
  slug: "soulknife",
  title: "魂刃者",
  eyebrow: "职业选项 · 1项替换能力 · 80项异能",
  description: "魂刃者职业替换能力天赋之刃、职业进展与完整异能列表。",
  sections: [
    { key: "archetype", label: "职业替换能力", shortLabel: "替换能力", entryLabel: "职业替换能力", entries: [abilityEntry] },
    ...powerSections,
  ],
  placeholder: "搜索替换能力、异能中文名、英文名或效果…",
});
console.log(JSON.stringify(result, null, 2));

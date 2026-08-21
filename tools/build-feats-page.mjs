import { readFile } from "node:fs/promises";
import { extractEntries, writeCatalogPage } from "./catalog-page-helpers.mjs";

const base = (await readFile(new URL("../sources/feats-prestige.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const harrow = (await readFile(new URL("../sources/harrow-options.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const profession = (await readFile(new URL("../sources/profession-feats.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const combatAmbush = (await readFile(new URL("../sources/combat-ambush-feats.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const divineCompanion = (await readFile(new URL("../sources/divine-and-companion-feats.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const domainData = JSON.parse(await readFile(new URL("../data/domain-feats.json", import.meta.url), "utf8"));
const definitions = [
  { name: "密文魔法（Cypher Magic）", marker: "密文魔法（Cypher Magic）" },
  { name: "瓦瑞西安刺青（Varisian Tattoo）", marker: "瓦瑞西安刺青（Varisian Tattoo）" },
  { name: "黑貂连队陆战队员（Sable Company Marine）", marker: "黑貂连队陆战队员 Sable Company Marine" },
  { name: "屋脊奔行者（Shingle Runner）", marker: "屋脊奔行者 Shingle Runner" },
  { name: "弩术精通（Crossbow Mastery）", marker: "弩术精通 Crossbow Mastery" },
  { name: "阿卡达玛毕业生（Acadamae Graduate）", marker: "新专长：阿卡达玛毕业生 Acadamae Graduate" },
  { name: "哈罗眷命（Harrowed）", marker: "哈罗眷命 Harrowed" },
];
const harrowDefinitions = [
  { name: "哈罗召唤术（Harrowed Summoning）", marker: "哈罗召唤术（Harrowed Summoning）" },
  { name: "致命发牌者（Deadly Dealer）", marker: "致命发牌者（Deadly dealer）" },
];
const professionDefinitions = [
  { name: "老练文员（Adept Administrator）", marker: "老练文员 Adept Administrator" },
  { name: "老练冒险家（Adept Adventurer）", marker: "老练冒险家 Adept Adventurer" },
  { name: "老练建筑者（Adept Builder）", marker: "老练建筑者 Adept Builder" },
  { name: "老练厨师（Adept Culinarian）", marker: "老练厨师 Adept Culinarian" },
  { name: "老练驯养者（Adept Handler）", marker: "老练驯养者 Adept Handler" },
  { name: "老练猎手（Adept Hunter）", marker: "老练猎手 Adept Hunter" },
  { name: "老练生意人（Adept Trader）", marker: "老练生意人 Adept Trader" },
  { name: "勤奋工作（Industrious Worker）", marker: "勤奋工作 Industrious Worker" },
  { name: "熟练工（Working Folk）", marker: "熟练工 Working Folk" },
  { name: "老练旅伴（Adept Companion）", marker: "老练旅伴 Adept Companion" },
  { name: "老练采集者（Adept Gatherer）", marker: "老练采集者 Adept Gatherer" },
  { name: "老练躬耕者（Adept Naturalist）", marker: "老练躬耕者 Adept Naturalist" },
  { name: "锦囊妙计（Brilliant Planner）", marker: "锦囊妙计\nBrilliant Planner" },
];
const normalizePrerequisiteTerms = (entry) => ({
  ...entry,
  fields: parseRuleBody(entry.fields.map((field) => field.value).join("\n\n").replaceAll("先决条件：", "前提：").replaceAll("先决条件:", "前提：")),
});
const entries = [...extractEntries(base, definitions, "新进阶职业："), ...extractEntries(harrow, harrowDefinitions, "新物品"), ...extractEntries(profession, professionDefinitions, null)].map(normalizePrerequisiteTerms);
if (entries.length !== 22) throw new Error(`Unexpected feat count: ${entries.length}`);

function parseRuleBody(body) {
  const values = { "简介": [], "前提": [], "效果": [], "特殊": [] };
  let active = "简介";
  let prerequisiteComplete = false;
  for (const rawLine of body.trim().split("\n")) {
    const line = rawLine.trim();
    const marker = line.match(/^(前提|先决条件|效果|好处|专长效果|特殊)：\s*(.*)$/);
    if (marker) {
      active = ({ "先决条件": "前提", "好处": "效果", "专长效果": "效果" })[marker[1]] ?? marker[1];
      values[active].push(marker[2]);
      prerequisiteComplete = active === "前提";
      continue;
    }
    if (prerequisiteComplete && line) {
      active = "效果";
      prerequisiteComplete = false;
    }
    values[active].push(line);
  }
  return Object.entries(values).map(([label, lines]) => ({ label, value: lines.join("\n").replace(/^\n+|\n+$/g, "") })).filter((field) => field.value);
}

function parseTypedFeats(text) {
  const headings = [...text.matchAll(/^([^\n\[]+)((?:\[[^\]]+\])+)[ \t]*$/gm)];
  return headings.map((heading, index) => {
    const tags = [...heading[2].matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);
    const body = text.slice(heading.index + heading[0].length, headings[index + 1]?.index ?? text.length);
    const category = tags.includes("伏击") ? "ambush" : tags.includes("神力") ? "divine" : tags.includes("战斗") ? "combat" : "general";
    return { name: `${heading[1].trim()}${heading[2]}`, typeLabel: `${tags.join("／")}专长`, category, fields: parseRuleBody(body) };
  });
}

function referencedFeat({ name, tags, startMarker, endMarker, stripLine }) {
  const start = base.indexOf(startMarker);
  const end = base.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Missing referenced feat: ${name}`);
  let body = base.slice(start + startMarker.length, end).trim();
  if (stripLine) body = body.replace(new RegExp(`^${stripLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`), "");
  return { name: `${name}${tags.map((tag) => `[${tag}]`).join("")}`, typeLabel: `${tags.join("／")}专长`, category: tags.includes("战斗") ? "combat" : "general", fields: parseRuleBody(body) };
}

const typedEntries = [...parseTypedFeats(combatAmbush), ...parseTypedFeats(divineCompanion)];
if (typedEntries.length !== 32) throw new Error(`Unexpected new feat count: ${typedEntries.length}`);
const referencedEntries = [
  referencedFeat({ name: "狂舞（Dervish Dance）", tags: ["战斗"], startMarker: "狂舞（战斗）", endMarker: "神圣光辉（Divine Light" }),
  referencedFeat({ name: "日光召唤（Sunlight Summons）", tags: ["一般"], startMarker: "日光召唤\n", endMarker: "日光屏障（Solar Defense" }),
  referencedFeat({ name: "优雅繁星（Starry Grace）", tags: ["战斗"], startMarker: "优雅繁星（战斗）\n", endMarker: "星之声（Starsong", stripLine: "Starry Grace (Combat)" }),
  referencedFeat({ name: "寻梦师（Lucid Dreamer）", tags: ["一般"], startMarker: "寻梦师\n", endMarker: "跨界旅者（Tapestry Traveler", stripLine: "Lucid Dreamer" }),
];
const generalEntries = [...entries, ...typedEntries.filter((entry) => entry.category === "general"), ...referencedEntries.filter((entry) => entry.category === "general")];
const combatEntries = [...typedEntries.filter((entry) => entry.category === "combat"), ...referencedEntries.filter((entry) => entry.category === "combat")];
const ambushEntries = typedEntries.filter((entry) => entry.category === "ambush");
const divineEntries = typedEntries.filter((entry) => entry.category === "divine");
if (generalEntries.length !== 29 || combatEntries.length !== 9 || ambushEntries.length !== 15 || divineEntries.length !== 5) throw new Error("Unexpected categorized feat counts");
const domainEntries = domainData.feats.map((feat, index) => ({
  id: `feats-domain-${String(index + 51).padStart(2, "0")}`,
  name: `${feat.name}[领域]`,
  typeLabel: "领域专长",
  fields: [
    { label: "效果", value: feat.effect },
    { label: "特殊", value: feat.special.join("\n") },
  ],
}));
if (domainEntries.length !== 19) throw new Error(`Unexpected domain feat count: ${domainEntries.length}`);
const result = await writeCatalogPage({
  outputPath: new URL("../feats.html", import.meta.url),
  slug: "feats",
  title: "专长",
  eyebrow: "角色选项 · 77项专长",
  description: "D&D与Pathfinder中文规则资料：一般、战斗、伏击、神力与领域专长。",
  sections: [
    { key: "feat", label: "一般专长", shortLabel: "一般", entryLabel: "专长", entries: generalEntries },
    { key: "combat", label: "战斗专长", shortLabel: "战斗", entries: combatEntries },
    { key: "ambush", label: "伏击专长", shortLabel: "伏击", entries: ambushEntries },
    { key: "divine", label: "神力专长", shortLabel: "神力", entries: divineEntries },
    { key: "domain", label: "领域专长", shortLabel: "领域", entries: domainEntries },
  ],
  placeholder: "搜索专长、前提、类型或效果…",
});
console.log(JSON.stringify(result, null, 2));

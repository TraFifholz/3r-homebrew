import { readFile } from "node:fs/promises";
import { extractEntries, writeCatalogPage } from "./catalog-page-helpers.mjs";

const base = (await readFile(new URL("../sources/feats-prestige.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const harrow = (await readFile(new URL("../sources/harrow-options.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const profession = (await readFile(new URL("../sources/profession-feats.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
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
const entries = [...extractEntries(base, definitions, "新进阶职业："), ...extractEntries(harrow, harrowDefinitions, "新物品"), ...extractEntries(profession, professionDefinitions, null)];
if (entries.length !== 22) throw new Error(`Unexpected feat count: ${entries.length}`);
const result = await writeCatalogPage({ outputPath: new URL("../feats.html", import.meta.url), slug: "feats", title: "专长", eyebrow: "角色选项 · 22项专长", description: "D&D与Pathfinder中文规则资料：二十二项专长。", sections: [{ key: "feat", label: "专长", entries }], placeholder: "搜索专长、前提或效果…" });
console.log(JSON.stringify(result, null, 2));

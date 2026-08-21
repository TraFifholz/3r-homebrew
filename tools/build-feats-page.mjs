import { readFile } from "node:fs/promises";
import { extractEntries, writeCatalogPage } from "./catalog-page-helpers.mjs";

const base = (await readFile(new URL("../sources/feats-prestige.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const harrow = (await readFile(new URL("../sources/harrow-options.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
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
const entries = [...extractEntries(base, definitions, "新进阶职业："), ...extractEntries(harrow, harrowDefinitions, "新物品")];
if (entries.length !== 9) throw new Error(`Unexpected feat count: ${entries.length}`);
const result = await writeCatalogPage({ outputPath: new URL("../feats.html", import.meta.url), slug: "feats", title: "专长", eyebrow: "角色选项 · 9项专长", description: "D&D与Pathfinder中文规则资料：九项专长。", sections: [{ key: "feat", label: "专长", entries }], placeholder: "搜索专长、前提或效果…" });
console.log(JSON.stringify(result, null, 2));

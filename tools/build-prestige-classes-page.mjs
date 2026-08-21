import { readFile } from "node:fs/promises";
import { extractEntries, writeCatalogPage } from "./catalog-page-helpers.mjs";

const source = (await readFile(new URL("../sources/feats-prestige.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const definitions = [
  { name: "历史探索者（Pathfinder Chronicler）", marker: "历史探索者（Pathfinder Chronicler）" },
  { name: "间谍大师（Master Spy）", marker: "间谍大师（Master Spy）" },
  { name: "密文法师（Cyphermage）", marker: "谜港城（Riddleport）的密文法师", includeMarker: true },
  { name: "刺青秘法师（Tattooed Mystic）", marker: "刺青秘法师（Tattooed Mystic）" },
  { name: "哈罗牌大师（Harrower）", marker: "哈罗牌大师（Harrower）", endMarker: "附：哈罗占卜（Harrowing）" },
  { name: "晨花隐者（Dawnflower Anchorite）", marker: "晨花隐者（Dawnflower Anchorite）" },
  { name: "天体颂唱者（Sphere Singer）", marker: "天体颂唱者（Sphere Singer）" },
];
const entries = extractEntries(source, definitions, null, source.indexOf("新进阶职业："));
if (entries.length !== 7) throw new Error(`Unexpected prestige class count: ${entries.length}`);
const result = await writeCatalogPage({ outputPath: new URL("../prestige-classes.html", import.meta.url), slug: "prestige-classes", title: "进阶职业", eyebrow: "职业资料 · 7个完整进阶职业", description: "D&D与Pathfinder中文规则资料：七个完整进阶职业。", sections: [{ key: "prestige", label: "进阶职业", entries }], placeholder: "搜索职业、进阶条件、能力或等级表…" });
console.log(JSON.stringify(result, null, 2));

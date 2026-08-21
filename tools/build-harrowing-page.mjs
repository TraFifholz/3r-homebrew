import { readFile } from "node:fs/promises";
import { writeCatalogPage } from "./catalog-page-helpers.mjs";

const source = (await readFile(new URL("../sources/feats-prestige.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const marker = "附：哈罗占卜（Harrowing）";
const start = source.indexOf(marker);
const end = source.indexOf("晨花隐者（Dawnflower Anchorite）", start);
if (start < 0 || end < 0) throw new Error("Missing Harrowing spell boundaries");
const block = source.slice(start + marker.length, end).trim();
const fieldNames = ["学派", "等级", "施法时间", "成分", "范围", "目标", "持续时间"];
const fields = fieldNames.map((name) => {
  const match = block.match(new RegExp(`^${name}：([^\\n]+)$`, "m"));
  if (!match) throw new Error(`Missing Harrowing field: ${name}`);
  return { label: name, value: match[1].trim() };
});
const duration = block.match(/^持续时间：[^\n]+$/m);
const effect = block.slice(duration.index + duration[0].length).trim();
fields.push({ label: "效果与牌表", value: effect });
const result = await writeCatalogPage({ outputPath: new URL("../harrowing.html", import.meta.url), slug: "harrowing", title: "哈罗占卜（Harrowing）", eyebrow: "预言系法术 · 3环", description: "哈罗占卜法术的完整规则、花色检定与阵营对照。", sections: [{ key: "spell", label: "法术规则", entryLabel: "预言系法术", entries: [{ name: "哈罗占卜（Harrowing）", fields }] }], placeholder: "搜索施法信息、花色、检定或阵营…" });
console.log(JSON.stringify(result, null, 2));

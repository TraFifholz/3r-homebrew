import { readFile } from "node:fs/promises";
import { writeCatalogPage } from "./catalog-page-helpers.mjs";

const source = (await readFile(new URL("../sources/feats-prestige.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const greaterSource = (await readFile(new URL("../sources/greater-harrowing.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n").trim();
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

const greaterFieldMap = [
  ["等级", "等级"], ["施法时间", "施放时间"], ["成分", "成分"], ["范围", "范围"], ["目标", "目标"], ["持续时间", "持续"],
];
const greaterFields = [{ label: "学派", value: "预言系" }, ...greaterFieldMap.map(([label, sourceLabel]) => {
  const match = greaterSource.match(new RegExp(`^${sourceLabel}：([^\\n]+)$`, "m"));
  if (!match) throw new Error(`Missing Greater Harrowing field: ${sourceLabel}`);
  return { label, value: match[1].trim() };
})];
const greaterDuration = greaterSource.match(/^持续：[^\n]+$/m);
greaterFields.push({ label: "效果与花色能力", value: greaterSource.slice(greaterDuration.index + greaterDuration[0].length).trim() });

const result = await writeCatalogPage({ outputPath: new URL("../harrowing.html", import.meta.url), slug: "harrowing", title: "哈罗占卜法术", eyebrow: "预言系法术 · 基础与高等", description: "哈罗占卜与高等哈罗占卜的完整规则、花色检定和特殊能力。", sections: [{ key: "spell", label: "法术规则", entryLabel: "预言系法术", entries: [{ name: "哈罗占卜（Harrowing）", fields }, { name: "高等哈罗占卜（Harrowing, Greater）", fields: greaterFields }] }], placeholder: "搜索施法信息、花色、检定或特殊能力…" });
console.log(JSON.stringify(result, null, 2));

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
  return { label: name, value: match[1].trim(), kind: "meta" };
});
const duration = block.match(/^持续时间：[^\n]+$/m);
const effect = block.slice(duration.index + duration[0].length).trim();
fields.push({ label: "效果与牌表", value: effect, kind: "body" });

const greaterFieldMap = [
  ["等级", "等级"], ["施法时间", "施放时间"], ["成分", "成分"], ["范围", "范围"], ["目标", "目标"], ["持续时间", "持续"],
];
const greaterFields = [{ label: "学派", value: "预言系", kind: "meta" }, ...greaterFieldMap.map(([label, sourceLabel]) => {
  const match = greaterSource.match(new RegExp(`^${sourceLabel}：([^\\n]+)$`, "m"));
  if (!match) throw new Error(`Missing Greater Harrowing field: ${sourceLabel}`);
  return { label, value: match[1].trim(), kind: "meta" };
})];
const greaterDuration = greaterSource.match(/^持续：[^\n]+$/m);
greaterFields.push({ label: "效果与花色能力", value: greaterSource.slice(greaterDuration.index + greaterDuration[0].length).trim(), kind: "body" });

const dreamMarker = "梦中盛宴（Dream Feast；黛丝娜法术，出自Inner Sea Gods）";
const dreamStart = source.indexOf(dreamMarker);
const dreamEnd = source.indexOf("化蝶（Butterfly）", dreamStart);
if (dreamStart < 0 || dreamEnd < 0) throw new Error("Missing Dream Feast spell boundaries");
const dreamBlock = source.slice(dreamStart + dreamMarker.length, dreamEnd).trim();
const dreamFieldNames = ["学派", "环级", "施法时间", "成分", "范围", "目标", "持续时间", "豁免", "法术抗力"];
const dreamFields = dreamFieldNames.map((name) => {
  const match = dreamBlock.match(new RegExp(`^${name}：([^\\n]+)$`, "m"));
  if (!match) throw new Error(`Missing Dream Feast field: ${name}`);
  return { label: name === "环级" ? "等级" : name, value: match[1].trim(), kind: "meta" };
});
const dreamResistance = dreamBlock.match(/^法术抗力：[^\n]+$/m);
dreamFields.push({ label: "效果", value: dreamBlock.slice(dreamResistance.index + dreamResistance[0].length).trim(), kind: "body" });

const result = await writeCatalogPage({
  outputPath: new URL("../harrowing.html", import.meta.url),
  slug: "harrowing",
  title: "法术",
  eyebrow: "法术资料 · 3项",
  description: "哈罗占卜、高等哈罗占卜与进阶职业引用法术的完整规则。",
  sections: [
    { key: "harrow", label: "哈罗占卜", shortLabel: "哈罗", entryLabel: "预言系法术", entries: [{ name: "哈罗占卜（Harrowing）", fields, className: "spell-entry" }, { name: "高等哈罗占卜（Harrowing, Greater）", fields: greaterFields, className: "spell-entry" }] },
    { key: "other", label: "其他法术", shortLabel: "其他", entryLabel: "法术", entries: [{ name: "梦中盛宴（Dream Feast）", fields: dreamFields, className: "spell-entry" }] },
  ],
  placeholder: "搜索法术、施法信息、花色或效果…",
});
console.log(JSON.stringify(result, null, 2));

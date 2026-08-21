import { readFile } from "node:fs/promises";
import { extractEntries, writeCatalogPage } from "./catalog-page-helpers.mjs";

const source = (await readFile(new URL("../sources/harrow-options.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const start = source.indexOf("新物品");
const equipment = source.slice(start, source.indexOf("盗贼选项", start));

const mundaneDefinitions = [
  { name: "哈罗牌匣（Harrow carrying case）", marker: "哈罗牌匣（Harrow carrying case）：" },
  { name: "哈罗牌垫（Harrow mat）", marker: "哈罗牌垫（Harrow mat）：" },
];
const magicDefinitions = [
  { name: "Backbiter's focus", marker: "（Backbiter's focus）：" },
  { name: "堡垒靴（Bastion boots）", marker: "堡垒靴（Bastion boots）：" },
  { name: "银命之牌（Deck of Silvering Fate）", marker: "银命之牌（Deck of Silvering Fate）：" },
  { name: "占卜者透镜（Fate-reader‘s lenses）", marker: "占卜者透镜（Fate-reader‘s lenses）：" },
  { name: "Man mountain armor", marker: "（Man mountain armor）：" },
  { name: "灵媒哈罗牌垫（Midium’s harrow mat）", marker: "灵媒哈罗牌垫（Midium’s harrow mat）：" },
  { name: "哑巴娃娃（Mute marionette）", marker: "哑巴娃娃（Mute marionette）：" },
  { name: "旅行者大箱（Traveller's grandiose carrying case）", marker: "旅行者大箱（Traveller's grandiose carrying case）：" },
  { name: "兔爷之剑（Rabbit's blade）", marker: "兔爷之剑（Rabbit's blade）：" },
  { name: "蛇咬匕首（Snakebite dagger）", marker: "蛇咬匕首（Snakebite dagger）：" },
];
const mundaneMeta = [
  { price: "10 GP", weight: "2磅" }, { price: "80 GP", weight: "1磅" },
];
const magicMeta = [
  ["7800 GP", "1磅", "无", "7", "中等塑能系", "4900 GP", "制作权杖，降咒（bestow curse）"],
  ["10500 GP", "4磅", "足", "10", "中等变化系", "5250 GP", "制作奇物，浮空术（levitate）"],
  ["13000 GP", "—", "无", "7", "中等塑能系", "6500 GP", "制作魔法武器和防具，制作奇物，致命发牌者（Deadly Dealer），魔法飞弹（magic missile）"],
  ["11250 GP", "—", "无", "5", "强烈预言系", "5625 GP", "制作奇物，enter imageAPG"],
  ["32350 GP", "75磅", "盔甲", "15", "强烈变化系", "17150 GP", "制作魔法武器和防具，地震术（earthquake）"],
  ["2500 GP", "1磅", "无", "7", "中等死灵系", "1250 GP", "制作奇物，死者交谈（speak with dead）"],
  ["16500 GP", "2磅", "无", "7", "中等附魔系", "8250 GP", "制作奇物，困惑术（confusion），fumbletongueUM"],
  ["1200 GP", "2磅", "无", "5", "中等幻术和变化系", "600 GP", "制作奇物，黑暗术（darkness），忍受元素（endure elements），强效幻影（major image）"],
  ["22307 GP", "1磅", "无", "7", "中等塑能系", "11307 GP", "顺势斩，制作魔法武器与防具，大顺势斩，神能（divine power）"],
  ["9760 GP", "1磅", "无", "10", "中等附魔系", "4880 GP", "制作魔法武器与防具，修改记忆（modify memory）"],
];

const mundaneRaw = extractEntries(equipment, mundaneDefinitions, "物品 价格（GP） 重量（磅） 位置");
const mundane = mundaneRaw.map((entry, index) => ({ ...entry, fields: [{ label: "价格", value: mundaneMeta[index].price }, { label: "重量", value: mundaneMeta[index].weight }, { label: "效果", value: entry.fields[0].value }] }));
const magicRaw = extractEntries(equipment, magicDefinitions, null, equipment.indexOf("（Backbiter's focus）："));
const magic = magicRaw.map((entry, index) => {
  const [price, weight, slot, casterLevel, aura, cost, requirements] = magicMeta[index];
  return { ...entry, fields: [{ label: "价格", value: price }, { label: "重量", value: weight }, { label: "位置", value: slot }, { label: "施法者等级", value: casterLevel }, { label: "灵光", value: aura }, { label: "成本", value: cost }, { label: "建造条件", value: requirements }, { label: "效果", value: entry.fields[0].value }] };
});
if (mundane.length !== 2 || magic.length !== 10) throw new Error(`Unexpected equipment counts: ${JSON.stringify({ mundane: mundane.length, magic: magic.length })}`);
const result = await writeCatalogPage({ outputPath: new URL("../harrow-equipment.html", import.meta.url), slug: "harrow-equipment", title: "哈罗装备", eyebrow: "装备资料 · 12件物品", description: "哈罗牌相关用具和魔法物品资料。", sections: [{ key: "mundane", label: "哈罗牌具", shortLabel: "用具", entryLabel: "常规物品", entries: mundane }, { key: "magic", label: "魔法物品", shortLabel: "魔法物品", entries: magic }], placeholder: "搜索物品、价格、建造条件或效果…" });
console.log(JSON.stringify(result, null, 2));

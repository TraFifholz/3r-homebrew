import { readFile } from "node:fs/promises";
import { extractEntries, writeCatalogPage } from "./catalog-page-helpers.mjs";

const harrowSource = (await readFile(new URL("../sources/harrow-options.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const korvosa = (await readFile(new URL("../sources/korvosa-equipment.txt", import.meta.url), "utf8")).replace(/\r\n?/g, "\n");
const harrowStart = harrowSource.indexOf("新物品");
const harrow = harrowSource.slice(harrowStart, harrowSource.indexOf("盗贼选项", harrowStart));

function body(marker, endMarker) {
  const start = korvosa.indexOf(marker);
  const end = endMarker ? korvosa.indexOf(endMarker, start + marker.length) : korvosa.length;
  if (start < 0 || end < 0) throw new Error(`Missing Korvosa boundary: ${marker}`);
  return korvosa.slice(start + marker.length, end).trim();
}
const descriptions = {
  chew: body("野蛮人嚼草\n", "\n\n医师面具\n"),
  mask: body("医师面具\n", "\n\n碎地锤 Earth Breaker\n"),
  earthBreaker: body("碎地锤 Earth Breaker\n", "\n\n哈罗牌组\n"),
  deck: body("哈罗牌组\n", "\n\n生皮衫 Hide Shirt\n"),
  hideShirt: body("生皮衫 Hide Shirt\n", "\n\n香水／古龙水\n"),
  perfume: body("香水／古龙水\n", "\n\n暗袋围巾 Pocketed Scarf\n"),
  pocketedScarf: body("暗袋围巾 Pocketed Scarf\n", "\n\n强化围巾 Reinforced Scarf\n"),
  reinforcedScarf: body("强化围巾 Reinforced Scarf\n", "\n\n科沃萨武器"),
  klar: body("\n克拉尔 Klar\n", "\n\n锯齿军刀 Sawtooth Sabre\n"),
  sawtooth: body("锯齿军刀 Sawtooth Sabre\n", "\n\n刃围巾 Bladed Scarf\n"),
  bladedScarf: body("刃围巾 Bladed Scarf\n", "\n\n绍安提飞石索 Shoanti Bola\n"),
  bola: body("绍安提飞石索 Shoanti Bola\n", "\n\n星刃 Starknife\n"),
  starknife: body("星刃 Starknife\n", "\n\n瓦里西亚神像 Varisian Idol\n"),
  idol: body("瓦里西亚神像 Varisian Idol\n", null),
};

const fields = (pairs) => pairs.map(([label, value]) => ({ label, value }));
const korvosaTools = [
  ["野蛮人嚼草（Barbarian Chew）", "15 GP", "1磅", descriptions.chew],
  ["医师面具（Doctor’s Mask）", "50 GP", "2磅", descriptions.mask],
  ["哈罗牌组（Harrow Deck）", "100 GP", "—", descriptions.deck],
  ["普通香水", "1 GP／剂", "—", descriptions.perfume],
  ["异域香水", "10 GP／剂", "—", descriptions.perfume],
  ["暗袋围巾（Pocketed Scarf）", "8 GP", "1/2磅", descriptions.pocketedScarf],
  ["强化围巾（Reinforced Scarf）", "10 GP", "1磅", descriptions.reinforcedScarf],
  ["瓦里西亚神像（Varisian Idol）", "50 GP", "—", descriptions.idol],
].map(([name, price, weight, effect]) => ({ name, fields: fields([["价格", price], ["重量", weight], ["效果", effect]]) }));

const weaponRows = [
  ["星刃（Starknife）", "军用", "24 GP", "1d3／1d4", "×3", "20尺", "3磅", "穿刺", descriptions.starknife],
  ["克拉尔（Klar）", "军用", "12 GP", "1d4／1d6", "×2", "—", "6磅", "挥砍", descriptions.klar],
  ["碎地锤（Earth Breaker）", "军用", "40 GP", "1d10／2d6", "×3", "—", "14磅", "钝击", descriptions.earthBreaker],
  ["锯齿军刀（Sawtooth Sabre）", "异种", "35 GP", "1d6／1d8", "19–20/×2", "—", "2磅", "挥砍", descriptions.sawtooth],
  ["刃围巾（Bladed Scarf）", "异种，长触及", "12 GP", "1d3／1d6", "19–20/×2", "—", "2磅", "挥砍", descriptions.bladedScarf],
  ["绍安提飞石索（Shoanti Bola）", "异种", "15 GP", "1d3／1d4", "×2", "10尺", "2磅", "钝击与穿刺", descriptions.bola],
];
const korvosaWeapons = weaponRows.map(([name, proficiency, price, damage, critical, range, weight, type, effect]) => ({ name, fields: fields([["类别", proficiency], ["价格", price], ["伤害（小／中）", damage], ["重击", critical], ["射程", range], ["重量", weight], ["类型", type], ["规则", effect]]) }));

const korvosaArmor = [
  { name: "生皮衫（Hide Shirt）", fields: fields([["价格", "90 GP"], ["护甲加值", "+4"], ["最大敏捷", "+4"], ["检定减值", "−3"], ["奥术失败", "20%"], ["速度（30／20尺）", "30／20尺"], ["重量", "25磅"], ["规则", descriptions.hideShirt]]) },
  { name: "克拉尔（Klar）", fields: fields([["价格", "12 GP"], ["护甲加值", "+1"], ["最大敏捷", "—"], ["检定减值", "−1"], ["奥术失败", "5%"], ["速度", "—"], ["重量", "6磅"], ["规则", descriptions.klar]]) },
];

const mundaneDefinitions = [
  { name: "哈罗牌匣（Harrow Carrying Case）", marker: "哈罗牌匣（Harrow carrying case）：" },
  { name: "哈罗牌垫（Harrow Mat）", marker: "哈罗牌垫（Harrow mat）：" },
];
const magicDefinitions = [
  { name: "Backbiter's Focus", marker: "（Backbiter's focus）：" },
  { name: "堡垒靴（Bastion Boots）", marker: "堡垒靴（Bastion boots）：" },
  { name: "银命之牌（Deck of Silvering Fate）", marker: "银命之牌（Deck of Silvering Fate）：" },
  { name: "占卜者透镜（Fate-reader‘s Lenses）", marker: "占卜者透镜（Fate-reader‘s lenses）：" },
  { name: "Man Mountain Armor", marker: "（Man mountain armor）：" },
  { name: "灵媒哈罗牌垫（Midium’s Harrow Mat）", marker: "灵媒哈罗牌垫（Midium’s harrow mat）：" },
  { name: "哑巴娃娃（Mute Marionette）", marker: "哑巴娃娃（Mute marionette）：" },
  { name: "旅行者大箱（Traveller's Grandiose Carrying Case）", marker: "旅行者大箱（Traveller's grandiose carrying case）：" },
  { name: "兔爷之剑（Rabbit's Blade）", marker: "兔爷之剑（Rabbit's blade）：" },
  { name: "蛇咬匕首（Snakebite Dagger）", marker: "蛇咬匕首（Snakebite dagger）：" },
];
const mundaneMeta = [["10 GP", "2磅"], ["80 GP", "1磅"]];
const magicMeta = [
  ["7800 GP", "1磅", "无", "7", "中等塑能系", "4900 GP", "制作权杖，降咒（bestow curse）"],
  ["10500 GP", "4磅", "足", "10", "中等变化系", "5250 GP", "制作奇物，浮空术（levitate）"],
  ["13000 GP", "—", "无", "7", "中等塑能系", "6500 GP", "制作魔法武器和防具，制作奇物，致命发牌者，魔法飞弹"],
  ["11250 GP", "—", "无", "5", "强烈预言系", "5625 GP", "制作奇物，enter imageAPG"],
  ["32350 GP", "75磅", "盔甲", "15", "强烈变化系", "17150 GP", "制作魔法武器和防具，地震术"],
  ["2500 GP", "1磅", "无", "7", "中等死灵系", "1250 GP", "制作奇物，死者交谈"],
  ["16500 GP", "2磅", "无", "7", "中等附魔系", "8250 GP", "制作奇物，困惑术，fumbletongueUM"],
  ["1200 GP", "2磅", "无", "5", "中等幻术和变化系", "600 GP", "制作奇物，黑暗术，忍受元素，强效幻影"],
  ["22307 GP", "1磅", "无", "7", "中等塑能系", "11307 GP", "顺势斩，制作魔法武器与防具，大顺势斩，神能"],
  ["9760 GP", "1磅", "无", "10", "中等附魔系", "4880 GP", "制作魔法武器与防具，修改记忆"],
];
const mundaneRaw = extractEntries(harrow, mundaneDefinitions, "物品 价格（GP） 重量（磅） 位置");
const harrowTools = mundaneRaw.map((entry, index) => ({ ...entry, fields: fields([["价格", mundaneMeta[index][0]], ["重量", mundaneMeta[index][1]], ["效果", entry.fields[0].value]]) }));
const magicRaw = extractEntries(harrow, magicDefinitions, null, harrow.indexOf("（Backbiter's focus）："));
const harrowMagic = magicRaw.map((entry, index) => {
  const [price, weight, slot, casterLevel, aura, cost, requirements] = magicMeta[index];
  return { ...entry, fields: fields([["价格", price], ["重量", weight], ["位置", slot], ["施法者等级", casterLevel], ["灵光", aura], ["成本", cost], ["建造条件", requirements], ["效果", entry.fields[0].value]]) };
});

const sections = [
  { key: "korvosa-tool", label: "科沃萨用具", shortLabel: "用具", entryLabel: "常规用具", entries: korvosaTools },
  { key: "korvosa-weapon", label: "科沃萨武器", shortLabel: "武器", entryLabel: "武器", entries: korvosaWeapons },
  { key: "korvosa-armor", label: "科沃萨护甲与盾牌", shortLabel: "护甲／盾牌", entryLabel: "护甲／盾牌", entries: korvosaArmor },
  { key: "harrow-tool", label: "哈罗牌具", shortLabel: "哈罗牌具", entryLabel: "常规物品", entries: harrowTools },
  { key: "harrow-magic", label: "哈罗魔法物品", shortLabel: "哈罗魔法", entryLabel: "魔法物品", entries: harrowMagic },
];
if (sections.reduce((sum, section) => sum + section.entries.length, 0) !== 28) throw new Error("Unexpected equipment total");
const result = await writeCatalogPage({ outputPath: new URL("../equipment.html", import.meta.url), slug: "equipment", title: "装备", eyebrow: "科沃萨与哈罗装备 · 28项", description: "科沃萨用具、武器、护甲、盾牌与哈罗装备资料。", sections, placeholder: "搜索物品、武器数据、价格或效果…" });
console.log(JSON.stringify(result, null, 2));

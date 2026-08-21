import { readFile, writeFile } from "node:fs/promises";

const sourcePath = new URL("../sources/feats-prestige.txt", import.meta.url);
const outputPath = new URL("../feats-prestige.html", import.meta.url);
const source = (await readFile(sourcePath, "utf8")).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();

const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const formatValue = (value) => escapeHtml(value.trim()).replace(/\n{2,}/g, "<br><br>").replace(/\n/g, "<br>");

function extractEntries(definitions, endMarker, searchFrom = 0) {
  return definitions.map((definition, index) => {
    const start = source.indexOf(definition.marker, searchFrom);
    const nextMarker = definitions[index + 1]?.marker ?? endMarker;
    const end = nextMarker ? source.indexOf(nextMarker, start + definition.marker.length) : source.length;
    if (start < 0 || end < 0) throw new Error(`Missing boundary: ${definition.marker}`);
    const body = source.slice(start + definition.marker.length, end).trim();
    searchFrom = start + definition.marker.length;
    return { name: definition.name, body: definition.includeMarker ? `${definition.marker}${body ? ` ${body}` : ""}` : body };
  });
}

const featDefinitions = [
  { name: "密文魔法（Cypher Magic）", marker: "密文魔法（Cypher Magic）" },
  { name: "瓦瑞西安刺青（Varisian Tattoo）", marker: "瓦瑞西安刺青（Varisian Tattoo）" },
  { name: "黑貂连队陆战队员（Sable Company Marine）", marker: "黑貂连队陆战队员 Sable Company Marine" },
  { name: "屋脊奔行者（Shingle Runner）", marker: "屋脊奔行者 Shingle Runner" },
  { name: "弩术精通（Crossbow Mastery）", marker: "弩术精通 Crossbow Mastery" },
  { name: "阿卡达玛毕业生（Acadamae Graduate）", marker: "新专长：阿卡达玛毕业生 Acadamae Graduate" },
  { name: "哈罗眷命（Harrowed）", marker: "哈罗眷命 Harrowed" },
];
const prestigeDefinitions = [
  { name: "历史探索者（Pathfinder Chronicler）", marker: "历史探索者（Pathfinder Chronicler）" },
  { name: "间谍大师（Master Spy）", marker: "间谍大师（Master Spy）" },
  { name: "密文法师（Cyphermage）", marker: "谜港城（Riddleport）的密文法师", includeMarker: true },
  { name: "刺青秘法师（Tattooed Mystic）", marker: "刺青秘法师（Tattooed Mystic）" },
  { name: "哈罗牌大师（Harrower）", marker: "哈罗牌大师（Harrower）" },
  { name: "晨花隐者（Dawnflower Anchorite）", marker: "晨花隐者（Dawnflower Anchorite）" },
  { name: "天体颂唱者（Sphere Singer）", marker: "天体颂唱者（Sphere Singer）" },
];

const feats = extractEntries(featDefinitions, "新进阶职业：");
const prestige = extractEntries(prestigeDefinitions, null, source.indexOf("新进阶职业："));
if (feats.length !== 7 || prestige.length !== 7) throw new Error(`Unexpected counts: ${JSON.stringify({ feats: feats.length, prestige: prestige.length })}`);
for (const entry of [...feats, ...prestige]) if (!entry.body) throw new Error(`Empty entry: ${entry.name}`);

let sequence = 0;
function renderEntries(entries, category, label) {
  return entries.map((entry) => {
    sequence += 1;
    const id = `option-${category}-${String(sequence).padStart(2, "0")}`;
    return `<article class="scout-entry" id="${id}" data-category="${category}">
      <header><div><p class="type-label">${label}</p><h3>${escapeHtml(entry.name)}</h3></div><button class="copy-link" type="button" data-anchor="${id}">链接</button></header>
      <dl class="entry-fields"><div><dt>正文</dt><dd>${formatValue(entry.body)}</dd></div></dl>
    </article>`;
  }).join("\n");
}

const totalEntries = feats.length + prestige.length;
const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#16130f" />
    <meta name="description" content="D&D与Pathfinder中文房规资料：新专长和进阶职业。" />
    <meta property="og:title" content="专长与进阶职业｜3R Homebrew" />
    <meta property="og:description" content="7项专长与7个进阶职业的完整规则资料。" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://trafifholz.github.io/3r-homebrew/feats-prestige.html" />
    <meta name="twitter:card" content="summary" />
    <title>专长与进阶职业｜3R Homebrew</title>
    <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="styles.css" />
    <script src="feats-prestige-library.js" defer></script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">3R</span><strong>Homebrew</strong></a>
      <nav aria-label="主导航"><a href="index.html">扩展技法</a><a href="domain-feats.html">领域专长</a><a href="cleric-variants.html">职业替换</a><a href="scout-rework.html">斥候重做</a><a href="ranger-update.html">巡林客更新</a><a href="rogue-update.html">游荡者更新</a><a href="bard-movements.html">诗人乐章</a><a href="feats-prestige.html" aria-current="page">专长与进阶</a><a href="https://github.com/TraFifholz/3r-homebrew" target="_blank" rel="noreferrer">GitHub ↗</a></nav>
    </header>
    <main>
      <section class="library section-shell ranger-library" id="library" aria-labelledby="library-title">
        <div class="section-heading library-heading"><div><p class="eyebrow">角色选项 · ${totalEntries} 项完整资料</p><h2 id="library-title">专长与进阶职业</h2></div><p id="result-count" role="status" aria-live="polite">共 ${totalEntries} 项</p></div>
        <div class="toolbar scout-toolbar" aria-label="专长与进阶职业筛选工具">
          <label class="search-box"><span class="sr-only">搜索专长与进阶职业</span><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="搜索名称、条件、能力或规则文字…" autocomplete="off" /><kbd>/</kbd></label>
          <div class="type-filters" id="option-filters" role="group" aria-label="按规则分类筛选"><button class="filter is-active" type="button" data-category="全部" aria-pressed="true">全部</button><button class="filter" type="button" data-category="feat" aria-pressed="false">专长</button><button class="filter" type="button" data-category="prestige" aria-pressed="false">进阶职业</button></div>
        </div>
        <section class="scout-section" data-section="feat"><h3>新专长 <span>${feats.length}</span></h3><div class="scout-entries">${renderEntries(feats, "feat", "专长")}</div></section>
        <section class="scout-section" data-section="prestige"><h3>进阶职业 <span>${prestige.length}</span></h3><div class="scout-entries">${renderEntries(prestige, "prestige", "进阶职业")}</div></section>
        <div class="empty-state" id="option-empty" hidden><p class="empty-glyph" aria-hidden="true">∅</p><h3>没有找到对应资料</h3><p>试试缩短关键词或切换分类。</p><button class="button button-ghost" id="clear-options" type="button">清除筛选</button></div>
      </section>
    </main>
  </body>
</html>`;

await writeFile(outputPath, `${html}\n`, "utf8");
console.log(JSON.stringify({ output: outputPath.pathname, feats: feats.length, prestige: prestige.length, totalEntries }, null, 2));

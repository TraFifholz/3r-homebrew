const list = document.querySelector("#feat-list");
const template = document.querySelector("#feat-template");
const searchInput = document.querySelector("#search");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const clearSearch = document.querySelector("#clear-search");

let feats = [];

const normalize = (value) => value.toLocaleLowerCase("zh-CN").replace(/\s+/g, "");
const anchorFor = (feat) => `domain-feat-${feat.id}`;

function makeCard(feat) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.id = anchorFor(feat);
  card.querySelector(".card-index").textContent = feat.id;
  card.querySelector("h3").textContent = feat.name;
  card.querySelector(".effect dd").textContent = feat.effect;

  const specialList = card.querySelector(".specials ul");
  for (const text of feat.special) {
    const item = document.createElement("li");
    item.textContent = text;
    specialList.append(item);
  }

  const copyButton = card.querySelector(".copy-link");
  copyButton.addEventListener("click", async () => {
    const url = new URL(window.location.href);
    url.hash = anchorFor(feat);
    try {
      await navigator.clipboard.writeText(url.href);
      copyButton.textContent = "已复制";
      window.setTimeout(() => (copyButton.textContent = "链接"), 1400);
    } catch {
      window.location.hash = anchorFor(feat);
    }
  });
  return card;
}

function render() {
  const query = normalize(searchInput.value);
  const matches = feats.filter((feat) => !query || normalize([feat.name, feat.effect, ...feat.special].join(" ")).includes(query));
  list.replaceChildren(...matches.map(makeCard));
  resultCount.textContent = matches.length === feats.length ? `共 ${feats.length} 项` : `找到 ${matches.length} 项 · 共 ${feats.length} 项`;
  emptyState.hidden = matches.length !== 0;
}

searchInput.addEventListener("input", render);
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  render();
  searchInput.focus();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
});

async function init() {
  try {
    const response = await fetch("data/domain-feats.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    feats = payload.feats;
    render();
    if (window.location.hash.startsWith("#domain-feat-")) {
      requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
    }
  } catch (error) {
    resultCount.textContent = "规则载入失败，请刷新页面重试。";
    console.error(error);
  }
}

init();

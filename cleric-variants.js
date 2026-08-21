const list = document.querySelector("#variant-list");
const template = document.querySelector("#variant-template");
const searchInput = document.querySelector("#search");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const clearSearch = document.querySelector("#clear-search");

let variants = [];

const normalize = (value) => value.toLocaleLowerCase("zh-CN").replace(/\s+/g, "");
const anchorFor = (variant) => `cleric-variant-${variant.id}`;

function makeCard(variant) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.id = anchorFor(variant);
  card.querySelector(".card-index").textContent = variant.id;
  card.querySelector("h3").textContent = variant.name;
  card.querySelector(".restriction").textContent = variant.restriction;
  card.querySelector(".level").textContent = variant.level;
  card.querySelector(".loss dd").textContent = variant.loss;
  card.querySelector(".gain dd").textContent = variant.gain;

  const copyButton = card.querySelector(".copy-link");
  copyButton.addEventListener("click", async () => {
    const url = new URL(window.location.href);
    url.hash = anchorFor(variant);
    try {
      await navigator.clipboard.writeText(url.href);
      copyButton.textContent = "已复制";
      window.setTimeout(() => (copyButton.textContent = "链接"), 1400);
    } catch {
      window.location.hash = anchorFor(variant);
    }
  });
  return card;
}

function render() {
  const query = normalize(searchInput.value);
  const matches = variants.filter((variant) => !query || normalize(Object.values(variant).join(" ")).includes(query));
  list.replaceChildren(...matches.map(makeCard));
  resultCount.textContent = matches.length === variants.length ? `共 ${variants.length} 项` : `找到 ${matches.length} 项 · 共 ${variants.length} 项`;
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
    const response = await fetch("data/cleric-variants.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    variants = payload.variants;
    render();
    if (window.location.hash.startsWith("#cleric-variant-")) {
      requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
    }
  } catch (error) {
    resultCount.textContent = "规则载入失败，请刷新页面重试。";
    console.error(error);
  }
}

init();

const PAGE_SIZE = 36;
const list = document.querySelector("#technique-list");
const template = document.querySelector("#technique-template");
const searchInput = document.querySelector("#search");
const filters = [...document.querySelectorAll(".filter")];
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const loadMore = document.querySelector("#load-more");
const clearFilters = document.querySelector("#clear-filters");

let data = [];
let selectedType = "全部";
let visibleLimit = PAGE_SIZE;

const normalize = (value) => value.toLocaleLowerCase("zh-CN").replace(/\s+/g, "");
const anchorFor = (item) => `technique-${item.id}`;

function updateSummary(items) {
  const count = (type) => items.filter((item) => item.type === type).length;
  document.querySelector("#total-count").textContent = items.length;
  document.querySelector("#count-operation").textContent = count("操作技法");
  document.querySelector("#count-mental").textContent = count("精神技法");
  document.querySelector("#count-movement").textContent = count("移动技法");
  document.querySelector("#count-social").textContent = count("交流技法");
}

function filteredItems() {
  const query = normalize(searchInput.value);
  return data.filter((item) => {
    const matchesType = selectedType === "全部" || item.type === selectedType;
    const haystack = normalize([item.name, item.type, item.prerequisite, item.effect, ...item.special].join(" "));
    return matchesType && (!query || haystack.includes(query));
  });
}

function makeCard(item) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.id = anchorFor(item);
  card.dataset.type = item.type;
  card.querySelector(".card-index").textContent = item.id;
  card.querySelector(".type-label").textContent = item.type;
  card.querySelector("h3").textContent = item.name;
  card.querySelector(".prerequisite dd").textContent = item.prerequisite;
  card.querySelector(".effect dd").textContent = item.effect;

  const specials = card.querySelector(".specials");
  if (item.special.length) {
    const specialList = specials.querySelector("ul");
    for (const text of item.special) {
      const li = document.createElement("li");
      li.textContent = text;
      specialList.append(li);
    }
  } else {
    specials.remove();
  }

  const copyButton = card.querySelector(".copy-link");
  copyButton.addEventListener("click", async () => {
    const url = new URL(window.location.href);
    url.hash = anchorFor(item);
    try {
      await navigator.clipboard.writeText(url.href);
      copyButton.textContent = "已复制";
      window.setTimeout(() => (copyButton.textContent = "链接"), 1400);
    } catch {
      window.location.hash = anchorFor(item);
    }
  });
  return card;
}

function render() {
  const matches = filteredItems();
  const shown = matches.slice(0, visibleLimit);
  list.replaceChildren(...shown.map(makeCard));
  resultCount.textContent = matches.length === data.length ? `共 ${data.length} 项` : `找到 ${matches.length} 项 · 共 ${data.length} 项`;
  emptyState.hidden = matches.length !== 0;
  loadMore.hidden = matches.length <= shown.length;
  if (!loadMore.hidden) loadMore.textContent = `显示更多（余 ${matches.length - shown.length} 项）`;
}

function resetAndRender() {
  visibleLimit = PAGE_SIZE;
  render();
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    selectedType = button.dataset.type;
    filters.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-pressed", String(active));
    });
    resetAndRender();
  });
});

searchInput.addEventListener("input", resetAndRender);
loadMore.addEventListener("click", () => {
  visibleLimit += PAGE_SIZE;
  render();
});
clearFilters.addEventListener("click", () => {
  searchInput.value = "";
  filters[0].click();
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
    const response = await fetch("data/techniques.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    data = payload.techniques;
    updateSummary(data);
    render();

    if (window.location.hash.startsWith("#technique-")) {
      const index = data.findIndex((item) => `#${anchorFor(item)}` === window.location.hash);
      if (index >= visibleLimit) {
        visibleLimit = index + 1;
        render();
      }
      requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
    }
  } catch (error) {
    resultCount.textContent = "规则载入失败，请刷新页面重试。";
    console.error(error);
  }
}

init();

const searchInput = document.querySelector("#search");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const clearSearch = document.querySelector("#clear-search");
const cards = [...document.querySelectorAll(".variant-card")];

const normalize = (value) => value.toLocaleLowerCase("zh-CN").replace(/\s+/g, "");

function render() {
  const query = normalize(searchInput.value);
  let visible = 0;
  for (const card of cards) {
    const haystack = normalize(`${card.dataset.search} ${card.textContent}`);
    const matches = !query || haystack.includes(query);
    card.hidden = !matches;
    if (matches) visible += 1;
  }
  resultCount.textContent = visible === cards.length ? `共 ${cards.length} 项` : `找到 ${visible} 项 · 共 ${cards.length} 项`;
  emptyState.hidden = visible !== 0;
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

for (const button of document.querySelectorAll(".copy-link[data-anchor]")) {
  button.addEventListener("click", async () => {
    const url = new URL(window.location.href);
    url.hash = button.dataset.anchor;
    try {
      await navigator.clipboard.writeText(url.href);
      button.textContent = "已复制";
      window.setTimeout(() => (button.textContent = "链接"), 1400);
    } catch {
      window.location.hash = button.dataset.anchor;
    }
  });
}

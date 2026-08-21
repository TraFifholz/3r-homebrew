const searchInput = document.querySelector("#search");
const filters = [...document.querySelectorAll("#ranger-filters .filter")];
const entries = [...document.querySelectorAll(".scout-entry")];
const sections = [...document.querySelectorAll(".scout-section")];
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#ranger-empty");
const clearButton = document.querySelector("#clear-ranger");
let category = "全部";
const normalize = (value) => value.toLocaleLowerCase("zh-CN").replace(/\s+/g, "");

function render() {
  const query = normalize(searchInput.value);
  let visible = 0;
  for (const entry of entries) {
    const matches = (category === "全部" || entry.dataset.category === category) && (!query || normalize(entry.textContent).includes(query));
    entry.hidden = !matches;
    if (matches) visible += 1;
  }
  for (const section of sections) section.hidden = !section.querySelector(".scout-entry:not([hidden])");
  resultCount.textContent = visible === entries.length ? `共 ${entries.length} 项` : `找到 ${visible} 项 · 共 ${entries.length} 项`;
  emptyState.hidden = visible !== 0;
}

filters.forEach((button) => button.addEventListener("click", () => {
  category = button.dataset.category;
  filters.forEach((candidate) => {
    const active = candidate === button;
    candidate.classList.toggle("is-active", active);
    candidate.setAttribute("aria-pressed", String(active));
  });
  render();
}));
searchInput.addEventListener("input", render);
clearButton.addEventListener("click", () => { searchInput.value = ""; filters[0].click(); searchInput.focus(); });
document.addEventListener("keydown", (event) => { if (event.key === "/" && document.activeElement !== searchInput) { event.preventDefault(); searchInput.focus(); } });

for (const button of document.querySelectorAll(".copy-link[data-anchor]")) {
  button.addEventListener("click", async () => {
    const url = new URL(window.location.href); url.hash = button.dataset.anchor;
    try { await navigator.clipboard.writeText(url.href); button.textContent = "已复制"; window.setTimeout(() => (button.textContent = "链接"), 1400); }
    catch { window.location.hash = button.dataset.anchor; }
  });
}

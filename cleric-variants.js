// Compatibility for cached copies of the previous dynamic page.
if (!document.querySelector(".variant-card")) {
  const current = new URL("cleric-variants.html", window.location.href);
  current.searchParams.set("view", "static-1");
  window.location.replace(current.href);
}

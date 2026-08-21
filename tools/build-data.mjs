import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const sourcePath = process.argv[2];
const outputPath = process.argv[3] ?? "data/techniques.json";

if (!sourcePath) {
  throw new Error("Usage: node tools/build-data.mjs <source.txt> [output.json]");
}

const source = (await readFile(resolve(sourcePath), "utf8"))
  .replace(/^\uFEFF/, "")
  .replace(/\r\n?/g, "\n")
  .trim();

const headingPattern = /^(.+?)\[([^\]]+技法)\]\s*$/gm;
const headings = [...source.matchAll(headingPattern)];

function readFields(body) {
  const fields = { prerequisite: "", effect: "", special: [] };
  let active = null;

  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const marker = line.match(/^(前提|效果|特殊)：\s*(.*)$/);
    if (marker) {
      const [, label, value] = marker;
      if (label === "前提") {
        fields.prerequisite = value;
        active = "prerequisite";
      } else if (label === "效果") {
        fields.effect = value;
        active = "effect";
      } else {
        fields.special.push(value);
        active = `special:${fields.special.length - 1}`;
      }
      continue;
    }

    if (active === "prerequisite") fields.prerequisite += line;
    else if (active === "effect") fields.effect += line;
    else if (active?.startsWith("special:")) {
      const index = Number(active.split(":")[1]);
      fields.special[index] += line;
    }
  }

  return fields;
}

const techniques = headings.map((heading, index) => {
  const start = heading.index + heading[0].length;
  const end = headings[index + 1]?.index ?? source.length;
  const name = heading[1].trim();
  const type = heading[2].trim();
  return {
    id: String(index + 1).padStart(3, "0"),
    name,
    type,
    ...readFields(source.slice(start, end)),
  };
});

if (!techniques.length || techniques.some((item) => !item.effect)) {
  throw new Error("Source parsing failed: missing headings or effect fields.");
}

const payload = {
  title: "扩展技法",
  system: "D&D 3.5e 房规",
  updated: "2026-08-21",
  count: techniques.length,
  techniques,
};

await mkdir(dirname(resolve(outputPath)), { recursive: true });
await writeFile(resolve(outputPath), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${techniques.length} techniques to ${resolve(outputPath)}`);

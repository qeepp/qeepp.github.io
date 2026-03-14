const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../..");
const partialPath = path.join(repoRoot, "partials", "footer.html");

const START_MARKER = "<!-- build:footer -->";
const END_MARKER = "<!-- /build:footer -->";

const EXCLUDED_DIRS = new Set([
  ".git",
  ".github",
  "node_modules",
  "partials",
  "assets",
]);

function getAllHtmlFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        results.push(...getAllHtmlFiles(fullPath));
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }

  return results;
}

function normalize(str) {
  return str.replace(/\r\n/g, "\n");
}

function injectFooter(html, footer) {
  const source = normalize(html);
  const start = source.indexOf(START_MARKER);
  const end = source.indexOf(END_MARKER);

  if (start === -1 || end === -1 || end < start) {
    return null;
  }

  const before = source.slice(0, start + START_MARKER.length);
  const after = source.slice(end);

  return `${before}\n${footer}\n${after}`;
}

function main() {
  if (!fs.existsSync(partialPath)) {
    console.error(`Missing footer partial: ${partialPath}`);
    process.exit(1);
  }

  const footer = normalize(fs.readFileSync(partialPath, "utf8").trim());
  const htmlFiles = getAllHtmlFiles(repoRoot);

  let updated = 0;
  let skipped = 0;

  for (const file of htmlFiles) {
    const original = fs.readFileSync(file, "utf8");
    const built = injectFooter(original, footer);

    if (built === null) {
      skipped += 1;
      continue;
    }

    if (normalize(original) !== built) {
      fs.writeFileSync(file, built, "utf8");
      updated += 1;
      console.log(`Updated: ${path.relative(repoRoot, file)}`);
    }
  }

  console.log(`\nFooter build complete.`);
  console.log(`Updated files: ${updated}`);
  console.log(`Skipped files: ${skipped}`);
}

main();

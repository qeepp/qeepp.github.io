const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../..");
const partialPath = path.join(repoRoot, "partials", "footer.html");

const START_MARKER = "<!-- build:footer -->";
const END_MARKER = "<!-- /build:footer -->";

const EXCLUDED_DIRS = new Set([
  ".git",
  ".github",
  ".vscode",
  "node_modules",
  "partials",
  "assets",
  "scripts",
]);

function normalize(text) {
  return text.replace(/\r\n/g, "\n");
}

function shouldSkipDirectory(name) {
  return EXCLUDED_DIRS.has(name);
}

function getAllHtmlFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(entry.name)) {
        results.push(...getAllHtmlFiles(fullPath));
      }
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      results.push(fullPath);
    }
  }

  return results;
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
  console.log("Building QEEPP footer...");
  console.log(`Repo root: ${repoRoot}`);
  console.log(`Footer partial: ${partialPath}`);

  if (!fs.existsSync(partialPath)) {
    console.error(`Missing footer partial: ${partialPath}`);
    process.exit(1);
  }

  const footer = normalize(fs.readFileSync(partialPath, "utf8").trim());
  const htmlFiles = getAllHtmlFiles(repoRoot);

  console.log(`HTML files found: ${htmlFiles.length}`);

  let updated = 0;
  let unchanged = 0;
  let skipped = 0;

  for (const file of htmlFiles) {
    const relativePath = path.relative(repoRoot, file);
    const original = fs.readFileSync(file, "utf8");
    const built = injectFooter(original, footer);

    if (built === null) {
      skipped += 1;
      console.log(`Skipped, no footer markers: ${relativePath}`);
      continue;
    }

    if (normalize(original) === built) {
      unchanged += 1;
      console.log(`Unchanged: ${relativePath}`);
      continue;
    }

    fs.writeFileSync(file, built, "utf8");
    updated += 1;
    console.log(`Updated: ${relativePath}`);
  }

  console.log("");
  console.log("Footer build complete.");
  console.log(`Updated files: ${updated}`);
  console.log(`Unchanged files: ${unchanged}`);
  console.log(`Skipped files: ${skipped}`);

  if (updated === 0 && unchanged === 0) {
    console.error("No HTML files with footer markers were found.");
    process.exit(1);
  }
}

main();
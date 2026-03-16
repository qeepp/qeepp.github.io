const fs = require("fs");
const path = require("path");

const SITE_URL = "https://qeepp.com";
const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, "sitemap.xml");

const EXCLUDE_DIRS = new Set([
  ".git",
  ".github",
  "node_modules",
  "assets",
  "partials",
  "includes",
  "docs"
]);

const EXCLUDE_FILES = new Set([
  "404.html"
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) {
        files = files.concat(walk(fullPath));
      }
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith(".html") &&
      !EXCLUDE_FILES.has(entry.name)
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function toUrl(filePath) {
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");

  if (relPath === "index.html") {
    return `${SITE_URL}/`;
  }

  if (relPath.endsWith("/index.html")) {
    return `${SITE_URL}/${relPath.replace(/index\.html$/, "")}`;
  }

  return `${SITE_URL}/${relPath.replace(/\.html$/, "")}`;
}

function getLastMod(filePath) {
  const stats = fs.statSync(filePath);
  return stats.mtime.toISOString().split("T")[0];
}

function buildSitemap(urlEntries) {
  const body = urlEntries
    .map(
      ({ loc, lastmod }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function main() {
  const htmlFiles = walk(ROOT_DIR);

  const urlEntries = htmlFiles
    .map((filePath) => ({
      loc: toUrl(filePath),
      lastmod: getLastMod(filePath)
    }))
    .sort((a, b) => a.loc.localeCompare(b.loc));

  const xml = buildSitemap(urlEntries);
  fs.writeFileSync(OUTPUT_FILE, xml, "utf8");

  console.log(`Sitemap generated: ${OUTPUT_FILE}`);
  console.log(`URLs included: ${urlEntries.length}`);
}

main();


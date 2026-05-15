const fs = require("fs");
const { execSync } = require("child_process");

const pages = [
  "",
  "premature-scaling",
  "starfish-diagram",
  "radar-chart",
  "trends-chart",
  "assessment-methodology",
  "qeepp-assessment",
  "resources",
  "qeepp-about",
  "contact",
  "faq",
  "qeepp-assessment-checklist",
  "qeepp-practical-assessment-framework",
  "qeepp-diagnostic-interview",
  "qeepp-case-azure-modernization",
  "qeepp-maturity-model",
  "qeepp-transformation-playbook"
];

function getLastModified(file) {
  try {
    const output = execSync(
      `git log -1 --format=%cI ${file || "index.html"}`
    ).toString().trim();
    return output.split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

let urls = pages.map((page) => {
  const file = page ? `${page}.html` : "index.html";
  const lastmod = getLastModified(file);

  return `
  <url>
    <loc>https://qeepp.com/${page}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
}).join("");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

fs.writeFileSync("sitemap.xml", sitemap);

console.log("Sitemap generated.");
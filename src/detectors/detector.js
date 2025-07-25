// detector.js
const fs = require("fs");
const path = require("path");

const frameworkIndicators = [
  { name: "React", match: ["react"], files: [".jsx", ".tsx"], config: [] },
  { name: "Next.js", match: ["next"], files: [], config: ["next.config.js"] },
  {
    name: "Tailwind CSS",
    match: ["tailwindcss"],
    files: [],
    config: ["tailwind.config.js"],
  },
  { name: "Vue", match: ["vue"], files: [".vue"], config: [] },
  { name: "Vite", match: ["vite"], files: [], config: ["vite.config.js"] },
  {
    name: "Svelte",
    match: ["svelte"],
    files: [".svelte"],
    config: ["svelte.config.js"],
  },
];
const ignoredFiles = new Set(require("../utils/ignored"));

// Extensive language-extension mapping (200+)
const languageExtensions = require("../utils/langMap").main;
const otherExtensions = require("../utils/langMap").other;
function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (
        !file.includes("node_modules") &&
        !file.startsWith(".") &&
        !file.includes("dist") &&
        !file.includes("test") &&
        !file.includes("tests")
      ) {
        walk(fullPath, fileList);
      }
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// Main detector function
function detectFrameworks(projectPath) {
  const allFiles = walk(projectPath);
  const frameworks = new Set();

  // Language stats:
  // language => { files: count, lines: total lines, bytes: total bytes }
  const languageStats = {};
  const otherStats = {};

  // Read package.json dependencies if available
  let pkgJson = {};
  const pkgPath = path.join(projectPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    } catch {}
  }
  const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    const base = path.basename(filePath).toLowerCase();
    if (ignoredFiles.has(base) || base.includes("config")) {
      continue; // skip counting this file
    }

    // Dockerfile detection by filename (no extension)
    if (base === "dockerfile") {
      const lang = "Dockerfile";
      if (!languageStats[lang]) languageStats[lang] = { files: 0, bytes: 0 };
      languageStats[lang].files++;
      languageStats[lang].bytes += fs.statSync(filePath).size;
      continue;
    }

    // Language detection by extension
    if (languageExtensions[ext]) {
      const lang = languageExtensions[ext];
      if (!languageStats[lang]) languageStats[lang] = { files: 0, bytes: 0 };
      languageStats[lang].files++;
      languageStats[lang].bytes += fs.statSync(filePath).size;
    }
    if (otherExtensions[ext]) {
      const lang = otherExtensions[ext];
      if (!otherStats[lang]) otherStats[lang] = { files: 0, bytes: 0 };
      otherStats[lang].files++;
      otherStats[lang].bytes += fs.statSync(filePath).size;
    }

    // Framework detection from extension or config file name
    for (const fw of frameworkIndicators) {
      if (fw.config.some((c) => filePath.endsWith(c))) {
        frameworks.add(fw.name);
        continue;
      }
      if (fw.files.includes(ext)) frameworks.add(fw.name);
    }
  }

  // Framework detection from package.json dependencies
  for (const fw of frameworkIndicators) {
    if (deps) {
      for (const match of fw.match) {
        if (deps[match]) frameworks.add(fw.name);
      }
    }
  }

  // Calculate totals for percentages
  const languageBytes = Object.values(languageStats).reduce(
    (acc, v) => acc + v.bytes,
    0
  );
  const otherBytes = Object.values(otherStats).reduce(
    (acc, v) => acc + v.bytes,
    0
  );
  const totalBytes = languageBytes + otherBytes;
  // Add percentages
  const detailedLanguages = {};
  for (const [lang, stats] of Object.entries(languageStats)) {
    detailedLanguages[lang] = {
      files: stats.files,
      bytes: stats.bytes,
      bytesPercent:
        totalBytes > 0 ? ((stats.bytes / totalBytes) * 100).toFixed(2) : "0.00",
    };
  }
  const detailedOther = {};
  for (const [lang, stats] of Object.entries(otherStats)) {
    detailedOther[lang] = {
      files: stats.files,
      bytes: stats.bytes,
    };
  }
  return {
    frameworks: [...frameworks],
    languages: detailedLanguages,
    other: detailedOther,
    totals: {
      totalFiles: allFiles.length,
      languageBytes: languageBytes,
      otherBytes: otherBytes,
      totalBytes: totalBytes,
    },
  };
}

module.exports = detectFrameworks;

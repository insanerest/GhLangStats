// detector.js
const fs = require("fs");
const path = require("path");
const shouldExclude = require("./shouldExclude")

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

const ignoredFiles = new Set(require("./ignored"));

// Extensive language-extension mapping (200+)
const languageExtensions = require("./langMap").main;
const otherExtensions = require("./langMap").other;
function getJSONFile(path) {
  try {
    const data = fs.readFileSync(path, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading the file:", err);
  }
}
function detectLangsFromJSON(excluded, repoJSON) {
  const allFiles = getJSONFile(repoJSON);
  const languageStats = {};
  const otherStats = {}
  const frameworks = new Set();

  for (const file of allFiles.files) {
    const base = String(file.path).split("/").pop().toLowerCase();
    const ext = String(file.extension).toLowerCase();
    if (ignoredFiles.has(base) || base.includes("config") || shouldExclude(excluded,base)) {
      continue; // skip counting this file
    }
    if (base === "dockerfile") {
      const lang = "Dockerfile";
      if (!languageStats[lang]) {
        languageStats[lang] = { files: 0, bytes: 0 };
      }
      languageStats[lang].files++;
      languageStats[lang].bytes += file.size;
      continue;
    }
    if (languageExtensions[ext]) {
      const lang = languageExtensions[ext];
      if (!languageStats[lang]) {
        languageStats[lang] = { files: 0, bytes: 0 };
      }
      languageStats[lang].files++;
      languageStats[lang].bytes += file.size;
    }
    if (otherExtensions[ext]) {
      const lang = otherExtensions[ext];
      if (!otherStats[lang]) {
        otherStats[lang] = { files: 0, bytes: 0 };
      }
      otherStats[lang].files++;
      otherStats[lang].bytes += file.size;
    }

    for (const fw of frameworkIndicators) {
      if (fw.config.some((c) => file.path.endsWith(c))) {
        frameworks.add(fw.name);
        continue;
      }
      if (fw.files.includes(ext)) frameworks.add(fw.name);
    }
  }

  const languageBytes = Object.values(languageStats).reduce(
    (acc, v) => acc + v.bytes,
    0
  ) 
  const otherBytes = Object.values(otherStats).reduce(
    (acc, v) => acc + v.bytes,
    0
  )
  const totalBytes = languageBytes + otherBytes

  const detailedLanguages = {};
  for (const [lang, stats] of Object.entries(languageStats)) {
    detailedLanguages[lang] = {
      files: stats.files,
      bytes: stats.bytes,
      bytesPercent:
        totalBytes > 0 ? ((stats.bytes / languageBytes) * 100).toFixed(2) : "0.00",
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
      totalFiles: allFiles.files.length,
      languageBytes: languageBytes,
      otherBytes: otherBytes,
      totalBytes: totalBytes
    },
  };
}

module.exports = detectLangsFromJSON;

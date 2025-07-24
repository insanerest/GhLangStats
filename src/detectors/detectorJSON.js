// detector.js
const fs = require("fs");
const path = require("path");
const shouldExclude = require("../utils/shouldExclude");

const frameworkIndicators = [
  { name: "React", match: ["react"], files: [".jsx", ".tsx"] },
  { name: "Next.js", match: ["next"], files: [] },
  {
    name: "Tailwind CSS",
    match: ["tailwindcss"],
    files: [],
  },
  { name: "Vue", match: ["vue"], files: [".vue"] },
  { name: "Vite", match: ["vite"], files: [] },
  {
    name: "Svelte",
    match: ["svelte"],
    files: [".svelte"],
  },
];

const ignoredFiles = new Set(require("../utils/ignored"));

// Extensive language-extension mapping (200+)
const languageExtensions = require("../utils/langMap").main;
const otherExtensions = require("../utils/langMap").other;
function getJSONFile(path) {
  try {
    const data = fs.readFileSync(path, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading the file:", err);
    return { error: true, msg: "Invalid Path or JSON" };
  }
}
function detectLangsFromJSON(excluded, repoJSON) {
  const allFiles = getJSONFile(repoJSON);
  if (allFiles.error) return allFiles;
  const languageStats = {};
  const otherStats = {};
  const frameworks = new Set();

  for (const file of allFiles.files) {
    const base = String(file.path).split("/").pop().toLowerCase();
    const ext = String(file.extension).toLowerCase();
    const filePath = String(file.path);
    if (
      ignoredFiles.has(base) ||
      base.includes("config") ||
      shouldExclude(excluded, base)
    ) {
      continue; // skip counting this file
    }
    if (
      filePath.includes("node_modules") ||
      filePath.startsWith(".") ||
      filePath.includes("dist") ||
      filePath.includes("/test/") ||
      filePath.includes("/tests/") ||
      filePath.includes("tests/")
    ) {
      continue;
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
      console.log(file.path);
      if (fw.files.includes(ext)) frameworks.add(fw.name);
    }
  }

  const languageBytes = Object.values(languageStats).reduce(
    (acc, v) => acc + v.bytes,
    0
  );
  const otherBytes = Object.values(otherStats).reduce(
    (acc, v) => acc + v.bytes,
    0
  );
  const totalBytes = languageBytes + otherBytes;

  const detailedLanguages = {};
  for (const [lang, stats] of Object.entries(languageStats)) {
    detailedLanguages[lang] = {
      files: stats.files,
      bytes: stats.bytes,
      bytesPercent:
        totalBytes > 0
          ? ((stats.bytes / languageBytes) * 100).toFixed(2)
          : "0.00",
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
      totalBytes: totalBytes,
    },
  };
}

module.exports = detectLangsFromJSON;

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

const ignoredFiles = new Set([
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".gitignore",
  "readme.md"
  // add more as needed
]);

// Extensive language-extension mapping (200+)
const languageExtensions = {
  ".1c": "1C Enterprise",
  ".4th": "Forth",
  ".abap": "ABAP",
  ".ada": "Ada",
  ".adb": "Ada",
  ".ads": "Ada",
  ".ahk": "AutoHotkey",
  ".asm": "Assembly",
  ".asp": "ASP",
  ".aspx": "ASP.NET",
  ".awk": "Awk",
  ".bas": "BASIC",
  ".bat": "Batch",
  ".bf": "Brainfuck",
  ".bib": "BibTeX",
  ".bsh": "BeanShell",
  ".c": "C",
  ".cbl": "COBOL",
  ".cc": "C++",
  ".clj": "Clojure",
  ".cljs": "ClojureScript",
  ".cls": "Apex",
  ".cmake": "CMake",
  ".coffee": "CoffeeScript",
  ".cpp": "C++",
  ".cs": "C#",
  ".csh": "C Shell",
  ".css": "CSS",
  ".cu": "CUDA",
  ".d": "D",
  ".dart": "Dart",
  ".dfy": "Dafny",
  ".el": "Emacs Lisp",
  ".elm": "Elm",
  ".erb": "ERB",
  ".erl": "Erlang",
  ".ex": "Elixir",
  ".exs": "Elixir",
  ".f": "Fortran",
  ".f90": "Fortran",
  ".fish": "Fish",
  ".fs": "F#",
  ".fsi": "F#",
  ".fsscript": "F#",
  ".gml": "GameMaker",
  ".go": "Go",
  ".gradle": "Gradle",
  ".groovy": "Groovy",
  ".h": "C Header",
  ".haml": "Haml",
  ".handlebars": "Handlebars",
  ".haskell": "Haskell",
  ".hbs": "Handlebars",
  ".hh": "C++",
  ".hlsl": "HLSL",
  ".hs": "Haskell",
  ".html": "HTML",
  ".hx": "Haxe",
  ".idl": "IDL",
  ".ini": "INI",
  ".ipynb": "Jupyter Notebook",
  ".java": "Java",
  ".jl": "Julia",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".json": "JSON",
  ".jsp": "Java Server Pages",
  ".kt": "Kotlin",
  ".kts": "Kotlin Script",
  ".l": "Lex",
  ".less": "Less",
  ".lhs": "Literate Haskell",
  ".lisp": "Lisp",
  ".logtalk": "Logtalk",
  ".lua": "Lua",
  ".m": "Objective-C",
  ".mak": "Makefile",
  ".markdown": "Markdown",
  ".mat": "MATLAB",
  ".md": "Markdown",
  ".ml": "OCaml",
  ".mli": "OCaml Interface",
  ".mm": "Objective-C++",
  ".mjs": "JavaScript",
  ".mustache": "Mustache",
  ".nix": "Nix",
  ".nim": "Nim",
  ".nu": "Nu",
  ".p6": "Raku",
  ".pas": "Pascal",
  ".php": "PHP",
  ".pl": "Perl",
  ".pm": "Perl Module",
  ".pony": "Pony",
  ".ps1": "PowerShell",
  ".py": "Python",
  ".pyw": "Python",
  ".qml": "QML",
  ".r": "R",
  ".rake": "Ruby",
  ".rb": "Ruby",
  ".re": "ReasonML",
  ".res": "ReScript",
  ".rkt": "Racket",
  ".rs": "Rust",
  ".sass": "Sass",
  ".scala": "Scala",
  ".scm": "Scheme",
  ".scss": "SCSS",
  ".sh": "Shell",
  ".sml": "Standard ML",
  ".sol": "Solidity",
  ".sql": "SQL",
  ".ss": "Scheme",
  ".styl": "Stylus",
  ".swift": "Swift",
  ".tcl": "Tcl",
  ".tex": "LaTeX",
  ".toml": "TOML",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".vala": "Vala",
  ".vb": "VB.NET",
  ".vbs": "VBScript",
  ".vue": "Vue",
  ".wat": "WebAssembly Text",
  ".wasm": "WebAssembly",
  ".xml": "XML",
  ".xsl": "XSLT",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".zig": "Zig",
};

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!file.includes("node_modules") && !file.startsWith(".") && !file.includes("dist")) {
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
    if (ignoredFiles.has(base)) {
      continue; // skip counting this file
    }

    // Dockerfile detection by filename (no extension)
    if (base === "dockerfile") {
      const lang = "Dockerfile";
      if (!languageStats[lang])
        languageStats[lang] = { files: 0,bytes: 0 };
      languageStats[lang].files++;
      languageStats[lang].bytes += fs.statSync(filePath).size;
      continue;
    }

    // Language detection by extension
    if (languageExtensions[ext]) {
      const lang = languageExtensions[ext];
      if (!languageStats[lang])
        languageStats[lang] = { files: 0, bytes: 0 };
      languageStats[lang].files++;
      languageStats[lang].bytes += fs.statSync(filePath).size;
    }

    // Framework detection from extension or config file name
    for (const fw of frameworkIndicators) {
      if (fw.files.includes(ext)) frameworks.add(fw.name);
      if (fw.config.some((c) => filePath.endsWith(c))) frameworks.add(fw.name);
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
  const totalLines = Object.values(languageStats).reduce(
    (acc, v) => acc + v.lines,
    0
  );
  const totalBytes = Object.values(languageStats).reduce(
    (acc, v) => acc + v.bytes,
    0
  );

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

  return {
    frameworks: [...frameworks],
    languages: detailedLanguages,
    totals: {
      totalBytes,
      totalFiles: allFiles.length,
    },
  };
}

module.exports = detectFrameworks;

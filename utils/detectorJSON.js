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
  "readme.md",
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
function getJSONFile(path) {
  try {
    const data = fs.readFileSync(path, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading the file:", err);
  }
}
function detectLangsFromJSON(repoJSON) {
  const allFiles = getJSONFile(repoJSON);
  const languageStats = {};
  const frameworks = new Set();

  for (const file of allFiles.files) {
    const base = String(file.path).split("/").pop().toLowerCase();
    const ext = String(file.extension).toLowerCase();
    if (ignoredFiles.has(base)) {
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

    for (const fw of frameworkIndicators) {
      if (fw.files.includes(ext)) frameworks.add(fw.name);
      if (fw.config.some((c) => file.path.endsWith(c))) frameworks.add(fw.name);
    }
  }
  const totalBytes = Object.values(languageStats).reduce(
    (acc, v) => acc + v.bytes,
    0
  );

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
      totalFiles: allFiles.files.length,
    },
  };
}

module.exports = detectLangsFromJSON;

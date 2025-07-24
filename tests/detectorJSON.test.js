// tests/detectorJSON.test.js
const fs = require("fs");
const path = require("path");
const detectLangsFromJSON = require("../src/detectors/detectorJSON");
const ignoredFiles = require("../src/utils/ignored");
const shouldExclude = require("../src/utils/shouldExclude");

jest.mock("fs");
jest.mock("../src/utils/shouldExclude");
jest.mock("../src/utils/ignored", () => new Set(["ignored.txt", "skip.js"]));

// Mock language mappings
jest.mock("../src/utils/langMap", () => ({
  main: {
    ".js": "JavaScript",
    ".py": "Python",
    ".ts": "TypeScript",
  },
  other: {
    ".txt": "Text",
    ".md": "Markdown",
  },
}));

describe("detectLangsFromJSON", () => {
  beforeEach(() => {
    fs.readFileSync.mockReset();
    shouldExclude.mockReset();
  });

  it("parses valid JSON and detects languages and frameworks", () => {
    const testData = {
      files: [
        // Should be ignored via ignoredFiles
        { path: "ignored.txt", extension: ".txt", size: 100 },
        // Should be ignored due to "config" in name
        { path: "someconfigfile.js", extension: ".js", size: 200 },
        // Should be ignored due to path containing "node_modules"
        { path: "node_modules/lib/index.js", extension: ".js", size: 400 },
        // Should be ignored due to path starting with .
        { path: ".hidden/file.js", extension: ".js", size: 500 },
        // Should be ignored due to dist
        { path: "dist/output.js", extension: ".js", size: 600 },
        // Should be ignored due to /test/
        { path: "src/test/test.js", extension: ".js", size: 700 },
        // Should be counted as Dockerfile
        { path: "Dockerfile", extension: "", size: 1000 },
        // Regular JS file
        { path: "src/app.js", extension: ".js", size: 2000 },
        // Python file
        { path: "script/main.py", extension: ".py", size: 3000 },
        // TS file
        { path: "index.ts", extension: ".ts", size: 1500 },
        // Markdown (other)
        { path: "README.md", extension: ".md", size: 800 },
        // Framework extension: Vue
        { path: "Component.vue", extension: ".vue", size: 50 },
      ],
    };

    fs.readFileSync.mockReturnValue(JSON.stringify(testData));
    shouldExclude.mockReturnValueOnce(false);

    const result = detectLangsFromJSON([], "mockPath.json");

    expect(result.frameworks).toEqual(
      expect.arrayContaining(["Vue"])
    );
    expect(result.languages).toEqual({
      JavaScript: expect.objectContaining({ files: 1, bytes: 2000 }),
      Python: expect.objectContaining({ files: 1, bytes: 3000 }),
      TypeScript: expect.objectContaining({ files: 1, bytes: 1500 }),
      Dockerfile: expect.objectContaining({ files: 1, bytes: 1000 }),
    });
    expect(result.other).toEqual({
      Markdown: expect.objectContaining({ files: 1, bytes: 800 }),
    });

    expect(result.totals.totalFiles).toBe(12);
    expect(result.totals.languageBytes).toBe(2000 + 3000 + 1500 + 1000);
    expect(result.totals.otherBytes).toBe(800);
    expect(result.totals.totalBytes).toBe(8300);
  });

  it("handles invalid JSON file", () => {
    fs.readFileSync.mockImplementation(() => "{ not_valid_json");
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const result = detectLangsFromJSON([], "bad.json");
    expect(consoleSpy).toHaveBeenCalled();
    expect(result).toStrictEqual({ error: true, msg: "Invalid Path or JSON" });
    consoleSpy.mockRestore();
  });

  it("handles edge case: only ignored/test/dist files", () => {
    const testData = {
      files: [
        { path: "ignored.txt", extension: ".txt", size: 100 },
        { path: "dist/main.js", extension: ".js", size: 500 },
        { path: ".hidden/secret.js", extension: ".js", size: 300 },
        { path: "tests/test_file.js", extension: ".js", size: 100 },
        { path: "node_modules/pkg/index.js", extension: ".js", size: 400 },
      ],
    };
    fs.readFileSync.mockReturnValue(JSON.stringify(testData));
    const result = detectLangsFromJSON([], "mock.json");
    expect(result.languages).toEqual({});
    expect(result.other).toEqual({});
    expect(result.frameworks).toEqual([]);
    expect(result.totals.totalFiles).toBe(5);
    expect(result.totals.languageBytes).toBe(0);
    expect(result.totals.otherBytes).toBe(0);
    expect(result.totals.totalBytes).toBe(0);
  });
});

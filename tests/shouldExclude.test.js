const shouldExclude = require("../src/utils/shouldExclude");

describe("shouldExclude", () => {
  it("returns true for exact match", () => {
    expect(shouldExclude(["file.js"], "file.js")).toBe(true);
  });

  it("returns true for wildcard match", () => {
    expect(shouldExclude(["*.js"], "test.js")).toBe(true);
    expect(shouldExclude(["*.js"], "test.ts")).toBe(false);
  });

  it("returns true for nested glob match", () => {
    expect(shouldExclude(["src/**/*.js"], "src/utils/file.js")).toBe(true);
    expect(shouldExclude(["src/**/*.js"], "src/file.txt")).toBe(false);
  });

  it("returns false if pattern doesn't match", () => {
    expect(shouldExclude(["*.ts"], "index.js")).toBe(false);
  });

  it("returns false for empty exclude list", () => {
    expect(shouldExclude([], "main.js")).toBe(false);
  });

  it("returns true when multiple patterns match one", () => {
    expect(shouldExclude(["*.json", "*.md"], "readme.md")).toBe(true);
  });

  it("returns false if none of the patterns match", () => {
    expect(shouldExclude(["*.json", "*.ts"], "readme.md")).toBe(false);
  });

  it("handles negated patterns (though minimatch does not support by default)", () => {
    // minimatch does not negate unless configured
    expect(shouldExclude(["!readme.md"], "readme.md")).toBe(false);
  });

  it("returns true for pattern with directory prefix", () => {
    expect(shouldExclude(["docs/*.md"], "docs/steps.md")).toBe(true);
  });

  it("returns false for unmatched directory", () => {
    expect(shouldExclude(["docs/*.md"], "src/steps.md")).toBe(false);
  });

  it("returns false if 'excluded' is undefined or null (guard condition)", () => {
    expect(shouldExclude(undefined, "index.js")).toBe(false);
    expect(shouldExclude(null, "index.js")).toBe(false);
  });
});

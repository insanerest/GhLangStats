const extractFromURL = require("../src/utils/extractFromURL");
const path = require("path");

describe("extractFromURL", () => {
  test("Correctly Extracts 1", () => {
    const result = extractFromURL("https://github.com/insanerest/helloworld");
    expect(result.repoOwner).toBe("insanerest");
    expect(result.repoName).toBe("helloworld");
    expect(result.resultPath).toBe(
      path.resolve("src", "cache", result.repoOwner, `${result.repoName}.json`)
    );
  });

  test("Correctly Extracts 2", () => {
    const result = extractFromURL("https://github.com/abc/xyz");
    expect(result.repoOwner).toBe("abc");
    expect(result.repoName).toBe("xyz");
    expect(result.resultPath).toBe(
      path.resolve("src", "cache", result.repoOwner, `${result.repoName}.json`)
    );
  });
});

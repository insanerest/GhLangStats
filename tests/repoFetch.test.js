const fs = require("fs");
const path = require("path");
const https = require("https");
const fetchRepoData = require("../src/fetchers/repoFetch"); // adjust path

jest.mock("fs");
jest.mock("https");

const MOCK_OWNER = "octocat";
const MOCK_REPO = "Hello-World";
const CACHE_PATH = path.join(
  __dirname,
  "..",
  "src",
  "cache",
  MOCK_OWNER,
  `${MOCK_REPO}.json`
);

describe("fetchRepoData", () => {
  let reqHandler = null;

  beforeEach(() => {
    fs.existsSync.mockReset();
    fs.readFileSync.mockReset();
    fs.writeFileSync.mockReset();
    fs.mkdirSync.mockReset();
    https.get.mockReset();

    // clean cache dir if needed
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
  });

  const mockGitHubAPI = (responses) => {
    https.get.mockImplementation((url, opts, callback) => {
      reqHandler = callback;

      const res = {
        statusCode: 200,
        on: (event, cb) => {
          if (event === "data") cb(JSON.stringify(responses[url]));
          if (event === "end") cb();
        },
      };

      process.nextTick(() => callback(res));

      return { on: jest.fn() }; // mock error handler
    });
  };

  it("should fetch and write data when no cache exists", async () => {
    const pushed_at = "2021-01-01T00:00:00Z";

    const responses = {
      [`https://api.github.com/repos/${MOCK_OWNER}/${MOCK_REPO}`]: {
        pushed_at,
        default_branch: "main",
      },
      [`https://api.github.com/repos/${MOCK_OWNER}/${MOCK_REPO}/git/trees/main?recursive=1`]:
        {
          tree: [
            {
              path: "index.js",
              size: 123,
              type: "blob",
            },
            {
              path: "package.json",
              size: 456,
              type: "blob",
              url: "https://api.github.com/blobs/1234",
            },
          ],
        },
      "https://api.github.com/blobs/1234": {
        content: Buffer.from(JSON.stringify({ name: "test-package" })).toString(
          "base64"
        ),
      },
    };

    mockGitHubAPI(responses);

    fs.existsSync.mockImplementation((p) => false);

    const result = await fetchRepoData(MOCK_OWNER, MOCK_REPO);

    expect(result.repo).toBe(MOCK_REPO);
    expect(result.files.length).toBe(2);
    expect(result.package_json).toEqual({ name: "test-package" });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      CACHE_PATH,
      expect.stringContaining(`"repo": "${MOCK_REPO}"`)
    );
  });

  it("should return cached data if pushed_at matches", async () => {
    const pushed_at = "2021-01-01T00:00:00Z";
    const cachedData = {
      repo: MOCK_REPO,
      pushed_at,
      scanned_at: new Date().toISOString(),
      files: [],
    };

    fs.existsSync.mockImplementation((p) => true);
    fs.readFileSync.mockReturnValue(JSON.stringify(cachedData));

    mockGitHubAPI({
      [`https://api.github.com/repos/${MOCK_OWNER}/${MOCK_REPO}`]: {
        pushed_at,
        default_branch: "main",
      },
    });

    const result = await fetchRepoData(MOCK_OWNER, MOCK_REPO);

    expect(result).toEqual(cachedData);
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("should handle 404 errors properly", async () => {
    https.get.mockImplementation((url, opts, callback) => {
      const res = {
        statusCode: 404,
        statusMessage: "Not Found",
        on: (event, cb) => {
          if (event === "data") cb("");
          if (event === "end") cb();
        },
      };
      callback(res);
      return { on: jest.fn() };
    });

    await expect(fetchRepoData("nonexistent", "badrepo")).rejects.toThrow(
      "Repo cannot be found"
    );
  });

  it("should handle invalid JSON from package.json blob", async () => {
    const pushed_at = "2021-01-01T00:00:00Z";

    const responses = {
      [`https://api.github.com/repos/${MOCK_OWNER}/${MOCK_REPO}`]: {
        pushed_at,
        default_branch: "main",
      },
      [`https://api.github.com/repos/${MOCK_OWNER}/${MOCK_REPO}/git/trees/main?recursive=1`]:
        {
          tree: [
            {
              path: "package.json",
              size: 456,
              type: "blob",
              url: "https://api.github.com/blobs/1234",
            },
          ],
        },
      "https://api.github.com/blobs/1234": {
        content: Buffer.from("not-json!!").toString("base64"),
      },
    };

    mockGitHubAPI(responses);

    fs.existsSync.mockReturnValue(false);

    const result = await fetchRepoData(MOCK_OWNER, MOCK_REPO);

    expect(result.package_json).toEqual({ invalid: true });
  });
});

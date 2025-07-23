const fetchRepoData = require("../src/fetchers/repoFetch");
const https = require("https");
const { Readable } = require("stream");

// --- Mock helper to create readable streams from strings
function createResponseStream(json, statusCode = 200) {
  const stream = new Readable();
  stream.push(JSON.stringify(json));
  stream.push(null);
  return {
    statusCode,
    on: (event, cb) => {
      if (event === "data") {
        stream.on("data", cb);
      } else if (event === "end") {
        stream.on("end", cb);
      }
    },
  };
}

jest.mock("https", () => ({
  get: jest.fn(),
}));

describe("fetchRepoData", () => {
  const owner = "testuser";
  const repo = "testrepo";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches repo data and returns summary", async () => {
    // 1. Mock repo metadata
    const repoMeta = {
      pushed_at: "2023-01-01T00:00:00Z",
      default_branch: "main",
    };

    // 2. Mock git tree
    const treeResp = {
      tree: [
        {
          path: "index.js",
          type: "blob",
          size: 100,
          url: "https://api.github.com/repos/blob1",
        },
        {
          path: "package.json",
          type: "blob",
          size: 80,
          url: "https://api.github.com/repos/blob2",
        },
      ],
    };

    // 3. Mock blob content (base64-encoded)
    const blobResp = {
      content: Buffer.from(
        JSON.stringify({ name: "test-package", version: "1.0.0" }),
        "utf-8"
      ).toString("base64"),
    };

    // --- Queue the mocked responses ---
    const responses = [
      createResponseStream(repoMeta), // fetch repo metadata
      createResponseStream(treeResp), // fetch tree
      createResponseStream(blobResp), // fetch blob
    ];

    https.get.mockImplementation((url, options, callback) => {
      const res = responses.shift();
      callback(res);
      return { on: () => {} }; // to support `.on("error")`
    });

    const result = await fetchRepoData(owner, repo);

    // Assert structure
    expect(result).toHaveProperty("owner", owner);
    expect(result).toHaveProperty("repo", repo);
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.package_json).toEqual({
      name: "test-package",
      version: "1.0.0",
    });
  });

  test("returns error on invalid repo", async () => {
    const errorResponse = createResponseStream({ message: "Not Found" }, 404);
    https.get.mockImplementation((url, options, callback) => {
      callback(errorResponse);
      return { on: () => {} };
    });

    await expect(fetchRepoData("badowner", "badrepo")).rejects.toThrow(
      "Repo cannot be found"
    );
  });
});

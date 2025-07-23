const fs = require("fs");
const path = require("path");
const fetchRepoData = require("../src/fetchers/repoFetch");

jest.mock("fs");
jest.mock("https");
jest.mock("path");

const https = require("https");

describe("fetchRepoData", () => {
  const owner = "octocat";
  const repo = "Hello-World";

  const fakeMeta = {
    default_branch: "main",
    pushed_at: "2023-01-01T00:00:00Z",
  };

  const fakeTree = {
    tree: [
      { type: "blob", path: "index.js", size: 123 },
      { type: "blob", path: "package.json", size: 456, url: "blob_url" },
    ],
  };

  const fakeBlob = {
    content: Buffer.from(
      JSON.stringify({ name: "test-package" }),
      "utf-8"
    ).toString("base64"),
  };

  function mockHttpsResponse(data, statusCode = 200) {
    return {
      on: (event, callback) => {
        if (event === "data") callback(JSON.stringify(data));
        if (event === "end") callback();
      },
      statusCode,
      statusMessage: "OK",
    };
  }

  function mockHttpsErrorResponse(statusCode, message = "Error") {
    return {
      on: (event, callback) => {
        if (event === "data") callback("error");
        if (event === "end") callback();
      },
      statusCode,
      statusMessage: message,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();

    // path.join mock
    path.join.mockImplementation((...args) => args.join("/"));

    // Cache read/write mocks
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue("");
    fs.writeFileSync.mockImplementation(() => {});
    fs.mkdirSync.mockImplementation(() => {});
  });

  it("fetches new data and writes to cache", async () => {
    let call = 0;

    https.get.mockImplementation((_url, _opts, cb) => {
      let response;
      if (call === 0) response = mockHttpsResponse(fakeMeta); // repo meta
      else if (call === 1) response = mockHttpsResponse(fakeTree); // tree
      else if (call === 2) response = mockHttpsResponse(fakeBlob); // blob

      call++;
      setImmediate(() => cb(response));
      return { on: () => {} };
    });

    const data = await fetchRepoData(owner, repo);
    expect(data.repo).toBe(repo);
    expect(data.owner).toBe(owner);
    expect(data.files.length).toBe(2);
    expect(data.package_json.name).toBe("test-package");
  });

  it("uses cache if pushed_at matches", async () => {
    const cache = {
      owner,
      repo,
      pushed_at: fakeMeta.pushed_at,
      scanned_at: new Date().toISOString(),
      files: [],
    };

    let call = 0;
    https.get.mockImplementation((_url, _opts, cb) => {
      call++;
      setImmediate(() => cb(mockHttpsResponse(fakeMeta)));
      return { on: () => {} };
    });

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(cache));

    const data = await fetchRepoData(owner, repo);
    expect(data).toEqual(cache);
    expect(call).toBe(1); // Only called repo meta
  });

  it("handles 404 error on repo", async () => {
    https.get.mockImplementation((_url, _opts, cb) => {
      setImmediate(() => cb(mockHttpsErrorResponse(404, "Not Found")));
      return { on: () => {} };
    });

    await expect(fetchRepoData(owner, repo)).rejects.toThrow(
      "Repo cannot be found"
    );
  });

  it("handles invalid JSON in cache", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation(() => "INVALID_JSON");

    https.get.mockImplementation((_url, _opts, cb) => {
      setImmediate(() => cb(mockHttpsResponse(fakeMeta)));
      return { on: () => {} };
    });

    await fetchRepoData(owner, repo); // should ignore broken cache
    expect(fs.readFileSync).toHaveBeenCalled();
  });

  it("handles package.json parse failure gracefully", async () => {
    let call = 0;

    const fakeBlobBroken = {
      content: Buffer.from("not json", "utf-8").toString("base64"),
    };

    https.get.mockImplementation((_url, _opts, cb) => {
      if (call === 0) cb(mockHttpsResponse(fakeMeta));
      else if (call === 1) cb(mockHttpsResponse(fakeTree));
      else cb(mockHttpsResponse(fakeBlobBroken));
      call++;
      return { on: () => {} };
    });

    const data = await fetchRepoData(owner, repo);
    expect(data.package_json.invalid).toBe(true);
  });

  it("handles non-404 API errors", async () => {
    https.get.mockImplementation((_url, _opts, cb) => {
      setImmediate(() => cb(mockHttpsErrorResponse(500, "Internal Error")));
      return { on: () => {} };
    });

    await expect(fetchRepoData(owner, repo)).resolves.toStrictEqual({
      error: true,
      msg: "Internal Error",
    });
  });
});

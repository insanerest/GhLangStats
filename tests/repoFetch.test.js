const fs = require("fs");
const path = require("path");
process.env.GITHUB_TOKEN = "test-token";
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

  function mockHttpsInvalidJSONResponse() {
    return {
      on: (event, callback) => {
        if (event === "data") callback("not-json");
        if (event === "end") callback();
      },
      statusCode: 200,
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
    delete process.env.GITHUB_TOKEN;

    path.join.mockImplementation((...args) => args.join("/"));
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue("");
    fs.writeFileSync.mockImplementation(() => {});
    fs.mkdirSync.mockImplementation(() => {});
  });

  it("fetches new data and writes to cache", async () => {
    let call = 0;

    https.get.mockImplementation((_url, _opts, cb) => {
      let response;
      if (call === 0) response = mockHttpsResponse(fakeMeta);
      else if (call === 1) response = mockHttpsResponse(fakeTree);
      else if (call === 2) response = mockHttpsResponse(fakeBlob);
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
    expect(call).toBe(1);
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

    await fetchRepoData(owner, repo);
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

  it("sets Authorization header if GITHUB_TOKEN is set", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    const spy = jest.spyOn(https, "get");

    https.get.mockImplementation((_url, opts, cb) => {
      setImmediate(() => cb(mockHttpsResponse(fakeMeta)));
      return { on: () => {} };
    });

    await fetchRepoData(owner, repo);
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
      expect.any(Function)
    );
  });

  it("rejects when ghGet receives invalid JSON", async () => {
    https.get.mockImplementation((_url, _opts, cb) => {
      setImmediate(() => cb(mockHttpsInvalidJSONResponse()));
      return { on: () => {} };
    });

    await expect(fetchRepoData(owner, repo)).rejects.toThrow(SyntaxError);
  });

  it("returns early if treeResp contains error", async () => {
    let call = 0;
    https.get.mockImplementation((_url, _opts, cb) => {
      if (call === 0) cb(mockHttpsResponse(fakeMeta));
      else cb(mockHttpsResponse({ error: true, msg: "Tree error" }));
      call++;
      return { on: () => {} };
    });

    const result = await fetchRepoData(owner, repo);
    expect(result).toEqual({ error: true, msg: "Tree error" });
  });

  it("rejects with GitHub API error if status >= 400 and data is empty", async () => {
    https.get.mockImplementation((_url, _opts, cb) => {
      cb({
        on: (event, callback) => {
          if (event === "data") callback("");
          if (event === "end") callback();
        },
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
      return { on: () => {} };
    });

    await expect(fetchRepoData(owner, repo)).rejects.toThrow(
      "GitHub API Error: 500 Internal Server Error"
    );
  });
});

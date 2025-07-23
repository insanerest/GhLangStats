const getUserRepos = require("../src/fetchers/getUserRepos");
global.fetch = require("jest-fetch-mock");
jest.mock("../src/fetchers/getTokenOwner.js"); // adjust path
const getTokenOwner = require("../src/fetchers/getTokenOwner");

describe("getUserRepos", () => {
  beforeEach(() => {
    fetch.resetMocks();
    jest.clearAllMocks();
  });

  test("fetches repos for authenticated user using /user/repos", async () => {
    const token = "fake-token";
    const username = "insanerest";
    getTokenOwner.mockResolvedValue(username);

    const page1 = [
      { html_url: "https://github.com/insanerest/repo1" },
      { html_url: "https://github.com/insanerest/repo2" },
    ];
    const page2 = [];

    fetch
      .mockResponseOnce(JSON.stringify(page1), { status: 200 })
      .mockResponseOnce(JSON.stringify(page2), { status: 200 });

    const urls = await getUserRepos(username, token);

    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/user/repos?per_page=100&page=1",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        }),
      })
    );

    expect(urls).toEqual([
      "https://github.com/insanerest/repo1",
      "https://github.com/insanerest/repo2",
    ]);
  });

  test("fetches repos for public user using /users/:username/repos", async () => {
    const username = "someoneelse";
    const token = "any-token";
    getTokenOwner.mockResolvedValue("notmatch");

    const page1 = [
      { html_url: "https://github.com/someoneelse/repo1" },
      { html_url: "https://github.com/someoneelse/repo2" },
    ];
    const page2 = [];

    fetch
      .mockResponseOnce(JSON.stringify(page1), { status: 200 })
      .mockResponseOnce(JSON.stringify(page2), { status: 200 });

    const urls = await getUserRepos(username, token);

    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/users/someoneelse/repos?per_page=100&page=1",
      expect.any(Object)
    );

    expect(urls).toEqual([
      "https://github.com/someoneelse/repo1",
      "https://github.com/someoneelse/repo2",
    ]);
  });

  test("throws on GitHub error response", async () => {
    getTokenOwner.mockResolvedValue("insanerest");
    fetch.mockResponseOnce("Forbidden", {
      status: 403,
      statusText: "Forbidden",
    });

    await expect(getUserRepos("insanerest", "bad-token")).rejects.toThrow(
      "GitHub API error: 403 Forbidden"
    );
  });

  test("handles pagination correctly", async () => {
    getTokenOwner.mockResolvedValue("insanerest");

    const page1 = new Array(100).fill(0).map((_, i) => ({
      html_url: `https://github.com/insanerest/repo${i + 1}`,
    }));
    const page2 = [
      { html_url: "https://github.com/insanerest/repo101" },
      { html_url: "https://github.com/insanerest/repo102" },
    ];

    fetch
      .mockResponseOnce(JSON.stringify(page1), { status: 200 })
      .mockResponseOnce(JSON.stringify(page2), { status: 200 });

    const urls = await getUserRepos("insanerest", "token");

    expect(urls).toHaveLength(102);
    expect(urls[0]).toBe("https://github.com/insanerest/repo1");
    expect(urls[101]).toBe("https://github.com/insanerest/repo102");
  });
});

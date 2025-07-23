const getTokenOwner = require("../src/fetchers/getTokenOwner");
global.fetch = require("jest-fetch-mock");

describe("getTokenOwner", () => {
  const validToken = "valid-token-123";
  const invalidToken = "invalid-token-456";
  const mockLogin = "insanerest";

  beforeEach(() => {
    fetch.resetMocks();
  });

  it("should return the username when given a valid token", async () => {
    fetch.mockResponseOnce(JSON.stringify({ login: mockLogin }), {
      status: 200,
    });

    const result = await getTokenOwner(validToken);

    expect(result).toBe(mockLogin);

    expect(fetch).toHaveBeenCalledWith("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${validToken}`,
        Accept: "application/vnd.github+json",
      },
    });
  });

  it("should return undefined when given an invalid token", async () => {
    fetch.mockResponseOnce("", { status: 401 });

    const result = await getTokenOwner(invalidToken);

    expect(result).toBeUndefined();
  });

  it("should return undefined if GitHub API is down", async () => {
    fetch.mockRejectOnce(new Error("Network error"));

    await expect(getTokenOwner(validToken)).rejects.toThrow("Network error");
  });

  it("should not call JSON parsing if response is not ok", async () => {
    fetch.mockResponseOnce("", { status: 403 });

    const result = await getTokenOwner(validToken);

    expect(result).toBeUndefined();
  });
});

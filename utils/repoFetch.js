const fs = require("fs");
const path = require("path");
const https = require("https");

const CACHE_DIR = path.join(__dirname, "..", "cache");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

const GITHUB_API = "https://api.github.com";
const HEADERS = {
  "User-Agent": "repoFetcher/1.0",
  Accept: "application/vnd.github.v3+json",
};

// --- Core helper: GET with Promise ---
function ghGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: HEADERS }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(
              new Error(
                `GitHub API Error: ${res.statusCode} ${res.statusMessage}`
              )
            );
          } else {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(err);
            }
          }
        });
      })
      .on("error", reject);
  });
}

// --- Cache read/write ---
function getCachePath(owner, repo) {
  return path.join(CACHE_DIR, `${owner}_${repo}.json`);
}

function readCache(owner, repo) {
  const p = getCachePath(owner, repo);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function writeCache(owner, repo, data) {
  const p = getCachePath(owner, repo);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

// --- Main repo fetcher ---
async function fetchRepoData(owner, repo) {
  const repoMeta = await ghGet(`${GITHUB_API}/repos/${owner}/${repo}`);
  const pushedAt = repoMeta.pushed_at;

  const cache = readCache(owner, repo);
  if (cache && cache.pushed_at === pushedAt) {
    console.log(`[CACHE] Using cached data for ${owner}/${repo}`);
    return cache;
  }

  console.log(`[FETCH] Updating data for ${owner}/${repo}`);

  const defaultBranch = repoMeta.default_branch;
  const treeResp = await ghGet(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`
  );

  const files = treeResp.tree.filter((item) => item.type === "blob");
  const summary = {
    owner,
    repo,
    pushed_at: pushedAt,
    scanned_at: new Date().toISOString(),
    files: [],
    package_json: null,
  };

  for (const file of files) {
    const ext = path.extname(file.path);
    summary.files.push({
      path: file.path,
      size: file.size,
      extension: ext,
    });

    // Optional: fetch blob content for package.json
    if (file.path === "package.json") {
      const blob = await ghGet(file.url);
      const content = Buffer.from(blob.content, "base64").toString("utf-8");
      try {
        summary.package_json = JSON.parse(content);
      } catch {
        summary.package_json = { invalid: true };
      }
    }
  }

  writeCache(owner, repo, summary);
  return summary;
}

module.exports = fetchRepoData ;

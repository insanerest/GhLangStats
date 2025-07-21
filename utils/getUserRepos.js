async function getUserRepos(username, token = null) {
  const perPage = 100;
  let page = 1;
  let allRepos = [];
  const headers = {
    Accept: "application/vnd.github+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  while (true) {
    const url = token
      ? `https://api.github.com/user/repos?per_page=${perPage}&page=${page}`
      : `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}`;
    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const repos = await res.json();

    allRepos.push(...repos);

    if (repos.length < perPage) {
      break; // no more pages
    }

    page++;
  }

  return allRepos.map((repo) => repo.html_url);
}

module.exports = getUserRepos;

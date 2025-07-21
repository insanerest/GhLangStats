const getUserRepos = require("./getUserRepos");
const combineStats = require("./combineStats");
const getRepoStats = require("./getRepoStats");
async function getUserStats(username, excluded) {
  excluded = excluded || [];
  const token = process.env.GITHUB_TOKEN;
  try {
    const userRepos = await getUserRepos(username, token);
    // Collect all promises from getRepoStats
    const stats = await Promise.all(
      userRepos.map(async (repo_url) => {
        const stat = await getRepoStats(repo_url, excluded);
        return !stat.error ? stat : null;
      })
    );
    const filteredStats = stats.filter((stat) => stat !== null);
    const userStats = combineStats(filteredStats);
    return userStats;
  } catch (e) {
    console.log(e);
    throw new Error("Could Not Get User Stats");
  }
}

module.exports = getUserStats;

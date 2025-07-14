const repoFetchData = require("./repoFetch");
const extract = require("./extractFromURL");
const detectLangsFromJSON = require("./detectorJSON");

async function getRepoStats(excluded, repoUrl) {
  const { repoOwner, repoName, resultPath } = extract(repoUrl);
  const repo = await repoFetchData(repoOwner, repoName);
  if(repo.error){
    return repo
  }
  const result = detectLangsFromJSON(excluded, resultPath);
  return result
}


module.exports = getRepoStats
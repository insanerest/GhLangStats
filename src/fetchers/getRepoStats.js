const repoFetchData = require("./repoFetch");
const extract = require("../utils/extractFromURL");
const detectLangsFromJSON = require("../detectors/detectorJSON");

async function getRepoStats(repoUrl, excluded) {
  excluded = excluded || [];
  const { repoOwner, repoName, resultPath } = extract(repoUrl);
  const repo = await repoFetchData(repoOwner, repoName);
  if(repo.error){
    return repo
  }
  const result = detectLangsFromJSON(excluded, resultPath);
  return result
}


module.exports = getRepoStats
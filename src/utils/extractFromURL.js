const path = require("path")
function extract(url){
    const split = String(url).split("/")
    const splitL = split.length
    const repoName = split[splitL-1]

    const repoOwner = split[splitL - 2];
    const resultPath = path.resolve("src", "cache", repoOwner, `${repoName}.json`)
    return {repoOwner,repoName,resultPath}
}

module.exports = extract
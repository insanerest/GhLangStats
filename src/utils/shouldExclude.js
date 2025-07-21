const { minimatch } = require("minimatch");
function shouldExclude(excluded, filePath) {
  for (pattern of excluded) {
    if(minimatch(filePath,pattern)){
        return true
    }
  }
}

module.exports = shouldExclude;
//deprecation - steps.md;

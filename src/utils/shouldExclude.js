const { minimatch } = require("minimatch");
function shouldExclude(excluded, filePath) {
  if (!excluded) return false;
  for (const pattern of excluded) {
    if (minimatch(filePath, pattern)) return true;
  }
  return false;
}
module.exports = shouldExclude;
//deprecation - steps.md;

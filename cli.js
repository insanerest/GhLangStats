#!/usr/bin/env node
const { Command } = require("commander");
const chalk = require("chalk");
const extract = require("./utils/extractFromURL");
const fetchRepoData = require("./utils/repoFetch");
const detectLangsFromJSON = require("./utils/detectorJSON");

const renderConsole = require("./formatters/console");
const renderMarkdown = require("./formatters/markdown");

const program = new Command();

function isValidGitHubRepoURL(url) {
  const pattern = /^https?:\/\/(www\.)?github\.com\/([\w.-]+)\/([\w.-]+)(\/)?$/;
  return pattern.test(url);
}

(async function () {
  program
    .name("ghlangstats")
    .description("CLI to get Language usage details in any github repo")
    .option("-u, --url <url>", "Github Repo URL")
    .option(
      "-o, --output <type>",
      "Output type: json, console, markdown",
      "console"
    )
    .parse();
  const opts = program.opts();
  if (!opts.url) {
    console.error(
      chalk.red("❌ Error: --url is required. Type --help for more details")
    );
    process.exit(1);
  } else {
    const input = String(opts.url);
    const output = String(opts.output);
    if (!isValidGitHubRepoURL(opts.url)) {
      console.error(
        chalk.red(
          "❌ Error: Invalid URL. A valid URL must be like: https://github.com/github/docs"
        )
      );
      process.exit(1);
    }
    const { repoOwner, repoName, resultPath } = extract(input);
    await fetchRepoData(repoOwner, repoName);
    const jsonLangs = detectLangsFromJSON(resultPath);
    switch (output) {
      case "console":
        renderConsole(jsonLangs);
        break
      case "markdown":
        const markdown = renderMarkdown(jsonLangs);
        console.log(markdown);
        break
      case "json":
        console.log(jsonLangs);
        break
      default:
        renderConsole(jsonLangs);
        break
    }
  }
})();

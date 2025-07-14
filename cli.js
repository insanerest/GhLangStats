#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const extract = require("./utils/extractFromURL");
const fetchRepoData = require("./utils/repoFetch");
const detectLangsFromJSON = require("./utils/detectorJSON");
const detectLangs = require("./utils/detector");
const getUserStats = require("./utils/getUserStats");
const renderConsole = require("./formatters/console");
const renderMarkdown = require("./formatters/markdown");

const program = new Command();

function isValidGitHubRepoURL(url) {
  const pattern = /^https?:\/\/(www\.)?github\.com\/([\w.-]+)\/([\w.-]+)(\/)?$/;
  return pattern.test(url);
}

function switchRender(outputType, data) {
  switch (outputType) {
    case "console":
      renderConsole(data);
      break;
    case "markdown":
      console.log(renderMarkdown(data));
      break;
    case "json":
      console.log(JSON.stringify(data, null, 2));
      break;
    default:
      console.log(renderConsole(data));
  }
}

program
  .name("ghlangstats")
  .description("CLI to get language usage details in any GitHub repo")
  .version("1.0.0")
  .option("-u, --url <url>", "GitHub repository URL")
  .option("-d, --directory <path>", "Path to local project directory")
  .option("-p, --profile <username>", "GitHub username to analyze")
  .option(
    "-o, --output <type>",
    "Output format: console, markdown, json",
    "console"
  )
  .option(
    "--exclude <patterns>",
    "Comma-separated list of glob patterns to exclude (e.g. *.md,*.json)",
    ""
  )
  .addHelpText(
    "after",
    `
Examples:
  $ ghlangstats --url https://github.com/github/docs
  $ ghlangstats --directory ./my-project
  $ ghlangstats --profile insanerest
  $ ghlangstats -u https://github.com/octocat/Hello-World -o json
`
  );

(async () => {
  program.parse();
  const opts = program.opts();
  const excluded = opts.exclude
    ? opts.exclude.split(",").map((p) => p.trim())
    : [];

  const allowedOutputs = ["console", "markdown", "json"];
  const outputType = String(opts.output || "console").toLowerCase();

  if (!allowedOutputs.includes(outputType)) {
    console.error(
      chalk.red(
        `❌ Error: Invalid output type "${outputType}". Must be one of: ${allowedOutputs.join(
          ", "
        )}`
      )
    );
    process.exit(1);
  }

  // Must provide at least one of url, directory, or profile
  if (!opts.url && !opts.directory && !opts.profile) {
    console.error(
      chalk.red(
        "❌ Error: You must provide --url, --directory, or --profile. Use --help for usage examples."
      )
    );
    process.exit(1);
  }

  // Handle GitHub Repo URL
  if (opts.url) {
    const input = String(opts.url);
    if (!isValidGitHubRepoURL(input)) {
      console.error(
        chalk.red(
          "❌ Error: Invalid GitHub URL. Expected format: https://github.com/owner/repo"
        )
      );
      process.exit(1);
    }

    const { repoOwner, repoName, resultPath } = extract(input);
    try {
      await fetchRepoData(repoOwner, repoName);
    } catch (e) {
      console.error(chalk.red("❌ Error: Could not fetch repo. Is it public?"));
      console.error(e.message || e);
      process.exit(1);
    }

    try {
      const langs = detectLangsFromJSON(excluded, resultPath);
      switchRender(outputType, langs);
    } catch (e) {
      console.error(
        chalk.red(
          "❌ Error: Failed to analyze language data from the fetched repo."
        )
      );
      console.error(e.message || e);
      process.exit(1);
    }
  }

  // Handle Local Directory
  else if (opts.directory) {
    try {
      const langs = detectLangs(String(opts.directory));
      switchRender(outputType, langs);
    } catch (e) {
      console.error(
        chalk.red(
          "❌ Error: Could not analyze local directory. Does the path exist?"
        )
      );
      console.error(e.message || e);
      process.exit(1);
    }
  }

  // Handle GitHub Profile
  else if (opts.profile) {
    try {
      const stats = await getUserStats(excluded, String(opts.profile));
      if (stats.error) {
        console.error(
          chalk.red("❌ Error: GitHub API rate-limited or user not found.")
        );
        process.exit(1);
      }
      switchRender(outputType, stats);
    } catch (e) {
      console.error(chalk.red("❌ Error: Could not fetch profile data."));
      console.error(e.message || e);
      process.exit(1);
    }
  }
})();

// node cli.js -u https://github.com/github/docs --exclude="*.md"
// node cli.js -u https://github.com/github/docs
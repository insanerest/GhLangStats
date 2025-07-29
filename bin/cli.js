#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const extract = require("../src/utils/extractFromURL");
const fetchRepoData = require("../src/fetchers/repoFetch");
const detectLangsFromJSON = require("../src/detectors/detectorJSON");
const detectLangs = require("../src/detectors/detector");
const getUserStats = require("../src/fetchers/getUserStats");
const renderConsole = require("../src/formatters/console");
const renderMarkdown = require("../src/formatters/markdown");
const pkgPath = path.join(__dirname, "../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

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
  .version(pkg.version)
  .option("-r, --repo <url>", "GitHub repository URL")
  .option("-d, --directory <path>", "Path to local project directory")
  .option("-u, --user <username>", "GitHub username to analyze")
  .option(
    "-f, --format <type>",
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
  $ ghlangstats --repo https://github.com/github/docs
  $ ghlangstats --directory ./my-project
  $ ghlangstats --user insanerest
  $ ghlangstats -r https://github.com/octocat/Hello-World -f json
`
  )
  .showHelpAfterError("(add --help for more information)");

(async () => {
  program.parse();
  const noArgs =
    process.argv.length <= 2 || // only `node cli.js`
    (program.args.length === 0 && // no subcommands
      Object.keys(program.opts()).length === 0); // no options/flags
  if (noArgs) {
    program.outputHelp();
    process.exit(0);
  }

  const opts = program.opts();
  const excluded = opts.exclude
    ? opts.exclude.split(",").map((p) => p.trim())
    : [];

  const allowedOutputs = ["console", "markdown", "json"];
  const outputType = String(opts.format || "console").toLowerCase();

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
  if (!opts.repo && !opts.directory && !opts.user) {
    console.error(
      chalk.red(
        "❌ Error: You must provide --repo, --directory, or --user. Use --help for usage examples."
      )
    );
    process.exit(1);
  }

  // Handle GitHub Repo URL
  if (opts.repo) {
    const input = String(opts.repo);
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
  else if (opts.user) {
    try {
      const stats = await getUserStats(String(opts.user), excluded);
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

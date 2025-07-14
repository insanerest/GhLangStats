const Table = require("cli-table3");
const chalk = require("chalk");

/**
 * Format GitHub language stats for terminal output
 * @param {Object} stats - Parsed statistics object
 */
function renderConsole(stats) {
  const frameworks =
    stats.frameworks && stats.frameworks.length
      ? stats.frameworks.join(", ")
      : "None";
  console.log(
    chalk.bold("\n🧠 Frameworks Detected: ") + frameworks
  );

  const table = new Table({
    head: [chalk.bold("Language"), "Files", "Bytes", "Bytes %"],
    colWidths: [20, 10, 15, 10],
  });

  for (const [lang, data] of Object.entries(stats.languages)) {
    table.push([
      chalk.cyan(lang),
      data.files,
      data.bytes.toLocaleString(),
      data.bytesPercent + "%",
    ]);
  }

  console.log("\n📊 Language Stats:");
  console.log(table.toString());

  console.log(chalk.bold("\n📦 Totals:"));
  console.log(`  Files: ${stats.totals.totalFiles.toLocaleString()}`);
  console.log(`  Bytes: ${stats.totals.totalBytes.toLocaleString()}\n`);
}

module.exports = renderConsole;

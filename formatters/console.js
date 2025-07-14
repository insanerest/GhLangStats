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

  const other = new Table({
    head: [chalk.bold("Language"), "Files", "Bytes"],
    olWidths: [20, 10, 15]
  });

  for (const [lang, data] of Object.entries(stats.other)) {
    other.push([
      chalk.cyan(lang),
      data.files,
      data.bytes.toLocaleString(),
    ]);
  }

  console.log("\n📊 Language Stats:");
  console.log("Byte % calcuated based on language bytes only\n")
  console.log(table.toString());

  console.log("\n\n📊 Other Stats (Not In %):");
  console.log(other.toString());

  console.log(chalk.bold("\n📦 Totals:"));
  console.log(`  Files: ${stats.totals.totalFiles.toLocaleString()}`);
  console.log(`  Total Code Bytes: ${stats.totals.languageBytes.toLocaleString()}`);
  console.log(`  Total Other Bytes: ${stats.totals.otherBytes.toLocaleString()}`);
  console.log(`  Grand Total Bytes: ${stats.totals.totalBytes.toLocaleString()}\n`);
}

module.exports = renderConsole;

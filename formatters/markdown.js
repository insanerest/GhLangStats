/**
 * Render stats as a Markdown table
 * @param {Object} stats
 * @returns {string}
 */
function renderMarkdown(stats) {
  let md = "";

  // Frameworks
  md += `### 🧠 Frameworks Detected: `;
  md += `${
    stats.frameworks.join(", ") ? stats.frameworks.join(", ") : "None"
  }\n\n`;

  // Table Header
  md += `### 📊 Language Statistics\n\n`;
  md += `| Language   | Files | Bytes   | Bytes % |\n`;
  md += `|------------|-------|---------|---------|\n`;

  // Table Rows
  for (const [lang, data] of Object.entries(stats.languages)) {
    md += `| ${lang}${" ".repeat(
      "------------" - (String(lang).length + 1)
    )} | ${data.files}${" ".repeat(
      "-------".length - (String(data.files).length + 2)
    )} | ${data.bytes.toLocaleString()}${" ".repeat(
      "---------".length - (String(data.bytes.toLocaleString()).length + 2)
    )} | ${data.bytesPercent}%${" ".repeat(
      "---------".length - (String(data.bytesPercent).length + 3)
    )} |\n`;
  }
  md += `\n\n`;

  md += `### 📊 Other Statistics\n\n`;
  md += `| Language   | Files | Bytes   |\n`;
  md += `|------------|-------|---------|\n`;

  // Table Rows
  for (const [lang, data] of Object.entries(stats.other)) {
    md += `| ${lang}${" ".repeat(
      "------------".length - (lang.length + 2)
    )} | ${data.files}${" ".repeat(
      "-------".length - (String(data.files).length + 2)
    )} | ${data.bytes.toLocaleString()}${" ".repeat(
      "---------".length - (String(data.bytes.toLocaleString()).length + 2)
    )} |\n`;
  }

  // Totals
  md += `\n### 📦 Totals\n\n`;
  md += `- **Total Files**: ${stats.totals.totalFiles.toLocaleString()}\n`;
  md += `- **Total Bytes**: ${stats.totals.totalBytes.toLocaleString()}\n`;

  return md;
}

module.exports = renderMarkdown;

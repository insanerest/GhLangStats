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
    md += `| ${lang} | ${data.files} | ${data.bytes.toLocaleString()} | ${
      data.bytesPercent
    }% |\n`;
  }
  md += `\n\n`;

  md += `### 📊 Other Statistics\n\n`;
  md += `| Language   | Files | Bytes   |\n`;
  md += `|------------|-------|---------|\n`;

  // Table Rows
  for (const [lang, data] of Object.entries(stats.other)) {
    md += `| ${lang} | ${data.files} | ${data.bytes.toLocaleString()}|\n`;
  }

  // Totals
  md += `\n### 📦 Totals\n\n`;
  md += `- **Total Files**: ${stats.totals.totalFiles.toLocaleString()}\n`;
  md += `- **Total Bytes**: ${stats.totals.totalBytes.toLocaleString()}\n`;

  return md;
}

module.exports = renderMarkdown;

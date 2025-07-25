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
  md += `| Language           | Files    | Bytes       | Bytes % |\n`;
  md += `|--------------------|----------|-------------|---------|\n`;

  // Table Rows
  for (const [lang, data] of Object.entries(stats.languages)) {
    const langCol = String(lang).padEnd(18);
    const filesCol = String(data.files).padEnd(8);
    const bytesCol = String(data.bytes.toLocaleString()).padEnd(11);
    const percentCol = (data.bytesPercent + "%").padEnd(7);

    md += `| ${langCol} | ${filesCol} | ${bytesCol} | ${percentCol} |\n`;
  }
  md += `\n\n`;

  md += `### 📊 Other Statistics\n\n`;
  md += `| Language         | Files   | Bytes         |\n`;
  md += `|------------------|---------|---------------|\n`;

  // Table Rows
  for (const [lang, data] of Object.entries(stats.other)) {
    const langCol = String(lang).padEnd(16);
    const filesCol = String(data.files).padEnd(7);
    const bytesCol = String(data.bytes.toLocaleString()).padEnd(13);

    md += `| ${langCol} | ${filesCol} | ${bytesCol} |\n`;
  }

  // Totals
  md += `\n### 📦 Totals\n\n`;
  md += `- **Total Files**: ${stats.totals.totalFiles.toLocaleString()}\n`;
  md += `- **Total Bytes**: ${stats.totals.totalBytes.toLocaleString()}\n`;

  return md;
}

module.exports = renderMarkdown;

function combineStats(statsArray) {
  const combined = {
    frameworks: new Set(),
    languages: {},
    other: {},
    totals: { totalBytes: 0, totalFiles: 0, languageBytes: 0, otherBytes:0 },
  };

  for (const stat of statsArray) {
    // Merge frameworks
    stat.frameworks.forEach((fw) => combined.frameworks.add(fw));

    // Merge languages
    for (const [lang, data] of Object.entries(stat.languages)) {
      if (!combined.languages[lang]) {
        combined.languages[lang] = { files: 0, bytes: 0 };
      }
      combined.languages[lang].files += data.files;
      combined.languages[lang].bytes += data.bytes;
    }
    for (const [lang, data] of Object.entries(stat.other)) {
      if (!combined.other[lang]) {
        combined.other[lang] = { files: 0, bytes: 0 };
      }
      combined.other[lang].files += data.files;
      combined.other[lang].bytes += data.bytes;
    }

    // Merge totals
    combined.totals.languageBytes += stat.totals.languageBytes;
    combined.totals.otherBytes += stat.totals.otherBytes;
    combined.totals.totalBytes += stat.totals.totalBytes;
    combined.totals.totalFiles += stat.totals.totalFiles;
  }


  // Calculate bytesPercent
  const totalBytes = combined.totals.totalBytes;
  for (const lang in combined.languages) {
    const bytes = combined.languages[lang].bytes;
    const percent = ((bytes / totalBytes) * 100).toFixed(2);
    combined.languages[lang].bytesPercent = percent;
  }

  // Convert frameworks Set to Array
  combined.frameworks = Array.from(combined.frameworks);
  return combined;
}

module.exports = combineStats;

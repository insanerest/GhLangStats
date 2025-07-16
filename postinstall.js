// postinstall.js
const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname,"bin", "cli.js");

// Check if the platform supports chmod (Windows won't care)
try {
  fs.chmodSync(filePath, 0o755); // rwxr-xr-x
  console.log(`✅ Made ${filePath} executable`);
  process.exit(0)
} catch (err) {
  console.error(`❌ Failed to chmod ${filePath}:`, err.message);
  process.exit(1);
}

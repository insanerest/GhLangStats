const fs = require("fs/promises");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

/**
 * Recursively copy a directory
 */
async function copyDirRecursive(srcDir, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  try {
    if(!process.argv[2]){
        throw Error("Please provide a version")
    }
    // Version variable - replace this with your input or argv parsing if needed
    const version = process.argv[2];

    const folderName = `ghlangstats-v${version}`;
    const targetPath = path.resolve(process.cwd(), folderName);

    // Directories to copy
    const dirsToCopy = ["src", "bin"];

    // Files to copy
    const filesToCopy = [
      ".gitignore",
      "README.md",
      "LICENSE",
      "postinstall.js",
      "package.json",
    ];

    // Step 1: Create folder
    await fs.mkdir(targetPath, { recursive: true });
    console.log(`Created folder: ${folderName}`);

    // Step 2: Copy directories
    for (const dirName of dirsToCopy) {
      const srcDir = path.resolve(process.cwd(), dirName);
      const destDir = path.join(targetPath, dirName);
      try {
        const stat = await fs.stat(srcDir);
        if (!stat.isDirectory()) {
          console.warn(`Warning: ${srcDir} is not a directory. Skipping.`);
          continue;
        }
      } catch {
        console.warn(`Warning: Directory ${srcDir} does not exist. Skipping.`);
        continue;
      }
      await copyDirRecursive(srcDir, destDir);
      console.log(`Copied directory ${dirName} to ${folderName}`);
    }

    // Step 3: Copy files
    for (const fileName of filesToCopy) {
      const srcFile = path.resolve(process.cwd(), fileName);
      const destFile = path.join(targetPath, fileName);
      try {
        const stat = await fs.stat(srcFile);
        if (!stat.isFile()) {
          console.warn(`Warning: ${srcFile} is not a file. Skipping.`);
          continue;
        }
      } catch {
        console.warn(`Warning: File ${srcFile} does not exist. Skipping.`);
        continue;
      }
      await fs.copyFile(srcFile, destFile);
      console.log(`Copied file ${fileName} to ${folderName}`);
    }

    // Step 4: Run pkg command
    // Command:
    // pkg ./ghlangstats-v[version] --targets node18-linux-x64,node18-macos-x64,node18-win-x64 --output dist/ghlangstats
    // Run from current folder

    const pkgCommand = `pkg ./${folderName} --targets node18-linux-x64,node18-macos-x64,node18-win-x64 --output dist/ghlangstats`;

    console.log(`Running command: ${pkgCommand}`);
    const { stdout, stderr } = await execAsync(pkgCommand);

    if (stdout) console.log("stdout:", stdout);
    if (stderr) console.error("stderr:", stderr);

    console.log("Process completed successfully.");
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch (err) {
    console.error("Error during process:", err);
  }
}

main();

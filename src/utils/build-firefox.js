const fs = require("fs-extra");
const path = require("path");

// File path
const manifestPath = path.join(__dirname, "../../public/manifest.json");
const tempManifestPath = path.join(__dirname, "../../manifest.json");

async function buildFirefoxManifest() {
  try {
    // Copy the original manifest to a temporary file
    await fs.copy(manifestPath, tempManifestPath);

    // Load the original manifest
    const manifest = await fs.readJSON(manifestPath);

    // Modify the manifest for Firefox
    manifest.background = {
      scripts: ["js/background.js"],
    };

    // Overwrite manifest.json with Firefox-compatible settings
    await fs.writeJSON(manifestPath, manifest, { spaces: 2 });

    // Run the build command with the modified manifest
    console.log("Building extension for Firefox...");
    runCommand("npm run build");
    console.log("Build for Firefox completed successfully.");
  } catch (error) {
    console.error("Error building Firefox manifest:", error);
  } finally {
    // Restore the original manifest from the temporary file
    await fs.move(tempManifestPath, manifestPath, { overwrite: true });
    console.log("Restored the original manifest.json.");
  }
}

function runCommand(command) {
  const execSync = require("child_process").execSync;
  execSync(command, { stdio: "inherit" });
}

buildFirefoxManifest();
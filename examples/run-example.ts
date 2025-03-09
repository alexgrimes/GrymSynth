#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import runExample from "./basic-usage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
import { mkdir } from "fs/promises";
const dataDir = join(__dirname, "..", "data", "examples", "vectors");

async function main() {
  try {
    // Create data directory if it doesn't exist
    await mkdir(dataDir, { recursive: true });

    console.log("Running audio learning example...\n");
    console.log("Using data directory:", dataDir);
    console.log("----------------------------------------\n");

    await runExample();

    console.log("\n----------------------------------------");
    console.log("Example completed successfully!");
  } catch (error) {
    console.error("\nError running example:", error);
    process.exit(1);
  }
}

// Add proper error handling for the main process
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

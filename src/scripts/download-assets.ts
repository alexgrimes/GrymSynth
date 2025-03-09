/**
 * Asset Download Script
 *
 * This script uses the asset manager to download required assets.
 * It can be run directly or as part of the setup process.
 */

import path from 'path';
import { program } from 'commander';
import { assetManager } from '../utils/asset-manager';
import { Logger } from '../utils/logger';

// Create logger
const logger = new Logger('AssetDownloader');

// Define command line options
program
  .option('--minimal', 'Download only essential assets')
  .option('--force', 'Force download even if assets already exist')
  .option('--config <path>', 'Path to custom asset configuration file')
  .option('--asset-dir <path>', 'Path to asset directory')
  .option('--external-dir <path>', 'Path to external asset directory')
  .option('--timeout <ms>', 'Download timeout in milliseconds', parseInt)
  .option('--retry <count>', 'Number of retry attempts', parseInt)
  .option('--concurrency <count>', 'Maximum concurrent downloads', parseInt)
  .option('--verbose', 'Enable verbose logging')
  .parse(process.argv);

const options = program.opts();

// Configure logger based on verbosity
if (options.verbose) {
  // This would be implemented if we had a global log level setting
  // setGlobalLogLevel('debug');
}

/**
 * Main function to download assets
 */
async function main() {
  try {
    logger.info('Starting asset download process');

    // Initialize asset manager with options
    const assetManagerOptions = {
      configPath: options.config ? path.resolve(options.config) : undefined,
      assetDir: options.assetDir ? path.resolve(options.assetDir) : undefined,
      externalDir: options.externalDir ? path.resolve(options.externalDir) : undefined,
      timeout: options.timeout,
      retryAttempts: options.retry,
      maxConcurrentDownloads: options.concurrency,
      validateChecksums: true,
      autoDownload: true,
    };

    // Initialize the asset manager
    await assetManager.initialize();

    // Register progress callback
    const unregisterCallback = assetManager.onProgress(progress => {
      if (progress.status === 'downloading') {
        const percentage = progress.percentage.toFixed(1);
        const downloaded = formatBytes(progress.bytesDownloaded);
        const total = formatBytes(progress.totalBytes);
        process.stdout.write(`\r${progress.assetId}: ${percentage}% (${downloaded}/${total})`);
      } else if (progress.status === 'complete') {
        process.stdout.write(`\r${progress.assetId}: Download complete                    \n`);
      } else if (progress.status === 'error') {
        process.stdout.write(`\r${progress.assetId}: Download failed - ${progress.error?.message}\n`);
      }
    });

    // Check all assets
    logger.info('Checking existing assets');
    const assetStatuses = await assetManager.checkAllAssets();

    // Filter assets based on options
    const assetsToDownload = [];

    for (const status of assetStatuses) {
      const asset = assetManager.getAsset(status.id);

      if (!asset) {
        continue;
      }

      // Skip non-essential assets in minimal mode
      if (options.minimal && !asset.required) {
        logger.info(`Skipping non-essential asset: ${asset.id}`);
        continue;
      }

      // Skip existing valid assets unless force is specified
      if (status.exists && status.valid && !options.force) {
        logger.info(`Asset already exists and is valid: ${asset.id}`);
        continue;
      }

      assetsToDownload.push(asset.id);
    }

    if (assetsToDownload.length === 0) {
      logger.info('No assets need to be downloaded');
      unregisterCallback();
      return;
    }

    logger.info(`Downloading ${assetsToDownload.length} assets`);

    // Download each asset
    for (const assetId of assetsToDownload) {
      try {
        const asset = assetManager.getAsset(assetId);
        if (!asset) {
          logger.warn(`Asset not found in configuration: ${assetId}`);
          continue;
        }

        logger.info(`Downloading asset: ${asset.name} (${asset.id})`);
        await assetManager.downloadAsset(assetId);
        logger.info(`Successfully downloaded asset: ${asset.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to download asset ${assetId}: ${errorMessage}`, { errorDetails: error });
      }
    }

    // Unregister progress callback
    unregisterCallback();

    logger.info('Asset download process completed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Asset download process failed: ${errorMessage}`, { errorDetails: error });
    process.exit(1);
  }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

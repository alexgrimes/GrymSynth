#!/usr/bin/env node

import { Command } from "commander";
import { PatternMigrationTool, PatternMigrationOptions, BatchMigrationResult } from "../services/migration/PatternMigrationTool";
import { FeatureTranslationOptions } from "../services/migration/FeatureTranslation";
import { Pattern } from "../lib/feature-memory/interfaces";
import { Logger, setGlobalLogLevel } from "../utils/logger";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// Configure the CLI
const program = new Command();

program
  .name("migrate-patterns")
  .description("CLI utility for migrating wav2vec2 patterns to GAMA format")
  .version("1.0.0");

// Define option types
interface MigrateCommandOptions {
  source: string;
  output: string;
  collection?: string;
  batchSize: string;
  dimension: string;
  method: string;
  threshold: string;
  logDir: string;
  dryRun: boolean;
  validate: boolean;
  preserveIds: boolean;
  verbose: boolean;
}

interface ValidateCommandOptions {
  original: string;
  migrated: string;
  threshold: string;
  logDir: string;
  verbose: boolean;
}

interface InfoCommandOptions {
  patterns: string;
  type?: string;
  verbose: boolean;
}

// Add commands
program
  .command("migrate")
  .description("Migrate patterns from wav2vec2 to GAMA format")
  .requiredOption("-s, --source <path>", "Source directory or file containing wav2vec2 patterns")
  .requiredOption("-o, --output <path>", "Output directory for migrated GAMA patterns")
  .option("-c, --collection <name>", "Specific collection to migrate (if applicable)")
  .option("-b, --batch-size <size>", "Batch size for processing patterns", "50")
  .option("-d, --dimension <size>", "Target dimension size for GAMA features", "512")
  .option("-m, --method <method>", "Dimensionality reduction method (average-pooling, max-pooling, linear-projection, pca)", "average-pooling")
  .option("-t, --threshold <value>", "Validation threshold for migration quality", "0.7")
  .option("-l, --log-dir <path>", "Directory to save migration logs", "./logs/migration")
  .option("--dry-run", "Perform a dry run without saving migrated patterns", false)
  .option("--no-validate", "Skip validation of migrated patterns")
  .option("--preserve-ids", "Preserve original pattern IDs", true)
  .option("--verbose", "Enable verbose logging", false)
  .action(async (options: MigrateCommandOptions) => {
    try {
      // Configure logger
      if (options.verbose) {
        setGlobalLogLevel("debug");
      }

      const logger = new Logger({
        namespace: "migrate-patterns"
      });

      logger.info("Starting pattern migration", { options });

      // Configure migration options
      const migrationOptions: PatternMigrationOptions = {
        translationOptions: {
          targetDimension: parseInt(options.dimension),
          dimensionalityReductionMethod: options.method as FeatureTranslationOptions["dimensionalityReductionMethod"],
          normalizeOutput: true,
          validationThreshold: parseFloat(options.threshold)
        },
        batchSize: parseInt(options.batchSize),
        validateMigration: options.validate !== false,
        validationThreshold: parseFloat(options.threshold),
        logDirectory: options.logDir,
        preserveIds: options.preserveIds
      };

      // Create migration tool
      const migrationTool = new PatternMigrationTool(migrationOptions);

      // Load patterns
      logger.info("Loading patterns from source", { source: options.source });
      const patterns = await loadPatterns(options.source, options.collection);

      if (patterns.length === 0) {
        logger.error("No patterns found in source");
        process.exit(1);
      }

      logger.info(`Loaded ${patterns.length} patterns`);

      // Confirm if not dry run
      if (!options.dryRun) {
        const confirmed = await confirmMigration(patterns.length);
        if (!confirmed) {
          logger.info("Migration cancelled by user");
          process.exit(0);
        }
      }

      // Migrate patterns
      logger.info(`Starting migration of ${patterns.length} patterns`);
      const { migratedPatterns, result } = await migrationTool.migratePatterns(patterns);

      // Print results
      printMigrationResults(result);

      // Save migrated patterns if not a dry run
      if (!options.dryRun) {
        logger.info(`Saving ${migratedPatterns.length} migrated patterns to ${options.output}`);
        await savePatterns(migratedPatterns, options.output);
        logger.info("Migration completed successfully");
      } else {
        logger.info("Dry run completed successfully");
      }
    } catch (error) {
      console.error("Error during migration:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("validate")
  .description("Validate migrated patterns against original patterns")
  .requiredOption("-o, --original <path>", "Directory or file containing original wav2vec2 patterns")
  .requiredOption("-m, --migrated <path>", "Directory or file containing migrated GAMA patterns")
  .option("-t, --threshold <value>", "Validation threshold for quality", "0.7")
  .option("-l, --log-dir <path>", "Directory to save validation logs", "./logs/validation")
  .option("--verbose", "Enable verbose logging", false)
  .action(async (options: ValidateCommandOptions) => {
    try {
      // Configure logger
      if (options.verbose) {
        setGlobalLogLevel("debug");
      }

      const logger = new Logger({
        namespace: "validate-patterns"
      });

      logger.info("Starting pattern validation", { options });

      // Load original patterns
      logger.info("Loading original patterns", { source: options.original });
      const originalPatterns = await loadPatterns(options.original);

      if (originalPatterns.length === 0) {
        logger.error("No original patterns found");
        process.exit(1);
      }

      // Load migrated patterns
      logger.info("Loading migrated patterns", { source: options.migrated });
      const migratedPatterns = await loadPatterns(options.migrated);

      if (migratedPatterns.length === 0) {
        logger.error("No migrated patterns found");
        process.exit(1);
      }

      logger.info(`Loaded ${originalPatterns.length} original patterns and ${migratedPatterns.length} migrated patterns`);

      // Validate patterns
      const validationResults = await validatePatterns(originalPatterns, migratedPatterns, parseFloat(options.threshold));

      // Print validation results
      printValidationResults(validationResults);

      // Save validation results
      if (options.logDir) {
        const timestamp = new Date().toISOString().replace(/:/g, "-");
        const logFile = path.join(options.logDir, `validation_results_${timestamp}.json`);

        // Ensure log directory exists
        fs.mkdirSync(options.logDir, { recursive: true });

        // Write results to file
        fs.writeFileSync(logFile, JSON.stringify(validationResults, null, 2));
        logger.info(`Validation results saved to ${logFile}`);
      }

      logger.info("Validation completed successfully");
    } catch (error) {
      console.error("Error during validation:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("info")
  .description("Display information about patterns")
  .requiredOption("-p, --patterns <path>", "Directory or file containing patterns")
  .option("-t, --type <type>", "Pattern type (wav2vec2 or gama)")
  .option("--verbose", "Enable verbose logging", false)
  .action(async (options: InfoCommandOptions) => {
    try {
      // Configure logger
      if (options.verbose) {
        setGlobalLogLevel("debug");
      }

      const logger = new Logger({
        namespace: "pattern-info"
      });

      logger.info("Getting pattern information", { source: options.patterns });

      // Load patterns
      const patterns = await loadPatterns(options.patterns);

      if (patterns.length === 0) {
        logger.error("No patterns found");
        process.exit(1);
      }

      // Display pattern information
      displayPatternInfo(patterns, options.type);

      logger.info("Information display completed");
    } catch (error) {
      console.error("Error getting pattern information:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

/**
 * Loads patterns from a file or directory
 *
 * @param source The source file or directory
 * @param collection Optional collection name to filter patterns
 * @returns Array of loaded patterns
 */
async function loadPatterns(source: string, collection?: string): Promise<Pattern[]> {
  // Check if source exists
  if (!fs.existsSync(source)) {
    throw new Error(`Source does not exist: ${source}`);
  }

  const stats = fs.statSync(source);

  if (stats.isFile()) {
    // Load patterns from file
    const fileContent = fs.readFileSync(source, "utf-8");
    let patterns: Pattern[] = [];

    try {
      // Try parsing as JSON
      const data = JSON.parse(fileContent);

      if (Array.isArray(data)) {
        patterns = data;
      } else if (data.patterns && Array.isArray(data.patterns)) {
        patterns = data.patterns;
      } else {
        patterns = [data];
      }
    } catch (error) {
      throw new Error(`Failed to parse patterns from file: ${error instanceof Error ? error.message : error}`);
    }

    // Filter by collection if specified
    if (collection) {
      patterns = patterns.filter(p => p.metadata?.category === collection);
    }

    return patterns;
  } else if (stats.isDirectory()) {
    // Load patterns from directory
    const files = fs.readdirSync(source)
      .filter(file => file.endsWith(".json"))
      .map(file => path.join(source, file));

    const allPatterns: Pattern[] = [];

    for (const file of files) {
      try {
        const filePatterns = await loadPatterns(file);
        allPatterns.push(...filePatterns);
      } catch (error) {
        console.warn(`Warning: Failed to load patterns from ${file}: ${error instanceof Error ? error.message : error}`);
      }
    }

    // Filter by collection if specified
    if (collection) {
      return allPatterns.filter(p => p.metadata?.category === collection);
    }

    return allPatterns;
  } else {
    throw new Error(`Unsupported source type: ${source}`);
  }
}

/**
 * Saves patterns to a directory
 *
 * @param patterns The patterns to save
 * @param outputDir The output directory
 */
async function savePatterns(patterns: Pattern[], outputDir: string): Promise<void> {
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Group patterns by category
  const patternsByCategory: Record<string, Pattern[]> = {};

  for (const pattern of patterns) {
    const category = pattern.metadata.category || "uncategorized";

    if (!patternsByCategory[category]) {
      patternsByCategory[category] = [];
    }

    patternsByCategory[category].push(pattern);
  }

  // Save patterns by category
  for (const [category, categoryPatterns] of Object.entries(patternsByCategory)) {
    const outputFile = path.join(outputDir, `${category}_patterns.json`);

    fs.writeFileSync(outputFile, JSON.stringify(categoryPatterns, null, 2));
    console.log(`Saved ${categoryPatterns.length} patterns to ${outputFile}`);
  }

  // Save all patterns to a single file
  const allPatternsFile = path.join(outputDir, "all_patterns.json");
  fs.writeFileSync(allPatternsFile, JSON.stringify(patterns, null, 2));
  console.log(`Saved all ${patterns.length} patterns to ${allPatternsFile}`);
}

/**
 * Confirms migration with the user
 *
 * @param patternCount The number of patterns to migrate
 * @returns Whether the user confirmed the migration
 */
async function confirmMigration(patternCount: number): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise<boolean>((resolve) => {
    rl.question(`Are you sure you want to migrate ${patternCount} patterns? (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

/**
 * Prints migration results to the console
 *
 * @param result The migration result
 */
function printMigrationResults(result: BatchMigrationResult): void {
  console.log("\n=== Migration Results ===");
  console.log(`Total patterns: ${result.totalPatterns}`);
  console.log(`Successfully migrated: ${result.successCount} (${(result.successCount / result.totalPatterns * 100).toFixed(2)}%)`);
  console.log(`Failed migrations: ${result.failureCount} (${(result.failureCount / result.totalPatterns * 100).toFixed(2)}%)`);
  console.log(`Average quality score: ${result.averageQuality.toFixed(4)}`);
  console.log(`Total processing time: ${(result.totalProcessingTimeMs / 1000).toFixed(2)} seconds`);

  if (result.failureCount > 0) {
    console.log("\nFailed patterns:");
    const failedResults = result.results.filter((r) => !r.success);
    failedResults.slice(0, 5).forEach((r) => {
      console.log(`- ${r.originalId}: ${r.error}`);
    });

    if (failedResults.length > 5) {
      console.log(`... and ${failedResults.length - 5} more`);
    }
  }
}

/**
 * Prints validation results to the console
 *
 * @param results The validation results
 */
function printValidationResults(results: any): void {
  console.log("\n=== Validation Results ===");
  console.log(`Total original patterns: ${results.totalOriginalPatterns}`);
  console.log(`Total migrated patterns: ${results.totalMigratedPatterns}`);
  console.log(`Matched patterns: ${results.matchedPatterns} (${(results.matchedPatterns / results.totalOriginalPatterns * 100).toFixed(2)}%)`);
  console.log(`Valid patterns: ${results.validPatterns} (${(results.validPatterns / results.totalOriginalPatterns * 100).toFixed(2)}%)`);
  console.log(`Average similarity score: ${results.averageSimilarity.toFixed(4)}`);

  if (results.matchedPatterns < results.totalOriginalPatterns) {
    console.log("\nUnmatched patterns:");
    const unmatchedResults = results.results.filter((r: any) => !r.matched);
    unmatchedResults.slice(0, 5).forEach((r: any) => {
      console.log(`- ${r.originalId}`);
    });

    if (unmatchedResults.length > 5) {
      console.log(`... and ${unmatchedResults.length - 5} more`);
    }
  }

  if (results.validPatterns < results.matchedPatterns) {
    console.log("\nInvalid patterns:");
    const invalidResults = results.results.filter((r: any) => r.matched && !r.valid);
    invalidResults.slice(0, 5).forEach((r: any) => {
      console.log(`- ${r.originalId}: similarity ${r.similarity.toFixed(4)}`);
    });

    if (invalidResults.length > 5) {
      console.log(`... and ${invalidResults.length - 5} more`);
    }
  }
}

/**
 * Validates migrated patterns against original patterns
 *
 * @param originalPatterns The original patterns
 * @param migratedPatterns The migrated patterns
 * @param threshold The validation threshold
 * @returns Validation results
 */
async function validatePatterns(
  originalPatterns: Pattern[],
  migratedPatterns: Pattern[],
  threshold: number
): Promise<any> {
  // Create a map of migrated patterns by ID
  const migratedPatternsMap = new Map<string, Pattern>();

  for (const pattern of migratedPatterns) {
    migratedPatternsMap.set(pattern.id, pattern);
  }

  // Validate each original pattern
  const results = [];
  let matchCount = 0;

  for (const originalPattern of originalPatterns) {
    const migratedPattern = migratedPatternsMap.get(originalPattern.id);

    if (migratedPattern) {
      matchCount++;

      // Compare patterns
      const comparison = comparePatterns(originalPattern, migratedPattern);

      results.push({
        originalId: originalPattern.id,
        migratedId: migratedPattern.id,
        matched: true,
        valid: comparison.similarity >= threshold,
        similarity: comparison.similarity,
        details: comparison.details
      });
    } else {
      results.push({
        originalId: originalPattern.id,
        matched: false,
        valid: false,
        similarity: 0,
        details: { error: "No matching migrated pattern found" }
      });
    }
  }

  // Calculate statistics
  const validResults = results.filter(r => r.valid);

  return {
    totalOriginalPatterns: originalPatterns.length,
    totalMigratedPatterns: migratedPatterns.length,
    matchedPatterns: matchCount,
    validPatterns: validResults.length,
    averageSimilarity: results.reduce((sum, r) => sum + r.similarity, 0) / results.length,
    results
  };
}

/**
 * Compares an original pattern with a migrated pattern
 *
 * @param originalPattern The original pattern
 * @param migratedPattern The migrated pattern
 * @returns Comparison result
 */
function comparePatterns(originalPattern: Pattern, migratedPattern: Pattern): {
  similarity: number;
  details: any;
} {
  // This is a simplified comparison that checks:
  // 1. Feature dimensions
  // 2. Feature data presence
  // 3. Metadata consistency

  const originalDimensions = originalPattern.features.get("dimensions") as number[];
  const migratedDimensions = migratedPattern.features.get("dimensions") as number[];

  const originalFeatureData = originalPattern.features.get("featureData") as number[];
  const migratedFeatureData = migratedPattern.features.get("featureData") as number[];

  const dimensionScore = originalDimensions && migratedDimensions ? 1 : 0;
  const featureDataScore = originalFeatureData && migratedFeatureData ? 1 : 0;

  const metadataScore = originalPattern.metadata.category === migratedPattern.metadata.category ? 1 : 0;

  // Calculate overall similarity
  const similarity = (dimensionScore + featureDataScore + metadataScore) / 3;

  return {
    similarity,
    details: {
      dimensionScore,
      featureDataScore,
      metadataScore,
      originalDimensions,
      migratedDimensions
    }
  };
}

/**
 * Displays information about patterns
 *
 * @param patterns The patterns to display information about
 * @param type Optional pattern type
 */
function displayPatternInfo(patterns: Pattern[], type?: string): void {
  console.log("\n=== Pattern Information ===");
  console.log(`Total patterns: ${patterns.length}`);

  // Count patterns by source
  const sourceCount: Record<string, number> = {};

  for (const pattern of patterns) {
    const source = pattern.metadata.source;
    sourceCount[source] = (sourceCount[source] || 0) + 1;
  }

  console.log("\nPatterns by source:");
  for (const [source, count] of Object.entries(sourceCount)) {
    console.log(`- ${source}: ${count} (${(count / patterns.length * 100).toFixed(2)}%)`);
  }

  // Count patterns by category
  const categoryCount: Record<string, number> = {};

  for (const pattern of patterns) {
    const category = pattern.metadata.category;
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  }

  console.log("\nPatterns by category:");
  for (const [category, count] of Object.entries(categoryCount)) {
    console.log(`- ${category}: ${count} (${(count / patterns.length * 100).toFixed(2)}%)`);
  }

  // Display feature dimensions
  const dimensions = new Set<string>();

  for (const pattern of patterns) {
    const dims = pattern.features.get("dimensions") as number[];
    if (dims) {
      dimensions.add(dims.join("x"));
    }
  }

  console.log("\nFeature dimensions:");
  for (const dim of dimensions) {
    console.log(`- ${dim}`);
  }

  // Display sample pattern
  if (patterns.length > 0) {
    const sample = patterns[0];
    console.log("\nSample pattern:");
    console.log(`- ID: ${sample.id}`);
    console.log(`- Source: ${sample.metadata.source}`);
    console.log(`- Category: ${sample.metadata.category}`);
    console.log(`- Confidence: ${sample.confidence}`);
    console.log(`- Timestamp: ${sample.timestamp}`);

    const dims = sample.features.get("dimensions") as number[];
    if (dims) {
      console.log(`- Dimensions: ${dims.join("x")}`);
    }

    const featureData = sample.features.get("featureData") as number[];
    if (featureData) {
      console.log(`- Feature data length: ${featureData.length}`);
    }
  }
}

// If this script is run directly
if (require.main === module) {
  // This will be executed when the script is run directly
  program.parse(process.argv);
}

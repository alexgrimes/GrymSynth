import fs from "fs";
import path from "path";
import { ContextItem } from "../services/types";
import { Logger } from "../utils/logger";

/**
 * Service for persisting context data to disk and loading it back
 * This enables workflows to maintain context across executions and system restarts
 */
export class ContextPersistence {
  private logger: Logger;
  private basePath: string;

  /**
   * Creates a new ContextPersistence instance
   * @param basePath Base directory for storing context data
   */
  constructor(basePath: string = path.join(process.cwd(), "data", "context")) {
    this.logger = new Logger("context-persistence");
    this.basePath = basePath;
    this.ensureDirectoryExists(this.basePath);
  }

  /**
   * Saves context items for a specific workflow to disk
   * @param workflowId ID of the workflow
   * @param items Context items to save
   */
  async saveWorkflowContext(
    workflowId: string,
    items: ContextItem[]
  ): Promise<void> {
    try {
      const workflowPath = this.getWorkflowPath(workflowId);
      this.ensureDirectoryExists(workflowPath);

      // Group items by key
      const itemsByKey = this.groupItemsByKey(items);

      // Save each key to a separate file
      for (const [key, keyItems] of Object.entries(itemsByKey)) {
        const filePath = path.join(
          workflowPath,
          `${this.sanitizeFilename(key)}.json`
        );
        await fs.promises.writeFile(
          filePath,
          JSON.stringify(keyItems, this.replacer, 2)
        );
      }

      this.logger.info(
        `Saved ${items.length} context items for workflow ${workflowId}`
      );
    } catch (error) {
      this.logger.error(`Error saving workflow context: ${workflowId}`, {
        error,
      });
      throw new Error(
        `Failed to save workflow context: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Loads all context items for a specific workflow from disk
   * @param workflowId ID of the workflow
   * @returns Array of context items
   */
  async loadWorkflowContext(workflowId: string): Promise<ContextItem[]> {
    try {
      const workflowPath = this.getWorkflowPath(workflowId);

      if (!fs.existsSync(workflowPath)) {
        this.logger.info(`No saved context found for workflow ${workflowId}`);
        return [];
      }

      const files = await fs.promises.readdir(workflowPath);
      const contextItems: ContextItem[] = [];

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(workflowPath, file);
          const content = await fs.promises.readFile(filePath, "utf8");
          const items = JSON.parse(content, this.reviver);
          contextItems.push(...items);
        }
      }

      this.logger.info(
        `Loaded ${contextItems.length} context items for workflow ${workflowId}`
      );
      return contextItems;
    } catch (error) {
      this.logger.error(`Error loading workflow context: ${workflowId}`, {
        error,
      });
      return [];
    }
  }

  /**
   * Deletes all persisted context for a specific workflow
   * @param workflowId ID of the workflow
   */
  async deleteWorkflowContext(workflowId: string): Promise<void> {
    try {
      const workflowPath = this.getWorkflowPath(workflowId);

      if (fs.existsSync(workflowPath)) {
        await this.deleteDirectory(workflowPath);
        this.logger.info(`Deleted context for workflow ${workflowId}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting workflow context: ${workflowId}`, {
        error,
      });
    }
  }

  /**
   * Lists all workflow IDs that have persisted context
   * @returns Array of workflow IDs
   */
  async listWorkflows(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.basePath)) {
        return [];
      }

      const directories = await fs.promises.readdir(this.basePath);
      return directories;
    } catch (error) {
      this.logger.error("Error listing workflows", { error });
      return [];
    }
  }

  /**
   * Groups context items by their key
   * @param items Context items to group
   * @returns Object with keys mapping to arrays of context items
   */
  private groupItemsByKey(items: ContextItem[]): Record<string, ContextItem[]> {
    const result: Record<string, ContextItem[]> = {};

    for (const item of items) {
      if (!result[item.key]) {
        result[item.key] = [];
      }
      result[item.key].push(item);
    }

    return result;
  }

  /**
   * Gets the directory path for a specific workflow
   * @param workflowId ID of the workflow
   * @returns Path to the workflow directory
   */
  private getWorkflowPath(workflowId: string): string {
    return path.join(this.basePath, this.sanitizeFilename(workflowId));
  }

  /**
   * Ensures a directory exists, creating it if necessary
   * @param dirPath Path to the directory
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Recursively deletes a directory and its contents
   * @param dirPath Path to the directory
   */
  private async deleteDirectory(dirPath: string): Promise<void> {
    if (fs.existsSync(dirPath)) {
      const entries = await fs.promises.readdir(dirPath, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.deleteDirectory(fullPath);
        } else {
          await fs.promises.unlink(fullPath);
        }
      }

      await fs.promises.rmdir(dirPath);
    }
  }

  /**
   * Sanitizes a string for use as a filename
   * @param name String to sanitize
   * @returns Sanitized string
   */
  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }

  /**
   * Custom JSON replacer to handle Date objects
   */
  private replacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: "Date", value: value.toISOString() };
    }
    return value;
  }

  /**
   * Custom JSON reviver to restore Date objects
   */
  private reviver(key: string, value: any): any {
    if (value && typeof value === "object" && value.__type === "Date") {
      return new Date(value.value);
    }
    return value;
  }
}

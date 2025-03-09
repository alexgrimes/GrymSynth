import { ContextQuery } from "../services/types";
import { Logger } from "../utils/logger";
import { ContextFilter, ContextItem } from "./types";
import { ensureTimestamp } from "../services/types";

export class ContextManager {
  private items: Map<string, ContextItem[]>;
  private logger: Logger;
  private adapters: Map<string, any> = new Map();
  private repository?: any;

  constructor(repository?: any) {
    this.items = new Map();
    this.logger = new Logger("context-manager");
    this.repository = repository;
  }

  registerAdapter(modelType: string, adapter: any): void {
    this.adapters.set(modelType, adapter);
    this.logger.info(`Registered adapter for model type: ${modelType}`);
  }

  async store(
    key: string,
    content: any,
    workflowId?: string
  ): Promise<ContextItem> {
    const item: ContextItem = {
      id: `${key}-${Date.now()}`,
      key,
      content,
      data: content,
      type: key,
      timestamp: Date.now(),
      metadata: {
        timestamp: Date.now(),
        source: "context-manager",
        priority: 1,
        tags: []
      },
      workflowId,
    };

    if (!this.items.has(key)) {
      this.items.set(key, []);
    }

    this.items.get(key)!.push(item);

    this.logger.info(`Stored context item: ${item.id}`, {
      key,
      workflowId,
      contentType: typeof content,
    });

    return item;
  }

  async storeContext(content: any): Promise<ContextItem> {
    const id = content.id || `context-${Date.now()}`;
    const key = content.type || "general";

    const item: ContextItem = {
      id,
      key,
      content,
      data: content,
      type: key,
      timestamp: Date.now(),
      metadata: {
        timestamp: Date.now(),
        source: "context-manager",
        priority: 1,
        tags: []
      }
    };

    if (!this.items.has(key)) {
      this.items.set(key, []);
    }

    this.items.get(key)!.push(item);

    this.logger.info(`Stored context item: ${item.id}`, {
      key,
      contentType: typeof content,
    });

    return item;
  }

  async getContextForModel(
    modelType: string,
    filter?: ContextFilter
  ): Promise<any> {
    const key = `model-context-${modelType}`;
    let items = this.items.get(key) || [];

    if (filter) {
      // Apply filters
      if (filter.types) {
        items = items.filter((item) =>
          filter.types!.some((type) => item.content?.type === type)
        );
      }

      if (filter.minPriority !== undefined) {
        items = items.filter(
          (item) =>
            (item.content?.metadata?.priority || 0) >= filter.minPriority!
        );
      }

      if (filter.tags) {
        items = items.filter((item) =>
          filter.tags!.every((tag) =>
            item.content?.metadata?.tags?.includes(tag)
          )
        );
      }

      if (filter.fromTimestamp) {
        items = items.filter((item) => {
          if (!item.timestamp) return false;

          const itemTime = getTimeValue(item.timestamp);
          const filterTime = getTimeValue(filter.fromTimestamp!);

          return itemTime >= filterTime;
        });
      }
    }

    // Sort by timestamp descending and take most recent
    items.sort((a, b) => {
      const timeA = getTimeValue(a.timestamp);
      const timeB = getTimeValue(b.timestamp);
      return timeB - timeA;
    });

    return items.length > 0 ? items[0].content : null;
  }

  async query(query: ContextQuery): Promise<ContextItem[]> {
    const { key, workflowId, limit = 10 } = query;

    if (!key) {
      return [];
    }

    const items = this.items.get(key) || [];

    let filtered = items;

    // Filter by workflow ID if specified
    if (workflowId) {
      filtered = filtered.filter((item) => item.workflowId === workflowId);
    }

    // Sort by timestamp descending
    filtered = filtered.sort((a, b) => {
      const timeA = getTimeValue(a.timestamp);
      const timeB = getTimeValue(b.timestamp);
      return timeB - timeA;
    });

    // Apply limit
    filtered = filtered.slice(0, limit);

    this.logger.debug(`Queried context items`, {
      key,
      workflowId,
      limit,
      found: filtered.length,
    });

    return filtered;
  }

  async clear(key?: string, workflowId?: string): Promise<void> {
    if (key) {
      if (workflowId) {
        // Clear specific workflow items for a key
        const items = this.items.get(key);
        if (items) {
          this.items.set(
            key,
            items.filter((item) => item.workflowId !== workflowId)
          );
        }
      } else {
        // Clear all items for a key
        this.items.delete(key);
      }
    } else if (workflowId) {
      // Clear all items for a workflow
      for (const [key, items] of this.items.entries()) {
        this.items.set(
          key,
          items.filter((item) => item.workflowId !== workflowId)
        );
      }
    } else {
      // Clear everything
      this.items.clear();
    }

    this.logger.info(`Cleared context items`, { key, workflowId });
  }
}

// Helper function to get a timestamp value regardless of type
function getTimeValue(value: any): number {
  if (value === undefined || value === null) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return 0;
}

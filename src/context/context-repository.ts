import {
  ContextItem,
  ContextFilter,
  ContextRepository,
  ContextItemNotFoundError,
} from "./types";
import { Logger } from "../utils/logger";

export class InMemoryContextRepository implements ContextRepository {
  private items: Map<string, ContextItem> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ namespace: "context-repository" });
  }

  async store(item: ContextItem): Promise<void> {
    this.items.set(item.id, item);
    this.logger.debug(`Stored context item: ${item.id}`, { type: item.type });
  }

  async retrieve(id: string): Promise<ContextItem> {
    const item = this.items.get(id);
    if (!item) {
      throw new ContextItemNotFoundError(`Context item ${id} not found`);
    }

    // Check TTL
    if (this.isExpired(item)) {
      this.items.delete(id);
      throw new ContextItemNotFoundError(`Context item ${id} has expired`);
    }

    return item;
  }

  async query(filter: ContextFilter): Promise<ContextItem[]> {
    // Create a copy of items for filtering
    const items = Array.from(this.items.values());

    return items.filter((item) => {
      // Remove expired items during query
      if (this.isExpired(item)) {
        this.items.delete(item.id);
        return false;
      }

      // Apply filters
      if (filter.types && item.type && !filter.types.includes(item.type)) {
        return false;
      }

      if (filter.source && item.metadata.source !== filter.source) {
        return false;
      }

      if (
        filter.minPriority !== undefined &&
        item.metadata.priority < filter.minPriority
      ) {
        return false;
      }

      if (filter.tags && filter.tags.length > 0) {
        const itemTags = item.metadata.tags || [];
        if (!filter.tags.some((tag) => itemTags.includes(tag))) {
          return false;
        }
      }

      if (
        filter.fromTimestamp &&
        item.metadata.timestamp < filter.fromTimestamp
      ) {
        return false;
      }

      if (filter.toTimestamp && item.metadata.timestamp > filter.toTimestamp) {
        return false;
      }

      return true;
    });
  }

  async update(id: string, updates: Partial<ContextItem>): Promise<void> {
    const item = await this.retrieve(id);

    const updatedItem = {
      ...item,
      ...updates,
      metadata: {
        ...item.metadata,
        ...(updates.metadata || {}),
      },
    };

    this.items.set(id, updatedItem);
    this.logger.debug(`Updated context item: ${id}`, { type: item.type });
  }

  async delete(id: string): Promise<void> {
    if (!this.items.has(id)) {
      throw new ContextItemNotFoundError(`Context item ${id} not found`);
    }

    this.items.delete(id);
    this.logger.debug(`Deleted context item: ${id}`);
  }

  async clear(): Promise<void> {
    this.items.clear();
    this.logger.debug("Cleared all context items");
  }

  private isExpired(item: ContextItem): boolean {
    if (!item.metadata.ttl) {
      return false;
    }

    const expirationTime = new Date(
      (item.metadata.timestamp instanceof Date
        ? item.metadata.timestamp.getTime()
        : item.metadata.timestamp) + item.metadata.ttl
    );
    return expirationTime <= new Date();
  }
}

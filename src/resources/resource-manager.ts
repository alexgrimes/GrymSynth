import { Logger } from "../utils/logger";
import { MetricsCollector } from "../monitoring/metrics-collector";
import { EventEmitter } from "events";

interface MetricTags {
  [key: string]: string;
}

export interface Resource {
  id: string;
  type: string;
  metadata: Record<string, any>;
  status: "ready" | "busy" | "unavailable";
  createdAt: Date;
  lastUsed: Date;
}

export interface ResourceAllocation {
  id: string;
  resourceId: string;
  taskId: string;
  allocatedAt: Date;
  expiresAt: Date;
  priority: number;
}

export interface ResourceRequest {
  id: string;
  type: string;
  taskId: string;
  priority: number;
  requirements?: Record<string, any>;
  createdAt: Date;
}

export class ResourceManager extends EventEmitter {
  private resources: Map<string, Resource> = new Map();
  private allocations: Map<string, ResourceAllocation> = new Map();
  private pendingRequests: ResourceRequest[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private logger: Logger;
  private metricsCollector: MetricsCollector;
  private resourceTimeout: number;

  constructor(
    metricsCollector: MetricsCollector,
    options: {
      resourceTimeoutMs?: number;
      checkIntervalMs?: number;
    } = {}
  ) {
    super();
    this.logger = new Logger("resource-manager");
    this.metricsCollector = metricsCollector;
    this.resourceTimeout = options.resourceTimeoutMs || 30 * 60 * 1000; // 30 minutes default

    // Start periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAllocations();
      this.cleanupStaleResources();
      this.processQueue();
    }, options.checkIntervalMs || 10000);
  }

  registerResource(type: string, metadata: Record<string, any> = {}): string {
    const id = `${type}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const resource: Resource = {
      id,
      type,
      metadata,
      status: "ready",
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    this.resources.set(id, resource);

    this.logger.info(`Registered resource: ${id}`, { type });
    this.emit("resource:registered", resource);

    // Record metric
    this.recordMetric("resources.count", 1, { type, action: "register" });

    // Process queue in case there are pending requests
    this.processQueue();

    return id;
  }

  async requestResource(
    type: string,
    taskId: string,
    priority: number = 1,
    requirements: Record<string, any> = {}
  ): Promise<Resource | null> {
    // First, try to find an available resource
    const availableResource = this.findAvailableResource(type, requirements);

    if (availableResource) {
      // Allocate resource immediately
      const allocation = this.allocateResource(
        availableResource.id,
        taskId,
        priority
      );

      // Update resource status
      this.updateResourceStatus(availableResource.id, "busy");

      return availableResource;
    }

    // If no resource is available, queue the request
    const requestId = `req-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const request: ResourceRequest = {
      id: requestId,
      type,
      taskId,
      priority,
      requirements,
      createdAt: new Date(),
    };

    this.pendingRequests.push(request);

    // Sort by priority (higher priority first)
    this.pendingRequests.sort((a, b) => b.priority - a.priority);

    this.logger.info(`Queued resource request: ${requestId}`, {
      type,
      taskId,
      priority,
      queueLength: this.pendingRequests.length,
    });

    // Record metric
    this.recordMetric("resources.requests.queued", 1, { type });

    // Return null to indicate the request was queued
    return null;
  }

  releaseResource(id: string, taskId: string): boolean {
    // Find the allocation
    let allocationId: string | undefined;
    for (const [allocId, alloc] of this.allocations.entries()) {
      if (alloc.resourceId === id && alloc.taskId === taskId) {
        allocationId = allocId;
        break;
      }
    }

    if (!allocationId) {
      this.logger.warn(
        `No allocation found for resource ${id} and task ${taskId}`
      );
      return false;
    }

    // Remove allocation
    this.allocations.delete(allocationId);

    // Update resource status
    this.updateResourceStatus(id, "ready");

    // Update last used timestamp
    const resource = this.resources.get(id);
    if (resource) {
      resource.lastUsed = new Date();
    }

    this.logger.info(`Released resource: ${id}`, { taskId });

    // Record metric
    this.recordMetric("resources.released", 1, {
      type: resource?.type || "unknown",
    });

    // Process queue
    this.processQueue();

    return true;
  }

  private recordMetric(
    name: string,
    value: number,
    tags: Record<string, any>
  ): void {
    // Ensure all tag values are strings
    const stringTags: MetricTags = {};
    for (const [key, val] of Object.entries(tags)) {
      stringTags[key] = String(val);
    }
    this.metricsCollector.record(name, value, stringTags);
  }

  getResourceStats(): {
    total: number;
    ready: number;
    busy: number;
    unavailable: number;
    byType: Record<
      string,
      {
        total: number;
        ready: number;
        busy: number;
        unavailable: number;
      }
    >;
    queuedRequests: number;
    activeAllocations: number;
  } {
    const stats = {
      total: 0,
      ready: 0,
      busy: 0,
      unavailable: 0,
      byType: {} as Record<
        string,
        {
          total: number;
          ready: number;
          busy: number;
          unavailable: number;
        }
      >,
      queuedRequests: this.pendingRequests.length,
      activeAllocations: this.allocations.size,
    };

    // Count resources by status and type
    for (const resource of this.resources.values()) {
      stats.total++;

      if (resource.status === "ready") {
        stats.ready++;
      } else if (resource.status === "busy") {
        stats.busy++;
      } else if (resource.status === "unavailable") {
        stats.unavailable++;
      }

      // Count by type
      if (!stats.byType[resource.type]) {
        stats.byType[resource.type] = {
          total: 0,
          ready: 0,
          busy: 0,
          unavailable: 0,
        };
      }

      stats.byType[resource.type].total++;

      if (resource.status === "ready") {
        stats.byType[resource.type].ready++;
      } else if (resource.status === "busy") {
        stats.byType[resource.type].busy++;
      } else if (resource.status === "unavailable") {
        stats.byType[resource.type].unavailable++;
      }
    }

    return stats;
  }

  private updateResourceStatus(
    id: string,
    status: "ready" | "busy" | "unavailable"
  ): boolean {
    const resource = this.resources.get(id);

    if (!resource) {
      return false;
    }

    const oldStatus = resource.status;
    resource.status = status;

    this.logger.info(`Updated resource status: ${id}`, {
      oldStatus,
      newStatus: status,
    });

    // Record metric
    this.recordMetric("resources.status_change", 1, {
      type: resource.type,
      old_status: oldStatus,
      new_status: status,
    });

    return true;
  }

  private allocateResource(
    resourceId: string,
    taskId: string,
    priority: number
  ): ResourceAllocation {
    const allocationId = `alloc-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const allocation: ResourceAllocation = {
      id: allocationId,
      resourceId,
      taskId,
      allocatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.resourceTimeout),
      priority,
    };

    this.allocations.set(allocationId, allocation);

    const resource = this.resources.get(resourceId);
    if (resource) {
      resource.lastUsed = new Date();
    }

    this.logger.info(`Allocated resource: ${resourceId}`, {
      taskId,
      allocation: allocationId,
    });

    // Record metric with string tags
    this.recordMetric("resources.allocated", 1, {
      type: resource?.type || "unknown",
      priority: String(priority),
    });

    return allocation;
  }

  private findAvailableResource(
    type: string,
    requirements: Record<string, any> = {}
  ): Resource | null {
    for (const resource of this.resources.values()) {
      if (resource.type === type && resource.status === "ready") {
        // Check requirements
        let meetsRequirements = true;

        for (const [key, value] of Object.entries(requirements)) {
          if (resource.metadata[key] !== value) {
            meetsRequirements = false;
            break;
          }
        }

        if (meetsRequirements) {
          return resource;
        }
      }
    }

    return null;
  }

  private processQueue(): void {
    if (this.pendingRequests.length === 0) {
      return;
    }

    // Process requests in order of priority
    const newQueue: ResourceRequest[] = [];

    for (const request of this.pendingRequests) {
      // Try to find a resource
      const resource = this.findAvailableResource(
        request.type,
        request.requirements
      );

      if (resource) {
        // Allocate the resource
        const allocation = this.allocateResource(
          resource.id,
          request.taskId,
          request.priority
        );

        // Update resource status
        this.updateResourceStatus(resource.id, "busy");

        // Emit event
        this.emit("resource:allocated", {
          request,
          resource,
          allocation,
        });

        // Record metric
        this.recordMetric("resources.requests.fulfilled", 1, {
          type: request.type,
          wait_time: String(Date.now() - request.createdAt.getTime()),
        });
      } else {
        // Keep in queue
        newQueue.push(request);
      }
    }

    this.pendingRequests = newQueue;
  }

  private checkAllocations(): void {
    const now = Date.now();

    for (const [id, allocation] of this.allocations.entries()) {
      if (allocation.expiresAt.getTime() < now) {
        // Allocation has expired
        this.logger.warn(`Resource allocation expired: ${id}`, {
          resourceId: allocation.resourceId,
          taskId: allocation.taskId,
        });

        // Remove allocation
        this.allocations.delete(id);

        // Update resource status
        this.updateResourceStatus(allocation.resourceId, "ready");

        // Record metric
        this.recordMetric("resources.allocations.expired", 1, {});

        // Emit event
        this.emit("allocation:expired", allocation);
      }
    }
  }

  private cleanupStaleResources(): void {
    const now = Date.now();
    const staleThreshold = now - 24 * 60 * 60 * 1000; // 24 hours

    for (const [id, resource] of this.resources.entries()) {
      // Only clean up resources that are ready (not in use)
      if (
        resource.status === "ready" &&
        resource.lastUsed.getTime() < staleThreshold
      ) {
        this.logger.info(`Cleaning up stale resource: ${id}`, {
          type: resource.type,
          lastUsed: resource.lastUsed,
        });

        // Remove resource
        this.resources.delete(id);

        // Record metric
        this.recordMetric("resources.cleaned_up", 1, {
          type: resource.type,
        });

        // Emit event
        this.emit("resource:removed", resource);
      }
    }
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

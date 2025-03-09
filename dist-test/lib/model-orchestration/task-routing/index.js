"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./types"), exports);
__exportStar(require("./routing-engine"), exports);
__exportStar(require("./resource-allocator"), exports);
__exportStar(require("./load-balancer"), exports);
/**
 * Task Routing System
 *
 * This module provides a comprehensive task routing system for the model orchestration framework.
 * It includes:
 *
 * - Route Selection: Intelligent routing based on runtime capabilities, performance scoring,
 *   and adaptive routing with score decay over time.
 *
 * - Resource Management: Dynamic allocation, usage monitoring, automatic scaling,
 *   and efficient resource reclamation.
 *
 * - Load Balancing: Task distribution, node health monitoring, spike handling,
 *   and automatic rebalancing.
 *
 * Performance Targets:
 * - Route calculation: <10ms
 * - Resource allocation: <5ms
 * - Load balancing: <15ms
 * - Memory overhead: <100MB
 * - CPU utilization: <70%
 * - Cache hit rate: >80%
 *
 * Integration Points:
 * - ModelOrchestrator: For high-level task management
 * - CapabilityScorer: For runtime capability assessment
 * - HealthMonitor: For system health tracking
 * - MetricsCollector: For performance metrics gathering
 *
 * @example
 * ```typescript
 * import { RoutingEngine, ResourceAllocator, LoadBalancer } from './task-routing';
 *
 * // Initialize components
 * const routingEngine = new RoutingEngine();
 * const resourceAllocator = new ResourceAllocator();
 * const loadBalancer = new LoadBalancer();
 *
 * // Use in model orchestrator
 * class ModelOrchestrator {
 *   constructor(
 *     private routingEngine: RoutingEngine,
 *     private resourceAllocator: ResourceAllocator,
 *     private loadBalancer: LoadBalancer
 *   ) {}
 *
 *   async processTask(task: Task): Promise<void> {
 *     // Get optimal route
 *     const route = await this.routingEngine.calculateRoutes(task, availableModels);
 *
 *     // Allocate resources
 *     const allocation = await this.resourceAllocator.allocateResources(route);
 *
 *     // Balance load
 *     await this.loadBalancer.distributeLoad([task], healthyNodes);
 *   }
 * }
 * ```
 */ 
//# sourceMappingURL=index.js.map
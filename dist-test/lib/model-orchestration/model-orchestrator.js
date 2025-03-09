"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelOrchestrator = void 0;
const types_1 = require("./types");
class ModelOrchestrator {
    constructor(registry, config = {
        maxRetries: 3
    }) {
        this.registry = registry;
        this.config = config;
        this.results = [];
    }
    async handleTask(task) {
        try {
            // 1. Get model chain from registry
            const chain = await this.registry.getModelChain(task.requirements);
            // 2. Execute through chain
            const results = await this.executeChain(chain, task);
            // 3. Aggregate results into final result
            const phases = results.map(r => ({
                name: r.phase || 'execution',
                status: r.success ? 'completed' : 'failed',
                result: {
                    success: r.success,
                    output: r.output,
                    metrics: r.metrics
                }
            }));
            // Check if any fallback models were used
            const usedFallback = results.some(r => r.usedFallback);
            // Get the last successful result
            const successfulResults = results.filter(r => r.success);
            if (successfulResults.length === 0) {
                throw new Error('No successful results found');
            }
            const finalResult = successfulResults[successfulResults.length - 1];
            return {
                success: true,
                output: finalResult.output,
                phase: finalResult.phase,
                phases,
                metrics: this.aggregateMetrics(results),
                usedFallback
            };
        }
        catch (error) {
            throw new types_1.ModelOrchestratorError('Task handling failed', 'TASK_HANDLING_ERROR', { error });
        }
    }
    async executeChain(chain, task) {
        try {
            this.results = []; // Reset results for new chain execution
            // 1. Planning Phase
            const planResult = await this.executePlanningPhase(chain.planner, task);
            this.results.push(planResult);
            // 2. Context Management (if needed)
            if (chain.context) {
                const contextResult = await this.initializeContext(chain.context, {
                    task,
                    plan: planResult
                });
                this.results.push(contextResult);
            }
            // 3. Execution Phase
            let executionResult = await this.executeWithRetries(() => chain.executor.process({
                type: 'execution',
                task,
                plan: planResult.output,
                context: this.results.find(r => r.phase === 'context')?.output
            }), 'execution', chain.executor);
            // Try fallback models if primary execution failed
            if (!executionResult.success && chain.fallback?.length) {
                for (const fallbackModel of chain.fallback) {
                    try {
                        const fallbackResult = await this.executeWithRetries(() => fallbackModel.process({
                            type: 'execution',
                            task,
                            plan: planResult.output,
                            context: this.results.find(r => r.phase === 'context')?.output
                        }), 'execution', fallbackModel);
                        if (fallbackResult.success) {
                            executionResult = {
                                ...fallbackResult,
                                usedFallback: true
                            };
                            break;
                        }
                    }
                    catch (error) {
                        continue; // Try next fallback model
                    }
                }
            }
            this.results.push(executionResult);
            // 4. Review Phase (for quality tasks)
            if (executionResult.success && task.requirements?.priority === 'quality' && chain.reviewer) {
                const reviewResult = await this.executeWithRetries(() => chain.reviewer.process({
                    type: 'review',
                    task,
                    result: executionResult.output,
                    context: this.results.find(r => r.phase === 'context')?.output
                }), 'review', chain.reviewer);
                this.results.push(reviewResult);
            }
            return this.results;
        }
        catch (error) {
            throw new types_1.ModelOrchestratorError('Chain execution failed', 'CHAIN_EXECUTION_ERROR', {
                error: error instanceof Error ? error.message : 'Unknown error',
                phase: this.getCurrentPhase(),
                results: this.results.map(r => ({
                    phase: r.phase || 'execution',
                    success: r.success,
                    metrics: r.metrics
                }))
            });
        }
    }
    async executePlanningPhase(planner, task) {
        try {
            return await this.executeWithRetries(() => planner.process({
                type: 'planning',
                task
            }), 'planning', planner);
        }
        catch (error) {
            throw new types_1.ModelOrchestratorError('Planning phase failed', 'PLANNING_ERROR', { error });
        }
    }
    async initializeContext(contextManager, input) {
        try {
            return await this.executeWithRetries(() => contextManager.process({
                type: 'context',
                task: input.task,
                plan: input.plan.output
            }), 'context', contextManager);
        }
        catch (error) {
            throw new types_1.ModelOrchestratorError('Context initialization failed', 'CONTEXT_ERROR', { error });
        }
    }
    async executeWithRetries(operation, phase, model) {
        let attempts = 0;
        let lastError;
        while (attempts < this.config.maxRetries) {
            try {
                const result = await operation();
                if (!result.success) {
                    attempts++;
                    if (attempts === this.config.maxRetries) {
                        return result; // Return the failed result after all retries
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
                    continue;
                }
                const metrics = model ? await this.getMetrics(model) : {
                    executionTime: 0,
                    memoryUsed: 0,
                    tokensUsed: 0
                };
                return {
                    ...result,
                    phase,
                    metrics: {
                        ...result.metrics,
                        ...metrics
                    }
                };
            }
            catch (error) {
                lastError = error;
                attempts++;
                if (attempts === this.config.maxRetries) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
            }
        }
        throw new types_1.ModelOrchestratorError('Operation failed after retries', 'RETRY_EXHAUSTED', { attempts, error: lastError });
    }
    getCurrentPhase() {
        const phases = this.results.map(r => r.phase);
        return phases[phases.length - 1] || 'execution';
    }
    async getMetrics(model) {
        const metrics = await model.getResourceMetrics();
        const tokenStats = await model.getTokenStats();
        return {
            executionTime: metrics.averageLatency,
            memoryUsed: metrics.memoryUsage,
            tokensUsed: tokenStats.total,
            tokensProcessed: metrics.tokensProcessed,
            totalExecutionTime: metrics.totalProcessingTime,
            totalMemoryUsed: metrics.memoryUsage,
            totalTokensUsed: tokenStats.total,
            peakMemoryUsage: metrics.peakMemoryUsage
        };
    }
    aggregateMetrics(results) {
        return results.reduce((total, current) => ({
            executionTime: total.executionTime + (current.metrics?.executionTime || 0),
            memoryUsed: total.memoryUsed + (current.metrics?.memoryUsed || 0),
            tokensUsed: total.tokensUsed + (current.metrics?.tokensUsed || 0),
            tokensProcessed: (total.tokensProcessed || 0) + (current.metrics?.tokensProcessed || 0),
            totalExecutionTime: total.totalExecutionTime + (current.metrics?.executionTime || 0),
            totalMemoryUsed: total.totalMemoryUsed + (current.metrics?.memoryUsed || 0),
            totalTokensUsed: total.totalTokensUsed + (current.metrics?.tokensUsed || 0),
            peakMemoryUsage: Math.max(total.peakMemoryUsage || 0, current.metrics?.peakMemoryUsage || 0)
        }), {
            executionTime: 0,
            memoryUsed: 0,
            tokensUsed: 0,
            tokensProcessed: 0,
            totalExecutionTime: 0,
            totalMemoryUsed: 0,
            totalTokensUsed: 0,
            peakMemoryUsage: 0
        });
    }
}
exports.ModelOrchestrator = ModelOrchestrator;
//# sourceMappingURL=model-orchestrator.js.map
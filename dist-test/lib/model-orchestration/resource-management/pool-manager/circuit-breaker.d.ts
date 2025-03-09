import { CircuitBreakerConfig, CircuitBreakerState } from './types';
export declare class CircuitBreaker {
    private state;
    private config;
    constructor(config: CircuitBreakerConfig);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private isOpen;
    private onSuccess;
    private onFailure;
    getState(): CircuitBreakerState;
}

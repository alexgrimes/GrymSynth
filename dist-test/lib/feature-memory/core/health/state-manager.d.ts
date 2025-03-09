import { StateManager, HealthState, StateHistory, GuardCondition } from './types';
export declare class HealthStateManager implements StateManager {
    private readonly guardConditions;
    private readonly transitionRules;
    private readonly stateHistory;
    private _currentState;
    constructor(initialState: HealthState);
    get currentState(): HealthState;
    get history(): StateHistory;
    canTransition(from: HealthState, to: HealthState): boolean;
    transition(to: HealthState): void;
    addGuardCondition(condition: GuardCondition): void;
    private initializeTransitionRules;
    private initializeDefaultGuards;
    private getTransitionReason;
}

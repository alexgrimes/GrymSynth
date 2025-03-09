import { Task, TaskRequirements, ModelChain, TaskAnalyzer as ITaskAnalyzer } from './types';
export default class TaskAnalyzer implements ITaskAnalyzer {
    analyze(task: Task): Promise<TaskRequirements>;
    validateRequirements(requirements: TaskRequirements): boolean;
    suggestModelChain(requirements: TaskRequirements): Promise<ModelChain>;
    private inferCapability;
    private inferSecondaryCapabilities;
    private inferContextSize;
}

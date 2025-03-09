declare namespace jest {
  interface Matchers<R> {
    /**
     * Check if a number is within a given range
     * @param floor - Minimum value
     * @param ceiling - Maximum value
     */
    toBeWithinRange(floor: number, ceiling: number): R;

    /**
     * Check if a workflow has completed the expected steps
     * @param expectedSteps - Array of step IDs that should be completed
     */
    toHaveCompletedSteps(expectedSteps: string[]): R;

    /**
     * Check if a string is a valid workflow ID (UUID v4)
     */
    toBeValidWorkflowId(): R;
  }
}

export {};

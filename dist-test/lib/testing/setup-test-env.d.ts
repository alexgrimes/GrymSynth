#!/usr/bin/env node
/**
 * Setup test environment
 */
declare class TestEnvironmentSetup {
    private readonly testRoot;
    private readonly coverageDir;
    constructor();
    /**
     * Run all setup steps
     */
    setup(): Promise<boolean>;
    /**
     * Create required directories
     */
    private createDirectories;
    /**
     * Install test dependencies
     */
    private installDependencies;
    /**
     * Configure Jest for the project
     */
    private configureJest;
    /**
     * Make test scripts executable
     */
    private makeScriptsExecutable;
    /**
     * Verify setup by running a basic test
     */
    private verifySetup;
    /**
     * Run a setup step with error handling
     */
    private runStep;
    /**
     * Show next steps after setup
     */
    private showNextSteps;
    /**
     * Get Jest configuration
     */
    private getJestConfig;
}
export { TestEnvironmentSetup };

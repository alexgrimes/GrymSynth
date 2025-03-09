import { resolve } from 'path';
import { TestHarness } from './test-harness';
import { BaseServiceError } from '../../../src/services/errors';

interface TestReport {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
}

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

export class TestRunner {
  private harness: TestHarness;
  private results: TestResult[];
  private startTime: number = 0; // Initialize startTime

  constructor() {
    this.harness = new TestHarness();
    this.results = [];
  }

  async runAll(filter?: string): Promise<TestReport> {
    this.startTime = Date.now();
    this.results = [];

    try {
      await this.harness.setupEnvironment();

      // Load test files
      const testFiles = [
        './stochastic-integration.test.ts'
        // Add more test files as they're created
      ];

      for (const file of testFiles) {
        if (filter && !file.includes(filter)) {
          continue;
        }

        try {
          const testModule = await import(resolve(__dirname, file));
          await this.runTestFile(file, testModule);
        } catch (error) {
          this.results.push({
            name: `Loading ${file}`,
            status: 'failed',
            duration: 0,
            error: {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            }
          });
        }
      }

    } finally {
      await this.harness.teardown();
    }

    const duration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;

    return {
      totalTests: this.results.length,
      passed,
      failed,
      skipped,
      duration,
      results: this.results
    };
  }

  private async runTestFile(file: string, testModule: any): Promise<void> {
    const testSuite = testModule.default || testModule;

    for (const testName of Object.keys(testSuite)) {
      const testCase = testSuite[testName];

      const startTime = Date.now();
      try {
        await testCase(); // Execute test case without storing result
        this.results.push({
          name: `${file} - ${testName}`,
          status: 'passed',
          duration: Date.now() - startTime
        });
      } catch (error) {
        this.results.push({
          name: `${file} - ${testName}`,
          status: 'failed',
          duration: Date.now() - startTime,
          error: this.formatError(error)
        });
      }
    }
  }

  private formatError(error: unknown): { message: string; code?: string; stack?: string } {
    if (error instanceof BaseServiceError) {
      return {
        message: error.message,
        code: error.code,
        stack: error.stack
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack
      };
    }

    return {
      message: String(error)
    };
  }
}

if (require.main === module) {
  const runner = new TestRunner();
  runner.runAll(process.argv[2])
    .then((report) => {
      console.log('\nTest Report:');
      console.log('============');
      console.log(`Total Tests: ${report.totalTests}`);
      console.log(`Passed: ${report.passed}`);
      console.log(`Failed: ${report.failed}`);
      console.log(`Skipped: ${report.skipped}`);
      console.log(`Duration: ${report.duration}ms`);

      if (report.failed > 0) {
        console.log('\nFailures:');
        console.log('=========');
        report.results
          .filter(r => r.status === 'failed')
          .forEach(result => {
            console.log(`\n${result.name}`);
            console.log(`Error: ${result.error?.message}`);
            if (result.error?.code) {
              console.log(`Code: ${result.error.code}`);
            }
            if (result.error?.stack) {
              console.log('Stack:', result.error.stack);
            }
          });
      }

      process.exit(report.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

import type { Config } from "@jest/types";
import type { Reporter, ReporterOnStartOptions } from "@jest/reporters";
import type { Test, TestResult } from "@jest/test-result";
import PerformanceReporter from "./performance-reporter";

type ReporterConfig = [string, Record<string, any>] | string;

/**
 * Configure Jest reporters including our custom performance reporter
 */
export default function configureReporters(
  customConfig?: Partial<Config.GlobalConfig>
): Array<ReporterConfig> {
  const testResultConfig = customConfig?.testResultsProcessor
    ? typeof customConfig.testResultsProcessor === "object"
      ? customConfig.testResultsProcessor
      : {}
    : {};

  const reporterConfig = customConfig?.reporters?.[0]?.[1] || {};

  return [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "./test-results",
        outputName: "junit.xml",
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
        ancestorSeparator: " › ",
        usePathForSuiteName: true,
        ...testResultConfig,
      },
    ],
    [
      PerformanceReporter.name,
      {
        outputDirectory: "./test-results",
        includeConsoleOutput: true,
        includeStackTrace: true,
        ...reporterConfig,
      },
    ],
  ];
}

declare global {
  namespace NodeJS {
    interface Global {
      __PERFORMANCE_REPORTER__?: PerformanceReporter;
    }
  }
}

/**
 * Helper to get performance reporter instance
 */
export function getPerformanceReporter(): PerformanceReporter {
  return new PerformanceReporter();
}

/**
 * Register performance reporter with Jest
 */
export function registerPerformanceReporter(): void {
  if (typeof beforeAll === "function") {
    beforeAll(() => {
      const reporter = getPerformanceReporter();
      global.__PERFORMANCE_REPORTER__ = reporter;
    });
  }
}

/**
 * Get current test's performance reporter
 */
export function getCurrentPerformanceReporter():
  | PerformanceReporter
  | undefined {
  return global.__PERFORMANCE_REPORTER__;
}

interface TestResultWithPerf extends TestResult {
  perfStats?: Record<string, unknown>;
  performanceStats?: Record<string, unknown>;
}

/**
 * Record performance stats for current test
 */
export function recordPerformanceStats(stats: Record<string, unknown>): void {
  const currentTest = expect.getState().currentTestName;
  const reporter = getCurrentPerformanceReporter();

  if (reporter && currentTest) {
    const mockTest: Test = {
      context: {
        config: {} as any,
        hasteFS: {} as any,
        moduleMap: {} as any,
        resolver: {} as any,
      },
      path: currentTest,
    };

    const mockTestResult: TestResultWithPerf = {
      perfStats: stats,
      testResults: [
        {
          fullName: currentTest,
          status: "passed",
          title: currentTest,
          performanceStats: stats,
        },
      ],
      numFailingTests: 0,
      numPassingTests: 1,
      numPendingTests: 0,
      numTodoTests: 0,
      openHandles: [],
      snapshot: {
        added: 0,
        fileDeleted: false,
        matched: 0,
        unchecked: 0,
        uncheckedKeys: [],
        unmatched: 0,
        updated: 0,
      },
      testFilePath: currentTest,
      leaks: false,
      failureMessage: null,
    };

    reporter.onTestResult(mockTest, mockTestResult);
  }
}

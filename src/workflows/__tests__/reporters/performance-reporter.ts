import { Reporter, TestContext } from "@jest/reporters";
import { Test, TestResult } from "@jest/test-result";
import { AggregatedResult } from "@jest/test-result";
import { formatPerfStats, PerfStats } from "../perf-helpers";
import { writeFileSync } from "fs";
import { join } from "path";

interface PerformanceResult {
  testName: string;
  stats: PerfStats;
  baseline?: PerfStats;
  timestamp: Date;
}

export default class PerformanceReporter implements Reporter {
  private results: PerformanceResult[] = [];
  private startTime: number = Date.now();

  onRunStart() {
    this.startTime = Date.now();
    this.results = [];
  }

  onTestResult(_test: Test, testResult: TestResult) {
    // Extract performance results from test results
    testResult.testResults.forEach((result) => {
      if (
        result.title.includes("performance") ||
        result.ancestorTitles.includes("Performance")
      ) {
        const perfStats = this.extractPerfStats(result);
        if (perfStats) {
          this.results.push({
            testName: result.fullName,
            stats: perfStats,
            timestamp: new Date(),
          });
        }
      }
    });
  }

  onRunComplete(_contexts: Set<TestContext>, results: AggregatedResult) {
    if (this.results.length > 0) {
      this.generateReport(results);
    }
  }

  private extractPerfStats(result: any): PerfStats | null {
    try {
      // Look for performance stats in test results
      const perfData = result.performanceStats || result.perfStats;
      if (perfData) {
        return perfData as PerfStats;
      }
      return null;
    } catch (error) {
      console.error("Failed to extract performance stats:", error);
      return null;
    }
  }

  private generateReport(aggregatedResults: AggregatedResult) {
    const reportPath = join(
      process.cwd(),
      "test-results",
      "performance-report.html"
    );
    const duration = Date.now() - this.startTime;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Test Results</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-item {
      background: #fff;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test-result {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .stats-table th, .stats-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    .chart {
      margin-top: 20px;
      height: 300px;
    }
    .success { color: #0a0; }
    .failure { color: #d00; }
  </style>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
  <div class="header">
    <h1>Performance Test Results</h1>
    <p>Generated: ${new Date().toISOString()}</p>
  </div>

  <div class="summary">
    <div class="summary-item">
      <h3>Total Tests</h3>
      <p>${this.results.length}</p>
    </div>
    <div class="summary-item">
      <h3>Duration</h3>
      <p>${(duration / 1000).toFixed(2)}s</p>
    </div>
    <div class="summary-item">
      <h3>Success Rate</h3>
      <p>${(
        (aggregatedResults.numPassedTests / aggregatedResults.numTotalTests) *
        100
      ).toFixed(1)}%</p>
    </div>
  </div>

  ${this.results.map((result) => this.renderTestResult(result)).join("\n")}

  <script>
    // Create performance charts
    ${this.results.map((result) => this.generateChartScript(result)).join("\n")}
  </script>
</body>
</html>`;

    writeFileSync(reportPath, html);
    console.log(`\nPerformance report generated: ${reportPath}`);
  }

  private renderTestResult(result: PerformanceResult): string {
    return `
      <div class="test-result">
        <h3>${result.testName}</h3>
        <table class="stats-table">
          <tr>
            <th>Metric</th>
            <th>Value</th>
            ${result.baseline ? "<th>Baseline</th><th>Difference</th>" : ""}
          </tr>
          <tr>
            <td>Mean</td>
            <td>${result.stats.mean.toFixed(2)}ms</td>
            ${
              result.baseline
                ? `
              <td>${result.baseline.mean.toFixed(2)}ms</td>
              <td>${(result.stats.mean - result.baseline.mean).toFixed(
                2
              )}ms</td>
            `
                : ""
            }
          </tr>
          <tr>
            <td>Median</td>
            <td>${result.stats.median.toFixed(2)}ms</td>
            ${
              result.baseline
                ? `
              <td>${result.baseline.median.toFixed(2)}ms</td>
              <td>${(result.stats.median - result.baseline.median).toFixed(
                2
              )}ms</td>
            `
                : ""
            }
          </tr>
          <tr>
            <td>Std Dev</td>
            <td>${result.stats.stdDev.toFixed(2)}ms</td>
            ${
              result.baseline
                ? `
              <td>${result.baseline.stdDev.toFixed(2)}ms</td>
              <td>${(result.stats.stdDev - result.baseline.stdDev).toFixed(
                2
              )}ms</td>
            `
                : ""
            }
          </tr>
        </table>
        <div id="chart-${this.sanitizeId(result.testName)}" class="chart"></div>
      </div>`;
  }

  private generateChartScript(result: PerformanceResult): string {
    const chartId = `chart-${this.sanitizeId(result.testName)}`;
    return `
      Plotly.newPlot('${chartId}', [{
        y: ${JSON.stringify(result.stats.samples)},
        type: 'box',
        name: 'Current'
      }${
        result.baseline
          ? `, {
        y: ${JSON.stringify(result.baseline.samples)},
        type: 'box',
        name: 'Baseline'
      }`
          : ""
      }], {
        title: 'Performance Distribution',
        yaxis: { title: 'Time (ms)' }
      });`;
  }

  private sanitizeId(str: string): string {
    return str.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  }
}

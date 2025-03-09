#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processJestOutput = exports.generateReport = void 0;
const fs_1 = require("fs");
/**
 * Generate HTML test report
 */
function generateReport(report) {
    const passRate = ((report.passed / report.totalTests) * 100).toFixed(1);
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Error Handling Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; }
    .header { margin-bottom: 2rem; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .summary-item { 
      padding: 1rem; 
      border-radius: 4px; 
      text-align: center;
    }
    .pass { background: #e6ffe6; }
    .fail { background: #ffe6e6; }
    .test-case {
      margin-bottom: 1rem;
      padding: 1rem;
      border-radius: 4px;
    }
    .success { background: #f0fff0; }
    .error { background: #fff0f0; }
    .duration { color: #666; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Error Handling Test Report</h1>
    <p>Generated: ${report.timestamp}</p>
  </div>

  <div class="summary">
    <div class="summary-item pass">
      <h3>Pass Rate</h3>
      <div>${passRate}%</div>
    </div>
    <div class="summary-item">
      <h3>Total Tests</h3>
      <div>${report.totalTests}</div>
    </div>
    <div class="summary-item pass">
      <h3>Passed</h3>
      <div>${report.passed}</div>
    </div>
    <div class="summary-item fail">
      <h3>Failed</h3>
      <div>${report.failed}</div>
    </div>
  </div>

  <h2>Test Cases</h2>
  ${report.results.map(result => `
    <div class="test-case ${result.success ? 'success' : 'error'}">
      <h3>${result.title}</h3>
      <div class="duration">Duration: ${result.duration}ms</div>
      ${result.error ? `<div class="error">Error: ${result.error}</div>` : ''}
    </div>
  `).join('')}
</body>
</html>
  `.trim();
}
exports.generateReport = generateReport;
/**
 * Process Jest JSON output
 */
function processJestOutput(jsonPath) {
    const data = JSON.parse((0, fs_1.readFileSync)(jsonPath, 'utf-8'));
    const results = data.testResults.flatMap(suite => suite.assertionResults.map(test => ({
        success: test.status === 'passed',
        title: test.title,
        duration: test.duration || 0,
        error: test.failureMessages?.join('\n')
    })));
    return {
        timestamp: new Date().toISOString(),
        totalTests: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        duration: data.testResults.reduce((sum, suite) => sum + suite.endTime - suite.startTime, 0),
        results
    };
}
exports.processJestOutput = processJestOutput;
// Generate report if run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const jsonPath = args[0] || 'test-output.json';
    const outputPath = args[1] || 'test-report.html';
    try {
        const report = processJestOutput(jsonPath);
        const html = generateReport(report);
        (0, fs_1.writeFileSync)(outputPath, html);
        console.log(`Report generated: ${outputPath}`);
    }
    catch (error) {
        console.error('Failed to generate report:', error);
        process.exit(1);
    }
}
//# sourceMappingURL=generate-report.js.map
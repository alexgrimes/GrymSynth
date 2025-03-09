const fs = require('fs');
const path = require('path');

// Import test modules
const audioTests = require('./tests/audio-generation.test');
const promptTests = require('./tests/prompt-enhancement.test');
const integrationTests = require('./tests/integration.test');

async function runAllTests() {
    console.log('Starting XenakisLDM Test Suite');
    console.log('==============================\n');
    console.log('Environment:');
    console.log('- Node version:', process.version);
    console.log('- Working directory:', process.cwd());
    console.log('- Timestamp:', new Date().toISOString());
    console.log('\n');

    const results = {
        suites: [],
        timestamp: new Date().toISOString(),
        totals: {
            suites: 0,
            passed: 0,
            failed: 0,
            duration: 0
        }
    };

    const suites = [
        { name: 'Audio Generation', run: audioTests.runTests },
        { name: 'Prompt Enhancement', run: promptTests.runTests },
        { name: 'Integration', run: integrationTests.runTests }
    ];

    for (const suite of suites) {
        console.log(`Running ${suite.name} Tests`);
        console.log('-'.repeat(50));

        const startTime = Date.now();
        let success = false;
        let error = null;

        try {
            success = await suite.run();
        } catch (err) {
            error = err;
            console.error(`Error in ${suite.name}:`, err);
        }

        const duration = Date.now() - startTime;

        results.suites.push({
            name: suite.name,
            success,
            error: error?.message,
            duration
        });

        if (success) {
            results.totals.passed++;
        } else {
            results.totals.failed++;
        }

        results.totals.duration += duration;
        results.totals.suites++;

        console.log(`\n${suite.name} completed in ${duration}ms\n`);
    }

    // Generate summary report
    console.log('\nTest Suite Summary');
    console.log('=================');
    console.log(`Total Suites: ${results.totals.suites}`);
    console.log(`Passed: ${results.totals.passed}`);
    console.log(`Failed: ${results.totals.failed}`);
    console.log(`Total Duration: ${results.totals.duration}ms`);

    console.log('\nDetailed Results:');
    results.suites.forEach(suite => {
        const status = suite.success ? '✓ PASS' : '✗ FAIL';
        console.log(`${status} ${suite.name} (${suite.duration}ms)`);
        if (suite.error) {
            console.log(`  Error: ${suite.error}`);
        }
    });

    // Save results to file
    const outputFile = path.join(process.cwd(), 'test-results.json');
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`\nDetailed results saved to: ${outputFile}`);

    return results.totals.failed === 0;
}

// Run tests if this is the main module
if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests };

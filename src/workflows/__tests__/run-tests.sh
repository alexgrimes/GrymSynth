#!/bin/bash

# Set environment variables for testing
export NODE_ENV=test
export TEST_TIMEOUT=30000
export CONCURRENT_TESTS=4

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Workflow System Tests${NC}"
echo "=============================="

# Create test output directory if it doesn't exist
mkdir -p test-results

# Function to run a test suite with timing
run_test_suite() {
    local test_file=$1
    local suite_name=$(basename "$test_file" .test.ts)
    
    echo -e "\n${BLUE}Running $suite_name tests...${NC}"
    
    start_time=$(date +%s.%N)
    
    # Run the test suite
    jest "$test_file" --verbose --runInBand \
        --json \
        --outputFile="test-results/$suite_name.json" \
        --testTimeout=$TEST_TIMEOUT
    
    test_result=$?
    
    end_time=$(date +%s.%N)
    duration=$(echo "$end_time - $start_time" | bc)
    
    # Format duration to 2 decimal places
    duration=$(printf "%.2f" $duration)
    
    if [ $test_result -eq 0 ]; then
        echo -e "${GREEN}✓ $suite_name tests completed successfully in ${duration}s${NC}"
    else
        echo -e "${RED}✗ $suite_name tests failed in ${duration}s${NC}"
        failed_suites+=("$suite_name")
    fi
    
    return $test_result
}

# Initialize array for failed suites
declare -a failed_suites=()

# Run core workflow tests first
run_test_suite "workflow-system.test.ts"
system_result=$?

# Run error handling tests
run_test_suite "workflow-error-handling.test.ts"
error_result=$?

# Run performance tests last
if [ $system_result -eq 0 ] && [ $error_result -eq 0 ]; then
    run_test_suite "workflow-performance.test.ts"
    perf_result=$?
else
    echo -e "${RED}Skipping performance tests due to previous failures${NC}"
    perf_result=1
fi

# Generate combined test report
echo -e "\n${BLUE}Generating test report...${NC}"

# Combine JSON results
node -e "
const fs = require('fs');
const path = require('path');

const results = {};
const dir = './test-results';

fs.readdirSync(dir)
    .filter(file => file.endsWith('.json'))
    .forEach(file => {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        const suite = path.basename(file, '.json');
        results[suite] = JSON.parse(content);
    });

const summary = {
    numTotalTests: 0,
    numPassedTests: 0,
    numFailedTests: 0,
    testDuration: 0
};

Object.values(results).forEach(result => {
    summary.numTotalTests += result.numTotalTests;
    summary.numPassedTests += result.numPassedTests;
    summary.numFailedTests += result.numFailedTests;
    summary.testDuration += result.testResults.reduce((acc, r) => acc + r.duration, 0);
});

const report = {
    summary,
    results
};

fs.writeFileSync('./test-results/combined-report.json', JSON.stringify(report, null, 2));
"

# Print final summary
echo -e "\n${BLUE}Test Summary${NC}"
echo "=============================="

if [ ${#failed_suites[@]} -eq 0 ]; then
    echo -e "${GREEN}All test suites passed${NC}"
else
    echo -e "${RED}Failed test suites:${NC}"
    printf '%s\n' "${failed_suites[@]}"
fi

# Calculate total result
total_result=$(($system_result + $error_result + $perf_result))

# Clean up test results if successful and not in CI
if [ $total_result -eq 0 ] && [ -z "$CI" ]; then
    rm -rf test-results
fi

exit $total_result
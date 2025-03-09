#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting XenakisLDM verification suite...${NC}\n"

# Run unit tests
echo "Running unit tests..."
jest --config jest.config.js \
     --testMatch "**/xenakis/**/*.test.ts" \
     --verbose \
     --coverage || {
    echo -e "${RED}Unit tests failed!${NC}"
    exit 1
}
echo -e "${GREEN}Unit tests passed successfully${NC}\n"

# Run performance tests
echo "Running performance tests..."
node ./verify-performance.js || {
    echo -e "${RED}Performance tests failed!${NC}"
    exit 1
}
echo -e "${GREEN}Performance tests passed successfully${NC}\n"

# Run memory tests
echo "Running memory tests..."
NODE_OPTIONS="--max-old-space-size=4096" \
jest --config jest.config.js \
     --testMatch "**/xenakis/**/*.test.ts" \
     --runInBand \
     --detectLeaks || {
    echo -e "${RED}Memory tests failed!${NC}"
    exit 1
}
echo -e "${GREEN}Memory tests passed successfully${NC}\n"

# Generate test report
echo "Generating test report..."
jest --config jest.config.js \
     --testMatch "**/xenakis/**/*.test.ts" \
     --json \
     --outputFile=./test-report.json

# Print summary
echo -e "${YELLOW}Test Summary:${NC}"
echo "----------------------------------------"
echo "Unit Tests: ✅"
echo "Performance Tests: ✅"
echo "Memory Tests: ✅"
echo "Test Report: ./test-report.json"
echo "----------------------------------------"

echo -e "${GREEN}All verification tests completed successfully!${NC}"

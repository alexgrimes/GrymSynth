#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
COVERAGE=false
FILTER=""
VERBOSE=false
FAIL_FAST=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --coverage) COVERAGE=true ;;
        --filter) FILTER="$2"; shift ;;
        --verbose|-v) VERBOSE=true ;;
        --fail-fast) FAIL_FAST=true ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --coverage     Run tests with coverage reporting"
            echo "  --filter TEXT  Only run tests matching TEXT"
            echo "  --verbose, -v  Show detailed test output"
            echo "  --fail-fast    Stop on first test failure"
            echo "  --help, -h     Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# Ensure we're in the right directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Setup test environment
echo -e "${BLUE}Setting up test environment...${NC}"
echo -e "${BLUE}===================${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Clean up any previous test artifacts
rm -rf coverage
rm -rf .nyc_output

# Compile TypeScript files
echo -e "${BLUE}Compiling TypeScript...${NC}"
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo -e "${RED}TypeScript compilation failed${NC}"
    exit 1
fi

# Build test command
TEST_CMD="npx ts-node"

if [ "$COVERAGE" = true ]; then
    TEST_CMD="npx nyc --reporter=text --reporter=html $TEST_CMD"
fi

TEST_CMD="$TEST_CMD test-runner.ts"

if [ ! -z "$FILTER" ]; then
    TEST_CMD="$TEST_CMD \"$FILTER\""
fi

# Run tests
echo -e "${BLUE}Running tests...${NC}"
echo -e "${BLUE}==============${NC}"

if [ "$VERBOSE" = true ]; then
    eval $TEST_CMD
else
    eval $TEST_CMD | grep -v "^[[:space:]]*$" # Filter empty lines for cleaner output
fi

TEST_EXIT_CODE=${PIPESTATUS[0]}

# Process test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
else
    echo -e "${RED}Tests failed${NC}"
fi

# Generate coverage report if requested
if [ "$COVERAGE" = true ]; then
    echo -e "\n${BLUE}Coverage Report${NC}"
    echo -e "${BLUE}===============${NC}"

    if [ -d "coverage" ]; then
        echo -e "${GREEN}Coverage report generated in ./coverage/index.html${NC}"
    else
        echo -e "${RED}Coverage report generation failed${NC}"
    fi
fi

# Set exit status based on test results
exit $TEST_EXIT_CODE

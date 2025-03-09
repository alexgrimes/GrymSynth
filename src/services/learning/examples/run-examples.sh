#!/bin/bash

# Text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Pattern Learning System Examples${NC}\n"

# Create required directories
echo "Setting up directories..."
mkdir -p data/vector-index data/patterns data/feedback

# Function to check if last command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Verify setup first
echo -e "\n${BLUE}Step 1: Verifying system setup...${NC}"
npx ts-node src/services/learning/examples/verify-setup.ts
if ! check_status; then
    echo -e "\n${RED}Setup verification failed. Please fix the issues before running examples.${NC}"
    exit 1
fi

# Run the main example
echo -e "\n${BLUE}Step 2: Running pattern learning demo...${NC}"
npx ts-node src/services/learning/examples/pattern-learning-demo.ts
if ! check_status; then
    echo -e "\n${RED}Pattern learning demo failed.${NC}"
    exit 1
fi

echo -e "\n${GREEN}All examples completed successfully!${NC}"
echo -e "\nTo learn more about the pattern learning system, check out:"
echo "- src/services/learning/README.md"
echo "- src/services/learning/examples/README.md"

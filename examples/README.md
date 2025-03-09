# Audio Learning Hub Examples

This directory contains examples demonstrating how to use the Audio Learning Hub library.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Running Examples

### Basic Usage Example
Demonstrates core functionality including:
- Pattern creation and storage
- Relationship discovery
- Pattern retrieval
- Context-based queries

Run the example:
```bash
npm start
```

Run with debugging enabled:
```bash
npm run debug
```

## Example Structure

- `basic-usage.ts` - Core functionality demonstration
- `run-example.ts` - Example runner script
- `package.json` - Example-specific dependencies and scripts
- `tsconfig.json` - TypeScript configuration for examples

## Data Storage

Examples store their data in `../data/examples/vectors`. This directory is automatically created when running examples.

## Available Scripts

- `npm start` - Run the basic example
- `npm run build` - Build the examples
- `npm run clean` - Clean the build directory
- `npm run debug` - Run with debugging enabled

## Environment Variables

- `NODE_ENV=development` - Enable additional debugging features
- `DEBUG=1` - Enable verbose logging

## Requirements

- Node.js >= 16.0.0
- TypeScript >= 5.2.0
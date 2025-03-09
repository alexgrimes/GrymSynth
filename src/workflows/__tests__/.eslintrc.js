module.exports = {
  root: true,
  extends: [
    '../../.eslintrc.js',
    'plugin:jest/recommended',
    'plugin:jest/style'
  ],
  plugins: ['jest'],
  env: {
    'jest/globals': true,
    node: true
  },
  rules: {
    // Jest specific rules
    'jest/expect-expect': 'error',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/no-test-prefixes': 'error',
    'jest/prefer-to-be': 'error',
    'jest/prefer-to-contain': 'error',
    'jest/prefer-to-have-length': 'error',
    'jest/valid-expect': 'error',
    'jest/no-jest-import': 'error',

    // Test-specific overrides
    'max-lines-per-function': ['warn', { 
      max: 200,
      skipBlankLines: true,
      skipComments: true
    }],
    'max-nested-callbacks': ['warn', 4],
    
    // Allow certain practices in tests
    'no-magic-numbers': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    
    // Enforce testing best practices
    'jest/consistent-test-it': ['error', {
      fn: 'it',
      withinDescribe: 'it'
    }],
    'jest/prefer-strict-equal': 'error',
    'jest/require-top-level-describe': 'error',
    'jest/valid-title': [
      'error',
      {
        mustMatch: {
          it: ['^should ', '^when ', '^with '],
          describe: ['^[A-Z]']
        }
      }
    ],

    // Custom rules for test organization
    'jest/prefer-expect-assertions': [
      'warn',
      { onlyFunctionsWithAsyncKeyword: true }
    ],
    'jest/require-hook': [
      'error',
      {
        allowedFunctionCalls: ['beforeAll', 'beforeEach', 'afterAll', 'afterEach']
      }
    ],
    
    // Enforce clean up
    'jest/no-test-return-statement': 'error',
    
    // Performance considerations
    'jest/no-large-snapshots': ['warn', { maxSize: 50 }],
    
    // Documentation
    'jest/prefer-lowercase-title': [
      'error',
      { ignore: ['describe'] }
    ]
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true }
        ]
      }
    },
    {
      files: ['test-helpers.ts', 'mocks.ts'],
      rules: {
        'max-lines': 'off',
        'max-lines-per-function': 'off'
      }
    }
  ],
  settings: {
    jest: {
      version: 29
    }
  }
};
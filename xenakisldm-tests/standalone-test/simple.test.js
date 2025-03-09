const { test } = require('@jest/globals');

test('basic test', () => {
  console.log('Test is running');
  if (1 !== 1) {
    throw new Error('1 should equal 1');
  }
});

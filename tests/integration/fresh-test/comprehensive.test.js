// Test suite with various types of tests
describe('Comprehensive Test Suite', () => {
    // Setup and teardown
    beforeAll(() => {
        console.log('Test suite starting');
    });

    afterAll(() => {
        console.log('Test suite completed');
    });

    beforeEach(() => {
        // Reset any state before each test
    });

    // Basic assertions
    test('basic arithmetic', () => {
        expect(1 + 1).toBe(2);
        expect(2 * 3).toBe(6);
        expect(10 - 5).toBe(5);
    });

    // Array testing
    test('array operations', () => {
        const arr = [1, 2, 3];
        expect(arr).toHaveLength(3);
        expect(arr).toContain(2);
        expect(arr).not.toContain(4);
    });

    // Object testing
    test('object properties', () => {
        const obj = { name: 'test', value: 42 };
        expect(obj).toHaveProperty('name');
        expect(obj.name).toBe('test');
        expect(obj.value).toBeGreaterThan(40);
    });

    // Async testing
    test('async operations', async () => {
        const result = await Promise.resolve(42);
        expect(result).toBe(42);
    });

    // Exception testing
    test('throwing errors', () => {
        expect(() => {
            throw new Error('test error');
        }).toThrow('test error');
    });

    // Truthiness
    test('truthy and falsy', () => {
        expect(true).toBeTruthy();
        expect(false).toBeFalsy();
        expect(null).toBeNull();
        expect(undefined).toBeUndefined();
    });

    // Number comparisons
    test('number comparisons', () => {
        expect(5).toBeGreaterThan(3);
        expect(3).toBeLessThan(5);
        expect(5.5).toBeCloseTo(5.51, 1);
    });

    // String matching
    test('string patterns', () => {
        expect('hello world').toMatch(/world/);
        expect('test string').toContain('test');
    });
});

describe('Basic Test Suite', () => {
    it('should pass a simple assertion', () => {
        expect(1 + 1).toBe(2);
    });

    it('should work with arrays', () => {
        const arr = [1, 2, 3];
        expect(arr).toHaveLength(3);
        expect(arr).toContain(2);
    });

    it('should handle async code', async () => {
        const result = await Promise.resolve(42);
        expect(result).toBe(42);
    });

    it('should work with objects', () => {
        const obj = { name: 'test', value: 123 };
        expect(obj).toHaveProperty('name', 'test');
        expect(obj.value).toBe(123);
    });
});

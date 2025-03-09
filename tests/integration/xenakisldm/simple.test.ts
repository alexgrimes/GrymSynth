describe('Simple Test', () => {
    it('should pass a basic test', () => {
        expect(true).toBe(true);
    });

    it('should handle basic math', () => {
        expect(1 + 1).toBe(2);
    });

    it('should work with arrays', () => {
        const arr = [1, 2, 3];
        expect(arr).toHaveLength(3);
        expect(arr).toContain(2);
    });
});

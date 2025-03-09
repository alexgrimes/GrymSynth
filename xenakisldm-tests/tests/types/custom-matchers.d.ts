declare global {
  namespace jest {
    interface AsymmetricMatchers {
      toBeWithinRange(floor: number, ceiling: number): void;
      toHaveValidAudioFormat(): void;
    }

    interface Matchers<R, T = {}> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidAudioFormat(): R;
    }

    interface Expect {
      toBeWithinRange(floor: number, ceiling: number): void;
      toHaveValidAudioFormat(): void;
    }
  }
}

export {};

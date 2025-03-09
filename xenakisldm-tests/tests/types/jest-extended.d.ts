/// <reference types="jest" />

declare namespace jest {
  // Extend the Expect interface
  interface Expect {
    toBeWithinRange(floor: number, ceiling: number): void;
    toHaveValidAudioFormat(): void;
  }

  // Extend the Matchers interface
  interface Matchers<R, T = {}> {
    toBeWithinRange(floor: number, ceiling: number): R;
    toHaveValidAudioFormat(): R;
  }

  // Extend the InverseAsymmetricMatchers interface
  interface InverseAsymmetricMatchers {
    toBeWithinRange(floor: number, ceiling: number): void;
    toHaveValidAudioFormat(): void;
  }

  // Extend the AsymmetricMatchers interface
  interface AsymmetricMatchers {
    toBeWithinRange(floor: number, ceiling: number): void;
    toHaveValidAudioFormat(): void;
  }
}

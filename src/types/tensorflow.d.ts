declare module '@tensorflow/tfjs' {
  export interface LayersModel {
    compile(config: ModelCompileConfig): void;
    fit(
      x: Tensor | Tensor[],
      y: Tensor | Tensor[],
      config?: ModelFitConfig
    ): Promise<History>;
    evaluate(
      x: Tensor | Tensor[],
      y: Tensor | Tensor[]
    ): Promise<Scalar | Scalar[]>;
    predict(x: Tensor | Tensor[]): Tensor | Tensor[];
    save(path: string): Promise<SaveResult>;
    getWeights(): Tensor[];
  }

  export interface ModelCompileConfig {
    optimizer: string | Optimizer;
    loss: string | Loss;
    metrics?: string[];
  }

  export interface ModelFitConfig {
    epochs?: number;
    batchSize?: number;
    validationSplit?: number;
    callbacks?: CallbackConfig[];
  }

  export interface History {
    history: {
      loss: number[];
      acc: number[];
      val_loss?: number[];
      val_acc?: number[];
    };
  }

  export interface Logs {
    loss: number;
    acc: number;
    val_loss?: number;
    val_acc?: number;
  }

  export interface CallbackConfig {
    onEpochEnd?: (epoch: number, logs: Logs) => Promise<void>;
  }

  export interface Tensor {
    dataSync(): Float32Array;
    data(): Promise<Float32Array>;
    dispose(): void;
    clone(): Tensor;
    mean(): Scalar;
    sub(other: Tensor): Tensor;
    mul(other: Tensor): Tensor;
    div(other: Tensor): Tensor;
    square(): Tensor;
    sqrt(): Tensor;
    slice(begin: number[], size: number[]): Tensor;
    reshape(shape: number[]): Tensor;
    scatter(indices: Tensor, updates: Tensor): Tensor;
    greater(threshold: number): Tensor;
    shape: number[];
    size: number;
    dtype: string;
  }

  export interface Scalar extends Tensor {
    dataSync(): Float32Array;
    shape: [];
  }

  export interface Tensor2D extends Tensor {
    shape: [number, number];
    scatter(indices: Tensor2D, updates: Tensor): Tensor2D;
  }

  export interface Tensor1D extends Tensor {
    shape: [number];
  }

  export interface SaveResult {
    modelTopology: any;
    weightSpecs: any[];
    weightData: ArrayBuffer;
  }

  export interface Optimizer {
    applyGradients(variableGradients: NamedTensorMap): void;
  }

  export interface Loss {
    computeGradients(y: Tensor, yPred: Tensor): {
      value: Scalar;
      grads: Tensor;
    };
  }

  export interface NamedTensorMap {
    [name: string]: Tensor;
  }

  export const sequential: (config?: {
    layers?: Layer[];
  }) => LayersModel;

  export const layers: {
    dense: (config: {
      units: number;
      activation?: string;
      inputShape?: number[];
    }) => Layer;
    dropout: (config: { rate: number }) => Layer;
  };

  export const train: {
    adam: (learningRate?: number) => Optimizer;
  };

  export const callbacks: {
    earlyStopping: (config: {
      monitor: string;
      patience: number;
    }) => CallbackConfig;
  };

  export const tensor2d: (
    data: number[][] | number[],
    shape?: [number, number]
  ) => Tensor2D;

  export const tensor1d: (data: number[]) => Tensor1D;

  export const range: (start: number, stop: number) => Tensor1D;

  export const tidy: <T>(fn: () => T) => T;

  export const loadLayersModel: (path: string) => Promise<LayersModel>;

  export interface Layer {
    apply(inputs: Tensor | Tensor[]): Tensor | Tensor[];
  }

  export function memory(): {
    numBytes: number;
    numTensors: number;
    numDataBuffers: number;
    unreliable: boolean;
  };
}
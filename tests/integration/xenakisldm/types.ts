export interface AudioGenerationResult {
  audioBuffer: AudioBuffer;
  metadata: {
    generationTime: number;
    model: string;
    parameters: GenerationParameters;
    timestamp: number;
  };
}

export interface GenerationParameters {
  prompt: string;
  duration: number;
  parameters?: {
    [key: string]: any;
  };
}

export interface AudioProcessingMetadata {
  generationTime: number;
  model: string;
  parameters: GenerationParameters;
  timestamp: number;
}

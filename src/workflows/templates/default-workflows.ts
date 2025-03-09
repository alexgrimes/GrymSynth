import { v4 as uuidv4 } from "uuid";
import { Workflow } from "../types";

export function createAudioEnhancementWorkflow(
  name: string = "Audio Enhancement"
): Workflow {
  return {
    id: uuidv4(),
    name,
    description:
      "Analyze audio, detect patterns, and generate enhanced version",
    initialStep: "analyze-audio",
    steps: {
      "analyze-audio": {
        id: "analyze-audio",
        type: "analysis",
        operation: "patterns",
        inputs: [
          {
            source: "parameter",
            key: "audioFile",
          },
        ],
        parameters: {},
        nextSteps: {
          default: "extract-features",
        },
      },
      "extract-features": {
        id: "extract-features",
        type: "analysis",
        operation: "features",
        inputs: [
          {
            source: "parameter",
            key: "audioFile",
          },
        ],
        parameters: {},
        nextSteps: {
          default: "generate-enhanced",
        },
      },
      "generate-enhanced": {
        id: "generate-enhanced",
        type: "generation",
        operation: "enhance",
        inputs: [
          {
            source: "previous_step",
            key: "analyze-audio.result",
          },
          {
            source: "previous_step",
            key: "extract-features.result",
          },
        ],
        parameters: {
          enhancementLevel: 0.5,
          preserveOriginalCharacteristics: true,
        },
        nextSteps: {
          default: "evaluate-result",
        },
      },
      "evaluate-result": {
        id: "evaluate-result",
        type: "analysis",
        operation: "compare",
        inputs: [
          {
            source: "parameter",
            key: "audioFile",
          },
          {
            source: "previous_step",
            key: "generate-enhanced.result",
          },
        ],
        parameters: {},
        condition: {
          operator: "greater_than",
          leftOperand: "result.qualityScore",
          rightOperand: 0.8,
        },
        nextSteps: {
          conditional: [
            {
              condition: "true",
              stepId: "finalize",
            },
            {
              condition: "false",
              stepId: "regenerate",
            },
          ],
        },
      },
      regenerate: {
        id: "regenerate",
        type: "generation",
        operation: "enhance",
        inputs: [
          {
            source: "previous_step",
            key: "analyze-audio.result",
          },
          {
            source: "previous_step",
            key: "extract-features.result",
          },
          {
            source: "previous_step",
            key: "evaluate-result.result",
          },
        ],
        parameters: {
          enhancementLevel: 0.7,
          preserveOriginalCharacteristics: true,
        },
        nextSteps: {
          default: "evaluate-result",
        },
      },
      finalize: {
        id: "finalize",
        type: "transformation",
        operation: "export",
        inputs: [
          {
            source: "previous_step",
            key: "generate-enhanced.result",
          },
        ],
        parameters: {
          format: "wav",
          sampleRate: 44100,
          bitDepth: 16,
        },
        nextSteps: {},
      },
    },
    parameters: {
      audioFile: null,
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
      version: "1.0.0",
    },
  };
}

export function createAudioTranscriptionWorkflow(
  name: string = "Audio Transcription"
): Workflow {
  return {
    id: uuidv4(),
    name,
    description: "Transcribe audio to text with detailed analysis",
    initialStep: "transcribe-audio",
    steps: {
      "transcribe-audio": {
        id: "transcribe-audio",
        type: "analysis",
        operation: "transcription",
        inputs: [
          {
            source: "parameter",
            key: "audioFile",
          },
        ],
        parameters: {
          language: "en",
        },
        nextSteps: {
          default: "extract-keywords",
        },
      },
      "extract-keywords": {
        id: "extract-keywords",
        type: "analysis",
        operation: "keywords",
        inputs: [
          {
            source: "previous_step",
            key: "transcribe-audio.result",
          },
        ],
        parameters: {
          maxKeywords: 10,
        },
        nextSteps: {
          default: "finalize-transcription",
        },
      },
      "finalize-transcription": {
        id: "finalize-transcription",
        type: "transformation",
        operation: "export",
        inputs: [
          {
            source: "previous_step",
            key: "transcribe-audio.result",
          },
          {
            source: "previous_step",
            key: "extract-keywords.result",
          },
        ],
        parameters: {
          format: "json",
          includeTimestamps: true,
        },
        nextSteps: {},
      },
    },
    parameters: {
      audioFile: null,
      language: "en",
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
      version: "1.0.0",
    },
  };
}

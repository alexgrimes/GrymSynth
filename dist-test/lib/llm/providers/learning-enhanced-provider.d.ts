import { LLMProvider } from '../types';
import { ModelSpecialization } from '../../learning-profiles';
/**
 * Wraps an LLM provider with learning profile capabilities
 */
export declare function createLearningEnhancedProvider(provider: LLMProvider, modelId: string, specialization: ModelSpecialization): LLMProvider;
/**
 * Helper to create a learning-enhanced Ollama provider
 */
export declare function createLearningEnhancedOllamaProvider(modelName: string, specialization?: ModelSpecialization): LLMProvider;
/**
 * Helper to create a learning-enhanced LM Studio provider
 */
export declare function createLearningEnhancedLMStudioProvider(modelName: string, specialization?: ModelSpecialization): LLMProvider;

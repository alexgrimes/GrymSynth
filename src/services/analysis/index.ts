// Main service
export { AdvancedPatternAnalysisService } from './AdvancedPatternAnalysisService';

// Analyzers
export { SpectromorphologicalAnalyzer, type SpectromorphologicalAnalysisResult, MotionType, OnsetType, ContinuantType, TerminationType } from './analyzers/SpectromorphologicalAnalyzer';
export { MicrosoundAnalyzer, type MicrosoundAnalysisResult, TimeScale, type GrainProperties, type GrainCloud } from './analyzers/MicrosoundAnalyzer';
export { LanguageGridAnalyzer, type LanguageGridAnalysisResult, DiscourseType, SyntaxType, type ReferentialQuality, type LanguageGridPosition } from './analyzers/LanguageGridAnalyzer';
export { CrossPatternAnalyzer, type CrossPatternAnalysisResult, type PatternRelationship, type PatternEvolutionChain, type SharedMotif } from './analyzers/CrossPatternAnalyzer';
export { IntegratedPatternAnalyzer, type IntegratedAnalysisResult } from './analyzers/IntegratedPatternAnalyzer';

// Types
export { type AudioPattern, type AnalysisConfig, type AnalysisError, type AnalysisResult } from './types/audio';

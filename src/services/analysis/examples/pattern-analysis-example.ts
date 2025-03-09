import { AdvancedPatternAnalysisService } from '../';
import { PatternRepository, PatternRepositoryConfig } from '../../storage/PatternRepository';
import { HealthMonitor } from '../../monitoring/HealthMonitor';
import { FeatureVectorDatabase, VectorDatabaseConfig } from '../../storage/FeatureVectorDatabase';
import { AnalysisConfig } from '../types/audio';

async function createVectorDatabase(healthMonitor: HealthMonitor): Promise<FeatureVectorDatabase> {
  const config: VectorDatabaseConfig = {
    indexPath: './data/vector-index',
    dimensions: 128, // Typical feature vector size
    distanceMetric: 'cosine',
    persistIndexOnDisk: true
  };

  const vectorDb = new FeatureVectorDatabase(config, healthMonitor);
  await vectorDb.initialize();
  return vectorDb;
}

async function runPatternAnalysisExample() {
  // Initialize monitoring
  const healthMonitor = new HealthMonitor();

  // Initialize vector database
  const vectorDb = await createVectorDatabase(healthMonitor);

  // Configure pattern repository
  const repositoryConfig: PatternRepositoryConfig = {
    vectorDimensions: 128,
    similarityThreshold: 0.8,
    maxQueryResults: 100
  };

  // Initialize repository with vector database
  const repository = new PatternRepository(
    vectorDb,
    healthMonitor,
    repositoryConfig
  );

  // Initialize the analysis service
  const analysisService = await AdvancedPatternAnalysisService.setup(
    repository,
    healthMonitor
  );

  try {
    // Example 1: Analyze a single pattern
    console.log('\n=== Example 1: Single Pattern Analysis ===');
    const singleAnalysis = await analysisService.analyzePattern('pattern-1');
    console.log('Pattern Analysis Result:');
    console.log('- Motion Types:', singleAnalysis.spectromorphology.motionTypes);
    console.log('- Texture Type:', singleAnalysis.microsound.textureType);
    console.log('- Grid Position:', singleAnalysis.languageGrid.gridPosition);
    console.log('- Overall Confidence:', singleAnalysis.confidence);

    // Example 2: Analyze relationships between patterns
    console.log('\n=== Example 2: Cross-Pattern Analysis ===');
    const relationshipAnalysis = await analysisService.analyzePatternRelationships([
      'pattern-1',
      'pattern-2',
      'pattern-3'
    ]);
    console.log('Pattern Relationships:');
    relationshipAnalysis.patternRelationships.forEach(rel => {
      console.log(`- ${rel.sourcePatternId} -> ${rel.targetPatternId}: ${rel.relationshipType} (${rel.strength})`);
    });

    // Example 3: Get specific analysis types
    console.log('\n=== Example 3: Specific Analysis Types ===');

    // Spectromorphological analysis
    const spectroAnalysis = await analysisService.getSpectromorphologicalAnalysis('pattern-1');
    console.log('Spectromorphological Analysis:');
    console.log('- Onset:', spectroAnalysis.onset.type);
    console.log('- Motion:', spectroAnalysis.motionTypes[0]?.type);
    console.log('- Gesture-Texture Balance:', spectroAnalysis.gestureTextureBalance);

    // Microsound analysis
    const microAnalysis = await analysisService.getMicrosoundAnalysis('pattern-1');
    console.log('\nMicrosound Analysis:');
    console.log('- Time Scales:', microAnalysis.dominantTimeScales);
    console.log('- Texture Type:', microAnalysis.textureType);
    console.log('- Grain Count:', microAnalysis.particleStatistics.count);

    // Language grid analysis
    const gridAnalysis = await analysisService.getLanguageGridAnalysis('pattern-1');
    console.log('\nLanguage Grid Analysis:');
    console.log('- Discourse Type:', gridAnalysis.gridPosition.discourse);
    console.log('- Syntax Type:', gridAnalysis.gridPosition.syntax);
    console.log('- Compositional Strategy:', gridAnalysis.compositionalStrategy);

  } catch (error) {
    console.error('Error in pattern analysis:', error);
  }
}

// Configuration for detailed analysis
const analysisConfig: AnalysisConfig = {
  detailLevel: 'detailed' as const,
  includeConfidenceScores: true,
  timeRange: {
    start: 0,
    end: 10 // seconds
  },
  frequencyRange: {
    low: 20,    // Hz
    high: 20000 // Hz
  }
};

// Example usage with detailed configuration
async function runDetailedAnalysis() {
  // Initialize monitoring
  const healthMonitor = new HealthMonitor();

  // Initialize vector database
  const vectorDb = await createVectorDatabase(healthMonitor);

  // Configure pattern repository
  const repositoryConfig: PatternRepositoryConfig = {
    vectorDimensions: 128,
    similarityThreshold: 0.8,
    maxQueryResults: 100
  };

  // Initialize repository
  const repository = new PatternRepository(
    vectorDb,
    healthMonitor,
    repositoryConfig
  );

  const analysisService = await AdvancedPatternAnalysisService.setup(
    repository,
    healthMonitor
  );

  console.log('\n=== Detailed Pattern Analysis ===');
  const analysis = await analysisService.analyzePattern('pattern-1', analysisConfig);

  console.log('Detailed Analysis Results:');
  console.log('Spectromorphological Features:');
  console.log('- Motion Types:', analysis.spectromorphology.motionTypes);
  console.log('- Energy Profile:', analysis.spectromorphology.energyProfile);

  console.log('\nMicrosound Features:');
  console.log('- Grain Properties:', analysis.microsound.grainProperties);
  console.log('- Cloud Count:', analysis.microsound.clouds.length);

  console.log('\nLanguage Grid Features:');
  console.log('- Referential Qualities:', analysis.languageGrid.referentialQualities);
  console.log('- Abstract Properties:', analysis.languageGrid.abstractProperties);
}

// Export examples for use in documentation and testing
export const examples = {
  basic: runPatternAnalysisExample,
  detailed: runDetailedAnalysis
};

// Run examples if file is executed directly
if (require.main === module) {
  Promise.all([
    runPatternAnalysisExample(),
    runDetailedAnalysis()
  ]).catch(error => {
    console.error('Error running examples:', error);
    process.exit(1);
  });
}

const { XenakisLDMServiceFactory } = require('../XenakisLDMServiceFactory');
const { testConfigs } = require('./test-helpers');

const PERFORMANCE_THRESHOLDS = {
  maxInitializationTime: 2000, // ms
  maxGenerationTime: 1000, // ms per second of audio
  maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
  maxCpuUsage: 80 // percentage
};

async function runPerformanceTests() {
  console.log('Running XenakisLDM performance tests...\n');
  let service;

  try {
    // Test initialization performance
    console.log('Testing initialization performance...');
    const initStart = performance.now();
    service = await XenakisLDMServiceFactory.createService({
      maxMemory: '4GB',
      useWebAssembly: true,
      parameterPrecision: 0.001,
      cachingEnabled: true,
      maxParallelGenerators: 4
    });
    const initTime = performance.now() - initStart;

    if (initTime > PERFORMANCE_THRESHOLDS.maxInitializationTime) {
      throw new Error(`Initialization took ${initTime}ms, exceeding threshold of ${PERFORMANCE_THRESHOLDS.maxInitializationTime}ms`);
    }
    console.log(`✓ Initialization completed in ${initTime}ms`);

    // Test generation performance for each generator type
    const generatorTypes = Object.keys(testConfigs);
    for (const type of generatorTypes) {
      console.log(`\nTesting ${type} generator performance...`);
      await testGeneratorPerformance(service, type);
    }

    // Test memory usage under load
    console.log('\nTesting memory usage under load...');
    const memoryUsage = await testMemoryUsage(service);
    if (memoryUsage > PERFORMANCE_THRESHOLDS.maxMemoryUsage) {
      throw new Error(`Memory usage ${memoryUsage} bytes exceeds threshold of ${PERFORMANCE_THRESHOLDS.maxMemoryUsage} bytes`);
    }
    console.log(`✓ Memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);

    // Test CPU usage under load
    console.log('\nTesting CPU usage under load...');
    const cpuUsage = await testCpuUsage(service);
    if (cpuUsage > PERFORMANCE_THRESHOLDS.maxCpuUsage) {
      throw new Error(`CPU usage ${cpuUsage}% exceeds threshold of ${PERFORMANCE_THRESHOLDS.maxCpuUsage}%`);
    }
    console.log(`✓ CPU usage: ${cpuUsage.toFixed(2)}%`);

    console.log('\n✓ All performance tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Performance test failed:', error.message);
    process.exit(1);
  } finally {
    if (service) {
      await XenakisLDMServiceFactory.destroyInstance();
    }
  }
}

async function testGeneratorPerformance(service, type) {
  const config = testConfigs[type];
  const task = {
    id: `perf-test-${type}`,
    type: 'xenakis-generation',
    modelType: 'xenakis',
    priority: 'normal',
    data: {
      parameters: {
        prompt: `Performance test for ${type} generator`,
        mathematical: {
          [type]: config
        },
        mapping: []
      }
    }
  };

  const startTime = performance.now();
  const result = await service.executeTask(task);
  const generateTime = performance.now() - startTime;

  const threshold = PERFORMANCE_THRESHOLDS.maxGenerationTime * config.duration;
  if (generateTime > threshold) {
    throw new Error(`${type} generation took ${generateTime}ms, exceeding threshold of ${threshold}ms`);
  }
  console.log(`✓ ${type} generation completed in ${generateTime}ms`);
  return result;
}

async function testMemoryUsage(service) {
  // Generate with all generator types simultaneously
  const tasks = Object.entries(testConfigs).map(([type, config]) => ({
    id: `memory-test-${type}`,
    type: 'xenakis-generation',
    modelType: 'xenakis',
    priority: 'normal',
    data: {
      parameters: {
        prompt: `Memory test for ${type} generator`,
        mathematical: {
          [type]: config
        },
        mapping: []
      }
    }
  }));

  const startHeapUsed = process.memoryUsage().heapUsed;
  await Promise.all(tasks.map(task => service.executeTask(task)));
  const endHeapUsed = process.memoryUsage().heapUsed;

  return endHeapUsed - startHeapUsed;
}

async function testCpuUsage(service) {
  const startUsage = process.cpuUsage();

  // Generate with all generator types in sequence
  for (const [type, config] of Object.entries(testConfigs)) {
    await service.executeTask({
      id: `cpu-test-${type}`,
      type: 'xenakis-generation',
      modelType: 'xenakis',
      priority: 'normal',
      data: {
        parameters: {
          prompt: `CPU test for ${type} generator`,
          mathematical: {
            [type]: config
          },
          mapping: []
        }
      }
    });
  }

  const endUsage = process.cpuUsage(startUsage);
  const totalUsage = (endUsage.user + endUsage.system) / 1000; // Convert to ms
  const duration = Object.values(testConfigs).reduce((sum, config) => sum + config.duration, 0);

  return (totalUsage / (duration * 1000)) * 100; // Convert to percentage
}

// Run the performance tests
runPerformanceTests().catch(error => {
  console.error('Performance test runner failed:', error);
  process.exit(1);
});

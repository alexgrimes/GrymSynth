const fs = require('fs').promises;
const path = require('path');

async function cleanupTestResources() {
  const testResourceDirs = [
    'test-results',
    'coverage',
    '.nyc_output'
  ];

  const testFiles = [
    'junit.xml',
    'coverage.json',
    'test-report.html'
  ];

  console.log('Cleaning up test resources...');

  // Clean up directories
  for (const dir of testResourceDirs) {
    try {
      await fs.rmdir(dir, { recursive: true });
      console.log(`✓ Removed directory: ${dir}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error removing directory ${dir}:`, error);
      }
    }
  }

  // Clean up files
  for (const file of testFiles) {
    try {
      await fs.unlink(file);
      console.log(`✓ Removed file: ${file}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error removing file ${file}:`, error);
      }
    }
  }

  // Clean up temporary audio files
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    const files = await fs.readdir(tempDir);
    
    for (const file of files) {
      if (file.startsWith('test-') && file.endsWith('.wav')) {
        await fs.unlink(path.join(tempDir, file));
        console.log(`✓ Removed temporary audio file: ${file}`);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error cleaning up temporary audio files:', error);
    }
  }

  // Reset any mock database state
  try {
    const mockDbPath = path.join(process.cwd(), 'src/workflows/__tests__/mock-data');
    await fs.writeFile(path.join(mockDbPath, 'workflow-state.json'), '{}');
    console.log('✓ Reset mock database state');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error resetting mock database:', error);
    }
  }

  console.log('Cleanup complete!');
}

// Run cleanup if script is executed directly
if (require.main === module) {
  cleanupTestResources().catch(error => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
}

module.exports = cleanupTestResources;
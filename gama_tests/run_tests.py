#!/usr/bin/env python
import os
import sys
import time
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

from test_scripts.test_setup import test_setup
from test_scripts.test_cases import TestCases
from test_scripts.performance_tests import PerformanceTests

def setup_logging(output_dir: Path):
    """Configure logging to both file and console"""
    log_file = output_dir / f"test_run_{datetime.now():%Y%m%d_%H%M%S}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return log_file

def create_test_report(
    setup_results: bool,
    test_results: Dict[str, Any],
    perf_results: Dict[str, Any],
    output_dir: Path
) -> Dict[str, Any]:
    """Create comprehensive test report"""
    report = {
        'timestamp': datetime.now().isoformat(),
        'environment': {
            'python_version': sys.version,
            'cuda_available': str(test_results.get('model_tests', {}).get('config', {}).get('cuda_available', False)),
            'platform': sys.platform
        },
        'setup_verification': {
            'success': setup_results,
            'timestamp': datetime.now().isoformat()
        },
        'test_results': test_results,
        'performance_results': perf_results
    }
    
    # Save report
    report_file = output_dir / f"test_report_{datetime.now():%Y%m%d_%H%M%S}.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    return report

def print_summary(report: Dict[str, Any]):
    """Print test summary"""
    print("\n" + "="*60)
    print("GAMA Test Environment - Test Summary")
    print("="*60)
    
    print("\nEnvironment:")
    print(f"Python: {report['environment']['python_version'].split()[0]}")
    print(f"CUDA Available: {report['environment']['cuda_available']}")
    print(f"Platform: {report['environment']['platform']}")
    
    print("\nTest Results:")
    if report['setup_verification']['success']:
        print("✓ Environment setup verification passed")
    else:
        print("✗ Environment setup verification failed")
    
    test_results = report['test_results']
    if 'error' not in test_results.get('model_tests', {}):
        print("✓ Model loading tests passed")
    else:
        print("✗ Model loading tests failed")
    
    if test_results.get('audio_tests', {}):
        print("✓ Audio processing tests completed")
    
    perf_results = report['performance_results']
    if perf_results.get('stress_test', {}).get('iterations', 0) > 0:
        print("✓ Memory stress tests completed")
    if perf_results.get('audio_benchmark', {}).get('durations', []):
        print("✓ Audio benchmarks completed")
    if perf_results.get('long_running', {}).get('iterations', 0) > 0:
        print("✓ Long-running stability test completed")
    
    print("\nDetailed results saved to:")
    print(f"- Test report: {report_file}")
    print(f"- Log file: {log_file}")

def main():
    """Run all tests and generate report"""
    # Create output directory
    output_dir = Path("test_output")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Setup logging
    log_file = setup_logging(output_dir)
    logger = logging.getLogger(__name__)
    
    try:
        logger.info("Starting GAMA test suite")
        
        # Step 1: Environment verification
        logger.info("\nStep 1: Environment Verification")
        setup_success = test_setup()
        
        # Step 2: Basic test cases
        logger.info("\nStep 2: Running Basic Tests")
        test_cases = TestCases(output_dir=str(output_dir))
        test_results = test_cases.run_all_tests()
        
        # Step 3: Performance tests
        logger.info("\nStep 3: Running Performance Tests")
        perf_tests = PerformanceTests(
            output_dir=str(output_dir / "performance"),
            test_duration=300  # 5 minutes
        )
        perf_results = perf_tests.run_all_tests()
        
        # Create and save report
        logger.info("\nGenerating Test Report")
        report = create_test_report(
            setup_success,
            test_results,
            perf_results,
            output_dir
        )
        
        # Print summary
        print_summary(report)
        
    except Exception as e:
        logger.error(f"Test suite failed: {str(e)}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    start_time = time.time()
    main()
    duration = time.time() - start_time
    print(f"\nTotal test duration: {duration/60:.1f} minutes")
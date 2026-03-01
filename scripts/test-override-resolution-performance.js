#!/usr/bin/env node

/**
 * Performance test for override resolution pattern
 * Tests that checking override path then plugin path completes in < 50ms
 *
 * Usage: node scripts/test-override-resolution-performance.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const OVERRIDE_DIR = path.join(PROJECT_ROOT, '.slide-builder', 'workflows');
const PLUGIN_DIR = path.join(PROJECT_ROOT, 'pitchsmith-plugin', 'workflows');

// List of workflows to test
const WORKFLOWS = [
  'build-one',
  'build-all',
  'plan-deck',
  'plan-one',
  'plan',
  'edit',
  'add-slide',
  'animate',
  'export',
  'edit-plan',
  'use-template-deck',
  'setup',
  'theme',
  'theme-edit',
  'add-slide-template',
  'add-deck-template',
  'edit-deck-template',
  'delete-deck',
  'update-brand-assets',
  'optimize-instructions',
  'status'
];

/**
 * Simulate override resolution pattern
 * @param {string} workflowName - Name of the workflow
 * @returns {object} Resolution result with timing
 */
function resolveWorkflow(workflowName) {
  const startTime = performance.now();

  // Step 1: Check override path
  const overridePath = path.join(OVERRIDE_DIR, workflowName, 'instructions.md');
  const overrideExists = fs.existsSync(overridePath);

  if (overrideExists) {
    const endTime = performance.now();
    return {
      workflow: workflowName,
      resolved: 'override',
      path: overridePath,
      duration: endTime - startTime
    };
  }

  // Step 2: Check plugin path
  const pluginPath = path.join(PLUGIN_DIR, workflowName, 'instructions.md');
  const pluginExists = fs.existsSync(pluginPath);

  const endTime = performance.now();

  if (pluginExists) {
    return {
      workflow: workflowName,
      resolved: 'plugin',
      path: pluginPath,
      duration: endTime - startTime
    };
  }

  // Neither exists - error case
  return {
    workflow: workflowName,
    resolved: 'error',
    path: null,
    duration: endTime - startTime
  };
}

/**
 * Run performance tests
 */
function runTests() {
  console.log('Override Resolution Performance Test');
  console.log('====================================\n');
  console.log('Target: < 50ms per resolution\n');

  const results = [];
  let passCount = 0;
  let failCount = 0;
  let errorCount = 0;

  // Run tests for each workflow
  for (const workflow of WORKFLOWS) {
    const result = resolveWorkflow(workflow);
    results.push(result);

    const status = result.duration < 50 ? 'PASS' : 'FAIL';
    const resolvedFrom = result.resolved === 'override' ? 'Override' :
                        result.resolved === 'plugin' ? 'Plugin' :
                        'ERROR';

    console.log(`${status} | ${workflow.padEnd(25)} | ${result.duration.toFixed(2)}ms | ${resolvedFrom}`);

    if (result.resolved === 'error') {
      errorCount++;
      failCount++;
    } else if (result.duration < 50) {
      passCount++;
    } else {
      failCount++;
    }
  }

  // Calculate statistics
  const durations = results.filter(r => r.resolved !== 'error').map(r => r.duration);
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  console.log('\n====================================');
  console.log('Summary:');
  console.log(`  Total workflows tested: ${WORKFLOWS.length}`);
  console.log(`  Passed: ${passCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Errors (missing workflow): ${errorCount}`);
  console.log(`\nTiming Statistics:`);
  console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Min: ${minDuration.toFixed(2)}ms`);
  console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
  console.log(`  Target: < 50ms`);
  console.log(`\nResult: ${failCount === 0 && errorCount === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  // Exit with error code if any failures
  if (failCount > 0 || errorCount > 0) {
    process.exit(1);
  }
}

// Run tests
runTests();

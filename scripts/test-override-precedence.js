#!/usr/bin/env node

/**
 * Test override precedence - ejected workflows take priority over plugin defaults
 *
 * This script:
 * 1. Creates a test ejected workflow with distinguishable content
 * 2. Verifies override path is resolved first
 * 3. Deletes test ejected workflow
 * 4. Verifies fallback to plugin default works
 *
 * Usage: node scripts/test-override-precedence.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const OVERRIDE_DIR = path.join(PROJECT_ROOT, '.slide-builder', 'workflows');
const PLUGIN_DIR = path.join(PROJECT_ROOT, 'pitchsmith-plugin', 'workflows');
const TEST_WORKFLOW = 'test-override-workflow';

/**
 * Resolve workflow using override-first pattern
 * @param {string} workflowName
 * @returns {object} Resolution result
 */
function resolveWorkflow(workflowName) {
  const overridePath = path.join(OVERRIDE_DIR, workflowName, 'instructions.md');
  const pluginPath = path.join(PLUGIN_DIR, workflowName, 'instructions.md');

  if (fs.existsSync(overridePath)) {
    return {
      resolved: 'override',
      path: overridePath,
      content: fs.readFileSync(overridePath, 'utf8')
    };
  }

  if (fs.existsSync(pluginPath)) {
    return {
      resolved: 'plugin',
      path: pluginPath,
      content: fs.readFileSync(pluginPath, 'utf8')
    };
  }

  return {
    resolved: 'error',
    path: null,
    content: null
  };
}

/**
 * Create test ejected workflow
 */
function createTestEjectedWorkflow() {
  const workflowDir = path.join(OVERRIDE_DIR, TEST_WORKFLOW);
  const instructionsPath = path.join(workflowDir, 'instructions.md');

  // Create directory if it doesn't exist
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  // Write distinguishable content
  const content = `# Test Ejected Workflow

This is a TEST EJECTED workflow that should override the plugin default.

Marker: EJECTED_VERSION
`;

  fs.writeFileSync(instructionsPath, content, 'utf8');
  console.log(`✅ Created test ejected workflow at: ${instructionsPath}`);
}

/**
 * Delete test ejected workflow
 */
function deleteTestEjectedWorkflow() {
  const workflowDir = path.join(OVERRIDE_DIR, TEST_WORKFLOW);

  if (fs.existsSync(workflowDir)) {
    fs.rmSync(workflowDir, { recursive: true, force: true });
    console.log(`✅ Deleted test ejected workflow: ${workflowDir}`);
  }
}

/**
 * Create test plugin workflow (for fallback test)
 */
function createTestPluginWorkflow() {
  const workflowDir = path.join(PLUGIN_DIR, TEST_WORKFLOW);
  const instructionsPath = path.join(workflowDir, 'instructions.md');

  // Create directory if it doesn't exist
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  // Write distinguishable content
  const content = `# Test Plugin Workflow

This is a PLUGIN DEFAULT workflow.

Marker: PLUGIN_VERSION
`;

  fs.writeFileSync(instructionsPath, content, 'utf8');
  console.log(`✅ Created test plugin workflow at: ${instructionsPath}`);
}

/**
 * Delete test plugin workflow
 */
function deleteTestPluginWorkflow() {
  const workflowDir = path.join(PLUGIN_DIR, TEST_WORKFLOW);

  if (fs.existsSync(workflowDir)) {
    fs.rmSync(workflowDir, { recursive: true, force: true });
    console.log(`✅ Deleted test plugin workflow: ${workflowDir}`);
  }
}

/**
 * Run override precedence tests
 */
function runTests() {
  console.log('Override Precedence Test');
  console.log('========================\n');

  let passed = 0;
  let failed = 0;

  try {
    // Clean up any existing test workflows
    deleteTestEjectedWorkflow();
    deleteTestPluginWorkflow();

    // Test 1: Create plugin workflow and verify resolution
    console.log('\nTest 1: Plugin default resolution (no override)');
    console.log('------------------------------------------------');
    createTestPluginWorkflow();

    const result1 = resolveWorkflow(TEST_WORKFLOW);

    if (result1.resolved === 'plugin' && result1.content.includes('PLUGIN_VERSION')) {
      console.log('✅ PASS: Resolved to plugin default');
      console.log(`   Path: ${result1.path}`);
      passed++;
    } else {
      console.log('❌ FAIL: Did not resolve to plugin default');
      console.log(`   Got: ${result1.resolved}`);
      failed++;
    }

    // Test 2: Create ejected workflow and verify override precedence
    console.log('\nTest 2: Override precedence (ejected workflow exists)');
    console.log('------------------------------------------------------');
    createTestEjectedWorkflow();

    const result2 = resolveWorkflow(TEST_WORKFLOW);

    if (result2.resolved === 'override' && result2.content.includes('EJECTED_VERSION')) {
      console.log('✅ PASS: Resolved to ejected workflow (override takes precedence)');
      console.log(`   Path: ${result2.path}`);
      passed++;
    } else {
      console.log('❌ FAIL: Did not resolve to ejected workflow');
      console.log(`   Got: ${result2.resolved}`);
      failed++;
    }

    // Test 3: Delete ejected workflow and verify fallback
    console.log('\nTest 3: Fallback to plugin after ejected deletion');
    console.log('--------------------------------------------------');
    deleteTestEjectedWorkflow();

    const result3 = resolveWorkflow(TEST_WORKFLOW);

    if (result3.resolved === 'plugin' && result3.content.includes('PLUGIN_VERSION')) {
      console.log('✅ PASS: Fell back to plugin default after override deletion');
      console.log(`   Path: ${result3.path}`);
      passed++;
    } else {
      console.log('❌ FAIL: Did not fall back to plugin default');
      console.log(`   Got: ${result3.resolved}`);
      failed++;
    }

    // Test 4: Delete both and verify error
    console.log('\nTest 4: Error when neither override nor plugin exists');
    console.log('------------------------------------------------------');
    deleteTestPluginWorkflow();

    const result4 = resolveWorkflow(TEST_WORKFLOW);

    if (result4.resolved === 'error') {
      console.log('✅ PASS: Correctly returned error when neither path exists');
      passed++;
    } else {
      console.log('❌ FAIL: Did not return error when neither path exists');
      console.log(`   Got: ${result4.resolved}`);
      failed++;
    }

  } finally {
    // Clean up test workflows
    console.log('\nCleanup');
    console.log('-------');
    deleteTestEjectedWorkflow();
    deleteTestPluginWorkflow();
  }

  // Summary
  console.log('\n========================');
  console.log('Summary:');
  console.log(`  Passed: ${passed}/4`);
  console.log(`  Failed: ${failed}/4`);
  console.log(`\nResult: ${failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  // Exit with error code if any failures
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests();

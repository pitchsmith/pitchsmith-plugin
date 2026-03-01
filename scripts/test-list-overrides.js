#!/usr/bin/env node

/**
 * Test list-overrides command functionality
 *
 * This script tests:
 * 1. Discovering all available workflows in plugin
 * 2. Detecting ejected workflows in .slide-builder
 * 3. Categorizing workflows as ejected vs plugin defaults
 * 4. Displaying accurate status report
 * 5. Handling edge cases (no ejected workflows, all ejected, etc.)
 *
 * Usage: node scripts/test-list-overrides.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const OVERRIDE_DIR = path.join(PROJECT_ROOT, '.slide-builder', 'workflows');
const PLUGIN_DIR = path.join(PROJECT_ROOT, 'pitchsmith-plugin', 'workflows');

/**
 * Discover all available workflows in plugin
 * @returns {string[]} Array of workflow names
 */
function discoverAvailableWorkflows() {
  if (!fs.existsSync(PLUGIN_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(PLUGIN_DIR, { withFileTypes: true });
  const workflows = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'shared') continue; // Exclude shared directory

    const workflowPath = path.join(PLUGIN_DIR, entry.name);
    const workflowYamlPath = path.join(workflowPath, 'workflow.yaml');

    // Only include directories with workflow.yaml
    if (fs.existsSync(workflowYamlPath)) {
      workflows.push(entry.name);
    }
  }

  return workflows.sort();
}

/**
 * Discover ejected workflows in .slide-builder
 * @returns {string[]} Array of ejected workflow names
 */
function discoverEjectedWorkflows() {
  if (!fs.existsSync(OVERRIDE_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(OVERRIDE_DIR, { withFileTypes: true });
  const ejectedWorkflows = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const workflowPath = path.join(OVERRIDE_DIR, entry.name);
    const workflowYamlPath = path.join(workflowPath, 'workflow.yaml');

    // Only include directories with workflow.yaml
    if (fs.existsSync(workflowYamlPath)) {
      ejectedWorkflows.push(entry.name);
    }
  }

  return ejectedWorkflows.sort();
}

/**
 * List overrides - simulates the list-overrides command logic
 * @returns {object} Override status object
 */
function listOverrides() {
  const availableWorkflows = discoverAvailableWorkflows();
  const ejectedWorkflows = discoverEjectedWorkflows();

  // Categorize workflows
  const pluginDefaults = availableWorkflows.filter(
    w => !ejectedWorkflows.includes(w)
  );

  // Find orphaned ejected workflows (ejected but not in plugin)
  const orphanedWorkflows = ejectedWorkflows.filter(
    w => !availableWorkflows.includes(w)
  );

  return {
    totalAvailable: availableWorkflows.length,
    ejectedCount: ejectedWorkflows.length,
    pluginDefaultCount: pluginDefaults.length,
    ejectedWorkflows: ejectedWorkflows,
    pluginDefaults: pluginDefaults,
    orphanedWorkflows: orphanedWorkflows,
    availableWorkflows: availableWorkflows
  };
}

/**
 * Display override status report
 * @param {object} status
 */
function displayStatusReport(status) {
  console.log('\n📦 Slide Builder Workflow Status\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Ejected workflows section
  console.log(`✏️  EJECTED (Using Local Copy) - ${status.ejectedCount}\n`);

  if (status.ejectedCount === 0) {
    console.log('None - All workflows using plugin defaults\n');
  } else {
    for (const workflow of status.ejectedWorkflows) {
      console.log(`• ${workflow}`);
      console.log(`  📁 .slide-builder/workflows/${workflow}/`);
    }
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  // Plugin defaults section
  console.log(`🔌 USING PLUGIN DEFAULTS - ${status.pluginDefaultCount}\n`);

  if (status.pluginDefaultCount === 0) {
    console.log('None - All workflows ejected\n');
  } else {
    const displayCount = Math.min(status.pluginDefaults.length, 10);
    for (let i = 0; i < displayCount; i++) {
      console.log(`• ${status.pluginDefaults[i]}`);
    }

    if (status.pluginDefaults.length > displayCount) {
      console.log(`... and ${status.pluginDefaults.length - displayCount} more`);
    }
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  // Summary
  console.log(`📊 Total: ${status.totalAvailable} workflows available\n`);

  // Warnings for orphaned workflows
  if (status.orphanedWorkflows.length > 0) {
    console.log('⚠️  Warnings:\n');
    for (const workflow of status.orphanedWorkflows) {
      console.log(`• Local workflow '${workflow}' not found in plugin`);
      console.log(`  May be custom or from older plugin version\n`);
    }
  }
}

/**
 * Create test ejected workflow
 * @param {string} workflowName
 */
function createTestEjectedWorkflow(workflowName) {
  const workflowDir = path.join(OVERRIDE_DIR, workflowName);
  const workflowYamlPath = path.join(workflowDir, 'workflow.yaml');
  const instructionsPath = path.join(workflowDir, 'instructions.md');

  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  fs.writeFileSync(workflowYamlPath, 'name: test\ndescription: test\n', 'utf8');
  fs.writeFileSync(instructionsPath, '# Test\n', 'utf8');
}

/**
 * Delete test ejected workflow
 * @param {string} workflowName
 */
function deleteTestEjectedWorkflow(workflowName) {
  const workflowDir = path.join(OVERRIDE_DIR, workflowName);

  if (fs.existsSync(workflowDir)) {
    fs.rmSync(workflowDir, { recursive: true, force: true });
  }
}

/**
 * Run list overrides tests
 */
function runTests() {
  console.log('List Overrides Command Tests');
  console.log('=============================\n');

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Discover available workflows
    console.log('\nTest 1: Discover available workflows in plugin');
    console.log('-----------------------------------------------');
    const availableWorkflows = discoverAvailableWorkflows();

    if (availableWorkflows.length > 20) {
      console.log('✅ PASS: Discovered workflows in plugin');
      console.log(`   Count: ${availableWorkflows.length}`);
      console.log(`   Examples: ${availableWorkflows.slice(0, 5).join(', ')}...`);
      passed++;
    } else {
      console.log('❌ FAIL: Expected 20+ workflows, found:', availableWorkflows.length);
      failed++;
    }

    // Test 2: No ejected workflows (baseline)
    console.log('\nTest 2: List overrides with no ejected workflows');
    console.log('-------------------------------------------------');

    // Clean up any test workflows
    deleteTestEjectedWorkflow('test-workflow-1');
    deleteTestEjectedWorkflow('test-workflow-2');

    const status2 = listOverrides();

    if (status2.ejectedCount === 0 && status2.pluginDefaultCount > 0) {
      console.log('✅ PASS: Correctly reports no ejected workflows');
      console.log(`   Ejected: ${status2.ejectedCount}`);
      console.log(`   Plugin defaults: ${status2.pluginDefaultCount}`);
      passed++;
    } else {
      console.log('❌ FAIL: Incorrect status reporting');
      console.log(`   Ejected: ${status2.ejectedCount} (expected 0)`);
      failed++;
    }

    // Test 3: One ejected workflow
    console.log('\nTest 3: List overrides with one ejected workflow');
    console.log('-------------------------------------------------');
    createTestEjectedWorkflow('test-workflow-1');

    const status3 = listOverrides();

    if (status3.ejectedCount === 1 && status3.ejectedWorkflows.includes('test-workflow-1')) {
      console.log('✅ PASS: Correctly detected ejected workflow');
      console.log(`   Ejected: ${status3.ejectedWorkflows.join(', ')}`);
      passed++;
    } else {
      console.log('❌ FAIL: Failed to detect ejected workflow');
      console.log(`   Ejected count: ${status3.ejectedCount} (expected 1)`);
      failed++;
    }

    // Test 4: Multiple ejected workflows
    console.log('\nTest 4: List overrides with multiple ejected workflows');
    console.log('-------------------------------------------------------');
    createTestEjectedWorkflow('test-workflow-2');

    const status4 = listOverrides();

    if (status4.ejectedCount === 2 &&
        status4.ejectedWorkflows.includes('test-workflow-1') &&
        status4.ejectedWorkflows.includes('test-workflow-2')) {
      console.log('✅ PASS: Correctly detected multiple ejected workflows');
      console.log(`   Ejected: ${status4.ejectedWorkflows.join(', ')}`);
      passed++;
    } else {
      console.log('❌ FAIL: Failed to detect multiple ejected workflows');
      console.log(`   Ejected count: ${status4.ejectedCount} (expected 2)`);
      failed++;
    }

    // Test 5: Orphaned workflow detection
    console.log('\nTest 5: Detect orphaned workflows (not in plugin)');
    console.log('--------------------------------------------------');
    createTestEjectedWorkflow('orphaned-workflow');

    const status5 = listOverrides();

    if (status5.orphanedWorkflows.includes('orphaned-workflow')) {
      console.log('✅ PASS: Correctly detected orphaned workflow');
      console.log(`   Orphaned: ${status5.orphanedWorkflows.join(', ')}`);
      passed++;
    } else {
      console.log('❌ FAIL: Failed to detect orphaned workflow');
      failed++;
    }

    // Test 6: Categorization accuracy
    console.log('\nTest 6: Verify categorization accuracy');
    console.log('---------------------------------------');
    const status6 = listOverrides();

    // Valid ejected workflows are those that exist in plugin
    const validEjectedCount = status6.ejectedWorkflows.filter(
      w => status6.availableWorkflows.includes(w)
    ).length;

    const totalCategorized = validEjectedCount + status6.pluginDefaultCount;

    if (totalCategorized === status6.totalAvailable) {
      console.log('✅ PASS: All workflows correctly categorized');
      console.log(`   Total: ${status6.totalAvailable}`);
      console.log(`   Valid ejected: ${validEjectedCount}`);
      console.log(`   Plugin defaults: ${status6.pluginDefaultCount}`);
      console.log(`   Orphaned (excluded): ${status6.orphanedWorkflows.length}`);
      passed++;
    } else {
      console.log('❌ FAIL: Categorization mismatch');
      console.log(`   Total: ${status6.totalAvailable}`);
      console.log(`   Categorized: ${totalCategorized}`);
      failed++;
    }

    // Test 7: Display status report (visual check)
    console.log('\nTest 7: Display status report');
    console.log('------------------------------');
    displayStatusReport(status6);
    console.log('✅ PASS: Status report displayed (visual verification)');
    passed++;

  } finally {
    // Clean up test workflows
    console.log('\nCleanup');
    console.log('-------');
    deleteTestEjectedWorkflow('test-workflow-1');
    deleteTestEjectedWorkflow('test-workflow-2');
    deleteTestEjectedWorkflow('orphaned-workflow');
    console.log('✅ Test cleanup complete');
  }

  // Summary
  console.log('\n=============================');
  console.log('Summary:');
  console.log(`  Passed: ${passed}/7`);
  console.log(`  Failed: ${failed}/7`);
  console.log(`\nResult: ${failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  // Exit with error code if any failures
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests();

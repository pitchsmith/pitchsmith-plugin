#!/usr/bin/env node

/**
 * Test eject-workflow command functionality
 *
 * This script tests:
 * 1. Ejecting a workflow from plugin to local .slide-builder
 * 2. Verifying directory structure and files are copied
 * 3. Re-ejecting (overwrite) functionality
 * 4. Error handling for invalid workflow names
 * 5. Cleanup and revert functionality
 *
 * Usage: node scripts/test-eject-workflow.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const OVERRIDE_DIR = path.join(PROJECT_ROOT, '.slide-builder', 'workflows');
const PLUGIN_DIR = path.join(PROJECT_ROOT, 'pitchsmith-plugin', 'workflows');
const TEST_WORKFLOW = 'build-one'; // Use real workflow for testing

/**
 * Eject workflow - simulates the eject-workflow command logic
 * @param {string} workflowName
 * @param {boolean} overwrite - Skip confirmation and overwrite
 * @returns {object} Result object
 */
function ejectWorkflow(workflowName, overwrite = false) {
  const pluginWorkflowPath = path.join(PLUGIN_DIR, workflowName);
  const localWorkflowPath = path.join(OVERRIDE_DIR, workflowName);

  // Step 1: Validate workflow exists in plugin
  if (!fs.existsSync(pluginWorkflowPath)) {
    return {
      success: false,
      error: `Workflow '${workflowName}' not found in plugin`,
      stage: 'validation'
    };
  }

  // Verify workflow.yaml exists
  const workflowYamlPath = path.join(pluginWorkflowPath, 'workflow.yaml');
  if (!fs.existsSync(workflowYamlPath)) {
    return {
      success: false,
      error: `Invalid workflow: missing workflow.yaml`,
      stage: 'validation'
    };
  }

  // Step 2: Check if already ejected
  if (fs.existsSync(localWorkflowPath) && !overwrite) {
    return {
      success: false,
      error: `Workflow '${workflowName}' is already ejected`,
      stage: 'already_exists',
      needsConfirmation: true
    };
  }

  // Step 3: Create override directory if needed
  if (!fs.existsSync(OVERRIDE_DIR)) {
    fs.mkdirSync(OVERRIDE_DIR, { recursive: true });
  }

  // Step 4: Copy workflow directory
  try {
    // Remove existing if overwriting
    if (fs.existsSync(localWorkflowPath)) {
      fs.rmSync(localWorkflowPath, { recursive: true, force: true });
    }

    // Copy directory recursively
    copyDirectory(pluginWorkflowPath, localWorkflowPath);

    // Verify copy succeeded
    if (!fs.existsSync(path.join(localWorkflowPath, 'workflow.yaml'))) {
      return {
        success: false,
        error: 'Copy verification failed: workflow.yaml not found in target',
        stage: 'copy'
      };
    }

    return {
      success: true,
      workflowName: workflowName,
      localPath: localWorkflowPath,
      pluginPath: pluginWorkflowPath
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to copy workflow: ${error.message}`,
      stage: 'copy'
    };
  }
}

/**
 * Recursively copy directory
 * @param {string} src
 * @param {string} dest
 */
function copyDirectory(src, dest) {
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Delete ejected workflow
 * @param {string} workflowName
 * @returns {object} Result object
 */
function deleteEjectedWorkflow(workflowName) {
  const localWorkflowPath = path.join(OVERRIDE_DIR, workflowName);

  if (!fs.existsSync(localWorkflowPath)) {
    return {
      success: false,
      error: `Workflow '${workflowName}' is not ejected`,
      stage: 'not_found'
    };
  }

  try {
    fs.rmSync(localWorkflowPath, { recursive: true, force: true });
    return {
      success: true,
      workflowName: workflowName,
      deletedPath: localWorkflowPath
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete workflow: ${error.message}`,
      stage: 'delete'
    };
  }
}

/**
 * Verify ejected workflow structure
 * @param {string} workflowName
 * @returns {object} Verification result
 */
function verifyEjectedWorkflow(workflowName) {
  const localWorkflowPath = path.join(OVERRIDE_DIR, workflowName);

  if (!fs.existsSync(localWorkflowPath)) {
    return {
      valid: false,
      error: 'Workflow directory does not exist'
    };
  }

  const requiredFiles = ['workflow.yaml', 'instructions.md'];
  const missingFiles = [];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(localWorkflowPath, file))) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    return {
      valid: false,
      error: `Missing required files: ${missingFiles.join(', ')}`
    };
  }

  // Compare file count with plugin original
  const pluginWorkflowPath = path.join(PLUGIN_DIR, workflowName);
  const pluginFiles = getAllFiles(pluginWorkflowPath);
  const localFiles = getAllFiles(localWorkflowPath);

  return {
    valid: true,
    pluginFileCount: pluginFiles.length,
    localFileCount: localFiles.length,
    filesMatch: pluginFiles.length === localFiles.length
  };
}

/**
 * Get all files in directory recursively
 * @param {string} dir
 * @returns {string[]} Array of file paths
 */
function getAllFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Run eject workflow tests
 */
function runTests() {
  console.log('Eject Workflow Command Tests');
  console.log('=============================\n');

  let passed = 0;
  let failed = 0;

  try {
    // Clean up any existing test workflow
    deleteEjectedWorkflow(TEST_WORKFLOW);

    // Test 1: Eject a valid workflow
    console.log('\nTest 1: Eject valid workflow');
    console.log('------------------------------');
    const result1 = ejectWorkflow(TEST_WORKFLOW);

    if (result1.success) {
      console.log('✅ PASS: Workflow ejected successfully');
      console.log(`   Local path: ${result1.localPath}`);
      passed++;
    } else {
      console.log('❌ FAIL: Failed to eject workflow');
      console.log(`   Error: ${result1.error}`);
      failed++;
    }

    // Test 2: Verify ejected workflow structure
    console.log('\nTest 2: Verify ejected workflow structure');
    console.log('------------------------------------------');
    const verification = verifyEjectedWorkflow(TEST_WORKFLOW);

    if (verification.valid && verification.filesMatch) {
      console.log('✅ PASS: Ejected workflow structure is valid');
      console.log(`   Plugin files: ${verification.pluginFileCount}`);
      console.log(`   Local files: ${verification.localFileCount}`);
      passed++;
    } else {
      console.log('❌ FAIL: Ejected workflow structure is invalid');
      console.log(`   Error: ${verification.error || 'File count mismatch'}`);
      failed++;
    }

    // Test 3: Attempt to eject already ejected workflow (should require confirmation)
    console.log('\nTest 3: Prevent duplicate eject without confirmation');
    console.log('-----------------------------------------------------');
    const result3 = ejectWorkflow(TEST_WORKFLOW, false);

    if (!result3.success && result3.needsConfirmation) {
      console.log('✅ PASS: Correctly requires confirmation for re-eject');
      console.log(`   Error: ${result3.error}`);
      passed++;
    } else {
      console.log('❌ FAIL: Should require confirmation for duplicate eject');
      failed++;
    }

    // Test 4: Re-eject with overwrite flag
    console.log('\nTest 4: Re-eject with overwrite');
    console.log('--------------------------------');
    const result4 = ejectWorkflow(TEST_WORKFLOW, true);

    if (result4.success) {
      console.log('✅ PASS: Re-eject with overwrite succeeded');
      passed++;
    } else {
      console.log('❌ FAIL: Re-eject with overwrite failed');
      console.log(`   Error: ${result4.error}`);
      failed++;
    }

    // Test 5: Eject invalid workflow name
    console.log('\nTest 5: Reject invalid workflow name');
    console.log('-------------------------------------');
    const result5 = ejectWorkflow('nonexistent-workflow');

    if (!result5.success && result5.stage === 'validation') {
      console.log('✅ PASS: Correctly rejected invalid workflow');
      console.log(`   Error: ${result5.error}`);
      passed++;
    } else {
      console.log('❌ FAIL: Should reject invalid workflow');
      failed++;
    }

    // Test 6: Delete ejected workflow (revert)
    console.log('\nTest 6: Delete ejected workflow');
    console.log('--------------------------------');
    const result6 = deleteEjectedWorkflow(TEST_WORKFLOW);

    if (result6.success) {
      console.log('✅ PASS: Ejected workflow deleted successfully');
      console.log(`   Deleted: ${result6.deletedPath}`);
      passed++;
    } else {
      console.log('❌ FAIL: Failed to delete ejected workflow');
      console.log(`   Error: ${result6.error}`);
      failed++;
    }

    // Test 7: Verify deletion
    console.log('\nTest 7: Verify workflow reverted to plugin default');
    console.log('---------------------------------------------------');
    const localPath = path.join(OVERRIDE_DIR, TEST_WORKFLOW);
    const pluginPath = path.join(PLUGIN_DIR, TEST_WORKFLOW);

    if (!fs.existsSync(localPath) && fs.existsSync(pluginPath)) {
      console.log('✅ PASS: Local workflow deleted, plugin workflow still exists');
      passed++;
    } else {
      console.log('❌ FAIL: Verification failed');
      console.log(`   Local exists: ${fs.existsSync(localPath)}`);
      console.log(`   Plugin exists: ${fs.existsSync(pluginPath)}`);
      failed++;
    }

  } finally {
    // Clean up
    console.log('\nCleanup');
    console.log('-------');
    deleteEjectedWorkflow(TEST_WORKFLOW);
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

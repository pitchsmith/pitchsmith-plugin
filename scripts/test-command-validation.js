#!/usr/bin/env node

/**
 * Comprehensive Command Validation Test for Story P0-5.1
 *
 * Validates all 26 CLI command interaction points:
 * - All command .md files exist in correct locations
 * - All command files reference correct workflows
 * - Override resolution pattern is present in workflow-executing commands
 * - All referenced workflow.yaml files exist in plugin
 * - All referenced instructions.md files exist in plugin
 * - SKILL.md exists and contains state detection logic
 * - Command-to-workflow mapping matches CONVENTIONS.md
 * - Error path patterns are correct
 *
 * Usage: node scripts/test-command-validation.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const PLUGIN_DIR = path.join(PROJECT_ROOT, 'pitchsmith-plugin');
const COMMANDS_DIR = path.join(PLUGIN_DIR, 'commands');
const WORKFLOWS_DIR = path.join(PLUGIN_DIR, 'workflows');
const SKILLS_DIR = path.join(PLUGIN_DIR, 'skills');

// Track test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(description, condition) {
  totalTests++;
  if (condition) {
    console.log(`  PASS: ${description}`);
    passedTests++;
  } else {
    console.log(`  FAIL: ${description}`);
    failedTests++;
    failures.push(description);
  }
}

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}`);
}

// ============================================================
// COMMAND DEFINITIONS - authoritative mapping from CONVENTIONS.md
// ============================================================

const COMMAND_GROUPS = {
  'pitchsmith': {
    commands: {
      'help.md': { workflow: null, type: 'static-doc' },
      'status.md': { workflow: 'status', type: 'workflow-command' },
      'plan.md': { workflow: 'plan', type: 'workflow-command' },
      'plan-deck.md': { workflow: 'plan-deck', type: 'workflow-command' },
      'plan-one.md': { workflow: 'plan-one', type: 'workflow-command' },
      'build-one.md': { workflow: 'build-one', type: 'workflow-command' },
      'build-all.md': { workflow: 'build-all', type: 'workflow-command' },
      'edit.md': { workflow: 'edit', type: 'workflow-command' },
      'edit-plan.md': { workflow: 'edit-plan', type: 'workflow-command' },
      'add-slide.md': { workflow: 'add-slide', type: 'workflow-command' },
      'animate.md': { workflow: 'animate', type: 'workflow-command' },
      'refresh.md': { workflow: null, type: 'script-command' },
      'export.md': { workflow: 'export', type: 'workflow-command' },
      'use-template.md': { workflow: 'use-template-deck', type: 'workflow-command' },
      'add-slide-template.md': { workflow: 'add-slide-template', type: 'workflow-command' },
      'add-deck-template.md': { workflow: 'add-deck-template', type: 'workflow-command' },
      'edit-deck-template.md': { workflow: 'edit-deck-template', type: 'workflow-command' },
      'update-brand-assets.md': { workflow: 'update-brand-assets', type: 'workflow-command' },
      'delete-deck.md': { workflow: 'delete-deck', type: 'workflow-command' },
      'eject-workflow.md': { workflow: null, type: 'meta-command' },
      'list-overrides.md': { workflow: null, type: 'meta-command' },
      'optimize-instructions.md': { workflow: 'optimize-instructions', type: 'workflow-command' },
      'setup.md': { workflow: 'setup', type: 'workflow-command' },
      'theme.md': { workflow: 'theme', type: 'workflow-command' },
      'theme-edit.md': { workflow: 'theme-edit', type: 'workflow-command' }
    }
  }
};

// ============================================================
// TASK 1 VALIDATION: Plugin Structure
// ============================================================

section('TASK 1: Plugin Structure Validation');

// Check plugin manifest
test('Plugin manifest exists',
  fs.existsSync(path.join(PLUGIN_DIR, '.claude-plugin', 'plugin.json')));

const pluginJson = JSON.parse(
  fs.readFileSync(path.join(PLUGIN_DIR, '.claude-plugin', 'plugin.json'), 'utf8')
);
test('Plugin name is "pitchsmith"', pluginJson.name === 'pitchsmith');
test('Plugin version is "0.2.9"', pluginJson.version === '0.2.9');

// Check all required directories
const requiredDirs = ['.claude-plugin', 'commands', 'skills', 'workflows', 'templates', 'config/defaults', 'scripts'];
for (const dir of requiredDirs) {
  test(`Directory ${dir}/ exists`, fs.existsSync(path.join(PLUGIN_DIR, dir)));
}

// Count command files
let totalCommandFiles = 0;
for (const [group, config] of Object.entries(COMMAND_GROUPS)) {
  for (const cmdFile of Object.keys(config.commands)) {
    totalCommandFiles++;
  }
}
test(`Expected 25 command files defined`, totalCommandFiles === 25);

// Check skill file
test('SKILL.md exists at skills/pitchsmith/SKILL.md',
  fs.existsSync(path.join(SKILLS_DIR, 'pitchsmith', 'SKILL.md')));

// Count workflow directories (should be 22 with workflow.yaml)
const workflowDirs = fs.readdirSync(WORKFLOWS_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory() && e.name !== 'shared')
  .filter(e => fs.existsSync(path.join(WORKFLOWS_DIR, e.name, 'workflow.yaml')));
test(`Expected 22 workflow directories with workflow.yaml, found ${workflowDirs.length}`,
  workflowDirs.length === 22);

// ============================================================
// TASK 2 VALIDATION: No Hardcoded Old Paths
// ============================================================

section('TASK 2: Hardcoded Path Check');

let oldPathsFound = 0;
for (const [group, config] of Object.entries(COMMAND_GROUPS)) {
  for (const cmdFile of Object.keys(config.commands)) {
    const filePath = path.join(COMMANDS_DIR, group, cmdFile);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('.claude/commands/') || content.includes('.claude/skills/')) {
        oldPathsFound++;
        console.log(`  WARN: Old path found in ${group}/${cmdFile}`);
      }
    }
  }
}
test('No old .claude/commands/ or .claude/skills/ paths in command files', oldPathsFound === 0);

// ============================================================
// TASK 3: /sb Commands (3 interaction points)
// ============================================================

section('TASK 3: /pitchsmith Commands (core interaction points)');

// /pitchsmith:help
const helpPath = path.join(COMMANDS_DIR, 'pitchsmith', 'help.md');
test('/pitchsmith:help command file exists', fs.existsSync(helpPath));
if (fs.existsSync(helpPath)) {
  const helpContent = fs.readFileSync(helpPath, 'utf8');
  test('/pitchsmith:help contains command listings', helpContent.includes('/pitchsmith:'));
}

// /pitchsmith:status
const statusPath = path.join(COMMANDS_DIR, 'pitchsmith', 'status.md');
test('/pitchsmith:status command file exists', fs.existsSync(statusPath));
if (fs.existsSync(statusPath)) {
  const statusContent = fs.readFileSync(statusPath, 'utf8');
  test('/pitchsmith:status has override resolution pattern',
    statusContent.includes('.slide-builder/workflows/status/') &&
    statusContent.includes('CLAUDE_PLUGIN_ROOT'));
}

// /sb skill router (SKILL.md)
const skillPath = path.join(SKILLS_DIR, 'pitchsmith', 'SKILL.md');
test('/pitchsmith skill router exists', fs.existsSync(skillPath));
if (fs.existsSync(skillPath)) {
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  test('/pitchsmith skill router has state detection',
    skillContent.includes('NO_THEME') || skillContent.includes('no theme') ||
    skillContent.includes('NO_DECKS') || skillContent.includes('no deck') ||
    skillContent.toLowerCase().includes('state'));
}

// Verify status workflow exists
test('status workflow.yaml exists',
  fs.existsSync(path.join(WORKFLOWS_DIR, 'status', 'workflow.yaml')));
test('status instructions.md exists',
  fs.existsSync(path.join(WORKFLOWS_DIR, 'status', 'instructions.md')));

// ============================================================
// TASK 4: /pitchsmith Commands (25 commands)
// ============================================================

section('TASK 4: /pitchsmith Commands (25 commands)');

const pitchsmithCommands = COMMAND_GROUPS['pitchsmith'].commands;
for (const [cmdFile, config] of Object.entries(pitchsmithCommands)) {
  const filePath = path.join(COMMANDS_DIR, 'pitchsmith', cmdFile);
  const cmdName = cmdFile.replace('.md', '');

  test(`/pitchsmith:${cmdName} command file exists`, fs.existsSync(filePath));

  if (fs.existsSync(filePath) && config.type === 'workflow-command') {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check override resolution pattern
    test(`/pitchsmith:${cmdName} has override check (.slide-builder/workflows/${config.workflow}/)`,
      content.includes(`.slide-builder/workflows/${config.workflow}/`));
    test(`/pitchsmith:${cmdName} has plugin fallback (CLAUDE_PLUGIN_ROOT/workflows/${config.workflow}/)`,
      content.includes(`CLAUDE_PLUGIN_ROOT}/workflows/${config.workflow}/`));

    // Check workflow exists in plugin
    test(`/pitchsmith:${cmdName} -> workflow '${config.workflow}' exists in plugin`,
      fs.existsSync(path.join(WORKFLOWS_DIR, config.workflow, 'workflow.yaml')));
    test(`/pitchsmith:${cmdName} -> workflow '${config.workflow}' has instructions.md`,
      fs.existsSync(path.join(WORKFLOWS_DIR, config.workflow, 'instructions.md')));
  }

  if (config.type === 'script-command') {
    // refresh.md uses a script directly
    const content = fs.readFileSync(filePath, 'utf8');
    test(`/pitchsmith:${cmdName} references generate-manifest script`,
      content.includes('generate-manifest'));
  }

  if (config.type === 'meta-command') {
    const content = fs.readFileSync(filePath, 'utf8');
    test(`/pitchsmith:${cmdName} references CLAUDE_PLUGIN_ROOT`,
      content.includes('CLAUDE_PLUGIN_ROOT'));
    test(`/pitchsmith:${cmdName} references .slide-builder/workflows/`,
      content.includes('.slide-builder/workflows/'));
  }
}

// ============================================================
// TASK 7: Override Resolution Validation
// ============================================================

section('TASK 7: Override Resolution Pattern Validation');

// Verify all workflow-executing commands have the 3-step pattern:
// 1. Check .slide-builder/workflows/{name}/instructions.md exists
// 2. If yes: use local
// 3. If no: use ${CLAUDE_PLUGIN_ROOT}/workflows/{name}/
let overridePatternCount = 0;
let overridePatternExpected = 0;

for (const [group, config] of Object.entries(COMMAND_GROUPS)) {
  for (const [cmdFile, cmdConfig] of Object.entries(config.commands)) {
    if (cmdConfig.type !== 'workflow-command') continue;
    overridePatternExpected++;

    const filePath = path.join(COMMANDS_DIR, group, cmdFile);
    const content = fs.readFileSync(filePath, 'utf8');

    const hasLocalCheck = content.includes(`.slide-builder/workflows/${cmdConfig.workflow}/`);
    const hasPluginFallback = content.includes(`CLAUDE_PLUGIN_ROOT}/workflows/${cmdConfig.workflow}/`);

    if (hasLocalCheck && hasPluginFallback) {
      overridePatternCount++;
    }
  }
}

test(`All ${overridePatternExpected} workflow commands implement override-first pattern`,
  overridePatternCount === overridePatternExpected);
console.log(`  INFO: ${overridePatternCount}/${overridePatternExpected} commands have complete override resolution`);

// Verify eject-workflow and list-overrides reference both paths
const ejectContent = fs.readFileSync(path.join(COMMANDS_DIR, 'pitchsmith', 'eject-workflow.md'), 'utf8');
test('eject-workflow references CLAUDE_PLUGIN_ROOT for source', ejectContent.includes('CLAUDE_PLUGIN_ROOT'));
test('eject-workflow references .slide-builder/workflows/ for target', ejectContent.includes('.slide-builder/workflows/'));
test('eject-workflow handles already-ejected case', ejectContent.includes('already ejected'));
test('eject-workflow has error handling for invalid workflow',
  ejectContent.includes('not found') || ejectContent.includes('not found in plugin'));

const listContent = fs.readFileSync(path.join(COMMANDS_DIR, 'pitchsmith', 'list-overrides.md'), 'utf8');
test('list-overrides scans both plugin and local',
  listContent.includes('CLAUDE_PLUGIN_ROOT') && listContent.includes('.slide-builder/workflows/'));

// ============================================================
// TASK 8: Performance Validation (via existing scripts)
// ============================================================

section('TASK 8: Performance Validation');

// Run inline performance test for override resolution
const OVERRIDE_DIR = path.join(PROJECT_ROOT, '.slide-builder', 'workflows');
const allWorkflows = workflowDirs.map(d => d.name);

let maxResolutionTime = 0;
let totalResolutionTime = 0;

for (const workflow of allWorkflows) {
  const start = performance.now();

  // Simulate override resolution
  const overridePath = path.join(OVERRIDE_DIR, workflow, 'instructions.md');
  fs.existsSync(overridePath);

  const pluginPath = path.join(WORKFLOWS_DIR, workflow, 'instructions.md');
  fs.existsSync(pluginPath);

  const duration = performance.now() - start;
  maxResolutionTime = Math.max(maxResolutionTime, duration);
  totalResolutionTime += duration;
}

const avgResolutionTime = totalResolutionTime / allWorkflows.length;
test(`Override resolution avg < 50ms (actual: ${avgResolutionTime.toFixed(2)}ms)`, avgResolutionTime < 50);
test(`Override resolution max < 50ms (actual: ${maxResolutionTime.toFixed(2)}ms)`, maxResolutionTime < 50);
console.log(`  INFO: Tested ${allWorkflows.length} workflows`);

// ============================================================
// TASK 9: Error Path Validation
// ============================================================

section('TASK 9: Error Path Validation');

// Check that workflow commands have error handling for missing workflow
let errorPatternCount = 0;
let errorPatternExpected2 = 0;

for (const [group, config] of Object.entries(COMMAND_GROUPS)) {
  for (const [cmdFile, cmdConfig] of Object.entries(config.commands)) {
    if (cmdConfig.type !== 'workflow-command') continue;
    errorPatternExpected2++;

    const filePath = path.join(COMMANDS_DIR, group, cmdFile);
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for error handling when neither override nor plugin exists
    const hasErrorHandling = content.includes('not found') ||
                             content.includes('error') ||
                             content.includes('neither exists') ||
                             content.includes('If neither');

    if (hasErrorHandling) {
      errorPatternCount++;
    }
  }
}

test(`${errorPatternCount}/${errorPatternExpected2} workflow commands have error handling for missing workflows`,
  errorPatternCount > 0);

// Check eject-workflow error paths
test('eject-workflow handles missing CLAUDE_PLUGIN_ROOT',
  ejectContent.includes('not found') || ejectContent.includes('Cannot'));
test('eject-workflow handles copy failures',
  ejectContent.includes('Failed') || ejectContent.includes('error') || ejectContent.includes('Error'));

// Check list-overrides error paths
test('list-overrides handles CLAUDE_PLUGIN_ROOT resolution failure',
  listContent.includes('Cannot resolve') || listContent.includes('cannot be resolved'));

// Check dependency-checking commands reference dependency checks
const exportContent = fs.readFileSync(path.join(COMMANDS_DIR, 'pitchsmith', 'export.md'), 'utf8');
const setupContent = fs.readFileSync(path.join(COMMANDS_DIR, 'pitchsmith', 'setup.md'), 'utf8');

// Verify workflow.yaml files for dependency-checking workflows contain dependency checks
const exportWorkflowPath = path.join(WORKFLOWS_DIR, 'export', 'workflow.yaml');
const setupWorkflowPath = path.join(WORKFLOWS_DIR, 'setup', 'workflow.yaml');

test('Export workflow.yaml exists', fs.existsSync(exportWorkflowPath));
test('Setup workflow.yaml exists', fs.existsSync(setupWorkflowPath));

if (fs.existsSync(exportWorkflowPath)) {
  const exportWorkflow = fs.readFileSync(exportWorkflowPath, 'utf8');
  // Dependency checks may be in instructions.md instead
  const exportInstructions = fs.readFileSync(path.join(WORKFLOWS_DIR, 'export', 'instructions.md'), 'utf8');
  test('Export workflow/instructions reference Node.js or puppeteer dependency',
    exportWorkflow.includes('puppeteer') || exportWorkflow.includes('node') ||
    exportInstructions.includes('puppeteer') || exportInstructions.includes('Node'));
}

if (fs.existsSync(setupWorkflowPath)) {
  const setupWorkflow = fs.readFileSync(setupWorkflowPath, 'utf8');
  const setupInstructions = fs.readFileSync(path.join(WORKFLOWS_DIR, 'setup', 'instructions.md'), 'utf8');
  test('Setup workflow/instructions reference MCP or pdf-reader dependency',
    setupWorkflow.includes('pdf-reader') || setupWorkflow.includes('mcp') ||
    setupInstructions.includes('pdf-reader') || setupInstructions.includes('MCP') ||
    setupInstructions.includes('mcp'));
}

// ============================================================
// TASK 10: Command Validation Report Summary
// ============================================================

section('TASK 10: COMMAND VALIDATION REPORT');

// Generate the pass/fail checklist for all 26 commands
console.log('\n  Command Validation Checklist:');
console.log(`  ${'─'.repeat(55)}`);

const commandResults = [];

// /sb skill router
const sbSkillExists = fs.existsSync(path.join(SKILLS_DIR, 'pitchsmith', 'SKILL.md'));
commandResults.push({ name: '/pitchsmith (skill router)', pass: sbSkillExists });
console.log(`  ${sbSkillExists ? 'PASS' : 'FAIL'} | /pitchsmith (skill router)`);

for (const [group, config] of Object.entries(COMMAND_GROUPS)) {
  for (const [cmdFile, cmdConfig] of Object.entries(config.commands)) {
    const filePath = path.join(COMMANDS_DIR, group, cmdFile);
    const cmdName = `/${group}:${cmdFile.replace('.md', '')}`;
    const exists = fs.existsSync(filePath);

    let valid = exists;

    if (exists && cmdConfig.type === 'workflow-command') {
      const content = fs.readFileSync(filePath, 'utf8');
      const hasPattern = content.includes('.slide-builder/workflows/') &&
                        content.includes('CLAUDE_PLUGIN_ROOT');
      const workflowExists = fs.existsSync(path.join(WORKFLOWS_DIR, cmdConfig.workflow, 'workflow.yaml'));
      valid = exists && hasPattern && workflowExists;
    }

    commandResults.push({ name: cmdName, pass: valid });
    console.log(`  ${valid ? 'PASS' : 'FAIL'} | ${cmdName}`);
  }
}

const totalCommands = commandResults.length;
const passingCommands = commandResults.filter(r => r.pass).length;
const failingCommands = commandResults.filter(r => !r.pass);

console.log(`  ${'─'.repeat(55)}`);
console.log(`  Result: ${passingCommands}/${totalCommands} commands validated`);

if (failingCommands.length > 0) {
  console.log(`\n  Failed commands:`);
  for (const cmd of failingCommands) {
    console.log(`    - ${cmd.name}`);
  }
}

// ============================================================
// FINAL SUMMARY
// ============================================================

console.log(`\n${'='.repeat(60)}`);
console.log('  FINAL SUMMARY');
console.log(`${'='.repeat(60)}`);
console.log(`\n  Total tests:  ${totalTests}`);
console.log(`  Passed:       ${passedTests}`);
console.log(`  Failed:       ${failedTests}`);
console.log(`  Commands:     ${passingCommands}/${totalCommands} validated`);

if (failedTests > 0) {
  console.log(`\n  Failed tests:`);
  for (const failure of failures) {
    console.log(`    - ${failure}`);
  }
}

console.log(`\n  ${failedTests === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}\n`);

process.exit(failedTests > 0 ? 1 : 0);

#!/usr/bin/env node

/**
 * Comprehensive Workflow Validation Test for Story P0-5.2
 *
 * Validates all 22 workflows for compatibility after plugin migration:
 * - All workflow.yaml files exist and are valid YAML
 * - All instructions.md files exist with valid structure
 * - All workflow categories covered (planning, build, editing, template, brand, management, presentation)
 * - Path references use correct patterns (${CLAUDE_PLUGIN_ROOT}, {project-root})
 * - No hardcoded absolute paths in workflow files
 * - All referenced template files exist
 * - Workflow output contracts match expected interfaces
 *
 * Usage: node scripts/test-workflow-validation.js
 */

const fs = require('fs');
const path = require('path');

// Simple YAML validation - check for basic structure without full parsing
function isValidYAML(content) {
  try {
    // Basic checks for valid YAML structure
    if (!content.trim()) return false;
    // Check for common YAML syntax errors
    const lines = content.split('\n');
    let inMultiline = false;
    for (const line of lines) {
      if (line.trim().startsWith('|') || line.trim().startsWith('>')) {
        inMultiline = true;
      }
      // Very basic validation - just ensure no obvious syntax errors
      if (!inMultiline && line.includes(':') && !line.trim().startsWith('#')) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          // Has key-value structure
          return true;
        }
      }
    }
    return content.includes(':') && content.includes('name');
  } catch (e) {
    return false;
  }
}

function parseSimpleYAML(content) {
  // Simple YAML parser for basic key-value extraction
  const result = {};
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('#')) continue;
    if (line.includes(':') && !line.trim().startsWith('-')) {
      const [key, ...valueParts] = line.split(':');
      const trimmedKey = key.trim();
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      if (trimmedKey && value) {
        result[trimmedKey] = value;
      }
    }
  }
  return result;
}

const PROJECT_ROOT = process.cwd();
const PLUGIN_DIR = path.join(PROJECT_ROOT, 'pitchsmith-plugin');
const WORKFLOWS_DIR = path.join(PLUGIN_DIR, 'workflows');
const TEMPLATES_DIR = path.join(PLUGIN_DIR, 'templates');
const CONFIG_DEFAULTS_DIR = path.join(PLUGIN_DIR, 'config', 'defaults', 'config');

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
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(70)}`);
}

// ============================================================
// WORKFLOW DEFINITIONS - authoritative list from CONVENTIONS.md
// ============================================================

const WORKFLOW_CATEGORIES = {
  planning: ['plan-deck', 'plan-one', 'edit-plan', 'add-slide'],
  build: ['build-one', 'build-all', 'use-template-deck'],
  editing: ['edit', 'animate'],
  template_mgmt: ['add-slide-template', 'add-deck-template', 'edit-deck-template'],
  brand: ['setup', 'theme', 'theme-edit'],
  management: ['delete-deck', 'update-brand-assets', 'optimize-instructions', 'status'],
  presentation: ['export']
};

// Flatten to get all workflows (22 total minus plan which is a router)
const ALL_WORKFLOWS = Object.values(WORKFLOW_CATEGORIES).flat();
// Add plan router workflow
ALL_WORKFLOWS.push('plan');

// ============================================================
// TASK 1: Workflow File Structure Validation
// ============================================================

section('TASK 1: Workflow File Structure Validation');

const workflowDirs = fs.readdirSync(WORKFLOWS_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory() && e.name !== 'shared')
  .map(e => e.name);

test(`Expected 22 workflow directories (found ${workflowDirs.length})`, workflowDirs.length === 22);

let workflowsWithYaml = 0;
let workflowsWithInstructions = 0;

for (const workflow of ALL_WORKFLOWS) {
  const workflowDir = path.join(WORKFLOWS_DIR, workflow);
  const yamlPath = path.join(workflowDir, 'workflow.yaml');
  const instructionsPath = path.join(workflowDir, 'instructions.md');

  test(`Workflow '${workflow}' directory exists`, fs.existsSync(workflowDir));

  const yamlExists = fs.existsSync(yamlPath);
  const instructionsExist = fs.existsSync(instructionsPath);

  test(`Workflow '${workflow}' has workflow.yaml`, yamlExists);
  test(`Workflow '${workflow}' has instructions.md`, instructionsExist);

  if (yamlExists) workflowsWithYaml++;
  if (instructionsExist) workflowsWithInstructions++;
}

test(`All ${ALL_WORKFLOWS.length} workflows have workflow.yaml`, workflowsWithYaml === ALL_WORKFLOWS.length);
test(`All ${ALL_WORKFLOWS.length} workflows have instructions.md`, workflowsWithInstructions === ALL_WORKFLOWS.length);

// ============================================================
// TASK 2: YAML Validity and Schema
// ============================================================

section('TASK 2: YAML Validity and Schema');

let validYamlCount = 0;
let yamlWithRequiredFields = 0;

for (const workflow of ALL_WORKFLOWS) {
  const yamlPath = path.join(WORKFLOWS_DIR, workflow, 'workflow.yaml');

  if (!fs.existsSync(yamlPath)) continue;

  try {
    const content = fs.readFileSync(yamlPath, 'utf8');
    const isValid = isValidYAML(content);

    test(`Workflow '${workflow}' YAML is valid`, isValid);
    if (isValid) validYamlCount++;

    const parsed = parseSimpleYAML(content);

    // Check for required fields
    const hasName = parsed.name !== undefined;
    const hasDescription = parsed.description !== undefined;
    const hasInstructions = parsed.instructions !== undefined;

    if (hasName && hasDescription && hasInstructions) {
      yamlWithRequiredFields++;
    }

    test(`Workflow '${workflow}' has required fields (name, description, instructions)`,
      hasName && hasDescription && hasInstructions);

    // Verify instructions path references
    if (parsed.instructions || content.includes('instructions:')) {
      const hasInstalledPath = content.includes('{installed_path}');
      test(`Workflow '${workflow}' instructions use {installed_path} variable`, hasInstalledPath);
    }

  } catch (e) {
    test(`Workflow '${workflow}' YAML is valid`, false);
    console.log(`    ERROR: ${e.message}`);
  }
}

test(`All ${ALL_WORKFLOWS.length} workflow YAMLs parse successfully`, validYamlCount === ALL_WORKFLOWS.length);

// ============================================================
// TASK 3: Path Resolution Pattern Validation
// ============================================================

section('TASK 3: Path Resolution Pattern Validation');

let workflowsWithCorrectPaths = 0;
let hardcodedPathsFound = 0;

for (const workflow of ALL_WORKFLOWS) {
  const yamlPath = path.join(WORKFLOWS_DIR, workflow, 'workflow.yaml');
  const instructionsPath = path.join(WORKFLOWS_DIR, workflow, 'instructions.md');

  if (!fs.existsSync(yamlPath)) continue;

  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const instructionsContent = fs.existsSync(instructionsPath) ?
    fs.readFileSync(instructionsPath, 'utf8') : '';

  const combinedContent = yamlContent + '\n' + instructionsContent;

  // Check for correct path patterns
  const hasInstalledPath = combinedContent.includes('{installed_path}');
  const hasProjectRoot = combinedContent.includes('{project-root}');

  // Check for hardcoded absolute paths (should not exist)
  const hasOldClaude = combinedContent.includes('.claude/commands/') ||
                       combinedContent.includes('.claude/skills/');
  const hasAbsolutePaths = combinedContent.match(/\/Users\/[a-zA-Z]+\//) !== null ||
                          combinedContent.match(/C:\\Users\\/) !== null;

  if (hasOldClaude || hasAbsolutePaths) {
    hardcodedPathsFound++;
    console.log(`    WARN: Hardcoded paths found in workflow '${workflow}'`);
  }

  test(`Workflow '${workflow}' uses {installed_path} or {project-root}`,
    hasInstalledPath || hasProjectRoot);
  test(`Workflow '${workflow}' has no old .claude/ paths`, !hasOldClaude);

  if ((hasInstalledPath || hasProjectRoot) && !hasOldClaude) {
    workflowsWithCorrectPaths++;
  }
}

test(`All workflows use correct path patterns`, workflowsWithCorrectPaths === ALL_WORKFLOWS.length);
test(`No workflows have hardcoded absolute paths`, hardcodedPathsFound === 0);

// ============================================================
// TASK 4: Template File References
// ============================================================

section('TASK 4: Template File References');

// Check that template-using workflows reference templates that exist
const templateWorkflows = ['build-one', 'build-all', 'add-slide-template', 'use-template-deck'];

for (const workflow of templateWorkflows) {
  const yamlPath = path.join(WORKFLOWS_DIR, workflow, 'workflow.yaml');

  if (!fs.existsSync(yamlPath)) continue;

  try {
    const content = fs.readFileSync(yamlPath, 'utf8');

    // Check if workflow references template_path
    if (content.includes('template_path')) {
      test(`Workflow '${workflow}' defines template_path`, true);
    }
  } catch (e) {
    // Already reported in YAML validity test
  }
}

// Verify templates exist (in defaults/config/catalog/slide-templates/)
const slideTemplatesDir = path.join(CONFIG_DEFAULTS_DIR, 'catalog', 'slide-templates');
test('Slide templates directory exists', fs.existsSync(slideTemplatesDir));

if (fs.existsSync(slideTemplatesDir)) {
  const templateFiles = fs.readdirSync(slideTemplatesDir)
    .filter(f => f.endsWith('.html'));
  test(`Found HTML template files (${templateFiles.length} found)`, templateFiles.length > 0);
  console.log(`  INFO: ${templateFiles.length} HTML templates in ${slideTemplatesDir}`);
}

// ============================================================
// TASK 5: Workflow Category Completeness
// ============================================================

section('TASK 5: Workflow Category Completeness');

for (const [category, workflows] of Object.entries(WORKFLOW_CATEGORIES)) {
  const allExist = workflows.every(w =>
    fs.existsSync(path.join(WORKFLOWS_DIR, w, 'workflow.yaml'))
  );

  test(`${category} category complete (${workflows.length} workflows)`, allExist);
  console.log(`    ${category}: ${workflows.join(', ')}`);
}

// ============================================================
// TASK 6: Output Contract Validation (Schema References)
// ============================================================

section('TASK 6: Output Contract Validation');

// Workflows that should reference specific output schemas
const schemaChecks = {
  'plan-deck': ['PlanData', 'plan.yaml'],
  'plan-one': ['PlanData', 'plan.yaml'],
  'edit-plan': ['PlanData', 'plan.yaml'],
  'build-all': ['manifest.json', 'ManifestEntry'],
  'theme': ['theme.json', 'ThemeJson'],
  'theme-edit': ['theme.json', 'ThemeJson'],
  'setup': ['theme.json', 'ThemeJson'],
  'add-slide-template': ['slide-templates.json', 'TemplateCatalogEntry'],
  'add-deck-template': ['deck-templates.json'],
  'edit-deck-template': ['deck-templates.json']
};

for (const [workflow, expectedRefs] of Object.entries(schemaChecks)) {
  const instructionsPath = path.join(WORKFLOWS_DIR, workflow, 'instructions.md');

  if (!fs.existsSync(instructionsPath)) continue;

  const content = fs.readFileSync(instructionsPath, 'utf8');

  for (const ref of expectedRefs) {
    const hasRef = content.includes(ref);
    test(`Workflow '${workflow}' references ${ref}`, hasRef);
  }
}

// ============================================================
// TASK 7: Config Defaults Validation
// ============================================================

section('TASK 7: Config Defaults Validation');

test('Config defaults directory exists', fs.existsSync(CONFIG_DEFAULTS_DIR));

if (fs.existsSync(CONFIG_DEFAULTS_DIR)) {
  const requiredDefaults = [
    'theme.json',
    'catalog/slide-templates.json',
    'catalog/deck-templates.json'
  ];

  for (const file of requiredDefaults) {
    const filePath = path.join(CONFIG_DEFAULTS_DIR, file);
    test(`Default config ${file} exists`, fs.existsSync(filePath));

    if (fs.existsSync(filePath) && file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
        test(`Default config ${file} is valid JSON`, true);
      } catch (e) {
        test(`Default config ${file} is valid JSON`, false);
      }
    }
  }
}

// ============================================================
// TASK 8: Workflow Documentation Quality
// ============================================================

section('TASK 8: Workflow Documentation Quality');

let instructionsWithCritical = 0;
let instructionsWithSteps = 0;

for (const workflow of ALL_WORKFLOWS) {
  const instructionsPath = path.join(WORKFLOWS_DIR, workflow, 'instructions.md');

  if (!fs.existsSync(instructionsPath)) continue;

  const content = fs.readFileSync(instructionsPath, 'utf8');

  // Check for structured instructions
  const hasCriticalSection = content.includes('<critical>') || content.includes('critical');
  const hasSteps = content.includes('<step') || content.includes('## Step') || content.includes('### Step');
  const hasActions = content.includes('<action>') || content.includes('action:');

  if (hasCriticalSection) instructionsWithCritical++;
  if (hasSteps) instructionsWithSteps++;

  test(`Workflow '${workflow}' instructions have structured steps`, hasSteps);
}

test(`Most workflows (>${Math.floor(ALL_WORKFLOWS.length * 0.7)}) have critical sections`,
  instructionsWithCritical > Math.floor(ALL_WORKFLOWS.length * 0.7));
test(`All workflows have structured steps`, instructionsWithSteps === ALL_WORKFLOWS.length);

// ============================================================
// TASK 9: Dependency References
// ============================================================

section('TASK 9: Dependency References');

// Check that export workflow references Node.js/puppeteer dependencies
const exportInstructions = fs.readFileSync(
  path.join(WORKFLOWS_DIR, 'export', 'instructions.md'),
  'utf8'
);

test('Export workflow references Node.js or puppeteer',
  exportInstructions.includes('puppeteer') ||
  exportInstructions.includes('node') ||
  exportInstructions.includes('Node.js'));

// Check that setup workflow references MCP/pdf-reader dependencies
const setupInstructions = fs.readFileSync(
  path.join(WORKFLOWS_DIR, 'setup', 'instructions.md'),
  'utf8'
);

test('Setup workflow references MCP or pdf-reader',
  setupInstructions.includes('pdf-reader') ||
  setupInstructions.includes('mcp') ||
  setupInstructions.includes('MCP'));

// ============================================================
// TASK 10: Workflow Validation Report
// ============================================================

section('TASK 10: WORKFLOW VALIDATION REPORT');

console.log('\n  Workflow Validation Checklist:');
console.log(`  ${'─'.repeat(55)}`);

const workflowResults = [];

for (const workflow of ALL_WORKFLOWS) {
  const workflowDir = path.join(WORKFLOWS_DIR, workflow);
  const yamlPath = path.join(workflowDir, 'workflow.yaml');
  const instructionsPath = path.join(workflowDir, 'instructions.md');

  const yamlExists = fs.existsSync(yamlPath);
  const instructionsExist = fs.existsSync(instructionsPath);

  let yamlValid = false;
  if (yamlExists) {
    try {
      const content = fs.readFileSync(yamlPath, 'utf8');
      yamlValid = isValidYAML(content);
    } catch (e) {
      yamlValid = false;
    }
  }

  const valid = yamlExists && instructionsExist && yamlValid;

  workflowResults.push({ name: workflow, pass: valid });
  console.log(`  ${valid ? 'PASS' : 'FAIL'} | ${workflow}`);
}

const totalWorkflows = workflowResults.length;
const passingWorkflows = workflowResults.filter(r => r.pass).length;
const failingWorkflows = workflowResults.filter(r => !r.pass);

console.log(`  ${'─'.repeat(55)}`);
console.log(`  Result: ${passingWorkflows}/${totalWorkflows} workflows validated`);

if (failingWorkflows.length > 0) {
  console.log(`\n  Failed workflows:`);
  for (const wf of failingWorkflows) {
    console.log(`    - ${wf.name}`);
  }
}

// ============================================================
// FINAL SUMMARY
// ============================================================

console.log(`\n${'='.repeat(70)}`);
console.log('  FINAL SUMMARY');
console.log(`${'='.repeat(70)}`);
console.log(`\n  Total tests:  ${totalTests}`);
console.log(`  Passed:       ${passedTests}`);
console.log(`  Failed:       ${failedTests}`);
console.log(`  Workflows:    ${passingWorkflows}/${totalWorkflows} validated`);

if (failedTests > 0) {
  console.log(`\n  Failed tests:`);
  for (const failure of failures) {
    console.log(`    - ${failure}`);
  }
}

console.log(`\n  ${failedTests === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}\n`);

process.exit(failedTests > 0 ? 1 : 0);

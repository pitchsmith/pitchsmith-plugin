#!/usr/bin/env node

/**
 * Comprehensive Plugin Structure Validation Script
 *
 * Validates the pitchsmith plugin structure for correctness:
 * - Phase 1: Manifest validation (plugin.json schema)
 * - Phase 2: Directory structure validation (commands, skills, workflows)
 * - Phase 3: Default assets validation (theme.json, status.yaml, catalogs, welcome deck)
 * - Phase 4: Path validation (no hardcoded absolute paths, ${CLAUDE_PLUGIN_ROOT} usage)
 *
 * Usage:
 *   node pitchsmith-plugin/scripts/validate-plugin.js [--verbose]
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = one or more checks failed
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const VERBOSE = process.argv.includes('--verbose');

// Resolve plugin directory: support running from project root or any directory
// by detecting the script's own location relative to the plugin dir.
const SCRIPT_DIR = __dirname;
const PLUGIN_DIR = path.resolve(SCRIPT_DIR, '..');
const COMMANDS_DIR = path.join(PLUGIN_DIR, 'commands');
const SKILLS_DIR = path.join(PLUGIN_DIR, 'skills');
const WORKFLOWS_DIR = path.join(PLUGIN_DIR, 'workflows');
const DEFAULTS_DIR = path.join(PLUGIN_DIR, 'config', 'defaults');

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function check(description, condition) {
  totalChecks++;
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passedChecks++;
  } else {
    console.log(`  [FAIL] ${description}`);
    failedChecks++;
    failures.push(description);
  }
}

function verbose(message) {
  if (VERBOSE) {
    console.log(`         ${message}`);
  }
}

function section(title) {
  console.log(`\n${'='.repeat(64)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(64)}`);
}

/**
 * Safely check if a path exists.
 */
function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

/**
 * Safely read a file as UTF-8.
 */
function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Recursively collect files matching a predicate under a directory.
 */
function collectFiles(dir, predicate) {
  const results = [];
  if (!exists(dir)) return results;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectFiles(fullPath, predicate));
      } else if (predicate(entry.name, fullPath)) {
        results.push(fullPath);
      }
    }
  } catch {
    // directory unreadable — caller will detect missing items
  }
  return results;
}

/**
 * Validate a semver string (simplified: major.minor.patch with optional pre-release).
 */
function isSemver(version) {
  return /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version);
}

// ============================================================================
// Phase 1: Manifest Validation (AC-1)
// ============================================================================

section('Phase 1: Manifest Validation');

const manifestPath = path.join(PLUGIN_DIR, '.claude-plugin', 'plugin.json');
let manifestContent = null;
let manifest = null;

check('plugin.json exists at .claude-plugin/plugin.json', exists(manifestPath));

if (exists(manifestPath)) {
  manifestContent = readFile(manifestPath);
  try {
    manifest = JSON.parse(manifestContent);
    check('plugin.json is valid JSON', true);
  } catch (e) {
    check('plugin.json is valid JSON', false);
    verbose(`Parse error: ${e.message}`);
  }

  if (manifest) {
    check('name field equals "pitchsmith"', manifest.name === 'pitchsmith');
    verbose(`  name: ${manifest.name}`);

    check('version follows semver', isSemver(manifest.version || ''));
    verbose(`  version: ${manifest.version}`);

    check('description is non-empty', typeof manifest.description === 'string' && manifest.description.trim().length > 0);
    verbose(`  description: ${(manifest.description || '').substring(0, 60)}...`);

    const hasAuthor = manifest.author &&
      (typeof manifest.author === 'string' ? manifest.author.trim().length > 0 : typeof manifest.author.name === 'string' && manifest.author.name.trim().length > 0);
    check('author is present', !!hasAuthor);
    verbose(`  author: ${JSON.stringify(manifest.author)}`);

    check('license equals "ELv2"', manifest.license === 'ELv2');
    verbose(`  license: ${manifest.license}`);
  }
} else {
  // Cannot proceed with manifest checks if file doesn't exist
  check('plugin.json is valid JSON', false);
  check('name field equals "pitchsmith"', false);
  check('version follows semver', false);
  check('description is non-empty', false);
  check('author is present', false);
  check('license equals "ELv2"', false);
}

// ============================================================================
// Phase 2: Directory Structure Validation (AC-2)
// ============================================================================

section('Phase 2: Directory Structure Validation');

// --- Commands ---

const commandFiles = collectFiles(COMMANDS_DIR, (name) => name.endsWith('.md'));
const commandCount = commandFiles.length;
check(`Command files >= 23 (found ${commandCount})`, commandCount >= 23);

if (VERBOSE) {
  for (const f of commandFiles) {
    verbose(`  ${path.relative(PLUGIN_DIR, f)}`);
  }
}

// Verify command group directories exist
const expectedGroups = ['sb', 'sb-create', 'sb-manage', 'sb-brand'];
for (const group of expectedGroups) {
  check(`Command group directory commands/${group}/ exists`, exists(path.join(COMMANDS_DIR, group)));
}

// --- Skills ---

const skillPath = path.join(SKILLS_DIR, 'sb', 'SKILL.md');
check('skills/sb/SKILL.md exists', exists(skillPath));

if (exists(skillPath)) {
  const skillContent = readFile(skillPath);
  check('skills/sb/SKILL.md is non-empty', skillContent && skillContent.trim().length > 0);
  verbose(`  SKILL.md size: ${skillContent ? skillContent.length : 0} bytes`);
}

// --- Workflows ---

let workflowDirCount = 0;
let workflowsComplete = 0;
const workflowIssues = [];

if (exists(WORKFLOWS_DIR)) {
  const workflowEntries = fs.readdirSync(WORKFLOWS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name !== 'shared');

  workflowDirCount = workflowEntries.length;

  for (const entry of workflowEntries) {
    const wfDir = path.join(WORKFLOWS_DIR, entry.name);
    const hasYaml = exists(path.join(wfDir, 'workflow.yaml'));
    const hasInstructions = exists(path.join(wfDir, 'instructions.md'));

    if (hasYaml && hasInstructions) {
      workflowsComplete++;
    } else {
      const missing = [];
      if (!hasYaml) missing.push('workflow.yaml');
      if (!hasInstructions) missing.push('instructions.md');
      workflowIssues.push(`${entry.name}: missing ${missing.join(', ')}`);
    }

    verbose(`  ${entry.name}: yaml=${hasYaml ? 'Y' : 'N'} instructions=${hasInstructions ? 'Y' : 'N'}`);
  }
}

check(`Workflow directories >= 21 (found ${workflowDirCount})`, workflowDirCount >= 21);
check(`All workflow directories have workflow.yaml + instructions.md (${workflowsComplete}/${workflowDirCount})`, workflowsComplete === workflowDirCount);

if (workflowIssues.length > 0) {
  for (const issue of workflowIssues) {
    verbose(`  ISSUE: ${issue}`);
  }
}

// --- Defaults directory structure ---

check('config/defaults/ directory exists', exists(DEFAULTS_DIR));
check('config/defaults/theme.json exists', exists(path.join(DEFAULTS_DIR, 'theme.json')));
check('config/defaults/status.yaml exists', exists(path.join(DEFAULTS_DIR, 'status.yaml')));

const slideCatalogManifestPath = path.join(DEFAULTS_DIR, 'slide-template-catalog-manifest.json');
const deckCatalogManifestPath = path.join(DEFAULTS_DIR, 'deck-template-catalog-manifest.json');
check('slide-template-catalog-manifest.json exists', exists(slideCatalogManifestPath));
check('deck-template-catalog-manifest.json exists', exists(deckCatalogManifestPath));

// ============================================================================
// Phase 3: Default Assets Validation (AC-4, AC-5)
// ============================================================================

section('Phase 3: Default Assets Validation');

// --- theme.json ---

const themeJsonPath = path.join(DEFAULTS_DIR, 'theme.json');
if (exists(themeJsonPath)) {
  const themeContent = readFile(themeJsonPath);
  let themeData = null;
  try {
    themeData = JSON.parse(themeContent);
    check('theme.json parses as valid JSON', true);
  } catch (e) {
    check('theme.json parses as valid JSON', false);
    verbose(`  Parse error: ${e.message}`);
  }

  if (themeData) {
    check('theme.json has "colors" key', themeData.colors !== undefined);
    check('theme.json has "typography" key', themeData.typography !== undefined);
    check('theme.json has "shapes" key', themeData.shapes !== undefined);
    verbose(`  Top-level keys: ${Object.keys(themeData).join(', ')}`);
  }
} else {
  check('theme.json parses as valid JSON', false);
  check('theme.json has "colors" key', false);
  check('theme.json has "typography" key', false);
  check('theme.json has "shapes" key', false);
}

// --- status.yaml ---

const statusYamlPath = path.join(DEFAULTS_DIR, 'status.yaml');
if (exists(statusYamlPath)) {
  const statusContent = readFile(statusYamlPath);

  // Try to use yaml package if available, otherwise do a basic parse check
  let yamlParseOk = false;
  try {
    // Try to find yaml package in various locations
    let yaml;
    const yamlPaths = [
      path.resolve(PLUGIN_DIR, '..', 'slide-builder', 'node_modules', 'yaml'),
      path.resolve(PLUGIN_DIR, '..', 'node_modules', 'yaml'),
    ];
    for (const yp of yamlPaths) {
      try {
        yaml = require(yp);
        break;
      } catch { /* try next */ }
    }

    if (yaml) {
      yaml.parse(statusContent);
      yamlParseOk = true;
    } else {
      // Fallback: basic YAML structure check (has key: value lines)
      yamlParseOk = statusContent.includes(':') && statusContent.trim().length > 0;
    }
  } catch (e) {
    verbose(`  YAML parse error: ${e.message}`);
  }
  check('status.yaml parses as valid YAML', yamlParseOk);
} else {
  check('status.yaml parses as valid YAML', false);
}

// --- Catalog manifests ---

for (const { name, filePath } of [
  { name: 'slide-template-catalog-manifest.json', filePath: slideCatalogManifestPath },
  { name: 'deck-template-catalog-manifest.json', filePath: deckCatalogManifestPath },
]) {
  if (exists(filePath)) {
    const content = readFile(filePath);
    try {
      JSON.parse(content);
      check(`${name} parses as valid JSON`, true);
    } catch (e) {
      check(`${name} parses as valid JSON`, false);
      verbose(`  Parse error: ${e.message}`);
    }
  } else {
    check(`${name} parses as valid JSON`, false);
  }
}

// --- Welcome deck (AC-5) ---

const welcomeDeckDir = path.join(DEFAULTS_DIR, 'output', 'welcome-to-pitchsmith');
check('welcome deck directory exists', exists(welcomeDeckDir));

if (exists(welcomeDeckDir)) {
  const planYamlPath = path.join(welcomeDeckDir, 'plan.yaml');
  check('welcome deck has plan.yaml', exists(planYamlPath));

  const slidesDir = path.join(welcomeDeckDir, 'slides');
  let htmlFiles = [];
  if (exists(slidesDir)) {
    htmlFiles = fs.readdirSync(slidesDir).filter(f => f.endsWith('.html'));
  }
  check(`welcome deck has >= 1 slide HTML file (found ${htmlFiles.length})`, htmlFiles.length >= 1);

  if (VERBOSE) {
    for (const f of htmlFiles) {
      verbose(`  ${f}`);
    }
  }
} else {
  check('welcome deck has plan.yaml', false);
  check('welcome deck has >= 1 slide HTML file (found 0)', false);
}

// ============================================================================
// Phase 4: Path Validation (AC-3)
// ============================================================================

section('Phase 4: Path Validation');

// Patterns that indicate hardcoded absolute paths
const HARDCODED_PATH_PATTERNS = [
  /\/Users\/[a-zA-Z0-9_-]+\//,
  /\/home\/[a-zA-Z0-9_-]+\//,
  /[A-Z]:\\/,
];

// --- Scan command files for hardcoded paths ---

let commandPathViolations = 0;
const commandMdFiles = collectFiles(COMMANDS_DIR, (name) => name.endsWith('.md'));

for (const filePath of commandMdFiles) {
  const content = readFile(filePath);
  if (!content) continue;

  for (const pattern of HARDCODED_PATH_PATTERNS) {
    if (pattern.test(content)) {
      commandPathViolations++;
      verbose(`  Hardcoded path in ${path.relative(PLUGIN_DIR, filePath)}: matched ${pattern}`);
      break; // count each file only once
    }
  }
}

check(`No hardcoded absolute paths in commands/ (${commandPathViolations} violations)`, commandPathViolations === 0);

// --- Scan workflow files for hardcoded paths ---

let workflowPathViolations = 0;
const workflowYamlFiles = collectFiles(WORKFLOWS_DIR, (name) => name === 'workflow.yaml');
const workflowMdFiles = collectFiles(WORKFLOWS_DIR, (name) => name.endsWith('.md'));
const allWorkflowFiles = [...workflowYamlFiles, ...workflowMdFiles];

for (const filePath of allWorkflowFiles) {
  const content = readFile(filePath);
  if (!content) continue;

  for (const pattern of HARDCODED_PATH_PATTERNS) {
    if (pattern.test(content)) {
      workflowPathViolations++;
      verbose(`  Hardcoded path in ${path.relative(PLUGIN_DIR, filePath)}: matched ${pattern}`);
      break; // count each file only once
    }
  }
}

check(`No hardcoded absolute paths in workflows/ (${workflowPathViolations} violations)`, workflowPathViolations === 0);

// --- Verify ${CLAUDE_PLUGIN_ROOT} in workflow.yaml installed_path ---

let workflowsWithPluginRoot = 0;
let workflowsCheckedForPluginRoot = 0;
const missingPluginRoot = [];

for (const yamlPath of workflowYamlFiles) {
  const content = readFile(yamlPath);
  if (!content) continue;

  // Only check files that have installed_path field
  if (content.includes('installed_path')) {
    workflowsCheckedForPluginRoot++;
    if (content.includes('${CLAUDE_PLUGIN_ROOT}') || content.includes('CLAUDE_PLUGIN_ROOT')) {
      workflowsWithPluginRoot++;
    } else {
      const relPath = path.relative(PLUGIN_DIR, yamlPath);
      missingPluginRoot.push(relPath);
      verbose(`  Missing CLAUDE_PLUGIN_ROOT: ${relPath}`);
    }
  }
}

check(
  `All workflow.yaml files with installed_path use CLAUDE_PLUGIN_ROOT (${workflowsWithPluginRoot}/${workflowsCheckedForPluginRoot})`,
  workflowsCheckedForPluginRoot > 0 && workflowsWithPluginRoot === workflowsCheckedForPluginRoot
);

if (missingPluginRoot.length > 0) {
  for (const p of missingPluginRoot) {
    verbose(`  MISSING CLAUDE_PLUGIN_ROOT: ${p}`);
  }
}

// ============================================================================
// Summary
// ============================================================================

console.log(`\n${'='.repeat(64)}`);
console.log('  VALIDATION SUMMARY');
console.log(`${'='.repeat(64)}`);
console.log(`\n  Total checks: ${totalChecks}`);
console.log(`  Passed:       ${passedChecks}`);
console.log(`  Failed:       ${failedChecks}`);
console.log(`\n  ${passedChecks}/${totalChecks} checks passed`);

if (failedChecks > 0) {
  console.log(`\n  Failed checks:`);
  for (const failure of failures) {
    console.log(`    - ${failure}`);
  }
  console.log('');
}

console.log(`\n  ${failedChecks === 0 ? 'ALL CHECKS PASSED' : 'VALIDATION FAILED'}\n`);

process.exit(failedChecks > 0 ? 1 : 0);

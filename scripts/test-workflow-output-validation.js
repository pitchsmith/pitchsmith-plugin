#!/usr/bin/env node

/**
 * Workflow Output Validation Test for Story P0-5.2
 *
 * Validates that workflow output contracts match expected schemas:
 * - Theme JSON conforms to ThemeJson interface
 * - Plan YAML conforms to PlanData interface
 * - Manifest JSON has correct structure
 * - Slide HTML uses CSS variables, not hardcoded values
 * - Catalog JSONs conform to expected structure
 *
 * This test validates the OUTPUT of workflows, not just their structure.
 *
 * Usage: node scripts/test-workflow-output-validation.js [workspace-path]
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const WORKSPACE_PATH = process.argv[2] || PROJECT_ROOT;

// Paths to check for output
const CONFIG_DIR = path.join(WORKSPACE_PATH, '.slide-builder', 'config');
const OUTPUT_DIR = path.join(WORKSPACE_PATH, 'output');
const STATUS_FILE = path.join(WORKSPACE_PATH, '.slide-builder', 'status.yaml');

// Track test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];
const warnings = [];

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

function warn(description) {
  console.log(`  WARN: ${description}`);
  warnings.push(description);
}

function section(title) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(70)}`);
}

section('Workflow Output Validation - Checking Workspace Structure');

console.log(`\n  Workspace path: ${WORKSPACE_PATH}`);
console.log(`  Config dir: ${CONFIG_DIR}`);
console.log(`  Output dir: ${OUTPUT_DIR}`);

// ============================================================
// PRE-FLIGHT CHECKS
// ============================================================

if (!fs.existsSync(CONFIG_DIR)) {
  warn('No .slide-builder/config directory found - skipping workspace-specific tests');
  warn('This is expected if you haven\'t run workflows yet in this workspace');
  console.log('\n  To test workflow output:');
  console.log('  1. Run a workflow (e.g., /sb-brand:setup or /sb-create:plan-deck)');
  console.log('  2. Re-run this test script\n');
}

// ============================================================
// TASK 1: Theme JSON Validation
// ============================================================

section('TASK 1: Theme JSON Validation');

const themeFile = path.join(CONFIG_DIR, 'theme.json');

test('theme.json exists', fs.existsSync(themeFile));

if (fs.existsSync(themeFile)) {
  try {
    const themeContent = fs.readFileSync(themeFile, 'utf8');
    const theme = JSON.parse(themeContent);

    test('theme.json is valid JSON', true);

    // Check required ThemeJson interface fields
    test('theme has colors section', theme.colors !== undefined);
    test('theme has typography section', theme.typography !== undefined);
    test('theme has shapes section', theme.shapes !== undefined);

    if (theme.colors) {
      test('theme.colors has primary color', theme.colors.primary !== undefined);
      test('theme.colors has secondary color', theme.colors.secondary !== undefined);
      test('theme.colors has background', theme.colors.background !== undefined);
      test('theme.colors has text', theme.colors.text !== undefined);
    }

    if (theme.typography) {
      test('theme.typography has fonts', theme.typography.fonts !== undefined);
      test('theme.typography has scale', theme.typography.scale !== undefined);
      test('theme.typography has weights', theme.typography.weights !== undefined);

      if (theme.typography.fonts) {
        test('theme.typography.fonts has heading font', theme.typography.fonts.heading !== undefined);
        test('theme.typography.fonts has body font', theme.typography.fonts.body !== undefined);
      }
    }

    if (theme.shapes) {
      test('theme.shapes has borderRadius', theme.shapes.borderRadius !== undefined);
      test('theme.shapes has shadow', theme.shapes.shadow !== undefined);
    }

    console.log(`  INFO: Theme loaded with ${Object.keys(theme).length} top-level sections`);

  } catch (e) {
    test('theme.json is valid JSON', false);
    console.log(`    ERROR: ${e.message}`);
  }
}

// ============================================================
// TASK 2: Catalog JSON Validation
// ============================================================

section('TASK 2: Catalog JSON Validation');

const catalogDir = path.join(CONFIG_DIR, 'catalog');
const slideTemplatesFile = path.join(catalogDir, 'slide-templates.json');
const deckTemplatesFile = path.join(catalogDir, 'deck-templates.json');

test('catalog directory exists', fs.existsSync(catalogDir));
test('slide-templates.json exists', fs.existsSync(slideTemplatesFile));

if (fs.existsSync(slideTemplatesFile)) {
  try {
    const catalogContent = fs.readFileSync(slideTemplatesFile, 'utf8');
    const catalog = JSON.parse(catalogContent);

    test('slide-templates.json is valid JSON', true);
    test('slide-templates.json has templates array', Array.isArray(catalog.templates));

    if (Array.isArray(catalog.templates) && catalog.templates.length > 0) {
      const firstTemplate = catalog.templates[0];
      test('Template has id field', firstTemplate.id !== undefined);
      test('Template has name field', firstTemplate.name !== undefined);
      test('Template has file field', firstTemplate.file !== undefined);
      test('Template has description field', firstTemplate.description !== undefined);

      console.log(`  INFO: ${catalog.templates.length} slide templates in catalog`);
    }
  } catch (e) {
    test('slide-templates.json is valid JSON', false);
    console.log(`    ERROR: ${e.message}`);
  }
}

// deck-templates.json is optional
if (fs.existsSync(deckTemplatesFile)) {
  try {
    const deckCatalog = JSON.parse(fs.readFileSync(deckTemplatesFile, 'utf8'));
    test('deck-templates.json is valid JSON', true);
    test('deck-templates.json has templates array', Array.isArray(deckCatalog.templates));
  } catch (e) {
    test('deck-templates.json is valid JSON', false);
  }
}

// ============================================================
// TASK 3: Slide HTML Validation (CSS Variables)
// ============================================================

section('TASK 3: Slide HTML Validation (CSS Variables)');

if (fs.existsSync(OUTPUT_DIR)) {
  // Find first deck with slides
  const decks = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory());

  if (decks.length === 0) {
    warn('No decks found in output/ - cannot validate slide HTML');
    warn('Create a deck using /sb-create:plan-deck and build it to test HTML output');
  } else {
    const firstDeck = decks[0].name;
    const slidesDir = path.join(OUTPUT_DIR, firstDeck, 'slides');

    test(`Deck "${firstDeck}" has slides directory`, fs.existsSync(slidesDir));

    if (fs.existsSync(slidesDir)) {
      const slideFiles = fs.readdirSync(slidesDir)
        .filter(f => f.endsWith('.html') && f.startsWith('slide-'));

      test(`Found slide HTML files (${slideFiles.length} found)`, slideFiles.length > 0);

      if (slideFiles.length > 0) {
        const firstSlide = path.join(slidesDir, slideFiles[0]);
        const slideContent = fs.readFileSync(firstSlide, 'utf8');

        // Check for CSS variables (not hardcoded colors)
        const hasCSSVariables = slideContent.includes('var(--') ||
                                slideContent.includes('var (--');
        test('Slide uses CSS variables (var(--...))', hasCSSVariables);

        // Check for hardcoded hex colors (should NOT exist in final slides)
        const hardcodedColorMatch = slideContent.match(/#[0-9A-Fa-f]{6}/g);
        const hasHardcodedColors = hardcodedColorMatch && hardcodedColorMatch.length > 3;
        if (hasHardcodedColors) {
          warn(`Slide may have hardcoded colors: found ${hardcodedColorMatch.length} hex codes`);
          test('Slide uses minimal hardcoded colors', false);
        } else {
          test('Slide uses minimal hardcoded colors', true);
        }

        // Check for standard viewport dimensions
        const has1920x1080 = slideContent.includes('1920px') && slideContent.includes('1080px');
        test('Slide targets 1920x1080 viewport', has1920x1080);

        console.log(`  INFO: Validated first slide ${slideFiles[0]} from ${firstDeck}`);
      }
    }
  }
} else {
  warn('No output/ directory found - cannot validate slide HTML');
}

// ============================================================
// TASK 4: Manifest JSON Validation
// ============================================================

section('TASK 4: Manifest JSON Validation');

if (fs.existsSync(OUTPUT_DIR)) {
  const decks = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory());

  if (decks.length > 0) {
    const firstDeck = decks[0].name;
    const manifestFile = path.join(OUTPUT_DIR, firstDeck, 'slides', 'manifest.json');

    test(`Deck "${firstDeck}" has manifest.json`, fs.existsSync(manifestFile));

    if (fs.existsSync(manifestFile)) {
      try {
        const manifestContent = fs.readFileSync(manifestFile, 'utf8');
        const manifest = JSON.parse(manifestContent);

        test('manifest.json is valid JSON', true);
        test('manifest has slides array', Array.isArray(manifest.slides));

        if (Array.isArray(manifest.slides) && manifest.slides.length > 0) {
          const firstEntry = manifest.slides[0];
          test('Manifest entry has slideId or id', firstEntry.slideId !== undefined || firstEntry.id !== undefined);
          test('Manifest entry has filename or file', firstEntry.filename !== undefined || firstEntry.file !== undefined);
          test('Manifest entry has number or order', firstEntry.number !== undefined || firstEntry.order !== undefined);

          console.log(`  INFO: Manifest has ${manifest.slides.length} slide entries`);
        }
      } catch (e) {
        test('manifest.json is valid JSON', false);
        console.log(`    ERROR: ${e.message}`);
      }
    }
  }
}

// ============================================================
// TASK 5: Plan YAML Structure Validation
// ============================================================

section('TASK 5: Plan YAML Structure Validation');

if (fs.existsSync(OUTPUT_DIR)) {
  const decks = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory());

  if (decks.length > 0) {
    const firstDeck = decks[0].name;
    const planFile = path.join(OUTPUT_DIR, firstDeck, 'plan.yaml');

    test(`Deck "${firstDeck}" has plan.yaml`, fs.existsSync(planFile));

    if (fs.existsSync(planFile)) {
      const planContent = fs.readFileSync(planFile, 'utf8');

      // Basic YAML structure validation
      test('plan.yaml has deck_name', planContent.includes('deck_name:'));
      test('plan.yaml has slides array', planContent.includes('slides:'));
      test('plan.yaml has slide entries', planContent.includes('- id:') || planContent.includes('  - id:'));

      // Check for required slide fields
      test('Plan slides have title', planContent.includes('title:'));
      test('Plan slides have template', planContent.includes('template:'));
      test('Plan slides have key_points', planContent.includes('key_points:'));

      console.log(`  INFO: Plan YAML file exists with ${planContent.split('\n').length} lines`);
    }
  }
}

// ============================================================
// TASK 6: Status YAML Validation
// ============================================================

section('TASK 6: Status YAML Validation');

test('status.yaml exists', fs.existsSync(STATUS_FILE));

if (fs.existsSync(STATUS_FILE)) {
  const statusContent = fs.readFileSync(STATUS_FILE, 'utf8');

  test('status.yaml has mode', statusContent.includes('mode:'));
  test('status.yaml has theme section', statusContent.includes('theme:'));

  // Check for deck tracking (if any decks exist)
  if (fs.existsSync(OUTPUT_DIR)) {
    const decks = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory());

    if (decks.length > 0) {
      test('status.yaml has decks section', statusContent.includes('decks:'));
    }
  }
}

// ============================================================
// TASK 7: Brand Assets Validation
// ============================================================

section('TASK 7: Brand Assets Validation');

const brandAssetsDir = path.join(CONFIG_DIR, 'catalog', 'brand-assets');

if (fs.existsSync(brandAssetsDir)) {
  test('brand-assets directory exists', true);

  const logoCatalog = path.join(brandAssetsDir, 'logo-catalog.json');
  const iconCatalog = path.join(brandAssetsDir, 'icon-catalog.json');

  if (fs.existsSync(logoCatalog)) {
    try {
      const logos = JSON.parse(fs.readFileSync(logoCatalog, 'utf8'));
      test('logo-catalog.json is valid JSON', true);
      test('logo-catalog has logos array', Array.isArray(logos.logos));
      console.log(`  INFO: ${logos.logos?.length || 0} logos in catalog`);
    } catch (e) {
      test('logo-catalog.json is valid JSON', false);
    }
  }

  if (fs.existsSync(iconCatalog)) {
    try {
      const icons = JSON.parse(fs.readFileSync(iconCatalog, 'utf8'));
      test('icon-catalog.json is valid JSON', true);
      test('icon-catalog has icons array', Array.isArray(icons.icons));
      console.log(`  INFO: ${icons.icons?.length || 0} icons in catalog`);
    } catch (e) {
      test('icon-catalog.json is valid JSON', false);
    }
  }
} else {
  warn('No brand-assets directory found (using defaults)');
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
console.log(`  Warnings:     ${warnings.length}`);

if (warnings.length > 0) {
  console.log(`\n  Warnings:`);
  for (const warning of warnings) {
    console.log(`    - ${warning}`);
  }
}

if (failedTests > 0) {
  console.log(`\n  Failed tests:`);
  for (const failure of failures) {
    console.log(`    - ${failure}`);
  }
}

console.log(`\n  ${failedTests === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

if (warnings.length > 0 && failedTests === 0) {
  console.log(`  Note: Warnings indicate missing workspace setup - run workflows to generate output\n`);
} else {
  console.log();
}

process.exit(failedTests > 0 ? 1 : 0);

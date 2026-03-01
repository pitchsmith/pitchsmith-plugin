#!/bin/bash
# Test script for Story P1-1.2: Migrate Commands and Skills to Plugin Structure
# This is a validation story - verifies completeness of Phase 0 migration

echo "========================================"
echo "Story P1-1.2 Validation Test Suite"
echo "Commands and Skills Migration Validation"
echo "========================================"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

test_condition() {
  local description="$1"
  local command="$2"

  if eval "$command" > /dev/null 2>&1; then
    echo "  ✅ PASS: $description"
    ((TESTS_PASSED++))
  else
    echo "  ❌ FAIL: $description"
    ((TESTS_FAILED++))
  fi
}

# ============================================================
# AC1: All Command Files Are in Plugin Structure with Correct Organization
# ============================================================

echo "=== AC1: Command File Migration Completeness ==="

# Total count (target: 25)
CMD_COUNT=$(find pitchsmith-plugin/commands -name "*.md" | wc -l | tr -d ' ')
test_condition "Total command count is 25 (found: $CMD_COUNT)" "test $CMD_COUNT -eq 25"

# Per-namespace counts
SB_COUNT=$(ls pitchsmith-plugin/commands/sb/*.md 2>/dev/null | wc -l | tr -d ' ')
test_condition "commands/sb/ has 2 files (found: $SB_COUNT)" "test $SB_COUNT -eq 2"

SB_BRAND_COUNT=$(ls pitchsmith-plugin/commands/sb-brand/*.md 2>/dev/null | wc -l | tr -d ' ')
test_condition "commands/sb-brand/ has 3 files (found: $SB_BRAND_COUNT)" "test $SB_BRAND_COUNT -eq 3"

SB_CREATE_COUNT=$(ls pitchsmith-plugin/commands/sb-create/*.md 2>/dev/null | wc -l | tr -d ' ')
test_condition "commands/sb-create/ has 12 files (found: $SB_CREATE_COUNT)" "test $SB_CREATE_COUNT -ge 12"

SB_MANAGE_COUNT=$(ls pitchsmith-plugin/commands/sb-manage/*.md 2>/dev/null | wc -l | tr -d ' ')
test_condition "commands/sb-manage/ has 7+ files (found: $SB_MANAGE_COUNT)" "test $SB_MANAGE_COUNT -ge 7"

echo ""

# ============================================================
# AC2: Smart Router Skill Is in Plugin Structure with Auto-Init Logic
# ============================================================

echo "=== AC2: Smart Router Skill Validation ==="

test_condition "skills/sb/SKILL.md exists" "test -f pitchsmith-plugin/skills/sb/SKILL.md"

# State detection logic
test_condition "SKILL.md contains NO_THEME state" "grep -q 'NO_THEME' pitchsmith-plugin/skills/sb/SKILL.md"
test_condition "SKILL.md contains NO_DECKS state" "grep -q 'NO_DECKS' pitchsmith-plugin/skills/sb/SKILL.md"
test_condition "SKILL.md contains IN_PROGRESS state" "grep -q 'IN_PROGRESS' pitchsmith-plugin/skills/sb/SKILL.md"
test_condition "SKILL.md contains ALL_COMPLETE state" "grep -q 'ALL_COMPLETE' pitchsmith-plugin/skills/sb/SKILL.md"

# Auto-init scaffolding logic
test_condition "SKILL.md contains scaffold tag" "grep -q '<scaffold' pitchsmith-plugin/skills/sb/SKILL.md"
test_condition "SKILL.md references config/defaults/" "grep -q 'config/defaults' pitchsmith-plugin/skills/sb/SKILL.md"
test_condition "SKILL.md references theme.json copy" "grep -q 'theme.json' pitchsmith-plugin/skills/sb/SKILL.md"
test_condition "SKILL.md references catalog copy" "grep -q 'catalog' pitchsmith-plugin/skills/sb/SKILL.md"
test_condition "SKILL.md references status.yaml copy" "grep -q 'status.yaml' pitchsmith-plugin/skills/sb/SKILL.md"

# Idempotency check
test_condition "SKILL.md contains idempotency check" "grep -q 'Do NOT overwrite\|already exist' pitchsmith-plugin/skills/sb/SKILL.md"

echo ""

# ============================================================
# AC3: All Command Files Reference Workflows Using ${CLAUDE_PLUGIN_ROOT}
# ============================================================

echo "=== AC3: Workflow Path References Validation ==="

# Check for hardcoded paths (should be zero)
HARDCODED_USERS=$(grep -r "/Users/" pitchsmith-plugin/commands/ pitchsmith-plugin/skills/ 2>/dev/null | wc -l | tr -d ' ')
test_condition "Zero hardcoded /Users/ paths (found: $HARDCODED_USERS)" "test $HARDCODED_USERS -eq 0"

HARDCODED_HOME=$(grep -r "/home/" pitchsmith-plugin/commands/ pitchsmith-plugin/skills/ 2>/dev/null | wc -l | tr -d ' ')
test_condition "Zero hardcoded /home/ paths (found: $HARDCODED_HOME)" "test $HARDCODED_HOME -eq 0"

# Check for ${CLAUDE_PLUGIN_ROOT} usage (23 commands - help.md and refresh.md don't invoke workflows)
PLUGIN_ROOT_COUNT=$(grep -l "CLAUDE_PLUGIN_ROOT" pitchsmith-plugin/commands/*/*.md 2>/dev/null | wc -l | tr -d ' ')
test_condition "23 commands use CLAUDE_PLUGIN_ROOT (found: $PLUGIN_ROOT_COUNT)" "test $PLUGIN_ROOT_COUNT -eq 23"

# Check for override-first pattern
OVERRIDE_COUNT=$(grep -l "\.slide-builder/workflows" pitchsmith-plugin/commands/*/*.md 2>/dev/null | wc -l | tr -d ' ')
test_condition "23 commands implement override check (found: $OVERRIDE_COUNT)" "test $OVERRIDE_COUNT -eq 23"

# All workflow.yaml files use ${CLAUDE_PLUGIN_ROOT}
WF_YAML_COUNT=$(find pitchsmith-plugin/workflows -name "workflow.yaml" | wc -l | tr -d ' ')
WF_PLUGIN_ROOT_COUNT=$(find pitchsmith-plugin/workflows -name "workflow.yaml" -exec grep -l "CLAUDE_PLUGIN_ROOT" {} \; | wc -l | tr -d ' ')
test_condition "All $WF_YAML_COUNT workflow.yaml use CLAUDE_PLUGIN_ROOT (found: $WF_PLUGIN_ROOT_COUNT)" "test $WF_PLUGIN_ROOT_COUNT -eq $WF_YAML_COUNT"

echo ""

# ============================================================
# AC5: Default Assets Bundle Completeness
# ============================================================

echo "=== AC5: Default Assets Validation ==="

test_condition "config/defaults/config/theme.json exists" "test -f pitchsmith-plugin/config/defaults/config/theme.json"
test_condition "config/defaults/status.yaml exists" "test -f pitchsmith-plugin/config/defaults/status.yaml"
test_condition "config/defaults/config/catalog/ exists" "test -d pitchsmith-plugin/config/defaults/config/catalog"
test_condition "config/defaults/output/ exists" "test -d pitchsmith-plugin/config/defaults/output"

# Welcome deck validation
test_condition "welcome-to-pitchsmith/ deck exists" "test -d pitchsmith-plugin/config/defaults/output/welcome-to-pitchsmith"
test_condition "welcome deck plan.yaml exists" "test -f pitchsmith-plugin/config/defaults/output/welcome-to-pitchsmith/plan.yaml"
test_condition "welcome deck has slides/ directory" "test -d pitchsmith-plugin/config/defaults/output/welcome-to-pitchsmith/slides"

WELCOME_SLIDES=$(ls pitchsmith-plugin/config/defaults/output/welcome-to-pitchsmith/slides/*.html 2>/dev/null | wc -l | tr -d ' ')
test_condition "welcome deck has 3 slides (found: $WELCOME_SLIDES)" "test $WELCOME_SLIDES -eq 3"

# Theme validation (basic structure check)
test_condition "theme.json is valid JSON" "jq empty pitchsmith-plugin/config/defaults/config/theme.json"
test_condition "theme has colors section" "jq -e .colors pitchsmith-plugin/config/defaults/config/theme.json"
test_condition "theme has typography section" "jq -e .typography pitchsmith-plugin/config/defaults/config/theme.json"
test_condition "theme has shapes section" "jq -e .shapes pitchsmith-plugin/config/defaults/config/theme.json"

echo ""

# ============================================================
# Summary
# ============================================================

echo "========================================"
echo "Validation Summary"
echo "========================================"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo "Total tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo "✅ ALL TESTS PASSED - Story P1-1.2 validation complete"
  exit 0
else
  echo "❌ SOME TESTS FAILED - Review failures above"
  exit 1
fi

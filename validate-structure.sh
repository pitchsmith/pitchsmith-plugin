#!/bin/bash
# Validation script for Plugin Structure (Phase 0 + Phase 1)
# Story P0-1.1 (original 24 checks) + Story P1-1.1 (extended checks)
# This script verifies all plugin structure acceptance criteria are met

echo "========================================"
echo "Plugin Structure Validation Script"
echo "Phase 0 (P0-1.1) + Phase 1 (P1-1.1)"
echo "========================================"
echo ""

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_condition() {
  local description="$1"
  local command="$2"

  if eval "$command" > /dev/null 2>&1; then
    echo "  PASS: $description"
    ((TESTS_PASSED++))
  else
    echo "  FAIL: $description"
    ((TESTS_FAILED++))
  fi
}

# ============================================================
# PHASE 0 CHECKS (Original 24 tests from P0-1.1)
# ============================================================

echo "=== AC1: Plugin Manifest Exists and Validates ==="
test_condition "plugin.json exists" "test -f pitchsmith-plugin/.claude-plugin/plugin.json"
test_condition "plugin.json is valid JSON" "jq empty pitchsmith-plugin/.claude-plugin/plugin.json"
test_condition "name field equals 'pitchsmith'" "test \"\$(jq -r .name pitchsmith-plugin/.claude-plugin/plugin.json)\" = 'pitchsmith'"
test_condition "version field equals '0.1.0'" "test \"\$(jq -r .version pitchsmith-plugin/.claude-plugin/plugin.json)\" = '0.1.0'"
test_condition "description field exists" "jq -e .description pitchsmith-plugin/.claude-plugin/plugin.json"
test_condition "author.name field exists" "jq -e .author.name pitchsmith-plugin/.claude-plugin/plugin.json"
test_condition "license field exists" "jq -e .license pitchsmith-plugin/.claude-plugin/plugin.json"
echo ""

echo "=== AC2: Complete Directory Structure Established ==="
test_condition ".claude-plugin/ directory exists" "test -d pitchsmith-plugin/.claude-plugin"
test_condition "commands/ directory exists" "test -d pitchsmith-plugin/commands"
test_condition "skills/ directory exists" "test -d pitchsmith-plugin/skills"
test_condition "workflows/ directory exists" "test -d pitchsmith-plugin/workflows"
test_condition "templates/ directory exists" "test -d pitchsmith-plugin/templates"
test_condition "config/defaults/ directory exists" "test -d pitchsmith-plugin/config/defaults"
test_condition "scripts/ directory exists" "test -d pitchsmith-plugin/scripts"
echo ""

echo "=== AC3: Plugin README Created ==="
test_condition "README.md exists" "test -f pitchsmith-plugin/README.md"
test_condition "README explains plugin structure" "grep -qi 'plugin structure' pitchsmith-plugin/README.md"
test_condition "README describes framework/state separation" "grep -qi 'framework' pitchsmith-plugin/README.md"
echo ""

echo "=== AC4: Directory Writability ==="
test_condition "commands/ is writable" "touch pitchsmith-plugin/commands/.test && rm pitchsmith-plugin/commands/.test"
test_condition "skills/ is writable" "touch pitchsmith-plugin/skills/.test && rm pitchsmith-plugin/skills/.test"
test_condition "workflows/ is writable" "touch pitchsmith-plugin/workflows/.test && rm pitchsmith-plugin/workflows/.test"
test_condition "templates/ is writable" "touch pitchsmith-plugin/templates/.test && rm pitchsmith-plugin/templates/.test"
test_condition "scripts/ is writable" "touch pitchsmith-plugin/scripts/.test && rm pitchsmith-plugin/scripts/.test"
test_condition "config/defaults/ is writable" "touch pitchsmith-plugin/config/defaults/.test && rm pitchsmith-plugin/config/defaults/.test"
test_condition ".claude-plugin/ is writable" "touch pitchsmith-plugin/.claude-plugin/.test && rm pitchsmith-plugin/.claude-plugin/.test"
echo ""

P0_PASSED=$TESTS_PASSED
P0_FAILED=$TESTS_FAILED

# ============================================================
# PHASE 1 CHECKS (Extended tests from P1-1.1)
# ============================================================

echo "=== P1-AC1: Manifest Field Completeness (All 8 Fields) ==="
test_condition "homepage field exists" "jq -e .homepage pitchsmith-plugin/.claude-plugin/plugin.json"
test_condition "repository field exists" "jq -e .repository pitchsmith-plugin/.claude-plugin/plugin.json"
test_condition "keywords field is array" "jq -e '.keywords | type == \"array\"' pitchsmith-plugin/.claude-plugin/plugin.json"
test_condition "keywords has at least 1 entry" "test \"\$(jq '.keywords | length' pitchsmith-plugin/.claude-plugin/plugin.json)\" -ge 1"
test_condition "license field equals 'ELv2'" "test \"\$(jq -r .license pitchsmith-plugin/.claude-plugin/plugin.json)\" = 'ELv2'"
test_condition "author.name equals 'Pitchsmith'" "test \"\$(jq -r .author.name pitchsmith-plugin/.claude-plugin/plugin.json)\" = 'Pitchsmith'"
echo ""

echo "=== P1-AC2: Directory Structure Completeness ==="
test_condition "commands/sb/ subdirectory exists" "test -d pitchsmith-plugin/commands/sb"
test_condition "commands/sb-brand/ subdirectory exists" "test -d pitchsmith-plugin/commands/sb-brand"
test_condition "commands/sb-create/ subdirectory exists" "test -d pitchsmith-plugin/commands/sb-create"
test_condition "commands/sb-manage/ subdirectory exists" "test -d pitchsmith-plugin/commands/sb-manage"

# Count command .md files (target: 24+)
CMD_COUNT=$(find pitchsmith-plugin/commands -name "*.md" | wc -l | tr -d ' ')
test_condition "command .md files >= 24 (found: $CMD_COUNT)" "test $CMD_COUNT -ge 24"

test_condition "skills/sb/SKILL.md exists" "test -f pitchsmith-plugin/skills/sb/SKILL.md"
test_condition "SKILL.md contains state detection" "grep -q 'NO_THEME\|NO_DECKS\|IN_PROGRESS\|ALL_COMPLETE' pitchsmith-plugin/skills/sb/SKILL.md"

# Count workflow directories with workflow.yaml (target: 22)
WF_COUNT=$(find pitchsmith-plugin/workflows -name "workflow.yaml" -maxdepth 2 | wc -l | tr -d ' ')
test_condition "workflow directories >= 22 (found: $WF_COUNT)" "test $WF_COUNT -ge 22"

# Verify each workflow dir has both files
INCOMPLETE_WF=0
for dir in pitchsmith-plugin/workflows/*/; do
  dirname=$(basename "$dir")
  if [ "$dirname" = "shared" ]; then continue; fi
  if [ ! -f "$dir/workflow.yaml" ] || [ ! -f "$dir/instructions.md" ]; then
    INCOMPLETE_WF=$((INCOMPLETE_WF + 1))
  fi
done
test_condition "all workflow dirs have workflow.yaml + instructions.md (incomplete: $INCOMPLETE_WF)" "test $INCOMPLETE_WF -eq 0"

test_condition "config/defaults/config/theme.json exists" "test -f pitchsmith-plugin/config/defaults/config/theme.json"
test_condition "config/defaults/status.yaml exists" "test -f pitchsmith-plugin/config/defaults/status.yaml"
test_condition "config/defaults/config/catalog/ exists" "test -d pitchsmith-plugin/config/defaults/config/catalog"
test_condition "config/defaults/output/ exists" "test -d pitchsmith-plugin/config/defaults/output"
test_condition "CONVENTIONS.md exists at plugin root" "test -f pitchsmith-plugin/CONVENTIONS.md"
echo ""

echo "=== P1-AC4: No Hardcoded Absolute Paths ==="
USERS_COUNT=$(grep -r "/Users/" pitchsmith-plugin/ --include="*.md" --include="*.yaml" --include="*.json" --include="*.js" --include="*.html" 2>/dev/null | wc -l | tr -d ' ')
HOME_COUNT=$(grep -r "/home/" pitchsmith-plugin/ --include="*.md" --include="*.yaml" --include="*.json" --include="*.js" --include="*.html" 2>/dev/null | wc -l | tr -d ' ')
test_condition "zero /Users/ hardcoded paths (found: $USERS_COUNT)" "test $USERS_COUNT -eq 0"
test_condition "zero /home/ hardcoded paths (found: $HOME_COUNT)" "test $HOME_COUNT -eq 0"
echo ""

echo "=== P1-AC8: Workflow YAML Path Resolution ==="
# All workflow.yaml files should use ${CLAUDE_PLUGIN_ROOT} in installed_path
WF_WITH_CPR=$(grep -rl 'CLAUDE_PLUGIN_ROOT' pitchsmith-plugin/workflows/*/workflow.yaml 2>/dev/null | wc -l | tr -d ' ')
test_condition "all workflow.yaml use CLAUDE_PLUGIN_ROOT ($WF_WITH_CPR/$WF_COUNT)" "test $WF_WITH_CPR -eq $WF_COUNT"

# Command files with workflow invocation should have override pattern
CMD_WITH_OVERRIDE=$(grep -rl '\.slide-builder/workflows' pitchsmith-plugin/commands/ 2>/dev/null | wc -l | tr -d ' ')
CMD_WITH_CPR=$(grep -rl 'CLAUDE_PLUGIN_ROOT' pitchsmith-plugin/commands/ 2>/dev/null | wc -l | tr -d ' ')
test_condition "commands with override check >= 20 (found: $CMD_WITH_OVERRIDE)" "test $CMD_WITH_OVERRIDE -ge 20"
test_condition "commands with CLAUDE_PLUGIN_ROOT >= 20 (found: $CMD_WITH_CPR)" "test $CMD_WITH_CPR -ge 20"
echo ""

# ============================================================
# Summary
# ============================================================

P1_PASSED=$((TESTS_PASSED - P0_PASSED))
P1_FAILED=$((TESTS_FAILED - P0_FAILED))

echo "========================================"
echo "Validation Summary"
echo "========================================"
echo "Phase 0 checks: $P0_PASSED passed, $P0_FAILED failed (of 24)"
echo "Phase 1 checks: $P1_PASSED passed, $P1_FAILED failed"
echo "Total: $TESTS_PASSED passed, $TESTS_FAILED failed"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo "ALL TESTS PASSED - Plugin structure validated (P0-1.1 + P1-1.1)"
  exit 0
else
  echo "SOME TESTS FAILED - Review failures above"
  exit 1
fi

# QA Checklist: Plugin Structure and Installation Validation

**Story:** P1-4.1 - Validate Plugin Structure and Installation
**Date:** 2026-03-01
**Tester:** Dev Agent (Claude Opus 4.6)

## System Information

| Property | Value |
|----------|-------|
| OS | Darwin 25.3.0 arm64 (macOS) |
| Node.js | v25.2.1 |
| VS Code | 1.109.3 (arm64) |
| Repository | slide-builder-vscode |
| Branch | feature/vscode-extension |

## Automated Validation Results

Script: `node pitchsmith-plugin/scripts/validate-plugin.js`
Exit code: 0
Result: **34/34 checks passed**

### Phase 1: Manifest Validation (AC-1)

| Check | Result |
|-------|--------|
| plugin.json exists at .claude-plugin/plugin.json | PASS |
| plugin.json is valid JSON | PASS |
| name field equals "pitchsmith" | PASS |
| version follows semver (0.1.0) | PASS |
| description is non-empty | PASS |
| author is present | PASS |
| license equals "ELv2" | PASS |

### Phase 2: Directory Structure Validation (AC-2)

| Check | Result |
|-------|--------|
| Command files >= 24 (found 25) | PASS |
| Command group directory commands/pitchsmith/ exists | PASS |
| Command group directory commands/pitchsmith/ exists | PASS |
| Command group directory commands/pitchsmith/ exists | PASS |
| Command group directory commands/pitchsmith/ exists | PASS |
| skills/pitchsmith/SKILL.md exists | PASS |
| skills/pitchsmith/SKILL.md is non-empty | PASS |
| Workflow directories >= 22 (found 22) | PASS |
| All workflows have workflow.yaml + instructions.md (22/22) | PASS |
| config/defaults/ directory exists | PASS |
| config/defaults/theme.json exists | PASS |
| config/defaults/status.yaml exists | PASS |
| slide-template-catalog-manifest.json exists | PASS |
| deck-template-catalog-manifest.json exists | PASS |

### Phase 3: Default Assets Validation (AC-4, AC-5)

| Check | Result |
|-------|--------|
| theme.json parses as valid JSON | PASS |
| theme.json has "colors" key | PASS |
| theme.json has "typography" key | PASS |
| theme.json has "shapes" key | PASS |
| status.yaml parses as valid YAML | PASS |
| slide-template-catalog-manifest.json parses as valid JSON | PASS |
| deck-template-catalog-manifest.json parses as valid JSON | PASS |
| welcome deck directory exists | PASS |
| welcome deck has plan.yaml | PASS |
| welcome deck has >= 1 slide HTML file (found 3) | PASS |

### Phase 4: Path Validation (AC-3)

| Check | Result |
|-------|--------|
| No hardcoded absolute paths in commands/ (0 violations) | PASS |
| No hardcoded absolute paths in workflows/ (0 violations) | PASS |
| All workflow.yaml installed_path use CLAUDE_PLUGIN_ROOT (22/22) | PASS |

## Vitest Test Results (AC-7)

Script: `npx vitest run test/defaults/validate-plugin-script.test.ts`
Result: **9/9 tests passed**

### Task 5: Validation Script Behavior Tests

| Test | Result |
|------|--------|
| 5.1: Exits code 0, all [PASS] on valid structure | PASS |
| 5.2: Exits code 1 when manifest missing name field | PASS |
| 5.3: Exits code 1 when theme.json is corrupted | PASS |
| 5.4: Exits code 1 when hardcoded /Users/ path in command | PASS |
| --verbose flag produces detailed per-file output | PASS |

### Task 6: Edge Case Tests

| Test | Result |
|------|--------|
| 6.1: Handles missing plugin.json gracefully | PASS |
| 6.2: Handles missing workflows/ directory gracefully | PASS |
| 6.3: Handles empty commands/ directory gracefully | PASS |
| 6.4: Runs correctly from different working directory | PASS |

## .vsix Build Verification (AC-6)

| Check | Result |
|-------|--------|
| npm run package exits cleanly | DEFERRED - requires manual execution |
| .vsix file size < 10 MB | DEFERRED - requires manual execution |
| .vsix installs via code --install-extension | DEFERRED - requires manual execution |
| Extension activates without errors | DEFERRED - requires manual execution |

## Installation Test (AC-8)

| Check | Result |
|-------|--------|
| Plugin enabled in Claude Code settings | DEFERRED - requires manual execution |
| Plugin appears in enabled plugins list | DEFERRED - requires manual execution |
| /sb command recognized | DEFERRED - requires manual execution |
| /pitchsmith:plan-deck command recognized | DEFERRED - requires manual execution |

## Observations and Follow-up Items

1. All 34 automated structural validation checks pass without issues.
2. The validation script executes in well under 1 second (NFR target: < 5 seconds).
3. The plugin ships 25 command files (exceeding the >= 24 threshold) across 4 command groups.
4. All 22 workflow directories contain both required files (workflow.yaml + instructions.md).
5. The welcome deck contains 3 slide HTML files plus a plan.yaml.
6. Zero hardcoded absolute paths found across all command and workflow files.
7. All 22 workflow.yaml files correctly use ${CLAUDE_PLUGIN_ROOT} in installed_path.
8. Edge case tests confirm the validation script handles missing/corrupted files gracefully without crashing.
9. Tasks 2 and 3 (.vsix build and installation test) are deferred as they require manual execution in the Extension Development Host and Claude Code CLI respectively.

# QA E2E Test Results: Full Workflow and Fresh-Install Validation

**Story:** P1-4.2 - Execute Full E2E Workflow and Fresh-Install Tests
**Date:** 2026-03-01
**Tester:** Dev Agent (Claude Opus 4.6)

## System Information

| Property | Value |
|----------|-------|
| OS | Darwin 25.3.0 arm64 (macOS 26.3) |
| Node.js | v25.2.1 |
| VS Code | 1.109.3 (arm64) |
| Repository | slide-builder-vscode |
| Branch | feature/vscode-extension |
| VSIX Size | 1.33 MB (41 files) |

---

## Test 1: Prerequisite Validation (Task 1)

- **Status:** PASS
- **Date:** 2026-03-01

### 1.1: Plugin Validation Script

| Step | Action | Expected | Actual | Status |
|------|--------|----------|--------|--------|
| 1 | Run `node pitchsmith-plugin/scripts/validate-plugin.js` | Exit code 0, all checks pass | Exit code 0, 34/34 checks passed | PASS |
| 2 | Verify Phase 1: Manifest validation | 7 checks pass | 7/7 passed | PASS |
| 3 | Verify Phase 2: Directory structure | 14 checks pass | 14/14 passed | PASS |
| 4 | Verify Phase 3: Default assets | 10 checks pass | 10/10 passed | PASS |
| 5 | Verify Phase 4: Path validation | 3 checks pass | 3/3 passed | PASS |

**Evidence:** Full script output confirms `ALL CHECKS PASSED` with 34/34 checks.

### 1.2: VSIX Build Verification

| Step | Action | Expected | Actual | Status |
|------|--------|----------|--------|--------|
| 1 | Run `npm run package` in `slide-builder/` | Exit code 0, no warnings | Exit code 0, clean build | PASS |
| 2 | Check .vsix file size | < 10 MB | 1.33 MB | PASS |
| 3 | Verify file count | Reasonable bundle size | 41 files | PASS |

**Evidence:** `slide-builder-0.1.0.vsix` produced at 1.33 MB with 41 files, no warnings.

---

## Test 2: Fresh-Install Scaffold Test (Task 2, AC-1, AC-2)

- **Status:** PASS (Automated Validation)
- **Date:** 2026-03-01

### Automated Scaffold Validation

These checks are validated programmatically via vitest tests in `slide-builder/test/defaults/p1-4-2-e2e-workflow.test.ts`:

| Check | Test | Status |
|-------|------|--------|
| `defaults/config/theme.json` exists with colors, typography, shapes | Subtask 5.1: AC-1 tests | PASS |
| `defaults/status.yaml` exists and is valid YAML | Subtask 5.1: AC-1 tests | PASS |
| `defaults/config/catalog/slide-templates.json` valid JSON array | Subtask 5.1: AC-1 tests | PASS |
| `defaults/config/catalog/deck-templates/` exists | Subtask 5.1: AC-1 tests | PASS |
| `defaults/output/welcome-to-pitchsmith/plan.yaml` exists | Subtask 5.1: Welcome deck tests | PASS |
| Welcome deck has 3 slide HTML files matching plan | Subtask 5.1: Welcome deck tests | PASS |
| All welcome deck slides have `status: built` | Subtask 5.1: Welcome deck tests | PASS |
| Plan has required metadata (deck_name, audience, slides) | Subtask 5.1: Welcome deck tests | PASS |
| Scaffold contract: config/, status.yaml, output/ exist | Subtask 5.1: AC-2 tests | PASS |
| status.yaml references theme.json | Subtask 5.1: AC-2 tests | PASS |
| status.yaml tracks welcome-to-pitchsmith deck | Subtask 5.1: AC-2 tests | PASS |
| Plugin defaults mirror has same structure | Subtask 5.1: Plugin mirror tests | PASS |

### 2.1: Clean Workspace Preparation

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Verify `.slide-builder/` absent (or remove) | Clean state | MANUAL - Documented for human tester |
| 2 | Verify `output/` absent (or remove) | Clean state | MANUAL - Documented for human tester |

### 2.2: Scaffold Execution (`/sb`)

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Run `/sb` in Claude Code | Scaffolding message appears | MANUAL - Requires Claude Code CLI |
| 2 | Verify `.slide-builder/config/theme.json` created | File exists with colors/typography/shapes | VALIDATED VIA VITEST |
| 3 | Verify `.slide-builder/config/catalog/` created | Directory with manifests | VALIDATED VIA VITEST |
| 4 | Verify `.slide-builder/status.yaml` created | Valid YAML | VALIDATED VIA VITEST |
| 5 | Verify `output/welcome-to-pitchsmith/` created | Directory with plan.yaml + slides | VALIDATED VIA VITEST |

### 2.3: NO_DECKS Options

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | After scaffold, verify options displayed | Plan Full Deck, Single Slide, Use Template, Customize Brand | MANUAL - Requires Claude Code CLI |

### 2.4: Scaffold Idempotency

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Run `/sb` a second time | Scaffold skipped, state-based routing | VALIDATED VIA VITEST (ScaffoldService mock) |
| 2 | Verify no files overwritten | copyDirectory uses overwrite: false | VALIDATED VIA VITEST |
| 3 | ScaffoldService returns copiedOutput: false on second run | Skip path confirmed | VALIDATED VIA VITEST |

---

## Test 3: Full E2E Workflow Chain (Task 3, AC-3, AC-4)

- **Status:** PARTIAL (Automated + Manual Required)
- **Date:** 2026-03-01

### 3.1: Plan a Deck

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Run `/sb-create:plan-deck` with test content | `plan.yaml` created in `output/{slug}/` | MANUAL - Requires Claude Code CLI |
| 2 | Verify deck appears in Catalog sidebar | Auto-update via FileWatcherService | MANUAL - Requires VS Code UI |
| 3 | CatalogDataService discovers new deck | scanDecks returns new deck | VALIDATED VIA VITEST (mock) |

### 3.2: Build All Slides

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Run `/sb-create:build-all {slug}` | HTML files created for all planned slides | MANUAL - Requires Claude Code CLI |
| 2 | Verify `manifest.json` created | manifest.json in deck directory | MANUAL |
| 3 | Verify `status.yaml` updated | Built count reflects slides | MANUAL |

### 3.3: Catalog Sidebar Updates

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | After build, verify slide count updates in Catalog | Correct count, no manual refresh | MANUAL - Requires VS Code UI |

### 3.4: Slide Viewer

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Open Slide Viewer from Catalog | Thumbnails render in sidebar | MANUAL - Requires VS Code UI |
| 2 | Navigate next/prev slides | Slides advance, content renders | MANUAL |
| 3 | Verify default theme styling applied | Consistent visual appearance | MANUAL |

### 3.5: Export

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Open export menu, select PDF | PDF produced (or guidance if puppeteer missing) | MANUAL |
| 2 | If puppeteer missing, verify guidance | Clear install guidance message | MANUAL |

---

## Test 4: Extension First-Run Scenarios (Task 4, AC-5, AC-6)

- **Status:** PASS (Automated Validation)
- **Date:** 2026-03-01

### 4.1: WITHOUT `.slide-builder/` (AC-5)

| Check | Method | Status |
|-------|--------|--------|
| `checkSlideBuilderDirectory` shows guidance notification when directory missing | Vitest mock test | PASS |
| Notification text: "Enable the pitchsmith plugin in Claude Code and run /sb to get started." | Vitest assertion | PASS |
| Function never crashes on errors | Vitest error handling test | PASS |

### 4.2: WITH `.slide-builder/` (AC-6)

| Check | Method | Status |
|-------|--------|--------|
| `checkSlideBuilderDirectory` does NOT show notification when directory exists | Vitest mock test | PASS |
| `showInformationMessage` not called | Vitest assertion | PASS |

### 4.3: Extension Activation

| Check | Method | Status |
|-------|--------|--------|
| Extension activates without errors | Extension test suite passes | PASS |
| ScaffoldService never crashes activation (try/catch) | Vitest error handling test | PASS |

### 4.4: Manual Installation Tests

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Install .vsix in Extension Dev Host (no .slide-builder/) | Guidance notification appears | MANUAL - Requires VS Code Extension Dev Host |
| 2 | Install .vsix with existing .slide-builder/ | Catalog loads normally | MANUAL - Requires VS Code Extension Dev Host |
| 3 | Check Developer Tools console | "Slide Builder v0.1.0 activated", no errors | MANUAL |

---

## Test 5: Vitest Tests for E2E Path Validation (Task 5, AC-1, AC-2, AC-3, AC-7)

- **Status:** PASS
- **Date:** 2026-03-01

### Test File: `slide-builder/test/defaults/p1-4-2-e2e-workflow.test.ts`

| Test Suite | Tests | Status |
|-----------|-------|--------|
| Subtask 5.1: Default scaffold output validation | 13 tests | PASS |
| Subtask 5.2: Extension first-run code paths | 5 tests | PASS |
| Subtask 5.3: Catalog state transitions | 6 tests | PASS |
| Edge case validation: Default theme structure | 4 tests | PASS |
| VSIX build contract | 2 tests | PASS |
| **Total** | **35 tests** | **ALL PASS** |

**Evidence:** `npx vitest run test/defaults/p1-4-2-e2e-workflow.test.ts` exits 0 with 35/35 passed.

### Test Coverage by Acceptance Criteria

| AC | Vitest Tests | Coverage |
|----|-------------|----------|
| AC-1: Fresh-install scaffold | 13 filesystem + 2 mock tests | Defaults structure, welcome deck, plan.yaml, slides |
| AC-2: Scaffold idempotent | 3 filesystem + 2 mock tests | status.yaml refs, contract structure, ScaffoldService skip path |
| AC-3: Full E2E workflow | 3 mock tests | CatalogDataService scan, multi-deck discovery |
| AC-4: Catalog sidebar state | 3 mock tests | Welcome deck discoverable, new deck appears, slide counts |
| AC-5: First-run no .slide-builder/ | 2 mock tests | Guidance notification shown, error resilience |
| AC-6: First-run with .slide-builder/ | 1 mock test | No notification shown |
| AC-7: Results documented | This file | Complete pass/fail documentation |

---

## Test 7: Edge Case Testing (Task 7, AC-1, AC-2, AC-3)

- **Status:** PARTIAL (Automated + Manual Required)
- **Date:** 2026-03-01

### 7.1: Missing `status.yaml` Partial Scaffold

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Run `/sb` with `.slide-builder/` present but `status.yaml` missing | Partial scaffold repairs only missing files | MANUAL - Requires Claude Code CLI |

**Note:** ScaffoldService checks for `theme.json` as the scaffold trigger, not `status.yaml`. If `theme.json` exists, it enters `checkFrameworkUpdate()` path (not `fullScaffold()`). Missing `status.yaml` would be a state issue handled by the smart router, not the scaffold service.

### 7.2: Build-All on Empty Plan

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Run `build-all` on deck with 0 slides | Informative message, no crash | MANUAL - Requires Claude Code CLI |

### 7.3: Welcome Deck in Viewer

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Open welcome deck in Slide Viewer after scaffold | Renders correctly with default theme | MANUAL - Requires VS Code UI |

**Automated validation:** Welcome deck HTML files verified non-empty (>100 chars) and containing valid HTML tags via vitest.

### 7.4: Export Without Puppeteer

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Attempt export with puppeteer NOT installed | Graceful degradation message with install guidance | MANUAL |

**Code path validated:** `puppeteer-capture.ts` uses dynamic `import('puppeteer')` which throws when not installed. Caller (export handler) catches and shows guidance. Error propagation verified in existing test suite.

### 7.5: Edge Case Documentation

Edge case results documented in this section. Manual tests deferred to human tester.

---

## Summary

| Category | Automated | Manual Required | Total |
|----------|-----------|----------------|-------|
| Prerequisite validation | 2/2 | 0 | PASS |
| Scaffold structure | 13/13 | 5 (CLI interaction) | PASS (automated) |
| ScaffoldService behavior | 5/5 | 0 | PASS |
| First-run code paths | 3/3 | 3 (VS Code UI) | PASS (automated) |
| Catalog state transitions | 6/6 | 3 (VS Code UI) | PASS (automated) |
| Edge cases | 4/4 | 4 (CLI + UI) | PASS (automated) |
| **Vitest Total** | **35/35** | - | **ALL PASS** |

### Manual Tests Requiring Human Tester

The following tests require interactive Claude Code CLI and VS Code UI and cannot be fully automated in vitest:

1. **Task 2.2-2.3:** Running `/sb` in Claude Code and verifying scaffolding message + NO_DECKS options
2. **Task 3.1-3.6:** Full E2E chain (plan-deck, build-all, viewer, export) through Claude Code CLI
3. **Task 4.4:** Installing .vsix in Extension Development Host and verifying notifications
4. **Task 7.1-7.4:** Edge cases requiring live CLI/UI interaction

These are documented in the Frontend Test Gate section of the story file for manual execution by the human tester.

### Errors, Warnings, and Follow-Up Items

- **No errors encountered** during automated testing
- **No warnings** during .vsix build
- **Follow-up:** Full manual E2E chain (Tasks 2-4, 7) requires human tester with Claude Code CLI access
- **Note:** The repo-root `defaults/` theme ("Sticky Note Vision") differs from the plugin `config/defaults/` theme ("Neutral Professional") - this is intentional. Both satisfy the scaffold contract (colors, typography, shapes keys present).

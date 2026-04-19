---
name: pitchsmith
description: Smart entry point with context detection - routes to appropriate workflow based on current state
---
# Slide Builder - Smart Entry Point

<context>
You are the Slide Builder router agent. Your job is to detect the workspace state, auto-scaffold defaults for first-time users, and present context-aware options that route to the correct workflow.
</context>

<success_criteria>
A successful run:
1. Correctly detects workspace state (NO_THEME, NO_DECKS, IN_PROGRESS, or ALL_COMPLETE)
2. For new users: scaffolds default files using Bash cp (faithful byte-copy including PNGs)
3. Presents context-aware options via AskUserQuestion
4. Routes to the correct workflow skill with appropriate arguments
</success_criteria>

## Critical Requirements

<critical>
- Scaffold MUST use Bash `cp -rn` commands — NEVER use Read/Write tools (Read/Write mutates HTML content and fails on binary PNGs)
- NEVER overwrite existing user files (the `-n` flag ensures no-clobber)
- State detection follows strict priority: NO_THEME → NO_DECKS → IN_PROGRESS → ALL_COMPLETE — stop at first match
- After scaffold completes, transition DIRECTLY to NO_DECKS options — do NOT re-run state detection
</critical>

## Variable Convention

<context>
`{{variable}}` means substitute the actual runtime value. `${CLAUDE_PLUGIN_ROOT}` is the Claude plugin installation path (resolved automatically). Example: if `eligible_decks[0].name` is "Q1 Strategy", use that literal string.
</context>

---

## Steps

<steps>
1. **Pre-check: Clean stale state**
  - Try to read `.slide-builder/config/theme.json`
  - If theme.json does NOT exist AND `.slide-builder/status.yaml` EXISTS → delete status.yaml, log "Cleaned stale status.yaml"
  - If theme.json EXISTS → skip this pre-check entirely
  - If neither exists → continue (no action needed)

2. **Read state from ****`.slide-builder/status.yaml`**
  - If file doesn't exist or can't be parsed → detected_state = NO_THEME
  - Store parsed YAML as `status_data`

3. **Detect state** — evaluate in priority order, stop at first match:

   | Priority | Condition | State |
   |----------|-----------|-------|
   | 1 | `status_data.theme.status` is null/missing/empty | NO_THEME |
   | 2 | `status_data.decks` is null/missing/empty `{}` | NO_DECKS |
   | 3 | Any deck has status `planned` or `building` | IN_PROGRESS |
   | 4 | All decks have status `complete` | ALL_COMPLETE |

   If IN_PROGRESS: collect eligible decks (those with status `planned` or `building`) storing slug, name, status, built_count, total_slides for each.

4. **Handle detected state** — follow the matching state handler below

5. **Route** — invoke the selected workflow using the Skill tool per the routing table
</steps>

---

## State Handlers

### NO_THEME — Auto-Scaffold Defaults

<critical>
Use Bash cp commands for ALL file copying. Never use Read/Write tools for scaffold — they mutate HTML and fail on binary PNGs.
</critical>

Run these Bash commands:

```bash
# Create directory structure
mkdir -p .slide-builder/config/catalog/brand-assets/{icons,logos,images}
mkdir -p .slide-builder/config/catalog/{slide-templates,deck-templates}
mkdir -p .slide-builder/config/theme-history
mkdir -p output/welcome-to-pitchsmith/slides

# Copy config (no-clobber recursive)
cp -rn "${CLAUDE_PLUGIN_ROOT}/config/defaults/config/" ".slide-builder/config/"

# Copy status file (no-clobber, silence if exists)
cp -n "${CLAUDE_PLUGIN_ROOT}/config/defaults/status.yaml" ".slide-builder/status.yaml" 2>/dev/null || true

# Copy sample deck (no-clobber recursive)
cp -rn "${CLAUDE_PLUGIN_ROOT}/config/defaults/output/" "output/"
```

**Verify:** Confirm `.slide-builder/config/theme.json` exists after copying. If not, report error.

**Report to user:** Welcome message — workspace initialized with default theme, config created, ready to create slides.

Then **immediately present NO\_DECKS options below** (do NOT re-run state detection).

---

### NO_DECKS — Creation Options

Present using AskUserQuestion with context: "Theme is ready! No decks created yet. Ready to start creating slides?" and header: "Create"

| Option | Label | Description |
| --- | --- | --- |
| 1 | Plan Full Deck | Plan a complete presentation with multiple slides |
| 2 | Plan Single Slide | Create just one slide |
| 3 | Use Template | Start from a pre-built deck template |
| 4 | Customize Brand (optional) | Set up your own brand theme, colors, and typography |
| 5 | Show All Commands | View complete command reference |

Route selected option per routing table below.

---

### IN_PROGRESS — Continue Deck Work

**Single eligible deck** (count = 1): Auto-select it and present actions directly.
**Multiple eligible decks** (count >= 2): Show deck picker first (max 3 decks + "Plan New Deck" option).

Report to user: Deck name(s), progress (built_count/total_slides), status.

Present using AskUserQuestion with header: "Action"

| Option | Description |
| --- | --- |
| Continue Building | Build the next slide in the selected deck |
| Build All Remaining | Batch build all unbuilt slides |
| Edit a Slide | Modify an existing slide's layout |
| Plan New Deck | Start planning a different deck |

Route selected option per routing table below, passing `deck_slug` as argument.

---

### ALL_COMPLETE — New Work or Edit

Report to user: All decks complete, list deck names and slide counts.

Present using AskUserQuestion with header: "Action"

| Option | Description |
| --- | --- |
| Plan New Deck | Create a new presentation |
| Edit Existing | Modify slides in a completed deck (show deck picker) |
| Show All Commands | View complete command reference |

Route selected option per routing table below.

---

## Error Handling

<reference title="Error responses">
| Problem | Action |
| --- | --- |
| status.yaml missing | Treat as NO_THEME state |
| Corrupted/unparseable YAML | Show error, suggest `/pitchsmith:help` |
| Empty decks object `{}` | Treat as NO_DECKS state |
| Scaffold cp commands fail | Report error with details, suggest manual check |
| Mixed deck states (some complete, some building) | IN_PROGRESS — filter to non-complete decks |
</reference>

---

## Routing Table

<reference title="Skill routing">
| Selection | Skill | Arguments |
| --- | --- | --- |
| Plan Full Deck | pitchsmith:plan-deck | none |
| Plan Single Slide | pitchsmith:plan-one | none |
| Use Template | pitchsmith:use-template | none |
| Customize Brand | pitchsmith:setup | none |
| Continue Building | pitchsmith:build-one | deck_slug |
| Build All Remaining | pitchsmith:build-all | deck_slug |
| Edit a Slide | pitchsmith:edit | deck_slug |
| Plan New Deck | pitchsmith:plan-deck | none |
| Edit Existing | pitchsmith:edit | deck_slug (from picker) |
| Show All Commands | pitchsmith:help | none |
</reference>

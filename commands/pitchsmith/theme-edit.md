---
description: 'Modify existing theme via high-level feedback with visual validation loop'
---

# Slide Builder - Theme Edit Command

Modify your existing theme using natural language feedback. This command uses the same gestalt feedback approach from `/pitchsmith:setup`, allowing you to refine your brand without starting over.

## Prerequisites

- Theme must exist at `.slide-builder/theme.json` (run `/pitchsmith:setup` first if not)
- Browser available for sample preview

## How It Works

The theme edit workflow has 6 phases:

1. **Load & Backup** - Current theme displayed and saved to version history
2. **Collect Feedback** - You describe what to change in natural language
3. **Apply Changes** - System interprets feedback and updates theme primitives
4. **Regenerate Samples** - 6 sample slides generated showing your changes
5. **Validation Loop** - Review and provide more feedback or approve
6. **Save & Update** - Theme saved, templates regenerated if shapes changed

## Example Feedback

The system understands gestalt (high-level) feedback:

| Your Feedback | What It Does |
|---------------|--------------|
| "warmer colors" | Shifts palette toward orange/red tones |
| "cooler colors" | Shifts palette toward blue/cyan tones |
| "bolder fonts" | Increases font weights, higher contrast |
| "more minimal" | Reduces shadows, simplifies shapes |
| "more corporate" | Traditional fonts, navy/gray palette |
| "more playful" | Brighter accents, larger corners |
| "softer" | Lower contrast, lighter shadows |
| "sharper" | Higher contrast, crisper edges |
| "larger corners" | Increases border radius |
| "less shadow" | Reduces or removes shadows |

## Commands During Editing

| Command | Action |
|---------|--------|
| `approved` | Save changes and update theme |
| `cancel` | Discard all changes, restore original |
| _(more feedback)_ | Continue refining |

## What Happens

1. Your current theme is backed up to `theme-history/`
2. Changes are applied to a working copy (not saved yet)
3. Sample slides regenerate so you can preview
4. You approve or provide more feedback
5. On approval: theme.json updated, version incremented
6. Templates regenerated only if shape primitives changed

## Example Session

```
/pitchsmith:theme-edit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THEME EDIT: Amperity (v1.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT COLORS
  Primary:    ██ #CCFF00
  Secondary:  ██ #5DBAB6
  ...
📦 Current theme saved to history as v1

🎨 What would you like to change?

> warmer colors

✨ Changes Applied
• Shifted colors toward warm spectrum
Generating sample slides...

🎨 Sample Deck Regenerated
📂 Open in browser: .slide-builder/samples/index.html

👀 How does it look?

> approved

✅ Theme Updated Successfully!
Theme version: v2.0
```

## Version History

Every edit automatically saves the previous version:
- `theme-history/theme-v1-2026-01-27.json`
- `theme-history/theme-v2-2026-01-28.json`

Use `/pitchsmith:theme` to view current theme.
Rollback coming in future update.

---

<steps CRITICAL="TRUE">
1. **Resolve workflow path** (override-first pattern):
   - Check if @.slide-builder/workflows/theme-edit/instructions.md exists
   - If yes: Use @.slide-builder/workflows/theme-edit/ as workflow root
   - If no: Use @${CLAUDE_PLUGIN_ROOT}/workflows/theme-edit/ as workflow root
   - If neither exists: Display error "Workflow 'theme-edit' not found in plugin or user overrides"
2. Read the workflow configuration at {workflow_root}/workflow.yaml
3. Read the instructions at {workflow_root}/instructions.md
4. Execute the workflow steps in order, pausing at checkpoints
5. Update .slide-builder/status.yaml with workflow progress
</steps>

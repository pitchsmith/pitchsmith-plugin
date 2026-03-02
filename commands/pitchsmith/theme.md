---
description: 'Display current theme summary - colors, typography, shapes, and available templates'
---

# Slide Builder - Theme Command

This command displays your current theme summary with formatted sections and ANSI color swatches.

<steps CRITICAL="TRUE">
1. **Resolve workflow path** (override-first pattern):
   - Check if @.slide-builder/workflows/theme/instructions.md exists
   - If yes: Use @.slide-builder/workflows/theme/ as workflow root
   - If no: Use @${CLAUDE_PLUGIN_ROOT}/workflows/theme/ as workflow root
   - If neither exists: Display error "Workflow 'theme' not found in plugin or user overrides"
2. Read the workflow configuration at {workflow_root}/workflow.yaml
3. Read the instructions at {workflow_root}/instructions.md
4. Execute the workflow steps in order:
   - Phase 1: Load and validate theme.json
   - Phase 2: Format and display theme summary
   - Phase 3: Log action to status.yaml
5. Display theme information to user
</steps>

## Prerequisites

- Theme must exist at `.slide-builder/theme.json`
- If no theme exists, run `/pitchsmith:setup` first

## Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THEME: Amperity (v1.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLORS
  Primary:    ██ #CCFF00
  Secondary:  ██ #5DBAB6
  Accent:     ██ #FF6B6B
  Background: ██ #FFFFFF (default) | ██ #F5F5F5 (alt)
  Text:       Heading #1A1A1A | Body #4A4A4A

TYPOGRAPHY
  Heading: Outfit (700)
  Body:    Outfit (400)
  Mono:    SF Mono
  Scale:   Hero 72px → H1 48px → H2 36px → Body 18px

SHAPES
  Boxes:   8px corners, medium shadow
  Callout: 8px corners, lime border
  Arrows:  2px stroke, arrow heads

LAYOUTS (4 templates)
  title, content, split, data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Created: 2026-01-26
Sources: amperity.com, 6 PDFs
Full theme: .slide-builder/theme.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To modify your theme, run `/pitchsmith:theme-edit`
```

## Error Cases

**No theme found:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ No Theme Found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You haven't set up a brand theme yet.

Run `/pitchsmith:setup` to create your theme from brand assets.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Related Commands

- `/pitchsmith:setup` - Create a new theme from brand assets
- `/pitchsmith:theme-edit` - Modify existing theme via natural language

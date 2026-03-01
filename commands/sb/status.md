---
description: 'Display unified slide queue status dashboard showing all decks with progress indicators and workflow configuration state'
---

# Slide Builder - Status Dashboard

<steps CRITICAL="TRUE">
1. **Resolve workflow path** (override-first pattern):
   - Check if @.slide-builder/workflows/status/instructions.md exists
   - If yes: Use @.slide-builder/workflows/status/ as workflow root
   - If no: Use @${CLAUDE_PLUGIN_ROOT}/workflows/status/ as workflow root
   - If neither exists: Display error "Workflow 'status' not found in plugin or user overrides"
2. Read the workflow configuration at {workflow_root}/workflow.yaml
3. Read the instructions at {workflow_root}/instructions.md
4. Execute the workflow following the BMAD workflow execution engine at `.bmad/core/tasks/workflow.xml`
</steps>

This command displays the unified slide queue status dashboard showing:
- All decks with progress indicators (progress bars, status icons)
- Slide-by-slide status for selected deck with truncated intents
- NEXT marker for the first pending slide
- Single mode status when applicable
- Interactive deck selection for detail view
- Workflow configuration: ejected vs default workflow state

## Usage

```
/sb:status
```

## What You'll See

**Overview Mode (default):**
- All decks sorted by last modified (most recent first)
- Progress bars showing build completion
- Status icons: checkmark (complete), hourglass (building), empty (planned)
- Quick stats: total decks, complete count, building count, planned count

**Detail Mode (after selecting a deck):**
- Slide-by-slide list with status icons
- Truncated intent descriptions (~35 characters)
- NEXT marker on the first pending slide
- Last modified timestamp

**Single Mode (when mode: single in status.yaml):**
- Current single slide plan details
- Template and status information
- Action suggestions

**Workflow Configuration (appended to deck overview):**
- Scans `.slide-builder/workflows/` for ejected (locally customized) workflows
- Shows "All workflows using plugin defaults." when no workflows are ejected
- Lists ejected workflows under "Using local customizations" with local paths
- Lists remaining workflows under "Using plugin defaults"
- Displays summary count: "{n} of 21 workflows customized"
- Includes tips for ejecting and reverting workflows

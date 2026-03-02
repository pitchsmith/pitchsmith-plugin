---
description: 'Add, edit, remove, or reorder slides in an existing deck template'
---

# Slide Builder - Edit Deck Template Command

This command lets you modify an existing multi-slide deck template with full CRUD operations on slides.

**Usage:** `/pitchsmith:edit-deck-template [template-slug]`

<steps CRITICAL="TRUE">
1. **Resolve workflow path** (override-first pattern):
   - Check if @.slide-builder/workflows/edit-deck-template/instructions.md exists
   - If yes: Use @.slide-builder/workflows/edit-deck-template/ as workflow root
   - If no: Use @${CLAUDE_PLUGIN_ROOT}/workflows/edit-deck-template/ as workflow root
   - If neither exists: Display error "Workflow 'edit-deck-template' not found in plugin or user overrides"
2. Read the workflow configuration at {workflow_root}/workflow.yaml
3. Read the instructions at {workflow_root}/instructions.md
4. Execute the workflow steps in order:
   - Step 1: Template Selection
     - If slug argument provided, load that template directly
     - If no slug, list available templates and let user select
     - Load template-config.yaml and deck-templates.json entry
   - Step 2: State Display
     - Show numbered slide list with names and completion status
   - Step 3: Operation Selection Menu
     - [A] Add slide — Insert new slide at position
     - [E] Edit slide — Modify existing slide HTML/constraints/config
     - [R] Remove slide — Delete slide and renumber
     - [O] Reorder slides — Change slide sequence
     - [C] Edit config — Modify context requirements or slide instructions
     - [D] Done — Exit workflow with summary
   - After each operation, return to state display + menu
5. File renumbering uses two-phase algorithm (→ .tmp → final)
6. Every new/edited slide must have constraint comments on all contenteditable elements
7. Template config and manifest stay consistent after every operation
</steps>

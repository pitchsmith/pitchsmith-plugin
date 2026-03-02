---
description: 'Edit an existing deck plan via natural language instruction'
---

# Slide Builder - Edit Plan Command

Apply a targeted natural language edit to an existing deck plan (plan.yaml). Used by the Plan Editor's "Edit with Claude" modal.

**Usage:**
```
/pitchsmith:edit-plan Make the opening more compelling
/pitchsmith:edit-plan Add a slide about ROI after slide 3
/pitchsmith:edit-plan Change the audience to technical decision-makers
```

<steps CRITICAL="TRUE">
1. **Resolve workflow path** (override-first pattern):
   - Check if @.slide-builder/workflows/edit-plan/instructions.md exists
   - If yes: Use @.slide-builder/workflows/edit-plan/ as workflow root
   - If no: Use @${CLAUDE_PLUGIN_ROOT}/workflows/edit-plan/ as workflow root
   - If neither exists: Display error "Workflow 'edit-plan' not found in plugin or user overrides"
2. Read the workflow configuration at {workflow_root}/workflow.yaml
3. Read the instructions at {workflow_root}/instructions.md
4. Read the plan schema at @.slide-builder/reference/plan-schema.md
5. Read the plan editor context at `.slide-builder/plan-editor-context.md` (contains full deck context and the user's instruction)
6. Parse the argument as the edit instruction: $ARGUMENTS
7. Execute the workflow steps following instructions.md EXACTLY:
   - Step 1: Load context and plan.yaml
   - Step 2: Classify edit type (field, structural, narrative)
   - Step 3: Apply the edit
   - Step 4: Validate and write plan.yaml
   - Step 5: Report what changed
</steps>
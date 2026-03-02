---
description: 'Create new slide templates via conversational discovery and frontend-design skill'
---

# Slide Builder - Add Slide Template Command

This command creates a new slide template through deep conversational discovery.

<steps CRITICAL="TRUE">
1. **Resolve workflow path** (override-first pattern):
   - Check if @.slide-builder/workflows/add-slide-template/instructions.md exists
   - If yes: Use @.slide-builder/workflows/add-slide-template/ as workflow root
   - If no: Use @${CLAUDE_PLUGIN_ROOT}/workflows/add-slide-template/ as workflow root
   - If neither exists: Display error "Workflow 'add-slide-template' not found in plugin or user overrides"
2. Read the workflow configuration at {workflow_root}/workflow.yaml
3. Read the instructions at {workflow_root}/instructions.md
4. Execute the workflow steps in order, engaging in conversation with the user
5. Minimum 3-5 exchanges before generating template
6. Save template to catalog/ and update catalog.json
</steps>

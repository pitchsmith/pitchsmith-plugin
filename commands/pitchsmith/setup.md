---
description: 'Create brand theme from assets (website URL, PDF, images) via extraction and sample deck validation loop'
---

# Slide Builder - Setup Command

This command creates your brand theme from assets.

<steps CRITICAL="TRUE">
1. **Resolve workflow path** (override-first pattern):
   - Check if @.slide-builder/workflows/setup/instructions.md exists
   - If yes: Use @.slide-builder/workflows/setup/ as workflow root
   - If no: Use @${CLAUDE_PLUGIN_ROOT}/workflows/setup/ as workflow root
   - If neither exists: Display error "Workflow 'setup' not found in plugin or user overrides"
2. Read the workflow configuration at {workflow_root}/workflow.yaml
3. Read the instructions at {workflow_root}/instructions.md
4. Execute the workflow steps in order, pausing at checkpoints
5. Update .slide-builder/status.yaml with workflow progress
</steps>

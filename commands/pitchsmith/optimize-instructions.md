---
description: 'Transform instruction files into optimized format using Anthropic prompt engineering best practices'
---

# Slide Builder - Optimize Instructions Command

This command optimizes a workflow instructions file using Anthropic prompt engineering best practices.

<steps CRITICAL="TRUE">
1. **Resolve workflow path** (override-first pattern):
   - Check if @.slide-builder/workflows/optimize-instructions/instructions.md exists
   - If yes: Use @.slide-builder/workflows/optimize-instructions/ as workflow root
   - If no: Use @${CLAUDE_PLUGIN_ROOT}/workflows/optimize-instructions/ as workflow root
   - If neither exists: Display error "Workflow 'optimize-instructions' not found in plugin or user overrides"
2. Read the workflow configuration at {workflow_root}/workflow.yaml
3. Read the instructions at {workflow_root}/instructions.md
4. Parse `$ARGUMENTS` as the target file path to optimize
5. Execute the workflow steps following instructions.md
</steps>

---
description: 'Smart router that asks whether you need a single slide or full deck, then routes to appropriate workflow'
---

# Slide Builder - Plan Command

This command helps you start planning slides.

<steps CRITICAL="TRUE">
1. **Resolve workflow path** (override-first pattern):
   - Check if @.slide-builder/workflows/plan/instructions.md exists
   - If yes: Use @.slide-builder/workflows/plan/ as workflow root
   - If no: Use @${CLAUDE_PLUGIN_ROOT}/workflows/plan/ as workflow root
   - If neither exists: Display error "Workflow 'plan' not found in plugin or user overrides"
2. Read the workflow configuration at {workflow_root}/workflow.yaml
3. Read the instructions at {workflow_root}/instructions.md
4. Ask user whether they need single slide or full deck
5. Route to appropriate workflow (plan-one or plan-deck)
</steps>

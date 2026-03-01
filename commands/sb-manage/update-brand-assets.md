---
description: 'Manage brand asset catalog: classify and import icons, logos, and images'
---

# Slide Builder - Update Brand Assets Command

This command manages the brand asset catalog for icons, logos, and images used in slides.

<steps CRITICAL="TRUE">
1. **Resolve workflow path** (override-first pattern):
   - Check if @.slide-builder/workflows/update-brand-assets/instructions.md exists
   - If yes: Use @.slide-builder/workflows/update-brand-assets/ as workflow root
   - If no: Use @${CLAUDE_PLUGIN_ROOT}/workflows/update-brand-assets/ as workflow root
   - If neither exists: Display error "Workflow 'update-brand-assets' not found in plugin or user overrides"
2. Read the workflow configuration at {workflow_root}/workflow.yaml
3. Read the instructions at {workflow_root}/instructions.md
4. Execute the workflow steps in order, engaging in conversation with the user
5. Scan existing assets or import new ones based on user selection
6. Save catalog files with semantic tags for each asset
</steps>

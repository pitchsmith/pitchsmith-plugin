---
description: 'Copy a workflow from the plugin to your local project for customization'
---

# Slide Builder - Eject Workflow Command

This command copies a workflow directory from the plugin to your local `.slide-builder/workflows/` directory, allowing you to customize workflow behavior without forking the entire plugin.

**Usage:** `/sb-manage:eject-workflow {workflow-name}`

**Example:** `/sb-manage:eject-workflow build-one`

<steps CRITICAL="TRUE">
1. **Parse Arguments**:
   - Extract workflow name from user input (first argument after command)
   - If no workflow name provided: Display error "Usage: /sb-manage:eject-workflow {workflow-name}" and HALT
   - Normalize workflow name (trim whitespace, convert to lowercase)

2. **Validate Workflow Name** (path traversal prevention):
   - Check that workflow name matches the pattern: `/^[a-z0-9-]+$/` (lowercase alphanumeric and dashes only)
   - If validation fails: Display error and HALT:
     ```
     ❌ Invalid workflow name: '{workflow-name}'

     Workflow names must contain only lowercase letters, numbers, and dashes.
     Example: build-one, plan-deck, use-template-deck
     ```
   - This prevents path traversal attacks (e.g., `../../../etc/passwd`, `foo/bar`)

3. **Validate Workflow Exists in Plugin**:
   - Resolve plugin root: ${CLAUDE_PLUGIN_ROOT}
   - Check if @${CLAUDE_PLUGIN_ROOT}/workflows/{workflow-name}/ directory exists
   - If not found: Display error message and HALT:
     ```
     ❌ Workflow '{workflow-name}' not found in plugin

     Available workflows (use /sb-manage:list-overrides to see all):
     Run this command without arguments to see available workflows.
     ```
   - Verify workflow contains at least workflow.yaml file
   - If workflow.yaml missing: Display error "Invalid workflow: missing workflow.yaml" and HALT

4. **Check if Already Ejected**:
   - Check if @.slide-builder/workflows/{workflow-name}/ already exists
   - If exists: Ask user for confirmation:
     ```
     ⚠️  Workflow '{workflow-name}' is already ejected

     Local path: .slide-builder/workflows/{workflow-name}/

     Do you want to re-eject (overwrite local changes)? (yes/no)
     ```
   - If user responds "no" or "n": Display "Eject cancelled" and HALT
   - If user responds "yes" or "y": Continue with overwrite

5. **Copy Workflow Directory**:
   - Ensure @.slide-builder/workflows/ directory exists (create if needed)
   - Copy entire workflow directory from @${CLAUDE_PLUGIN_ROOT}/workflows/{workflow-name}/ to @.slide-builder/workflows/{workflow-name}/
   - Preserve all files and subdirectories:
     - workflow.yaml (required)
     - instructions.md (required)
     - Any template files (*.md, *.yaml, *.xml)
     - Any subdirectories (e.g., templates/)
   - Verify copy succeeded by checking target directory exists and contains workflow.yaml

6. **Update Paths in Copied workflow.yaml**:
   - Read the copied @.slide-builder/workflows/{workflow-name}/workflow.yaml
   - Find the `installed_path` field (e.g., `installed_path: "${CLAUDE_PLUGIN_ROOT}/workflows/{workflow-name}"`)
   - Replace the value with the local ejected path: `installed_path: "{project-root}/.slide-builder/workflows/{workflow-name}"`
   - This ensures the workflow resolves its own instructions, templates, and scripts from the local copy
   - Save the updated workflow.yaml
   - If `installed_path` field is not found: Display warning "Note: No installed_path found in workflow.yaml — workflow may not resolve local paths correctly"

7. **Display Confirmation Message**:
   ```
   ✅ Workflow '{workflow-name}' ejected successfully

   📁 Local path: .slide-builder/workflows/{workflow-name}/

   📝 What's next:
   - Edit the workflow files to customize behavior
   - Future runs of this workflow will use your local copy
   - Commands like /sb-create:{workflow-name} will load from local path

   ⚙️  To revert to plugin defaults:
   - Delete the local directory: .slide-builder/workflows/{workflow-name}/
   - Or run: rm -rf .slide-builder/workflows/{workflow-name}

   💡 Use /sb-manage:list-overrides to see which workflows are ejected
   ```

8. **Error Handling**:
   - If directory copy fails: Display error "Failed to copy workflow: {error-message}" and HALT
   - If filesystem permission denied: Display error "Permission denied: Cannot write to .slide-builder/ directory" with suggestion to check permissions
</steps>

## Notes

- **Override Resolution**: Once ejected, all commands and the skill router will automatically use the local copy due to the override-first pattern implemented in Stories P0-2.3 and P0-2.4
- **No Database/Registry**: Ejection is purely filesystem-based - no tracking files or registries required
- **Revert is Simple**: Just delete the local directory to revert to plugin defaults
- **Safe Operation**: Original plugin files are never modified - only copied

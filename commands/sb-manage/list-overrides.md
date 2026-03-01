---
description: 'Display which workflows are ejected (customized) vs using plugin defaults'
---

# Slide Builder - List Overrides Command

This command shows the status of all workflows: which ones are ejected to your local project for customization and which ones are using the plugin defaults.

**Usage:** `/sb-manage:list-overrides`

<steps CRITICAL="TRUE">
1. **Discover Available Workflows**:
   - Resolve plugin root: ${CLAUDE_PLUGIN_ROOT}
   - List all directories in @${CLAUDE_PLUGIN_ROOT}/workflows/
   - Filter to only include directories containing workflow.yaml
   - Exclude the 'shared' directory (not a workflow)
   - Store as `available_workflows` list
   - Count total workflows (expected: 22-23 workflows)

2. **Scan for Ejected Workflows**:
   - Check if @.slide-builder/workflows/ directory exists
   - If not exists: Set `ejected_workflows` to empty list
   - If exists: List all directories in @.slide-builder/workflows/
   - Filter to only include directories containing workflow.yaml
   - Store as `ejected_workflows` list
   - Cross-reference with `available_workflows` to ensure they're valid

3. **Categorize Workflows**:
   - Create two lists:
     - **Ejected**: Workflows in `ejected_workflows` list
     - **Plugin Defaults**: Workflows in `available_workflows` but NOT in `ejected_workflows`
   - Sort both lists alphabetically

4. **Display Status Report**:
   ```
   📦 Slide Builder Workflow Status

   ═══════════════════════════════════════════════════════════

   ✏️  EJECTED (Using Local Copy) - {count}
   {if ejected_workflows is empty}
   None - All workflows using plugin defaults
   {else}
   {for each workflow in ejected_workflows}
   • {workflow-name}
     📁 .slide-builder/workflows/{workflow-name}/
   {end for}
   {end if}

   ═══════════════════════════════════════════════════════════

   🔌 USING PLUGIN DEFAULTS - {count}
   {if plugin_defaults is empty}
   None - All workflows ejected
   {else}
   {for each workflow in plugin_defaults}
   • {workflow-name}
   {end for}
   {end if}

   ═══════════════════════════════════════════════════════════

   📊 Total: {total_count} workflows available

   💡 Tips:
   • Eject a workflow: /sb-manage:eject-workflow {workflow-name}
   • Revert to plugin: Delete .slide-builder/workflows/{workflow-name}/
   • Override resolution: Local copies always take precedence
   ```

5. **Special Cases**:
   - If @${CLAUDE_PLUGIN_ROOT} cannot be resolved: Display error "Cannot resolve plugin root. Ensure CLAUDE_PLUGIN_ROOT is set." and HALT
   - If no workflows found in plugin: Display error "No workflows found in plugin directory" and HALT
   - If ejected workflow not in available list: Add warning note:
     ```
     ⚠️  Warning: Found local workflow '{workflow-name}' that doesn't exist in plugin
     This may be a custom workflow or from an older plugin version.
     ```

6. **Performance Note**:
   - This command should be fast (<500ms) as it only scans directories
   - No need to read workflow.yaml contents - just check for existence
   - Minimal filesystem operations
</steps>

## Output Examples

### Example 1: No Ejected Workflows
```
📦 Slide Builder Workflow Status

═══════════════════════════════════════════════════════════

✏️  EJECTED (Using Local Copy) - 0

None - All workflows using plugin defaults

═══════════════════════════════════════════════════════════

🔌 USING PLUGIN DEFAULTS - 22

• add-deck-template
• add-slide
• add-slide-template
• animate
• build
• build-all
• build-one
[... 15 more workflows ...]

═══════════════════════════════════════════════════════════

📊 Total: 22 workflows available
```

### Example 2: Some Ejected Workflows
```
📦 Slide Builder Workflow Status

═══════════════════════════════════════════════════════════

✏️  EJECTED (Using Local Copy) - 2

• build-one
  📁 .slide-builder/workflows/build-one/
• plan-deck
  📁 .slide-builder/workflows/plan-deck/

═══════════════════════════════════════════════════════════

🔌 USING PLUGIN DEFAULTS - 20

• add-deck-template
• add-slide
[... 18 more workflows ...]

═══════════════════════════════════════════════════════════

📊 Total: 22 workflows available
```

## Notes

- **Simple Detection**: Just checks for directory existence - no complex tracking
- **Always Accurate**: Reflects current filesystem state in real-time
- **No Caching**: Scans directories on every run to ensure accuracy
- **Filesystem-Based**: No database, registry, or tracking files required

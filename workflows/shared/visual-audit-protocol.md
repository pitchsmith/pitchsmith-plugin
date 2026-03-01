# Visual Audit Protocol

<critical>This is a shared protocol invoked by build-one, edit, and add-slide workflows.</critical>
<critical>This protocol is NON-BLOCKING: the slide is always saved and the workflow always continues regardless of audit outcome.</critical>
<critical>Max 2 auto-fix iterations to prevent infinite loops.</critical>

## Input Variable Contract

The calling workflow MUST set these variables before invoking this protocol:

| Variable | Required | Description |
|----------|----------|-------------|
| `{{output_path}}` | Yes | Absolute or relative path to the HTML slide file to validate |
| `{{slide_number}}` | Yes | Slide number (integer) for display purposes |
| `{{background_mode}}` | Yes | "dark" or "light" — for visual quality checks |
| `{{storyline_role}}` | No | opening, tension, resolution, evidence, cta — for density expectations |

## Output Variables

After protocol completes, these variables are available to the calling workflow:

| Variable | Type | Description |
|----------|------|-------------|
| `{{visual_audit_passed}}` | boolean | true if no critical issues found |
| `{{visual_audit_skipped}}` | boolean | true if MCP not available |
| `{{visual_audit_fixes_applied}}` | integer | Count of auto-fixes applied |
| `{{visual_audit_report}}` | string | Formatted validation report |

---

## Protocol Steps

### Step 1: Detect Browser MCP Availability

<steps>
1. Query for browser-capable MCP tools using ToolSearch:
   - Query: "browser screenshot puppeteer chrome"
   - This searches for tools matching browser/screenshot/puppeteer/chrome patterns
2. Evaluate ToolSearch results:
   - If tools found matching browser/screenshot/puppeteer patterns:
     - Set `{{browser_mcp_available}}` = true
     - Store matching tool names as `{{browser_tools}}`
   - If no tools found:
     - Set `{{browser_mcp_available}}` = false
</steps>

### Step 2: Handle MCP Unavailable

<check if="{{browser_mcp_available}} == false">
  <action>Set `{{visual_audit_skipped}}` = true</action>
  <action>Set `{{visual_audit_passed}}` = true</action>
  <action>Set `{{visual_audit_fixes_applied}}` = 0</action>
  <output>
  **Visual audit skipped** (no browser MCP available)
  </output>
  <action>Return to calling workflow — protocol complete</action>
</check>

<check if="{{browser_mcp_available}} == true">
  <action>Set `{{visual_audit_skipped}}` = false</action>
  <action>Set `{{auto_fix_iteration}}` = 0</action>
  <action>Set `{{visual_audit_fixes_applied}}` = 0</action>
  <action>Continue to Step 3</action>
</check>

### Step 3: Render Slide in Browser

<critical>All validation steps are wrapped in error handling. Any failure skips validation gracefully.</critical>

<steps>
1. **Navigate browser to slide:**
   - Use browser MCP to navigate to the slide HTML file at `{{output_path}}`
   - Try file:// protocol first
   - If file:// fails, start a temporary HTTP server as fallback:
     - `python3 -m http.server 0 --directory $(dirname {{output_path}})` (on random available port)
     - Store server PID as `{{audit_server_pid}}`
     - Navigate to `http://localhost:{{port}}/$(basename {{output_path}})`
   - Set viewport to 1920x1080
   - Wait for fonts and layout to settle (allow 2-3 seconds)

2. **Handle navigation failure:**
   - If navigation fails entirely:
     - Set `{{visual_audit_passed}}` = true (benefit of the doubt)
     - Set `{{visual_audit_report}}` = "Browser navigation failed — audit skipped"
     - Clean up server if started
     - Return to calling workflow
</steps>

### Step 4: Technical Validation

<steps>
1. **Check slide dimensions:**
   - Query `.slide` element dimensions
   - Expected: exactly 1920px width x 1080px height
   - Store result as `{{dim_check}}` = PASS/FAIL with actual dimensions

2. **Check contenteditable coverage:**
   - Query `[contenteditable]` elements
   - All visible text elements should have `contenteditable="true"`
   - Store result as `{{edit_check}}` = PASS/FAIL with element count

3. **Check data-field attributes:**
   - Query elements with `[data-field]` attribute
   - All contenteditable text elements should also have a `data-field` attribute
   - Store result as `{{field_check}}` = PASS/FAIL with details

4. **Check browser console:**
   - Capture browser console output
   - Check for JavaScript errors (filter out warnings)
   - Store result as `{{console_check}}` = PASS/FAIL with error list

5. **Check CSS variable resolution:**
   - Spot-check computed styles on key elements (e.g., headings, body text, containers)
   - Look for unresolved CSS variables (values containing `var(--` that didn't resolve)
   - Store result as `{{css_var_check}}` = PASS/FAIL with unresolved variables

6. **If any query fails:** Note partial validation, continue with available results
</steps>

### Step 5: Visual Quality Assessment

<steps>
1. **Capture screenshot:**
   - Use browser MCP screenshot capability to capture full-page screenshot
   - Store screenshot for LLM visual analysis
   - If screenshot fails → Set `{{screenshot_error}}` = true, skip visual assessment

2. **Analyze content density:**
   - Compare actual content density to expected for `{{storyline_role}}`
   <reference title="Density Expectations by Role">
   | Role | Expected Density | Description |
   |------|------------------|-------------|
   | opening | Sparse (20-30%) | Bold visual impact, minimal text |
   | tension | Moderate (40-50%) | Problem statement, focused content |
   | resolution | Substantive (50-60%) | Solution details, supporting points |
   | evidence | Moderate to Dense (50-70%) | Data, proof points, charts |
   | cta | Sparse to Moderate (30-50%) | Clear call-to-action, clean layout |
   </reference>
   - Store finding as `{{density_assessment}}`

3. **Analyze whitespace distribution:**
   - Check for empty regions > 30% of slide with no content
   - Check for text/content clustered in one area leaving large voids
   - Check if visual anchors would improve balance
   - Store findings as `{{whitespace_findings}}`

4. **Assess proportional sizing:**
   - Check text sizes relative to slide area
   - Flag headlines < 36pt as potentially too small
   - Flag single bullets at small font as "timid"
   - Store findings as `{{sizing_findings}}`

5. **Check icon color contrast:**
   - For each icon, identify its immediate parent background (card, panel, box)
   - NOT the slide background — the container element's background
   - Verify icon color contrasts with immediate background:
     - White icons on light containers = FAIL (washed out)
     - Dark icons on dark containers = FAIL (washed out)
   - Store findings as `{{icon_contrast_findings}}`

6. **Verify logo catalog compliance:**
   - Find all `<img>` elements that appear to be logos
   - Check src paths against logo catalog location:
     - Valid: `.slide-builder/config/catalog/brand-assets/logos/*`
     - Invalid: External URLs, other paths, inline SVG recreations
   - Verify correct variant for background mode:
     - Dark background → light/white logo variant
     - Light background → dark logo variant
   - Store findings as `{{logo_compliance_findings}}`
</steps>

### Step 6: Auto-Fix Loop

<critical>Maximum 2 auto-fix iterations. After 2 attempts, report remaining issues and continue.</critical>

<check if="no issues found (all technical checks PASS and no visual quality concerns)">
  <action>Set `{{visual_audit_passed}}` = true</action>
  <goto>Step 7</goto>
</check>

<check if="issues found AND {{auto_fix_iteration}} < 2">
  <action>Increment `{{auto_fix_iteration}}`</action>
  <action>Read current HTML from `{{output_path}}`</action>

  <steps>
  Apply fixes for auto-fixable issues only:

  | Issue | Auto-Fix Strategy |
  |-------|-------------------|
  | Dimensions wrong (not 1920x1080) | Patch CSS: `.slide { width: 1920px; height: 1080px; }` |
  | Missing contenteditable | Add `contenteditable="true"` to text elements |
  | Missing data-field | Generate unique `data-field` names for untagged text elements |
  | Console JS errors | Fix script errors in auto-save or event listeners |
  | Icon contrast fail | Swap icon color to contrast with container background |

  Non-auto-fixable (report only):
  - Content density mismatch — too subjective
  - Whitespace imbalance — requires layout redesign
  - Logo non-compliant — report with correct catalog path suggestion
  </steps>

  <action>Save fixed HTML back to `{{output_path}}`</action>
  <action>Increment `{{visual_audit_fixes_applied}}` by number of fixes applied</action>

  <action>Re-render slide in browser (reload page)</action>
  <action>Re-run Step 4 (Technical Validation) and Step 5 (Visual Quality Assessment)</action>

  <check if="all issues resolved">
    <action>Set `{{visual_audit_passed}}` = true</action>
    <goto>Step 7</goto>
  </check>

  <check if="issues remain AND {{auto_fix_iteration}} < 2">
    <goto>Step 6 (next iteration)</goto>
  </check>

  <check if="issues remain AND {{auto_fix_iteration}} >= 2">
    <action>Set `{{visual_audit_passed}}` = false</action>
    <action>Log remaining issues for report</action>
    <goto>Step 7</goto>
  </check>
</check>

<check if="issues found AND {{auto_fix_iteration}} >= 2">
  <action>Set `{{visual_audit_passed}}` = false</action>
  <goto>Step 7</goto>
</check>

### Step 7: Validation Report

<reference title="Validation Report Format">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BROWSER VISUAL AUDIT — Slide {{slide_number}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECHNICAL CHECKS
───────────────────────────────────────────────────────────────────────────────
{{dim_check_icon}} Dimensions: {{actual_dimensions}} (expected 1920x1080)
{{edit_check_icon}} Contenteditable: {{contenteditable_count}} elements found
{{field_check_icon}} Data-field: {{data_field_count}} tagged elements
{{console_check_icon}} Console: {{console_status}}
{{css_var_check_icon}} CSS Variables: {{css_var_status}}

VISUAL QUALITY
───────────────────────────────────────────────────────────────────────────────
{{#if screenshot_error}}
  Screenshot capture failed — visual assessment skipped
{{else}}
- Density: {{density_assessment}}
- Whitespace: {{whitespace_findings}}
- Sizing: {{sizing_findings}}
- Icon Contrast: {{icon_contrast_findings}}
- Logo Compliance: {{logo_compliance_findings}}
{{/if}}

{{#if visual_audit_fixes_applied > 0}}
AUTO-FIXES APPLIED
───────────────────────────────────────────────────────────────────────────────
{{visual_audit_fixes_applied}} fix(es) applied across {{auto_fix_iteration}} iteration(s)
{{/if}}

{{#if has_remaining_issues}}
REMAINING ISSUES
───────────────────────────────────────────────────────────────────────────────
{{#each remaining_issues}}
- {{this}}
{{/each}}
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</reference>

<steps>
1. Compile all validation findings into the report format above
2. Store formatted report as `{{visual_audit_report}}`
3. Display the report to user
</steps>

### Step 8: Non-Blocking Completion

<critical>The visual audit NEVER blocks workflow completion. The slide is always saved regardless of findings.</critical>

<steps>
1. Clean up resources:
   - If `{{audit_server_pid}}` was set, kill the temporary HTTP server: `kill {{audit_server_pid}}`
2. Return output variables to calling workflow:
   - `{{visual_audit_passed}}` — whether audit passed
   - `{{visual_audit_skipped}}` — whether audit was skipped (no MCP)
   - `{{visual_audit_fixes_applied}}` — count of fixes applied
   - `{{visual_audit_report}}` — formatted report string
3. Return control to calling workflow — protocol complete
</steps>

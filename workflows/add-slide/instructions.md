# Add Slide Workflow

<context>
You are a slide insertion agent. Your job is to add a new slide to an existing deck by discovering user requirements through conversation, making room in the plan and file system, building the slide HTML, and updating all metadata.
</context>

<success_criteria>
A successful run produces:
1. New slide HTML at correct position (1920x1080, contenteditable text)
2. Plan and status files updated with correct counts and slide numbers
3. Manifest regenerated to reflect new slide
4. All subsequent slides renumbered in both plan and filesystem
</success_criteria>

---

## Critical Requirements

<critical>
Verify ALL of these before and during execution.
</critical>

| # | Requirement | How to Verify |
|---|-------------|---------------|
| 1 | Deck Selection Protocol | Use status.yaml registry, handle argument vs. selection |
| 2 | Position Validation | Must be between 1 and total_slides, or "at end" |
| 3 | File Rename Order | REVERSE order (highest first) to avoid conflicts |
| 4 | Build Immediately | Do NOT defer to build-one - build inline |
| 5 | Manifest Update | Run generate-manifest.js after building |
| 6 | Dual Count Update | Update both plan.yaml AND status.yaml |
| 7 | Background Rhythm | Apply dark/light alternation based on adjacent slides |

---

## Variable Convention

<context>
Throughout these instructions, `{{variable}}` means "substitute the actual value at runtime."
</context>

<example>
If `deck_slug` is `"q1-strategy"`, then `output/{{deck_slug}}/` becomes `output/q1-strategy/`
</example>

---

## Phase 1: Deck Selection

<steps>
1. Read `{{status_file}}` completely
2. Parse the `decks:` section to get all deck entries
3. Filter to decks with status: `planned`, `building`, or `complete`
4. Proceed based on whether user provided a deck slug argument:
   - **Argument provided** → Validate slug exists in registry
   - **No argument** → Count eligible decks and route

**If argument provided:**
5. Look up the slug in `decks:` registry keys
6. If slug exists → Set `{{deck_slug}}` and `{{deck}}`, continue to Phase 2
7. If slug NOT found → Report error with list of valid slugs, HALT

**If no argument:**
8. Count eligible decks (status = planned, building, or complete)
9. Route based on count:
   - **Zero decks** → Report error: "No decks available. Run `/pitchsmith:plan-deck` first.", HALT
   - **Exactly one** → Auto-select that deck, continue to Phase 2
   - **Multiple** → Present numbered list, ask user to select by number
</steps>

<example title="Deck selection with multiple decks">
**Available decks:**

1. "Q1 Strategy Review" (building, 8/12 slides) - q1-strategy
2. "Product Roadmap" (complete, 15/15 slides) - product-roadmap
3. "Team Onboarding" (planned, 0/10 slides) - team-onboarding

Which deck would you like to add a slide to? (enter number)
</example>

---

## Phase 2: Load Deck Plan

<steps>
1. Read `output/{{deck_slug}}/plan.yaml` completely
2. Parse `slides:` array to get all existing slides
3. Store `{{total_slides}}` = count of slides in array
4. Parse `agenda:` section if it exists
5. Store `{{has_agenda}}` = true if agenda.sections exists, else false
6. If plan.yaml not found → Report error with expected path, HALT
7. Continue to Phase 3
</steps>

---

## Phase 3: Position Selection

<steps>
1. Display current slides with number and intent summary
2. Ask user: "Where should the new slide go? (e.g., 'after 3' or 'at end')"
3. Parse user response:
   - **"at end" or "end"** → Set `{{insert_position}}` = `{{total_slides}}` + 1
   - **"after N"** → Extract N, validate 1 ≤ N ≤ `{{total_slides}}`, set `{{insert_position}}` = N + 1
   - **Invalid or unclear** → Re-prompt with valid options
4. Continue to Phase 4
</steps>

<example title="Position selection display">
**Current slides in "Q1 Strategy Review":**

1. Opening: Welcome and objectives (built)
2. Market Overview: Current landscape (built)
3. Competitive Analysis: Key players (pending)
4. Our Strategy: Core approach (pending)
5. Q&A Slide (pending)

Total: 5 slides

Where should the new slide go? (e.g., "after 3" or "at end")
</example>

---

## Phase 4: Slide Discovery

<steps>
1. Inform user: "New slide will be inserted as slide {{insert_position}}"
2. Ask: "What is the intent of this slide? (What should it convey?)"
   - Store `{{slide_intent}}`
3. Ask: "What are the key points? (List 2-4 points)"
   - Store `{{key_points}}` as parsed list
4. Present tone selection using AskUserQuestion tool with options:
   - Professional (Clean, corporate, trustworthy)
   - Bold (High impact, attention-grabbing)
   - Technical (Detailed, data-focused, precise)
   - Warm (Friendly, approachable, human)
   - Store `{{slide_tone}}` as lowercase selection
5. Ask: "Any visual guidance? (e.g., 'include diagram', 'use icons') - or Enter to skip"
   - Store `{{visual_guidance}}` or null if skipped
6. Read catalog from `{{catalog_manifest}}`
7. Match slide intent against template use_cases
8. Store `{{suggested_template}}` = best matching template id or null
9. If template found → Display template name and description
10. Continue to Phase 5
</steps>

---

## Phase 5: Agenda Assignment

<steps>
1. Check if `{{has_agenda}}` is true
2. If no agenda → Set `{{agenda_section_id}}` = null, skip to Phase 6
3. If agenda exists:
   - Display numbered list of agenda sections with title and description
   - Ask: "Which section does this slide belong to? (enter number, or 'none' to skip)"
   - If user selects valid number → Set `{{agenda_section_id}}` from selected section
   - If user says 'none' or skips → Set `{{agenda_section_id}}` = null
4. Continue to Phase 6
</steps>

---

## Phase 6: Rename Slide Files

<critical>
Files MUST be renamed in REVERSE order (highest first) to avoid conflicts.
Only rename if inserting in the middle - skip if appending at end.
</critical>

<steps>
1. Check if `{{insert_position}}` > `{{total_slides}}`
   - If true → Skip file renaming (appending at end), go to Phase 7
2. List all slide files in `output/{{deck_slug}}/slides/` matching pattern `slide-N.html`
3. Sort by N descending (highest first)
4. For each file where N ≥ `{{insert_position}}` (process highest first):
   - Rename `slide-N.html` → `slide-(N+1).html`
   - Rename `slide-N-state.json` → `slide-(N+1)-state.json` (if exists)
5. Report: "📁 Renamed {{files_renamed}} slide files to make room for new slide"
6. Continue to Phase 7
</steps>

<example title="File renaming sequence">
Inserting at position 3 with total_slides = 5:
1. Rename slide-5.html → slide-6.html (highest first)
2. Rename slide-5-state.json → slide-6-state.json
3. Rename slide-4.html → slide-5.html
4. Rename slide-4-state.json → slide-5-state.json
5. Rename slide-3.html → slide-4.html
6. Rename slide-3-state.json → slide-4-state.json
(Position 3 is now empty)
</example>

---

## Phase 7: Plan Modification

<steps>
1. Determine `{{background_mode}}` for new slide using rhythm rules:
   - If `{{insert_position}}` == 1 (first slide) → "dark"
   - If `{{insert_position}}` > `{{total_slides}}` (last slide) → "dark"
   - Otherwise, check adjacent slides in plan:
     - If both previous slides are "dark" → "light"
     - If both previous slides are "light" → "dark"
     - Default → alternate from previous slide
   - If existing slides lack background_mode → default to "dark"
2. Construct new slide object with all discovered properties
3. For each slide in plan.slides where slide.number ≥ `{{insert_position}}`:
   - Increment slide.number by 1
4. Insert new_slide into slides array at index `{{insert_position}}` - 1
5. Write updated plan.yaml to `output/{{deck_slug}}/plan.yaml`
6. Preserve all other plan content (deck_name, description, audience, agenda, etc.)
7. Report: "📝 Plan updated - slide {{insert_position}} added, subsequent slides renumbered"
8. Continue to Phase 8
</steps>

<example title="New slide object structure">
```yaml
- number: 3
  intent: "Competitive Analysis: Key players"
  template: "layout-comparison"
  status: pending
  agenda_section_id: "market-context"
  background_mode: "light"
  key_points:
    - "Market leader X controls 40% share"
    - "Emerging player Y disrupting with new model"
    - "Our position and differentiation"
  visual_guidance: "include competitor logos"
  tone: "professional"
```
</example>

---

## Phase 8: Build the New Slide

<critical>
This phase generates the slide HTML inline. Follow build-one patterns.
</critical>

<steps>
1. Read `{{theme_file}}`
2. Read `{{config_path}}/design-standards.md`
3. Extract typography minimums (Hero: 64px, h1: 48px, body: 24px, etc.)
4. Read `{{catalog_manifest}}`
5. If `{{suggested_template}}` exists:
   - Find template in catalog where id == `{{suggested_template}}`
   - Read template HTML from catalog file
   - If template has `instructions` field → Use as PRIMARY build guidance (instructions describe exact layout technique, element hierarchy, decorative patterns - they take precedence over generic inference)
6. If no template match or null:
   - If `content_type == "diagram"` → evaluate via `determineDiagramMethod()` (see build-one Phase 3C); use technical-svg-diagrams skill for SVG-appropriate diagrams, frontend-design skill for HTML-appropriate content
   - Otherwise → Use frontend-design skill for custom layout
7. Generate complete HTML slide following requirements below
8. Map theme.json to CSS custom properties
9. Apply colors based on `{{background_mode}}`
10. Generate content from slide discovery (intent → title, key_points → bullets, etc.)
11. Ensure `output/{{deck_slug}}/slides/` directory exists
12. **Verify compliance** against Critical Requirements table (step 1-7)
13. Write HTML to `output/{{deck_slug}}/slides/slide-{{insert_position}}.html`
14. Create state file at `output/{{deck_slug}}/slides/slide-{{insert_position}}-state.json`
15. Report: "🎨 Built slide {{insert_position}}: '{{slide_intent}}'"
16. Continue to Phase 8.5
</steps>

<reference title="HTML generation requirements">
| Requirement | Implementation |
|-------------|----------------|
| Viewport | `width=1920, height=1080` |
| Body/slide size | 1920x1080px |
| Text editability | All text: `contenteditable="true"` with unique `data-field` |
| CSS variables | Use `--color-*` from theme |
| Auto-save script | Include `saveEdits()` function |
| Animation support | Structural elements: `data-animatable="true"` |
</reference>

<reference title="CSS custom property mapping">
| Theme Path | CSS Variable |
|------------|--------------|
| colors.primary | --color-primary |
| colors.secondary | --color-secondary |
| colors.accent | --color-accent |
| colors.background.default | --color-bg-default |
| colors.background.alt | --color-bg-alt |
| colors.background.dark | --color-bg-dark |
| colors.background.light | --color-bg-light |
| colors.text.heading | --color-text-heading |
| colors.text.body | --color-text-body |
| colors.text.onDark | --color-text-on-dark |
| colors.text.onLight | --color-text-on-light |
| typography.fonts.heading | --font-heading |
| typography.fonts.body | --font-body |
</reference>

<reference title="Background mode color application">
| Background Mode | Background | Heading Text | Body Text | Accent |
|-----------------|------------|--------------|-----------|--------|
| dark | var(--color-bg-default) or #0C0C0C | var(--color-text-on-dark) or #FFFFFF | var(--color-text-body) or #E8EDEF | var(--color-accent) or #EAFF5F |
| light | var(--color-bg-light) or #FFFFFF | var(--color-text-on-light) or #0C0C0C | var(--color-text-on-light) or #0C0C0C | #004b57 (Dusk) |
</reference>

<example title="Compliant slide HTML structure">
```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=1920, height=1080">
  <style>
    :root {
      --color-primary: #d4e94c;
      --color-bg-default: #0C0C0C;
      --color-text-on-dark: #FFFFFF;
      --font-heading: 'Poppins', sans-serif;
    }
    body { width: 1920px; height: 1080px; background: var(--color-bg-default); }
    h1 { font: 700 64px/1.2 var(--font-heading); color: var(--color-text-on-dark); }
  </style>
</head>
<body>
  <div class="slide" data-animatable="true">
    <h1 contenteditable="true" data-field="title">Competitive Analysis</h1>
    <ul data-animatable="true">
      <li contenteditable="true" data-field="point1">Market leader X controls 40%</li>
    </ul>
  </div>
  <script>
    function saveEdits() { /* auto-save implementation */ }
  </script>
</body>
</html>
```
</example>

<example title="State file structure">
```json
{
  "slide": 3,
  "edits": [],
  "lastModified": null
}
```
</example>

---

## Phase 8.5: Visual Audit

<context>
After building the new slide, run the shared visual audit protocol to catch rendering issues before updating the manifest. Non-blocking: always continues to Phase 9.
</context>

<steps>
1. Set visual audit input variables:
   - `{{output_path}}` = `output/{{deck_slug}}/slides/slide-{{insert_position}}.html`
   - `{{slide_number}}` = `{{insert_position}}`
   - `{{background_mode}}` = from plan entry (dark/light)
   - `{{storyline_role}}` = from plan.yaml slide entry if available
2. Follow the visual audit protocol from `.slide-builder/workflows/shared/visual-audit-protocol.md`
3. Continue to Phase 9
</steps>

---

## Phase 9: Update Manifest

<steps>
1. Run: `node ${CLAUDE_PLUGIN_ROOT}/scripts/generate-manifest.js {{deck_slug}}`
2. This updates: `output/{{deck_slug}}/slides/manifest.json`
3. Report: "📊 Manifest updated"
4. Continue to Phase 10
</steps>

---

## Phase 10: Status Update

<steps>
1. Read `output/{{deck_slug}}/plan.yaml`
2. Find slide where number == `{{insert_position}}`
3. Set slide.status = "built"
4. Save plan.yaml
5. Read `{{status_file}}`
6. Update deck entry:
   - Set `total_slides` = `{{total_slides}}` + 1
   - Increment `built_count` by 1
   - Set `current_slide` = `{{insert_position}}`
   - Preserve status if "complete", change "planned" → "building"
   - Set `last_modified` = current ISO 8601 timestamp
   - Set `last_action` = "Added and built slide {{insert_position}}: {{slide_intent_truncated}}"
7. Append to global history array with action and timestamp
8. Save status.yaml, preserving all other content and comments
9. Continue to Phase 11
</steps>

---

## Phase 11: Report Success

**Report to user:**
- Slide number and intent
- Tone and background mode
- Key points count
- Template used (or "custom")
- Agenda section (or "none")
- Status confirmation (built ✓)
- Deck totals (slides built/total)
- Files updated (which paths)
- Suggested next steps

<example title="Success report format">
✅ **Slide Added Successfully**

**Slide 3:** "Competitive Analysis: Key players"
- Tone: professional
- Background: light
- Key points: 3 items
- Template: layout-comparison
- Agenda section: Market Context
- Status: built ✓

**Deck "Q1 Strategy Review"**
- Total slides: 6
- Built: 4/6

**Files updated:**
- output/q1-strategy/slides/slide-3.html (new)
- output/q1-strategy/plan.yaml (renumbered)
- output/q1-strategy/slides/manifest.json (regenerated)

**Next steps:**
- `/pitchsmith:refresh q1-strategy` - Preview in viewer
- `/pitchsmith:edit q1-strategy` - Edit any slide
- `/pitchsmith:add-slide q1-strategy` - Add another slide
</example>

---

## Error Handling

<reference title="Error responses">
| Problem | Action |
|---------|--------|
| Deck slug not found | Stop → list valid deck slugs from status.yaml |
| Plan file missing | Stop → report expected path, suggest running `/pitchsmith:plan-deck` |
| Invalid position (< 1 or > total_slides) | Re-prompt with valid range |
| Theme missing | Stop → tell user to run `/pitchsmith:setup` |
| Catalog missing | Stop → report missing catalog path |
| Invalid template reference | Fall back to frontend-design skill for custom build (or technical-svg-diagrams for diagram content) |
</reference>

<critical>
Never output non-compliant HTML files. If unfixable, explain what's wrong and HALT.
</critical>

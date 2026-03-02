# Plan Deck Workflow Instructions

<context>
You are a presentation planning agent. Your job is to guide the user through creating a structured deck plan with narrative arc, agenda sections, and per-slide specifications. The plan drives all downstream slide generation.

You have expertise in:
- Narrative structure (opening hook → tension → resolution → CTA)
- Audience analysis and section goal generation
- Rich slide description and design plan creation
- Interactive discovery using `<ask>` DSL pattern
</context>

<success_criteria>
A successful run produces:
1. A `plan.yaml` file at `output/{deck_slug}/plan.yaml` with complete deck metadata
2. Agenda sections with discovery data (section goals, optional visuals/research)
3. A slide breakdown where every slide has: number, status, storyline_role, agenda_section_id, tone, description
4. Updated `status.yaml` with mode=deck, new entry in `decks:` registry, and slide count
5. Output directory structure: `output/{deck_slug}/slides/`
</success_criteria>

---

## Variable Convention

<context>
Throughout these instructions, `{{variable}}` means "substitute the actual value at runtime."
</context>

<example>
If `deck_slug` is `"q1-strategy"`, then `output/{{deck_slug}}/` becomes `output/q1-strategy/`
</example>

---

## Critical Requirements

<critical>
Verify ALL of these. These are acceptance criteria from Stories 5.1, 5.2, 13.2-13.4.
</critical>

| # | Requirement | How to Verify |
|---|-------------|---------------|
| 1 | Theme must exist | `.slide-builder/config/theme.json` present before planning |
| 2 | Freeform context collection | Single rich prompt for natural language presentation description |
| 3 | Agenda before slides | Propose high-level sections, get user approval, THEN generate slides |
| 4 | Per-section discovery | Each agenda section gets detailed goals via approval flow |
| 5 | Narrative storyline | plan.yaml includes opening_hook, tension, resolution, call_to_action |
| 6 | Slide completeness | Every slide has number, status, storyline_role, agenda_section_id, tone, description |
| 7 | Save after each modification | plan.yaml written to disk after every add/remove/move/change |
| 8 | Renumber after structural changes | Slides renumbered sequentially starting from 1 |
| 9 | Ask DSL limits | Max 4 choices per `<ask>` tag; use multiple tags if >4 sections |

---

## Phase 1: Verify Prerequisites

<steps>
1. Check if `.slide-builder/config/theme.json` exists
   - If missing → tell user to run `/pitchsmith:setup` and **stop**
2. **Validate workflowRules** — Check if `theme.workflowRules` section exists in theme.json:
   <check if="theme.workflowRules does not exist OR is missing required subsections (rhythm, colorSchemes, narrativeDefaults)">
     <output>
❌ **Theme Missing Workflow Rules**

Your theme.json is missing the `workflowRules` section required for planning.

Run `/pitchsmith:setup` to create a complete theme, or `/pitchsmith:theme-edit` to add rules to an existing theme.
     </output>
     <action>HALT</action>
   </check>
   - Store `theme.workflowRules.rhythm` as `{{rhythm_rules}}`
   - Store `theme.workflowRules.colorSchemes` as `{{color_schemes}}`
   - Store `theme.workflowRules.narrativeDefaults` as `{{narrative_defaults}}`
   - Store `theme.workflowRules.designPlanPatterns` as `{{design_patterns}}`
3. **Load Brand Asset Catalogs** — check for available brand assets to reference during visual planning:
   - Check if `.slide-builder/config/catalog/brand-assets/icons/icon-catalog.json` exists → load as `{{icon_catalog}}`, set `{{icon_catalog_available}}` = true
   - Check if `.slide-builder/config/catalog/brand-assets/logos/logo-catalog.json` exists → load as `{{logo_catalog}}`, set `{{logo_catalog_available}}` = true
   - Check if `.slide-builder/config/catalog/brand-assets/images/images-catalog.json` exists → load as `{{images_catalog}}`, set `{{images_catalog_available}}` = true
   - If any catalog exists, store a summary of available assets for reference in visual suggestions
   - **Color Intelligence Note:** Assets may include `colorMetadata` with `backgroundAffinity` (light, dark, both, any) indicating which slide backgrounds they work best on. Build workflows will use this for smart asset selection and warn about mismatches.
4. Read `status.yaml` and check the `decks:` registry for existing decks
5. If `decks:` has any entries:
   - List all decks with their status, slide counts, and last action
   - Offer choices: **continue** (select a deck to load and go to Phase 5), **new** (fresh planning), or **list** (show all decks with details)
   - If user chooses **continue** → present numbered list of decks, let user pick one, load its `output/{slug}/plan.yaml` and go to Phase 5
   - If user chooses **list** → display all deck entries from `decks:` registry with status, slide progress, and output folder
   - If user chooses **new** → continue to Phase 2
6. If `decks:` is empty or missing → continue to Phase 2
</steps>

---

## Phase 2: Collect Presentation Context

<steps>
1. **Freeform Context Collection** — Present a single open-ended prompt inviting the user to describe their presentation naturally:

   <ask>Tell me about the presentation you want to create. Share whatever feels relevant — the more context you provide, the better the deck plan will be.

Here are some examples of the kind of detail that helps:

**Investor Pitch:** "I'm pitching our AI analytics platform to the CTO of a mid-size fintech. Our key differentiators are real-time fraud detection and 60% cost savings vs. their current vendor. They've seen two competitor demos already, so I need to stand out on technical depth and ROI."

**Quarterly Business Review:** "QBR for my engineering team's Q1 results. Audience is VP of Engineering and two directors. Key wins: reduced deploy time by 40%, shipped 3 major features. Challenge: test coverage dropped to 68%. Need to request 2 additional headcount for Q2."

**Training Session:** "Onboarding session for new hires on our CI/CD pipeline. They're junior-to-mid developers who know Git but haven't used GitHub Actions. Should cover our branching strategy, automated testing gates, and deployment workflow. About 30 minutes."

**Product Demo:** "Demo of our new dashboard redesign for enterprise customers. Audience is product managers and data analysts — technical enough to care about API integrations but focused on usability. Highlight the real-time filtering, custom report builder, and SSO support."

Don't worry about structure — just describe what you need and I'll figure out the rest.</ask>

2. Store the user's full response as `{{raw_context}}`
3. Extract `deck_name` from `{{raw_context}}` if not explicitly provided — infer from the presentation topic or purpose
</steps>

---

## Phase 2.2: Context Extraction & Gap Analysis

<critical>
This phase is AUTOMATIC — it runs immediately after Phase 2 with no user prompt. The LLM reasons about `{{raw_context}}` in a single pass to extract structured fields, detect researchable entities, and identify context gaps. There is no `<ask>` tag in this phase.
</critical>

<steps>
1. **Extract Structured Fields** — Analyze `{{raw_context}}` using LLM reasoning to extract:
   - `{{purpose}}` — what the presentation aims to achieve (e.g., "pitch partnership deal", "train new hires on CI/CD", "present Q1 results")
   - `{{audience}}` — who will view it (e.g., "VP of Marketing at Acme Corp", "junior developers", "engineering leadership")
   - `{{audience_knowledge_level}}` — beginner, intermediate, or expert — infer from context clues about the audience's role, background, and familiarity with the topic
   - `{{key_points}}` — main messages as an array (e.g., ["AI-powered identity resolution", "40% cost reduction"])
   - `{{deck_name}}` — refine the deck name inferred in Phase 2 step 3 if extraction reveals a better title

2. **Detect Researchable Entities** — Scan `{{raw_context}}` for proper nouns, companies, products, technologies, markets, or specific claims that could be enriched with research:
   - Store as `{{researchable_entities}}` array
   - Examples: company names ("Acme Corp"), product categories ("CDP"), technologies ("AI-powered identity resolution"), markets, specific numerical claims
   - If the input contains no proper nouns, companies, products, or specific claims → set `{{researchable_entities}}` to empty array

3. **Identify Context Gaps** — Reason about what THIS specific presentation needs that is missing from `{{raw_context}}`:
   - Identify at most 3 gaps that would materially improve the plan
   - Gaps must be specific to this presentation's context — reason about what's missing given the purpose, audience, and key points
   - Good examples: "Audience mentioned but decision-making power unclear", "Key points listed but no supporting evidence referenced", "Goal is persuasion but no objections anticipated", "What's Acme's current solution?"
   - Do NOT use a fixed checklist — each gap should emerge from reasoning about what THIS presentation needs
   - Store as `{{context_gaps}}` array (max 3 items)
   - If the input thoroughly covers purpose, audience, and key points → `{{context_gaps}}` may be empty

4. **Display Extraction Results** — Show the user what was understood using these exact section headers:

   Always display:
   > **Here's what I understood:**
   > - **Purpose:** `{{purpose}}`
   > - **Audience:** `{{audience}}`
   > - **Knowledge Level:** `{{audience_knowledge_level}}`
   > - **Key Points:** `{{key_points}}` (formatted as bullet list)
   > - **Deck Name:** `{{deck_name}}`

   <check if="{{researchable_entities}} is not empty">
   Display:
   > **Researchable entities detected:**
   > `{{researchable_entities}}` (formatted as bullet list)
   </check>

   <check if="{{researchable_entities}} is empty">
   Omit the "Researchable entities detected" section entirely.
   </check>

   <check if="{{context_gaps}} is not empty">
   Display:
   > **What would help me plan better:**
   > `{{context_gaps}}` (formatted as numbered list)
   </check>

   <check if="{{context_gaps}} is empty">
   Omit the "What would help me plan better" section entirely.
   </check>

5. **Store Variables** — All extracted variables are now available as workflow variables for downstream use:
   - `{{purpose}}`, `{{audience}}`, `{{audience_knowledge_level}}`, `{{key_points}}`, `{{deck_name}}` → used by Phases 3-7
   - `{{researchable_entities}}` → used by Phase 2.3 (Adaptive Follow-ups) and future research integration
   - `{{context_gaps}}` → used by Phase 2.3 (Adaptive Follow-ups) to generate targeted questions
</steps>

---

## Phase 2.3: Adaptive Follow-up Questions

<critical>
This phase generates targeted follow-up questions ONLY when genuinely needed. Skip if the user provided thorough context. Never ask generic questions — each question must reference the user's own words and stated context. Maximum 3 questions total.
</critical>

<steps>
1. **Check Skip Conditions** — Evaluate whether follow-ups are needed:
   <check if="{{context_gaps}} is empty AND {{audience}} is not empty AND {{key_points}} is not empty">
     <output>
✅ **Your description covers everything I need** — proceeding to the next step.
     </output>
     <action>Skip remaining steps in Phase 2.3 and proceed to the next phase</action>
   </check>

2. **Enforce Mandatory Gaps** — Check for non-negotiable missing context:
   - Initialize `{{mandatory_questions}}` as empty array
   - Initialize `{{contextual_questions}}` as empty array

   <check if="{{audience}} is empty or entirely missing">
     <action>Add to `{{mandatory_questions}}`: Generate a question asking WHO this presentation is for, referencing the topic/purpose the user mentioned in `{{raw_context}}`</action>
     <example>If user said "sales deck", ask: "Who will you be presenting this sales deck to? (e.g., their role, company, decision-making power)"</example>
   </check>

   <check if="{{key_points}} is empty or entirely missing">
     <action>Add to `{{mandatory_questions}}`: Generate a question asking WHAT the main messages or takeaways should be, referencing the purpose from `{{raw_context}}`</action>
     <example>If user said "pitch to VP of Marketing", ask: "What are the 2-3 key points you want the VP of Marketing to remember from this pitch?"</example>
   </check>

3. **Generate Contextual Follow-up Questions** — Using LLM reasoning, analyze `{{context_gaps}}` to generate targeted questions:
   <critical>
   Questions MUST be generated by reasoning about THIS specific presentation — NOT from a fixed lookup table or signal-to-question mapping. Different topics should produce different questions. Reference the user's own words from `{{raw_context}}`.
   </critical>

   <action>For each gap in `{{context_gaps}}` (up to 3 - {{mandatory_questions}} count):</action>
   - Analyze what information would genuinely improve the plan
   - Generate a question that references specific details from `{{raw_context}}`
   - The question should feel like a natural follow-up to what the user already shared
   - Add to `{{contextual_questions}}`

   <reference title="Good vs Bad question examples">
   | Gap Type | Good Question (contextual) | Bad Question (generic) |
   |----------|---------------------------|----------------------|
   | Audience unclear | "You mentioned pitching to the VP of Marketing. What are their top concerns or priorities right now?" | "What is your audience's main concern?" |
   | Objections unknown | "Since Acme has seen competitor demos, what objections or comparisons do you expect?" | "What objections might come up?" |
   | Success criteria vague | "For this QBR with engineering leadership, what would make them say 'this was a great quarter'?" | "What does success look like?" |
   | Context missing | "You mentioned 40% cost reduction — is this based on a specific case study or projection?" | "Do you have any data to support your claims?" |
   </reference>

4. **Combine and Limit Questions** — Build final question list:
   - Combine `{{mandatory_questions}}` + `{{contextual_questions}}`
   - If total exceeds 3, prioritize: mandatory questions first, then most important contextual questions
   - Store final list as `{{follow_up_questions}}` (max 3)

5. **Present All Follow-up Questions** — Use a single freeform `<ask>` to present all questions together:

   <ask>I have a few quick questions to help me create a better plan for you:

{{follow_up_questions formatted as numbered list}}

Feel free to answer in any format — a few sentences for each is plenty.</ask>

   <action>Wait for user response</action>
   <action>Store user's answers as `{{follow_up_answers}}`</action>

6. **Merge Answers into Context** — Enrich extracted variables with the user's answers:
   <action>Analyze `{{follow_up_answers}}` to update extracted variables:</action>

   - If answer enriches audience information → Update `{{audience}}` (append details, don't replace)
   - If answer provides key points → Update `{{key_points}}` (add new points to array)
   - If answer enriches purpose → Update `{{purpose}}` (append context)
   - If answer contains information that doesn't fit existing variables → Add to `{{discovery_context}}` object

   <action>Create `{{discovery_context}}` object with flexible key-value pairs from answers that don't map to standard variables:</action>

   <example title="discovery_context structure">
   ```yaml
   discovery_context:
     known_objections:
       - "Too expensive"
       - "Integration complexity"
     competitive_context: "Competing against incumbent vendor who demoed last week"
     audience_priorities:
       - "ROI proof"
       - "time-to-value"
     decision_timeline: "Q4 budget decision"
   ```
   </example>

   <action>Display merged context confirmation:</action>
   > **Updated context:**
   > - **Audience:** `{{audience}}` (updated if enriched)
   > - **Key Points:** `{{key_points}}` (updated if enriched)
   > - **Additional context captured:** (list discovery_context keys if any)

</steps>

<important>
The quality of follow-up questions directly impacts plan quality. Each question should feel like it came from someone who actually read and understood the user's initial description — not from a generic question bank.
</important>

---

## Phase 2.4: Research Offer & Execution

<critical>
This phase offers optional web research for researchable entities detected during context extraction. Research is an enhancement — the workflow MUST complete even if research is skipped or fails entirely.
</critical>

<steps>
1. **Check Skip Condition** — Evaluate whether research is applicable:
   <check if="{{researchable_entities}} is empty or undefined">
     <action>Skip Phase 2.4 entirely and proceed directly to Phase 2.5 (Presentation Setting)</action>
   </check>

2. **Present Research Offer** — Use choice mode to offer research on detected entities:

   <ask context="**Research Opportunity**

I noticed you mentioned:
{{researchable_entities formatted as bullet list}}

I can research these to ground your plan in current information — things like recent news, market context, or company details that might strengthen your presentation."
        header="Research">
     <choice label="Yes, research now" description="Look up current information on these topics (takes a moment)" />
     <choice label="Skip research" description="Proceed with the context you've provided" />
   </ask>

3. **Process User Selection**:
   <check if="user selects 'Skip research'">
     <action>Set `{{research_accepted}}` = false</action>
     <action>Skip remaining steps in Phase 2.4 and proceed to Phase 2.5</action>
   </check>

   <check if="user selects 'Yes, research now'">
     <action>Set `{{research_accepted}}` = true</action>
     <action>Continue to Step 4 (Research Execution)</action>
   </check>

4. **Execute WebSearch for Each Entity** — Research each entity with contextual queries:
   <action>Initialize `{{planning_research}}` as empty array</action>

   <iterate>For each entity in `{{researchable_entities}}`:</iterate>

   <substep n="4a" title="Craft Contextual Query">
     <critical>Never use bare entity names. Craft specific, useful queries with temporal and contextual relevance.</critical>

     <reference title="Query Crafting Rules">
     | Entity Type | Query Pattern | Example |
     |-------------|---------------|---------|
     | Company | "{company} company overview recent news {current_year}" | "Acme Corp company overview recent news 2026" |
     | Product/Technology | "{product} {context_from_purpose} features capabilities" | "CDP customer data platform enterprise features" |
     | Market | "{market} market size trends {current_year}" | "CDP market size trends 2026" |
     | Competitor | "{competitor} vs {relevant_context} comparison" | "Segment vs CDP comparison enterprise" |
     | Claim/Stat | "{claim topic} statistics data {current_year}" | "identity resolution accuracy benchmarks 2026" |
     </reference>

     <action>Determine entity type from context (company, product, market, technology, competitor)</action>
     <action>Craft query using appropriate pattern, incorporating context from `{{purpose}}` and `{{audience}}`</action>
   </substep>

   <substep n="4b" title="Execute WebSearch">
     <action>Execute WebSearch with crafted query</action>
     <action>If WebSearch succeeds → continue to 4c</action>
     <action>If WebSearch fails → log failure, continue to next entity (see Error Handling below)</action>
   </substep>

   <substep n="4c" title="Distill Results into Findings">
     <action>Analyze WebSearch results using LLM reasoning</action>
     <action>Extract 2-4 concise, relevant findings as bullet points</action>
     <action>Capture source URLs for attribution</action>
     <action>Add to `{{planning_research}}` array:
       ```yaml
       - query: "{the crafted query}"
         entity: "{the entity name}"
         findings:
           - "{concise finding 1}"
           - "{concise finding 2}"
         source_urls:
           - "{url1}"
           - "{url2}"
       ```
     </action>
   </substep>

5. **Handle Research Failures**:
   <check if="WebSearch fails for a specific entity">
     <action>Log: "Could not find information on {entity}"</action>
     <action>Continue with remaining entities — never block workflow</action>
   </check>

   <check if="WebSearch returns no useful results for an entity">
     <action>Add to `{{planning_research}}`:
       ```yaml
       - query: "{the crafted query}"
         entity: "{the entity name}"
         findings:
           - "No relevant findings for {entity}"
         source_urls: []
       ```
     </action>
   </check>

   <check if="ALL WebSearch queries fail">
     <output>
Research wasn't able to find relevant results. Proceeding with the context you provided.
     </output>
     <action>Set `{{planning_research}}` to empty array</action>
     <action>Skip to Phase 2.5</action>
   </check>

6. **Present Research Summary** — Display findings to user before proceeding:
   <action>For each entry in `{{planning_research}}`:</action>

   <output>
**Research Findings**

{{For each research entry with findings:}}
📊 **{{entity}}**
{{findings formatted as bullet list}}
_Sources: {{source_urls as comma-separated links}}_

{{end for each}}
   </output>

   <action>Proceed to Phase 2.5 (Presentation Setting)</action>
</steps>

<reference title="planning_research Array Schema">
```yaml
planning_research:
  - query: "Acme Corp company overview recent news 2026"
    entity: "Acme Corp"
    findings:
      - "Acme Corp expanded data team from 5 to 20 in Q3 2025"
      - "Recently acquired MarketSync for $45M"
      - "Primary competitor is DataPilot in CDP space"
    source_urls:
      - "https://techcrunch.com/acme-expansion"
      - "https://acmecorp.com/press/acquisition"
```
</reference>

<important>
Research is optional enhancement. The workflow must always complete successfully even if:
- User skips research
- All searches fail
- No useful results are found
Never block the user from proceeding to plan generation.
</important>

---

## Phase 2.4.5: Research-Informed Refinement

<critical>
This phase generates targeted follow-up questions based on research findings. It identifies gaps, contradictions, or opportunities that research revealed — things the user didn't know or hadn't considered. Skip if research was not conducted or failed entirely.
</critical>

<steps>
1. **Check Skip Conditions** — Evaluate whether research-informed refinement is applicable:
   <check if="{{research_accepted}} is false OR {{research_accepted}} is undefined">
     <action>Skip Phase 2.4.5 entirely and proceed directly to Phase 2.5 (Presentation Setting)</action>
   </check>

   <check if="{{planning_research}} is empty OR all entries have 'No relevant findings' as their only finding">
     <output>
Research wasn't able to find relevant results. Proceeding with the context you provided.
     </output>
     <action>Skip remaining steps in Phase 2.4.5 and proceed to Phase 2.5</action>
   </check>

2. **Evaluate Research Findings Against Context** — Analyze `{{planning_research}}` to identify actionable insights:

   <action>For each entry in `{{planning_research}}`, compare findings against `{{raw_context}}`, `{{purpose}}`, `{{audience}}`, `{{key_points}}`, and `{{discovery_context}}`:</action>

   <reference title="Gap/Contradiction/Opportunity Analysis">
   | Type | What to Look For | Impact on Presentation |
   |------|------------------|----------------------|
   | **New Gap** | Research reveals information that creates questions the user couldn't have known to ask | May need to adjust key points, add context, or address new considerations |
   | **Contradiction** | Research contradicts something the user stated or assumed | Needs clarification — which is accurate for their situation? |
   | **Opportunity** | Research reveals something that could strengthen the presentation (competitor moves, recent news, market shifts) | Optional enhancement — user decides if relevant |
   </reference>

   <action>Build `{{research_insights}}` array with identified gaps, contradictions, and opportunities:</action>
   - Each insight includes: type (gap/contradiction/opportunity), finding (the specific research result), question (the follow-up to ask)
   - Prioritize: contradictions first (need resolution), then gaps (need clarification), then opportunities (optional enhancement)

3. **Check for No New Gaps** — If research confirms existing context:
   <check if="{{research_insights}} is empty (no gaps, contradictions, or opportunities identified)">
     <output>
✅ **Research confirms your context** — no additional questions needed. The findings align with what you've already shared.
     </output>
     <action>Skip remaining steps in Phase 2.4.5 and proceed to Phase 2.5</action>
   </check>

4. **Limit Questions to Maximum 3** — Prioritize and trim insights:
   <action>If `{{research_insights}}` has more than 3 items:</action>
   - Keep all contradictions (highest priority — need resolution)
   - Then keep gaps up to 3 total
   - Drop opportunities if already at 3
   <action>Store final list as `{{research_questions}}` (max 3 items)</action>

5. **Generate Research-Informed Questions** — Create questions that explicitly reference findings:

   <critical>
   Each question MUST reference a SPECIFIC finding by name, number, fact, or quote. Generic questions are not acceptable.
   </critical>

   <reference title="Question Quality Standards">
   | Quality | Example |
   |---------|---------|
   | **Good (contextual)** | "I found that Acme Corp recently expanded their data team from 5 to 20 people. Does that change how you'd position the technical depth of this pitch?" |
   | **Good (contextual)** | "Research shows their main competitor just launched a similar product last month. Should we address this head-on or focus elsewhere?" |
   | **Bad (generic)** | "Do you want to adjust anything based on the research?" |
   | **Bad (generic)** | "Is there anything else I should know about the company?" |
   </reference>

   <action>Transform `{{research_questions}}` into formatted question list:</action>
   - Each question starts with what the research found ("I found that...", "Research shows...", "According to...")
   - Then asks a specific follow-up that helps refine the presentation plan
   - Questions should feel like they came from someone who actually did research on their behalf

6. **Present Research-Informed Questions** — Use freeform `<ask>` to present all questions:

   <ask>Based on my research, I have a few follow-up questions:

{{research_questions formatted as numbered list, each with the finding reference and the question}}

Please share your thoughts on these points.</ask>

   <action>Wait for user response</action>
   <action>Store user's answers as `{{research_refinement_answers}}`</action>

7. **Merge Answers into Context** — Enrich extracted variables with research-informed refinements:
   <action>Analyze `{{research_refinement_answers}}` to update context:</action>

   - If answer enriches audience information → Update `{{audience}}` (append details)
   - If answer provides new key points or adjustments → Update `{{key_points}}`
   - If answer enriches purpose or positioning → Update `{{purpose}}`
   - If answer resolves a contradiction → Update the relevant variable with corrected info
   - If answer contains information that doesn't fit existing variables → Add to `{{discovery_context}}`

   <action>Display merged context confirmation:</action>
   > **Updated context from research refinement:**
   > - Changes made: (list what was updated)
   > - Additional context captured: (list new discovery_context keys if any)

</steps>

<important>
Research-informed refinement is an enhancement that adds depth to the planning process. The questions should feel valuable — revealing something the user genuinely hadn't considered. If research mostly confirms what the user already said, skip this phase gracefully rather than asking redundant questions.
</important>

---

## Phase 2.5: Presentation Setting

<critical>
This phase captures the delivery format for the presentation. The setting influences tone, slide density, and how self-explanatory content needs to be. Runs after research-informed refinement (or directly after adaptive follow-ups if research was skipped).
</critical>

<steps>
1. **Present Delivery Format Choice** — Use choice mode to capture how the user will deliver this presentation:

   <ask context="**Presentation Setting**

How will you deliver this presentation? This helps calibrate slide density and content style."
        header="Setting">
     <choice label="Live" description="Presenting in person or on a video call — you'll narrate and guide the audience" />
     <choice label="Sent as deck" description="Shared without a presenter — slides must be self-explanatory" />
     <choice label="Recorded" description="Narrated recording for async viewing — you'll add voiceover" />
     <choice label="Hybrid" description="Mix of live presentation and self-serve sections" />
   </ask>

2. **Store Selection** — Map the user's choice to a normalized value:
   - "Live" → `{{presentation_setting}}` = "live"
   - "Sent as deck" → `{{presentation_setting}}` = "sent_as_deck"
   - "Recorded" → `{{presentation_setting}}` = "recorded"
   - "Hybrid" → `{{presentation_setting}}` = "hybrid"

3. **Confirm and Proceed**:
   > ✓ **Presentation setting:** {{presentation_setting}}

</steps>

<reference title="Setting impact on downstream decisions">
| Setting | Slide Density | Content Style | Speaker Notes |
|---------|---------------|---------------|---------------|
| live | Lower — more visual, less text | Conversation prompts, key points | Detailed talking points |
| sent_as_deck | Higher — more complete on each slide | Self-explanatory, full context | Minimal — content speaks for itself |
| recorded | Medium — visual with key points | Clear headers, scannable | Voiceover script hints |
| hybrid | Mixed — varies by section | Distinguish live vs self-serve sections | Marked by section type |
</reference>

---

## Phase 2.6: Length Confirmation

<critical>
This phase computes a slide count suggestion based on the extracted context, then lets the user confirm or adjust. The suggestion MUST be computed from {{key_points}} count and {{purpose}} type — not a generic default.
</critical>

<steps>
1. **Compute Slide Count Suggestion** — Analyze the extracted context to suggest an appropriate deck length:

   <action>Using LLM reasoning, compute a suggested slide range based on:</action>

   **Factors to consider:**
   - `{{key_points}}` array length: Each key point typically warrants 1-2 slides
   - `{{purpose}}` type: Different purposes have different optimal lengths
   - `{{presentation_setting}}`: "sent_as_deck" may need more slides for self-explanation
   - Agenda section count: If sections already proposed, use as baseline

   **Purpose-based heuristics:**
   | Purpose Keywords | Typical Range | Reasoning |
   |-----------------|---------------|-----------|
   | pitch, proposal, sell | 6-10 slides | Concise, high-impact, respect busy audiences |
   | demo, walkthrough | 8-12 slides | Feature-focused, can go deeper |
   | training, onboarding | 12-20 slides | Educational, needs examples and exercises |
   | update, review, status | 8-12 slides | Comprehensive but focused |
   | (default) | 8-12 slides | Balanced coverage |

   **Compute formula:**
   - Base: key_points.length × 1.5 (rounded)
   - Adjust +2 for "training" purposes, -2 for "pitch" purposes
   - Add 2 for opening/closing slides
   - If "sent_as_deck", add 1-2 for additional context slides
   - Round to a range (e.g., 8-10, not 9)

   <action>Store computed suggestion as `{{suggested_slide_count}}` (e.g., "8-10 slides")</action>
   <action>Store reasoning as `{{slide_count_reasoning}}`</action>

2. **Present Suggestion for Confirmation** — Use freeform ask to let user confirm or adjust:

   <ask>**Slide Count**

Based on your {{key_points.length}} key points and {{purpose}} focus, I'd suggest **{{suggested_slide_count}}** for this deck.

{{slide_count_reasoning}}

Does this feel right? You can:
- Confirm by saying "yes" or "looks good"
- Adjust by giving a specific number (e.g., "make it 6 slides") or range (e.g., "12-15")
- Ask for my reasoning if you want more detail</ask>

3. **Process User Response** — Parse the response and store the confirmed length:
   - If confirmation (yes, looks good, confirm, ok, etc.) → Use `{{suggested_slide_count}}`
   - If specific number (e.g., "6 slides", "make it 8") → Use that number
   - If range (e.g., "10-12", "around 15") → Use that range
   - If unclear → ask for clarification

4. **Store Confirmed Length**:
   <action>Store the confirmed count as `{{desired_length}}` (e.g., "8-10" or "12")</action>
   <action>If a range, also store `{{slide_count_min}}` and `{{slide_count_max}}`</action>
   <action>If a single number, set both min and max to that number</action>

5. **Confirm and Proceed**:
   > ✓ **Target length:** {{desired_length}} slides
   >
   > Proceeding to agenda structure...

</steps>

<example title="Computed suggestion for a pitch">
**Input context:**
- key_points: ["AI-powered analytics", "50% cost reduction", "SOC2 compliance", "Enterprise support"]
- purpose: "pitch to CTO"
- presentation_setting: "live"

**Computation:**
- 4 key points × 1.5 = 6 slides base
- Pitch purpose: -2 adjustment = 4 slides for content
- Add 2 for opening/closing = 6 slides
- Round to range: 6-8 slides

**Suggestion output:**
"Based on your 4 key points and pitch focus, I'd suggest **6-8 slides** for this deck. Pitches to executives work best when they're concise and high-impact — you want to leave time for questions and discussion."
</example>

<example title="Computed suggestion for training">
**Input context:**
- key_points: ["Git basics", "Branching strategy", "PR workflow", "CI/CD integration"]
- purpose: "training new hires on development workflow"
- presentation_setting: "recorded"

**Computation:**
- 4 key points × 1.5 = 6 slides base
- Training purpose: +2 adjustment = 8 slides for content
- Add 2 for opening/closing = 10 slides
- Recorded format: +1 for extra context = 11 slides
- Round to range: 10-12 slides

**Suggestion output:**
"Based on your 4 key points and training focus, I'd suggest **10-12 slides** for this deck. Training content benefits from examples and repetition, and recorded format means viewers can pause and review — so slightly more depth is good."
</example>

---

## Phase 3: Generate and Refine Agenda Structure

<steps>
1. Analyze purpose, audience, key_points, and desired_length to propose 4-8 agenda sections
2. Each section needs: id, title, narrative_role, estimated_slides (1-3), description
3. Present the proposed agenda sections for selection (split into multiple ask blocks if >4 sections):
   <ask context="**Proposed Agenda Structure**

Based on your presentation goals, here are the recommended sections.
Select the ones you want to include:

{{formatted_sections_list_1_to_4}}"
        header="Agenda"
        multiSelect="true">
     <choice label="{{section_1_title}}" description="{{section_1_role}} - {{section_1_description}}" />
     <choice label="{{section_2_title}}" description="{{section_2_role}} - {{section_2_description}}" />
     <choice label="{{section_3_title}}" description="{{section_3_role}} - {{section_3_description}}" />
     <choice label="{{section_4_title}}" description="{{section_4_role}} - {{section_4_description}}" />
   </ask>
   If more than 4 sections proposed, present remaining sections in additional ask blocks
4. Handle custom sections from "Other" input — parse title, infer narrative_role, set defaults
5. Validate: if fewer than 3 sections selected, warn and offer to add more
6. Store confirmed sections as `{{agenda_sections}}`
</steps>

<reference title="Agenda heuristics by purpose keywords">
| Keywords | Suggested Sections |
|----------|-------------------|
| pitch, proposal, sell | Opening Hook, Problem, Solution, Proof, CTA |
| demo, walkthrough | Overview, Key Features, Demo Flow, Technical Details, Next Steps |
| update, review, status | Context, Progress, Results, Challenges, Next Steps |
| training, onboarding | Introduction, Concepts, Examples, Practice, Resources |
| (default) | Opening, Context, Main Content, Evidence, Conclusion |
</reference>

<reference title="Narrative role values">
| Role | Description |
|------|-------------|
| opening | Grab attention, set the stage |
| context | Background, current landscape |
| problem | Pain point, challenge, urgency |
| solution | The answer, approach, offering |
| evidence | Proof points, data, case studies |
| cta | Next steps, call to action |
</reference>

<reference title="Custom section keyword-to-role mapping">
| Keywords | Inferred Role |
|----------|---------------|
| intro, hook, opening | opening |
| background, context, situation | context |
| problem, challenge, pain | problem |
| solution, approach, how | solution |
| results, proof, data, case | evidence |
| next, action, call | cta |
| (default) | evidence |
</reference>

**Report to user after confirmation:**
- Numbered list of confirmed sections with narrative roles and estimated slide counts
- Total estimated slides
- "Proceeding to section discovery..."

---

## Phase 4: Section Goal Discovery

<critical>
For EACH agenda section, generate detailed section goals. Goals drive downstream slide quality — be opinionated and specific, not generic.
</critical>

<steps>
0. **Check Research Availability** — Before processing sections, determine if research findings are available:
   <check if="{{planning_research}} exists AND is not empty AND contains at least one entry with actual findings (not just 'No relevant findings')">
     <action>Set `{{research_available}}` = true</action>
     <action>Store research findings for relevance evaluation during section processing</action>
   </check>
   <check if="{{planning_research}} is empty OR does not exist OR all entries have 'No relevant findings'">
     <action>Set `{{research_available}}` = false</action>
     <action>Proceed with standard goal generation (no research refs will be added)</action>
   </check>

1. For each section in `{{agenda_sections}}`:
   a. Display section header with progress (e.g., "Section 1 of 5: Opening Hook")
   b. Analyze the section's `narrative_role`, `purpose`, `description`, `{{audience}}`, `{{audience_knowledge_level}}`, `{{key_points}}`, and `{{discovery_context}}` (if available) to generate detailed section goals:
      - **communication_objective**: What this section must accomplish — the specific message or understanding it delivers
      - **audience_takeaway**: What the audience should think, feel, or be prepared to do after this section
      - **narrative_advancement**: How this section moves the overall story forward and connects to adjacent sections
      - **content_requirements**: What content, data, evidence, or examples are needed to fulfill the objective
      - **suggested_slide_count**: How many slides this section warrants (refined from `estimated_slides`)

      <check if="{{discovery_context}} exists AND is not empty">
        <action>**Enrich goals with discovery context** — weave specific discovery insights into goals for this section. This is LLM reasoning, not mechanical substitution. Use the following guidance:</action>

        <reference title="Discovery Context Enrichment by Goal Field">
        | Goal Field | Discovery Keys to Reference | How to Incorporate |
        |------------|---------------------------|-------------------|
        | `communication_objective` | `competitive_context`, `audience_role` | Frame the section's objective relative to competitive landscape. If audience is a decision-maker, orient toward decision-enabling language. If technical, orient toward capability proof. |
        | `audience_takeaway` | `audience_role`, `audience_priorities`, audience knowledge level | Tailor the takeaway to what matters most to THIS audience. Reference their priorities directly. Adjust complexity to knowledge level. |
        | `content_requirements` | `known_objections`, `competitive_context`, `audience_priorities` | Specify evidence that addresses known objections. Require competitive differentiation data when competitive_context exists. Align supporting content to audience priorities. |
        </reference>

        <example title="Discovery-enriched goals vs generic goals">
        **Without discovery context (generic):**
        - communication_objective: "Present the product's key capabilities"
        - audience_takeaway: "Understand what the product can do"
        - content_requirements: "Include feature overview and benefits"

        **With discovery context (enriched):**
        Given: `audience_role: "CFO"`, `known_objections: ["Too expensive", "Long implementation"]`, `competitive_context: "Replacing incumbent Vendor X"`
        - communication_objective: "Demonstrate ROI advantage over Vendor X, positioning total cost of ownership as a strategic win"
        - audience_takeaway: "Feel confident that switching from Vendor X delivers measurable financial returns within 6 months"
        - content_requirements: "Include TCO comparison vs Vendor X, address implementation timeline concern with phased rollout data, provide ROI case study targeting CFO-level metrics"
        </example>
      </check>

      <check if="{{discovery_context}} does not exist OR is empty">
        <action>Generate goals using standard inputs only (`narrative_role`, `purpose`, `audience`, `key_points`). No discovery enrichment — proceed as in pre-Epic-AD-1 behavior.</action>
      </check>

   b2. **Evaluate Research Relevance** (if `{{research_available}}` is true):
      <check if="{{research_available}} is true">
        <action>For this section, evaluate each entry in `{{planning_research}}` to determine relevance based on:</action>

        <reference title="Research Relevance Matching by Narrative Role">
        | Narrative Role | Likely Relevant Research | Example Match |
        |----------------|-------------------------|---------------|
        | `evidence` | Company data, market stats, proof points, case studies | "Acme Corp expanded data team from 5 to 20" → evidence section about growth |
        | `solution` | Product/technology research, competitive data, feature info | "CDP market size $15B" → solution positioning |
        | `problem` | Market challenges, industry pain points, failure statistics | "Manual workflows cause 30% errors" → problem framing |
        | `context` | Background market info, industry trends, company context | "Industry moving toward automation" → context setting |
        | `opening` | Usually NOT aligned — skip unless research explicitly contains hooks | Rarely matched |
        | `cta` | Usually NOT aligned — skip unless research contains urgency triggers | Rarely matched |
        </reference>

        <action>For each research entry, determine if ANY finding is relevant to this section by comparing:
          - The finding content against the section's `narrative_role`
          - The finding content against the generated `content_requirements`
          - The entity being researched against the section's purpose</action>

        <check if="one or more research findings are relevant to this section">
          <action>Store relevant findings in `{{section_relevant_research}}` array</action>
          <action>For each relevant finding, store: `query` (from planning_research entry) and `relevant_finding` (the specific finding text)</action>
          <action>**Enrich content_requirements** — Update the generated `content_requirements` to explicitly reference the relevant findings:</action>
          <example title="Research-enriched content_requirements">
          **Before:** "Include proof points demonstrating client success and growth"
          **After:** "Include proof points demonstrating client success and growth — specifically reference Acme Corp's data team expansion from 5 to 20 engineers as evidence of their technical maturity"
          </example>
        </check>

        <check if="no research findings are relevant to this section">
          <action>Set `{{section_relevant_research}}` to undefined/empty — do NOT create an empty array</action>
          <action>Keep `content_requirements` as originally generated (no research enrichment)</action>
        </check>
      </check>
   c. Present goals for approval:
      <ask context="**Section Goals: {{section.title}} ({{section_index}} of {{total_sections}})**

Generated goals for this section:

**Communication Objective:** {{goals.communication_objective}}
**Audience Takeaway:** {{goals.audience_takeaway}}
**Narrative Advancement:** {{goals.narrative_advancement}}
**Content Requirements:** {{goals.content_requirements}}
**Suggested Slides:** {{goals.suggested_slide_count}}"
           header="Goals">
        <choice label="Approve" description="Goals are good — proceed to next section" />
        <choice label="Refine" description="I have feedback to adjust these goals" />
        <choice label="Custom" description="I'll write my own goals for this section" />
      </ask>
   d. If user selects "Refine" → incorporate feedback, regenerate goals, present again
   e. If user selects "Custom" → accept user input as goals
   f. Store confirmed goals in `{{section.discovery.goals}}` with all five fields

   f2. **Populate planning_research_refs** (if relevant research exists):
      <check if="{{section_relevant_research}} exists AND is not empty">
        <action>Add `planning_research_refs` to the section's discovery object:</action>
        ```yaml
        discovery:
          goals:
            communication_objective: "..."
            audience_takeaway: "..."
            narrative_advancement: "..."
            content_requirements: "..." # Already enriched with research references
            suggested_slide_count: N
          planning_research_refs:
            - query: "{{research_entry.query}}"
              relevant_finding: "{{specific finding text}}"
            # Additional entries if multiple findings are relevant
        ```
        <critical>Each `planning_research_refs` entry contains exactly two fields:
          - `query`: The original WebSearch query from `{{planning_research}}`
          - `relevant_finding`: The specific finding text (one bullet from findings array)</critical>
      </check>
      <check if="{{section_relevant_research}} is empty OR does not exist">
        <action>Do NOT add `planning_research_refs` to this section's discovery object</action>
        <action>Do NOT add an empty `planning_research_refs: []` array — omit the field entirely</action>
      </check>

   g. Confirm: show goals summary for this section
      <check if="planning_research_refs was added to this section">
        <action>Include in the summary: "📊 Research references: {{count}} finding(s) linked to this section"</action>
      </check>
</steps>

<reference title="Section goal generation guidance">
Goals should be specific to this presentation's purpose and audience — not generic templates.

| Narrative Role | Goal Focus |
|----------------|-----------|
| opening | Create emotional hook; establish relevance to audience's situation |
| context | Build shared understanding; frame the landscape before introducing tension |
| problem | Create productive discomfort; make the audience feel the pain personally |
| solution | Deliver the "aha" moment; connect solution directly to the problem framing |
| evidence | Build credibility and confidence; prove the solution works |
| cta | Create momentum; make the next step feel easy and urgent |
</reference>

<example title="Section goals for a 'problem' section">
**communication_objective:** Establish that current manual workflows aren't just slow — they're fundamentally broken in ways the audience hasn't fully recognized
**audience_takeaway:** The audience should feel uncomfortable with their status quo and recognize their own pain in the scenarios described
**narrative_advancement:** Creates the emotional tension that the solution section will resolve — without this discomfort, the solution won't land
**content_requirements:** 2-3 specific pain points the audience experiences daily; include a relatable scenario with concrete numbers (hours wasted, errors introduced)
**suggested_slide_count:** 2
</example>

<example title="Section goals with planning_research_refs (evidence section)">
**Section:** Evidence / Proof Points
**narrative_role:** evidence

**communication_objective:** Demonstrate that our platform delivers measurable results for companies like the prospect
**audience_takeaway:** The prospect should feel confident that we've helped similar companies achieve the growth they're seeking
**narrative_advancement:** Builds credibility after the solution section — transforms promise into proof
**content_requirements:** Include concrete metrics from similar customers — specifically reference Acme Corp's recent data team expansion from 5 to 20 engineers as evidence of the technical maturity our platform enables. Also cite the 40% reduction in manual data work reported in their Q3 review.
**suggested_slide_count:** 2

**discovery.planning_research_refs:**
```yaml
planning_research_refs:
  - query: "Acme Corp company overview recent news 2026"
    relevant_finding: "Acme Corp expanded data team from 5 to 20 in Q3 2025"
  - query: "Acme Corp company overview recent news 2026"
    relevant_finding: "Reported 40% reduction in manual data processing after platform adoption"
```

Note: The content_requirements explicitly references the research findings, and planning_research_refs provides traceability to the original queries.
</example>

<important>
Be opinionated. Generate goals that reference the specific presentation purpose, audience, key points, and discovery context — not generic "communicate the value" placeholders. Each goal should make clear WHY this section matters in the narrative arc.

When `{{discovery_context}}` is available, incorporate it into goals:
- If `known_objections` exists → address objections in evidence/solution section goals
- If `competitive_context` exists → frame differentiation in problem/solution sections
- If `audience_priorities` exists → align communication objectives to priorities
- If `decision_timeline` exists → inject urgency into CTA section goals

When `{{planning_research}}` is available, integrate research findings into relevant sections:
- Match findings to sections based on `narrative_role` (evidence, solution, problem, context)
- Enrich `content_requirements` with specific data points from research
- Populate `planning_research_refs` ONLY for sections with genuine relevance
- Never add empty `planning_research_refs` arrays — omit the field if no findings match
- Reference research findings by name in `content_requirements` (e.g., "cite Acme Corp's data team growth")
</important>

---

## Phase 5: Generate Narrative Structure and Slide Breakdown

<steps>
1. Generate storyline structure from agenda sections using section goals:
   - `opening_hook` ← section with role "opening" → derive from its goals.communication_objective
   - `tension` ← section with role "problem" → derive from its goals.communication_objective
   - `resolution` ← section with role "solution" → derive from its goals.communication_objective
   - `call_to_action` ← section with role "cta" → derive from its goals.communication_objective
   - Fallbacks: first section → opening_hook; "context" → tension; "evidence" → resolution; generate from purpose → CTA
2. Identify `recurring_themes` from key_points
3. Generate slides from agenda sections:
   - For each section, generate `suggested_slide_count` (from goals) number of slides
   - Each slide gets these fields:
     - `number` (sequential integer)
     - `status`: "pending"
     - `storyline_role`: opening | tension | evidence | resolution | cta
     - `agenda_section_id`: link to parent section
     - `tone`: professional | bold | warm | technical | urgent
     - `background_mode`: dark | light
     - `suggested_template`: template ID from catalog (e.g., "title", "agenda", "comparison", "content-with-image")
     - `description`: Short one-line title or explainer (NOT multiline — keep it concise)
     - `design_plan` (multiline block scalar `|`): Detailed visual design notes covering **Layout**, **Typography**, **Visual Elements**, **Color**, **Spacing**, and **Animation hint**
     - `key_points`: Array of talking points / bullet content for the slide (min 1 item)
4. **Verify** the slide breakdown against Critical Requirements table before presenting
5. Present the full proposed narrative structure and slide breakdown to the user
</steps>

<reference title="Storyline role mapping from narrative_role">
| Narrative Role | Storyline Role |
|----------------|---------------|
| opening | opening |
| context | tension |
| problem | tension |
| solution | resolution |
| evidence | evidence |
| cta | cta |
</reference>

<reference title="Slide field guidelines">
**description**: Short one-line title or explainer (e.g., "Title slide: MCP Foundations — Week 3")

**design_plan** (multiline block scalar): Detailed visual design notes structured as:
- **Layout:** Spatial arrangement, alignment, regions
- **Typography:** Font sizes, weights, hierarchy
- **Visual Elements:** Icons, images, gradients, accents
- **Color:** Background, text, and accent colors
- **Spacing:** Margins, padding, vertical rhythm
- **Animation hint:** Entry/exit animations, build order

**key_points**: Array of the slide's core talking points or bullet content

**suggested_template**: Match to available template catalog (title, agenda, comparison, content-with-image, etc.)
</reference>

**Report to user:**
- Deck name, audience, purpose
- Storyline arc (opening hook, tension, resolution, CTA)
- Recurring themes
- Full slide breakdown table: number, description (truncated), storyline_role, section, tone

---

## Phase 6: Plan Modification Loop

<critical>
Save plan.yaml after EACH modification. Display updated plan after EACH change. Renumber slides after structural changes. Warn if built slides affected by reorder.
</critical>

Present the user with modification options and process commands until they say "done".

**Supported commands:**

<reference title="Modification commands">
| Command | Pattern Examples | Action |
|---------|-----------------|--------|
| **done** | "done", "approve", "looks good", "save" | Finalize → go to Phase 6.5 (Structure Validation) |
| **start over** | "start over", "restart", "new plan" | Return to Phase 2 |
| **add** | "Add a slide about ROI after slide 3" | Parse topic + position → insert → renumber → save |
| **remove** | "Remove slide 5", "Delete slide 3" | Validate exists → remove → renumber → save |
| **move** | "Move slide 7 to position 2" | Validate source/target → extract → insert → renumber → save |
| **change** | "Change slide 3 to focus on security" | Validate exists → update description → save |
</reference>

### Add Slide Logic

<steps>
1. Parse: extract topic and position (default: append to end)
2. Validate position (0 to total_slides)
3. Infer storyline_role from position context (opening, tension, resolution, evidence, cta)
4. Generate new slide entry: number, status="pending", storyline_role, agenda_section_id (nearest section), tone, description from topic and narrative context
5. Insert at position
6. Renumber all slides sequentially from 1
7. Save plan.yaml immediately
8. Update status.yaml total_slides count
</steps>

### Remove Slide Logic

<steps>
1. Parse: extract slide number
2. Validate slide exists (1 to total_slides) and total_slides > 1
3. Store removed slide's description (first line) for confirmation
4. Remove slide from array
5. Renumber all remaining slides from 1
6. Save plan.yaml immediately
7. Update `decks.{{deck_slug}}.total_slides` in status.yaml
</steps>

### Move Slide Logic

<steps>
1. Parse: extract source slide number and target position
2. Validate both are in range (1 to total_slides) and different
3. Check if any "built" slides are affected → warn user if so
4. Extract slide from source, insert at target
5. Renumber all slides from 1
6. Save plan.yaml immediately
</steps>

### Change Slide Logic

<steps>
1. Parse: extract slide number and new focus/topic
2. Validate slide exists
3. Regenerate: `description` based on the new focus, section goals, and narrative context
4. Keep: status, storyline_role, tone, agenda_section_id (unless new focus suggests change)
5. Save plan.yaml immediately
</steps>

**After each modification, report to user:**
- What changed (added/removed/moved/modified)
- Highlight the affected slide in the updated breakdown
- Full updated slide list with numbers, description (truncated), storyline_role, section, tone
- Note about built HTML files not being renamed (if applicable)

**If command not recognized:**
- Show available commands with example formats

---

## Phase 6.5: Deck Structure Validation

<critical>
Run this validation when user says "done" in Phase 6, BEFORE proceeding to Phase 7. This ensures deck has recommended structural elements.
</critical>

<steps>
1. Count total slides in the current plan
2. If total_slides < 5 → skip validation, proceed directly to Phase 7
3. If total_slides >= 5 → check for existing Agenda slide:
   - Search all slides for agenda indicators:
     * `description` contains (case-insensitive): "agenda", "outline", "overview", "topics"
   - If ANY slide matches → agenda exists, proceed to Phase 7
4. If no Agenda slide detected → continue to Step 5
5. Offer to add Agenda slide:
   <ask context="**Deck Structure Check**

Your deck has {{total_slides}} slides but no Agenda slide was detected.

An Agenda slide helps audiences:
- Understand the presentation flow
- Set expectations for content
- Follow along during delivery

Would you like to add an Agenda slide?"
        header="Agenda">
     <choice label="Yes, after Title" description="Insert Agenda as slide 2" />
     <choice label="Yes, at position..." description="Specify where to insert" />
     <choice label="No, skip" description="Proceed without Agenda slide" />
   </ask>

6. Process user selection:
   - If "Yes, after Title" → go to Step 7
   - If "Yes, at position..." → go to Step 8
   - If "No, skip" → proceed to Phase 7
</steps>

### Adding Agenda After Title (Step 7)

<steps>
1. Generate default agenda slide with these properties:
   - number: 2
   - status: pending
   - storyline_role: opening
   - agenda_section_id: first section id from agenda.sections, or "agenda-1"
   - tone: professional
   - description: Agenda slide presenting the structure of this presentation. Lists all major sections with brief descriptions. Sets audience expectations for what they'll learn. Speaker note: Use this to orient the audience and build anticipation.
2. Increment the number of all existing slides where number >= 2
3. Insert the new agenda slide at position 2
4. Save plan.yaml immediately
5. Update status.yaml total_slides count
6. Report to user: Agenda slide added as slide 2. All subsequent slides renumbered.
7. Proceed to Phase 7
</steps>

### Adding Agenda at Custom Position (Step 8)

<steps>
1. Ask user for position (1 to total_slides + 1)
2. Validate position:
   - If position < 1 or position > total_slides + 1 → show error, ask again
   - If valid → continue
3. Generate default agenda slide with these properties:
   - number: (insertion position)
   - status: pending
   - storyline_role: opening
   - agenda_section_id: first section id from agenda.sections, or "agenda-1"
   - tone: professional
   - description: Agenda slide presenting the structure of this presentation. Lists all major sections with brief descriptions. Sets audience expectations for what they'll learn.
4. Increment the number of all existing slides where number >= insertion position
5. Insert the new agenda slide at the specified position
6. Save plan.yaml immediately
7. Update status.yaml total_slides count
8. Report to user: Agenda slide added at position X. All subsequent slides renumbered.
9. Proceed to Phase 7
</steps>

---

## Phase 7: Save Plan and Update Status

<steps>
1. Generate `deck_slug` from `deck_name`:
   - Lowercase → replace spaces with hyphens → remove special chars → remove consecutive hyphens → trim hyphens
2. Create directories: `output/{deck_slug}/` and `output/{deck_slug}/slides/`
3. **Verify plan completeness** — every slide has: number, status, storyline_role, agenda_section_id, tone, description.
4. **Include presentation setting** — if `{{presentation_setting}}` was captured (from Phase 2.5), include it in plan.yaml at the top level. If `{{desired_length}}` was captured (from Phase 2.6), include it as well. Omit either field if it was not captured (do not write null or empty values).
5. **Include discovery context** — if `{{discovery_context}}` exists and is not empty, include it in plan.yaml at the top level. Assemble the discovery_context object by collecting all key-value pairs from:
   - Adaptive follow-up answers (Phase 2.3) — keys such as `known_objections`, `competitive_context`, `audience_priorities`, `decision_timeline`
   - Audience enrichments identified during extraction (Phase 2.2) — keys such as `audience_role`, `audience_knowledge_level` (if captured as enrichment beyond the standard field)
   - Any other contextual data the LLM identified as gaps and the user provided
   Only include keys that have actual values. Do NOT write an empty `discovery_context: {}` object — omit the field entirely if no discovery context was captured.
6. **Include planning research** — if `{{planning_research}}` exists and is not empty (from Phase 2.4), include it in plan.yaml at the top level. This persists research findings for downstream use. Do NOT write an empty `planning_research: []` array — omit the field entirely if research was skipped, all queries failed, or `{{planning_research}}` is empty.
7. Write `plan.yaml` to `output/{deck_slug}/plan.yaml`
8. Update `.slide-builder/status.yaml`:
   - Set mode: "deck"
   - Create (or overwrite) entry in `decks:` registry at `decks.{{deck_slug}}`:
     - name: `{{deck_name}}`
     - status: "planned"
     - total_slides: `{{slide_count}}`
     - built_count: 0
     - current_slide: 0
     - output_folder: `output/{{deck_slug}}`
     - created_at: current ISO 8601 timestamp
     - last_modified: current ISO 8601 timestamp
     - last_action: "Deck plan created with {{slide_count}} slides"
   - Update top-level `last_modified`: current ISO 8601 timestamp
   - Append to top-level `history` array
</steps>

<example title="Slug generation">
"Claude Code Fundamentals" → "claude-code-fundamentals"
"Q4 2026 Strategy" → "q4-2026-strategy"
</example>

**Report to user:**
- Deck name, slug, slide count
- Plan file location
- Slides output directory
- Next steps: `/pitchsmith:build-one` (recommended) or `/pitchsmith:build-all`

---

## Plan YAML Schema

<reference title="plan.yaml structure">
```yaml
# Deck Metadata
deck_name: "..."
created: "YYYY-MM-DD"
last_modified: "ISO-timestamp"

# Audience Context
audience: "..."
audience_knowledge_level: beginner | intermediate | expert
audience_priorities:
  - "..."

# Purpose & Outcome
purpose: "..."
desired_outcome: "..."
key_message: "..."

# Presentation Settings (from Phase 2.5 and 2.6)
presentation_setting: "live | sent_as_deck | recorded | hybrid"
desired_length: "8-10"  # Target slide count (range or single number)

# Discovery Context (optional - from adaptive follow-ups)
discovery_context:
  # Flexible key-value pairs from follow-up answers
  # Examples - actual keys depend on what gaps were identified:
  known_objections:
    - "..."
  competitive_context: "..."
  audience_priorities:
    - "..."
  decision_timeline: "..."

# Agenda Structure with Discovery
agenda:
  total_sections: N
  sections:
    - id: "agenda-1"
      title: "..."
      narrative_role: "opening | context | problem | solution | evidence | cta"
      estimated_slides: N
      description: "..."
      discovery:
        goals:
          communication_objective: "..."
          audience_takeaway: "..."
          narrative_advancement: "..."
          content_requirements: "..."
          suggested_slide_count: N

# Narrative Structure
storyline:
  opening_hook: "..."
  tension: "..."
  resolution: "..."
  call_to_action: "..."

recurring_themes:
  - "..."

# Slide Breakdown
slides:
  - number: 1
    status: pending
    storyline_role: "..."
    agenda_section_id: "agenda-1"
    tone: "professional | bold | warm | technical | urgent"
    description: |
      Detailed presentation notes — what the slide communicates, why it
      matters in the narrative, speaker context (pacing, emphasis), and
      audience impact. Should be specific and actionable.
```
</reference>

---

## Error Handling

<reference title="Error responses">
| Problem | Action |
|---------|--------|
| Theme missing | Tell user to run `/pitchsmith:setup` → stop |
| Invalid slide number (out of range) | Show valid range, ask to retry |
| Cannot parse command | Show command format examples, ask to retry |
| Fewer than 3 agenda sections | Warn, offer to add more or proceed |
| Only 1 slide and user tries to remove it | Explain cannot remove only slide, suggest "change" instead |
| Built slides affected by move/reorder | Warn that HTML files keep original names |
</reference>

---

## Ask DSL Patterns

<reference title="Choice-mode ask tag syntax">
The `<ask>` tag with `<choice>` children provides a declarative way to present options to users.
The `context` attribute is output as plain text (visible on all terminal backgrounds), then the
workflow engine transforms the choices into an AskUserQuestion call.

```xml
<ask context="Descriptive text shown before choices..."
     header="Short label (max 12 chars)"
     multiSelect="false">
  <choice label="Option 1" description="What this option does" />
  <choice label="Option 2" description="What this option does" />
  <choice label="Option 3" description="What this option does" />
</ask>
```

**Attributes:**
- `context` (optional): Multi-line text output before choices — use for explanations, generated content, etc.
- `header` (optional): Short tag/label, defaults to "Select"
- `multiSelect` (optional): Allow multiple selections, defaults to false

**Rules:**
- Must have 2-4 `<choice>` children per `<ask>` tag
- If more than 4 options needed, use multiple `<ask>` tags
- Variable interpolation (`{{variable}}`) works in `context` attribute
</reference>

<example title="Section goals approval">
```xml
<ask context="**Section Goals: Opening Hook (1 of 5)**

Here are the proposed goals for this section:

**Communication Objective:** Grab attention by challenging the audience's assumptions
**Audience Takeaway:** Feel curious and slightly uncomfortable — recognize their own pain
**Narrative Advancement:** Creates the emotional hook that drives engagement
**Content Requirements:** One provocative question or statement; one supporting data point
**Suggested Slides:** 1"
     header="Goals">
  <choice label="Approve" description="Goals are good — proceed to next section" />
  <choice label="Refine" description="I have feedback to adjust these goals" />
  <choice label="Custom" description="I'll write my own goals for this section" />
</ask>
```
</example>

<example title="Multi-select for agenda sections">
```xml
<ask context="**Proposed Agenda Structure**

Select the sections you want to include:"
     header="Agenda"
     multiSelect="true">
  <choice label="Opening Hook" description="Grab attention with key insight" />
  <choice label="The Problem" description="Establish pain point and urgency" />
  <choice label="Our Solution" description="Present the approach and benefits" />
  <choice label="Proof Points" description="Evidence and case studies" />
</ask>
```

If >4 sections, use additional `<ask>` blocks for remaining sections.
</example>

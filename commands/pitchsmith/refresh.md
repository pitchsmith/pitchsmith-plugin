---
description: 'Refresh the slide viewer and manifest for the current deck'
---

# Slide Builder - Refresh Command

Regenerates manifest.json for the current deck.

**Use this after:**
- Building new slides
- Editing slide content
- Adding or removing slides manually

<steps>
1. Read `.slide-builder/status.yaml` to get `current_deck_slug`
2. If no deck slug found, ask user which deck to refresh
3. Run the regenerate script:
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/generate-manifest.js {deck-slug}
   ```
4. Report results to user
</steps>

## What It Does

- Scans `output/{deck-slug}/slides/` for all slide-*.html files
- Extracts titles from each slide's `<h1>` or `<title>` tag
- Generates `slides/manifest.json` with slide metadata
- Preserves existing metadata (skipped, notes, animations, slideId)

## Example Output

```
Regenerating manifest for deck: claude-code-fundamentals
Found 14 slides
✅ Manifest generated: output/claude-code-fundamentals/slides/manifest.json
   Slides: 14
   Deck: Claude Code Fundamentals
```
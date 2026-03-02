---
description: 'List all available Slide Builder commands with descriptions'
---

# Slide Builder - Help

## Smart Entry Point

**`/pitchsmith`** - The recommended starting point. Detects your current state and presents context-aware options:
- **No theme?** → Guides you to setup
- **No decks?** → Offers create options (full deck, single slide, use template)
- **Deck in progress?** → Continue building, build all, edit, or start new
- **All complete?** → Plan new deck or edit existing

Just run `/pitchsmith` and let the system guide you!

---

## Available Commands

### Create Commands (/pitchsmith:)
Day-to-day deck creation workflow

| Command | Description |
|---------|-------------|
| `/pitchsmith:plan` | Smart router - asks single slide or full deck |
| `/pitchsmith:plan-one` | Plan a single slide |
| `/pitchsmith:plan-deck` | Plan a full presentation deck |
| `/pitchsmith:build-one` | Build the next slide (or single planned slide) |
| `/pitchsmith:build-all` | Build all remaining slides in deck plan |
| `/pitchsmith:edit` | Edit slide layout via natural language prompts |
| `/pitchsmith:add-slide` | Add a new slide to an existing deck plan |
| `/pitchsmith:animate` | Generate animation build groups for a slide |
| `/pitchsmith:use-template` | Instantiate a deck template with new content |
| `/pitchsmith:refresh` | Regenerate viewer and manifest for current deck |

### Manage Commands (/pitchsmith:)
Catalog and template management

| Command | Description |
|---------|-------------|
| `/pitchsmith:add-slide-template` | Create new slide template via conversation |
| `/pitchsmith:add-deck-template` | Create new deck template via guided conversation |
| `/pitchsmith:edit-deck-template` | Add, edit, remove, or reorder slides in deck template |
| `/pitchsmith:update-brand-assets` | Manage brand asset catalog (icons, logos, images) |
| `/pitchsmith:delete-deck` | Delete a deck and all its files |
| `/pitchsmith:optimize-instructions` | Transform workflow instructions using best practices |

### Brand Commands (/pitchsmith:)
Theme and brand management

| Command | Description |
|---------|-------------|
| `/pitchsmith:setup` | Create brand theme from assets (website URL, PDF, images) |
| `/pitchsmith:theme` | Display current theme summary - colors, typography, shapes |
| `/pitchsmith:theme-edit` | Modify existing theme via high-level feedback |

## Quick Start

1. **Set up your theme**: `/pitchsmith:setup`
2. **Plan your slides**: `/pitchsmith:plan`
3. **Build slides**: `/pitchsmith:build-one` or `/pitchsmith:build-all`
4. **Edit if needed**: `/pitchsmith:edit`

### Meta Commands (/pitchsmith:)
Help and status

| Command | Description |
|---------|-------------|
| `/pitchsmith:help` | Show all commands (this list) |
| `/pitchsmith:status` | Display unified slide queue status dashboard |

## Getting Help

- Run `/pitchsmith:help` to see this list
- Run `/pitchsmith:status` to see deck progress at a glance
- Check `.slide-builder/reference/conventions.md` for detailed documentation
- Each workflow has instructions in its `instructions.md` file

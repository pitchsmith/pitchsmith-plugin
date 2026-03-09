# Pitchsmith Plugin

AI-powered slide builder — plan, build, and export brand-perfect presentations.

## Plugin Structure

This Claude Code plugin provides the Pitchsmith framework for creating professional slide presentations. The plugin follows a clean separation between framework code (plugin-managed) and user state (workspace-managed).

### Directory Structure

```
pitchsmith-plugin/
├── .claude-plugin/          # Plugin metadata
│   └── plugin.json          # Plugin manifest
├── commands/                # Slash commands (24+ commands)
│   └── pitchsmith/          # All commands (plan, build, export, setup, templates)
├── skills/                  # Skills
│   └── sb/                  # Smart router skill
├── workflows/               # Workflow definitions (22 workflows)
│   └── {workflow-name}/     # Each workflow has its own directory
├── templates/               # HTML templates for rendering
│   └── viewer-template.html # Slide viewer template
├── config/                  # Plugin configuration
│   └── defaults/            # Default theme and assets
├── scripts/                 # Build and export scripts
└── CONVENTIONS.md           # Coding conventions
```

### Purpose of Each Directory

- **`.claude-plugin/`**: Contains the plugin manifest (`plugin.json`) that declares the plugin to Claude Code's plugin system
- **`commands/`**: Slash commands that users invoke via Claude Code CLI (e.g., `/pitchsmith:plan-deck`)
- **`skills/`**: Smart router skill (`/sb`) that detects workspace state and routes to appropriate workflows
- **`workflows/`**: Complete workflow definitions with instructions and templates for multi-step operations
- **`templates/`**: HTML templates used for rendering slides and presentations
- **`config/defaults/`**: Default theme and brand assets shipped with the plugin
- **`scripts/`**: Helper scripts for building, exporting, and presentation features

## Framework/State Separation

Pitchsmith follows a strict separation between framework code and user state:

### Framework Files (Plugin-Managed, Replaceable)
- Commands (`commands/`)
- Skills (`skills/`)
- Workflows (`workflows/`)
- Templates (`templates/`)
- Scripts (`scripts/`)
- CONVENTIONS.md

These files live in the plugin and are automatically updated when the plugin is updated. Users never need to modify these files.

### User State Files (Workspace-Managed, Sacred)
- Configuration (`.slide-builder/config/`)
- Theme file (`.slide-builder/config/theme.json`)
- Brand assets (`.slide-builder/config/brand-assets/`)
- Status tracking (`status.yaml`)
- Deck plans (`.slide-builder/deck/`)
- Single slide plans (`.slide-builder/single/`)
- Output files (`output/`)

These files live in the user's workspace and are NEVER modified by plugin updates. They contain user-specific configuration, customizations, and generated content.

### Ejected Workflows (User-Owned Overrides)
- `.slide-builder/workflows/{name}/`

Power users can "eject" specific workflows to customize behavior. Ejected workflows take precedence over plugin defaults and are never overwritten by plugin updates.

## Installation

### Prerequisites
- **Claude Code v1.0.33+** — Plugin system support required
- **Node.js v18+** (optional) — Required only for PNG/PDF/PPTX export features
- **VS Code** (optional) — For extension features like slide viewer and catalog

### Install via Marketplace

```bash
# Step 1: Add the Pitchsmith marketplace (one-time)
/plugin marketplace add pitchsmith/pitchsmith-marketplace

# Step 2: Install the plugin
/plugin install pitchsmith@pitchsmith-marketplace

# Step 3: Start building slides
/sb
```

**Alternative: Install from your terminal** without starting a Claude Code session:

```bash
claude plugin marketplace add pitchsmith/pitchsmith-marketplace
claude plugin install pitchsmith@pitchsmith-marketplace
```

The plugin auto-initializes your workspace with a default theme, templates, and sample deck on first run. The pdf-reader MCP server is bundled and starts automatically — no manual configuration needed.

### Install for Development

For local development or testing without the marketplace:

```bash
# Load the plugin directly from a local directory
claude --plugin-dir ./pitchsmith-plugin
```

This is useful when developing or testing changes to the plugin before publishing.

## Usage

### First-Time Setup
Run `/sb` in your project. The smart router will:
1. Detect that this is your first run
2. Create `.slide-builder/config/` structure
3. Copy default theme to your workspace
4. Present deck creation options

You can immediately start creating slides with the default theme. Brand customization is optional and can be done later via `/pitchsmith:setup`.

### Core Commands

- **`/sb`** - Smart router (auto-detects state and presents context-aware options)
- **`/pitchsmith:plan-deck`** - Plan a full presentation deck
- **`/pitchsmith:build-one`** - Build a single slide
- **`/pitchsmith:build-all`** - Build all planned slides
- **`/pitchsmith:setup`** - Extract brand from PDF or website
- **`/pitchsmith:theme-edit`** - Edit theme properties
- **`/pitchsmith:templates`** - Manage slide templates

### Workflow Override System

To customize a workflow:
1. Run `/pitchsmith:eject-workflow {workflow-name}`
2. The workflow is copied to `.slide-builder/workflows/{workflow-name}/`
3. Edit the ejected workflow as needed
4. Future runs will use your local copy

To see which workflows are ejected:
```
/pitchsmith:list-overrides
```

## Prerequisites & Dependencies

### Core Requirements

**Claude Code CLI v1.0.33+** (always required)
- Installation: [Claude Code Installation Guide](https://claude.ai/code)
- The Pitchsmith plugin runs within Claude Code's plugin system
- Install via marketplace: `/plugin marketplace add pitchsmith/pitchsmith-marketplace` then `/plugin install pitchsmith@pitchsmith-marketplace`

### Zero-Config First Run

Pitchsmith works immediately with zero external dependencies:
- Run `/sb` to auto-initialize your workspace with a professional default theme
- Plan slides, build slides, and view slides — all with no setup required
- Brand customization and export are optional enhancements you can add later

### Optional Dependencies

#### Export Features (PNG/PDF)

**What requires this:**
- PNG and PDF export (requires the VS Code extension)

**What works without:**
- All slide planning and building features
- HTML slide viewer (slides available as HTML files in `output/` directory)
- Theme customization and brand setup

**Requirements:**
- **Node.js v18 or newer** — for running Puppeteer's headless Chrome
- **Puppeteer package** — for converting HTML slides to PNG/PDF

**Installation:**

*macOS:*
```bash
# Install Node.js via Homebrew
brew install node

# Install Puppeteer
npm install puppeteer
```

*Windows:*
```bash
# Download Node.js installer from https://nodejs.org/
# After installation, verify:
node --version

# Install Puppeteer
npm install puppeteer
```

*Linux (Ubuntu/Debian):*
```bash
# Install Node.js
sudo apt update
sudo apt install nodejs npm

# Install Puppeteer
npm install puppeteer
```

*Linux (other distributions):*
Visit [https://nodejs.org/](https://nodejs.org/) for your distribution's package manager instructions.

**Fallback:**
If puppeteer is unavailable, the export workflow offers HTML-only export. HTML slide files are generated and accessible in `output/{deck_slug}/slides/` — you can view them directly in a browser or use other tools to convert to PDF.

#### PDF Brand Extraction

**What requires this:**
- `/pitchsmith:setup` command when using PDF brand guidelines as input
- `/pitchsmith:use-template` when template uses PDF content sources

**What works without:**
- Brand setup with website URL or image files as input
- Template instantiation with manual content entry or non-PDF sources

**Requirements:**
- **Node.js v18+** — Required for the bundled pdf-reader MCP server
- The pdf-reader MCP server is **bundled with the plugin** and starts automatically when the plugin loads — no manual configuration needed

**Alternatives (if Node.js is unavailable):**
- **Website URL**: Provide your company website URL instead of PDF
- **Image files**: Provide logo and screenshot images
- **Manual entry**: Enter brand colors and fonts manually via `/pitchsmith:theme-edit`

### Troubleshooting

#### Node.js Issues

**"node: command not found"**
- Install Node.js following the platform-specific instructions above
- Verify installation: `node --version`
- Expected output: `v18.x.x` or higher

**"Node.js version too old" (v17 or lower)**
- Upgrade via Homebrew: `brew upgrade node` (macOS)
- Upgrade via nvm: `nvm install 18 && nvm use 18` (all platforms with nvm)
- Download latest LTS from [https://nodejs.org/](https://nodejs.org/)

**"npm: command not found"**
- npm is bundled with Node.js — reinstall Node.js
- On Linux, you may need to install npm separately: `sudo apt install npm`

#### Puppeteer Issues

**"Cannot find module 'puppeteer'"**
- Run `npm install puppeteer` in your project directory or globally
- Verify installation: `node -e "require('puppeteer'); console.log('OK')"`
- Expected output: `OK`

**Puppeteer download errors (Chromium binary)**
- Ensure stable internet connection during installation
- Retry: `npm install puppeteer --force`
- Check firewall/proxy settings if corporate network

**Chromium launch failures**
- Linux: Install missing system dependencies for headless Chrome
  ```bash
  sudo apt-get install -y \
    libnss3 libxss1 libasound2 libgbm1 libgtk-3-0
  ```

#### MCP Server Issues

**"pdf-reader MCP not available"**
- The pdf-reader MCP server is bundled with the plugin and starts automatically
- Verify Node.js is installed: `node --version` (v18+ required)
- Verify npx is available: `npx --version`
- Try disabling and re-enabling the plugin: `/plugin disable pitchsmith@pitchsmith-marketplace` then `/plugin enable pitchsmith@pitchsmith-marketplace`
- Check Claude Code logs for MCP server connection errors

**"npx: command not found"**
- Install Node.js — npx is bundled with npm
- Verify: `npx --version`

**PDF extraction returns empty content**
- Some PDFs are image-based (scanned documents) — MCP cannot extract text
- Alternative: Use website URL or manually enter brand information

### Dependency Summary Table

| Feature | Claude Code CLI | Node.js v18+ | Puppeteer | pdf-reader MCP |
|---------|----------------|--------------|-----------|----------------|
| Plan slides | ✅ Required | - | - | - |
| Build slides | ✅ Required | - | - | - |
| View slides (HTML) | ✅ Required | - | - | - |
| Export PNG/PDF | ✅ Required | ✅ Required | ✅ Required | - |
| Brand setup (website) | ✅ Required | - | - | - |
| Brand setup (PDF) | ✅ Required | ✅ Required | - | 📦 Bundled |
| Template with PDF content | ✅ Required | ✅ Required | - | 📦 Bundled |

### Getting Help

- **Documentation**: [https://pitchsmith.ai/docs](https://pitchsmith.ai/docs) *(coming soon)*
- **Issues**: [https://github.com/pitchsmith/pitchsmith-deck/issues](https://github.com/pitchsmith/pitchsmith-deck/issues)
- **Discord**: Community support *(coming soon)*

## Architecture Patterns

### Override Resolution
Commands and skills check for user overrides before falling back to plugin defaults:
1. Check `.slide-builder/workflows/{name}/` (ejected/user-owned)
2. Fall back to `${CLAUDE_PLUGIN_ROOT}/workflows/{name}/` (plugin default)

### Variable Substitution
- `${CLAUDE_PLUGIN_ROOT}` resolves to plugin installation directory
- Used in workflow.yaml `installed_path` fields
- Enables portable path references across different installations

### Sacred Boundary Enforcement
- Plugin updates NEVER modify files in `.slide-builder/config/`
- Plugin updates NEVER modify `status.yaml` or user content
- Ejected workflows are NEVER overwritten by plugin updates
- Clear separation enables safe automatic updates

## License

Elastic License v2 (ELv2)

## Links

- Homepage: https://pitchsmith.ai
- Repository: https://github.com/pitchsmith/pitchsmith-deck
- Documentation: (Coming soon)

## Version

Current version: 0.2.2

---

**Built with Claude Code** • Framework/state separation for safe automatic updates

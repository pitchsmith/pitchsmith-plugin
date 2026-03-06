#!/usr/bin/env node
/**
 * Generate manifest.json for a slide deck
 * Usage: node scripts/generate-manifest.js [deck-slug]
 *
 * If no deck-slug provided, auto-detects from output/ directory.
 * - One deck: auto-selects it
 * - Multiple decks: lists them and exits with usage message
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();

function readYaml(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
            result[match[1]] = match[2].replace(/^["']|["']$/g, '');
        }
    });
    return result;
}

function extractTitle(htmlContent, slideNum) {
    // Try h1 first
    const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) return h1Match[1].trim();

    // Try title tag
    const titleMatch = htmlContent.match(/<title>Slide \d+:\s*([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].trim();

    return `Slide ${slideNum}`;
}

function findDecks() {
    const outputDir = path.join(PROJECT_ROOT, 'output');
    if (!fs.existsSync(outputDir)) return [];

    return fs.readdirSync(outputDir)
        .filter(d => {
            const fullPath = path.join(outputDir, d);
            const planPath = path.join(fullPath, 'plan.yaml');
            return fs.statSync(fullPath).isDirectory() && fs.existsSync(planPath);
        })
        .map(d => ({
            slug: d,
            mtime: fs.statSync(path.join(outputDir, d)).mtimeMs
        }))
        .sort((a, b) => b.mtime - a.mtime);
}

/**
 * PF-1.4 AC-1,2: Read existing manifest and build a filename-keyed lookup map.
 * Handles both 'filename' (lowercase) and 'fileName' (camelCase) property names.
 * Returns empty object if no existing manifest (fresh generation).
 *
 * @param {string} manifestPath - Path to existing manifest.json
 * @returns {Object} Lookup map: filename -> existing slide metadata
 */
function readExistingManifest(manifestPath) {
    try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        const existing = JSON.parse(raw);
        const lookup = {};
        for (const slide of existing.slides || []) {
            // Handle both 'filename' (lowercase) and 'fileName' (camelCase)
            const key = slide.filename || slide.fileName;
            if (key) {
                lookup[key] = slide;
            }
        }
        return lookup;
    } catch {
        // No existing manifest or parse error — fresh generation
        return {};
    }
}

/**
 * PF-1.4 AC-2,3,4: Build slide list from disk files, merging preserved metadata
 * from existing manifest entries. Only slides with files on disk are included
 * (stale entries are pruned). New slides get default values.
 *
 * Preserved fields: skipped, notes, animations, slideId
 * Regenerated fields: number, filename, title
 *
 * @param {string[]} slideFiles - Sorted list of slide filenames on disk
 * @param {string} slidesFolder - Path to slides directory
 * @param {Object} existingLookup - Filename-keyed lookup from readExistingManifest
 * @returns {Object[]} Merged slide list
 */
function buildSlideList(slideFiles, slidesFolder, existingLookup) {
    return slideFiles.map(filename => {
        const num = parseInt(filename.match(/\d+/)[0]);
        const htmlContent = fs.readFileSync(path.join(slidesFolder, filename), 'utf-8');
        const title = extractTitle(htmlContent, num);

        // Start with regenerated fields
        const entry = { number: num, filename, title };

        // PF-1.4 AC-2: Merge preserved fields from existing entry
        const existing = existingLookup[filename];
        if (existing) {
            // Use conditional spread so undefined fields are not written
            if (existing.skipped !== undefined) { entry.skipped = existing.skipped; }
            if (existing.notes !== undefined) { entry.notes = existing.notes; }
            if (existing.animations !== undefined) { entry.animations = existing.animations; }
            if (existing.slideId !== undefined) { entry.slideId = existing.slideId; }
        }

        return entry;
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { readExistingManifest, buildSlideList, extractTitle, readYaml, findDecks };
}

function main() {
    // Get deck slug from arg or auto-detect from output/
    let deckSlug = process.argv[2];

    if (!deckSlug) {
        const decks = findDecks();
        if (decks.length === 0) {
            console.error('Error: No decks found in output/ directory.');
            console.error('Run /pitchsmith:plan-deck to create a deck first.');
            process.exit(1);
        } else if (decks.length === 1) {
            deckSlug = decks[0].slug;
        } else {
            console.error('Multiple decks found. Please specify which deck:\n');
            decks.forEach(d => console.error(`  node scripts/generate-manifest.js ${d.slug}`));
            console.error('');
            process.exit(1);
        }
    }

    console.log(`Generating manifest for deck: ${deckSlug}`);

    // Paths
    const outputFolder = path.join(PROJECT_ROOT, 'output', deckSlug);
    const slidesFolder = path.join(outputFolder, 'slides');
    const planPath = path.join(outputFolder, 'plan.yaml');
    const manifestPath = path.join(slidesFolder, 'manifest.json');

    // Verify slides folder exists
    if (!fs.existsSync(slidesFolder)) {
        console.error(`Error: Slides folder not found: ${slidesFolder}`);
        process.exit(1);
    }

    // Discover slides
    const slideFiles = fs.readdirSync(slidesFolder)
        .filter(f => /^slide-\d+\.html$/.test(f))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });

    if (slideFiles.length === 0) {
        console.error('Error: No slides found in', slidesFolder);
        process.exit(1);
    }

    console.log(`Found ${slideFiles.length} slides`);

    // PF-1.4 AC-1: Read existing manifest for metadata preservation (merge-on-write)
    const existingLookup = readExistingManifest(manifestPath);

    // Build slide list with preserved metadata
    const slideList = buildSlideList(slideFiles, slidesFolder, existingLookup);

    // Get deck name from plan.yaml if exists
    let deckName = deckSlug;
    if (fs.existsSync(planPath)) {
        const plan = readYaml(planPath);
        deckName = plan.deck_name || deckSlug;
    }

    // Build manifest
    const manifest = {
        deckName: deckName,
        generatedAt: new Date().toISOString(),
        slides: slideList
    };

    // Write manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`✅ Manifest generated: ${manifestPath}`);
    console.log(`   Slides: ${slideList.length}`);
    console.log(`   Deck: ${deckName}`);
}

main();

#!/bin/bash
# Copy defaults from repository root to plugin config
# This ensures plugin distribution includes defaults for plugin-only users

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PLUGIN_ROOT/.." && pwd)"

SOURCE_DIR="$REPO_ROOT/defaults"
TARGET_DIR="$PLUGIN_ROOT/config/defaults"

echo "📦 Copying defaults for plugin distribution..."
echo "   Source: $SOURCE_DIR"
echo "   Target: $TARGET_DIR"

# Verify source exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Source defaults directory not found at $SOURCE_DIR"
    exit 1
fi

# Remove existing defaults to ensure clean copy
if [ -d "$TARGET_DIR" ]; then
    echo "   Removing existing defaults..."
    rm -rf "$TARGET_DIR"
fi

# Copy from source
echo "   Copying files..."
cp -r "$SOURCE_DIR" "$TARGET_DIR"

# Verify copy was successful
if [ -d "$TARGET_DIR" ] && [ -f "$TARGET_DIR/config/theme.json" ]; then
    echo "✅ Defaults copied successfully"
    echo "   $(find "$TARGET_DIR" -type f | wc -l | tr -d ' ') files copied"
else
    echo "❌ Error: Copy verification failed"
    exit 1
fi

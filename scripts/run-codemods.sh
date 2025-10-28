#!/bin/bash

# Run Codemods Script
# Executes all codemod transformations for the migration

set -e

echo "🔄 Running codemods for migration..."

# Check if jscodeshift is installed
if ! command -v jscodeshift &> /dev/null; then
    echo "Installing jscodeshift..."
    npm install --save-dev jscodeshift
fi

# Migrate service calls to SDK
echo ""
echo "1️⃣ Migrating service calls to SDK adapters..."
npx jscodeshift -t scripts/codemods/migrate-to-sdk.js src/**/*.{js,jsx} --parser=babel

# Remove unsupported locales
echo ""
echo "2️⃣ Removing unsupported locales (am, tl, id, si)..."
npx jscodeshift -t scripts/codemods/remove-unsupported-locales.js src/**/*.{js,jsx} --parser=babel

echo ""
echo "✅ Codemods completed!"
echo ""
echo "Next steps:"
echo "  1. Review the changes"
echo "  2. Run tests: npm test"
echo "  3. Fix any remaining issues manually"
echo "  4. Commit the changes"

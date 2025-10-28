/**
 * Migrate Jest tests to Vitest
 * Replaces jest.fn() with vi.fn() and adds vi imports
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '../src');

// Files to process
const testFiles = [
  'src/test/setup.js',
  'src/test/__mocks__/databaseClient.js',
  'src/test/test-utils.jsx',
  'src/__tests__/App.test.jsx',
  'src/components/__tests__/Navbar.completeProfile.test.jsx',
  'src/components/common/__tests__/AsyncErrorBoundary.test.jsx',
  'src/components/dashboard/__tests__/DashboardLayout.profileBanner.test.jsx',
  'src/components/maids/__tests__/MaidCard.test.jsx',
  'src/components/profile/completion/__tests__/UnifiedSponsorCompletionForm.autosave.test.jsx',
  'src/components/ui/__tests__/Button.test.jsx',
  'src/components/ui/__tests__/MultiSelect.test.jsx',
  'src/config/__tests__/securityConfig.test.js',
  'src/contexts/__tests__/AuthContext.test.jsx',
  'src/hooks/__tests__/useFormValidation.test.js',
  'src/lib/__tests__/secureAuth.test.js',
  'src/services/__tests__/billingService.test.js',
  'src/services/__tests__/paymentIdempotencyService.test.js',
  'src/services/__tests__/stripeBillingService.test.js',
  'src/setupTests.js',
  'src/utils/__tests__/performance.test.js',
  'src/utils/testUtils.js'
];

async function migrateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  try {
    let content = await fs.readFile(fullPath, 'utf-8');
    const originalContent = content;

    // Replace jest.fn() with vi.fn()
    content = content.replace(/jest\.fn\(\)/g, 'vi.fn()');
    content = content.replace(/jest\.mock\(/g, 'vi.mock(');
    content = content.replace(/jest\.spyOn\(/g, 'vi.spyOn(');
    content = content.replace(/jest\.clearAllMocks\(\)/g, 'vi.clearAllMocks()');
    content = content.replace(/jest\.resetAllMocks\(\)/g, 'vi.resetAllMocks()');
    content = content.replace(/jest\.restoreAllMocks\(\)/g, 'vi.restoreAllMocks()');
    content = content.replace(/jest\.useFakeTimers\(\)/g, 'vi.useFakeTimers()');
    content = content.replace(/jest\.useRealTimers\(\)/g, 'vi.useRealTimers()');

    // Only add import if content changed and doesn't already have vi import
    if (content !== originalContent) {
      if (!content.includes("from 'vitest'") && !content.includes('from "vitest"')) {
        // Add vi import at the top (after existing imports or at the very top)
        const importMatch = content.match(/^(import .+;\n)*/m);
        if (importMatch) {
          content = content.replace(
            importMatch[0],
            `${importMatch[0]}import { vi } from 'vitest';\n`
          );
        } else {
          content = `import { vi } from 'vitest';\n${content}`;
        }
      }

      await fs.writeFile(fullPath, content, 'utf-8');
      console.log(`✅ Migrated: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  Skipped: ${filePath} (no changes needed)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Jest to Vitest migration...\n');

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of testFiles) {
    const result = await migrateFile(file);
    if (result === true) migrated++;
    else if (result === false) skipped++;
    else errors++;
  }

  console.log(`\n✨ Migration complete!`);
  console.log(`   Migrated: ${migrated} files`);
  console.log(`   Skipped:  ${skipped} files`);
  console.log(`   Errors:   ${errors} files`);
}

main();

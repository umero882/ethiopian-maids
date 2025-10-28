/**
 * Codemod: Migrate Service Calls to SDK
 *
 * Transforms direct service calls to SDK client calls.
 * Run with: npx jscodeshift -t scripts/codemods/migrate-to-sdk.js src/**/*.{js,jsx}
 */

module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let hasChanges = false;

  // Track if we need to add imports
  let needsApiClientImport = false;
  let needsAdapterImport = false;

  // Pattern 1: maidService.getMaids(...) -> adapter.getMaids(...)
  root
    .find(j.CallExpression, {
      callee: {
        object: { name: 'maidService' },
        property: { name: 'getMaids' },
      },
    })
    .replaceWith((path) => {
      hasChanges = true;
      needsAdapterImport = true;

      return j.callExpression(
        j.memberExpression(
          j.identifier('maidAdapter'),
          j.identifier('getMaids')
        ),
        path.node.arguments
      );
    });

  // Pattern 2: maidService.getMaidById(...) -> adapter.getMaidById(...)
  root
    .find(j.CallExpression, {
      callee: {
        object: { name: 'maidService' },
        property: { name: 'getMaidById' },
      },
    })
    .replaceWith((path) => {
      hasChanges = true;
      needsAdapterImport = true;

      return j.callExpression(
        j.memberExpression(
          j.identifier('maidAdapter'),
          j.identifier('getMaidById')
        ),
        path.node.arguments
      );
    });

  // Pattern 3: maidService.createMaid(...) -> adapter.createMaid(...)
  root
    .find(j.CallExpression, {
      callee: {
        object: { name: 'maidService' },
        property: { name: 'createMaid' },
      },
    })
    .replaceWith((path) => {
      hasChanges = true;
      needsAdapterImport = true;

      return j.callExpression(
        j.memberExpression(
          j.identifier('maidAdapter'),
          j.identifier('createMaid')
        ),
        path.node.arguments
      );
    });

  // Pattern 4: maidService.updateMaid(...) -> adapter.updateMaid(...)
  root
    .find(j.CallExpression, {
      callee: {
        object: { name: 'maidService' },
        property: { name: 'updateMaid' },
      },
    })
    .replaceWith((path) => {
      hasChanges = true;
      needsAdapterImport = true;

      return j.callExpression(
        j.memberExpression(
          j.identifier('maidAdapter'),
          j.identifier('updateMaid')
        ),
        path.node.arguments
      );
    });

  // Remove old service imports
  root
    .find(j.ImportDeclaration, {
      source: { value: (v) => v && (v.includes('maidService') || v.includes('@/services/maidService')) },
    })
    .forEach((path) => {
      hasChanges = true;
      j(path).remove();
    });

  // Add new adapter import if needed
  if (needsAdapterImport) {
    const importStatement = j.importDeclaration(
      [j.importSpecifier(j.identifier('getMaidProfileAdapter'))],
      j.literal('@/adapters/MaidProfileAdapter')
    );

    // Add const declaration for adapter
    const adapterDeclaration = j.variableDeclaration('const', [
      j.variableDeclarator(
        j.identifier('maidAdapter'),
        j.callExpression(j.identifier('getMaidProfileAdapter'), [])
      ),
    ]);

    // Find the first import and add our import before it
    const firstImport = root.find(j.ImportDeclaration).at(0);
    if (firstImport.length > 0) {
      firstImport.insertBefore(importStatement);
    } else {
      root.get().node.program.body.unshift(importStatement);
    }

    // Add adapter declaration after imports
    const lastImport = root.find(j.ImportDeclaration).at(-1);
    if (lastImport.length > 0) {
      lastImport.insertAfter(adapterDeclaration);
    }
  }

  return hasChanges ? root.toSource() : null;
};

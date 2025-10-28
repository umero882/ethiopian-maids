/**
 * Codemod: Remove Unsupported Locales
 *
 * Removes am, tl, id, si locales from the codebase, keeping only en and ar.
 * Run with: npx jscodeshift -t scripts/codemods/remove-unsupported-locales.js src/**/*.{js,jsx}
 */

const UNSUPPORTED_LOCALES = ['am', 'tl', 'id', 'si'];
const SUPPORTED_LOCALES = ['en', 'ar'];

module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let hasChanges = false;

  // Pattern 1: Remove properties from SUPPORTED_LOCALES object
  root
    .find(j.Property, {
      key: {
        name: (name) => UNSUPPORTED_LOCALES.includes(name),
      },
    })
    .forEach((path) => {
      // Check if parent is object with SUPPORTED_LOCALES variable
      const parent = path.parent;
      if (parent && parent.node.type === 'ObjectExpression') {
        hasChanges = true;
        j(path).remove();
      }
    });

  // Pattern 2: Remove array elements for unsupported locales
  root
    .find(j.ArrayExpression)
    .forEach((path) => {
      const elements = path.node.elements;
      const newElements = elements.filter((element) => {
        if (element && element.type === 'Literal' && typeof element.value === 'string') {
          return !UNSUPPORTED_LOCALES.includes(element.value);
        }
        return true;
      });

      if (newElements.length !== elements.length) {
        hasChanges = true;
        path.node.elements = newElements;
      }
    });

  // Pattern 3: Update locale checks in conditionals
  root
    .find(j.BinaryExpression, {
      operator: '===',
      right: {
        type: 'Literal',
        value: (value) => UNSUPPORTED_LOCALES.includes(value),
      },
    })
    .forEach((path) => {
      // Replace with false since these locales are no longer supported
      hasChanges = true;
      j(path).replaceWith(j.literal(false));
    });

  // Pattern 4: Update switch cases for unsupported locales
  root
    .find(j.SwitchCase, {
      test: {
        type: 'Literal',
        value: (value) => UNSUPPORTED_LOCALES.includes(value),
      },
    })
    .forEach((path) => {
      hasChanges = true;
      j(path).remove();
    });

  // Pattern 5: Add comment warning about removed locales
  if (hasChanges && fileInfo.path.includes('LocalizationContext')) {
    const firstNode = root.find(j.Program).get('body', 0);
    const comment = j.commentBlock(
      '\n * Note: Locales am, tl, id, si have been removed.\n * Only English (en) and Arabic (ar) are now supported.\n ',
      true,
      false
    );
    firstNode.node.comments = firstNode.node.comments || [];
    firstNode.node.comments.unshift(comment);
  }

  return hasChanges ? root.toSource() : null;
};

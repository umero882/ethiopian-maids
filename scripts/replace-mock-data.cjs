const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'dashboards', 'agency', 'AgencyShortlistsPage.jsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace useEffect - look for the entire useEffect block
const useEffectPattern = /useEffect\(\(\) => \{\n    const fetchShortlists = async \(\) => \{\n      try \{\n        \/\/ Mock agency ID for now - in real app this would come from auth context\n        const agencyId = 'mock-agency-id';\n        const data = await getMockShortlists\(agencyId\);\n        setShortlists\(data \|\| \[\]\);/;

const newUseEffect = `useEffect(() => {
    const fetchShortlists = async () => {
      try {
        setLoading(true);
        const result = await agencyService.getShortlists();

        if (result.error) throw result.error;

        setShortlists(result.data || []);`;

if (useEffectPattern.test(content)) {
  content = content.replace(useEffectPattern, newUseEffect);
  console.log('✅ Updated useEffect to use agencyService');
} else {
  console.log('⚠️  useEffect pattern not found, trying alternative approach...');

  // Try simpler replacement
  const oldCode = "const agencyId = 'mock-agency-id';\n        const data = await getMockShortlists(agencyId);\n        setShortlists(data || []);";
  const newCode = "setLoading(true);\n        const result = await agencyService.getShortlists();\n\n        if (result.error) throw result.error;\n\n        setShortlists(result.data || []);";

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    console.log('✅ Updated useEffect to use agencyService (alternative method)');
  } else {
    console.log('❌ Could not find useEffect code to replace');
  }
}

// Remove getMockShortlists function - find it by looking for the function declaration and its end
const lines = content.split('\n');
let startIndex = -1;
let endIndex = -1;
let braceCount = 0;
let inFunction = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const getMockShortlists = async')) {
    startIndex = i - 1; // Include the comment line
    inFunction = true;
  }

  if (inFunction) {
    // Count braces
    for (let char of lines[i]) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }

    // When braces balance, we've found the end
    if (braceCount === 0 && startIndex !== -1) {
      endIndex = i;
      break;
    }
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  // Remove the function
  const before = lines.slice(0, startIndex);
  const after = lines.slice(endIndex + 1);
  content = [...before, ...after].join('\n');
  console.log(`✅ Removed getMockShortlists function (lines ${startIndex + 1} to ${endIndex + 1})`);
} else {
  console.log('⚠️  Could not find getMockShortlists function to remove');
}

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Successfully updated AgencyShortlistsPage.jsx');
console.log('Next steps:');
console.log('1. Restart the dev server');
console.log('2. Navigate to http://localhost:5174/dashboard/agency/shortlists');
console.log('3. Verify shortlists load from the database');

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'dashboards', 'agency', 'AgencyShortlistsPage.jsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the try block content in useEffect
const oldTryContent = `        // Mock agency ID for now - in real app this would come from auth context
        const agencyId = 'mock-agency-id';
        const data = await getMockShortlists(agencyId);
        setShortlists(data || []);`;

const newTryContent = `        setLoading(true);
        const result = await agencyService.getShortlists();

        if (result.error) throw result.error;

        setShortlists(result.data || []);`;

if (content.includes(oldTryContent)) {
  content = content.replace(oldTryContent, newTryContent);
  console.log('✅ Updated useEffect to use agencyService.getShortlists()');

  // Write the file back
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ File saved successfully');
} else {
  console.log('❌ Could not find the old try content to replace');
  console.log('Looking for:');
  console.log(oldTryContent);
}

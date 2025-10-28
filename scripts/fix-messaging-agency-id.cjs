const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/dashboards/agency/AgencyMessagingPage.jsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix the agencyId line - for agency users, their ID is the agency ID
content = content.replace(
  /const agencyId = user\?\.agency_id \|\| 'mock_agency_001';/,
  `// For agency users, their own ID is the agency_id
  const agencyId = user?.id;`
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed agencyId in AgencyMessagingPage to use user.id');

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'dashboards', 'agency', 'AgencyShortlistsPage.jsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add the agencyService import (if not already present)
if (!content.includes("import { agencyService } from '@/services/agencyService';")) {
  const importLine = "import AgencyDashboardService from '@/services/agencyDashboardService';";
  const newImportLine = "import AgencyDashboardService from '@/services/agencyDashboardService';\nimport { agencyService } from '@/services/agencyService';";

  content = content.replace(importLine, newImportLine);
  console.log('✅ Added agencyService import');
} else {
  console.log('ℹ️  agencyService import already exists');
}

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Successfully updated AgencyShortlistsPage.jsx');

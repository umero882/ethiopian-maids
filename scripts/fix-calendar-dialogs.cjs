const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/dashboards/agency/AgencyCalendarPage.jsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix Create Event Dialog
content = content.replace(
  /<DialogContent>\s+<DialogHeader>\s+<DialogTitle>Create New Event<\/DialogTitle>/,
  `<DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>`
);

// Fix Create Task Dialog
content = content.replace(
  /<DialogContent>\s+<DialogHeader>\s+<DialogTitle>Create New Task<\/DialogTitle>/,
  `<DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>`
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all dialog popups to fit in viewport');
console.log('- Added max-height: 90vh');
console.log('- Added overflow-y: auto for scrolling');

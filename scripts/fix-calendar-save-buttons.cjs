const fs = require('fs');
const path = require('path');

// Fix 1: Update service to use correct table name
const servicePath = path.join(__dirname, '../src/services/agencyDashboardService.js');
let serviceContent = fs.readFileSync(servicePath, 'utf8');

// Replace agency_calendar_events with calendar_events
serviceContent = serviceContent.replace(/agency_calendar_events/g, 'calendar_events');

fs.writeFileSync(servicePath, serviceContent, 'utf8');
console.log('✅ Fixed service table name: agency_calendar_events → calendar_events');

// Fix 2: Update page to use correct parameter order
const pagePath = path.join(__dirname, '../src/pages/dashboards/agency/AgencyCalendarPage.jsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Fix createEvent call - swap parameters
pageContent = pageContent.replace(
  /const event = await AgencyDashboardService\.createCalendarEvent\(newEvent, agencyId\);/,
  'const event = await AgencyDashboardService.createCalendarEvent(agencyId, newEvent);'
);

// Fix createTask call - swap parameters
pageContent = pageContent.replace(
  /const task = await AgencyDashboardService\.createTask\(newTask, agencyId\);/,
  'const task = await AgencyDashboardService.createTask(agencyId, newTask);'
);

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('✅ Fixed parameter order in createEvent and createTask calls');

console.log('\n✅ All fixes applied successfully!');
console.log('- Service now uses correct table: calendar_events');
console.log('- Parameters now in correct order: (agencyId, data)');
console.log('\nSave buttons should now work properly!');

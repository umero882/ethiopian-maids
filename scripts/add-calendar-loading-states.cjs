const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/dashboards/agency/AgencyCalendarPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add creating states after isLoading state
content = content.replace(
  /const \[isLoading, setIsLoading\] = useState\(true\);/,
  `const [isLoading, setIsLoading] = useState(true);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);`
);

// Add loading state to createEvent function
content = content.replace(
  /const createEvent = async \(\) => \{\s+try \{/,
  `const createEvent = async () => {
    setIsCreatingEvent(true);
    try {`
);

content = content.replace(
  /(const createEvent = async[\s\S]*?)\} catch \(error\) \{\s+console\.error\('Failed to create event:', error\);\s+\}/,
  `$1} catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event: ' + error.message);
    } finally {
      setIsCreatingEvent(false);
    }`
);

// Add loading state to createTask function
content = content.replace(
  /const createTask = async \(\) => \{\s+try \{/,
  `const createTask = async () => {
    setIsCreatingTask(true);
    try {`
);

content = content.replace(
  /(const createTask = async[\s\S]*?)\} catch \(error\) \{\s+console\.error\('Failed to create task:', error\);\s+\}/,
  `$1} catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task: ' + error.message);
    } finally {
      setIsCreatingTask(false);
    }`
);

// Update Create Event button to show loading state
content = content.replace(
  /(<Button\s+onClick=\{createEvent\}\s+disabled=\{!newEvent\.title.*?\}>)\s*Create Event/,
  '$1\n              {isCreatingEvent ? \'Creating...\' : \'Create Event\'}'
);

// Update Create Task button to show loading state
content = content.replace(
  /(<Button\s+onClick=\{createTask\}\s+disabled=\{!newTask\.title.*?\}>)\s*Create Task/,
  '$1\n              {isCreatingTask ? \'Creating...\' : \'Create Task\'}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Added loading states to calendar page');
console.log('- Added isCreatingEvent state');
console.log('- Added isCreatingTask state');
console.log('- Buttons now show "Creating..." while saving');
console.log('- Added error alerts for user feedback');

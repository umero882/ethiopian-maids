#!/bin/bash

# Fix empty blocks caused by console.log removal

echo "Fixing empty blocks..."

# Fix DashboardGateway.jsx line 82-83
sed -i '82,83s/} else if (loading) {/} else if (loading) {\n      \/\/ Loading state - waiting for auth/' src/pages/DashboardGateway.jsx

# Fix SponsorNotificationsPage.jsx empty catch blocks
find src -name "*.jsx" -o -name "*.js" | xargs sed -i '/} catch ([^)]*) {$/N;s/} catch (\([^)]*\)) {\n\s*}$/} catch (\1) {\n      \/\/ Error handled silently\n    }/'

# Fix productionMonitoring.js empty catch blocks  
sed -i '276s/} catch {/} catch {\n      \/\/ Error handled silently/' src/utils/productionMonitoring.js
sed -i '315s/} catch {/} catch {\n      \/\/ Error handled silently/' src/utils/productionMonitoring.js
sed -i '353s/} catch {/} catch {\n      \/\/ Error handled silently/' src/utils/productionMonitoring.js

echo "Done!"

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'dashboards', 'agency', 'AgencyShortlistsPage.jsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add the import for agencyService
const importSection = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AgencyDashboardService from '@/services/agencyDashboardService';
import { toast } from '@/components/ui/use-toast';`;

const newImportSection = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AgencyDashboardService from '@/services/agencyDashboardService';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';`;

content = content.replace(importSection, newImportSection);

// 2. Replace the useEffect to use real data
const oldUseEffect = `  useEffect(() => {
    const fetchShortlists = async () => {
      try {
        // Mock agency ID for now - in real app this would come from auth context
        const agencyId = 'mock-agency-id';
        const data = await getMockShortlists(agencyId);
        setShortlists(data || []);
      } catch (error) {
        console.error('Error fetching shortlists:', error);
        toast({
          title: 'Error loading shortlists',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShortlists();
  }, []);`;

const newUseEffect = `  useEffect(() => {
    const fetchShortlists = async () => {
      try {
        setLoading(true);
        const result = await agencyService.getShortlists();

        if (result.error) throw result.error;

        setShortlists(result.data || []);
      } catch (error) {
        console.error('Error fetching shortlists:', error);
        toast({
          title: 'Error loading shortlists',
          description: error.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShortlists();
  }, []);`;

content = content.replace(oldUseEffect, newUseEffect);

// 3. Remove the getMockShortlists function (lines 228-413)
// Find the start and end of the function
const mockFunctionRegex = /  \/\/ Mock data generator for shortlists\n  const getMockShortlists = async \(agencyId\) => \{[\s\S]*?    \];\n  \};/;
content = content.replace(mockFunctionRegex, '');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Successfully updated AgencyShortlistsPage.jsx');
console.log('Changes made:');
console.log('1. Added agencyService import');
console.log('2. Updated useEffect to fetch real data from agencyService');
console.log('3. Removed getMockShortlists function');

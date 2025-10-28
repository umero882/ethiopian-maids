import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const AgencyPayoutsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AgencyPayoutsPage</h1>
        <p className="text-gray-600 mt-1">This feature is under development</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Coming Soon</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This section will be implemented as part of the comprehensive agency dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyPayoutsPage;

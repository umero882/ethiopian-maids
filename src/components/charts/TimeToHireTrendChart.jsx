import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const TimeToHireTrendChart = ({ data }) => {
  // Transform data for area chart
  const chartData = [
    { period: '7 days', days: data?.['7d'] || 0 },
    { period: '30 days', days: data?.['30d'] || 0 },
    { period: '90 days', days: data?.['90d'] || 0 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-medium">{`Period: ${label}`}</p>
          <p className="text-blue-600">
            {`Average Time: ${payload[0].value} days`}
          </p>
        </div>
      );
    }
    return null;
  };

  const formatYAxisLabel = (value) => `${value}d`;

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>No time-to-hire data available</p>
          <p className="text-sm">Data will appear once you have completed hires</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map(d => d.days));
  const yAxisMax = Math.ceil(maxValue * 1.2); // Add 20% padding

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis
            tickFormatter={formatYAxisLabel}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
            domain={[0, yAxisMax]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="days"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#8884d8' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs text-gray-500">7-Day Avg</p>
          <p className="font-medium">{data?.['7d'] || 0} days</p>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs text-gray-500">30-Day Avg</p>
          <p className="font-medium">{data?.['30d'] || 0} days</p>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs text-gray-500">90-Day Avg</p>
          <p className="font-medium">{data?.['90d'] || 0} days</p>
        </div>
      </div>
    </div>
  );
};
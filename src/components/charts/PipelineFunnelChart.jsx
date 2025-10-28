import React from 'react';
import { ResponsiveContainer, FunnelChart, Funnel, Cell, Tooltip, LabelList } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export const PipelineFunnelChart = ({ data }) => {
  // Transform data for funnel chart
  const funnelData = [
    { name: 'Profiles Created', value: data?.profiles || 0, fill: COLORS[0] },
    { name: 'Applied to Jobs', value: data?.applied || 0, fill: COLORS[1] },
    { name: 'Interviewed', value: data?.interviewed || 0, fill: COLORS[2] },
    { name: 'Offers Made', value: data?.offered || 0, fill: COLORS[3] },
    { name: 'Hired', value: data?.hired || 0, fill: COLORS[4] },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-medium">{data.payload.name}</p>
          <p className="text-blue-600">Count: {data.value}</p>
          {data.payload.name !== 'Profiles Created' && (
            <p className="text-gray-500 text-sm">
              Conversion: {((data.value / funnelData[0].value) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
    if (value === 0) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-medium"
        fontSize={12}
      >
        {value}
      </text>
    );
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>No pipeline data available</p>
          <p className="text-sm">Data will appear once you have activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            data={funnelData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
          >
            <LabelList content={renderCustomizedLabel} />
            {funnelData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center mt-4 gap-4">
        {funnelData.map((entry, index) => (
          <div key={entry.name} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.fill }}
            ></div>
            <span className="text-xs text-gray-600">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Footer from '@/components/Footer';
import {
  Users,
  DollarSign,
  Briefcase,
  Clock,
  TrendingUp,
  TrendingDown,
  Percent,
  ShieldCheck,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    if (!user || user.userType !== 'admin') {
      navigate('/login');
    }

    const mockAdminData = {
      kpis: [
        {
          label: 'Total Placements',
          value: '1,250',
          icon: Briefcase,
          trend: '+5% MoM',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        },
        {
          label: 'Total Revenue',
          value: '$850K',
          icon: DollarSign,
          trend: '+8% MoM',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        },
        {
          label: 'Avg. Time-to-Hire',
          value: '22 Days',
          icon: Clock,
          trend: '-2 Days QoQ',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          label: 'Churn Rate (Sponsor)',
          value: '3.5%',
          icon: TrendingDown,
          trend: '-0.5% QoQ',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
        },
      ],
      revenueOverTime: [
        { name: 'Jan', revenue: 65000 },
        { name: 'Feb', revenue: 72000 },
        { name: 'Mar', revenue: 80000 },
        { name: 'Apr', revenue: 75000 },
        { name: 'May', revenue: 90000 },
        { name: 'Jun', revenue: 95000 },
      ],
      placementsByCountry: [
        { name: 'UAE', value: 400 },
        { name: 'Saudi Arabia', value: 300 },
        { name: 'Qatar', value: 200 },
        { name: 'Kuwait', value: 150 },
        { name: 'Bahrain', value: 100 },
        { name: 'Oman', value: 100 },
      ],
      userGrowth: [
        { month: 'Jan', sponsors: 120, maids: 300, agencies: 20 },
        { month: 'Feb', sponsors: 150, maids: 350, agencies: 22 },
        { month: 'Mar', sponsors: 180, maids: 400, agencies: 25 },
        { month: 'Apr', sponsors: 200, maids: 420, agencies: 28 },
        { month: 'May', sponsors: 230, maids: 450, agencies: 30 },
        { month: 'Jun', sponsors: 250, maids: 480, agencies: 32 },
      ],
      activeUsers: { sponsors: 1200, maids: 3500, agencies: 150 },
    };
    setAdminData(mockAdminData);
  }, [user, navigate]);

  if (!adminData) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-100 to-sky-100'>
        <p className='text-xl text-gray-600'>Loading Admin Dashboard...</p>
      </div>
    );
  }

  const PIE_COLORS = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff8042',
    '#00C49F',
    '#FFBB28',
  ];

  return (
    <div className='flex flex-col min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100'>
      <div className='flex-1 p-4 md:p-8'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='mb-8'
        >
          <h1 className='text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2'>
            Admin Analytics Dashboard 🛡️
          </h1>
          <p className='text-lg text-gray-700'>
            Platform-wide Key Performance Indicators
          </p>
        </motion.div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {adminData.kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className='shadow-xl border-0 overflow-hidden transform transition-all hover:scale-105 bg-white'>
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between mb-2'>
                      <p className='text-sm font-semibold text-gray-500 uppercase tracking-wider'>
                        {kpi.label}
                      </p>
                      <div
                        className={`p-3 rounded-lg ${kpi.bgColor} ${kpi.color}`}
                      >
                        <Icon className='w-6 h-6' />
                      </div>
                    </div>
                    <p className='text-3xl font-bold text-gray-800'>
                      {kpi.value}
                    </p>
                    <p
                      className={`text-xs ${kpi.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {kpi.trend}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Card className='shadow-xl border-0 bg-white'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-xl font-semibold text-gray-800'>
                  <TrendingUp className='w-6 h-6 text-indigo-600' />
                  Revenue Over Time
                </CardTitle>
                <CardDescription>Monthly platform revenue.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <LineChart
                    data={adminData.revenueOverTime}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
                    <XAxis dataKey='name' stroke='#4A5568' />
                    <YAxis stroke='#4A5568' />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='revenue'
                      stroke='#8884d8'
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#8884d8' }}
                      activeDot={{ r: 7 }}
                      name='Revenue ($)'
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Card className='shadow-xl border-0 bg-white'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-xl font-semibold text-gray-800'>
                  <Users className='w-6 h-6 text-purple-600' />
                  User Growth
                </CardTitle>
                <CardDescription>
                  Monthly new user registrations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart
                    data={adminData.userGrowth}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
                    <XAxis dataKey='month' stroke='#4A5568' />
                    <YAxis stroke='#4A5568' />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey='sponsors'
                      stackId='a'
                      fill='#8884d8'
                      name='Sponsors'
                    />
                    <Bar
                      dataKey='maids'
                      stackId='a'
                      fill='#82ca9d'
                      name='Maids'
                    />
                    <Bar
                      dataKey='agencies'
                      stackId='a'
                      fill='#ffc658'
                      name='Agencies'
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className='lg:col-span-2'
          >
            <Card className='shadow-xl border-0 bg-white'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-xl font-semibold text-gray-800'>
                  <Briefcase className='w-6 h-6 text-green-600' />
                  Placements by Country
                </CardTitle>
                <CardDescription>
                  Distribution of job placements across countries.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={350}>
                  <BarChart
                    layout='vertical'
                    data={adminData.placementsByCountry}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
                    <XAxis type='number' stroke='#4A5568' />
                    <YAxis
                      dataKey='name'
                      type='category'
                      width={100}
                      stroke='#4A5568'
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey='value' fill='#82ca9d' name='Placements' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <Card className='shadow-xl border-0 bg-white'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-xl font-semibold text-gray-800'>
                  <Percent className='w-6 h-6 text-red-600' />
                  Active Users by Type
                </CardTitle>
                <CardDescription>
                  Breakdown of currently active users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={350}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: 'Sponsors',
                          value: adminData.activeUsers.sponsors,
                        },
                        { name: 'Maids', value: adminData.activeUsers.maids },
                        {
                          name: 'Agencies',
                          value: adminData.activeUsers.agencies,
                        },
                      ]}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      outerRadius={120}
                      fill='#8884d8'
                      dataKey='value'
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {Object.keys(adminData.activeUsers).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

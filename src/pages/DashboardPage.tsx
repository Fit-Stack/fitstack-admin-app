import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/authStore';
import { analyticsService } from '@/services/analytics.service';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Target,
  Clock,
  Award,
  ArrowUp,
  ArrowDown,
  UserCheck,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [trainerPerformanceData, setTrainerPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchDashboardData();
    }
  }, [user?.tenantId]);

  const fetchDashboardData = async () => {
    if (!user?.tenantId) return;
    
    try {
      setLoading(true);
      const [stats, trainers] = await Promise.all([
        analyticsService.getDashboardStats(user.tenantId),
        analyticsService.getTrainerPerformance(user.tenantId),
      ]);
      setDashboardStats(stats);
      setTrainerPerformanceData(trainers || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Revenue data for the last 30 days
  const revenueData = analyticsService.getRevenueData();

  // Member growth data
  const memberGrowthData = analyticsService.getMemberGrowthData();

  // Session attendance data
  const sessionAttendanceData = analyticsService.getSessionAttendanceData();

  // Class category distribution
  const classCategoryData = analyticsService.getCategoryDistribution();



  const stats = [
    {
      title: 'Total Members',
      value: loading ? '...' : dashboardStats?.totalMembers?.toLocaleString() || '0',
      change: '+12.5%',
      changeType: 'increase',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      subtext: '170 new this month',
    },
    {
      title: 'Active Sessions',
      value: loading ? '...' : dashboardStats?.activeSessions?.toString() || '0',
      change: '+8.2%',
      changeType: 'increase',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subtext: '23 sessions today',
    },
    {
      title: 'Monthly Revenue',
      value: loading ? '...' : `$${dashboardStats?.monthlyRevenue?.toLocaleString() || '0'}`,
      change: '+23.1%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtext: 'Target: $200,000',
    },
    {
      title: 'Avg Attendance',
      value: loading ? '...' : `${dashboardStats?.averageAttendance?.toFixed(1) || '0'}%`,
      change: '+4.3%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      subtext: 'Up from 83%',
    },
    {
      title: 'Active Trainers',
      value: loading ? '...' : dashboardStats?.activeTrainers?.toString() || '0',
      change: '+2',
      changeType: 'increase',
      icon: Award,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      subtext: '2 new this month',
    },
    {
      title: 'Avg Session Time',
      value: '52 min',
      change: '-3 min',
      changeType: 'decrease',
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      subtext: 'Optimal range',
    },
    {
      title: 'Member Retention',
      value: loading ? '...' : `${dashboardStats?.memberRetention?.toFixed(1) || '0'}%`,
      change: '+1.8%',
      changeType: 'increase',
      icon: Target,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      subtext: 'Industry avg: 85%',
    },
    {
      title: 'Daily Active Users',
      value: loading ? '...' : dashboardStats?.dailyActiveUsers?.toLocaleString() || '0',
      change: '+15.3%',
      changeType: 'increase',
      icon: Activity,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      subtext: '44.8% of total',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Last updated: Just now
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className={`flex items-center text-xs font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.changeType === 'increase' ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{stat.subtext}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & Member Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Daily revenue vs target comparison
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis tick={{ fontSize: 12 }} tickMargin={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Member Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Total members and new acquisitions
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={memberGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis tick={{ fontSize: 12 }} tickMargin={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="members"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  name="Total Members"
                />
                <Line
                  type="monotone"
                  dataKey="newMembers"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 3 }}
                  name="New Members"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Session Attendance & Class Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Attendance by Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Session Attendance by Time Slot</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Weekly attendance patterns across different time slots
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis tick={{ fontSize: 12 }} tickMargin={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="morning" fill="#f97316" name="Morning" />
                <Bar dataKey="afternoon" fill="#8b5cf6" name="Afternoon" />
                <Bar dataKey="evening" fill="#10b981" name="Evening" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Class Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Class Categories</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Distribution by class type
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={classCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {classCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {classCategoryData.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {category.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainer Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Trainer Performance</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sessions conducted, ratings, and revenue generated this month
          </p>
        </CardHeader>
        <CardContent>
          {trainerPerformanceData.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No trainer data available"
              description="Trainer performance metrics will appear here once trainers start conducting sessions."
              variant="compact"
            />
          ) : (
            <div className="space-y-4">
              {trainerPerformanceData.map((trainer, index) => (
                <div
                  key={trainer.name}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{trainer.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {trainer.sessions} sessions completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {trainer.rating}
                        </span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        ${trainer.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-32">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(trainer.sessions / 52) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

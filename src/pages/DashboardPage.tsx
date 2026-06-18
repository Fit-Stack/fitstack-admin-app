import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/authStore';
import {
  analyticsService,
  formatCurrency,
  type DashboardResponse,
} from '@/services/analytics.service';
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

const CATEGORY_COLORS = [
  '#f97316',
  '#8b5cf6',
  '#10b981',
  '#eab308',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f43f5e',
];

type ChangeType = 'increase' | 'decrease' | 'neutral';

interface StatCard {
  title: string;
  value: string;
  icon: typeof Users;
  color: string;
  bgColor: string;
  subtext: string;
  change?: { text: string; type: ChangeType };
}

// Build a change pill from a percentage (handles null = "not enough data").
function pctChange(value: number | null, suffix = '%'): StatCard['change'] {
  if (value === null || value === undefined) return undefined;
  const type: ChangeType =
    value > 0 ? 'increase' : value < 0 ? 'decrease' : 'neutral';
  const sign = value > 0 ? '+' : '';
  return { text: `${sign}${value}${suffix}`, type };
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    if (user?.tenantId) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenantId]);

  const fetchDashboardData = async () => {
    if (!user?.tenantId) return;
    try {
      setLoading(true);
      const data = await analyticsService.getDashboard(user.tenantId);
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currency = dashboard?.currency || 'INR';
  const cards = dashboard?.cards;
  const dash = (v: string) => (loading ? '...' : v);

  const stats: StatCard[] = [
    {
      title: 'Total Members',
      value: dash((cards?.totalMembers.value ?? 0).toLocaleString()),
      change: pctChange(cards?.totalMembers.growthPct ?? null),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      subtext: `${cards?.totalMembers.newThisMonth ?? 0} new this month`,
    },
    {
      title: 'Active Sessions',
      value: dash((cards?.activeSessions.value ?? 0).toString()),
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subtext: `${cards?.activeSessions.today ?? 0} sessions today`,
    },
    {
      title: 'Monthly Revenue',
      value: dash(formatCurrency(cards?.monthlyRevenue.value ?? 0, currency)),
      change: pctChange(cards?.monthlyRevenue.growthPct ?? null),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtext: `Last month: ${formatCurrency(
        cards?.monthlyRevenue.lastMonth ?? 0,
        currency,
      )}`,
    },
    {
      title: 'Avg Attendance',
      value: dash(`${(cards?.avgAttendance.value ?? 0).toFixed(1)}%`),
      change: pctChange(cards?.avgAttendance.changePts ?? null, ' pts'),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      subtext: 'Last 30 days',
    },
    {
      title: 'Active Trainers',
      value: dash((cards?.activeTrainers.value ?? 0).toString()),
      change:
        (cards?.activeTrainers.newThisMonth ?? 0) > 0
          ? { text: `+${cards?.activeTrainers.newThisMonth}`, type: 'increase' }
          : undefined,
      icon: Award,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      subtext: `${cards?.activeTrainers.newThisMonth ?? 0} new this month`,
    },
    {
      title: 'Avg Session Time',
      value: dash(`${cards?.avgSessionTime.value ?? 0} min`),
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      subtext: 'Average duration',
    },
    {
      title: 'Member Retention',
      value: dash(
        cards?.memberRetention.value === null ||
          cards?.memberRetention.value === undefined
          ? '—'
          : `${cards.memberRetention.value.toFixed(1)}%`,
      ),
      icon: Target,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      subtext:
        cards?.memberRetention.value === null ||
        cards?.memberRetention.value === undefined
          ? 'Not enough data yet'
          : 'Month over month',
    },
    {
      title: 'Daily Active Users',
      value: dash((cards?.dailyActiveUsers.value ?? 0).toLocaleString()),
      icon: Activity,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      subtext: `${cards?.dailyActiveUsers.pctOfTotal ?? 0}% of total`,
    },
  ];

  const revenueData = dashboard?.charts.revenue ?? [];
  const memberGrowthData = dashboard?.charts.memberGrowth ?? [];
  const sessionAttendanceData = dashboard?.charts.sessionAttendance ?? [];
  const classCategoryData = (dashboard?.charts.categoryDistribution ?? []).map(
    (c, i) => ({ ...c, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }),
  );
  const trainerPerformanceData = dashboard?.trainers ?? [];

  const lastUpdated = dashboard?.generatedAt
    ? new Date(dashboard.generatedAt).toLocaleTimeString()
    : loading
      ? 'Loading…'
      : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Last updated: {lastUpdated}
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
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stat.value}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {stat.change && (
                  <div
                    className={`flex items-center text-xs font-medium ${
                      stat.change.type === 'increase'
                        ? 'text-green-600'
                        : stat.change.type === 'decrease'
                          ? 'text-red-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {stat.change.type === 'increase' ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : stat.change.type === 'decrease' ? (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {stat.change.text}
                  </div>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.subtext}
                </span>
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
              Daily membership revenue
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
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis tick={{ fontSize: 12 }} tickMargin={10} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
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
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickMargin={10} />
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
              Attendance over the last 30 days across time slots
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} tickMargin={10} />
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
            <CardTitle>Session Categories</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Distribution by session type
            </p>
          </CardHeader>
          <CardContent>
            {classCategoryData.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No sessions yet"
                description="Category distribution appears once sessions are created."
                variant="compact"
              />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={classCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
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
                    <div
                      key={category.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {category.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {category.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trainer Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Trainer Performance</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sessions conducted, ratings, and revenue generated
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
                  key={`${trainer.name}-${index}`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {trainer.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {trainer.sessions} sessions completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Rating
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {trainer.rating}
                        </span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Revenue
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(trainer.revenue, currency)}
                      </p>
                    </div>
                    <div className="w-32">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min((trainer.sessions / 52) * 100, 100)}%`,
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

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Users,
  Briefcase,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import {
  fetchDashboardStats,
  fetchDealsByStageStats,
  fetchRecentDeals,
  fetchWinLossOverTime,
} from '../features/dashboardSlice';
import { fetchUpcomingTasks } from '../features/tasksSlice';
import { Card, CardHeader, CardTitle, CardContent, Badge, getDealStageBadgeVariant, getTaskPriorityBadgeVariant } from '../components/ui';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, dealsByStageStats, recentDeals } = useAppSelector(
    (state) => state.dashboard
  );
  const { upcomingTasks } = useAppSelector((state) => state.tasks);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchDealsByStageStats());
    dispatch(fetchRecentDeals(5));
    dispatch(fetchWinLossOverTime(6));
    dispatch(fetchUpcomingTasks(7));
  }, [dispatch]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stageData = dealsByStageStats.map((item: any) => ({
    name: item.stage.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value: parseFloat(item.totalValue || 0),
    count: parseInt(item.count),
  }));

  const winLossData = stats
    ? [
        { name: 'Won', value: stats.wonDealsCount, color: '#22c55e' },
        { name: 'Lost', value: stats.lostDealsCount, color: '#ef4444' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your CRM performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pipeline Value</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(stats?.pipelineValue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Win Rate</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.winRate || 0}%</p>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {(stats?.winRate || 0) >= 50 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={(stats?.winRate || 0) >= 50 ? 'text-green-600' : 'text-red-600'}>
                    {stats?.wonDealsCount || 0} won, {stats?.lostDealsCount || 0} lost
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Upcoming Tasks</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.upcomingTasksCount || 0}
                </p>
                {(stats?.overdueTasksCount || 0) > 0 && (
                  <div className="flex items-center gap-1 text-xs mt-1 text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    {stats?.overdueTasksCount} overdue
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Contacts</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.totalContacts || 0}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats?.totalCompanies || 0} companies
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Value by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Value by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Value']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="value" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Win/Loss Ratio */}
        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900">{stats?.winRate || 0}%</span>
                <span className="text-sm text-slate-500">Win Rate</span>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Won ({stats?.wonDealsCount || 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Lost ({stats?.lostDealsCount || 0})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No upcoming tasks</p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">
                          {task.dueDate && format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getTaskPriorityBadgeVariant(task.priority)}>
                      {task.priority}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Deals</CardTitle>
            <Link to="/deals" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentDeals.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No recent deals</p>
            ) : (
              <div className="space-y-3">
                {recentDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    to={`/deals/${deal.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{deal.name}</p>
                        <p className="text-xs text-slate-500">
                          {deal.company?.name || 'No company'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {deal.amount ? formatCurrency(deal.amount) : '-'}
                      </p>
                      <Badge variant={getDealStageBadgeVariant(deal.stage)} size="sm">
                        {deal.stage.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

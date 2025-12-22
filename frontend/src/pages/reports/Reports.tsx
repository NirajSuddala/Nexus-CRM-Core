import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
  Users,
  UserPlus,
  Building2,
  CheckSquare,
  Activity,
  Download,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { format } from 'date-fns';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../../components/ui';

// Types
interface DateRange {
  range: 'last7days' | 'last30days' | 'last90days' | 'ytd' | 'custom';
  startDate?: string;
  endDate?: string;
}

// Colors for charts
const COLORS = ['#1e3a5f', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
const STAGE_COLORS: Record<string, string> = {
  discovery: '#3b82f6',
  proposal: '#8b5cf6',
  negotiation: '#f59e0b',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
};
const LIFECYCLE_COLORS: Record<string, string> = {
  lead: '#94a3b8',
  mql: '#3b82f6',
  sql: '#8b5cf6',
  customer: '#22c55e',
};

// Date Range Selector Component
const DateRangeSelector: React.FC<{
  value: DateRange;
  onChange: (range: DateRange) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-slate-400" />
      <select
        value={value.range}
        onChange={(e) => onChange({ ...value, range: e.target.value as DateRange['range'] })}
        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="last7days">Last 7 Days</option>
        <option value="last30days">Last 30 Days</option>
        <option value="last90days">Last 90 Days</option>
        <option value="ytd">Year to Date</option>
        <option value="custom">Custom Range</option>
      </select>
      {value.range === 'custom' && (
        <>
          <input
            type="date"
            value={value.startDate || ''}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={value.endDate || ''}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
          />
        </>
      )}
    </div>
  );
};

// Export Button Component
const ExportButton: React.FC<{ onExport: (format: 'csv' | 'pdf') => void }> = ({ onExport }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        leftIcon={<Download className="w-4 h-4" />}
        onClick={() => setShowMenu(!showMenu)}
      >
        Export
      </Button>
      {showMenu && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
          <button
            onClick={() => { onExport('csv'); setShowMenu(false); }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
          <button
            onClick={() => { onExport('pdf'); setShowMenu(false); }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
          >
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
};

// Deals by Stage Report
const DealsByStageReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ range: 'last30days' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          range: dateRange.range,
          ...(dateRange.startDate && { startDate: dateRange.startDate }),
          ...(dateRange.endDate && { endDate: dateRange.endDate }),
        });
        const response = await api.get(`/reports/deals/by-stage?${params}`);
        setData(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const chartData = data.map((item: any) => ({
    stage: item.stage.replace('_', ' ').charAt(0).toUpperCase() + item.stage.replace('_', ' ').slice(1),
    count: parseInt(item.count),
    totalValue: parseFloat(item.totalValue) || 0,
    fill: STAGE_COLORS[item.stage] || COLORS[0],
  }));

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = [
        ['Stage', 'Count', 'Total Value', 'Avg Value'],
        ...data.map((item: any) => [
          item.stage,
          item.count,
          item.totalValue || 0,
          item.avgValue || 0,
        ]),
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deals-by-stage.csv';
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Deals by Stage</h2>
          <p className="text-slate-500">Distribution of deals across pipeline stages</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal Count by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deal Value by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    dataKey="totalValue"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Stage Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Stage</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Count</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Total Value</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Avg Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: STAGE_COLORS[item.stage] || COLORS[0] }}
                          />
                          <span className="capitalize">{item.stage.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">{item.count}</td>
                      <td className="text-right py-3 px-4">${parseFloat(item.totalValue || 0).toLocaleString()}</td>
                      <td className="text-right py-3 px-4">${parseFloat(item.avgValue || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Deal Value Over Time Report
const DealValueOverTimeReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ range: 'last90days' });
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          range: dateRange.range,
          interval,
          ...(dateRange.startDate && { startDate: dateRange.startDate }),
          ...(dateRange.endDate && { endDate: dateRange.endDate }),
        });
        const response = await api.get(`/reports/deals/value-over-time?${params}`);
        setData(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange, interval]);

  const chartData = data.map((item: any) => ({
    period: format(new Date(item.period), interval === 'day' ? 'MMM d' : interval === 'week' ? 'MMM d' : 'MMM yyyy'),
    count: parseInt(item.count),
    totalValue: parseFloat(item.totalValue) || 0,
  }));

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = [
        ['Period', 'Deal Count', 'Total Value'],
        ...chartData.map(item => [item.period, item.count, item.totalValue]),
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deal-value-over-time.csv';
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Deal Value Over Time</h2>
          <p className="text-slate-500">Track deal creation and value trends</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal Value Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'totalValue' ? `$${value.toLocaleString()}` : value
                    }
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalValue"
                    name="Total Value"
                    stroke="#1e3a5f"
                    strokeWidth={2}
                    dot={{ fill: '#1e3a5f', strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    name="Deal Count"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Win/Loss Report
const WinLossReport: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ range: 'last90days' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          range: dateRange.range,
          ...(dateRange.startDate && { startDate: dateRange.startDate }),
          ...(dateRange.endDate && { endDate: dateRange.endDate }),
        });
        const response = await api.get(`/reports/deals/win-loss?${params}`);
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const wonData = data?.summary?.find((s: any) => s.stage === 'closed_won');
  const lostData = data?.summary?.find((s: any) => s.stage === 'closed_lost');
  const wonCount = parseInt(wonData?.count || 0);
  const lostCount = parseInt(lostData?.count || 0);
  const totalCount = wonCount + lostCount;
  const winRate = totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0;

  const pieData = [
    { name: 'Won', value: wonCount, fill: '#22c55e' },
    { name: 'Lost', value: lostCount, fill: '#ef4444' },
  ];

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv' && data) {
      const csv = [
        ['Metric', 'Value'],
        ['Win Rate', `${winRate}%`],
        ['Deals Won', wonCount],
        ['Deals Lost', lostCount],
        ['Won Value', wonData?.totalValue || 0],
        ['Lost Value', lostData?.totalValue || 0],
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'win-loss-report.csv';
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Win/Loss Analysis</h2>
          <p className="text-slate-500">Analyze your deal win rates and closed deals</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600">{winRate}%</div>
                  <div className="text-sm text-slate-500 mt-1">Win Rate</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">{wonCount}</div>
                  <div className="text-sm text-slate-500 mt-1">Deals Won</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600">{lostCount}</div>
                  <div className="text-sm text-slate-500 mt-1">Deals Lost</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-900">
                    ${((parseFloat(wonData?.totalValue || 0) + parseFloat(lostData?.totalValue || 0)) / 1000).toFixed(0)}k
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Total Closed Value</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Win/Loss Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Value Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { name: 'Won', value: parseFloat(wonData?.totalValue || 0), fill: '#22c55e' },
                      { name: 'Lost', value: parseFloat(lostData?.totalValue || 0), fill: '#ef4444' },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {[
                        { name: 'Won', value: parseFloat(wonData?.totalValue || 0), fill: '#22c55e' },
                        { name: 'Lost', value: parseFloat(lostData?.totalValue || 0), fill: '#ef4444' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Won/Lost Deals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full" />
                  Top Won Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.topWonDeals?.length > 0 ? (
                  <div className="space-y-3">
                    {data.topWonDeals.slice(0, 5).map((deal: any) => (
                      <div key={deal.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-900">{deal.name}</div>
                          <div className="text-sm text-slate-500">{deal.company?.name}</div>
                        </div>
                        <div className="text-green-600 font-semibold">
                          ${(deal.amount || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No won deals in this period</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full" />
                  Top Lost Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.topLostDeals?.length > 0 ? (
                  <div className="space-y-3">
                    {data.topLostDeals.slice(0, 5).map((deal: any) => (
                      <div key={deal.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-900">{deal.name}</div>
                          <div className="text-sm text-slate-500">{deal.company?.name}</div>
                        </div>
                        <div className="text-red-600 font-semibold">
                          ${(deal.amount || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No lost deals in this period</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// Sales Forecast Report
const SalesForecastReport: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/reports/deals/forecast');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv' && data) {
      const csv = [
        ['Deal', 'Company', 'Amount', 'Probability', 'Weighted Value', 'Close Date'],
        ...data.deals.map((deal: any) => [
          deal.name,
          deal.company?.name || '',
          deal.amount,
          `${deal.probability}%`,
          deal.weightedValue.toFixed(2),
          deal.closeDate,
        ]),
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales-forecast.csv';
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Sales Forecast</h2>
          <p className="text-slate-500">Projected revenue based on pipeline and probability</p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600">
                    ${((data?.totalPipelineValue || 0) / 1000).toFixed(0)}k
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Total Pipeline Value</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    ${((data?.totalWeightedValue || 0) / 1000).toFixed(0)}k
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Weighted Forecast</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-900">{data?.avgProbability || 0}%</div>
                  <div className="text-sm text-slate-500 mt-1">Avg Probability</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline Deals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Deals</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.deals?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Deal</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Company</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Stage</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Amount</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Probability</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Weighted</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Close Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.deals.map((deal: any) => (
                        <tr key={deal.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">{deal.name}</td>
                          <td className="py-3 px-4 text-slate-600">{deal.company?.name || '-'}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary" className="capitalize">
                              {deal.stage.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="text-right py-3 px-4">${(deal.amount || 0).toLocaleString()}</td>
                          <td className="text-right py-3 px-4">
                            <span className={deal.probability >= 70 ? 'text-green-600' : deal.probability >= 40 ? 'text-amber-600' : 'text-slate-600'}>
                              {deal.probability}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 font-medium text-green-600">
                            ${deal.weightedValue.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4 text-slate-600">
                            {deal.closeDate ? format(new Date(deal.closeDate), 'MMM d, yyyy') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No deals in pipeline</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Contacts by Lifecycle Report
const ContactsByLifecycleReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ range: 'last30days' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          range: dateRange.range,
          ...(dateRange.startDate && { startDate: dateRange.startDate }),
          ...(dateRange.endDate && { endDate: dateRange.endDate }),
        });
        const response = await api.get(`/reports/contacts/by-lifecycle?${params}`);
        setData(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const lifecycleOrder = ['lead', 'mql', 'sql', 'customer'];
  const sortedData = [...data].sort(
    (a: any, b: any) => lifecycleOrder.indexOf(a.lifecycleStage) - lifecycleOrder.indexOf(b.lifecycleStage)
  );

  const funnelData = sortedData.map((item: any) => ({
    name: item.lifecycleStage.toUpperCase(),
    value: parseInt(item.count),
    fill: LIFECYCLE_COLORS[item.lifecycleStage] || COLORS[0],
  }));

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = [
        ['Lifecycle Stage', 'Count'],
        ...sortedData.map((item: any) => [item.lifecycleStage, item.count]),
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts-by-lifecycle.csv';
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Contacts by Lifecycle Stage</h2>
          <p className="text-slate-500">Funnel view of contacts across lifecycle stages</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Stage Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {sortedData.map((item: any) => (
                  <div
                    key={item.lifecycleStage}
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${LIFECYCLE_COLORS[item.lifecycleStage]}15` }}
                  >
                    <div
                      className="text-3xl font-bold"
                      style={{ color: LIFECYCLE_COLORS[item.lifecycleStage] }}
                    >
                      {item.count}
                    </div>
                    <div className="text-sm text-slate-600 mt-1 uppercase">{item.lifecycleStage}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Contact Growth Report
const ContactGrowthReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ range: 'last90days' });
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          range: dateRange.range,
          interval,
          ...(dateRange.startDate && { startDate: dateRange.startDate }),
          ...(dateRange.endDate && { endDate: dateRange.endDate }),
        });
        const response = await api.get(`/reports/contacts/growth?${params}`);
        setData(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange, interval]);

  const chartData = data.map((item: any) => ({
    period: format(new Date(item.period), interval === 'day' ? 'MMM d' : interval === 'week' ? 'MMM d' : 'MMM yyyy'),
    count: parseInt(item.count),
  }));

  // Calculate cumulative
  let cumulative = 0;
  const cumulativeData = chartData.map((item) => {
    cumulative += item.count;
    return { ...item, cumulative };
  });

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = [
        ['Period', 'New Contacts', 'Cumulative'],
        ...cumulativeData.map(item => [item.period, item.count, item.cumulative]),
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contact-growth.csv';
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Contact Growth</h2>
          <p className="text-slate-500">Track new contact acquisition over time</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Contact Acquisition Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="New Contacts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulative"
                  name="Total Contacts"
                  stroke="#1e3a5f"
                  strokeWidth={2}
                  dot={{ fill: '#1e3a5f', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Contacts by Company Report
const ContactsByCompanyReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/reports/contacts/by-company?page=${page}&limit=20`);
        setData(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = [
        ['Company', 'Contact Count'],
        ...data.map((item: any) => [item.name, item.contactCount]),
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts-by-company.csv';
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Contacts by Company</h2>
          <p className="text-slate-500">Distribution of contacts across companies</p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Company</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Contact Count</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge variant="secondary">{item.contactCount}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Task Completion Report
const TaskCompletionReport: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ range: 'last30days' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          range: dateRange.range,
          ...(dateRange.startDate && { startDate: dateRange.startDate }),
          ...(dateRange.endDate && { endDate: dateRange.endDate }),
        });
        const response = await api.get(`/reports/tasks/completion?${params}`);
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const pieData = data?.data?.map((item: any) => ({
    name: item.status.replace('_', ' '),
    value: parseInt(item.count),
    fill: item.status === 'completed' ? '#22c55e' : item.status === 'in_progress' ? '#f59e0b' : '#94a3b8',
  })) || [];

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv' && data) {
      const csv = [
        ['Status', 'Count'],
        ...data.data.map((item: any) => [item.status, item.count]),
        ['Total', data.total],
        ['Completion Rate', `${data.completionRate}%`],
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'task-completion.csv';
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Task Completion Rate</h2>
          <p className="text-slate-500">Track task completion and productivity</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32">
                    <circle
                      className="text-slate-200"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="56"
                      cx="64"
                      cy="64"
                    />
                    <circle
                      className="text-green-500"
                      strokeWidth="10"
                      strokeDasharray={`${(data?.completionRate || 0) * 3.52} 352`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="56"
                      cx="64"
                      cy="64"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '64px 64px' }}
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold text-slate-900">
                    {data?.completionRate || 0}%
                  </span>
                </div>
                <div className="text-sm text-slate-500 mt-4">Completion Rate</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Total Tasks</span>
                  <span className="font-semibold text-slate-900">{data?.total || 0}</span>
                </div>
                {data?.data?.map((item: any) => (
                  <div key={item.status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 capitalize">{item.status.replace('_', ' ')}</span>
                    <span className="font-semibold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Activity Log Report
const ActivityLogReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ range: 'last7days' });
  const [entityType, setEntityType] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          range: dateRange.range,
          page: page.toString(),
          limit: '50',
          ...(dateRange.startDate && { startDate: dateRange.startDate }),
          ...(dateRange.endDate && { endDate: dateRange.endDate }),
          ...(entityType && { entityType }),
        });
        const response = await api.get(`/reports/activity-log?${params}`);
        setData(response.data.data || []);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange, entityType, page]);

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = [
        ['Date', 'Entity Type', 'Action', 'Description'],
        ...data.map((item: any) => [
          format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm'),
          item.entityType,
          item.action,
          item.description,
        ]),
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'activity-log.csv';
      a.click();
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('create')) return 'success';
    if (action.includes('update')) return 'warning';
    if (action.includes('delete')) return 'danger';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Activity Log</h2>
          <p className="text-slate-500">Detailed log of all system activities</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">All Entities</option>
            <option value="company">Companies</option>
            <option value="contact">Contacts</option>
            <option value="deal">Deals</option>
            <option value="task">Tasks</option>
          </select>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Entity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Description</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600">
                      {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="capitalize">{item.entityType}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getActionBadgeVariant(item.action)}>{item.action}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                <div className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === pagination.pages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Reports Navigation
const ReportsNav: React.FC = () => {
  const navItems = [
    {
      category: 'Deals',
      items: [
        { path: 'deals-by-stage', label: 'Deals by Stage', icon: BarChart3 },
        { path: 'deal-value', label: 'Deal Value Over Time', icon: TrendingUp },
        { path: 'win-loss', label: 'Win/Loss Analysis', icon: PieChart },
        { path: 'forecast', label: 'Sales Forecast', icon: Target },
      ],
    },
    {
      category: 'Contacts',
      items: [
        { path: 'contacts-lifecycle', label: 'By Lifecycle Stage', icon: Users },
        { path: 'contact-growth', label: 'Contact Growth', icon: UserPlus },
        { path: 'contacts-by-company', label: 'By Company', icon: Building2 },
      ],
    },
    {
      category: 'Activity',
      items: [
        { path: 'task-completion', label: 'Task Completion', icon: CheckSquare },
        { path: 'activity-log', label: 'Activity Log', icon: Activity },
      ],
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
      </div>
      <nav className="px-2">
        {navItems.map((category) => (
          <div key={category.category} className="mb-4">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {category.category}
            </div>
            {category.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
};

// Reports Overview (default landing page)
const ReportsOverview: React.FC = () => {
  const navigate = useNavigate();

  const reports = [
    {
      title: 'Deals by Stage',
      description: 'View distribution of deals across pipeline stages',
      icon: BarChart3,
      path: 'deals-by-stage',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Win/Loss Analysis',
      description: 'Analyze your win rates and closed deals',
      icon: PieChart,
      path: 'win-loss',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Sales Forecast',
      description: 'Projected revenue based on pipeline',
      icon: Target,
      path: 'forecast',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Contact Growth',
      description: 'Track contact acquisition over time',
      icon: UserPlus,
      path: 'contact-growth',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Task Completion',
      description: 'Monitor task completion rates',
      icon: CheckSquare,
      path: 'task-completion',
      color: 'bg-teal-100 text-teal-600',
    },
    {
      title: 'Activity Log',
      description: 'View detailed system activity',
      icon: Activity,
      path: 'activity-log',
      color: 'bg-slate-100 text-slate-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Reports Overview</h2>
        <p className="text-slate-500">Select a report to view detailed analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card
            key={report.path}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(report.path)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${report.color}`}>
                  <report.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{report.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{report.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Main Reports Component
const Reports: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      <ReportsNav />
      <div className="flex-1 overflow-auto p-6">
        <Routes>
          <Route index element={<ReportsOverview />} />
          <Route path="deals-by-stage" element={<DealsByStageReport />} />
          <Route path="deal-value" element={<DealValueOverTimeReport />} />
          <Route path="win-loss" element={<WinLossReport />} />
          <Route path="forecast" element={<SalesForecastReport />} />
          <Route path="contacts-lifecycle" element={<ContactsByLifecycleReport />} />
          <Route path="contact-growth" element={<ContactGrowthReport />} />
          <Route path="contacts-by-company" element={<ContactsByCompanyReport />} />
          <Route path="task-completion" element={<TaskCompletionReport />} />
          <Route path="activity-log" element={<ActivityLogReport />} />
        </Routes>
      </div>
    </div>
  );
};

export default Reports;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Activity, TrendingUp, TrendingDown, AlertTriangle, Building2,
  BarChart3, Users, ClipboardList, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchHealthScore } from '../../features/healthScoresSlice';
import { fetchSurveys } from '../../features/surveysSlice';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '../../components/ui';
import { surveysApi } from '../../services/api';

const getRiskBadgeVariant = (riskLevel: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (riskLevel) {
    case 'at_risk': return 'danger';
    case 'caution': return 'warning';
    case 'good': return 'info';
    case 'excellent': return 'success';
    default: return 'default';
  }
};

const getScoreColor = (score: number) => {
  if (score < 40) return 'text-red-600';
  if (score < 60) return 'text-yellow-600';
  if (score < 80) return 'text-blue-600';
  return 'text-green-600';
};

const getScoreBarColor = (score: number) => {
  if (score < 40) return 'bg-red-500';
  if (score < 60) return 'bg-yellow-500';
  if (score < 80) return 'bg-blue-500';
  return 'bg-green-500';
};

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

interface SurveyResponse {
  id: string;
  surveyId: string;
  contactId?: string;
  companyId?: string;
  responses: Record<string, any>;
  score: number;
  submittedAt: string;
  contact?: any;
  company?: any;
  survey?: any;
}

const HealthScoreDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentHealthScore, isLoading } = useAppSelector((state) => state.healthScores);
  const { surveys } = useAppSelector((state) => state.surveys);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchHealthScore(id));
    }
    dispatch(fetchSurveys({}));
  }, [dispatch, id]);

  useEffect(() => {
    const fetchSurveyResponses = async () => {
      if (!currentHealthScore?.companyId || surveys.length === 0) return;

      setLoadingResponses(true);
      try {
        const allResponses: SurveyResponse[] = [];
        for (const survey of surveys) {
          try {
            const response = await surveysApi.getResponses(survey.id, { limit: 100 });
            const companyResponses = response.data.responses?.filter(
              (r: SurveyResponse) => r.companyId === currentHealthScore.companyId
            ) || [];
            allResponses.push(...companyResponses.map((r: SurveyResponse) => ({ ...r, survey })));
          } catch (e) {
            // Skip if error fetching responses for this survey
          }
        }
        setSurveyResponses(allResponses);
      } catch (error) {
        console.error('Error fetching survey responses:', error);
      } finally {
        setLoadingResponses(false);
      }
    };

    fetchSurveyResponses();
  }, [currentHealthScore?.companyId, surveys]);

  if (isLoading || !currentHealthScore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Prepare chart data
  const surveyScoresData = [
    { name: 'NPS', score: currentHealthScore.npsScore ?? 0, fullMark: 100 },
    { name: 'CSAT', score: currentHealthScore.csatScore ?? 0, fullMark: 100 },
    { name: 'CES', score: currentHealthScore.cesScore ? (currentHealthScore.cesScore / 7) * 100 : 0, fullMark: 100 },
    { name: 'Custom', score: currentHealthScore.customSurveyScore ?? 0, fullMark: 100 },
  ];

  const radarData = [
    { subject: 'NPS', A: currentHealthScore.npsScore ?? 0, fullMark: 100 },
    { subject: 'CSAT', A: currentHealthScore.csatScore ?? 0, fullMark: 100 },
    { subject: 'CES', A: currentHealthScore.cesScore ? (currentHealthScore.cesScore / 7) * 100 : 0, fullMark: 100 },
    { subject: 'Custom', A: currentHealthScore.customSurveyScore ?? 0, fullMark: 100 },
    { subject: 'Engagement', A: currentHealthScore.engagementScore ?? 0, fullMark: 100 },
  ];

  // Group responses by survey type
  const responsesByType = surveyResponses.reduce((acc, response) => {
    const type = response.survey?.type?.toUpperCase() || 'OTHER';
    if (!acc[type]) acc[type] = [];
    acc[type].push(response);
    return acc;
  }, {} as Record<string, SurveyResponse[]>);

  // Calculate NPS distribution (Promoters, Passives, Detractors)
  const npsResponses = responsesByType['NPS'] || [];
  const npsDistribution = [
    { name: 'Promoters (9-10)', value: npsResponses.filter(r => r.score >= 9).length, color: '#10B981' },
    { name: 'Passives (7-8)', value: npsResponses.filter(r => r.score >= 7 && r.score < 9).length, color: '#F59E0B' },
    { name: 'Detractors (0-6)', value: npsResponses.filter(r => r.score < 7).length, color: '#EF4444' },
  ];

  // Response trend over time
  const responseTrend = surveyResponses
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .map(r => ({
      date: format(new Date(r.submittedAt), 'MMM d'),
      score: r.score,
      type: r.survey?.type?.toUpperCase() || 'OTHER',
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/health-scores')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {currentHealthScore.company?.name || 'Health Score'} - Health Details
                </h1>
                <Badge variant={getRiskBadgeVariant(currentHealthScore.riskLevel)}>
                  {currentHealthScore.riskLevel.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-slate-500">
                Last calculated: {format(new Date(currentHealthScore.calculatedAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/companies/${currentHealthScore.companyId}`)}>
          <Building2 className="w-4 h-4 mr-2" />
          View Company
        </Button>
      </div>

      {/* Overall Health Score Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={currentHealthScore.score >= 80 ? '#10B981' : currentHealthScore.score >= 60 ? '#3B82F6' : currentHealthScore.score >= 40 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(currentHealthScore.score / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${getScoreColor(currentHealthScore.score)}`}>
                    {currentHealthScore.score}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Overall Health Score</h3>
                <p className="text-slate-500">Based on survey responses and engagement metrics</p>
                <div className="flex items-center gap-4 mt-3">
                  {currentHealthScore.riskLevel === 'excellent' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-medium">Excellent Health</span>
                    </div>
                  )}
                  {currentHealthScore.riskLevel === 'good' && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Activity className="w-5 h-5" />
                      <span className="font-medium">Good Health</span>
                    </div>
                  )}
                  {currentHealthScore.riskLevel === 'caution' && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">Needs Attention</span>
                    </div>
                  )}
                  {currentHealthScore.riskLevel === 'at_risk' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <TrendingDown className="w-5 h-5" />
                      <span className="font-medium">At Risk</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{currentHealthScore.npsScore ?? '-'}</p>
                <p className="text-sm text-slate-500">NPS Score</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{currentHealthScore.csatScore ?? '-'}%</p>
                <p className="text-sm text-slate-500">CSAT Score</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{currentHealthScore.cesScore ?? '-'}/7</p>
                <p className="text-sm text-slate-500">CES Score</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{currentHealthScore.customSurveyScore ?? '-'}%</p>
                <p className="text-sm text-slate-500">Custom Survey</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Survey Scores Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Survey Scores Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={surveyScoresData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#6366F1" radius={[4, 4, 0, 0]}>
                    {surveyScoresData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Health Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Health Metrics Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="#6366F1"
                    fill="#6366F1"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NPS Distribution and Response Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPS Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              NPS Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {npsResponses.length > 0 ? (
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={npsDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {npsDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                No NPS responses available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Response Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {responseTrend.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={responseTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={{ fill: '#6366F1' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                No response trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Survey Responses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Survey Responses ({surveyResponses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingResponses ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-slate-500">Loading responses...</span>
            </div>
          ) : surveyResponses.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No survey responses found for this company</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(responsesByType).map(([type, responses]) => (
                <div key={type} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={
                      type === 'NPS' ? 'purple' :
                      type === 'CSAT' ? 'success' :
                      type === 'CES' ? 'warning' : 'info'
                    }>
                      {type}
                    </Badge>
                    <span className="text-sm text-slate-500">{responses.length} response(s)</span>
                  </div>
                  <div className="space-y-2">
                    {responses.map((response) => (
                      <div
                        key={response.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-600">{response.score}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {response.contact?.firstName ? `${response.contact.firstName} ${response.contact.lastName}` : 'Anonymous'}
                            </p>
                            <p className="text-sm text-slate-500">
                              {response.survey?.name || 'Unknown Survey'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">
                            {format(new Date(response.submittedAt), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-slate-400">
                            {format(new Date(response.submittedAt), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthScoreDetail;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Activity, TrendingUp, TrendingDown, AlertTriangle, Plus, Edit, Building2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchHealthScores, fetchHealthScoreStats } from '../../features/healthScoresSlice';
import { Button, Input, Select, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination, Badge } from '../../components/ui';
import HealthScoreModal from './HealthScoreModal';

const RISK_LEVEL_OPTIONS = [
  { value: '', label: 'All Risk Levels' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'caution', label: 'Caution' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' },
];

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

const HealthScoreList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { healthScores, pagination, stats, isLoading } = useAppSelector((state) => state.healthScores);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedHealthScore, setSelectedHealthScore] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchHealthScores({ page, limit: 20, riskLevel: riskLevel || undefined }));
    dispatch(fetchHealthScoreStats());
  }, [dispatch, page, riskLevel]);

  const filteredScores = search
    ? healthScores.filter((h) => h.company?.name?.toLowerCase().includes(search.toLowerCase()))
    : healthScores;

  const handleCreate = () => {
    setSelectedHealthScore(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleEdit = (e: React.MouseEvent, healthScore: any) => {
    e.stopPropagation();
    setSelectedHealthScore(healthScore);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedHealthScore(null);
    setModalMode(null);
    dispatch(fetchHealthScores({ page, limit: 20, riskLevel: riskLevel || undefined }));
    dispatch(fetchHealthScoreStats());
  };

  const handleRowClick = (healthScore: any) => {
    navigate(`/health-scores/${healthScore.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Scores</h1>
          <p className="text-slate-500">Monitor customer health and engagement</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleCreate}>
          Add Health Score
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.byRiskLevel?.at_risk || 0}</p>
              <p className="text-sm text-slate-500">At Risk</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.byRiskLevel?.caution || 0}</p>
              <p className="text-sm text-slate-500">Caution</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.byRiskLevel?.good || 0}</p>
              <p className="text-sm text-slate-500">Good</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.byRiskLevel?.excellent || 0}</p>
              <p className="text-sm text-slate-500">Excellent</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Average Score Card */}
      {stats && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Activity className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Average Health Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
                  {stats.averageScore}
                </p>
              </div>
            </div>
            <div className="flex-1 max-w-md mx-8">
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(stats.averageScore)}`}
                  style={{ width: `${stats.averageScore}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-slate-400">
                <span>0</span>
                <span>At Risk</span>
                <span>Caution</span>
                <span>Good</span>
                <span>100</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Total Companies</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-40">
              <Select options={RISK_LEVEL_OPTIONS} value={riskLevel} onChange={setRiskLevel} />
            </div>
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Company</TableHeader>
              <TableHeader>Health Score</TableHeader>
              <TableHeader>
                <div className="flex items-center gap-1">
                  <Badge variant="purple" className="text-xs">NPS</Badge>
                </div>
              </TableHeader>
              <TableHeader>
                <div className="flex items-center gap-1">
                  <Badge variant="success" className="text-xs">CSAT</Badge>
                </div>
              </TableHeader>
              <TableHeader>
                <div className="flex items-center gap-1">
                  <Badge variant="warning" className="text-xs">CES</Badge>
                </div>
              </TableHeader>
              <TableHeader>
                <div className="flex items-center gap-1">
                  <Badge variant="info" className="text-xs">Custom</Badge>
                </div>
              </TableHeader>
              <TableHeader>Risk Level</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredScores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No health scores found
                </TableCell>
              </TableRow>
            ) : (
              filteredScores.map((hs: any) => (
                <TableRow
                  key={hs.id}
                  clickable
                  onClick={() => handleRowClick(hs)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">{hs.company?.name || 'N/A'}</span>
                        <p className="text-xs text-slate-400">Click to view details</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getScoreBarColor(hs.score)}`}
                          style={{ width: `${hs.score}%` }}
                        />
                      </div>
                      <span className={`font-bold ${getScoreColor(hs.score)}`}>{hs.score}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {hs.npsScore !== null && hs.npsScore !== undefined ? (
                      <div className="flex items-center gap-1">
                        <span className={`font-bold text-lg ${hs.npsScore >= 50 ? 'text-green-600' : hs.npsScore >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {hs.npsScore}
                        </span>
                        <span className="text-xs text-slate-400">
                          {hs.npsScore >= 50 ? 'Good' : hs.npsScore >= 0 ? 'Ok' : 'Low'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">No data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hs.csatScore !== null && hs.csatScore !== undefined ? (
                      <div className="flex items-center gap-1">
                        <span className={`font-bold text-lg ${hs.csatScore >= 80 ? 'text-green-600' : hs.csatScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {hs.csatScore}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">No data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hs.cesScore !== null && hs.cesScore !== undefined ? (
                      <div className="flex items-center gap-1">
                        <span className={`font-bold text-lg ${hs.cesScore >= 5 ? 'text-green-600' : hs.cesScore >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {hs.cesScore}
                        </span>
                        <span className="text-xs text-slate-400">/7</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">No data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hs.customSurveyScore !== null && hs.customSurveyScore !== undefined ? (
                      <div className="flex items-center gap-1">
                        <span className={`font-bold text-lg ${hs.customSurveyScore >= 80 ? 'text-green-600' : hs.customSurveyScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {hs.customSurveyScore}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">No data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRiskBadgeVariant(hs.riskLevel)}>
                      {hs.riskLevel.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEdit(e, hs)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded"
                        title="Edit health score"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && (
          <Pagination
            page={page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={setPage}
          />
        )}
      </Card>

      <HealthScoreModal
        isOpen={showModal}
        onClose={handleModalClose}
        mode={modalMode}
        healthScore={selectedHealthScore}
      />
    </div>
  );
};

export default HealthScoreList;

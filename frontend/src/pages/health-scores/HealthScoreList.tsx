import React, { useEffect, useState } from 'react';
import { Search, Activity, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchHealthScores, fetchHealthScoreStats } from '../../features/healthScoresSlice';
import { Input, Select, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination, Badge } from '../../components/ui';

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

const HealthScoreList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { healthScores, pagination, stats, isLoading } = useAppSelector((state) => state.healthScores);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchHealthScores({ page, limit: 20, riskLevel: riskLevel || undefined }));
    dispatch(fetchHealthScoreStats());
  }, [dispatch, page, riskLevel]);

  const filteredScores = search
    ? healthScores.filter((h) => h.company?.name?.toLowerCase().includes(search.toLowerCase()))
    : healthScores;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Scores</h1>
          <p className="text-slate-500">Monitor customer health and engagement</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.byRiskLevel?.at_risk || 0}</p>
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
                <p className="text-2xl font-bold text-slate-900">{stats.byRiskLevel?.caution || 0}</p>
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
                <p className="text-2xl font-bold text-slate-900">{stats.byRiskLevel?.good || 0}</p>
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
                <p className="text-2xl font-bold text-slate-900">{stats.byRiskLevel?.excellent || 0}</p>
                <p className="text-sm text-slate-500">Excellent</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-4">
            <div className="flex-1 max-w-md">
              <Input placeholder="Search by company..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
            </div>
            <Select options={RISK_LEVEL_OPTIONS} value={riskLevel} onChange={setRiskLevel} />
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Company</TableHeader>
              <TableHeader>Health Score</TableHeader>
              <TableHeader>NPS</TableHeader>
              <TableHeader>CSAT</TableHeader>
              <TableHeader>CES</TableHeader>
              <TableHeader>Engagement</TableHeader>
              <TableHeader>Risk Level</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredScores.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No health scores found</TableCell></TableRow>
            ) : (
              filteredScores.map((hs: any) => (
                <TableRow key={hs.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Activity className="w-5 h-5 text-slate-600" />
                      </div>
                      <span className="font-medium text-slate-900">{hs.company?.name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${hs.score < 40 ? 'bg-red-500' : hs.score < 60 ? 'bg-yellow-500' : hs.score < 80 ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${hs.score}%` }} />
                      </div>
                      <span className={`font-bold ${getScoreColor(hs.score)}`}>{hs.score}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={hs.npsScore >= 9 ? 'text-green-600 font-medium' : hs.npsScore >= 7 ? 'text-blue-600' : hs.npsScore ? 'text-amber-600' : 'text-slate-400'}>
                      {hs.npsScore ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={hs.csatScore >= 4 ? 'text-green-600 font-medium' : hs.csatScore >= 3 ? 'text-blue-600' : hs.csatScore ? 'text-amber-600' : 'text-slate-400'}>
                      {hs.csatScore ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={hs.cesScore >= 6 ? 'text-green-600 font-medium' : hs.cesScore >= 4 ? 'text-blue-600' : hs.cesScore ? 'text-amber-600' : 'text-slate-400'}>
                      {hs.cesScore ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell>{hs.engagementScore ?? '-'}</TableCell>
                  <TableCell><Badge variant={getRiskBadgeVariant(hs.riskLevel)}>{hs.riskLevel.replace('_', ' ')}</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && <Pagination page={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={setPage} />}
      </Card>
    </div>
  );
};

export default HealthScoreList;

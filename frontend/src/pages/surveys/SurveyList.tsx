import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchSurveys } from '../../features/surveysSlice';
import { openModal } from '../../features/uiSlice';
import { Button, Input, Select, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination, Badge } from '../../components/ui';
import SurveyModal from './SurveyModal';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'nps', label: 'NPS' },
  { value: 'csat', label: 'CSAT' },
  { value: 'ces', label: 'CES' },
  { value: 'custom', label: 'Custom' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (status) {
    case 'draft': return 'default';
    case 'active': return 'success';
    case 'paused': return 'warning';
    case 'completed': return 'info';
    default: return 'default';
  }
};

const getTypeBadgeVariant = (type: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (type) {
    case 'nps': return 'purple';
    case 'csat': return 'success';
    case 'ces': return 'warning';
    case 'custom': return 'default';
    default: return 'default';
  }
};

const SurveyList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { surveys, pagination, isLoading } = useAppSelector((state) => state.surveys);
  const { modal } = useAppSelector((state) => state.ui);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchSurveys({ page, limit: 20, type: type || undefined, status: status || undefined }));
  }, [dispatch, page, type, status]);

  const filteredSurveys = search
    ? surveys.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : surveys;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Surveys</h1>
          <p className="text-slate-500">Collect feedback with NPS, CSAT, and custom surveys</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => dispatch(openModal({ type: 'survey', mode: 'create' }))}>
          New Survey
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input placeholder="Search surveys..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
            </div>
            <div className="w-32">
              <Select options={TYPE_OPTIONS} value={type} onChange={setType} />
            </div>
            <div className="w-32">
              <Select options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            </div>
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Survey</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Questions</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredSurveys.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No surveys found</TableCell></TableRow>
            ) : (
              filteredSurveys.map((survey) => (
                <TableRow key={survey.id} clickable onClick={() => navigate(`/surveys/${survey.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <ClipboardList className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{survey.name}</p>
                        {survey.description && <p className="text-sm text-slate-500 truncate max-w-xs">{survey.description}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getTypeBadgeVariant(survey.type)}>{survey.type.toUpperCase()}</Badge></TableCell>
                  <TableCell>{survey.questions?.length || 0} questions</TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(survey.status)}>{survey.status}</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && <Pagination page={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={setPage} />}
      </Card>

      <SurveyModal isOpen={modal.type === 'survey'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode === 'view' ? 'edit' : modal.mode} survey={modal.data} />
    </div>
  );
};

export default SurveyList;

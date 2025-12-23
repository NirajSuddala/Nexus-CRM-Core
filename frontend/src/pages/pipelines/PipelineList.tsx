import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, GitBranch, Settings } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchPipelines } from '../../features/pipelinesSlice';
import { openModal } from '../../features/uiSlice';
import { Button, Input, Select, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination, Badge } from '../../components/ui';
import PipelineModal from './PipelineModal';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'support', label: 'Support' },
  { value: 'custom', label: 'Custom' },
];

const getTypeBadgeVariant = (type: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (type) {
    case 'onboarding': return 'info';
    case 'delivery': return 'success';
    case 'support': return 'warning';
    case 'custom': return 'default';
    default: return 'default';
  }
};

const PipelineList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pipelines, pagination, isLoading } = useAppSelector((state) => state.pipelines);
  const { modal } = useAppSelector((state) => state.ui);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchPipelines({ page, limit: 20, type: type || undefined }));
  }, [dispatch, page, type]);

  const filteredPipelines = search
    ? pipelines.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : pipelines;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipelines</h1>
          <p className="text-slate-500">Manage workflow pipelines and stages</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => dispatch(openModal({ type: 'pipeline', mode: 'create' }))}>
          New Pipeline
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input placeholder="Search pipelines..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
            </div>
            <div className="w-36">
              <Select options={TYPE_OPTIONS} value={type} onChange={setType} />
            </div>
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Pipeline</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Stages</TableHeader>
              <TableHeader>Default</TableHeader>
              <TableHeader className="w-20"></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredPipelines.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No pipelines found</TableCell></TableRow>
            ) : (
              filteredPipelines.map((pipeline) => (
                <TableRow key={pipeline.id} clickable onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-100 rounded-lg">
                        <GitBranch className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{pipeline.name}</p>
                        {pipeline.description && <p className="text-sm text-slate-500 truncate max-w-xs">{pipeline.description}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getTypeBadgeVariant(pipeline.type)}>{pipeline.type}</Badge></TableCell>
                  <TableCell>{pipeline.stages?.length || 0} stages</TableCell>
                  <TableCell>
                    {pipeline.isDefault && <Badge variant="info">Default</Badge>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); dispatch(openModal({ type: 'pipeline', mode: 'edit', data: pipeline })); }}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && <Pagination page={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={setPage} />}
      </Card>

      <PipelineModal isOpen={modal.type === 'pipeline'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode === 'view' ? 'edit' : modal.mode} pipeline={modal.data} />
    </div>
  );
};

export default PipelineList;

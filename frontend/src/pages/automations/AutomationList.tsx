import React, { useEffect, useState } from 'react';
import { Plus, Search, Zap, Play, Pause, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchAutomations, toggleAutomation } from '../../features/automationsSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { Button, Input, Select, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination, Badge } from '../../components/ui';
import AutomationModal from './AutomationModal';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const TRIGGER_TYPE_OPTIONS = [
  { value: '', label: 'All Triggers' },
  { value: 'event', label: 'Event' },
  { value: 'time', label: 'Time-based' },
  { value: 'manual', label: 'Manual' },
];

const getTriggerBadgeVariant = (triggerType: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (triggerType) {
    case 'event': return 'purple';
    case 'time': return 'warning';
    case 'manual': return 'default';
    default: return 'default';
  }
};

const AutomationList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { automations, pagination, isLoading } = useAppSelector((state) => state.automations);
  const { modal } = useAppSelector((state) => state.ui);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchAutomations({ page, limit: 20, status: status || undefined, triggerType: triggerType || undefined }));
  }, [dispatch, page, status, triggerType]);

  const handleToggle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dispatch(toggleAutomation(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Automation status toggled' }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to toggle automation' }));
    }
  };

  const hasFilters = search || status || triggerType;

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setTriggerType('');
    setPage(1);
  };

  const filteredAutomations = search
    ? automations.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : automations;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automations</h1>
          <p className="text-slate-500">Automate workflows and actions</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => dispatch(openModal({ type: 'automation', mode: 'create' }))}>
          New Automation
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input placeholder="Search automations..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
            </div>
            <div className="w-32">
              <Select options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            </div>
            <div className="w-36">
              <Select options={TRIGGER_TYPE_OPTIONS} value={triggerType} onChange={setTriggerType} />
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Automation</TableHeader>
              <TableHeader>Trigger Type</TableHeader>
              <TableHeader>Actions</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader className="w-20"></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredAutomations.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No automations found</TableCell></TableRow>
            ) : (
              filteredAutomations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${automation.status === 'active' ? 'bg-green-100' : 'bg-slate-100'}`}>
                        <Zap className={`w-5 h-5 ${automation.status === 'active' ? 'text-green-600' : 'text-slate-400'}`} />
                      </div>
                      <span className="font-medium text-slate-900">{automation.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getTriggerBadgeVariant(automation.triggerType)}>{automation.triggerType}</Badge></TableCell>
                  <TableCell>{automation.actions?.length || 0} actions</TableCell>
                  <TableCell>
                    <Badge variant={automation.status === 'active' ? 'success' : 'default'}>
                      {automation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => handleToggle(automation.id, e)}>
                      {automation.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && <Pagination page={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={setPage} />}
      </Card>

      <AutomationModal isOpen={modal.type === 'automation'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode === 'view' ? 'edit' : modal.mode} automation={modal.data} />
    </div>
  );
};

export default AutomationList;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Mail, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchEmailSequences } from '../../features/emailSequencesSlice';
import { openModal } from '../../features/uiSlice';
import { Button, Input, Select, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination, Badge } from '../../components/ui';
import EmailSequenceModal from './EmailSequenceModal';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
];

const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (status) {
    case 'draft': return 'default';
    case 'active': return 'success';
    case 'paused': return 'warning';
    default: return 'default';
  }
};

const EmailSequenceList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { sequences, pagination, isLoading } = useAppSelector((state) => state.emailSequences);
  const { modal } = useAppSelector((state) => state.ui);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchEmailSequences({ page, limit: 20, status: status || undefined }));
  }, [dispatch, page, status]);

  const filteredSequences = search
    ? sequences.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : sequences;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Sequences</h1>
          <p className="text-slate-500">Automated email campaigns and drip sequences</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => dispatch(openModal({ type: 'emailSequence', mode: 'create' }))}>
          New Sequence
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-4">
            <div className="flex-1 max-w-md">
              <Input placeholder="Search sequences..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
            </div>
            <Select options={STATUS_OPTIONS} value={status} onChange={setStatus} />
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Sequence</TableHeader>
              <TableHeader>Trigger</TableHeader>
              <TableHeader>Steps</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredSequences.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No sequences found</TableCell></TableRow>
            ) : (
              filteredSequences.map((sequence) => (
                <TableRow key={sequence.id} clickable onClick={() => navigate(`/email-sequences/${sequence.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Mail className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{sequence.name}</p>
                        {sequence.description && <p className="text-sm text-slate-500 truncate max-w-xs">{sequence.description}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <ArrowRight className="w-4 h-4" />
                      {sequence.trigger?.replace(/_/g, ' ') || 'Manual'}
                    </div>
                  </TableCell>
                  <TableCell>{sequence.steps?.length || 0} steps</TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(sequence.status)}>{sequence.status}</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && <Pagination page={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={setPage} />}
      </Card>

      <EmailSequenceModal isOpen={modal.type === 'emailSequence'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode === 'view' ? 'edit' : modal.mode} sequence={modal.data} />
    </div>
  );
};

export default EmailSequenceList;

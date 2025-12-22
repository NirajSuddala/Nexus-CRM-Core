import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchDeals } from '../../features/dealsSlice';
import { openModal } from '../../features/uiSlice';
import {
  Button, Input, Select, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination, Badge, getDealStageBadgeVariant
} from '../../components/ui';
import DealModal from './DealModal';

const STAGE_OPTIONS = [
  { value: '', label: 'All Stages' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
];

const DealList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { deals, pagination, isLoading } = useAppSelector((state) => state.deals);
  const { modal } = useAppSelector((state) => state.ui);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchDeals({ page, limit: 20, search: search || undefined, stage: stage || undefined }));
  }, [dispatch, page, search, stage]);

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deals</h1>
          <p className="text-slate-500">Manage your deals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<LayoutGrid className="w-4 h-4" />} onClick={() => navigate('/deals')}>Kanban View</Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => dispatch(openModal({ type: 'deal', mode: 'create' }))}>Add Deal</Button>
        </div>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <form className="flex gap-4">
            <div className="flex-1 max-w-md">
              <Input placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
            </div>
            <Select options={STAGE_OPTIONS} value={stage} onChange={setStage} />
          </form>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Deal</TableHeader>
              <TableHeader>Company</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Stage</TableHeader>
              <TableHeader>Close Date</TableHeader>
              <TableHeader>Probability</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : deals.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No deals found</TableCell></TableRow>
            ) : (
              deals.map((deal) => (
                <TableRow key={deal.id} clickable onClick={() => navigate(`/deals/${deal.id}`)}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">{deal.name}</p>
                      {deal.contact && <p className="text-sm text-slate-500">{deal.contact.fullName}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{deal.company?.name || '-'}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 font-medium"><DollarSign className="w-4 h-4 text-slate-400" />{formatCurrency(deal.amount)}</span>
                  </TableCell>
                  <TableCell><Badge variant={getDealStageBadgeVariant(deal.stage)}>{deal.stage.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{deal.closeDate ? format(new Date(deal.closeDate), 'MMM d, yyyy') : '-'}</TableCell>
                  <TableCell><span className="px-2 py-1 bg-slate-100 rounded-full text-sm">{deal.probability}%</span></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && <Pagination page={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={setPage} />}
      </Card>

      <DealModal isOpen={modal.type === 'deal'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode} deal={modal.data} />
    </div>
  );
};

export default DealList;

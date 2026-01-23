import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Ticket, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchTickets } from '../../features/ticketsSlice';
import { openModal } from '../../features/uiSlice';
import { Button, Input, Select, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination, Badge } from '../../components/ui';
import TicketModal from './TicketModal';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_client', label: 'Waiting on Client' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'support', label: 'Support' },
  { value: 'change_request', label: 'Change Request' },
  { value: 'question', label: 'Question' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priority' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (status) {
    case 'open': return 'danger';
    case 'in_progress': return 'info';
    case 'waiting_on_client': return 'warning';
    case 'resolved': return 'success';
    case 'closed': return 'default';
    default: return 'default';
  }
};

const getPriorityBadgeVariant = (priority: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (priority) {
    case 'urgent': return 'danger';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'default';
    default: return 'default';
  }
};

const getTypeBadgeVariant = (type: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (type) {
    case 'bug': return 'danger';
    case 'feature_request': return 'purple';
    case 'support': return 'success';
    case 'change_request': return 'warning';
    case 'question': return 'default';
    default: return 'default';
  }
};

const TicketList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tickets, pagination, isLoading } = useAppSelector((state) => state.tickets);
  const { modal } = useAppSelector((state) => state.ui);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchTickets({ page, limit: 20, search: search || undefined, status: status || undefined, type: type || undefined, priority: priority || undefined }));
  }, [dispatch, page, search, status, type, priority]);

  const hasFilters = search || status || type || priority;

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setType('');
    setPriority('');
    setPage(1);
  };

  const isOverdue = (dueDate: string | undefined, ticketStatus: string) => {
    if (!dueDate || ticketStatus === 'resolved' || ticketStatus === 'closed') return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
          <p className="text-slate-500">Manage support tickets and requests</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => dispatch(openModal({ type: 'ticket', mode: 'create' }))}>
          New Ticket
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
            </div>
            <div className="w-40">
              <Select options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            </div>
            <div className="w-40">
              <Select options={TYPE_OPTIONS} value={type} onChange={setType} />
            </div>
            <div className="w-36">
              <Select options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
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
              <TableHeader>Ticket</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Company</TableHeader>
              <TableHeader>Due Date</TableHeader>
              <TableHeader>Priority</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : tickets.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No tickets found</TableCell></TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} clickable onClick={() => navigate(`/tickets/${ticket.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Ticket className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{ticket.title}</p>
                        {ticket.description && <p className="text-sm text-slate-500 truncate max-w-xs">{ticket.description}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getTypeBadgeVariant(ticket.type)}>{ticket.type.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{ticket.company?.name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isOverdue(ticket.dueDate, ticket.status) && <AlertCircle className="w-4 h-4 text-red-500" />}
                      <span className={isOverdue(ticket.dueDate, ticket.status) ? 'text-red-600 font-medium' : ''}>
                        {ticket.dueDate ? format(new Date(ticket.dueDate), 'MMM d, yyyy') : '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getPriorityBadgeVariant(ticket.priority)}>{ticket.priority}</Badge></TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(ticket.status)}>{ticket.status.replace(/_/g, ' ')}</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && <Pagination page={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={setPage} />}
      </Card>

      <TicketModal isOpen={modal.type === 'ticket'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode === 'view' ? 'edit' : modal.mode} ticket={modal.data} />
    </div>
  );
};

export default TicketList;

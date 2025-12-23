import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Ticket, Building2, User, Calendar, Edit, Trash2, AlertCircle, Clock, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchTicket, deleteTicket, clearCurrentTicket, updateTicket } from '../../features/ticketsSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import {
  Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal, Select
} from '../../components/ui';
import TicketModal from './TicketModal';
import ActivityFeed from '../../components/activity/ActivityFeed';

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

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_client', label: 'Waiting on Client' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTicket, isLoading } = useAppSelector((state) => state.tickets);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchTicket(id));
    }
    return () => {
      dispatch(clearCurrentTicket());
    };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteTicket(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Ticket deleted successfully' }));
      navigate('/tickets');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete ticket' }));
    }
    setShowDeleteModal(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !currentTicket) return;
    try {
      await dispatch(updateTicket({
        id,
        data: { status: newStatus as 'open' | 'in_progress' | 'waiting_on_client' | 'resolved' | 'closed' }
      })).unwrap();
      dispatch(addNotification({ type: 'success', title: `Ticket status updated to ${newStatus.replace(/_/g, ' ')}` }));
      dispatch(fetchTicket(id));
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to update ticket status' }));
    }
  };

  const isOverdue = (dueDate: string | undefined, ticketStatus: string) => {
    if (!dueDate || ticketStatus === 'resolved' || ticketStatus === 'closed') return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  if (isLoading || !currentTicket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const ticketOverdue = isOverdue(currentTicket.dueDate, currentTicket.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/tickets')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${ticketOverdue ? 'bg-red-100' : 'bg-orange-100'}`}>
              <Ticket className={`w-6 h-6 ${ticketOverdue ? 'text-red-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentTicket.title}</h1>
                <Badge variant={getStatusBadgeVariant(currentTicket.status)}>
                  {currentTicket.status.replace(/_/g, ' ')}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(currentTicket.priority)}>
                  {currentTicket.priority}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getTypeBadgeVariant(currentTicket.type)}>
                  {currentTicket.type.replace(/_/g, ' ')}
                </Badge>
                {ticketOverdue && (
                  <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                    <AlertCircle className="w-4 h-4" /> Overdue
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'ticket', mode: 'edit', data: currentTicket }))}>
            Edit
          </Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {currentTicket.description && (
            <Card>
              <CardHeader><CardTitle>Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{currentTicket.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Ticket Info */}
          <Card>
            <CardHeader><CardTitle>Ticket Information</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">Company</dt>
                  <dd className="mt-1">
                    {currentTicket.company ? (
                      <Link to={`/companies/${currentTicket.company.id}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <Building2 className="w-4 h-4" />{currentTicket.company.name}
                      </Link>
                    ) : <span className="text-slate-400">-</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Contact</dt>
                  <dd className="mt-1">
                    {currentTicket.contact ? (
                      <Link to={`/contacts/${currentTicket.contact.id}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <User className="w-4 h-4" />{currentTicket.contact.fullName || `${currentTicket.contact.firstName} ${currentTicket.contact.lastName}`}
                      </Link>
                    ) : <span className="text-slate-400">-</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Due Date</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Calendar className={`w-4 h-4 ${ticketOverdue ? 'text-red-500' : 'text-slate-400'}`} />
                    <span className={ticketOverdue ? 'text-red-600 font-medium' : ''}>
                      {currentTicket.dueDate ? format(new Date(currentTicket.dueDate), 'MMM d, yyyy') : '-'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {format(new Date(currentTicket.createdAt), 'MMM d, yyyy h:mm a')}
                  </dd>
                </div>
                {currentTicket.resolvedAt && (
                  <div>
                    <dt className="text-sm text-slate-500">Resolved</dt>
                    <dd className="mt-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {format(new Date(currentTicket.resolvedAt), 'MMM d, yyyy h:mm a')}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-slate-500">Last Updated</dt>
                  <dd className="mt-1">{format(new Date(currentTicket.updatedAt), 'MMM d, yyyy h:mm a')}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500 block mb-1">Update Status</label>
                  <Select
                    options={STATUS_OPTIONS}
                    value={currentTicket.status}
                    onChange={handleStatusChange}
                  />
                </div>
                {currentTicket.status !== 'resolved' && currentTicket.status !== 'closed' && (
                  <Button
                    className="w-full"
                    variant="outline"
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => handleStatusChange('resolved')}
                  >
                    Mark as Resolved
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <ActivityFeed entityType="ticket" entityId={currentTicket.id} />
        </div>
      </div>

      {/* Modals */}
      <TicketModal
        isOpen={modal.type === 'ticket'}
        onClose={() => {
          dispatch(openModal({ type: null, mode: null }));
          if (id) dispatch(fetchTicket(id));
        }}
        mode={modal.mode === 'view' ? 'edit' : modal.mode}
        ticket={modal.data}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Ticket"
        message={`Are you sure you want to delete "${currentTicket.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TicketDetail;

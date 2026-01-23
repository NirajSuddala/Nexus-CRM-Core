import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Ticket, Calendar, Building2, User, Edit, Trash2, AlertCircle, FolderKanban } from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchTicket, deleteTicket, clearCurrentTicket } from '../../features/ticketsSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal } from '../../components/ui';
import TicketModal from './TicketModal';

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

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTicket, isLoading } = useAppSelector((state) => state.tickets);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchTicket(id));
    return () => { dispatch(clearCurrentTicket()); };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteTicket(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Ticket deleted' }));
      navigate('/tickets');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete' }));
    }
    setShowDeleteModal(false);
  };

  const isOverdue = (dueDate: string | undefined, ticketStatus: string) => {
    if (!dueDate || ticketStatus === 'resolved' || ticketStatus === 'closed') return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  if (isLoading || !currentTicket) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/tickets')} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><Ticket className="w-6 h-6 text-orange-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentTicket.title}</h1>
                <Badge variant={getStatusBadgeVariant(currentTicket.status)}>{currentTicket.status.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getTypeBadgeVariant(currentTicket.type)}>{currentTicket.type.replace('_', ' ')}</Badge>
                <Badge variant={getPriorityBadgeVariant(currentTicket.priority)}>{currentTicket.priority}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'ticket', mode: 'edit', data: currentTicket }))}>Edit</Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Information */}
          <Card>
            <CardHeader><CardTitle>Ticket Information</CardTitle></CardHeader>
            <CardContent>
              {currentTicket.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Description</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{currentTicket.description}</p>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">Due Date</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    {isOverdue(currentTicket.dueDate, currentTicket.status) && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className={isOverdue(currentTicket.dueDate, currentTicket.status) ? 'text-red-600 font-medium' : ''}>
                      {currentTicket.dueDate ? format(new Date(currentTicket.dueDate), 'MMM d, yyyy') : '-'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(currentTicket.createdAt), 'MMM d, yyyy')}
                  </dd>
                </div>
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
                        <User className="w-4 h-4" />{currentTicket.contact.firstName} {currentTicket.contact.lastName}
                      </Link>
                    ) : <span className="text-slate-400">-</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Project</dt>
                  <dd className="mt-1">
                    {currentTicket.project ? (
                      <Link to={`/projects/${currentTicket.project.id}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <FolderKanban className="w-4 h-4" />{currentTicket.project.name}
                      </Link>
                    ) : <span className="text-slate-400">-</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Assigned To</dt>
                  <dd className="mt-1">
                    {currentTicket.assignee ? (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-slate-400" />
                        {currentTicket.assignee.firstName} {currentTicket.assignee.lastName}
                      </div>
                    ) : <span className="text-slate-400">Unassigned</span>}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Status Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <Badge variant={getStatusBadgeVariant(currentTicket.status)}>{currentTicket.status.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Priority</span>
                <Badge variant={getPriorityBadgeVariant(currentTicket.priority)}>{currentTicket.priority}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Type</span>
                <Badge variant={getTypeBadgeVariant(currentTicket.type)}>{currentTicket.type.replace('_', ' ')}</Badge>
              </div>
            </CardContent>
          </Card>

          {currentTicket.resolvedAt && (
            <Card>
              <CardHeader><CardTitle>Resolution</CardTitle></CardHeader>
              <CardContent>
                <p className="text-slate-500 text-sm">Resolved on</p>
                <p className="font-semibold text-lg">{format(new Date(currentTicket.resolvedAt), 'MMMM d, yyyy')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <TicketModal isOpen={modal.type === 'ticket'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode} ticket={modal.data} />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete}
        title="Delete Ticket" message={`Are you sure you want to delete "${currentTicket.title}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default TicketDetail;

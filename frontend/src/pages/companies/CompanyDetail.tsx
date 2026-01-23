import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Globe,
  Linkedin,
  DollarSign,
  Users,
  Briefcase,
  Edit,
  Trash2,
  Plus,
  Ticket,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchCompany, deleteCompany, clearCurrentCompany } from '../../features/companiesSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { ticketsApi } from '../../services/api';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  ConfirmModal,
  getLifecycleBadgeVariant,
  getDealStageBadgeVariant,
  getTicketStatusBadgeVariant,
} from '../../components/ui';
import CompanyModal from './CompanyModal';
import ContactModal from '../contacts/ContactModal';
import DealModal from '../deals/DealModal';
import ActivityFeed from '../../components/activity/ActivityFeed';

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCompany, isLoading } = useAppSelector((state) => state.companies);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      dispatch(fetchCompany(id));
      // Fetch tickets for this company
      ticketsApi.getAll({ companyId: id }).then((res) => {
        setTickets(res.data.tickets || []);
      }).catch(() => setTickets([]));
    }
    return () => {
      dispatch(clearCurrentCompany());
    };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteCompany(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Company deleted successfully' }));
      navigate('/companies');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete company' }));
    }
    setShowDeleteModal(false);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading || !currentCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/companies')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{currentCompany.name}</h1>
              {currentCompany.industry && (
                <p className="text-slate-500">{currentCompany.industry}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'company', mode: 'edit', data: currentCompany }))}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">Website</dt>
                  <dd className="mt-1">
                    {currentCompany.domain ? (
                      <a
                        href={currentCompany.domain.startsWith('http') ? currentCompany.domain : `https://${currentCompany.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-4 h-4" />
                        {currentCompany.domain}
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">LinkedIn</dt>
                  <dd className="mt-1">
                    {currentCompany.linkedinUrl ? (
                      <a
                        href={currentCompany.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline flex items-center gap-1"
                      >
                        <Linkedin className="w-4 h-4" />
                        View Profile
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Annual Revenue</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    {formatCurrency(currentCompany.revenue)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="mt-1 text-slate-900">
                    {format(new Date(currentCompany.createdAt), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Contacts ({currentCompany.contacts?.length || 0})
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => dispatch(openModal({ type: 'contact', mode: 'create', data: { companyId: currentCompany.id } }))}
              >
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {currentCompany.contacts?.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No contacts yet</p>
              ) : (
                <div className="space-y-3">
                  {currentCompany.contacts?.map((contact) => (
                    <Link
                      key={contact.id}
                      to={`/contacts/${contact.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{contact.fullName}</p>
                        <p className="text-sm text-slate-500">
                          {contact.jobTitle || contact.email || '-'}
                        </p>
                      </div>
                      <Badge variant={getLifecycleBadgeVariant(contact.lifecycleStage)}>
                        {contact.lifecycleStage}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Deals ({currentCompany.deals?.length || 0})
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => dispatch(openModal({ type: 'deal', mode: 'create', data: { companyId: currentCompany.id } }))}
              >
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {currentCompany.deals?.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No deals yet</p>
              ) : (
                <div className="space-y-3">
                  {currentCompany.deals?.map((deal) => (
                    <Link
                      key={deal.id}
                      to={`/deals/${deal.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{deal.name}</p>
                        <p className="text-sm text-slate-500">
                          {deal.amount ? formatCurrency(deal.amount) : 'No amount'}
                        </p>
                      </div>
                      <Badge variant={getDealStageBadgeVariant(deal.stage)}>
                        {deal.stage.replace('_', ' ')}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Tickets ({tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No tickets yet</p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/tickets/${ticket.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{ticket.title}</p>
                        <p className="text-sm text-slate-500">
                          {ticket.type.replace('_', ' ')}
                          {ticket.creator && ` · Created by ${ticket.creator.firstName || 'Demo'} ${ticket.creator.lastName || 'User'}`}
                        </p>
                      </div>
                      <Badge variant={getTicketStatusBadgeVariant(ticket.status)}>
                        {ticket.status.replace(/_/g, ' ')}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Activity Feed */}
        <div>
          <ActivityFeed entityType="company" entityId={currentCompany.id} />
        </div>
      </div>

      {/* Modals */}
      <CompanyModal
        isOpen={modal.type === 'company'}
        onClose={() => dispatch(openModal({ type: null, mode: null }))}
        mode={modal.mode}
        company={modal.data}
      />

      <ContactModal
        isOpen={modal.type === 'contact'}
        onClose={() => {
          dispatch(openModal({ type: null, mode: null }));
          if (id) dispatch(fetchCompany(id));
        }}
        mode={modal.mode}
        contact={modal.mode === 'edit' ? modal.data : null}
        initialData={modal.mode === 'create' ? { companyId: currentCompany.id } : undefined}
      />

      <DealModal
        isOpen={modal.type === 'deal'}
        onClose={() => {
          dispatch(openModal({ type: null, mode: null }));
          if (id) dispatch(fetchCompany(id));
        }}
        mode={modal.mode}
        deal={modal.mode === 'edit' ? modal.data : null}
        initialData={modal.mode === 'create' ? { companyId: currentCompany.id } : undefined}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Company"
        message={`Are you sure you want to delete "${currentCompany.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default CompanyDetail;

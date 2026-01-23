import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createTicket, updateTicket } from '../../features/ticketsSlice';
import { fetchCompanies } from '../../features/companiesSlice';
import { fetchContacts } from '../../features/contactsSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button, Textarea } from '../../components/ui';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | null;
  ticket?: any;
  initialData?: { contactId?: string; companyId?: string };
}

const TYPE_OPTIONS = [
  { value: 'support', label: 'Support' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'change_request', label: 'Change Request' },
  { value: 'question', label: 'Question' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_client', label: 'Waiting on Client' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, mode, ticket, initialData }) => {
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.companies);
  const { contacts } = useAppSelector((state) => state.contacts);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'support',
    status: 'open',
    priority: 'medium',
    companyId: '',
    contactId: '',
    dueDate: '',
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCompanies({ limit: 100 }));
      dispatch(fetchContacts({ limit: 100 }));
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (mode === 'edit' && ticket) {
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        type: ticket.type || 'support',
        status: ticket.status || 'open',
        priority: ticket.priority || 'medium',
        companyId: ticket.companyId || '',
        contactId: ticket.contactId || '',
        dueDate: ticket.dueDate ? ticket.dueDate.split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'support',
        status: 'open',
        priority: 'medium',
        companyId: initialData?.companyId || '',
        contactId: initialData?.contactId || '',
        dueDate: '',
      });
    }
  }, [mode, ticket, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        companyId: formData.companyId || null,
        contactId: formData.contactId || null,
        type: formData.type as 'bug' | 'feature_request' | 'support' | 'change_request' | 'question',
        status: formData.status as 'open' | 'in_progress' | 'waiting_on_client' | 'resolved' | 'closed',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
      };
      if (mode === 'edit' && ticket) {
        await dispatch(updateTicket({ id: ticket.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Ticket updated successfully' }));
      } else {
        await dispatch(createTicket(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Ticket created successfully' }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save ticket' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const companyOptions = [{ value: '', label: 'Select Company' }, ...companies.map((c) => ({ value: c.id, label: c.name }))];
  const contactOptions = [{ value: '', label: 'Select Contact' }, ...contacts.map((c) => ({ value: c.id, label: c.fullName }))];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Ticket' : 'New Ticket'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
        <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" options={TYPE_OPTIONS} value={formData.type} onChange={(val) => setFormData({ ...formData, type: val })} />
          <Select label="Priority" options={PRIORITY_OPTIONS} value={formData.priority} onChange={(val) => setFormData({ ...formData, priority: val })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Status" options={STATUS_OPTIONS} value={formData.status} onChange={(val) => setFormData({ ...formData, status: val })} />
          <Select label="Company" options={companyOptions} value={formData.companyId} onChange={(val) => setFormData({ ...formData, companyId: val })} />
        </div>
        <Select label="Contact" options={contactOptions} value={formData.contactId} onChange={(val) => setFormData({ ...formData, contactId: val })} />
        <Input label="Due Date" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>{mode === 'edit' ? 'Update' : 'Create'} Ticket</Button>
        </div>
      </form>
    </Modal>
  );
};

export default TicketModal;

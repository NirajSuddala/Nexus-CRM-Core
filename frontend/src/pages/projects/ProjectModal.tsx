import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createProject, updateProject } from '../../features/projectsSlice';
import { fetchCompanies } from '../../features/companiesSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button, Textarea } from '../../components/ui';
import { contactsApi } from '../../services/api';
import { Contact } from '../../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | null;
  project?: any;
}

interface FormErrors {
  name?: string;
  description?: string;
  companyId?: string;
  status?: string;
  startDate?: string;
  targetEndDate?: string;
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, mode, project }) => {
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.companies);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyId: '',
    contactId: '',
    status: 'planning',
    startDate: '',
    targetEndDate: '',
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCompanies({ limit: 100 }));
      setErrors({});
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const params: { limit: number; companyId?: string } = { limit: 100 };
        if (formData.companyId) {
          params.companyId = formData.companyId;
        }
        const response = await contactsApi.getAll(params);
        setContacts(response.data.contacts);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      }
    };
    fetchContacts();
  }, [formData.companyId]);

  useEffect(() => {
    if (mode === 'edit' && project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        companyId: project.companyId || '',
        contactId: project.contactId || '',
        status: project.status || 'planning',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        targetEndDate: project.targetEndDate ? project.targetEndDate.split('T')[0] : '',
      });
    } else {
      setFormData({ name: '', description: '', companyId: '', contactId: '', status: 'planning', startDate: '', targetEndDate: '' });
    }
    setErrors({});
  }, [mode, project]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Project name must be at least 2 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Company is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.targetEndDate) {
      newErrors.targetEndDate = 'Target end date is required';
    }

    if (formData.startDate && formData.targetEndDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.targetEndDate);
      if (end < start) {
        newErrors.targetEndDate = 'Target end date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        status: formData.status as 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled',
      };
      if (mode === 'edit' && project) {
        await dispatch(updateProject({ id: project.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Project updated successfully' }));
      } else {
        await dispatch(createProject(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Project created successfully' }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save project' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const companyOptions = [{ value: '', label: 'Select Company' }, ...companies.map((c) => ({ value: c.id, label: c.name }))];
  const contactOptions = [{ value: '', label: 'Select Contact (Optional)' }, ...contacts.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Project' : 'New Project'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Project Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            error={errors.name}
          />
        </div>
        <div>
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            required
            error={errors.description}
          />
        </div>
        <div>
          <Select
            label="Company"
            options={companyOptions}
            value={formData.companyId}
            onChange={(val) => setFormData({ ...formData, companyId: val, contactId: '' })}
            required
            error={errors.companyId}
          />
        </div>
        <div>
          <Select
            label="Contact"
            options={contactOptions}
            value={formData.contactId}
            onChange={(val) => setFormData({ ...formData, contactId: val })}
          />
        </div>
        <div>
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={(val) => setFormData({ ...formData, status: val })}
            required
            error={errors.status}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              error={errors.startDate}
            />
          </div>
          <div>
            <Input
              label="Target End Date"
              type="date"
              value={formData.targetEndDate}
              onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
              required
              error={errors.targetEndDate}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>{mode === 'edit' ? 'Update' : 'Create'} Project</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;

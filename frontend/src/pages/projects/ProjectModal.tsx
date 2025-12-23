import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createProject, updateProject, createMilestone } from '../../features/projectsSlice';
import { fetchCompanies } from '../../features/companiesSlice';
import { fetchPipelines, fetchPipelineStages } from '../../features/pipelinesSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button, Textarea } from '../../components/ui';
import { contactsApi } from '../../services/api';
import { Contact } from '../../types';
import { GitBranch, Sparkles } from 'lucide-react';

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

const TYPE_OPTIONS = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'implementation', label: 'Implementation' },
  { value: 'support', label: 'Support' },
];

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, mode, project }) => {
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.companies);
  const { pipelines, stages } = useAppSelector((state) => state.pipelines);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [generateMilestones, setGenerateMilestones] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyId: '',
    contactId: '',
    status: 'planning',
    startDate: '',
    targetEndDate: '',
    type: 'delivery',
    pipelineId: '',
    stageId: '',
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCompanies({ limit: 100 }));
      dispatch(fetchPipelines({ limit: 100 }));
      setErrors({});
    }
  }, [isOpen, dispatch]);

  // Fetch stages when pipeline changes
  useEffect(() => {
    if (formData.pipelineId) {
      dispatch(fetchPipelineStages(formData.pipelineId));
    }
  }, [formData.pipelineId, dispatch]);

  // Auto-select matching pipeline based on project type
  useEffect(() => {
    if (mode === 'create' && formData.type && pipelines.length > 0 && !formData.pipelineId) {
      const matchingPipeline = pipelines.find(p => p.type === formData.type);
      if (matchingPipeline) {
        setFormData(prev => ({ ...prev, pipelineId: matchingPipeline.id }));
      }
    }
  }, [formData.type, pipelines, mode, formData.pipelineId]);

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
        type: project.type || 'delivery',
        pipelineId: project.pipelineId || '',
        stageId: project.stageId || '',
      });
      setGenerateMilestones(false); // Don't auto-generate for existing projects
    } else {
      setFormData({ name: '', description: '', companyId: '', contactId: '', status: 'planning', startDate: '', targetEndDate: '', type: 'delivery', pipelineId: '', stageId: '' });
      setGenerateMilestones(true);
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
        type: formData.type as 'onboarding' | 'delivery' | 'implementation' | 'support',
      };

      if (mode === 'edit' && project) {
        await dispatch(updateProject({ id: project.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Project updated successfully' }));
      } else {
        // Create project
        const newProject = await dispatch(createProject(data)).unwrap();

        // Generate milestones from pipeline stages if enabled
        if (generateMilestones && formData.pipelineId && stages.length > 0) {
          const sortedStages = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);

          for (let i = 0; i < sortedStages.length; i++) {
            const stage = sortedStages[i];
            await dispatch(createMilestone({
              projectId: newProject.id,
              data: {
                name: stage.name,
                description: `Complete ${stage.name} phase`,
                status: 'pending',
                sortOrder: i + 1,
              }
            })).unwrap();
          }

          dispatch(addNotification({
            type: 'success',
            title: 'Project created with milestones',
            message: `Created ${sortedStages.length} milestones from pipeline stages`
          }));
        } else {
          dispatch(addNotification({ type: 'success', title: 'Project created successfully' }));
        }
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
  const pipelineOptions = [{ value: '', label: 'Select Pipeline (Optional)' }, ...pipelines.map((p) => ({ value: p.id, label: `${p.name} (${p.type})` }))];
  const sortedStages = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const stageOptions = [{ value: '', label: 'Select Initial Stage (Optional)' }, ...sortedStages.map((s) => ({ value: s.id, label: s.name }))];

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
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Project Type"
              options={TYPE_OPTIONS}
              value={formData.type}
              onChange={(val) => setFormData({ ...formData, type: val, pipelineId: '', stageId: '' })}
              required
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
        </div>

        {/* Pipeline Integration Section */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-5 h-5 text-primary-600" />
            <h3 className="font-medium text-slate-900">Pipeline Integration</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                label="Pipeline"
                options={pipelineOptions}
                value={formData.pipelineId}
                onChange={(val) => setFormData({ ...formData, pipelineId: val, stageId: '' })}
              />
            </div>
            <div>
              <Select
                label="Initial Stage"
                options={stageOptions}
                value={formData.stageId}
                onChange={(val) => setFormData({ ...formData, stageId: val })}
                disabled={!formData.pipelineId}
              />
            </div>
          </div>

          {/* Auto-generate milestones option */}
          {mode === 'create' && formData.pipelineId && stages.length > 0 && (
            <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateMilestones}
                  onChange={(e) => setGenerateMilestones(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-slate-900">Auto-generate milestones</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Create {stages.length} milestones from pipeline stages: {sortedStages.map(s => s.name).join(' → ')}
                  </p>
                </div>
              </label>
            </div>
          )}
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

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createProject, updateProject } from '../../features/projectsSlice';
import { fetchCompanies } from '../../features/companiesSlice';
import { fetchPipelines, fetchPipeline } from '../../features/pipelinesSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button, Textarea } from '../../components/ui';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | null;
  project?: any;
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
  const { pipelines, currentPipeline } = useAppSelector((state) => state.pipelines);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyId: '',
    pipelineId: '',
    stageId: '',
    status: 'planning',
    startDate: '',
    targetEndDate: '',
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCompanies({ limit: 100 }));
      dispatch(fetchPipelines({ limit: 100 }));
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (formData.pipelineId) {
      dispatch(fetchPipeline(formData.pipelineId));
    }
  }, [formData.pipelineId, dispatch]);

  useEffect(() => {
    if (mode === 'edit' && project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        companyId: project.companyId || '',
        pipelineId: project.pipelineId || '',
        stageId: project.stageId || '',
        status: project.status || 'planning',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        targetEndDate: project.targetEndDate ? project.targetEndDate.split('T')[0] : '',
      });
    } else {
      setFormData({ name: '', description: '', companyId: '', pipelineId: '', stageId: '', status: 'planning', startDate: '', targetEndDate: '' });
    }
  }, [mode, project]);

  const handlePipelineChange = (pipelineId: string) => {
    setFormData({ ...formData, pipelineId, stageId: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        pipelineId: formData.pipelineId || null,
        stageId: formData.stageId || null,
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
  const pipelineOptions = [{ value: '', label: 'No Pipeline' }, ...pipelines.map((p) => ({ value: p.id, label: p.name }))];

  const stageOptions = [
    { value: '', label: 'Select Stage' },
    ...(currentPipeline?.id === formData.pipelineId && currentPipeline?.stages
      ? [...currentPipeline.stages].sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((s: any) => ({ value: s.id, label: s.name }))
      : [])
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Project' : 'New Project'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Project Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
        <Select label="Company" options={companyOptions} value={formData.companyId} onChange={(val) => setFormData({ ...formData, companyId: val })} />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Pipeline" options={pipelineOptions} value={formData.pipelineId} onChange={handlePipelineChange} />
          <Select
            label="Stage"
            options={stageOptions}
            value={formData.stageId}
            onChange={(val) => setFormData({ ...formData, stageId: val })}
            disabled={!formData.pipelineId}
          />
        </div>

        <Select label="Status" options={STATUS_OPTIONS} value={formData.status} onChange={(val) => setFormData({ ...formData, status: val })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
          <Input label="Target End Date" type="date" value={formData.targetEndDate} onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })} />
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

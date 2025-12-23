import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createPipeline, updatePipeline } from '../../features/pipelinesSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button, Textarea } from '../../components/ui';

interface PipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | null;
  pipeline?: any;
}

const TYPE_OPTIONS = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'support', label: 'Support' },
  { value: 'custom', label: 'Custom' },
];

const PipelineModal: React.FC<PipelineModalProps> = ({ isOpen, onClose, mode, pipeline }) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'custom',
    isDefault: false,
  });

  useEffect(() => {
    if (mode === 'edit' && pipeline) {
      setFormData({
        name: pipeline.name || '',
        description: pipeline.description || '',
        type: pipeline.type || 'custom',
        isDefault: pipeline.isDefault || false,
      });
    } else {
      setFormData({ name: '', description: '', type: 'custom', isDefault: false });
    }
  }, [mode, pipeline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        type: formData.type as 'onboarding' | 'delivery' | 'support' | 'custom',
      };
      if (mode === 'edit' && pipeline) {
        await dispatch(updatePipeline({ id: pipeline.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Pipeline updated successfully' }));
      } else {
        await dispatch(createPipeline(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Pipeline created successfully' }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save pipeline' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Pipeline' : 'New Pipeline'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Pipeline Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
        <Select label="Type" options={TYPE_OPTIONS} value={formData.type} onChange={(val) => setFormData({ ...formData, type: val })} />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="w-4 h-4 text-primary-600 border-slate-300 rounded" />
          <span className="text-sm text-slate-700">Set as default pipeline for this type</span>
        </label>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>{mode === 'edit' ? 'Update' : 'Create'} Pipeline</Button>
        </div>
      </form>
    </Modal>
  );
};

export default PipelineModal;

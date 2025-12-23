import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createMilestone, updateMilestone } from '../../features/projectsSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button, Textarea } from '../../components/ui';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | null;
  projectId: string;
  milestone?: any;
}

interface FormErrors {
  name?: string;
  description?: string;
  dueDate?: string;
  status?: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const MilestoneModal: React.FC<MilestoneModalProps> = ({ isOpen, onClose, mode, projectId, milestone }) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    status: 'pending',
  });

  useEffect(() => {
    if (mode === 'edit' && milestone) {
      setFormData({
        name: milestone.name || '',
        description: milestone.description || '',
        dueDate: milestone.dueDate ? milestone.dueDate.split('T')[0] : '',
        status: milestone.status || 'pending',
      });
    } else {
      setFormData({ name: '', description: '', dueDate: '', status: 'pending' });
    }
    setErrors({});
  }, [mode, milestone, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Milestone name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Milestone name must be at least 2 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
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
        status: formData.status as 'pending' | 'in_progress' | 'completed',
      };
      if (mode === 'edit' && milestone) {
        await dispatch(updateMilestone({ projectId, milestoneId: milestone.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Milestone updated successfully' }));
      } else {
        await dispatch(createMilestone({ projectId, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Milestone created successfully' }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save milestone' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Milestone' : 'New Milestone'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Milestone Name"
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
          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
            error={errors.dueDate}
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
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>{mode === 'edit' ? 'Update' : 'Create'} Milestone</Button>
        </div>
      </form>
    </Modal>
  );
};

export default MilestoneModal;

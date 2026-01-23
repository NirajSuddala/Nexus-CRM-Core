import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createMilestone, updateMilestone } from '../../features/projectsSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button, Textarea } from '../../components/ui';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  sortOrder?: number;
}

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  milestone?: Milestone | null;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const MilestoneModal: React.FC<MilestoneModalProps> = ({ isOpen, onClose, projectId, milestone, onSuccess }) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    status: 'pending',
    sortOrder: 0,
  });

  const isEditMode = !!milestone;

  useEffect(() => {
    if (milestone) {
      setFormData({
        name: milestone.name || '',
        description: milestone.description || '',
        dueDate: milestone.dueDate ? milestone.dueDate.split('T')[0] : '',
        status: milestone.status || 'pending',
        sortOrder: milestone.sortOrder || 0,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        dueDate: '',
        status: 'pending',
        sortOrder: 0,
      });
    }
  }, [milestone, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        dueDate: formData.dueDate || null,
      };

      if (isEditMode && milestone) {
        await dispatch(updateMilestone({
          projectId,
          milestoneId: milestone.id,
          data
        })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Milestone updated successfully' }));
      } else {
        await dispatch(createMilestone({ projectId, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Milestone created successfully' }));
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save milestone' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Milestone' : 'New Milestone'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Milestone Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter milestone name"
          required
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Optional description"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />

          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={(val) => setFormData({ ...formData, status: val })}
          />
        </div>

        <Input
          label="Sort Order"
          type="number"
          value={formData.sortOrder.toString()}
          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          placeholder="0"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditMode ? 'Update' : 'Create'} Milestone
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MilestoneModal;

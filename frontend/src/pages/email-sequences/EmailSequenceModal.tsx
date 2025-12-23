import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createEmailSequence, updateEmailSequence } from '../../features/emailSequencesSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button, Textarea } from '../../components/ui';

interface EmailSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | null;
  sequence?: any;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
];

const TRIGGER_OPTIONS = [
  { value: 'deal_won', label: 'Deal Won' },
  { value: 'contact_created', label: 'Contact Created' },
  { value: 'milestone_completed', label: 'Milestone Completed' },
  { value: 'manual', label: 'Manual Enrollment' },
];

const EmailSequenceModal: React.FC<EmailSequenceModalProps> = ({ isOpen, onClose, mode, sequence }) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'manual',
    status: 'draft',
  });

  useEffect(() => {
    if (mode === 'edit' && sequence) {
      setFormData({
        name: sequence.name || '',
        description: sequence.description || '',
        trigger: sequence.trigger || 'manual',
        status: sequence.status || 'draft',
      });
    } else {
      setFormData({ name: '', description: '', trigger: 'manual', status: 'draft' });
    }
  }, [mode, sequence]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        status: formData.status as 'draft' | 'active' | 'paused',
      };
      if (mode === 'edit' && sequence) {
        await dispatch(updateEmailSequence({ id: sequence.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Sequence updated successfully' }));
      } else {
        await dispatch(createEmailSequence(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Sequence created successfully' }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save sequence' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Sequence' : 'New Email Sequence'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Sequence Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Trigger" options={TRIGGER_OPTIONS} value={formData.trigger} onChange={(val) => setFormData({ ...formData, trigger: val })} />
          <Select label="Status" options={STATUS_OPTIONS} value={formData.status} onChange={(val) => setFormData({ ...formData, status: val })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>{mode === 'edit' ? 'Update' : 'Create'} Sequence</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmailSequenceModal;

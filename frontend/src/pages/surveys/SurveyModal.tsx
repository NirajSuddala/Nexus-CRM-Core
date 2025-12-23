import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createSurvey, updateSurvey } from '../../features/surveysSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button, Textarea } from '../../components/ui';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | null;
  survey?: any;
}

const TYPE_OPTIONS = [
  { value: 'nps', label: 'NPS (Net Promoter Score)' },
  { value: 'csat', label: 'CSAT (Customer Satisfaction)' },
  { value: 'ces', label: 'CES (Customer Effort Score)' },
  { value: 'custom', label: 'Custom Survey' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

const TRIGGER_OPTIONS = [
  { value: '', label: 'Manual Trigger' },
  { value: 'milestone_completed', label: 'After Milestone Completed' },
  { value: 'project_completed', label: 'After Project Completed' },
  { value: 'ticket_resolved', label: 'After Ticket Resolved' },
];

const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose, mode, survey }) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'nps',
    status: 'draft',
    triggerEvent: '',
    sendAfterDays: 0,
  });

  useEffect(() => {
    if (mode === 'edit' && survey) {
      setFormData({
        name: survey.name || '',
        description: survey.description || '',
        type: survey.type || 'nps',
        status: survey.status || 'draft',
        triggerEvent: survey.triggerEvent || '',
        sendAfterDays: survey.sendAfterDays || 0,
      });
    } else {
      setFormData({ name: '', description: '', type: 'nps', status: 'draft', triggerEvent: '', sendAfterDays: 0 });
    }
  }, [mode, survey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        type: formData.type as 'nps' | 'csat' | 'ces' | 'custom',
        status: formData.status as 'draft' | 'active' | 'paused' | 'completed',
        questions: survey?.questions || getDefaultQuestions(formData.type),
      };
      if (mode === 'edit' && survey) {
        await dispatch(updateSurvey({ id: survey.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Survey updated successfully' }));
      } else {
        await dispatch(createSurvey(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Survey created successfully' }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save survey' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultQuestions = (type: string) => {
    switch (type) {
      case 'nps':
        return [{ id: '1', question: 'How likely are you to recommend us to a friend or colleague?', type: 'rating', scale: 10 }];
      case 'csat':
        return [{ id: '1', question: 'How satisfied are you with our service?', type: 'rating', scale: 5 }];
      case 'ces':
        return [{ id: '1', question: 'How easy was it to get your issue resolved?', type: 'rating', scale: 7 }];
      default:
        return [];
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Survey' : 'New Survey'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Survey Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" options={TYPE_OPTIONS} value={formData.type} onChange={(val) => setFormData({ ...formData, type: val })} />
          <Select label="Status" options={STATUS_OPTIONS} value={formData.status} onChange={(val) => setFormData({ ...formData, status: val })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Trigger Event" options={TRIGGER_OPTIONS} value={formData.triggerEvent} onChange={(val) => setFormData({ ...formData, triggerEvent: val })} />
          <Input label="Send After (days)" type="number" min={0} value={formData.sendAfterDays} onChange={(e) => setFormData({ ...formData, sendAfterDays: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>{mode === 'edit' ? 'Update' : 'Create'} Survey</Button>
        </div>
      </form>
    </Modal>
  );
};

export default SurveyModal;

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createAutomation, updateAutomation } from '../../features/automationsSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button } from '../../components/ui';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | null;
  automation?: any;
}

const TRIGGER_TYPE_OPTIONS = [
  { value: 'event', label: 'Event-based' },
  { value: 'time', label: 'Time-based' },
  { value: 'manual', label: 'Manual' },
];

const STATUS_OPTIONS = [
  { value: 'inactive', label: 'Inactive' },
  { value: 'active', label: 'Active' },
];

const EVENT_OPTIONS = [
  { value: 'deal.stage_changed', label: 'Deal Stage Changed' },
  { value: 'deal.won', label: 'Deal Won' },
  { value: 'deal.lost', label: 'Deal Lost' },
  { value: 'milestone.completed', label: 'Milestone Completed' },
  { value: 'ticket.created', label: 'Ticket Created' },
  { value: 'ticket.resolved', label: 'Ticket Resolved' },
  { value: 'health_score.below_threshold', label: 'Health Score Below Threshold' },
];

const ACTION_TYPE_OPTIONS = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'start_sequence', label: 'Start Email Sequence' },
  { value: 'send_survey', label: 'Send Survey' },
  { value: 'notify', label: 'Send Notification' },
  { value: 'update_field', label: 'Update Field' },
];

const AutomationModal: React.FC<AutomationModalProps> = ({ isOpen, onClose, mode, automation }) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'event',
    status: 'inactive',
    triggerEvent: '',
    actionType: 'send_email',
  });

  useEffect(() => {
    if (mode === 'edit' && automation) {
      setFormData({
        name: automation.name || '',
        triggerType: automation.triggerType || 'event',
        status: automation.status || 'inactive',
        triggerEvent: automation.triggerConfig?.event || '',
        actionType: automation.actions?.[0]?.type || 'send_email',
      });
    } else {
      setFormData({ name: '', triggerType: 'event', status: 'inactive', triggerEvent: '', actionType: 'send_email' });
    }
  }, [mode, automation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = {
        name: formData.name,
        triggerType: formData.triggerType as 'event' | 'time' | 'manual',
        status: formData.status as 'active' | 'inactive',
        triggerConfig: formData.triggerType === 'event' ? { event: formData.triggerEvent } : {},
        actions: [{ type: formData.actionType }],
      };
      if (mode === 'edit' && automation) {
        await dispatch(updateAutomation({ id: automation.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Automation updated successfully' }));
      } else {
        await dispatch(createAutomation(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Automation created successfully' }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save automation' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Automation' : 'New Automation'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Automation Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Trigger Type" options={TRIGGER_TYPE_OPTIONS} value={formData.triggerType} onChange={(val) => setFormData({ ...formData, triggerType: val })} />
          <Select label="Status" options={STATUS_OPTIONS} value={formData.status} onChange={(val) => setFormData({ ...formData, status: val })} />
        </div>
        {formData.triggerType === 'event' && (
          <Select label="Trigger Event" options={EVENT_OPTIONS} value={formData.triggerEvent} onChange={(val) => setFormData({ ...formData, triggerEvent: val })} />
        )}
        <Select label="Action Type" options={ACTION_TYPE_OPTIONS} value={formData.actionType} onChange={(val) => setFormData({ ...formData, actionType: val })} />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>{mode === 'edit' ? 'Update' : 'Create'} Automation</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AutomationModal;

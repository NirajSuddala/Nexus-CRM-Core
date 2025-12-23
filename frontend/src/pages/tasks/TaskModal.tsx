import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createTask, updateTask } from '../../features/tasksSlice';
import { addNotification } from '../../features/uiSlice';
import { contactsApi, dealsApi } from '../../services/api';
import { Modal, Button, Input, Select, Textarea } from '../../components/ui';
import { Task, TaskFormData, Contact, Deal } from '../../types';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['high', 'medium', 'low'], { required_error: 'Priority is required' }),
  status: z.enum(['open', 'in_progress', 'completed'], { required_error: 'Status is required' }),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
});

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view' | null;
  task?: Task | null;
}

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, mode, task }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.tasks);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium', status: 'open' },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactsRes, dealsRes] = await Promise.all([
          contactsApi.getAll({ limit: 100 }),
          dealsApi.getAll({ limit: 100 }),
        ]);
        setContacts(contactsRes.data.contacts);
        setDeals(dealsRes.data.deals);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (task && mode === 'edit') {
      reset({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate || '',
        priority: task.priority,
        status: task.status,
        contactId: task.contactId || '',
        dealId: task.dealId || '',
      });
    } else {
      // For create mode, check if contactId or dealId is pre-populated (e.g., from Contact/Deal detail page)
      reset({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        status: 'open',
        contactId: (task as any)?.contactId || '',
        dealId: (task as any)?.dealId || '',
      });
    }
  }, [task, mode, reset]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (mode === 'edit' && task) {
        await dispatch(updateTask({ id: task.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Task updated successfully' }));
      } else {
        await dispatch(createTask(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Task created successfully' }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'An error occurred' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Task' : 'Add Task'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Task Title *"
          {...register('title')}
          error={errors.title?.message}
          placeholder="Follow up with client"
        />

        <Textarea
          label="Description"
          {...register('description')}
          error={errors.description?.message}
          placeholder="Task details..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Due Date *"
            type="date"
            {...register('dueDate')}
            error={errors.dueDate?.message}
          />
          <Select
            label="Priority *"
            options={PRIORITY_OPTIONS}
            value={watch('priority') || 'medium'}
            onChange={(v) => setValue('priority', v as any)}
            error={errors.priority?.message}
          />
        </div>

        <Select
          label="Status *"
          options={STATUS_OPTIONS}
          value={watch('status') || 'open'}
          onChange={(v) => setValue('status', v as any)}
          error={errors.status?.message}
        />

        <Select
          label="Related Contact"
          options={[{ value: '', label: 'Select a contact...' }, ...contacts.map((c) => ({
            value: c.id,
            label: (c as any).firstName && (c as any).lastName
              ? `${(c as any).firstName} ${(c as any).lastName}`
              : c.fullName || c.email || 'Unknown'
          }))]}
          value={watch('contactId') || ''}
          onChange={(v) => setValue('contactId', v)}
          error={errors.contactId?.message}
        />

        <Select
          label="Related Deal"
          options={[{ value: '', label: 'Select a deal...' }, ...deals.map((d) => ({ value: d.id, label: d.name }))]}
          value={watch('dealId') || ''}
          onChange={(v) => setValue('dealId', v)}
          error={errors.dealId?.message}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{mode === 'edit' ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;

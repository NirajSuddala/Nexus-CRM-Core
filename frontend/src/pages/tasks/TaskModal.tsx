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
  name: z.string().min(1, 'Task name is required'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['high', 'medium', 'low'], { required_error: 'Priority is required' }),
  status: z.enum(['todo', 'in_progress', 'completed'], { required_error: 'Status is required' }),
  contactId: z.string().min(1, 'Contact is required'),
  dealId: z.string().min(1, 'Deal is required'),
});

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view' | null;
  task?: Task | null;
  initialData?: { contactId?: string; dealId?: string } | null;
}

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

// Format date to YYYY-MM-DD for HTML date input
const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, mode, task, initialData }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.tasks);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium', status: 'todo' },
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
        name: task.name,
        description: task.description || '',
        dueDate: formatDateForInput(task.dueDate),
        priority: task.priority,
        status: task.status,
        contactId: task.contactId || '',
        dealId: task.dealId || '',
      });
    } else {
      reset({
        name: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        status: 'todo',
        contactId: initialData?.contactId || '',
        dealId: initialData?.dealId || ''
      });
    }
  }, [task, mode, reset, initialData]);

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
          label="Task Name *"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Follow up with client"
        />

        <Textarea
          label="Description *"
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
          value={watch('status') || 'todo'}
          onChange={(v) => setValue('status', v as any)}
          error={errors.status?.message}
        />

        <Select
          label="Related Contact *"
          options={[{ value: '', label: 'Select a contact...' }, ...contacts.map((c) => ({ value: c.id, label: c.fullName }))]}
          value={watch('contactId') || ''}
          onChange={(v) => setValue('contactId', v)}
          error={errors.contactId?.message}
        />

        <Select
          label="Related Deal *"
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

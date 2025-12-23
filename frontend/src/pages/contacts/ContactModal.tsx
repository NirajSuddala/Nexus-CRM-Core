import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createContact, updateContact } from '../../features/contactsSlice';
import { addNotification } from '../../features/uiSlice';
import { companiesApi } from '../../services/api';
import { Modal, Button, Input, Select } from '../../components/ui';
import { Contact, ContactFormData, Company } from '../../types';

const contactSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().min(1, 'Phone is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  companyId: z.string().min(1, 'Company is required'),
  lifecycleStage: z.enum(['lead', 'mql', 'sql', 'customer']).optional(),
});

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view' | null;
  contact?: Contact | null;
}

const LIFECYCLE_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'mql', label: 'MQL' },
  { value: 'sql', label: 'SQL' },
  { value: 'customer', label: 'Customer' },
];

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, mode, contact }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.contacts);
  const [companies, setCompanies] = useState<Company[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      lifecycleStage: 'lead',
    },
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await companiesApi.getAll({ limit: 100 });
        setCompanies(response.data.companies);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (contact && mode === 'edit') {
      reset({
        fullName: contact.fullName,
        email: contact.email || '',
        phone: contact.phone || '',
        jobTitle: contact.jobTitle || '',
        companyId: contact.companyId || '',
        lifecycleStage: contact.lifecycleStage,
      });
    } else {
      reset({
        fullName: '',
        email: '',
        phone: '',
        jobTitle: '',
        companyId: '',
        lifecycleStage: 'lead',
      });
    }
  }, [contact, mode, reset]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (mode === 'edit' && contact) {
        await dispatch(updateContact({ id: contact.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Contact updated successfully' }));
      } else {
        await dispatch(createContact(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Contact created successfully' }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'An error occurred' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Contact' : 'Add Contact'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name *"
          {...register('fullName')}
          error={errors.fullName?.message}
          placeholder="John Doe"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email *"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="john@example.com"
          />

          <Input
            label="Phone *"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <Input
          label="Job Title *"
          {...register('jobTitle')}
          error={errors.jobTitle?.message}
          placeholder="Sales Manager"
        />

        <Select
          label="Company *"
          options={[
            { value: '', label: 'Select a company...' },
            ...companies.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={watch('companyId') || ''}
          onChange={(value) => setValue('companyId', value)}
          error={errors.companyId?.message}
        />

        <Select
          label="Lifecycle Stage"
          options={LIFECYCLE_OPTIONS}
          value={watch('lifecycleStage') || 'lead'}
          onChange={(value) => setValue('lifecycleStage', value as any)}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {mode === 'edit' ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ContactModal;

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createDeal, updateDeal } from '../../features/dealsSlice';
import { addNotification } from '../../features/uiSlice';
import { companiesApi, contactsApi } from '../../services/api';
import { Modal, Button, Input, Select } from '../../components/ui';
import { Deal, DealFormData, Company, Contact } from '../../types';

const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  amount: z.string().min(1, 'Amount is required').transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) throw new Error('Amount must be a positive number');
    return num;
  }),
  stage: z.enum(['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'], {
    required_error: 'Stage is required',
  }),
  closeDate: z.string().min(1, 'Close date is required'),
  probability: z.string().min(1, 'Probability is required').transform((val) => {
    const num = parseInt(val);
    if (isNaN(num) || num < 0 || num > 100) throw new Error('Probability must be between 0 and 100');
    return num;
  }),
  companyId: z.string().min(1, 'Company is required'),
  contactId: z.string().min(1, 'Contact is required'),
});

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view' | null;
  deal?: Deal | null;
}

const STAGE_OPTIONS = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
];

const DealModal: React.FC<DealModalProps> = ({ isOpen, onClose, mode, deal }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.deals);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      stage: 'discovery',
      probability: 0,
    },
  });

  const selectedCompanyId = watch('companyId');

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
    const fetchContacts = async () => {
      try {
        const params: any = { limit: 100 };
        if (selectedCompanyId) {
          params.companyId = selectedCompanyId;
        }
        const response = await contactsApi.getAll(params);
        setContacts(response.data.contacts);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      }
    };
    fetchContacts();
  }, [selectedCompanyId]);

  useEffect(() => {
    if (deal && mode === 'edit') {
      reset({
        name: deal.name,
        amount: deal.amount?.toString() || '',
        stage: deal.stage,
        closeDate: deal.closeDate || '',
        probability: deal.probability?.toString() || '',
        companyId: deal.companyId || '',
        contactId: deal.contactId || '',
      });
    } else {
      // For create mode, check if companyId is pre-populated (e.g., from Company detail page)
      reset({
        name: '',
        amount: '',
        stage: 'discovery',
        closeDate: '',
        probability: '',
        companyId: (deal as any)?.companyId || '',
        contactId: (deal as any)?.contactId || '',
      });
    }
  }, [deal, mode, reset]);

  const onSubmit = async (data: DealFormData) => {
    try {
      if (mode === 'edit' && deal) {
        await dispatch(updateDeal({ id: deal.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Deal updated successfully' }));
      } else {
        await dispatch(createDeal(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Deal created successfully' }));
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
      title={mode === 'edit' ? 'Edit Deal' : 'Add Deal'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Deal Name *"
          {...register('name')}
          error={errors.name?.message}
          placeholder="New opportunity with Acme"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount *"
            type="number"
            {...register('amount')}
            error={errors.amount?.message}
            placeholder="50000"
          />

          <Select
            label="Stage *"
            options={STAGE_OPTIONS}
            value={watch('stage') || 'discovery'}
            onChange={(value) => setValue('stage', value as any)}
            error={errors.stage?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Close Date *"
            type="date"
            {...register('closeDate')}
            error={errors.closeDate?.message}
          />

          <Input
            label="Probability (%) *"
            type="number"
            {...register('probability')}
            error={errors.probability?.message}
            placeholder="50"
          />
        </div>

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
          label="Contact *"
          options={[
            { value: '', label: 'Select a contact...' },
            ...contacts.map((c) => ({
              value: c.id,
              label: c.firstName && c.lastName
                ? `${c.firstName} ${c.lastName}`
                : c.fullName || c.email || 'Unknown'
            })),
          ]}
          value={watch('contactId') || ''}
          onChange={(value) => setValue('contactId', value)}
          error={errors.contactId?.message}
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

export default DealModal;

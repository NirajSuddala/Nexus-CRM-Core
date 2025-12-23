import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createCompany, updateCompany } from '../../features/companiesSlice';
import { closeModal, addNotification } from '../../features/uiSlice';
import { Modal, Button, Input } from '../../components/ui';
import { Company, CompanyFormData } from '../../types';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().min(1, 'Domain is required'),
  industry: z.string().min(1, 'Industry is required'),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  revenue: z.string().optional().transform((val) => (val ? parseFloat(val) : null)),
});

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view' | null;
  company?: Company | null;
}

const CompanyModal: React.FC<CompanyModalProps> = ({ isOpen, onClose, mode, company }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.companies);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    if (company && mode === 'edit') {
      reset({
        name: company.name,
        domain: company.domain || '',
        industry: company.industry || '',
        linkedinUrl: company.linkedinUrl || '',
        revenue: company.revenue || undefined,
      });
    } else {
      reset({
        name: '',
        domain: '',
        industry: '',
        linkedinUrl: '',
        revenue: undefined,
      });
    }
  }, [company, mode, reset]);

  const onSubmit = async (data: CompanyFormData) => {
    try {
      if (mode === 'edit' && company) {
        await dispatch(updateCompany({ id: company.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Company updated successfully' }));
      } else {
        await dispatch(createCompany(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Company created successfully' }));
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
      title={mode === 'edit' ? 'Edit Company' : 'Add Company'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Company Name *"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Acme Inc."
        />

        <Input
          label="Website *"
          {...register('domain')}
          error={errors.domain?.message}
          placeholder="https://example.com"
        />

        <Input
          label="Industry *"
          {...register('industry')}
          error={errors.industry?.message}
          placeholder="Technology, Healthcare, etc."
        />

        <Input
          label="LinkedIn URL"
          {...register('linkedinUrl')}
          error={errors.linkedinUrl?.message}
          placeholder="https://linkedin.com/company/..."
        />

        <Input
          label="Annual Revenue"
          type="number"
          {...register('revenue')}
          placeholder="1000000"
          helperText="Enter amount in USD"
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

export default CompanyModal;

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createCompany, updateCompany } from '../../features/companiesSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Button, Input, Select } from '../../components/ui';
import { Company, CompanyFormData } from '../../types';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().min(1, 'Website is required'),
  industry: z.string().min(1, 'Industry is required'),
  size: z.string().optional().nullable(),
  revenue: z.string().optional().transform((val) => val ? parseFloat(val) : null),
  linkedin: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lifecycleStage: z.string().optional().nullable(),
});

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view' | null;
  company?: Company | null;
}

const SIZE_OPTIONS = [
  { value: '', label: 'Select size...' },
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const LIFECYCLE_OPTIONS = [
  { value: '', label: 'Select stage...' },
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'customer', label: 'Customer' },
  { value: 'churned', label: 'Churned' },
];

const CompanyModal: React.FC<CompanyModalProps> = ({ isOpen, onClose, mode, company }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.companies);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    if (company && mode === 'edit') {
      reset({
        name: company.name,
        website: company.website || '',
        industry: company.industry || '',
        size: company.size || '',
        revenue: company.revenue?.toString() || '',
        linkedin: company.linkedin || '',
        phone: company.phone || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || '',
        lifecycleStage: company.lifecycleStage || '',
      });
    } else {
      reset({
        name: '',
        website: '',
        industry: '',
        size: '',
        revenue: '',
        linkedin: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        lifecycleStage: '',
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

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Website *"
            {...register('website')}
            error={errors.website?.message}
            placeholder="https://example.com"
          />

          <Input
            label="Industry *"
            {...register('industry')}
            error={errors.industry?.message}
            placeholder="Technology, Healthcare, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Company Size"
            options={SIZE_OPTIONS}
            value={watch('size') || ''}
            onChange={(value) => setValue('size', value)}
          />

          <Input
            label="Revenue"
            type="number"
            {...register('revenue')}
            placeholder="1000000"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="LinkedIn"
            {...register('linkedin')}
            placeholder="https://linkedin.com/company/acme"
          />

          <Input
            label="Phone"
            {...register('phone')}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <Input
          label="Address"
          {...register('address')}
          placeholder="123 Main Street"
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="City"
            {...register('city')}
            placeholder="San Francisco"
          />

          <Input
            label="State"
            {...register('state')}
            placeholder="CA"
          />

          <Input
            label="Country"
            {...register('country')}
            placeholder="USA"
          />
        </div>

        <Select
          label="Lifecycle Stage"
          options={LIFECYCLE_OPTIONS}
          value={watch('lifecycleStage') || ''}
          onChange={(value) => setValue('lifecycleStage', value)}
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

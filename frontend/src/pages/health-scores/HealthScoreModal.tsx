import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createHealthScore, updateHealthScore } from '../../features/healthScoresSlice';
import { fetchCompanies } from '../../features/companiesSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button } from '../../components/ui';

interface HealthScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | null;
  healthScore?: any;
}

const HealthScoreModal: React.FC<HealthScoreModalProps> = ({ isOpen, onClose, mode, healthScore }) => {
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.companies);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyId: '',
    score: 75,
    npsScore: '',
    csatScore: '',
    engagementScore: '',
    riskLevel: 'good',
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCompanies({ limit: 100 }));
    }
  }, [dispatch, isOpen]);

  useEffect(() => {
    if (mode === 'edit' && healthScore) {
      setFormData({
        companyId: healthScore.companyId || '',
        score: healthScore.score || 75,
        npsScore: healthScore.npsScore?.toString() || '',
        csatScore: healthScore.csatScore?.toString() || '',
        engagementScore: healthScore.engagementScore?.toString() || '',
        riskLevel: healthScore.riskLevel || 'good',
      });
    } else {
      setFormData({
        companyId: '',
        score: 75,
        npsScore: '',
        csatScore: '',
        engagementScore: '',
        riskLevel: 'good',
      });
    }
  }, [mode, healthScore]);

  const calculateRiskLevel = (score: number): string => {
    if (score < 40) return 'at_risk';
    if (score < 60) return 'caution';
    if (score < 80) return 'good';
    return 'excellent';
  };

  const handleScoreChange = (value: number) => {
    const newScore = Math.max(0, Math.min(100, value));
    setFormData({
      ...formData,
      score: newScore,
      riskLevel: calculateRiskLevel(newScore),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        companyId: formData.companyId || undefined,
        score: formData.score,
        npsScore: formData.npsScore ? parseFloat(formData.npsScore) : undefined,
        csatScore: formData.csatScore ? parseFloat(formData.csatScore) : undefined,
        engagementScore: formData.engagementScore ? parseFloat(formData.engagementScore) : undefined,
        riskLevel: formData.riskLevel as 'at_risk' | 'caution' | 'good' | 'excellent',
      };

      if (mode === 'edit' && healthScore) {
        await dispatch(updateHealthScore({ id: healthScore.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Health score updated successfully' }));
      } else {
        await dispatch(createHealthScore(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Health score created successfully' }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save health score' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const companyOptions = [
    { value: '', label: 'Select Company' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  const getScoreColor = (score: number) => {
    if (score < 40) return 'bg-red-500';
    if (score < 60) return 'bg-yellow-500';
    if (score < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Health Score' : 'New Health Score'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Company"
          options={companyOptions}
          value={formData.companyId}
          onChange={(val) => setFormData({ ...formData, companyId: val })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Overall Health Score: {formData.score}
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={formData.score}
              onChange={(e) => handleScoreChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-20">
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.score}
                onChange={(e) => handleScoreChange(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getScoreColor(formData.score)}`}
              style={{ width: `${formData.score}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Risk Level: <span className="font-medium capitalize">{formData.riskLevel.replace('_', ' ')}</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="NPS Score (0-10)"
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={formData.npsScore}
            onChange={(e) => setFormData({ ...formData, npsScore: e.target.value })}
            placeholder="Optional"
          />
          <Input
            label="CSAT Score (0-5)"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={formData.csatScore}
            onChange={(e) => setFormData({ ...formData, csatScore: e.target.value })}
            placeholder="Optional"
          />
          <Input
            label="Engagement (0-100)"
            type="number"
            min={0}
            max={100}
            value={formData.engagementScore}
            onChange={(e) => setFormData({ ...formData, engagementScore: e.target.value })}
            placeholder="Optional"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {mode === 'edit' ? 'Update' : 'Create'} Health Score
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default HealthScoreModal;

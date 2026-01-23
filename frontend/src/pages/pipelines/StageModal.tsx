import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createPipelineStage, updatePipelineStage } from '../../features/pipelinesSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Button, Textarea } from '../../components/ui';

interface Stage {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  color?: string;
}

interface StageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: string;
  stage?: Stage | null;
  nextSortOrder?: number;
  onSuccess?: () => void;
}

const STAGE_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#94a3b8', label: 'Slate' },
];

const StageModal: React.FC<StageModalProps> = ({ isOpen, onClose, pipelineId, stage, nextSortOrder = 0, onSuccess }) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    color: '#3b82f6',
  });

  const isEditMode = !!stage;

  useEffect(() => {
    if (stage) {
      setFormData({
        name: stage.name || '',
        description: stage.description || '',
        sortOrder: stage.sortOrder || 0,
        color: stage.color || '#3b82f6',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        sortOrder: nextSortOrder,
        color: '#3b82f6',
      });
    }
  }, [stage, nextSortOrder, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditMode && stage) {
        await dispatch(updatePipelineStage({
          pipelineId,
          stageId: stage.id,
          data: formData
        })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Stage updated successfully' }));
      } else {
        await dispatch(createPipelineStage({ pipelineId, data: formData })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Stage created successfully' }));
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save stage' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Stage' : 'New Stage'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Stage Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter stage name"
          required
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          placeholder="Optional description"
        />

        <Input
          label="Sort Order"
          type="number"
          value={formData.sortOrder.toString()}
          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          placeholder="0"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Stage Color
          </label>
          <div className="grid grid-cols-6 gap-2">
            {STAGE_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, color: color.value })}
                className={`w-full aspect-square rounded-lg border-2 transition-all ${
                  formData.color === color.value
                    ? 'border-slate-900 scale-110 shadow-lg'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Custom:</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-slate-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: formData.color }}
              />
              <span className="text-sm text-slate-600 font-mono">{formData.color}</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-4 bg-slate-50">
          <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
          <div
            className="flex items-center gap-3 p-3 bg-white rounded-lg border-l-4"
            style={{ borderLeftColor: formData.color }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: formData.color }}
            >
              {formData.sortOrder + 1}
            </div>
            <div>
              <p className="font-medium text-slate-900">{formData.name || 'Stage Name'}</p>
              {formData.description && (
                <p className="text-sm text-slate-500">{formData.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditMode ? 'Update' : 'Create'} Stage
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StageModal;

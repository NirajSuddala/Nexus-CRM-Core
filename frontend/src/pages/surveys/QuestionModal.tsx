import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '../../components/ui';

interface Question {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'yes_no';
  scale?: number;
  options?: string[];
}

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
  question?: Question | null;
  surveyType: 'nps' | 'csat' | 'ces' | 'custom';
}

const QUESTION_TYPE_OPTIONS = [
  { value: 'rating', label: 'Rating Scale' },
  { value: 'text', label: 'Text Response' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'yes_no', label: 'Yes/No' },
];

const SCALE_OPTIONS = [
  { value: '5', label: '1-5 Scale' },
  { value: '7', label: '1-7 Scale' },
  { value: '10', label: '1-10 Scale' },
];

const QuestionModal: React.FC<QuestionModalProps> = ({ isOpen, onClose, onSave, question, surveyType }) => {
  const [formData, setFormData] = useState({
    question: '',
    type: 'rating' as 'rating' | 'text' | 'multiple_choice' | 'yes_no',
    scale: 10,
    options: [''],
  });

  useEffect(() => {
    if (question) {
      setFormData({
        question: question.question || '',
        type: question.type || 'rating',
        scale: question.scale || 10,
        options: question.options || [''],
      });
    } else {
      // Set defaults based on survey type
      let defaultScale = 10;
      let defaultQuestion = '';

      switch (surveyType) {
        case 'nps':
          defaultScale = 10;
          defaultQuestion = 'How likely are you to recommend us to a friend or colleague?';
          break;
        case 'csat':
          defaultScale = 5;
          defaultQuestion = 'How satisfied are you with our service?';
          break;
        case 'ces':
          defaultScale = 7;
          defaultQuestion = 'How easy was it to get your issue resolved?';
          break;
        default:
          defaultScale = 10;
          defaultQuestion = '';
      }

      setFormData({
        question: defaultQuestion,
        type: 'rating',
        scale: defaultScale,
        options: [''],
      });
    }
  }, [question, surveyType, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newQuestion: Question = {
      id: question?.id || `q_${Date.now()}`,
      question: formData.question,
      type: formData.type,
    };

    if (formData.type === 'rating') {
      newQuestion.scale = formData.scale;
    }

    if (formData.type === 'multiple_choice') {
      newQuestion.options = formData.options.filter(opt => opt.trim() !== '');
    }

    onSave(newQuestion);
    onClose();
  };

  const handleAddOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length > 1) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={question ? 'Edit Question' : 'Add Question'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Question Text
          </label>
          <textarea
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            required
            placeholder="Enter your question..."
          />
        </div>

        <Select
          label="Question Type"
          options={QUESTION_TYPE_OPTIONS}
          value={formData.type}
          onChange={(val) => setFormData({ ...formData, type: val as 'rating' | 'text' | 'multiple_choice' | 'yes_no' })}
        />

        {formData.type === 'rating' && (
          <Select
            label="Rating Scale"
            options={SCALE_OPTIONS}
            value={formData.scale.toString()}
            onChange={(val) => setFormData({ ...formData, scale: parseInt(val) })}
          />
        )}

        {formData.type === 'multiple_choice' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Answer Options
            </label>
            {formData.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                {formData.options.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
            >
              + Add Option
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {question ? 'Update' : 'Add'} Question
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default QuestionModal;

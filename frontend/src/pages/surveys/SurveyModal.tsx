import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createSurvey, updateSurvey } from '../../features/surveysSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Input, Select, Button, Textarea } from '../../components/ui';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | null;
  survey?: any;
}

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'yes_no' | 'multiple_choice';
  required: boolean;
  scale?: number;
  options?: string[];
}

const TYPE_OPTIONS = [
  { value: 'nps', label: 'NPS (Net Promoter Score)' },
  { value: 'csat', label: 'CSAT (Customer Satisfaction)' },
  { value: 'ces', label: 'CES (Customer Effort Score)' },
  { value: 'custom', label: 'Custom Survey' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

const TRIGGER_OPTIONS = [
  { value: '', label: 'Manual Trigger' },
  { value: 'milestone_completed', label: 'After Milestone Completed' },
  { value: 'project_completed', label: 'After Project Completed' },
  { value: 'ticket_resolved', label: 'After Ticket Resolved' },
];

const QUESTION_TYPE_OPTIONS = [
  { value: 'text', label: 'Text Input' },
  { value: 'rating', label: 'Rating Scale' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
];

const RATING_SCALE_OPTIONS = [
  { value: '5', label: '1-5 Scale' },
  { value: '7', label: '1-7 Scale' },
  { value: '10', label: '1-10 Scale (NPS)' },
];

const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose, mode, survey }) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'nps',
    status: 'draft',
    triggerEvent: '',
    sendAfterDays: 0,
  });
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);

  useEffect(() => {
    if (mode === 'edit' && survey) {
      setFormData({
        name: survey.name || '',
        description: survey.description || '',
        type: survey.type || 'nps',
        status: survey.status || 'draft',
        triggerEvent: survey.triggerEvent || '',
        sendAfterDays: survey.sendAfterDays || 0,
      });
      setQuestions(survey.questions || []);
    } else {
      setFormData({ name: '', description: '', type: 'nps', status: 'draft', triggerEvent: '', sendAfterDays: 0 });
      setQuestions([]);
    }
    setActiveTab('details');
  }, [mode, survey, isOpen]);

  const generateId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: generateId(),
      text: '',
      type: 'text',
      required: true,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };

    // Handle type changes
    if (updates.type) {
      if (updates.type === 'rating') {
        newQuestions[index].scale = newQuestions[index].scale || 5;
        delete newQuestions[index].options;
      } else if (updates.type === 'multiple_choice') {
        newQuestions[index].options = newQuestions[index].options || ['Option 1', 'Option 2'];
        delete newQuestions[index].scale;
      } else {
        delete newQuestions[index].scale;
        delete newQuestions[index].options;
      }
    }

    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) {
      return;
    }
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    const options = newQuestions[questionIndex].options || [];
    newQuestions[questionIndex].options = [...options, `Option ${options.length + 1}`];
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options![optionIndex] = value;
      setQuestions(newQuestions);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options && newQuestions[questionIndex].options!.length > 2) {
      newQuestions[questionIndex].options = newQuestions[questionIndex].options!.filter((_, i) => i !== optionIndex);
      setQuestions(newQuestions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate questions
    const invalidQuestions = questions.filter(q => !q.text.trim());
    if (invalidQuestions.length > 0) {
      dispatch(addNotification({ type: 'error', title: 'Please fill in all question texts' }));
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        type: formData.type as 'nps' | 'csat' | 'ces' | 'custom',
        status: formData.status as 'draft' | 'active' | 'paused' | 'completed',
        questions: questions.length > 0 ? questions : getDefaultQuestions(formData.type),
      };
      if (mode === 'edit' && survey) {
        await dispatch(updateSurvey({ id: survey.id, data })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Survey updated successfully' }));
      } else {
        await dispatch(createSurvey(data)).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Survey created successfully' }));
      }
      onClose();
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save survey' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultQuestions = (type: string): SurveyQuestion[] => {
    switch (type) {
      case 'nps':
        return [{ id: generateId(), text: 'How likely are you to recommend us to a friend or colleague?', type: 'rating', scale: 10, required: true }];
      case 'csat':
        return [{ id: generateId(), text: 'How satisfied are you with our service?', type: 'rating', scale: 5, required: true }];
      case 'ces':
        return [{ id: generateId(), text: 'How easy was it to get your issue resolved?', type: 'rating', scale: 7, required: true }];
      default:
        return [];
    }
  };

  const renderQuestionEditor = (question: SurveyQuestion, index: number) => (
    <div key={question.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-2">
          <button
            type="button"
            onClick={() => moveQuestion(index, 'up')}
            disabled={index === 0}
            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <GripVertical className="w-4 h-4 text-slate-400" />
          <button
            type="button"
            onClick={() => moveQuestion(index, 'down')}
            disabled={index === questions.length - 1}
            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </span>
            <Input
              placeholder="Enter your question..."
              value={question.text}
              onChange={(e) => updateQuestion(index, { text: e.target.value })}
              className="flex-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Question Type"
              options={QUESTION_TYPE_OPTIONS}
              value={question.type}
              onChange={(val) => updateQuestion(index, { type: val as SurveyQuestion['type'] })}
            />

            {question.type === 'rating' && (
              <Select
                label="Rating Scale"
                options={RATING_SCALE_OPTIONS}
                value={String(question.scale || 5)}
                onChange={(val) => updateQuestion(index, { scale: parseInt(val) })}
              />
            )}
          </div>

          {question.type === 'multiple_choice' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Options</label>
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, optIndex, e.target.value)}
                    placeholder={`Option ${optIndex + 1}`}
                    className="flex-1"
                  />
                  {(question.options?.length || 0) > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index, optIndex)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOption(index)}
                leftIcon={<Plus className="w-3 h-3" />}
              >
                Add Option
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-slate-600">Required question</span>
            </label>

            <button
              type="button"
              onClick={() => removeQuestion(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Survey' : 'New Survey'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Survey Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Questions ({questions.length})
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="space-y-4">
            <Input
              label="Survey Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                options={TYPE_OPTIONS}
                value={formData.type}
                onChange={(val) => setFormData({ ...formData, type: val })}
              />
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Trigger Event"
                options={TRIGGER_OPTIONS}
                value={formData.triggerEvent}
                onChange={(val) => setFormData({ ...formData, triggerEvent: val })}
              />
              <Input
                label="Send After (days)"
                type="number"
                min={0}
                value={formData.sendAfterDays}
                onChange={(e) => setFormData({ ...formData, sendAfterDays: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                <p className="text-slate-500 mb-4">No questions added yet</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addQuestion}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add First Question
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {questions.map((question, index) => renderQuestionEditor(question, index))}
              </div>
            )}

            {questions.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={addQuestion}
                leftIcon={<Plus className="w-4 h-4" />}
                className="w-full"
              >
                Add Question
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            {questions.length === 0 && formData.type !== 'custom' && (
              <span>Default questions will be added based on survey type</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {mode === 'edit' ? 'Update' : 'Create'} Survey
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SurveyModal;

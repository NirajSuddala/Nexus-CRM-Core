import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createSurveyResponse } from '../../features/surveysSlice';
import { addNotification } from '../../features/uiSlice';
import { Modal, Button, Select } from '../../components/ui';

interface Question {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'yes_no';
  scale?: number;
  options?: string[];
}

interface SurveyResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId: string;
  surveyName: string;
  surveyType: 'nps' | 'csat' | 'ces' | 'custom';
  questions: Question[];
  onSuccess: () => void;
}

const SurveyResponseModal: React.FC<SurveyResponseModalProps> = ({
  isOpen,
  onClose,
  surveyId,
  surveyName,
  surveyType,
  questions,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.companies);
  const { contacts } = useAppSelector((state) => state.contacts);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setAnswers({});
      setCompanyId('');
      setContactId('');
    }
  }, [isOpen]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateScore = (): number | undefined => {
    // For NPS, CSAT, CES - the score is typically the first rating question
    const ratingQuestion = questions.find((q) => q.type === 'rating');
    if (ratingQuestion && answers[ratingQuestion.id] !== undefined) {
      return Number(answers[ratingQuestion.id]);
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const score = calculateScore();
      await dispatch(
        createSurveyResponse({
          surveyId,
          data: {
            answers,
            score,
            companyId: companyId || undefined,
            contactId: contactId || undefined,
            submittedAt: new Date().toISOString(),
          },
        })
      ).unwrap();

      dispatch(
        addNotification({
          type: 'success',
          title: 'Response submitted successfully',
        })
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      dispatch(
        addNotification({
          type: 'error',
          title: error || 'Failed to submit response',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = (question: Question) => {
    switch (question.type) {
      case 'rating':
        return (
          <RatingInput
            scale={question.scale || 10}
            value={answers[question.id]}
            onChange={(val) => handleAnswerChange(question.id, val)}
            surveyType={surveyType}
          />
        );

      case 'text':
        return (
          <textarea
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Enter your response..."
          />
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  answers[question.id] === option
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="text-primary-600"
                />
                <span className="text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="flex gap-4">
            <label
              className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                answers[question.id] === 'yes'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value="yes"
                checked={answers[question.id] === 'yes'}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="sr-only"
              />
              <span className="font-medium">Yes</span>
            </label>
            <label
              className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                answers[question.id] === 'no'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value="no"
                checked={answers[question.id] === 'no'}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="sr-only"
              />
              <span className="font-medium">No</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  const companyOptions = [
    { value: '', label: 'Select Company (Optional)' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  const contactOptions = [
    { value: '', label: 'Select Contact (Optional)' },
    ...contacts
      .filter((c) => !companyId || c.companyId === companyId)
      .map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` })),
  ];

  const isValid = questions.every((q) => {
    if (q.type === 'rating') {
      return answers[q.id] !== undefined;
    }
    return true; // Other types are optional
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Submit Response: ${surveyName}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Respondent Info */}
        <div className="p-4 bg-slate-50 rounded-lg space-y-4">
          <h3 className="text-sm font-medium text-slate-700">Respondent Information (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Company"
              options={companyOptions}
              value={companyId}
              onChange={(val) => {
                setCompanyId(val);
                setContactId('');
              }}
            />
            <Select
              label="Contact"
              options={contactOptions}
              value={contactId}
              onChange={setContactId}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 mb-3">{question.question}</p>
                  {renderQuestionInput(question)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No questions available in this survey
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!isValid || questions.length === 0}>
            Submit Response
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Rating Input Component
interface RatingInputProps {
  scale: number;
  value: number | undefined;
  onChange: (value: number) => void;
  surveyType: 'nps' | 'csat' | 'ces' | 'custom';
}

const RatingInput: React.FC<RatingInputProps> = ({ scale, value, onChange, surveyType }) => {
  const getScoreLabel = (score: number) => {
    if (surveyType === 'nps') {
      if (score >= 9) return 'Promoter';
      if (score >= 7) return 'Passive';
      return 'Detractor';
    }
    if (surveyType === 'csat') {
      if (score >= 4) return 'Satisfied';
      if (score >= 3) return 'Neutral';
      return 'Dissatisfied';
    }
    if (surveyType === 'ces') {
      if (score >= 5) return 'Low Effort';
      if (score >= 3) return 'Moderate';
      return 'High Effort';
    }
    return '';
  };

  const getScoreColor = (score: number) => {
    if (surveyType === 'nps') {
      if (score >= 9) return 'text-green-600 bg-green-50 border-green-500';
      if (score >= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-500';
      return 'text-red-600 bg-red-50 border-red-500';
    }
    if (score > scale * 0.6) return 'text-green-600 bg-green-50 border-green-500';
    if (score > scale * 0.3) return 'text-yellow-600 bg-yellow-50 border-yellow-500';
    return 'text-red-600 bg-red-50 border-red-500';
  };

  // For NPS (0-10 scale), show all numbers
  // For others, use appropriate scale
  const startValue = surveyType === 'nps' ? 0 : 1;
  const numbers = Array.from({ length: scale + (surveyType === 'nps' ? 1 : 0) }, (_, i) => startValue + i);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {numbers.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`w-10 h-10 rounded-lg border-2 font-medium transition-all ${
              value === num
                ? getScoreColor(num)
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      {value !== undefined && (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            surveyType === 'nps'
              ? value >= 9 ? 'text-green-600' : value >= 7 ? 'text-yellow-600' : 'text-red-600'
              : 'text-slate-600'
          }`}>
            {getScoreLabel(value)}
          </span>
          <span className="text-sm text-slate-400">
            ({value} / {surveyType === 'nps' ? 10 : scale})
          </span>
        </div>
      )}
      {surveyType === 'nps' && (
        <div className="flex justify-between text-xs text-slate-400 px-1">
          <span>Not at all likely</span>
          <span>Extremely likely</span>
        </div>
      )}
    </div>
  );
};

export default SurveyResponseModal;

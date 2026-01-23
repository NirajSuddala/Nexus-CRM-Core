import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createSurveyResponse, fetchSurveyResponses, fetchSurveyStats } from '../../features/surveysSlice';
import { addNotification, addPersistentNotification } from '../../features/uiSlice';
import { Button, Textarea, Select } from '../../components/ui';
import { Star, ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'yes_no' | 'multiple_choice' | 'nps';
  required: boolean;
  scale?: number;
  options?: string[];
}

interface Survey {
  id: string;
  name: string;
  type: string;
  questions: SurveyQuestion[];
}

interface SurveyResponseFormProps {
  survey: Survey;
  onComplete?: () => void;
  onCancel?: () => void;
  contactId?: string;
  companyId?: string;
}

const SurveyResponseForm: React.FC<SurveyResponseFormProps> = ({
  survey,
  onComplete,
  onCancel,
  contactId,
  companyId,
}) => {
  const dispatch = useAppDispatch();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const questions = survey.questions || [];
  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.id];
    return answer !== undefined && answer !== '' && answer !== null;
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateScore = (): number | null => {
    const ratingQuestions = questions.filter(q => q.type === 'rating' || q.type === 'nps');
    if (ratingQuestions.length === 0) return null;

    let totalScore = 0;
    let count = 0;

    ratingQuestions.forEach(q => {
      const answer = answers[q.id];
      if (typeof answer === 'number') {
        // Normalize to 0-10 scale
        const scale = q.scale || 10;
        totalScore += (answer / scale) * 10;
        count++;
      }
    });

    return count > 0 ? Math.round((totalScore / count) * 10) / 10 : null;
  };

  const handleSubmit = async () => {
    // Validate required questions
    const unansweredRequired = questions.filter(
      q => q.required && (answers[q.id] === undefined || answers[q.id] === '' || answers[q.id] === null)
    );

    if (unansweredRequired.length > 0) {
      dispatch(addNotification({
        type: 'error',
        title: `Please answer all required questions (${unansweredRequired.length} remaining)`
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      const score = calculateScore();

      await dispatch(createSurveyResponse({
        surveyId: survey.id,
        data: {
          answers,
          score,
          contactId,
          companyId,
          submittedAt: new Date().toISOString(),
        },
      })).unwrap();

      // Refresh responses and stats
      dispatch(fetchSurveyResponses({ surveyId: survey.id }));
      dispatch(fetchSurveyStats(survey.id));

      // Add persistent notification
      dispatch(addPersistentNotification({
        type: 'success',
        title: 'Survey Response Submitted',
        message: `Your response to "${survey.name}" has been recorded${score ? ` with a score of ${score}` : ''}`,
        link: `/surveys/${survey.id}`,
      }));

      dispatch(addNotification({ type: 'success', title: 'Survey submitted successfully!' }));
      setIsCompleted(true);

      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to submit survey' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingInput = (question: SurveyQuestion) => {
    const scale = question.scale || 10;
    const currentValue = answers[question.id];

    if (scale === 5) {
      // Star rating for 1-5 scale
      return (
        <div className="flex gap-2 justify-center py-4">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => updateAnswer(question.id, value)}
              className={`p-2 rounded-lg transition-all transform hover:scale-110 ${
                currentValue >= value
                  ? 'text-yellow-400'
                  : 'text-slate-300 hover:text-yellow-200'
              }`}
            >
              <Star className="w-10 h-10" fill={currentValue >= value ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
      );
    }

    // Number scale for other ratings (7, 10)
    const colors = scale === 10
      ? ['bg-red-500', 'bg-red-400', 'bg-orange-500', 'bg-orange-400', 'bg-yellow-500', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400', 'bg-green-500', 'bg-green-600']
      : ['bg-red-500', 'bg-orange-400', 'bg-yellow-500', 'bg-lime-400', 'bg-green-400', 'bg-green-500', 'bg-green-600'];

    return (
      <div className="py-4">
        <div className="flex justify-between text-sm text-slate-500 mb-2 px-1">
          <span>{scale === 10 ? 'Not at all likely' : 'Strongly disagree'}</span>
          <span>{scale === 10 ? 'Extremely likely' : 'Strongly agree'}</span>
        </div>
        <div className="flex gap-1 justify-center">
          {Array.from({ length: scale }, (_, i) => i + 1).map((value, idx) => (
            <button
              key={value}
              type="button"
              onClick={() => updateAnswer(question.id, value)}
              className={`w-10 h-10 rounded-lg font-semibold transition-all transform hover:scale-110 ${
                currentValue === value
                  ? `${colors[idx] || 'bg-primary-500'} text-white shadow-lg`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderYesNoInput = (question: SurveyQuestion) => {
    const currentValue = answers[question.id];

    return (
      <div className="flex gap-4 justify-center py-6">
        <button
          type="button"
          onClick={() => updateAnswer(question.id, true)}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
            currentValue === true
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-600'
          }`}
        >
          <ThumbsUp className="w-6 h-6" />
          Yes
        </button>
        <button
          type="button"
          onClick={() => updateAnswer(question.id, false)}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
            currentValue === false
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <ThumbsDown className="w-6 h-6" />
          No
        </button>
      </div>
    );
  };

  const renderMultipleChoiceInput = (question: SurveyQuestion) => {
    const currentValue = answers[question.id];
    const options = question.options || [];

    return (
      <div className="space-y-2 py-4">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => updateAnswer(question.id, option)}
            className={`w-full p-4 rounded-lg text-left font-medium transition-all ${
              currentValue === option
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                currentValue === option
                  ? 'border-white bg-white'
                  : 'border-slate-400'
              }`}>
                {currentValue === option && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                )}
              </div>
              {option}
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderTextInput = (question: SurveyQuestion) => {
    return (
      <div className="py-4">
        <Textarea
          value={answers[question.id] || ''}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          placeholder="Type your answer here..."
          rows={4}
          className="text-lg"
        />
      </div>
    );
  };

  const renderQuestionInput = (question: SurveyQuestion) => {
    switch (question.type) {
      case 'rating':
      case 'nps':
        return renderRatingInput(question);
      case 'yes_no':
        return renderYesNoInput(question);
      case 'multiple_choice':
        return renderMultipleChoiceInput(question);
      case 'text':
      default:
        return renderTextInput(question);
    }
  };

  if (isCompleted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
        <p className="text-slate-500 mb-6">Your response has been submitted successfully.</p>
        {calculateScore() && (
          <p className="text-lg text-slate-700">
            Your score: <span className="font-bold text-primary-600">{calculateScore()}</span>/10
          </p>
        )}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">This survey has no questions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="bg-slate-50 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold">
              {currentStep + 1}
            </span>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900">
                {currentQuestion.text}
                {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {currentQuestion.type === 'rating' && `Rate from 1 to ${currentQuestion.scale || 10}`}
                {currentQuestion.type === 'yes_no' && 'Select Yes or No'}
                {currentQuestion.type === 'multiple_choice' && 'Select one option'}
                {currentQuestion.type === 'text' && 'Enter your response'}
              </p>
            </div>
          </div>

          {renderQuestionInput(currentQuestion)}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          {onCancel && currentStep === 0 && (
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          isLoading={isSubmitting}
        >
          {isLastQuestion ? 'Submit Survey' : 'Next Question'}
        </Button>
      </div>

      {/* Quick Navigation Dots */}
      <div className="flex justify-center gap-2 pt-2">
        {questions.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentStep(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentStep
                ? 'bg-primary-500 w-6'
                : answers[questions[index].id] !== undefined
                ? 'bg-green-400'
                : 'bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default SurveyResponseForm;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ClipboardList, Edit, Trash2, Play, Pause, Users, BarChart3, MessageSquare, Plus, Pencil, X, Send
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchSurvey, deleteSurvey, clearCurrentSurvey, updateSurvey, fetchSurveyResponses, fetchSurveyStats } from '../../features/surveysSlice';
import { fetchCompanies } from '../../features/companiesSlice';
import { fetchContacts } from '../../features/contactsSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import {
  Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal
} from '../../components/ui';
import SurveyModal from './SurveyModal';
import QuestionModal from './QuestionModal';
import SurveyResponseModal from './SurveyResponseModal';
import ActivityFeed from '../../components/activity/ActivityFeed';

const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (status) {
    case 'draft': return 'default';
    case 'active': return 'success';
    case 'paused': return 'warning';
    case 'completed': return 'info';
    default: return 'default';
  }
};

const getTypeBadgeVariant = (type: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (type) {
    case 'nps': return 'purple';
    case 'csat': return 'success';
    case 'ces': return 'warning';
    case 'custom': return 'default';
    default: return 'default';
  }
};

interface Question {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'yes_no';
  scale?: number;
  options?: string[];
}

const SurveyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentSurvey, responses, stats, isLoading } = useAppSelector((state) => state.surveys);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showDeleteQuestionModal, setShowDeleteQuestionModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<any | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchSurvey(id));
      dispatch(fetchSurveyResponses({ surveyId: id }));
      dispatch(fetchSurveyStats(id));
    }
    // Fetch companies and contacts for response modal
    dispatch(fetchCompanies({ limit: 100 }));
    dispatch(fetchContacts({ limit: 100 }));
    return () => {
      dispatch(clearCurrentSurvey());
    };
  }, [dispatch, id]);

  const handleResponseSuccess = () => {
    if (id) {
      dispatch(fetchSurveyResponses({ surveyId: id }));
      dispatch(fetchSurveyStats(id));
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteSurvey(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Survey deleted successfully' }));
      navigate('/surveys');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete survey' }));
    }
    setShowDeleteModal(false);
  };

  const handleStatusChange = async (newStatus: 'active' | 'paused') => {
    if (!id || !currentSurvey) return;
    try {
      await dispatch(updateSurvey({
        id,
        data: { status: newStatus }
      })).unwrap();
      dispatch(addNotification({ type: 'success', title: `Survey ${newStatus === 'active' ? 'activated' : 'paused'} successfully` }));
      dispatch(fetchSurvey(id));
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to update survey status' }));
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteQuestionModal(true);
  };

  const handleSaveQuestion = async (question: Question) => {
    if (!id || !currentSurvey) return;

    let updatedQuestions: Question[];

    if (editingQuestion) {
      // Update existing question
      updatedQuestions = currentSurvey.questions.map((q: Question) =>
        q.id === question.id ? question : q
      );
    } else {
      // Add new question
      updatedQuestions = [...(currentSurvey.questions || []), question];
    }

    try {
      await dispatch(updateSurvey({
        id,
        data: { questions: updatedQuestions }
      })).unwrap();
      dispatch(addNotification({ type: 'success', title: editingQuestion ? 'Question updated successfully' : 'Question added successfully' }));
      dispatch(fetchSurvey(id));
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save question' }));
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!id || !currentSurvey || !questionToDelete) return;

    const updatedQuestions = currentSurvey.questions.filter((q: Question) => q.id !== questionToDelete.id);

    try {
      await dispatch(updateSurvey({
        id,
        data: { questions: updatedQuestions }
      })).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Question deleted successfully' }));
      dispatch(fetchSurvey(id));
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete question' }));
    }
    setShowDeleteQuestionModal(false);
    setQuestionToDelete(null);
  };

  if (isLoading || !currentSurvey) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/surveys')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentSurvey.name}</h1>
                <Badge variant={getStatusBadgeVariant(currentSurvey.status)}>
                  {currentSurvey.status}
                </Badge>
                <Badge variant={getTypeBadgeVariant(currentSurvey.type)}>
                  {currentSurvey.type.toUpperCase()}
                </Badge>
              </div>
              {currentSurvey.description && (
                <p className="text-slate-500">{currentSurvey.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(currentSurvey.status === 'active' || currentSurvey.status === 'draft') && currentSurvey.questions?.length > 0 && (
            <Button leftIcon={<Send className="w-4 h-4" />}
              onClick={() => setShowResponseModal(true)}>
              Submit Response
            </Button>
          )}
          {currentSurvey.status === 'draft' || currentSurvey.status === 'paused' ? (
            <Button variant="outline" leftIcon={<Play className="w-4 h-4" />}
              onClick={() => handleStatusChange('active')}>
              Activate
            </Button>
          ) : currentSurvey.status === 'active' ? (
            <Button variant="outline" leftIcon={<Pause className="w-4 h-4" />}
              onClick={() => handleStatusChange('paused')}>
              Pause
            </Button>
          ) : null}
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'survey', mode: 'edit', data: currentSurvey }))}>
            Edit
          </Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.totalResponses || 0}</p>
                <p className="text-sm text-slate-500">Total Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.averageScore?.toFixed(1) || '-'}</p>
                <p className="text-sm text-slate-500">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {currentSurvey.type === 'nps' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.npsScore ?? '-'}</p>
                  <p className="text-sm text-slate-500">NPS Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{currentSurvey.questions?.length || 0}</p>
                <p className="text-sm text-slate-500">Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Survey Details */}
          <Card>
            <CardHeader><CardTitle>Survey Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">Type</dt>
                  <dd className="mt-1">
                    <Badge variant={getTypeBadgeVariant(currentSurvey.type)}>
                      {currentSurvey.type.toUpperCase()}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={getStatusBadgeVariant(currentSurvey.status)}>
                      {currentSurvey.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Trigger Event</dt>
                  <dd className="mt-1 text-slate-900">
                    {currentSurvey.triggerEvent ? currentSurvey.triggerEvent.replace(/_/g, ' ') : 'Manual'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Send After</dt>
                  <dd className="mt-1 text-slate-900">
                    {currentSurvey.sendAfterDays ? `${currentSurvey.sendAfterDays} days` : 'Immediately'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="mt-1 text-slate-900">{format(new Date(currentSurvey.createdAt), 'MMM d, yyyy')}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Last Updated</dt>
                  <dd className="mt-1 text-slate-900">{format(new Date(currentSurvey.updatedAt), 'MMM d, yyyy')}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Questions ({currentSurvey.questions?.length || 0})
              </CardTitle>
              <Button
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleAddQuestion}
              >
                Add Question
              </Button>
            </CardHeader>
            <CardContent>
              {!currentSurvey.questions || currentSurvey.questions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">No questions defined yet</p>
                  <Button
                    variant="outline"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleAddQuestion}
                  >
                    Add Your First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentSurvey.questions.map((question: any, index: number) => (
                    <div key={question.id || index} className="p-4 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{question.question}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="default">{question.type}</Badge>
                            {question.scale && (
                              <span className="text-sm text-slate-500">Scale: 1-{question.scale}</span>
                            )}
                            {question.options && question.options.length > 0 && (
                              <span className="text-sm text-slate-500">{question.options.length} options</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white rounded"
                            title="Edit question"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded"
                            title="Delete question"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Responses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Responses ({responses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No responses yet</p>
                  <p className="text-sm text-slate-400 mt-1">Responses will appear here once submitted</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {responses.slice(0, 10).map((response) => (
                    <div
                      key={response.id}
                      className={`p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors ${selectedResponse?.id === response.id ? 'ring-2 ring-primary-500' : ''}`}
                      onClick={() => setSelectedResponse(selectedResponse?.id === response.id ? null : response)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {response.contact?.fullName || response.contact?.firstName
                              ? `${response.contact.firstName} ${response.contact.lastName}`
                              : response.company?.name || 'Anonymous'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {format(new Date(response.submittedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        {response.score !== undefined && (
                          <div className="text-right">
                            <span className={`text-2xl font-bold ${
                              currentSurvey.type === 'nps'
                                ? response.score >= 9 ? 'text-green-600' : response.score >= 7 ? 'text-yellow-600' : 'text-red-600'
                                : 'text-primary-600'
                            }`}>
                              {response.score}
                            </span>
                            <p className="text-xs text-slate-500">
                              {currentSurvey.type === 'nps'
                                ? response.score >= 9 ? 'Promoter' : response.score >= 7 ? 'Passive' : 'Detractor'
                                : `out of ${currentSurvey.questions?.[0]?.scale || 10}`}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Expanded Response Details */}
                      {selectedResponse?.id === response.id && response.answers && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <h4 className="text-sm font-medium text-slate-700 mb-3">Response Details</h4>
                          <div className="space-y-3">
                            {Object.entries(response.answers).map(([questionId, answer]: [string, any]) => {
                              const question = currentSurvey.questions?.find((q: any) => q.id === questionId);
                              return (
                                <div key={questionId} className="bg-white p-3 rounded border border-slate-200">
                                  <p className="text-sm text-slate-600 mb-1">
                                    {question?.question || `Question ${questionId}`}
                                  </p>
                                  <p className="font-medium text-slate-900">
                                    {typeof answer === 'object' ? JSON.stringify(answer) : answer}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                          {response.contact && (
                            <div className="mt-4 pt-3 border-t border-slate-200">
                              <p className="text-xs text-slate-500">
                                Contact: {response.contact.email || 'N/A'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {responses.length > 10 && (
                    <p className="text-center text-sm text-slate-500 py-2">
                      Showing 10 of {responses.length} responses
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <ActivityFeed entityType="survey" entityId={currentSurvey.id} />
        </div>
      </div>

      {/* Modals */}
      <SurveyModal
        isOpen={modal.type === 'survey'}
        onClose={() => {
          dispatch(openModal({ type: null, mode: null }));
          if (id) dispatch(fetchSurvey(id));
        }}
        mode={modal.mode === 'view' ? 'edit' : modal.mode}
        survey={modal.data}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Survey"
        message={`Are you sure you want to delete "${currentSurvey.name}"? This will also delete all responses. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showDeleteQuestionModal}
        onClose={() => {
          setShowDeleteQuestionModal(false);
          setQuestionToDelete(null);
        }}
        onConfirm={confirmDeleteQuestion}
        title="Delete Question"
        message={`Are you sure you want to delete this question? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      <QuestionModal
        isOpen={showQuestionModal}
        onClose={() => {
          setShowQuestionModal(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        question={editingQuestion}
        surveyType={currentSurvey.type}
      />

      <SurveyResponseModal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        surveyId={currentSurvey.id}
        surveyName={currentSurvey.name}
        surveyType={currentSurvey.type}
        questions={currentSurvey.questions || []}
        onSuccess={handleResponseSuccess}
      />
    </div>
  );
};

export default SurveyDetail;

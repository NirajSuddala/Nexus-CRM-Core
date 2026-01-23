import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Calendar, Edit, Trash2, MessageSquare, BarChart3, Play, Star, ToggleLeft, ListChecks, FileText } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchSurvey, deleteSurvey, clearCurrentSurvey, fetchSurveyResponses, fetchSurveyStats } from '../../features/surveysSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal, Modal } from '../../components/ui';
import SurveyModal from './SurveyModal';
import SurveyResponseForm from './SurveyResponseForm';

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

const getQuestionTypeIcon = (type: string) => {
  switch (type) {
    case 'rating':
    case 'nps':
      return <Star className="w-4 h-4 text-yellow-500" />;
    case 'yes_no':
      return <ToggleLeft className="w-4 h-4 text-blue-500" />;
    case 'multiple_choice':
      return <ListChecks className="w-4 h-4 text-purple-500" />;
    case 'text':
    default:
      return <FileText className="w-4 h-4 text-slate-500" />;
  }
};

const getQuestionTypeLabel = (type: string, scale?: number) => {
  switch (type) {
    case 'rating':
    case 'nps':
      return `Rating (1-${scale || 10})`;
    case 'yes_no':
      return 'Yes / No';
    case 'multiple_choice':
      return 'Multiple Choice';
    case 'text':
    default:
      return 'Text Input';
  }
};

const formatAnswer = (answer: any, question: any) => {
  if (answer === undefined || answer === null) return '-';
  if (question?.type === 'yes_no') return answer ? 'Yes' : 'No';
  if (question?.type === 'rating' || question?.type === 'nps') {
    const scale = question.scale || 10;
    return `${answer}/${scale}`;
  }
  return String(answer);
};

const SurveyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentSurvey, responses, stats, isLoading } = useAppSelector((state) => state.surveys);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTakeSurveyModal, setShowTakeSurveyModal] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchSurvey(id));
      dispatch(fetchSurveyResponses({ surveyId: id }));
      dispatch(fetchSurveyStats(id));
    }
    return () => { dispatch(clearCurrentSurvey()); };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteSurvey(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Survey deleted' }));
      navigate('/surveys');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete' }));
    }
    setShowDeleteModal(false);
  };

  const handleSurveyComplete = () => {
    setShowTakeSurveyModal(false);
    // Refresh the data
    if (id) {
      dispatch(fetchSurveyResponses({ surveyId: id }));
      dispatch(fetchSurveyStats(id));
    }
  };

  if (isLoading || !currentSurvey) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/surveys')} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><ClipboardList className="w-6 h-6 text-purple-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentSurvey.name}</h1>
                <Badge variant={getStatusBadgeVariant(currentSurvey.status)}>{currentSurvey.status}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getTypeBadgeVariant(currentSurvey.type)}>{currentSurvey.type.toUpperCase()}</Badge>
                <span className="text-sm text-slate-500">{currentSurvey.questions?.length || 0} questions</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentSurvey.status === 'active' && (
            <Button
              variant="primary"
              leftIcon={<Play className="w-4 h-4" />}
              onClick={() => setShowTakeSurveyModal(true)}
            >
              Take Survey
            </Button>
          )}
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'survey', mode: 'edit', data: currentSurvey }))}>Edit</Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>Delete</Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><MessageSquare className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="text-sm text-slate-500">Total Responses</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalResponses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><BarChart3 className="w-5 h-5 text-green-600" /></div>
                <div>
                  <p className="text-sm text-slate-500">Average Score</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.averageScore?.toFixed(1) || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {currentSurvey.type === 'nps' && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg"><ClipboardList className="w-5 h-5 text-purple-600" /></div>
                  <div>
                    <p className="text-sm text-slate-500">NPS Score</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.npsScore !== undefined ? stats.npsScore : '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Survey Information */}
          <Card>
            <CardHeader><CardTitle>Survey Information</CardTitle></CardHeader>
            <CardContent>
              {currentSurvey.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Description</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{currentSurvey.description}</p>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">Trigger Event</dt>
                  <dd className="mt-1 font-medium">{currentSurvey.triggerEvent?.replace(/_/g, ' ') || 'Manual'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Send After</dt>
                  <dd className="mt-1 font-medium">{currentSurvey.sendAfterDays ? `${currentSurvey.sendAfterDays} days` : 'Immediately'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(currentSurvey.createdAt), 'MMM d, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Last Updated</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(currentSurvey.updatedAt), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Questions ({currentSurvey.questions?.length || 0})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(openModal({ type: 'survey', mode: 'edit', data: currentSurvey }))}
                >
                  Edit Questions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!currentSurvey.questions || currentSurvey.questions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                  <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-3">No questions defined yet</p>
                  <Button
                    variant="outline"
                    onClick={() => dispatch(openModal({ type: 'survey', mode: 'edit', data: currentSurvey }))}
                  >
                    Add Questions
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentSurvey.questions.map((question: any, index: number) => (
                    <div key={question.id || index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {question.text || question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                              {getQuestionTypeIcon(question.type)}
                              <span>{getQuestionTypeLabel(question.type, question.scale)}</span>
                            </div>
                            {question.required && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Required</span>
                            )}
                          </div>
                          {question.type === 'multiple_choice' && question.options && (
                            <div className="mt-3 space-y-1">
                              {question.options.map((option: string, optIdx: number) => (
                                <div key={optIdx} className="flex items-center gap-2 text-sm text-slate-600">
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}
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
              <div className="flex items-center justify-between">
                <CardTitle>Recent Responses ({responses.length})</CardTitle>
                {responses.length > 5 && (
                  <Button variant="ghost" size="sm">View All</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-3">No responses yet</p>
                  {currentSurvey.status === 'active' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowTakeSurveyModal(true)}
                    >
                      Submit First Response
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {responses.slice(0, 5).map((response: any) => (
                    <div key={response.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {response.contact ? (
                              <p className="font-medium text-slate-900">{response.contact.firstName} {response.contact.lastName}</p>
                            ) : response.company ? (
                              <p className="font-medium text-slate-900">{response.company.name}</p>
                            ) : (
                              <p className="font-medium text-slate-500">Anonymous Response</p>
                            )}
                            {response.score !== undefined && response.score !== null && (
                              <Badge variant={response.score >= 8 ? 'success' : response.score >= 5 ? 'warning' : 'danger'}>
                                Score: {response.score}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {formatDistanceToNow(new Date(response.submittedAt), { addSuffix: true })}
                          </p>

                          {/* Show answers preview */}
                          {response.responses && Object.keys(response.responses).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                              {currentSurvey.questions?.slice(0, 2).map((question: any, idx: number) => {
                                const answer = response.responses[question.id];
                                if (answer === undefined) return null;
                                return (
                                  <div key={idx} className="text-sm">
                                    <span className="text-slate-500">{question.text?.substring(0, 40)}...</span>
                                    <span className="ml-2 font-medium text-slate-700">
                                      {formatAnswer(answer, question)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {response.score !== undefined && response.score !== null && (
                          <div className="flex-shrink-0 text-center">
                            <div className={`text-3xl font-bold ${
                              response.score >= 8 ? 'text-green-500' :
                              response.score >= 5 ? 'text-amber-500' : 'text-red-500'
                            }`}>
                              {response.score}
                            </div>
                            <p className="text-xs text-slate-500">/10</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {currentSurvey.status === 'active' && (
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  leftIcon={<Play className="w-4 h-4" />}
                  onClick={() => setShowTakeSurveyModal(true)}
                >
                  Take Survey
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Survey Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <Badge variant={getStatusBadgeVariant(currentSurvey.status)}>{currentSurvey.status}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Type</span>
                <Badge variant={getTypeBadgeVariant(currentSurvey.type)}>{currentSurvey.type.toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Questions</span>
                <span className="font-semibold">{currentSurvey.questions?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Responses</span>
                <span className="font-semibold">{stats?.totalResponses || 0}</span>
              </div>
              {stats?.averageScore !== undefined && stats.averageScore !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Avg. Score</span>
                  <span className="font-semibold">{stats.averageScore.toFixed(1)}/10</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Question Type Breakdown */}
          {currentSurvey.questions && currentSurvey.questions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Question Types</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {['rating', 'text', 'yes_no', 'multiple_choice'].map(type => {
                  const count = currentSurvey.questions.filter((q: any) => q.type === type || (type === 'rating' && q.type === 'nps')).length;
                  if (count === 0) return null;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getQuestionTypeIcon(type)}
                        <span className="text-sm text-slate-600">{getQuestionTypeLabel(type)}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {currentSurvey.creator && (
            <Card>
              <CardHeader><CardTitle>Created By</CardTitle></CardHeader>
              <CardContent>
                <p className="font-medium text-slate-900">{currentSurvey.creator.firstName} {currentSurvey.creator.lastName}</p>
                <p className="text-sm text-slate-500">{format(new Date(currentSurvey.createdAt), 'MMM d, yyyy')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Take Survey Modal */}
      <Modal
        isOpen={showTakeSurveyModal}
        onClose={() => setShowTakeSurveyModal(false)}
        title={`Take Survey: ${currentSurvey.name}`}
        size="lg"
      >
        <SurveyResponseForm
          survey={currentSurvey}
          onComplete={handleSurveyComplete}
          onCancel={() => setShowTakeSurveyModal(false)}
        />
      </Modal>

      <SurveyModal isOpen={modal.type === 'survey'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode} survey={modal.data} />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete}
        title="Delete Survey" message={`Are you sure you want to delete "${currentSurvey.name}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default SurveyDetail;

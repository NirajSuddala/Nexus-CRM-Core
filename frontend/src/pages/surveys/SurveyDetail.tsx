import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Calendar, Edit, Trash2, MessageSquare, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchSurvey, deleteSurvey, clearCurrentSurvey, fetchSurveyResponses, fetchSurveyStats } from '../../features/surveysSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal } from '../../components/ui';
import SurveyModal from './SurveyModal';

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

const SurveyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentSurvey, responses, stats, isLoading } = useAppSelector((state) => state.surveys);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
            <CardHeader><CardTitle>Questions ({currentSurvey.questions?.length || 0})</CardTitle></CardHeader>
            <CardContent>
              {!currentSurvey.questions || currentSurvey.questions.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No questions defined</p>
              ) : (
                <div className="space-y-3">
                  {currentSurvey.questions.map((question: any, index: number) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{question.text || question.question}</p>
                          {question.type && (
                            <p className="text-sm text-slate-500 mt-1">Type: {question.type}</p>
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
            <CardHeader><CardTitle>Recent Responses</CardTitle></CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No responses yet</p>
              ) : (
                <div className="space-y-3">
                  {responses.slice(0, 5).map((response: any) => (
                    <div key={response.id} className="p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          {response.contact ? (
                            <p className="font-medium text-slate-900">{response.contact.firstName} {response.contact.lastName}</p>
                          ) : response.company ? (
                            <p className="font-medium text-slate-900">{response.company.name}</p>
                          ) : (
                            <p className="font-medium text-slate-500">Anonymous</p>
                          )}
                          <p className="text-sm text-slate-500">{format(new Date(response.submittedAt), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                        {response.score !== undefined && (
                          <div className="text-2xl font-bold text-primary-600">{response.score}</div>
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
            </CardContent>
          </Card>

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

      <SurveyModal isOpen={modal.type === 'survey'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode} survey={modal.data} />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete}
        title="Delete Survey" message={`Are you sure you want to delete "${currentSurvey.name}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default SurveyDetail;

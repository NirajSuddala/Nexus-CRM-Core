import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Edit, Trash2, Clock, ArrowRight, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchEmailSequence, deleteEmailSequence, clearCurrentSequence } from '../../features/emailSequencesSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal } from '../../components/ui';
import EmailSequenceModal from './EmailSequenceModal';

const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (status) {
    case 'draft': return 'default';
    case 'active': return 'success';
    case 'paused': return 'warning';
    default: return 'default';
  }
};

const EmailSequenceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentSequence, isLoading } = useAppSelector((state) => state.emailSequences);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchEmailSequence(id));
    return () => { dispatch(clearCurrentSequence()); };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteEmailSequence(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Email sequence deleted' }));
      navigate('/email-sequences');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete' }));
    }
    setShowDeleteModal(false);
  };

  if (isLoading || !currentSequence) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  const totalDelay = currentSequence.steps?.reduce((acc: number, step: any) => {
    return acc + (step.delayDays || 0) * 24 + (step.delayHours || 0);
  }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/email-sequences')} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center"><Mail className="w-6 h-6 text-indigo-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentSequence.name}</h1>
                <Badge variant={getStatusBadgeVariant(currentSequence.status)}>{currentSequence.status}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-500">{currentSequence.steps?.length || 0} steps</span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-slate-500">
                  {totalDelay > 0 ? `${Math.floor(totalDelay / 24)}d ${totalDelay % 24}h total duration` : 'No delays'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'emailSequence', mode: 'edit', data: currentSequence }))}>Edit</Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Sequence Information */}
          <Card>
            <CardHeader><CardTitle>Sequence Information</CardTitle></CardHeader>
            <CardContent>
              {currentSequence.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Description</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{currentSequence.description}</p>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">Trigger</dt>
                  <dd className="mt-1 flex items-center gap-1 font-medium">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    {currentSequence.trigger?.replace(/_/g, ' ') || 'Manual'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="mt-1"><Badge variant={getStatusBadgeVariant(currentSequence.status)}>{currentSequence.status}</Badge></dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(currentSequence.createdAt), 'MMM d, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Last Updated</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(currentSequence.updatedAt), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Sequence Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />Sequence Steps ({currentSequence.steps?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {!currentSequence.steps || currentSequence.steps.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No steps defined</p>
              ) : (
                <div className="space-y-4">
                  {currentSequence.steps.map((step: any, index: number) => (
                    <div key={step.id} className="relative">
                      {index < (currentSequence.steps?.length || 0) - 1 && (
                        <div className="absolute left-6 top-14 bottom-0 w-px bg-slate-200" style={{ height: 'calc(100% + 1rem)' }}></div>
                      )}
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-slate-900">{step.name}</h4>
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <Clock className="w-4 h-4" />
                              {step.delayDays > 0 && `${step.delayDays}d `}
                              {step.delayHours > 0 && `${step.delayHours}h`}
                              {!step.delayDays && !step.delayHours && 'Immediate'}
                            </div>
                          </div>
                          {step.template && (
                            <div className="mt-2 p-3 bg-white rounded border border-slate-200">
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <span className="font-medium">{step.template.name}</span>
                              </div>
                              {step.template.subjectTemplate && (
                                <p className="text-sm text-slate-600 mt-1">Subject: {step.template.subjectTemplate}</p>
                              )}
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Sequence Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <Badge variant={getStatusBadgeVariant(currentSequence.status)}>{currentSequence.status}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Steps</span>
                <span className="font-semibold">{currentSequence.steps?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Duration</span>
                <span className="font-semibold">
                  {totalDelay > 0 ? `${Math.floor(totalDelay / 24)}d ${totalDelay % 24}h` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Trigger</span>
                <span className="font-semibold text-sm">{currentSequence.trigger?.replace(/_/g, ' ') || 'Manual'}</span>
              </div>
            </CardContent>
          </Card>

          {currentSequence.creator && (
            <Card>
              <CardHeader><CardTitle>Created By</CardTitle></CardHeader>
              <CardContent>
                <p className="font-medium text-slate-900">{currentSequence.creator.firstName} {currentSequence.creator.lastName}</p>
                <p className="text-sm text-slate-500">{format(new Date(currentSequence.createdAt), 'MMM d, yyyy')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EmailSequenceModal isOpen={modal.type === 'emailSequence'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode} sequence={modal.data} />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete}
        title="Delete Email Sequence" message={`Are you sure you want to delete "${currentSequence.name}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default EmailSequenceDetail;

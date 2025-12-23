import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Edit, Trash2, Play, Pause, Plus, Clock, Send, FileText,
  ArrowRight, GripVertical, Pencil, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import {
  fetchEmailSequence, deleteEmailSequence, updateEmailSequence,
  fetchEmailTemplates, createSequenceStep, updateSequenceStep, deleteSequenceStep,
  clearCurrentSequence
} from '../../features/emailSequencesSlice';
import { addNotification } from '../../features/uiSlice';
import {
  Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal, Modal, Input, Select
} from '../../components/ui';
import EmailSequenceModal from './EmailSequenceModal';

const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (status) {
    case 'draft': return 'default';
    case 'active': return 'success';
    case 'paused': return 'warning';
    default: return 'default';
  }
};

const getTriggerLabel = (trigger: string): string => {
  const triggers: Record<string, string> = {
    deal_won: 'Deal Won',
    contact_created: 'Contact Created',
    milestone_completed: 'Milestone Completed',
    milestone_complete: 'Milestone Completed',
    manual: 'Manual Enrollment',
  };
  return triggers[trigger] || trigger?.replace(/_/g, ' ') || 'Unknown';
};

interface StepModalData {
  id?: string;
  stepType: 'email' | 'delay';
  templateId: string;
  delayDays: number;
  delayHours: number;
  sortOrder: number;
}

const EmailSequenceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentSequence, templates, isLoading } = useAppSelector((state) => state.emailSequences);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<StepModalData | null>(null);
  const [showDeleteStepModal, setShowDeleteStepModal] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const [stepForm, setStepForm] = useState<StepModalData>({
    stepType: 'email',
    templateId: '',
    delayDays: 0,
    delayHours: 0,
    sortOrder: 1,
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchEmailSequence(id));
    }
    dispatch(fetchEmailTemplates({}));
    return () => {
      dispatch(clearCurrentSequence());
    };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteEmailSequence(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Email sequence deleted successfully' }));
      navigate('/email-sequences');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete sequence' }));
    }
    setShowDeleteModal(false);
  };

  const handleStatusChange = async (newStatus: 'active' | 'paused') => {
    if (!id || !currentSequence) return;
    try {
      await dispatch(updateEmailSequence({
        id,
        data: { status: newStatus }
      })).unwrap();
      dispatch(addNotification({ type: 'success', title: `Sequence ${newStatus === 'active' ? 'activated' : 'paused'} successfully` }));
      dispatch(fetchEmailSequence(id));
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to update sequence status' }));
    }
  };

  const handleAddStep = () => {
    const nextSortOrder = (currentSequence?.steps?.length || 0) + 1;
    setEditingStep(null);
    setStepForm({
      stepType: 'email',
      templateId: '',
      delayDays: 0,
      delayHours: 0,
      sortOrder: nextSortOrder,
    });
    setShowStepModal(true);
  };

  const handleEditStep = (step: any) => {
    setEditingStep(step);
    setStepForm({
      id: step.id,
      stepType: step.stepType || 'email',
      templateId: step.templateId || '',
      delayDays: step.delayDays || 0,
      delayHours: step.delayHours || 0,
      sortOrder: step.sortOrder || 1,
    });
    setShowStepModal(true);
  };

  const handleSaveStep = async () => {
    if (!id) return;

    try {
      if (editingStep) {
        await dispatch(updateSequenceStep({
          sequenceId: id,
          stepId: editingStep.id!,
          data: stepForm,
        })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Step updated successfully' }));
      } else {
        await dispatch(createSequenceStep({
          sequenceId: id,
          data: stepForm,
        })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Step added successfully' }));
      }
      dispatch(fetchEmailSequence(id));
      setShowStepModal(false);
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save step' }));
    }
  };

  const handleDeleteStep = async () => {
    if (!id || !stepToDelete) return;
    try {
      await dispatch(deleteSequenceStep({ sequenceId: id, stepId: stepToDelete })).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Step deleted successfully' }));
      dispatch(fetchEmailSequence(id));
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete step' }));
    }
    setShowDeleteStepModal(false);
    setStepToDelete(null);
  };

  const toggleStepExpand = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getTemplateById = (templateId: string) => {
    return templates.find(t => t.id === templateId);
  };

  if (isLoading || !currentSequence) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const sortedSteps = [...(currentSequence.steps || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/email-sequences')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentSequence.name}</h1>
                <Badge variant={getStatusBadgeVariant(currentSequence.status)}>
                  {currentSequence.status}
                </Badge>
              </div>
              {currentSequence.description && (
                <p className="text-slate-500">{currentSequence.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentSequence.status === 'draft' || currentSequence.status === 'paused' ? (
            <Button variant="outline" leftIcon={<Play className="w-4 h-4" />}
              onClick={() => handleStatusChange('active')}>
              Activate
            </Button>
          ) : currentSequence.status === 'active' ? (
            <Button variant="outline" leftIcon={<Pause className="w-4 h-4" />}
              onClick={() => handleStatusChange('paused')}>
              Pause
            </Button>
          ) : null}
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => setShowEditModal(true)}>
            Edit
          </Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Sequence Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowRight className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Trigger</p>
                <p className="font-medium text-slate-900">{getTriggerLabel(currentSequence.trigger)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Steps</p>
                <p className="font-medium text-slate-900">{currentSequence.steps?.length || 0} steps</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Email Steps</p>
                <p className="font-medium text-slate-900">
                  {currentSequence.steps?.filter((s: any) => s.stepType === 'email').length || 0} emails
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Delay</p>
                <p className="font-medium text-slate-900">
                  {currentSequence.steps?.reduce((sum: number, s: any) => sum + (s.delayDays || 0), 0) || 0} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequence Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Sequence Steps
              </CardTitle>
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddStep}>
                Add Step
              </Button>
            </CardHeader>
            <CardContent>
              {sortedSteps.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">No steps defined yet</p>
                  <Button variant="outline" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddStep}>
                    Add Your First Step
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedSteps.map((step: any, index: number) => {
                    const template = step.templateId ? getTemplateById(step.templateId) : null;
                    const isExpanded = expandedSteps.has(step.id);

                    return (
                      <div key={step.id} className="relative">
                        {/* Connection line */}
                        {index < sortedSteps.length - 1 && (
                          <div className="absolute left-6 top-14 w-0.5 h-8 bg-slate-200" />
                        )}

                        <div className="border rounded-lg p-4 hover:border-primary-300 transition-colors group">
                          <div className="flex items-start gap-4">
                            {/* Step Number */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                              step.stepType === 'email' ? 'bg-indigo-100' : 'bg-orange-100'
                            }`}>
                              {step.stepType === 'email' ? (
                                <Mail className="w-5 h-5 text-indigo-600" />
                              ) : (
                                <Clock className="w-5 h-5 text-orange-600" />
                              )}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-slate-400">Step {step.sortOrder}</span>
                                <Badge variant={step.stepType === 'email' ? 'purple' : 'warning'}>
                                  {step.stepType === 'email' ? 'Email' : 'Delay'}
                                </Badge>
                                {step.delayDays > 0 && step.stepType === 'delay' && (
                                  <span className="text-sm text-slate-500">
                                    Wait {step.delayDays} day{step.delayDays > 1 ? 's' : ''} {step.delayHours > 0 ? `${step.delayHours}h` : ''}
                                  </span>
                                )}
                              </div>

                              {step.stepType === 'email' && template && (
                                <>
                                  <h4 className="font-medium text-slate-900">{template.name}</h4>
                                  <p className="text-sm text-slate-500 truncate">{template.subjectTemplate}</p>
                                </>
                              )}

                              {step.stepType === 'email' && !template && (
                                <p className="text-sm text-slate-400 italic">No template selected</p>
                              )}

                              {step.stepType === 'delay' && (
                                <h4 className="font-medium text-slate-900">
                                  Wait for {step.delayDays} day{step.delayDays !== 1 ? 's' : ''}
                                  {step.delayHours > 0 ? ` and ${step.delayHours} hour${step.delayHours !== 1 ? 's' : ''}` : ''}
                                </h4>
                              )}

                              {/* Expanded Template Preview */}
                              {isExpanded && template && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                  <p className="text-xs text-slate-500 mb-1">Subject:</p>
                                  <p className="text-sm font-medium text-slate-800 mb-2">{template.subjectTemplate}</p>
                                  <p className="text-xs text-slate-500 mb-1">Body:</p>
                                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{template.bodyTemplate}</p>
                                  {template.variables?.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {template.variables.map((v: string) => (
                                        <Badge key={v} variant="default" className="text-xs">{`{{${v}}}`}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              {step.stepType === 'email' && template && (
                                <button
                                  onClick={() => toggleStepExpand(step.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                                  title={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              )}
                              <button
                                onClick={() => handleEditStep(step)}
                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Edit step"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setStepToDelete(step.id); setShowDeleteStepModal(true); }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete step"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Sequence Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sequence Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={getStatusBadgeVariant(currentSequence.status)}>
                      {currentSequence.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Trigger</dt>
                  <dd className="mt-1 text-slate-900 font-medium">
                    {getTriggerLabel(currentSequence.trigger)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="mt-1 text-slate-900">
                    {format(new Date(currentSequence.createdAt), 'MMM d, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Last Updated</dt>
                  <dd className="mt-1 text-slate-900">
                    {format(new Date(currentSequence.updatedAt), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Available Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Email Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <p className="text-sm text-slate-500">No templates available</p>
              ) : (
                <div className="space-y-2">
                  {templates.slice(0, 5).map((template) => (
                    <div key={template.id} className="p-2 bg-slate-50 rounded-lg">
                      <p className="font-medium text-sm text-slate-900">{template.name}</p>
                      <p className="text-xs text-slate-500 truncate">{template.subjectTemplate}</p>
                    </div>
                  ))}
                  {templates.length > 5 && (
                    <p className="text-xs text-slate-400 text-center">
                      +{templates.length - 5} more templates
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <EmailSequenceModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          if (id) dispatch(fetchEmailSequence(id));
        }}
        mode="edit"
        sequence={currentSequence}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Email Sequence"
        message={`Are you sure you want to delete "${currentSequence.name}"? This will also delete all steps. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showDeleteStepModal}
        onClose={() => { setShowDeleteStepModal(false); setStepToDelete(null); }}
        onConfirm={handleDeleteStep}
        title="Delete Step"
        message="Are you sure you want to delete this step? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Step Modal */}
      <Modal
        isOpen={showStepModal}
        onClose={() => setShowStepModal(false)}
        title={editingStep ? 'Edit Step' : 'Add Step'}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Step Type"
            options={[
              { value: 'email', label: 'Send Email' },
              { value: 'delay', label: 'Wait/Delay' },
            ]}
            value={stepForm.stepType}
            onChange={(val) => setStepForm({ ...stepForm, stepType: val as 'email' | 'delay' })}
          />

          {stepForm.stepType === 'email' && (
            <Select
              label="Email Template"
              options={[
                { value: '', label: 'Select a template...' },
                ...templates.map(t => ({ value: t.id, label: t.name })),
              ]}
              value={stepForm.templateId}
              onChange={(val) => setStepForm({ ...stepForm, templateId: val })}
            />
          )}

          {stepForm.stepType === 'delay' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Delay Days"
                type="number"
                min={0}
                value={stepForm.delayDays.toString()}
                onChange={(e) => setStepForm({ ...stepForm, delayDays: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Delay Hours"
                type="number"
                min={0}
                max={23}
                value={stepForm.delayHours.toString()}
                onChange={(e) => setStepForm({ ...stepForm, delayHours: parseInt(e.target.value) || 0 })}
              />
            </div>
          )}

          <Input
            label="Sort Order"
            type="number"
            min={1}
            value={stepForm.sortOrder.toString()}
            onChange={(e) => setStepForm({ ...stepForm, sortOrder: parseInt(e.target.value) || 1 })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowStepModal(false)}>Cancel</Button>
            <Button onClick={handleSaveStep}>
              {editingStep ? 'Update Step' : 'Add Step'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmailSequenceDetail;

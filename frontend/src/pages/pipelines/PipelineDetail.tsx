import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, GitBranch, Edit, Trash2, Plus, Pencil, X, GripVertical, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import {
  fetchPipeline, deletePipeline, updatePipeline,
  createPipelineStage, updatePipelineStage, deletePipelineStage,
  clearCurrentPipeline
} from '../../features/pipelinesSlice';
import { addNotification } from '../../features/uiSlice';
import {
  Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal, Modal, Input, Textarea
} from '../../components/ui';
import PipelineModal from './PipelineModal';

const getTypeBadgeVariant = (type: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (type) {
    case 'onboarding': return 'info';
    case 'delivery': return 'success';
    case 'support': return 'warning';
    case 'sales': return 'purple';
    case 'custom': return 'default';
    default: return 'default';
  }
};

const STAGE_COLORS = [
  { value: '#6366F1', label: 'Indigo' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F97316', label: 'Orange' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#10B981', label: 'Green' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#64748B', label: 'Slate' },
];

interface StageFormData {
  id?: string;
  name: string;
  description: string;
  color: string;
  sortOrder: number;
}

const PipelineDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentPipeline, isLoading } = useAppSelector((state) => state.pipelines);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState<StageFormData | null>(null);
  const [showDeleteStageModal, setShowDeleteStageModal] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<string | null>(null);

  const [stageForm, setStageForm] = useState<StageFormData>({
    name: '',
    description: '',
    color: '#6366F1',
    sortOrder: 1,
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchPipeline(id));
    }
    return () => {
      dispatch(clearCurrentPipeline());
    };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deletePipeline(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Pipeline deleted successfully' }));
      navigate('/pipelines');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete pipeline' }));
    }
    setShowDeleteModal(false);
  };

  const handleAddStage = () => {
    const nextSortOrder = (currentPipeline?.stages?.length || 0) + 1;
    setEditingStage(null);
    setStageForm({
      name: '',
      description: '',
      color: STAGE_COLORS[nextSortOrder % STAGE_COLORS.length].value,
      sortOrder: nextSortOrder,
    });
    setShowStageModal(true);
  };

  const handleEditStage = (stage: any) => {
    setEditingStage(stage);
    setStageForm({
      id: stage.id,
      name: stage.name || '',
      description: stage.description || '',
      color: stage.color || '#6366F1',
      sortOrder: stage.sortOrder || 1,
    });
    setShowStageModal(true);
  };

  const handleSaveStage = async () => {
    if (!id || !stageForm.name.trim()) return;

    try {
      if (editingStage) {
        await dispatch(updatePipelineStage({
          pipelineId: id,
          stageId: editingStage.id!,
          data: stageForm,
        })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Stage updated successfully' }));
      } else {
        await dispatch(createPipelineStage({
          pipelineId: id,
          data: stageForm,
        })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Stage added successfully' }));
      }
      dispatch(fetchPipeline(id));
      setShowStageModal(false);
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to save stage' }));
    }
  };

  const handleDeleteStage = async () => {
    if (!id || !stageToDelete) return;
    try {
      await dispatch(deletePipelineStage({ pipelineId: id, stageId: stageToDelete })).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Stage deleted successfully' }));
      dispatch(fetchPipeline(id));
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete stage' }));
    }
    setShowDeleteStageModal(false);
    setStageToDelete(null);
  };

  if (isLoading || !currentPipeline) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const sortedStages = [...(currentPipeline.stages || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/pipelines')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentPipeline.name}</h1>
                <Badge variant={getTypeBadgeVariant(currentPipeline.type)}>
                  {currentPipeline.type}
                </Badge>
                {currentPipeline.isDefault && (
                  <Badge variant="info">Default</Badge>
                )}
              </div>
              {currentPipeline.description && (
                <p className="text-slate-500">{currentPipeline.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => setShowEditModal(true)}>
            Edit
          </Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Pipeline Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stages */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Pipeline Stages ({sortedStages.length})
              </CardTitle>
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddStage}>
                Add Stage
              </Button>
            </CardHeader>
            <CardContent>
              {sortedStages.length === 0 ? (
                <div className="text-center py-8">
                  <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">No stages defined yet</p>
                  <Button variant="outline" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddStage}>
                    Add Your First Stage
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Visual Pipeline Flow */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4">
                    {sortedStages.map((stage, index) => (
                      <React.Fragment key={stage.id}>
                        <div
                          className="flex-shrink-0 px-4 py-2 rounded-lg text-white font-medium text-sm"
                          style={{ backgroundColor: stage.color || '#6366F1' }}
                        >
                          {stage.name}
                        </div>
                        {index < sortedStages.length - 1 && (
                          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Stage Cards */}
                  <div className="space-y-2">
                    {sortedStages.map((stage: any, index: number) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary-300 transition-colors group"
                      >
                        <div className="text-slate-400 cursor-move">
                          <GripVertical className="w-5 h-5" />
                        </div>

                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: stage.color || '#6366F1' }}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-400">#{stage.sortOrder}</span>
                            <h4 className="font-medium text-slate-900">{stage.name}</h4>
                          </div>
                          {stage.description && (
                            <p className="text-sm text-slate-500 truncate">{stage.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditStage(stage)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded"
                            title="Edit stage"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setStageToDelete(stage.id); setShowDeleteStageModal(true); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                            title="Delete stage"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-slate-500">Type</dt>
                  <dd className="mt-1">
                    <Badge variant={getTypeBadgeVariant(currentPipeline.type)}>
                      {currentPipeline.type}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Default Pipeline</dt>
                  <dd className="mt-1 text-slate-900">
                    {currentPipeline.isDefault ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Total Stages</dt>
                  <dd className="mt-1 text-slate-900 font-medium">
                    {currentPipeline.stages?.length || 0} stages
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="mt-1 text-slate-900">
                    {format(new Date(currentPipeline.createdAt), 'MMM d, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Last Updated</dt>
                  <dd className="mt-1 text-slate-900">
                    {format(new Date(currentPipeline.updatedAt), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Stage Colors Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Stage Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedStages.map((stage: any) => (
                  <div key={stage.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color || '#6366F1' }}
                    />
                    <span className="text-sm text-slate-700">{stage.name}</span>
                  </div>
                ))}
                {sortedStages.length === 0 && (
                  <p className="text-sm text-slate-500">No stages defined</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <PipelineModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          if (id) dispatch(fetchPipeline(id));
        }}
        mode="edit"
        pipeline={currentPipeline}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Pipeline"
        message={`Are you sure you want to delete "${currentPipeline.name}"? This will also delete all stages. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showDeleteStageModal}
        onClose={() => { setShowDeleteStageModal(false); setStageToDelete(null); }}
        onConfirm={handleDeleteStage}
        title="Delete Stage"
        message="Are you sure you want to delete this stage? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Stage Modal */}
      <Modal
        isOpen={showStageModal}
        onClose={() => setShowStageModal(false)}
        title={editingStage ? 'Edit Stage' : 'Add Stage'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Stage Name"
            value={stageForm.name}
            onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
            placeholder="e.g., Discovery, In Progress, Completed"
            required
          />

          <Textarea
            label="Description"
            value={stageForm.description}
            onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
            placeholder="Optional description for this stage"
            rows={2}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {STAGE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    stageForm.color === color.value ? 'border-slate-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setStageForm({ ...stageForm, color: color.value })}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <Input
            label="Sort Order"
            type="number"
            min={1}
            value={stageForm.sortOrder.toString()}
            onChange={(e) => setStageForm({ ...stageForm, sortOrder: parseInt(e.target.value) || 1 })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowStageModal(false)}>Cancel</Button>
            <Button onClick={handleSaveStage} disabled={!stageForm.name.trim()}>
              {editingStage ? 'Update Stage' : 'Add Stage'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PipelineDetail;

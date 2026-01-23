import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Calendar, Edit, Trash2, Layers, GripVertical, Plus, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchPipeline, deletePipeline, clearCurrentPipeline, deletePipelineStage, updatePipelineStage } from '../../features/pipelinesSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal } from '../../components/ui';
import PipelineModal from './PipelineModal';
import StageModal from './StageModal';

const getTypeBadgeVariant = (type: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (type) {
    case 'onboarding': return 'info';
    case 'delivery': return 'success';
    case 'support': return 'warning';
    case 'custom': return 'default';
    default: return 'default';
  }
};

interface SortableStageItemProps {
  stage: any;
  index: number;
  onEdit: (stage: any) => void;
  onDelete: (stage: any) => void;
  menuOpen: boolean;
  onMenuToggle: (id: string | null) => void;
}

const SortableStageItem: React.FC<SortableStageItemProps> = ({
  stage,
  index,
  onEdit,
  onDelete,
  menuOpen,
  onMenuToggle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderLeftColor: stage.color || '#94a3b8',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 bg-slate-50 rounded-lg border-l-4 group ${isDragging ? 'shadow-lg' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: stage.color || '#94a3b8' }}
      >
        {index + 1}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-slate-900">{stage.name}</h4>
        {stage.description && (
          <p className="text-sm text-slate-500 mt-1">{stage.description}</p>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => onMenuToggle(menuOpen ? null : stage.id)}
            className="p-1 rounded hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-slate-500" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => onMenuToggle(null)} />
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                <button
                  onClick={() => onEdit(stage)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => { onDelete(stage); onMenuToggle(null); }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const PipelineDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentPipeline, isLoading } = useAppSelector((state) => state.pipelines);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);
  const [deletingStage, setDeletingStage] = useState<any>(null);
  const [stageMenuOpen, setStageMenuOpen] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (id) dispatch(fetchPipeline(id));
    return () => { dispatch(clearCurrentPipeline()); };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deletePipeline(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Pipeline deleted' }));
      navigate('/pipelines');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete' }));
    }
    setShowDeleteModal(false);
  };

  const handleAddStage = () => {
    setEditingStage(null);
    setShowStageModal(true);
  };

  const handleEditStage = (stage: any) => {
    setEditingStage(stage);
    setShowStageModal(true);
    setStageMenuOpen(null);
  };

  const handleDeleteStage = async () => {
    if (!id || !deletingStage) return;
    try {
      await dispatch(deletePipelineStage({ pipelineId: id, stageId: deletingStage.id })).unwrap();
      dispatch(fetchPipeline(id));
      dispatch(addNotification({ type: 'success', title: 'Stage deleted' }));
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete stage' }));
    }
    setDeletingStage(null);
  };

  const handleStageModalClose = () => {
    setShowStageModal(false);
    setEditingStage(null);
  };

  const handleStageSuccess = () => {
    if (id) dispatch(fetchPipeline(id));
  };

  const handleStageDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !id || !currentPipeline?.stages) return;

    const sortedStages = [...currentPipeline.stages].sort((a, b) => a.sortOrder - b.sortOrder);
    const oldIndex = sortedStages.findIndex((s) => s.id === active.id);
    const newIndex = sortedStages.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedStages = arrayMove(sortedStages, oldIndex, newIndex);

    try {
      await Promise.all(
        reorderedStages.map((stage, index) =>
          dispatch(updatePipelineStage({
            pipelineId: id,
            stageId: stage.id,
            data: { sortOrder: index }
          })).unwrap()
        )
      );
      dispatch(fetchPipeline(id));
      dispatch(addNotification({ type: 'success', title: 'Stages reordered' }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to reorder stages' }));
    }
  };

  if (isLoading || !currentPipeline) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  const sortedStages = [...(currentPipeline.stages || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/pipelines')} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center"><GitBranch className="w-6 h-6 text-cyan-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentPipeline.name}</h1>
                <Badge variant={getTypeBadgeVariant(currentPipeline.type)}>{currentPipeline.type}</Badge>
                {currentPipeline.isDefault && <Badge variant="info">Default</Badge>}
              </div>
              <p className="text-sm text-slate-500">{currentPipeline.stages?.length || 0} stages</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'pipeline', mode: 'edit', data: currentPipeline }))}>Edit</Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}
            disabled={currentPipeline.isDefault}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Pipeline Information */}
          <Card>
            <CardHeader><CardTitle>Pipeline Information</CardTitle></CardHeader>
            <CardContent>
              {currentPipeline.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Description</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{currentPipeline.description}</p>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">Type</dt>
                  <dd className="mt-1"><Badge variant={getTypeBadgeVariant(currentPipeline.type)}>{currentPipeline.type}</Badge></dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Default Pipeline</dt>
                  <dd className="mt-1 font-medium">{currentPipeline.isDefault ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(currentPipeline.createdAt), 'MMM d, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Last Updated</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(currentPipeline.updatedAt), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Pipeline Stages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" />Pipeline Stages ({sortedStages.length})</CardTitle>
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddStage}>
                  Add Stage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sortedStages.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-3">No stages defined</p>
                  <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddStage}>
                    Add First Stage
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleStageDragEnd}
                >
                  <SortableContext
                    items={sortedStages.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {sortedStages.map((stage, index) => (
                        <SortableStageItem
                          key={stage.id}
                          stage={stage}
                          index={index}
                          onEdit={handleEditStage}
                          onDelete={setDeletingStage}
                          menuOpen={stageMenuOpen === stage.id}
                          onMenuToggle={setStageMenuOpen}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Pipeline Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Type</span>
                <Badge variant={getTypeBadgeVariant(currentPipeline.type)}>{currentPipeline.type}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Stages</span>
                <span className="font-semibold">{currentPipeline.stages?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Default</span>
                <span className="font-semibold">{currentPipeline.isDefault ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Stage Colors Legend */}
          {sortedStages.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Stage Colors</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sortedStages.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: stage.color || '#94a3b8' }}></div>
                      <span className="text-sm text-slate-600">{stage.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PipelineModal isOpen={modal.type === 'pipeline'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode} pipeline={modal.data} />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete}
        title="Delete Pipeline" message={`Are you sure you want to delete "${currentPipeline.name}"? This action cannot be undone.`} confirmText="Delete" variant="danger" />

      {id && (
        <StageModal
          isOpen={showStageModal}
          onClose={handleStageModalClose}
          pipelineId={id}
          stage={editingStage}
          nextSortOrder={sortedStages.length}
          onSuccess={handleStageSuccess}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingStage}
        onClose={() => setDeletingStage(null)}
        onConfirm={handleDeleteStage}
        title="Delete Stage"
        message={`Are you sure you want to delete "${deletingStage?.name}"? This may affect projects in this stage.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default PipelineDetail;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FolderKanban, Calendar, Building2, User, Edit, Trash2, CheckCircle2, Circle, Clock, GitBranch, ChevronRight, Plus, MoreVertical, GripVertical } from 'lucide-react';
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
import { fetchProject, deleteProject, clearCurrentProject, updateMilestone, updateProject, deleteMilestone } from '../../features/projectsSlice';
import { fetchPipeline } from '../../features/pipelinesSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal } from '../../components/ui';
import ProjectModal from './ProjectModal';
import MilestoneModal from './MilestoneModal';

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'info';
    case 'on_hold': return 'warning';
    case 'cancelled': return 'danger';
    default: return 'default';
  }
};

const getMilestoneStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
    default: return <Circle className="w-5 h-5 text-slate-300" />;
  }
};

interface SortableMilestoneItemProps {
  milestone: any;
  onToggle: (milestone: any) => void;
  onEdit: (milestone: any) => void;
  onDelete: (milestone: any) => void;
  menuOpen: boolean;
  onMenuToggle: (id: string | null) => void;
}

const SortableMilestoneItem: React.FC<SortableMilestoneItemProps> = ({
  milestone,
  onToggle,
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
  } = useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 group ${isDragging ? 'bg-slate-100 shadow-lg' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <button onClick={() => onToggle(milestone)} className="mt-0.5">
        {getMilestoneStatusIcon(milestone.status)}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${milestone.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
          {milestone.name}
        </p>
        {milestone.description && (
          <p className="text-sm text-slate-500 mt-1">{milestone.description}</p>
        )}
        {milestone.dueDate && (
          <p className="text-xs text-slate-400 mt-1">
            Due: {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {milestone.status === 'completed' && milestone.completedAt && (
          <span className="text-xs text-green-600">
            Completed {format(new Date(milestone.completedAt), 'MMM d')}
          </span>
        )}
        <div className="relative">
          <button
            onClick={() => onMenuToggle(menuOpen ? null : milestone.id)}
            className="p-1 rounded hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-slate-500" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => onMenuToggle(null)} />
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                <button
                  onClick={() => onEdit(milestone)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => { onDelete(milestone); onMenuToggle(null); }}
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

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProject, isLoading } = useAppSelector((state) => state.projects);
  const { currentPipeline } = useAppSelector((state) => state.pipelines);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);
  const [deletingMilestone, setDeletingMilestone] = useState<any>(null);
  const [milestoneMenuOpen, setMilestoneMenuOpen] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (id) dispatch(fetchProject(id));
    return () => { dispatch(clearCurrentProject()); };
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProject?.pipelineId) {
      dispatch(fetchPipeline(currentProject.pipelineId));
    }
  }, [dispatch, currentProject?.pipelineId]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteProject(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Project deleted' }));
      navigate('/projects');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete' }));
    }
    setShowDeleteModal(false);
  };

  const handleMilestoneToggle = async (milestone: any) => {
    if (!id) return;
    const newStatus = milestone.status === 'completed' ? 'pending' : 'completed';
    try {
      await dispatch(updateMilestone({
        projectId: id,
        milestoneId: milestone.id,
        data: { status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : null }
      })).unwrap();
      dispatch(fetchProject(id));
      dispatch(addNotification({ type: 'success', title: `Milestone ${newStatus === 'completed' ? 'completed' : 'reopened'}` }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to update milestone' }));
    }
  };

  const handleStageChange = async (stageId: string) => {
    if (!id || !currentProject) return;
    try {
      await dispatch(updateProject({ id, data: { stageId } })).unwrap();
      dispatch(fetchProject(id));
      dispatch(addNotification({ type: 'success', title: 'Project stage updated' }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to update stage' }));
    }
  };

  const handleAddMilestone = () => {
    setEditingMilestone(null);
    setShowMilestoneModal(true);
  };

  const handleEditMilestone = (milestone: any) => {
    setEditingMilestone(milestone);
    setShowMilestoneModal(true);
    setMilestoneMenuOpen(null);
  };

  const handleDeleteMilestone = async () => {
    if (!id || !deletingMilestone) return;
    try {
      await dispatch(deleteMilestone({ projectId: id, milestoneId: deletingMilestone.id })).unwrap();
      dispatch(fetchProject(id));
      dispatch(addNotification({ type: 'success', title: 'Milestone deleted' }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to delete milestone' }));
    }
    setDeletingMilestone(null);
  };

  const handleMilestoneModalClose = () => {
    setShowMilestoneModal(false);
    setEditingMilestone(null);
  };

  const handleMilestoneSuccess = () => {
    if (id) dispatch(fetchProject(id));
  };

  const handleMilestoneDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !id || !currentProject?.milestones) return;

    // Work with sorted milestones
    const sortedMilestones = [...currentProject.milestones].sort(
      (a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );

    const oldIndex = sortedMilestones.findIndex((m: any) => m.id === active.id);
    const newIndex = sortedMilestones.findIndex((m: any) => m.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedMilestones = arrayMove(sortedMilestones, oldIndex, newIndex);

    // Update sortOrder for all affected milestones
    try {
      await Promise.all(
        reorderedMilestones.map((milestone: any, index: number) =>
          dispatch(updateMilestone({
            projectId: id,
            milestoneId: milestone.id,
            data: { sortOrder: index }
          })).unwrap()
        )
      );
      dispatch(fetchProject(id));
      dispatch(addNotification({ type: 'success', title: 'Milestones reordered' }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to reorder milestones' }));
    }
  };

  if (isLoading || !currentProject) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  const progressPercentage = currentProject.progress || 0;
  const pipelineStages = currentPipeline?.id === currentProject.pipelineId && currentPipeline?.stages
    ? [...currentPipeline.stages].sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    : [];
  const currentStageIndex = pipelineStages.findIndex((s: any) => s.id === currentProject.stageId);

  // Sort milestones by sortOrder
  const sortedMilestones = currentProject.milestones
    ? [...currentProject.milestones].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><FolderKanban className="w-6 h-6 text-purple-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentProject.name}</h1>
                <Badge variant={getStatusBadgeVariant(currentProject.status)}>{currentProject.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-slate-500">{progressPercentage}% Complete</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'project', mode: 'edit', data: currentProject }))}>Edit</Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>Delete</Button>
        </div>
      </div>

      {/* Pipeline Stage Progress */}
      {currentProject.pipelineId && pipelineStages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Pipeline: {currentPipeline?.name || 'Loading...'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {pipelineStages.map((stage: any, index: number) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = stage.id === currentProject.stageId;
                const isClickable = true;

                return (
                  <React.Fragment key={stage.id}>
                    <button
                      onClick={() => handleStageChange(stage.id)}
                      className={`flex-1 relative group ${isClickable ? 'cursor-pointer' : ''}`}
                    >
                      <div className={`flex flex-col items-center`}>
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                            ${isCurrent ? 'border-primary-500 bg-primary-500 text-white' :
                              isCompleted ? 'border-green-500 bg-green-500 text-white' :
                              'border-slate-300 bg-white text-slate-400 group-hover:border-primary-300'}`}
                          style={stage.color && isCurrent ? { backgroundColor: stage.color, borderColor: stage.color } : {}}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        <span className={`mt-2 text-xs font-medium text-center px-1 ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-slate-500'}`}>
                          {stage.name}
                        </span>
                      </div>
                    </button>
                    {index < pipelineStages.length - 1 && (
                      <div className={`flex-shrink-0 w-8 h-0.5 -mt-6 ${index < currentStageIndex ? 'bg-green-500' : 'bg-slate-200'}`}>
                        <ChevronRight className={`w-4 h-4 -mt-1.5 ml-2 ${index < currentStageIndex ? 'text-green-500' : 'text-slate-300'}`} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {currentProject.stage && (
              <p className="text-center text-sm text-slate-500 mt-4">
                Current Stage: <span className="font-medium text-slate-700">{currentProject.stage.name}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Project Progress</span>
            <span className="text-sm font-medium text-slate-900">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${progressPercentage === 100 ? 'bg-green-500' : 'bg-primary-500'}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Project Information */}
          <Card>
            <CardHeader><CardTitle>Project Information</CardTitle></CardHeader>
            <CardContent>
              {currentProject.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Description</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{currentProject.description}</p>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">Start Date</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {currentProject.startDate ? format(new Date(currentProject.startDate), 'MMM d, yyyy') : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Target End Date</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {currentProject.targetEndDate ? format(new Date(currentProject.targetEndDate), 'MMM d, yyyy') : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Company</dt>
                  <dd className="mt-1">
                    {currentProject.company ? (
                      <Link to={`/companies/${currentProject.company.id}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <Building2 className="w-4 h-4" />{currentProject.company.name}
                      </Link>
                    ) : <span className="text-slate-400">-</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Contact</dt>
                  <dd className="mt-1">
                    {currentProject.contact ? (
                      <Link to={`/contacts/${currentProject.contact.id}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <User className="w-4 h-4" />{currentProject.contact.firstName} {currentProject.contact.lastName}
                      </Link>
                    ) : <span className="text-slate-400">-</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Pipeline</dt>
                  <dd className="mt-1">
                    {currentProject.pipelineId && currentPipeline ? (
                      <Link to={`/pipelines/${currentPipeline.id}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <GitBranch className="w-4 h-4" />{currentPipeline.name}
                      </Link>
                    ) : <span className="text-slate-400">No pipeline assigned</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Current Stage</dt>
                  <dd className="mt-1">
                    {currentProject.stage ? (
                      <Badge variant="info">{currentProject.stage.name}</Badge>
                    ) : <span className="text-slate-400">-</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="mt-1"><Badge variant={getStatusBadgeVariant(currentProject.status)}>{currentProject.status.replace('_', ' ')}</Badge></dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="mt-1">{format(new Date(currentProject.createdAt), 'MMM d, yyyy')}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />Milestones</CardTitle>
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddMilestone}>
                  Add Milestone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sortedMilestones.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-3">No milestones yet</p>
                  <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddMilestone}>
                    Add First Milestone
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleMilestoneDragEnd}
                >
                  <SortableContext
                    items={sortedMilestones.map((m: any) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {sortedMilestones.map((milestone: any) => (
                        <SortableMilestoneItem
                          key={milestone.id}
                          milestone={milestone}
                          onToggle={handleMilestoneToggle}
                          onEdit={handleEditMilestone}
                          onDelete={setDeletingMilestone}
                          menuOpen={milestoneMenuOpen === milestone.id}
                          onMenuToggle={setMilestoneMenuOpen}
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
          {/* Pipeline Progress Card */}
          {currentProject.pipelineId && pipelineStages.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Pipeline Progress</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {pipelineStages.map((stage: any, index: number) => {
                  const isCompleted = index < currentStageIndex;
                  const isCurrent = stage.id === currentProject.stageId;
                  return (
                    <div key={stage.id} className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${isCurrent ? 'bg-primary-500' : isCompleted ? 'bg-green-500' : 'bg-slate-200'}`}
                        style={stage.color && isCurrent ? { backgroundColor: stage.color } : {}}
                      />
                      <span className={`text-sm ${isCurrent ? 'font-medium text-slate-900' : isCompleted ? 'text-green-600' : 'text-slate-500'}`}>
                        {stage.name}
                      </span>
                      {isCurrent && <Badge variant="info" className="ml-auto text-xs">Current</Badge>}
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Milestones</span>
                <span className="font-semibold">{currentProject.milestones?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Completed</span>
                <span className="font-semibold text-green-600">
                  {currentProject.milestones?.filter((m: any) => m.status === 'completed').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">In Progress</span>
                <span className="font-semibold text-blue-600">
                  {currentProject.milestones?.filter((m: any) => m.status === 'in_progress').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pending</span>
                <span className="font-semibold text-slate-600">
                  {currentProject.milestones?.filter((m: any) => m.status === 'pending').length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {currentProject.actualEndDate && (
            <Card>
              <CardHeader><CardTitle>Completion</CardTitle></CardHeader>
              <CardContent>
                <p className="text-slate-500 text-sm">Completed on</p>
                <p className="font-semibold text-lg">{format(new Date(currentProject.actualEndDate), 'MMMM d, yyyy')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ProjectModal isOpen={modal.type === 'project'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode} project={modal.data} />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete}
        title="Delete Project" message={`Are you sure you want to delete "${currentProject.name}"?`} confirmText="Delete" variant="danger" />

      {id && (
        <MilestoneModal
          isOpen={showMilestoneModal}
          onClose={handleMilestoneModalClose}
          projectId={id}
          milestone={editingMilestone}
          onSuccess={handleMilestoneSuccess}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingMilestone}
        onClose={() => setDeletingMilestone(null)}
        onConfirm={handleDeleteMilestone}
        title="Delete Milestone"
        message={`Are you sure you want to delete "${deletingMilestone?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default ProjectDetail;

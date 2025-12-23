import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FolderKanban, Building2, User, Calendar, Edit, Trash2, Plus, CheckCircle, Circle, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchProject, deleteProject, clearCurrentProject, fetchMilestones, updateMilestone, deleteMilestone } from '../../features/projectsSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import {
  Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal
} from '../../components/ui';
import ProjectModal from './ProjectModal';
import MilestoneModal from './MilestoneModal';
import ActivityFeed from '../../components/activity/ActivityFeed';

const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (status) {
    case 'planning': return 'default';
    case 'in_progress': return 'info';
    case 'on_hold': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'danger';
    default: return 'default';
  }
};

const getMilestoneStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
    default: return <Circle className="w-5 h-5 text-slate-300" />;
  }
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProject, milestones, isLoading } = useAppSelector((state) => state.projects);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneMode, setMilestoneMode] = useState<'create' | 'edit' | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [showDeleteMilestoneModal, setShowDeleteMilestoneModal] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<any>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchProject(id));
      dispatch(fetchMilestones(id));
    }
    return () => {
      dispatch(clearCurrentProject());
    };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteProject(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Project deleted successfully' }));
      navigate('/projects');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete project' }));
    }
    setShowDeleteModal(false);
  };

  const handleToggleMilestone = async (milestoneId: string, currentStatus: string) => {
    if (!id) return;
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await dispatch(updateMilestone({ projectId: id, milestoneId, data: { status: newStatus } })).unwrap();
      dispatch(addNotification({ type: 'success', title: `Milestone marked as ${newStatus}` }));
      dispatch(fetchProject(id));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to update milestone' }));
    }
  };

  const handleAddMilestone = () => {
    setMilestoneMode('create');
    setSelectedMilestone(null);
    setShowMilestoneModal(true);
  };

  const handleEditMilestone = (milestone: any) => {
    setMilestoneMode('edit');
    setSelectedMilestone(milestone);
    setShowMilestoneModal(true);
  };

  const handleDeleteMilestoneClick = (milestone: any) => {
    setMilestoneToDelete(milestone);
    setShowDeleteMilestoneModal(true);
  };

  const handleDeleteMilestone = async () => {
    if (!id || !milestoneToDelete) return;
    try {
      await dispatch(deleteMilestone({ projectId: id, milestoneId: milestoneToDelete.id })).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Milestone deleted successfully' }));
      dispatch(fetchMilestones(id));
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete milestone' }));
    }
    setShowDeleteMilestoneModal(false);
    setMilestoneToDelete(null);
  };

  const handleMilestoneModalClose = () => {
    setShowMilestoneModal(false);
    setMilestoneMode(null);
    setSelectedMilestone(null);
    if (id) {
      dispatch(fetchMilestones(id));
      dispatch(fetchProject(id));
    }
  };

  // Calculate dynamic progress based on completed milestones
  const calculateProgress = () => {
    if (milestones.length === 0) return 0;
    const completedCount = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completedCount / milestones.length) * 100);
  };

  const dynamicProgress = calculateProgress();

  if (isLoading || !currentProject) {
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
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentProject.name}</h1>
                <Badge variant={getStatusBadgeVariant(currentProject.status)}>
                  {currentProject.status.replace('_', ' ')}
                </Badge>
              </div>
              {currentProject.description && (
                <p className="text-slate-500">{currentProject.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'project', mode: 'edit', data: currentProject }))}>
            Edit
          </Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader><CardTitle>Project Information</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
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
                        <User className="w-4 h-4" />{currentProject.contact.fullName}
                      </Link>
                    ) : <span className="text-slate-400">-</span>}
                  </dd>
                </div>
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
                  <dt className="text-sm text-slate-500">Progress</dt>
                  <dd className="mt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-[150px]">
                        <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${dynamicProgress}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-600">{dynamicProgress}%</span>
                    </div>
                    {milestones.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        {milestones.filter(m => m.status === 'completed').length} of {milestones.length} milestones completed
                      </p>
                    )}
                  </dd>
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
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Milestones ({milestones.length})
              </CardTitle>
              <Button size="sm" variant="outline" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddMilestone}>
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No milestones yet</p>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 group">
                      <button onClick={() => handleToggleMilestone(milestone.id, milestone.status)} className="mt-0.5">
                        {getMilestoneStatusIcon(milestone.status)}
                      </button>
                      <div className="flex-1">
                        <p className={`font-medium ${milestone.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {milestone.name}
                        </p>
                        {milestone.description && (
                          <p className="text-sm text-slate-500">{milestone.description}</p>
                        )}
                        {milestone.dueDate && (
                          <p className="text-xs text-slate-400 mt-1">
                            Due: {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditMilestone(milestone)}
                          className="p-1.5 hover:bg-slate-200 rounded"
                          title="Edit milestone"
                        >
                          <Edit className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteMilestoneClick(milestone)}
                          className="p-1.5 hover:bg-red-100 rounded"
                          title="Delete milestone"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Activity Feed */}
        <div className="space-y-6">
          <ActivityFeed entityType="project" entityId={currentProject.id} />
        </div>
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={modal.type === 'project'}
        onClose={() => {
          dispatch(openModal({ type: null, mode: null }));
          if (id) dispatch(fetchProject(id));
        }}
        mode={modal.mode === 'view' ? 'edit' : modal.mode}
        project={modal.data}
      />

      <MilestoneModal
        isOpen={showMilestoneModal}
        onClose={handleMilestoneModalClose}
        mode={milestoneMode}
        projectId={id || ''}
        milestone={selectedMilestone}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${currentProject.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showDeleteMilestoneModal}
        onClose={() => {
          setShowDeleteMilestoneModal(false);
          setMilestoneToDelete(null);
        }}
        onConfirm={handleDeleteMilestone}
        title="Delete Milestone"
        message={`Are you sure you want to delete "${milestoneToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default ProjectDetail;

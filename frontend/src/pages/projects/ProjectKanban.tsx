import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Plus, List, GitBranch, Settings } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchProjects, updateProject } from '../../features/projectsSlice';
import { fetchPipelines, fetchPipelineStages } from '../../features/pipelinesSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { Button, Select } from '../../components/ui';
import ProjectCard from './ProjectCard';
import ProjectDroppableColumn from './ProjectDroppableColumn';
import ProjectModal from './ProjectModal';

const ProjectKanban: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { projects } = useAppSelector((state) => state.projects);
  const { pipelines, stages, isLoading: pipelinesLoading } = useAppSelector((state) => state.pipelines);
  const { modal } = useAppSelector((state) => state.ui);

  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [activeProject, setActiveProject] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch pipelines on mount
  useEffect(() => {
    dispatch(fetchPipelines({ limit: 100 }));
    dispatch(fetchProjects({ limit: 100 }));
  }, [dispatch]);

  // Auto-select first pipeline or one with type 'delivery' or 'onboarding'
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      const deliveryPipeline = pipelines.find(p => p.type === 'delivery' || p.type === 'onboarding');
      setSelectedPipelineId(deliveryPipeline?.id || pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId]);

  // Fetch stages when pipeline changes
  useEffect(() => {
    if (selectedPipelineId) {
      dispatch(fetchPipelineStages(selectedPipelineId));
    }
  }, [dispatch, selectedPipelineId]);

  // Group projects by stage
  const projectsByStage = stages.reduce((acc: Record<string, any[]>, stage) => {
    acc[stage.id] = projects.filter(p => p.stageId === stage.id);
    return acc;
  }, {});

  // Projects without a stage (unassigned)
  const unassignedProjects = projects.filter(p => !p.stageId || !stages.find(s => s.id === p.stageId));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const project = projects.find(p => p.id === active.id);
    if (project) {
      setActiveProject(project);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProject(null);

    if (!over) return;

    const projectId = active.id as string;
    let targetStageId: string | undefined;

    // Check if dropped over a column (stage)
    if (stages.find(s => s.id === over.id)) {
      targetStageId = over.id as string;
    } else {
      // If dropped over another project, find which stage that project is in
      for (const stage of stages) {
        if (projectsByStage[stage.id]?.find((p) => p.id === over.id)) {
          targetStageId = stage.id;
          break;
        }
      }
    }

    if (!targetStageId) return;

    const project = projects.find(p => p.id === projectId);
    if (!project || project.stageId === targetStageId) return;

    try {
      await dispatch(updateProject({
        id: projectId,
        data: {
          stageId: targetStageId,
          pipelineId: selectedPipelineId,
        }
      })).unwrap();

      dispatch(addNotification({ type: 'success', title: 'Project moved to new stage' }));
      dispatch(fetchProjects({ limit: 100 }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to update project stage' }));
    }
  };

  const sortedStages = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);

  const pipelineOptions = [
    { value: '', label: 'Select Pipeline' },
    ...pipelines.map(p => ({ value: p.id, label: `${p.name} (${p.type})` }))
  ];

  // Only show loading spinner on initial load when there's no data at all
  if (pipelinesLoading && pipelines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-slate-500">Loading pipelines...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Pipeline Board</h1>
          <p className="text-slate-500">Drag and drop projects between pipeline stages</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Pipeline Selector */}
          <div className="w-64">
            <Select
              options={pipelineOptions}
              value={selectedPipelineId}
              onChange={setSelectedPipelineId}
            />
          </div>
          <Button
            variant="outline"
            leftIcon={<Settings className="w-4 h-4" />}
            onClick={() => navigate(`/pipelines/${selectedPipelineId}`)}
            disabled={!selectedPipelineId}
          >
            Edit Pipeline
          </Button>
          <Button
            variant="outline"
            leftIcon={<List className="w-4 h-4" />}
            onClick={() => navigate('/projects/list')}
          >
            List View
          </Button>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'project', mode: 'create' }))}
          >
            Add Project
          </Button>
        </div>
      </div>

      {!selectedPipelineId || stages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <GitBranch className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Pipeline Selected</h3>
          <p className="text-slate-500 mb-4">Select a pipeline above or create one to get started</p>
          <Button onClick={() => navigate('/pipelines')} leftIcon={<Plus className="w-4 h-4" />}>
            Create Pipeline
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
            {/* Unassigned Column */}
            {unassignedProjects.length > 0 && (
              <div className="flex-shrink-0 w-80 bg-amber-50 rounded-lg flex flex-col max-h-full border-2 border-dashed border-amber-200">
                <div className="p-3 border-b border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <h3 className="font-semibold text-amber-800">Unassigned</h3>
                    <span className="ml-auto text-sm text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      {unassignedProjects.length}
                    </span>
                  </div>
                  <p className="text-xs text-amber-600">Drag to a stage to assign</p>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {unassignedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pipeline Stages */}
            {sortedStages.map((stage) => (
              <ProjectDroppableColumn
                key={stage.id}
                stage={stage}
                projects={projectsByStage[stage.id] || []}
              />
            ))}
          </div>

          <DragOverlay>
            {activeProject && <ProjectCard project={activeProject} isDragging />}
          </DragOverlay>
        </DndContext>
      )}

      <ProjectModal
        isOpen={modal.type === 'project'}
        onClose={() => {
          dispatch(openModal({ type: null, mode: null }));
          dispatch(fetchProjects({ limit: 100 }));
        }}
        mode={modal.mode === 'view' ? 'edit' : modal.mode}
        project={modal.data}
      />
    </div>
  );
};

export default ProjectKanban;

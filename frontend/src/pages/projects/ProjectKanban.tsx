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
import { Plus, List, GitBranch } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchProjects, updateProject } from '../../features/projectsSlice';
import { fetchPipelines, fetchPipeline } from '../../features/pipelinesSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { Button, Select } from '../../components/ui';
import ProjectCard from './ProjectCard';
import ProjectDroppableColumn from './ProjectDroppableColumn';
import ProjectModal from './ProjectModal';

interface Project {
  id: string;
  name: string;
  description?: string;
  progress: number;
  status: string;
  targetEndDate?: string;
  pipelineId?: string;
  stageId?: string;
  company?: { id: string; name: string };
  stage?: { id: string; name: string };
}

const ProjectKanban: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { projects, isLoading } = useAppSelector((state) => state.projects);
  const { pipelines, currentPipeline } = useAppSelector((state) => state.pipelines);
  const { modal } = useAppSelector((state) => state.ui);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    dispatch(fetchPipelines({ limit: 100 }));
    dispatch(fetchProjects({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    // Set default pipeline if none selected
    if (!selectedPipelineId && pipelines.length > 0) {
      const defaultPipeline = pipelines.find(p => p.isDefault) || pipelines[0];
      setSelectedPipelineId(defaultPipeline.id);
    }
  }, [pipelines, selectedPipelineId]);

  useEffect(() => {
    if (selectedPipelineId) {
      dispatch(fetchPipeline(selectedPipelineId));
    }
  }, [selectedPipelineId, dispatch]);

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const project = projects.find((p) => p.id === active.id);
    if (project) {
      setActiveProject(project as Project);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveProject(null);

    if (!over || !currentPipeline?.stages) return;

    const projectId = active.id as string;
    const stages = currentPipeline.stages;

    // Determine target stage
    let targetStageId: string | undefined;

    // Check if dropped over a column (stage)
    if (stages.find((s: any) => s.id === over.id)) {
      targetStageId = over.id as string;
    } else {
      // If dropped over another project, find which stage that project is in
      const targetProject = projects.find((p) => p.id === over.id);
      if (targetProject) {
        targetStageId = targetProject.stageId;
      }
    }

    if (!targetStageId) return;

    // Find current project
    const currentProject = projects.find((p) => p.id === projectId);
    if (!currentProject || currentProject.stageId === targetStageId) return;

    try {
      await dispatch(updateProject({
        id: projectId,
        data: { stageId: targetStageId, pipelineId: selectedPipelineId }
      })).unwrap();
      dispatch(fetchProjects({ limit: 100 }));
      dispatch(addNotification({ type: 'success', title: 'Project stage updated' }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to update project stage' }));
    }
  };

  // Get stages from current pipeline
  const stages = currentPipeline?.id === selectedPipelineId && currentPipeline?.stages
    ? [...currentPipeline.stages].sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    : [];

  // Filter projects by selected pipeline and group by stage
  const filteredProjects = projects.filter((p) => p.pipelineId === selectedPipelineId);

  const getProjectsByStage = (stageId: string) => {
    return filteredProjects.filter((p) => p.stageId === stageId);
  };

  // Get unassigned projects (in this pipeline but no stage)
  const unassignedProjects = filteredProjects.filter((p) => !p.stageId);

  const pipelineOptions = pipelines.map((p) => ({ value: p.id, label: p.name }));

  if (pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <GitBranch className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No Pipelines Found</h2>
        <p className="text-slate-500 mb-4">Create a pipeline to start using the Kanban view</p>
        <Button onClick={() => navigate('/pipelines')}>Go to Pipelines</Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects Pipeline</h1>
          <p className="text-slate-500">Drag and drop to update project stages</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select
              options={pipelineOptions}
              value={selectedPipelineId}
              onChange={handlePipelineChange}
            />
          </div>
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
            New Project
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : stages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-100 rounded-lg">
          <p className="text-slate-500 mb-4">No stages defined for this pipeline</p>
          <Button variant="outline" onClick={() => navigate(`/pipelines/${selectedPipelineId}`)}>
            Configure Pipeline
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
            {stages.map((stage: any) => (
              <ProjectDroppableColumn
                key={stage.id}
                stage={stage}
                projects={getProjectsByStage(stage.id)}
              />
            ))}

            {/* Unassigned Column */}
            {unassignedProjects.length > 0 && (
              <div className="flex-shrink-0 w-72 bg-amber-50 rounded-lg flex flex-col">
                <div className="p-3 border-b border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <h3 className="font-semibold text-amber-900">Unassigned</h3>
                    <span className="ml-auto text-sm text-amber-600 bg-white px-2 py-0.5 rounded-full">
                      {unassignedProjects.length}
                    </span>
                  </div>
                  <p className="text-xs text-amber-600">Drag to a stage to assign</p>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {unassignedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project as Project}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <DragOverlay>
            {activeProject && <ProjectCard project={activeProject} isDragging />}
          </DragOverlay>
        </DndContext>
      )}

      <ProjectModal
        isOpen={modal.type === 'project'}
        onClose={() => dispatch(openModal({ type: null, mode: null }))}
        mode={modal.mode}
        project={modal.data}
      />
    </div>
  );
};

export default ProjectKanban;

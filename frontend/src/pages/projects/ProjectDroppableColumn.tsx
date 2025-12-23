import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate } from 'react-router-dom';
import ProjectCard from './ProjectCard';

interface PipelineStage {
  id: string;
  name: string;
  color?: string;
  sortOrder: number;
}

interface ProjectDroppableColumnProps {
  stage: PipelineStage;
  projects: any[];
}

const ProjectDroppableColumn: React.FC<ProjectDroppableColumnProps> = ({
  stage,
  projects,
}) => {
  const navigate = useNavigate();
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  // Calculate total progress across all projects in this stage
  const averageProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => {
        const milestones = p.milestones || [];
        const completed = milestones.filter((m: any) => m.status === 'completed').length;
        return sum + (milestones.length > 0 ? (completed / milestones.length) * 100 : 0);
      }, 0) / projects.length)
    : 0;

  return (
    <div className="flex-shrink-0 w-80 bg-slate-100 rounded-lg flex flex-col max-h-full">
      {/* Column Header */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color || '#6366f1' }}
          />
          <h3 className="font-semibold text-slate-900">{stage.name}</h3>
          <span className="ml-auto text-sm text-slate-500 bg-white px-2 py-0.5 rounded-full">
            {projects.length}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${averageProgress}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{averageProgress}% avg</span>
        </div>
      </div>

      {/* Projects List - Droppable Area */}
      <SortableContext
        items={projects.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`flex-1 p-2 space-y-2 overflow-y-auto transition-colors ${
            isOver ? 'bg-blue-50' : ''
          }`}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}

          {/* Drop zone indicator when empty */}
          {projects.length === 0 && (
            <div className={`h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition-colors ${
              isOver
                ? 'border-blue-400 bg-blue-50 text-blue-600'
                : 'border-slate-300 text-slate-400'
            }`}>
              Drop projects here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default ProjectDroppableColumn;

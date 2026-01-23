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

interface Project {
  id: string;
  name: string;
  description?: string;
  progress: number;
  status: string;
  targetEndDate?: string;
  company?: { id: string; name: string };
  stage?: { id: string; name: string };
  stageId?: string;
}

interface ProjectDroppableColumnProps {
  stage: PipelineStage;
  projects: Project[];
}

const ProjectDroppableColumn: React.FC<ProjectDroppableColumnProps> = ({
  stage,
  projects,
}) => {
  const navigate = useNavigate();
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex-shrink-0 w-72 bg-slate-100 rounded-lg flex flex-col">
      {/* Column Header */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color || '#94a3b8' }}
          />
          <h3 className="font-semibold text-slate-900">{stage.name}</h3>
          <span className="ml-auto text-sm text-slate-500 bg-white px-2 py-0.5 rounded-full">
            {projects.length}
          </span>
        </div>
      </div>

      {/* Projects List - Droppable Area */}
      <SortableContext
        items={projects.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`flex-1 p-2 space-y-2 overflow-y-auto transition-colors min-h-[200px] ${
            isOver ? 'bg-primary-50' : ''
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
                ? 'border-primary-400 bg-primary-50 text-primary-600'
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

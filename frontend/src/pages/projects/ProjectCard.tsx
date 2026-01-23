import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { Building2, Calendar, FolderKanban } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description?: string;
  progress: number;
  status: string;
  targetEndDate?: string;
  company?: { id: string; name: string };
  stage?: { id: string; name: string };
}

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  isDragging?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700';
    case 'in_progress': return 'bg-blue-100 text-blue-700';
    case 'on_hold': return 'bg-amber-100 text-amber-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const getProgressColor = (progress: number) => {
  if (progress === 100) return 'bg-green-500';
  if (progress >= 75) return 'bg-emerald-500';
  if (progress >= 50) return 'bg-yellow-500';
  if (progress >= 25) return 'bg-amber-500';
  return 'bg-red-500';
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'bg-white rounded-lg border border-slate-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg'
      )}
      onClick={onClick}
    >
      <div className="space-y-2">
        {/* Project Name */}
        <div className="flex items-start gap-2">
          <FolderKanban className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
          <h4 className="font-medium text-slate-900 line-clamp-2">{project.name}</h4>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium text-slate-700">{project.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor(project.progress)}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Company */}
        {project.company && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{project.company.name}</span>
          </div>
        )}

        {/* Target Date & Status */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {project.targetEndDate ? format(new Date(project.targetEndDate), 'MMM d') : 'No date'}
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status.replace('_', ' ')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;

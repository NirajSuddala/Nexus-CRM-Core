import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { Building2, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: any;
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

  // Calculate progress from milestones
  const milestones = project.milestones || [];
  const completedMilestones = milestones.filter((m: any) => m.status === 'completed').length;
  const totalMilestones = milestones.length;
  const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

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
        <h4 className="font-medium text-slate-900 line-clamp-2">{project.name}</h4>

        {/* Status Badge */}
        <span className={clsx('inline-block px-2 py-0.5 text-xs font-medium rounded-full', getStatusColor(project.status))}>
          {project.status?.replace('_', ' ')}
        </span>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium text-slate-700">{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Milestones Summary */}
        {totalMilestones > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>{completedMilestones}/{totalMilestones} milestones</span>
          </div>
        )}

        {/* Company */}
        {project.company && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{project.company.name}</span>
          </div>
        )}

        {/* Target Date */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {project.targetEndDate ? format(new Date(project.targetEndDate), 'MMM d') : 'No date'}
          </div>
          {project.type && (
            <div className="px-2 py-0.5 bg-slate-100 rounded-full capitalize">
              {project.type}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;

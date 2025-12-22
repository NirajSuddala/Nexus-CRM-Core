import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { Building2, User, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Deal } from '../../types';

interface DealCardProps {
  deal: Deal;
  onClick?: () => void;
  isDragging?: boolean;
}

const DealCard: React.FC<DealCardProps> = ({ deal, onClick, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
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
        {/* Deal Name */}
        <h4 className="font-medium text-slate-900 line-clamp-2">{deal.name}</h4>

        {/* Amount */}
        <div className="flex items-center gap-1 text-slate-600">
          <DollarSign className="w-4 h-4" />
          <span className="font-semibold">{formatCurrency(deal.amount)}</span>
        </div>

        {/* Company */}
        {deal.company && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{deal.company.name}</span>
          </div>
        )}

        {/* Contact */}
        {deal.contact && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="w-3 h-3" />
            <span className="truncate">{deal.contact.fullName}</span>
          </div>
        )}

        {/* Close Date & Probability */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {deal.closeDate ? format(new Date(deal.closeDate), 'MMM d') : 'No date'}
          </div>
          <div className="px-2 py-0.5 bg-slate-100 rounded-full">
            {deal.probability}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealCard;

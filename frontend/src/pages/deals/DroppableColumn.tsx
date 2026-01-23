import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate } from 'react-router-dom';
import { Deal, DealStage } from '../../types';
import DealCard from './DealCard';

interface DroppableColumnProps {
  stage: DealStage;
  label: string;
  color: string;
  deals: Deal[];
  totalValue: number;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  stage,
  label,
  color,
  deals,
  totalValue,
}) => {
  const navigate = useNavigate();
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      className="flex-shrink-0 w-72 bg-slate-100 rounded-lg flex flex-col"
    >
      {/* Column Header */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
          <h3 className="font-semibold text-slate-900">{label}</h3>
          <span className="ml-auto text-sm text-slate-500">
            {deals.length}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {formatCurrency(totalValue)}
        </p>
      </div>

      {/* Deals List - Droppable Area */}
      <SortableContext
        items={deals.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`flex-1 p-2 space-y-2 overflow-y-auto transition-colors ${
            isOver ? 'bg-blue-50' : ''
          }`}
        >
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={() => navigate(`/deals/${deal.id}`)}
            />
          ))}

          {/* Drop zone indicator when empty */}
          {deals.length === 0 && (
            <div className={`h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition-colors ${
              isOver
                ? 'border-blue-400 bg-blue-50 text-blue-600'
                : 'border-slate-300 text-slate-400'
            }`}>
              Drop deals here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default DroppableColumn;

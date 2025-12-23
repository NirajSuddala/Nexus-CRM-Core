import React, { useEffect } from 'react';
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
import { Plus, List } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchDealsByStage, updateDealStage, moveDealToStage } from '../../features/dealsSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { subscribeToDealUpdates, unsubscribeFromDealUpdates } from '../../services/socket';
import { Button } from '../../components/ui';
import { Deal, DealStage } from '../../types';
import DealCard from './DealCard';
import DealModal from './DealModal';
import DroppableColumn from './DroppableColumn';

const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: 'discovery', label: 'Discovery', color: 'bg-slate-500' },
  { key: 'proposal', label: 'Proposal', color: 'bg-blue-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-amber-500' },
  { key: 'closed_won', label: 'Closed Won', color: 'bg-green-500' },
  { key: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' },
];

const DealKanban: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { dealsByStage } = useAppSelector((state) => state.deals);
  const { modal } = useAppSelector((state) => state.ui);
  const [, setActiveId] = React.useState<string | null>(null);
  const [activeDeal, setActiveDeal] = React.useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    dispatch(fetchDealsByStage());

    // Subscribe to real-time updates
    subscribeToDealUpdates(() => {
      dispatch(fetchDealsByStage());
    });

    return () => {
      unsubscribeFromDealUpdates();
    };
  }, [dispatch]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find the active deal
    for (const stage of STAGES) {
      const deal = dealsByStage[stage.key].find((d) => d.id === active.id);
      if (deal) {
        setActiveDeal(deal);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    // Check if dropped over a column (stage) or over another deal
    let targetStage: DealStage | undefined;

    // If dropped over a column directly
    if (STAGES.find(s => s.key === over.id)) {
      targetStage = over.id as DealStage;
    } else {
      // If dropped over another deal, find which column that deal is in
      for (const stage of STAGES) {
        if (dealsByStage[stage.key].find((d) => d.id === over.id)) {
          targetStage = stage.key;
          break;
        }
      }
    }

    // If no target stage found, exit
    if (!targetStage) return;

    // Find which stage the deal is currently in
    let currentStage: DealStage | null = null;
    for (const stage of STAGES) {
      if (dealsByStage[stage.key].find((d) => d.id === dealId)) {
        currentStage = stage.key;
        break;
      }
    }

    if (currentStage && currentStage !== targetStage) {
      // Optimistically update UI
      dispatch(moveDealToStage({ dealId, fromStage: currentStage, toStage: targetStage }));

      try {
        await dispatch(updateDealStage({ id: dealId, stage: targetStage })).unwrap();
        dispatch(addNotification({ type: 'success', title: 'Deal stage updated' }));
      } catch (error) {
        // Revert on error
        dispatch(fetchDealsByStage());
        dispatch(addNotification({ type: 'error', title: 'Failed to update deal stage' }));
      }
    }
  };

  const getStageValue = (stage: DealStage): number => {
    return dealsByStage[stage].reduce((sum, deal) => sum + (deal.amount || 0), 0);
  };

  return (
    <div className="h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deals Pipeline</h1>
          <p className="text-slate-500">Drag and drop to update deal stages</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<List className="w-4 h-4" />}
            onClick={() => navigate('/deals/list')}
          >
            List View
          </Button>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'deal', mode: 'create' }))}
          >
            Add Deal
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <DroppableColumn
              key={stage.key}
              stage={stage.key}
              label={stage.label}
              color={stage.color}
              deals={dealsByStage[stage.key]}
              totalValue={getStageValue(stage.key)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal && <DealCard deal={activeDeal} isDragging />}
        </DragOverlay>
      </DndContext>

      <DealModal
        isOpen={modal.type === 'deal'}
        onClose={() => dispatch(openModal({ type: null, mode: null }))}
        mode={modal.mode}
        deal={modal.data}
      />
    </div>
  );
};

export default DealKanban;

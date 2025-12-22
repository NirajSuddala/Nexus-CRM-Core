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
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, List } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchDealsByStage, updateDealStage, moveDealToStage } from '../../features/dealsSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { subscribeToDealUpdates, unsubscribeFromDealUpdates } from '../../services/socket';
import { Button } from '../../components/ui';
import { Deal, DealStage } from '../../types';
import DealCard from './DealCard';
import DealModal from './DealModal';

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
  const { dealsByStage, isLoading } = useAppSelector((state) => state.deals);
  const { modal } = useAppSelector((state) => state.ui);
  const [activeId, setActiveId] = React.useState<string | null>(null);
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
    subscribeToDealUpdates((data) => {
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
    const targetStage = over.id as DealStage;

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
            <div
              key={stage.key}
              id={stage.key}
              className="flex-shrink-0 w-72 bg-slate-100 rounded-lg flex flex-col"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                  <h3 className="font-semibold text-slate-900">{stage.label}</h3>
                  <span className="ml-auto text-sm text-slate-500">
                    {dealsByStage[stage.key].length}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {formatCurrency(getStageValue(stage.key))}
                </p>
              </div>

              {/* Deals List */}
              <SortableContext
                items={dealsByStage[stage.key].map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className="flex-1 p-2 space-y-2 overflow-y-auto"
                  data-stage={stage.key}
                >
                  {dealsByStage[stage.key].map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onClick={() => navigate(`/deals/${deal.id}`)}
                    />
                  ))}

                  {/* Drop zone indicator when empty */}
                  {dealsByStage[stage.key].length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                      Drop deals here
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
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

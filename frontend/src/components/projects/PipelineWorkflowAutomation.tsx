import React, { useState } from 'react';
import { Zap, CheckCircle, ArrowRight, Settings, Play } from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { updateMilestone } from '../../features/projectsSlice';
import { addNotification } from '../../features/uiSlice';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '../ui';

interface PipelineWorkflowAutomationProps {
  projectId: string;
  milestones: any[];
  stages: any[];
  currentStageIndex: number;
  onRefresh: () => void;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: 'stage_change' | 'milestone_complete' | 'all_milestones';
  action: 'complete_milestone' | 'advance_stage' | 'notify';
  enabled: boolean;
}

const DEFAULT_RULES: WorkflowRule[] = [
  {
    id: 'rule-1',
    name: 'Auto-complete milestone on stage advance',
    description: 'When project moves to next stage, mark the corresponding milestone as completed',
    trigger: 'stage_change',
    action: 'complete_milestone',
    enabled: true,
  },
  {
    id: 'rule-2',
    name: 'Sync milestones with stages',
    description: 'Keep milestone progress in sync with pipeline stage progress',
    trigger: 'stage_change',
    action: 'complete_milestone',
    enabled: true,
  },
];

const PipelineWorkflowAutomation: React.FC<PipelineWorkflowAutomationProps> = ({
  projectId,
  milestones,
  stages,
  currentStageIndex,
  onRefresh,
}) => {
  const dispatch = useAppDispatch();
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rules, setRules] = useState<WorkflowRule[]>(DEFAULT_RULES);

  const sortedStages = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedMilestones = [...milestones].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Handle case when currentStageIndex is -1 (no stage selected yet)
  const effectiveStageIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  // Sync milestones with current stage
  const syncMilestonesWithStage = async () => {
    if (sortedMilestones.length === 0 || sortedStages.length === 0) return;

    setIsRunning(true);
    let completedCount = 0;

    try {
      // Calculate how many milestones should be completed based on stage progress
      const milestonesPerStage = sortedMilestones.length / sortedStages.length;
      const targetCompletedMilestones = Math.floor((effectiveStageIndex + 1) * milestonesPerStage);

      // Complete milestones up to the target
      for (let i = 0; i < targetCompletedMilestones && i < sortedMilestones.length; i++) {
        const milestone = sortedMilestones[i];
        if (milestone.status !== 'completed') {
          await dispatch(updateMilestone({
            projectId,
            milestoneId: milestone.id,
            data: { status: 'completed' }
          })).unwrap();
          completedCount++;
        }
      }

      if (completedCount > 0) {
        dispatch(addNotification({
          type: 'success',
          title: 'Workflow Executed',
          message: `Completed ${completedCount} milestone(s) based on pipeline stage`
        }));
        onRefresh();
      } else {
        dispatch(addNotification({
          type: 'info',
          title: 'Already in sync',
          message: 'Milestones are already synced with pipeline stage'
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Workflow failed',
        message: 'Failed to sync milestones with pipeline stage'
      }));
    } finally {
      setIsRunning(false);
    }
  };

  // Complete all milestones up to current stage
  const completeUpToStage = async () => {
    if (sortedMilestones.length === 0) return;

    setIsRunning(true);
    let completedCount = 0;

    try {
      // Complete milestones proportional to stage progress
      const progressRatio = (effectiveStageIndex + 1) / sortedStages.length;
      const targetIndex = Math.floor(progressRatio * sortedMilestones.length);

      for (let i = 0; i < targetIndex; i++) {
        const milestone = sortedMilestones[i];
        if (milestone.status !== 'completed') {
          await dispatch(updateMilestone({
            projectId,
            milestoneId: milestone.id,
            data: { status: 'completed' }
          })).unwrap();
          completedCount++;
        }
      }

      if (completedCount > 0) {
        dispatch(addNotification({
          type: 'success',
          title: 'Milestones Updated',
          message: `Marked ${completedCount} milestone(s) as completed`
        }));
        onRefresh();
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Update failed'
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  // Calculate sync status
  const completedMilestones = sortedMilestones.filter(m => m.status === 'completed').length;
  const expectedCompleted = Math.floor(((effectiveStageIndex + 1) / sortedStages.length) * sortedMilestones.length);
  const isInSync = completedMilestones >= expectedCompleted;

  if (stages.length === 0 || milestones.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Workflow Automation
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Sync Status */}
        <div className={`p-3 rounded-lg mb-4 ${isInSync ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isInSync ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Zap className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <span className={`font-medium ${isInSync ? 'text-green-700' : 'text-amber-700'}`}>
                  {isInSync ? 'In Sync' : 'Out of Sync'}
                </span>
                <p className="text-sm text-slate-600">
                  {completedMilestones}/{sortedMilestones.length} milestones completed
                  {!isInSync && ` (expected: ${expectedCompleted})`}
                </p>
              </div>
            </div>
            {!isInSync && (
              <Button
                size="sm"
                onClick={syncMilestonesWithStage}
                isLoading={isRunning}
                leftIcon={<Play className="w-4 h-4" />}
              >
                Sync Now
              </Button>
            )}
          </div>
        </div>

        {/* Visual Pipeline-Milestone Mapping */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Stage-Milestone Mapping</h4>
          <div className="space-y-2">
            {sortedStages.map((stage, stageIndex) => {
              const stageStart = Math.floor((stageIndex / sortedStages.length) * sortedMilestones.length);
              const stageEnd = Math.floor(((stageIndex + 1) / sortedStages.length) * sortedMilestones.length);
              const stageMilestones = sortedMilestones.slice(stageStart, stageEnd);
              const isCurrentStage = stageIndex === effectiveStageIndex;
              const isCompletedStage = stageIndex < effectiveStageIndex;

              return (
                <div
                  key={stage.id}
                  className={`p-2 rounded-lg border transition-colors ${
                    isCurrentStage
                      ? 'border-primary-300 bg-primary-50'
                      : isCompletedStage
                      ? 'border-green-200 bg-green-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCompletedStage
                          ? 'bg-green-500 text-white'
                          : isCurrentStage
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-300 text-slate-600'
                      }`}
                    >
                      {isCompletedStage ? <CheckCircle className="w-4 h-4" /> : stageIndex + 1}
                    </div>
                    <span className={`text-sm font-medium ${isCurrentStage ? 'text-primary-700' : 'text-slate-700'}`}>
                      {stage.name}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-1">
                      {stageMilestones.length > 0 ? (
                        stageMilestones.map((m: any) => (
                          <Badge
                            key={m.id}
                            variant={m.status === 'completed' ? 'success' : 'default'}
                            className="text-xs"
                          >
                            {m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No milestones</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={completeUpToStage}
            isLoading={isRunning}
            disabled={isInSync}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Complete Up to Stage
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Automation Rules</h4>
            <div className="space-y-2">
              {rules.map((rule) => (
                <label
                  key={rule.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRule(rule.id)}
                    className="mt-1 w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-slate-900">{rule.name}</span>
                    <p className="text-sm text-slate-500">{rule.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PipelineWorkflowAutomation;

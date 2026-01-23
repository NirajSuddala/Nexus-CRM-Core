import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Clock, Plus, Edit, Trash2, ArrowRight, FileText, Ticket } from 'lucide-react';
import api from '../../services/api';
import { Activity, EntityType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui';

interface ActivityFeedProps {
  entityType: EntityType;
  entityId: string;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'created':
      return <Plus className="w-4 h-4 text-green-500" />;
    case 'updated':
      return <Edit className="w-4 h-4 text-blue-500" />;
    case 'deleted':
      return <Trash2 className="w-4 h-4 text-red-500" />;
    case 'stage_changed':
      return <ArrowRight className="w-4 h-4 text-purple-500" />;
    case 'note_added':
      return <FileText className="w-4 h-4 text-amber-500" />;
    case 'ticket_created':
      return <Ticket className="w-4 h-4 text-orange-500" />;
    default:
      return <Clock className="w-4 h-4 text-slate-400" />;
  }
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ entityType, entityId }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Build params based on entity type
        const params: Record<string, string | number> = {
          range: 'last90days',
          limit: 20,
        };

        // Pass the specific entity ID so backend can filter properly
        if (entityType === 'contact') {
          params.contactId = entityId;
        } else if (entityType === 'company') {
          params.companyId = entityId;
        } else if (entityType === 'deal') {
          params.dealId = entityId;
        }

        const response = await api.get('/reports/activity-log', { params });
        // Backend already filters by contactId/companyId, so use all results
        setActivities(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [entityType, entityId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No activity yet</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200"></div>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-3 pl-8">
                  <div className="absolute left-2 w-4 h-4 bg-white flex items-center justify-center">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{activity.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;

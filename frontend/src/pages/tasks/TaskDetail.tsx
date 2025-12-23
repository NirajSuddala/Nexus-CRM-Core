import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Calendar, User, Briefcase, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchTask, deleteTask, updateTask, clearCurrentTask } from '../../features/tasksSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal, getTaskPriorityBadgeVariant, getTaskStatusBadgeVariant } from '../../components/ui';
import TaskModal from './TaskModal';

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTask, isLoading } = useAppSelector((state) => state.tasks);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchTask(id));
    return () => { dispatch(clearCurrentTask()); };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteTask(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Task deleted' }));
      navigate('/tasks');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete' }));
    }
    setShowDeleteModal(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      await dispatch(updateTask({ id, data: { status: newStatus as any } })).unwrap();
      dispatch(addNotification({ type: 'success', title: `Task marked as ${newStatus.replace('_', ' ')}` }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to update status' }));
    }
  };

  if (isLoading || !currentTask) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  const isOverdue = currentTask.dueDate && currentTask.status !== 'completed' && new Date(currentTask.dueDate) < new Date(new Date().toDateString());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/tasks')} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${currentTask.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'}`}>
              <CheckSquare className={`w-6 h-6 ${currentTask.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-bold ${currentTask.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{currentTask.title}</h1>
                <Badge variant={getTaskStatusBadgeVariant(currentTask.status)}>{currentTask.status.replace('_', ' ')}</Badge>
                <Badge variant={getTaskPriorityBadgeVariant(currentTask.priority)}>{currentTask.priority}</Badge>
              </div>
              {currentTask.dueDate && (
                <p className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                  <Calendar className="w-4 h-4" />Due {format(new Date(currentTask.dueDate), 'MMMM d, yyyy')}
                  {isOverdue && ' (Overdue)'}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentTask.status !== 'completed' && (
            <Button variant="secondary" onClick={() => handleStatusChange('completed')}>Mark Complete</Button>
          )}
          {currentTask.status === 'completed' && (
            <Button variant="outline" onClick={() => handleStatusChange('open')}>Reopen</Button>
          )}
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'task', mode: 'edit', data: currentTask }))}>Edit</Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Task Details</CardTitle></CardHeader>
            <CardContent>
              {currentTask.description ? (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Description</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{currentTask.description}</p>
                </div>
              ) : null}
              <dl className="grid grid-cols-2 gap-4">
                <div><dt className="text-sm text-slate-500">Due Date</dt><dd className="mt-1 flex items-center gap-1"><Calendar className="w-4 h-4 text-slate-400" />{currentTask.dueDate ? format(new Date(currentTask.dueDate), 'MMM d, yyyy') : '-'}</dd></div>
                <div><dt className="text-sm text-slate-500">Priority</dt><dd className="mt-1"><Badge variant={getTaskPriorityBadgeVariant(currentTask.priority)}>{currentTask.priority}</Badge></dd></div>
                <div><dt className="text-sm text-slate-500">Status</dt><dd className="mt-1"><Badge variant={getTaskStatusBadgeVariant(currentTask.status)}>{currentTask.status.replace('_', ' ')}</Badge></dd></div>
                <div><dt className="text-sm text-slate-500">Created</dt><dd className="mt-1">{format(new Date(currentTask.createdAt), 'MMM d, yyyy')}</dd></div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Related Records</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentTask.contact && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Contact</h4>
                    <Link to={`/contacts/${currentTask.contact.id}`} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                      <User className="w-5 h-5 text-slate-400" />
                      <span className="font-medium text-slate-900">{currentTask.contact.fullName}</span>
                    </Link>
                  </div>
                )}
                {currentTask.deal && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Deal</h4>
                    <Link to={`/deals/${currentTask.deal.id}`} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                      <Briefcase className="w-5 h-5 text-slate-400" />
                      <span className="font-medium text-slate-900">{currentTask.deal.name}</span>
                    </Link>
                  </div>
                )}
                {!currentTask.contact && !currentTask.deal && <p className="text-slate-500">No related records</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {currentTask.status === 'open' && <Button className="w-full" variant="secondary" onClick={() => handleStatusChange('in_progress')}>Start Working</Button>}
              {currentTask.status === 'in_progress' && <Button className="w-full" variant="secondary" onClick={() => handleStatusChange('completed')}>Complete</Button>}
              {currentTask.status === 'completed' && <Button className="w-full" variant="outline" onClick={() => handleStatusChange('open')}>Reopen Task</Button>}
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskModal isOpen={modal.type === 'task'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode} task={modal.data} />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete}
        title="Delete Task" message={`Are you sure you want to delete "${currentTask.title}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default TaskDetail;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckSquare, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchTasks, updateTask } from '../../features/tasksSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { Button, Input, Select, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination, Badge, getTaskPriorityBadgeVariant, getTaskStatusBadgeVariant } from '../../components/ui';
import TaskModal from './TaskModal';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const TaskList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tasks, pagination, isLoading } = useAppSelector((state) => state.tasks);
  const { modal } = useAppSelector((state) => state.ui);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchTasks({ page, limit: 20, search: search || undefined, status: status || undefined, priority: priority || undefined }));
  }, [dispatch, page, search, status, priority]);

  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    try {
      await dispatch(updateTask({ id: taskId, data: { status: newStatus } })).unwrap();
      dispatch(addNotification({ type: 'success', title: `Task marked as ${newStatus.replace('_', ' ')}` }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to update task' }));
    }
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Tasks</h1><p className="text-slate-500">Manage your tasks</p></div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => dispatch(openModal({ type: 'task', mode: 'create' }))}>Add Task</Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-4">
            <div className="flex-1 max-w-md"><Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} /></div>
            <Select options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            <Select options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader className="w-12"></TableHeader>
              <TableHeader>Task</TableHeader>
              <TableHeader>Related To</TableHeader>
              <TableHeader>Due Date</TableHeader>
              <TableHeader>Priority</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : tasks.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No tasks found</TableCell></TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id} clickable onClick={() => navigate(`/tasks/${task.id}`)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleToggleComplete(task.id, task.status)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-primary-500'}`}>
                      {task.status === 'completed' && <CheckSquare className="w-3 h-3 text-white" />}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className={`font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.name}</p>
                      {task.description && <p className="text-sm text-slate-500 truncate max-w-xs">{task.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.contact?.fullName || task.deal?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isOverdue(task.dueDate, task.status) && <AlertCircle className="w-4 h-4 text-red-500" />}
                      <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : ''}>
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getTaskPriorityBadgeVariant(task.priority)}>{task.priority}</Badge></TableCell>
                  <TableCell><Badge variant={getTaskStatusBadgeVariant(task.status)}>{task.status.replace('_', ' ')}</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && <Pagination page={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={setPage} />}
      </Card>

      <TaskModal
        isOpen={modal.type === 'task'}
        onClose={() => dispatch(openModal({ type: null, mode: null }))}
        mode={modal.mode}
        task={modal.mode === 'edit' ? modal.data : null}
        initialData={modal.mode === 'create' ? modal.data : null}
      />
    </div>
  );
};

export default TaskList;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchProjects } from '../../features/projectsSlice';
import { openModal } from '../../features/uiSlice';
import { Button, Input, Select, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination, Badge } from '../../components/ui';
import ProjectModal from './ProjectModal';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (status) {
    case 'planning': return 'default';
    case 'in_progress': return 'info';
    case 'on_hold': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'danger';
    default: return 'default';
  }
};

const ProjectList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { projects, pagination, isLoading } = useAppSelector((state) => state.projects);
  const { modal } = useAppSelector((state) => state.ui);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchProjects({ page, limit: 20, search: search || undefined, status: status || undefined }));
  }, [dispatch, page, search, status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500">Manage client delivery projects</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => dispatch(openModal({ type: 'project', mode: 'create' }))}>
          New Project
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-4">
            <div className="flex-1 max-w-md">
              <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
            </div>
            <Select options={STATUS_OPTIONS} value={status} onChange={setStatus} />
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Project</TableHeader>
              <TableHeader>Company</TableHeader>
              <TableHeader>Progress</TableHeader>
              <TableHeader>Target Date</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : projects.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No projects found</TableCell></TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} clickable onClick={() => navigate(`/projects/${project.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <FolderKanban className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{project.name}</p>
                        {project.description && <p className="text-sm text-slate-500 truncate max-w-xs">{project.description}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{project.company?.name || '-'}</TableCell>
                  <TableCell>
                    <div className="w-full max-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-sm text-slate-600">{project.progress}%</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {project.targetEndDate ? format(new Date(project.targetEndDate), 'MMM d, yyyy') : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && <Pagination page={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={setPage} />}
      </Card>

      <ProjectModal isOpen={modal.type === 'project'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode === 'view' ? 'edit' : modal.mode} project={modal.data} />
    </div>
  );
};

export default ProjectList;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, Phone, Building2, Briefcase, Edit, Trash2, Plus, FileText, CheckSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchContact, deleteContact, clearCurrentContact } from '../../features/contactsSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { notesApi } from '../../services/api';
import {
  Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal, Textarea,
  getLifecycleBadgeVariant, getDealStageBadgeVariant, getTaskStatusBadgeVariant
} from '../../components/ui';
import ContactModal from './ContactModal';
import TaskModal from '../tasks/TaskModal';
import ActivityFeed from '../../components/activity/ActivityFeed';

const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentContact, activities, notes, isLoading } = useAppSelector((state) => state.contacts);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchContact(id));
    }
    return () => {
      dispatch(clearCurrentContact());
    };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteContact(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Contact deleted successfully' }));
      navigate('/contacts');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete contact' }));
    }
    setShowDeleteModal(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setIsAddingNote(true);
    try {
      await notesApi.create({ content: newNote, entityType: 'contact', entityId: id });
      dispatch(addNotification({ type: 'success', title: 'Note added' }));
      setNewNote('');
      dispatch(fetchContact(id));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to add note' }));
    }
    setIsAddingNote(false);
  };

  if (isLoading || !currentContact) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/contacts')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentContact.fullName}</h1>
                <Badge variant={getLifecycleBadgeVariant(currentContact.lifecycleStage)}>
                  {currentContact.lifecycleStage.toUpperCase()}
                </Badge>
              </div>
              {currentContact.jobTitle && <p className="text-slate-500">{currentContact.jobTitle}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'task', mode: 'create', data: { contactId: currentContact.id } }))}>
            Add Task
          </Button>
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'contact', mode: 'edit', data: currentContact }))}>
            Edit
          </Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">Email</dt>
                  <dd className="mt-1">
                    {currentContact.email ? (
                      <a href={`mailto:${currentContact.email}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <Mail className="w-4 h-4" />{currentContact.email}
                      </a>
                    ) : <span className="text-slate-400">-</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Phone</dt>
                  <dd className="mt-1">
                    {currentContact.phone ? (
                      <span className="flex items-center gap-1"><Phone className="w-4 h-4 text-slate-400" />{currentContact.phone}</span>
                    ) : <span className="text-slate-400">-</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Company</dt>
                  <dd className="mt-1">
                    {currentContact.company ? (
                      <Link to={`/companies/${currentContact.company.id}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <Building2 className="w-4 h-4" />{currentContact.company.name}
                      </Link>
                    ) : <span className="text-slate-400">-</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Job Title</dt>
                  <dd className="mt-1 flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {currentContact.jobTitle || '-'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Quick Actions - Log Note */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Log Note</CardTitle></CardHeader>
            <CardContent>
              <Textarea placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} />
              <div className="flex justify-end mt-3">
                <Button onClick={handleAddNote} isLoading={isAddingNote} disabled={!newNote.trim()}>Save Note</Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {notes.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Notes ({notes.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-slate-500 mt-2">{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckSquare className="w-5 h-5" />Tasks</CardTitle>
              <Button size="sm" variant="outline" leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => dispatch(openModal({ type: 'task', mode: 'create', data: { contactId: currentContact.id } }))}>Add</Button>
            </CardHeader>
            <CardContent>
              {currentContact.tasks?.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No tasks yet</p>
              ) : (
                <div className="space-y-2">
                  {currentContact.tasks?.map((task) => (
                    <Link key={task.id} to={`/tasks/${task.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-900">{task.name}</p>
                        <p className="text-sm text-slate-500">{task.dueDate && format(new Date(task.dueDate), 'MMM d')}</p>
                      </div>
                      <Badge variant={getTaskStatusBadgeVariant(task.status)}>{task.status.replace('_', ' ')}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div><ActivityFeed entityType="contact" entityId={currentContact.id} /></div>
      </div>

      <ContactModal isOpen={modal.type === 'contact'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode} contact={modal.data} />
      <TaskModal
        isOpen={modal.type === 'task'}
        onClose={() => dispatch(openModal({ type: null, mode: null }))}
        mode={modal.mode}
        task={modal.mode === 'edit' ? modal.data : null}
        initialData={modal.mode === 'create' ? modal.data : null}
      />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete}
        title="Delete Contact" message={`Are you sure you want to delete "${currentContact.fullName}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default ContactDetail;

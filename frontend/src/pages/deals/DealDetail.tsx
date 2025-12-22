import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, DollarSign, Calendar, Percent, Building2, User, Edit, Trash2, Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchDeal, deleteDeal, clearCurrentDeal } from '../../features/dealsSlice';
import { openModal, addNotification } from '../../features/uiSlice';
import { notesApi } from '../../services/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal, Textarea, getDealStageBadgeVariant } from '../../components/ui';
import DealModal from './DealModal';
import ActivityFeed from '../../components/activity/ActivityFeed';

const DealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentDeal, activities, notes, isLoading } = useAppSelector((state) => state.deals);
  const { modal } = useAppSelector((state) => state.ui);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchDeal(id));
    return () => { dispatch(clearCurrentDeal()); };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dispatch(deleteDeal(id)).unwrap();
      dispatch(addNotification({ type: 'success', title: 'Deal deleted' }));
      navigate('/deals');
    } catch (error: any) {
      dispatch(addNotification({ type: 'error', title: error || 'Failed to delete' }));
    }
    setShowDeleteModal(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setIsAddingNote(true);
    try {
      await notesApi.create({ content: newNote, entityType: 'deal', entityId: id });
      dispatch(addNotification({ type: 'success', title: 'Note added' }));
      setNewNote('');
      dispatch(fetchDeal(id));
    } catch (error) {
      dispatch(addNotification({ type: 'error', title: 'Failed to add note' }));
    }
    setIsAddingNote(false);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  if (isLoading || !currentDeal) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/deals')} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Briefcase className="w-6 h-6 text-green-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentDeal.name}</h1>
                <Badge variant={getDealStageBadgeVariant(currentDeal.stage)}>{currentDeal.stage.replace('_', ' ')}</Badge>
              </div>
              <p className="text-lg font-semibold text-slate-600">{formatCurrency(currentDeal.amount)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'task', mode: 'create', data: { dealId: currentDeal.id } }))}>Add Task</Button>
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => dispatch(openModal({ type: 'deal', mode: 'edit', data: currentDeal }))}>Edit</Button>
          <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Deal Information</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div><dt className="text-sm text-slate-500">Amount</dt><dd className="mt-1 flex items-center gap-1"><DollarSign className="w-4 h-4 text-slate-400" />{formatCurrency(currentDeal.amount)}</dd></div>
                <div><dt className="text-sm text-slate-500">Probability</dt><dd className="mt-1 flex items-center gap-1"><Percent className="w-4 h-4 text-slate-400" />{currentDeal.probability}%</dd></div>
                <div><dt className="text-sm text-slate-500">Close Date</dt><dd className="mt-1 flex items-center gap-1"><Calendar className="w-4 h-4 text-slate-400" />{currentDeal.closeDate ? format(new Date(currentDeal.closeDate), 'MMM d, yyyy') : '-'}</dd></div>
                <div><dt className="text-sm text-slate-500">Created</dt><dd className="mt-1">{format(new Date(currentDeal.createdAt), 'MMM d, yyyy')}</dd></div>
                <div><dt className="text-sm text-slate-500">Company</dt><dd className="mt-1">
                  {currentDeal.company ? <Link to={`/companies/${currentDeal.company.id}`} className="flex items-center gap-1 text-primary-600 hover:underline"><Building2 className="w-4 h-4" />{currentDeal.company.name}</Link> : <span className="text-slate-400">-</span>}
                </dd></div>
                <div><dt className="text-sm text-slate-500">Contact</dt><dd className="mt-1">
                  {currentDeal.contact ? <Link to={`/contacts/${currentDeal.contact.id}`} className="flex items-center gap-1 text-primary-600 hover:underline"><User className="w-4 h-4" />{currentDeal.contact.fullName}</Link> : <span className="text-slate-400">-</span>}
                </dd></div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Log Note</CardTitle></CardHeader>
            <CardContent>
              <Textarea placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} />
              <div className="flex justify-end mt-3"><Button onClick={handleAddNote} isLoading={isAddingNote} disabled={!newNote.trim()}>Save Note</Button></div>
            </CardContent>
          </Card>

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
        </div>

        <div><ActivityFeed entityType="deal" entityId={currentDeal.id} /></div>
      </div>

      <DealModal isOpen={modal.type === 'deal'} onClose={() => dispatch(openModal({ type: null, mode: null }))} mode={modal.mode} deal={modal.data} />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete}
        title="Delete Deal" message={`Are you sure you want to delete "${currentDeal.name}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default DealDetail;

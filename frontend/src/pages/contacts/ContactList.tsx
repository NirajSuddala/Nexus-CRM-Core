import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, User, Mail, Phone } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchContacts } from '../../features/contactsSlice';
import { openModal } from '../../features/uiSlice';
import {
  Button,
  Input,
  Select,
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Pagination,
  Badge,
  getLifecycleBadgeVariant,
} from '../../components/ui';
import ContactModal from './ContactModal';

const LIFECYCLE_OPTIONS = [
  { value: '', label: 'All Stages' },
  { value: 'lead', label: 'Lead' },
  { value: 'mql', label: 'MQL' },
  { value: 'sql', label: 'SQL' },
  { value: 'customer', label: 'Customer' },
];

const ContactList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { contacts, pagination, isLoading } = useAppSelector((state) => state.contacts);
  const { modal } = useAppSelector((state) => state.ui);
  const [search, setSearch] = useState('');
  const [lifecycleStage, setLifecycleStage] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchContacts({
      page,
      limit: 20,
      search: search || undefined,
      lifecycleStage: lifecycleStage || undefined,
    }));
  }, [dispatch, page, search, lifecycleStage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500">Manage your contact records</p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => dispatch(openModal({ type: 'contact', mode: 'create' }))}
        >
          Add Contact
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              options={LIFECYCLE_OPTIONS}
              value={lifecycleStage}
              onChange={setLifecycleStage}
            />
          </form>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Contact</TableHeader>
              <TableHeader>Company</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Phone</TableHeader>
              <TableHeader>Stage</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  clickable
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{contact.fullName}</p>
                        {contact.jobTitle && (
                          <p className="text-sm text-slate-500">{contact.jobTitle}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{contact.company?.name || '-'}</TableCell>
                  <TableCell>
                    {contact.email ? (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {contact.phone ? (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getLifecycleBadgeVariant(contact.lifecycleStage)}>
                      {contact.lifecycleStage.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && (
          <Pagination
            page={page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={setPage}
          />
        )}
      </Card>

      <ContactModal
        isOpen={modal.type === 'contact'}
        onClose={() => dispatch(openModal({ type: null, mode: null }))}
        mode={modal.mode}
        contact={modal.data}
      />
    </div>
  );
};

export default ContactList;

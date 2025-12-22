import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, ExternalLink } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchCompanies } from '../../features/companiesSlice';
import { openModal } from '../../features/uiSlice';
import {
  Button,
  Input,
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Pagination,
} from '../../components/ui';
import CompanyModal from './CompanyModal';

const CompanyList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { companies, pagination, isLoading } = useAppSelector((state) => state.companies);
  const { modal } = useAppSelector((state) => state.ui);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchCompanies({ page, limit: 20, search: search || undefined }));
  }, [dispatch, page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    dispatch(fetchCompanies({ page: 1, limit: 20, search: search || undefined }));
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-slate-500">Manage your company records</p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => dispatch(openModal({ type: 'company', mode: 'create' }))}
        >
          Add Company
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Company</TableHeader>
              <TableHeader>Industry</TableHeader>
              <TableHeader>Revenue</TableHeader>
              <TableHeader>Contacts</TableHeader>
              <TableHeader>Deals</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow
                  key={company.id}
                  clickable
                  onClick={() => navigate(`/companies/${company.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{company.name}</p>
                        {company.domain && (
                          <a
                            href={company.domain.startsWith('http') ? company.domain : `https://${company.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {company.domain}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{company.industry || '-'}</TableCell>
                  <TableCell>{formatCurrency(company.revenue)}</TableCell>
                  <TableCell>{company.contacts?.length || 0}</TableCell>
                  <TableCell>{company.deals?.length || 0}</TableCell>
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

      <CompanyModal
        isOpen={modal.type === 'company'}
        onClose={() => dispatch(openModal({ type: null, mode: null }))}
        mode={modal.mode}
        company={modal.data}
      />
    </div>
  );
};

export default CompanyList;

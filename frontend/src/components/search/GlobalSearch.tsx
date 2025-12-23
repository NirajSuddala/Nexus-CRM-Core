import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Building2, Users, Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { searchApi } from '../../services/api';
import { SearchResults } from '../../types';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await searchApi.global(searchQuery, 'all', 5);
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // This would need to be handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  const handleSelect = (type: string, id: string) => {
    onClose();
    navigate(`/${type}/${id}`);
  };

  if (!isOpen) return null;

  const hasResults =
    results &&
    (results.companies.length > 0 ||
      results.contacts.length > 0 ||
      results.deals.length > 0 ||
      results.tasks.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-slate-200">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies, contacts, deals, tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 py-4 text-lg outline-none"
              autoFocus
            />
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            ) : query ? (
              <button onClick={() => setQuery('')}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            ) : null}
          </div>

          {/* Results */}
          {query.length >= 2 && (
            <div className="max-h-[400px] overflow-y-auto">
              {hasResults ? (
                <div className="p-2">
                  {/* Companies */}
                  {results?.companies.length > 0 && (
                    <div className="mb-4">
                      <p className="px-3 py-1 text-xs font-medium text-slate-500 uppercase">
                        Companies
                      </p>
                      {results.companies.map((company) => (
                        <button
                          key={company.id}
                          onClick={() => handleSelect('companies', company.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-100 rounded-lg"
                        >
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {company.name}
                            </p>
                            {company.industry && (
                              <p className="text-xs text-slate-500">{company.industry}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Contacts */}
                  {results?.contacts.length > 0 && (
                    <div className="mb-4">
                      <p className="px-3 py-1 text-xs font-medium text-slate-500 uppercase">
                        Contacts
                      </p>
                      {results.contacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => handleSelect('contacts', contact.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-100 rounded-lg"
                        >
                          <Users className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {contact.fullName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {contact.email} {contact.company && `• ${contact.company.name}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Deals */}
                  {results?.deals.length > 0 && (
                    <div className="mb-4">
                      <p className="px-3 py-1 text-xs font-medium text-slate-500 uppercase">
                        Deals
                      </p>
                      {results.deals.map((deal) => (
                        <button
                          key={deal.id}
                          onClick={() => handleSelect('deals', deal.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-100 rounded-lg"
                        >
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {deal.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {deal.amount && `$${deal.amount.toLocaleString()}`}{' '}
                              {deal.company && `• ${deal.company.name}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tasks */}
                  {results?.tasks.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-xs font-medium text-slate-500 uppercase">
                        Tasks
                      </p>
                      {results.tasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => handleSelect('tasks', task.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-100 rounded-lg"
                        >
                          <CheckSquare className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {task.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {task.status} • {task.priority} priority
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500">
                  {isLoading ? 'Searching...' : 'No results found'}
                </div>
              )}
            </div>
          )}

          {/* Keyboard hints */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-4 text-xs text-slate-500">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 mr-1">↵</kbd>
              to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 mr-1">esc</kbd>
              to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;

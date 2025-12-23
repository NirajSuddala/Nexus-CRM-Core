import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';

// Layout
import Layout from './components/layout/Layout';

// Main Pages
import Dashboard from './pages/Dashboard';
import CompanyList from './pages/companies/CompanyList';
import CompanyDetail from './pages/companies/CompanyDetail';
import ContactList from './pages/contacts/ContactList';
import ContactDetail from './pages/contacts/ContactDetail';
import DealKanban from './pages/deals/DealKanban';
import DealList from './pages/deals/DealList';
import DealDetail from './pages/deals/DealDetail';
import TaskList from './pages/tasks/TaskList';
import TaskDetail from './pages/tasks/TaskDetail';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* All routes accessible in demo mode */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />

        {/* Companies */}
        <Route path="companies" element={<CompanyList />} />
        <Route path="companies/:id" element={<CompanyDetail />} />

        {/* Contacts */}
        <Route path="contacts" element={<ContactList />} />
        <Route path="contacts/:id" element={<ContactDetail />} />

        {/* Deals */}
        <Route path="deals" element={<DealKanban />} />
        <Route path="deals/list" element={<DealList />} />
        <Route path="deals/:id" element={<DealDetail />} />

        {/* Tasks */}
        <Route path="tasks" element={<TaskList />} />
        <Route path="tasks/:id" element={<TaskDetail />} />

        {/* Reports */}
        <Route path="reports/*" element={<Reports />} />

        {/* Settings */}
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
};

export default App;

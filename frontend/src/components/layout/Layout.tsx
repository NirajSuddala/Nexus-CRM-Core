import React from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppSelector } from '../../hooks/useAppDispatch';

const Layout: React.FC = () => {
  const { sidebarOpen } = useAppSelector((state) => state.ui);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className={clsx(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

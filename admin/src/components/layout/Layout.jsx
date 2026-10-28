import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const getPageTitle = (pathname) => {
  if (pathname.startsWith('/dashboard')) return 'Dashboard Overview';
  if (pathname.startsWith('/leads')) return 'Lead Management (Basic Enquiries)';
  if (pathname.startsWith('/clients')) return 'Real Client Management';
  if (pathname.startsWith('/projects')) return 'Project Management';
  if (pathname.startsWith('/quotations')) return 'Quotation & Pricing';
  if (pathname.startsWith('/payments')) return 'Payment Management';
  if (pathname.startsWith('/materials')) return 'Materials & Equipment';
  if (pathname.startsWith('/documents')) return 'Documents & Site Photos';
  if (pathname.startsWith('/warranty')) return 'Warranty & Service';
  if (pathname.startsWith('/commissions')) return 'Referral & Commission';
  if (pathname.startsWith('/reports')) return 'Reports & Analytics';
  if (pathname.startsWith('/users')) return 'User & Staff Management';
  return 'Solar CRM Dashboard';
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-68">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} pageTitle={pageTitle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

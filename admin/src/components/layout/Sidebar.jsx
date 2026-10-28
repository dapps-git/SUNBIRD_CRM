import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Sun,
  FileSpreadsheet,
  CreditCard,
  Boxes,
  FolderOpen,
  ShieldCheck,
  Award,
  BarChart3,
  UserCog,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, perm: null },
  { name: 'Lead Management', path: '/leads', icon: UserPlus, perm: 'leads' },
  { name: 'Real Client Management', path: '/clients', icon: Users, perm: 'clients' },
  { name: 'Project Management', path: '/projects', icon: Sun, perm: 'projects' },
  { name: 'Quotation & Pricing', path: '/quotations', icon: FileSpreadsheet, perm: 'quotations' },
  { name: 'Payment Management', path: '/payments', icon: CreditCard, perm: 'payments' },
  { name: 'Materials & Equipment', path: '/materials', icon: Boxes, perm: 'materials' },
  { name: 'Documents & Site Photos', path: '/documents', icon: FolderOpen, perm: 'documents' },
  { name: 'Warranty & Service', path: '/warranty', icon: ShieldCheck, perm: 'warranty' },
  { name: 'Referral & Commission', path: '/commissions', icon: Award, perm: 'commissions' },
  { name: 'Reports', path: '/reports', icon: BarChart3, perm: 'reports' },
  { name: 'User Management', path: '/users', icon: UserCog, perm: 'users' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { hasPermission, isAdmin } = useAuth();

  const filteredNavItems = navigationItems.filter((item) => {
    if (!item.perm) return true;
    if (isAdmin) return true;
    return hasPermission(item.perm);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-68 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Company Logo Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center">
            <img
              src="/logo.webp"
              alt="Sunbird Power Solutions"
              className="h-11 w-auto object-contain max-w-[190px]"
            />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Main Modules
          </div>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-600">
              System Live & Connected
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">MongoDB • Sunbird Solar v1.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

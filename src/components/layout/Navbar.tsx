'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { mockDb } from '../../services/mockDb';
import { ERPNotification, Employee, Project, Product, Transaction } from '../../types';
import ThemeToggle from './ThemeToggle';
import { 
  Search, Bell, User, LogOut, ChevronDown, AlertCircle, 
  Settings, Users, FolderKanban, Box, CreditCard, X 
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<ERPNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Search Results States
  const [searchResults, setSearchResults] = useState<{
    employees: Employee[];
    projects: Project[];
    products: Product[];
    transactions: Transaction[];
  }>({ employees: [], projects: [], products: [], transactions: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const refreshNotifications = React.useCallback(() => {
    if (!user) return;
    const allNotifications = mockDb.getNotifications();
    const filtered = allNotifications.filter(n => {
      // 1. Check basic target audience eligibility
      let isEligible = false;
      if (!n.targetRoles && !n.targetEmail) {
        isEligible = true;
      } else if (n.targetEmail && n.targetEmail.toLowerCase() === user.email.toLowerCase()) {
        isEligible = true;
      } else if (n.targetRoles && n.targetRoles.includes(user.role)) {
        isEligible = true;
      }

      if (!isEligible) return false;

      // 2. Classify company updates (low stock alerts, purchase orders, dept manager changes)
      const msg = n.message.toLowerCase();
      const isCompanyUpdate = msg.includes('stock') || msg.includes('purchase order') || msg.includes('manager for');

      // Admin and HR receive company updates + all other notifications they are targeted for
      if (user.role === 'Admin' || user.role === 'HR') {
        return true;
      }

      // Employees and Managers do NOT receive company updates
      if (isCompanyUpdate) {
        return false;
      }

      // Employees: only get notifications that are explicitly theirs AND about salary, leave, attendance, project, tasks.
      if (user.role === 'Employee') {
        const isAllowedTopic = msg.includes('salary') || msg.includes('payslip') || msg.includes('leave') || msg.includes('attendance') || msg.includes('project') || msg.includes('task') || msg.includes('assigned');
        const isPersonal = n.targetEmail && n.targetEmail.toLowerCase() === user.email.toLowerCase();
        return isAllowedTopic && isPersonal;
      }

      // Managers: get leave requests to approve, employee attendance updates, projects, tasks, etc.
      if (user.role === 'Manager') {
        const isAllowedTopic = msg.includes('salary') || msg.includes('payslip') || msg.includes('leave') || msg.includes('attendance') || msg.includes('project') || msg.includes('task') || msg.includes('assigned');
        return isAllowedTopic;
      }

      return false;
    });
    setNotifications(filtered);
  }, [user]);

  useEffect(() => {
    setTimeout(refreshNotifications, 0);
    
    // Real-time notifications and user session synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('company_') || e.key.startsWith('erp_') || e.key === 'erp_auth_user')) {
        refreshNotifications();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(refreshNotifications, 5500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [refreshNotifications]);

  // Handle Search Input Change
  useEffect(() => {
    if (!user) return;
    if (!searchTerm.trim()) {
      setTimeout(() => {
        setSearchResults({ employees: [], projects: [], products: [], transactions: [] });
        setShowSearchDropdown(false);
      }, 0);
      return;
    }

    mockDb.initialize();
    const query = searchTerm.toLowerCase();

    // Query local DB lists based on role permissions
    const emps = (user.role === 'Employee')
      ? mockDb.getEmployees().filter(e => e.email.toLowerCase() === user.email.toLowerCase() && (
          e.name.toLowerCase().includes(query) || 
          e.emp_id.toLowerCase().includes(query)
        ))
      : mockDb.getEmployees().filter(e => 
          e.name.toLowerCase().includes(query) || 
          e.emp_id.toLowerCase().includes(query) ||
          e.department.toLowerCase().includes(query) ||
          e.designation.toLowerCase().includes(query)
        );

    const projs = (user.role === 'Admin' || user.role === 'Manager')
      ? mockDb.getProjects().filter(p => 
          p.project_name.toLowerCase().includes(query) ||
          p.project_id.toLowerCase().includes(query) ||
          p.status.toLowerCase().includes(query)
        )
      : [];

    const prods = (user.role === 'Admin' || user.role === 'Manager')
      ? mockDb.getProducts().filter(p => 
          p.product_name.toLowerCase().includes(query) ||
          p.product_id.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
        )
      : [];

    const txns = (user.role === 'Admin')
      ? mockDb.getTransactions().filter(t => 
          t.description.toLowerCase().includes(query) ||
          t.transaction_id.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.type.toLowerCase().includes(query)
        )
      : [];

    setTimeout(() => {
      setSearchResults({ employees: emps, projects: projs, products: prods, transactions: txns });
      setShowSearchDropdown(
        emps.length > 0 || projs.length > 0 || prods.length > 0 || txns.length > 0
      );
    }, 0);
  }, [searchTerm, user]);

  // Click Outside Handlers for Search Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (id: string) => {
    mockDb.readNotification(id);
    refreshNotifications();
  };

  const handleMarkAllRead = () => {
    mockDb.clearAllNotifications();
    refreshNotifications();
  };

  const handleSearchResultClick = (path: string) => {
    setSearchTerm('');
    setShowSearchDropdown(false);
    router.push(path);
  };

  if (!user) return null;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-20 sticky top-0">
      
      {/* Dynamic Search Bar Component */}
      <div ref={searchContainerRef} className="flex-1 max-w-md hidden md:block relative">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search employees, projects, stock, invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            onFocus={() => {
              if (searchTerm.trim()) setShowSearchDropdown(true);
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown Overlay */}
        {showSearchDropdown && (
          <div className="absolute left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            
            {/* Employees Results */}
            {searchResults.employees.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                  Employees ({searchResults.employees.length})
                </span>
                {searchResults.employees.map(emp => (
                  <button
                    key={emp.emp_id}
                    onClick={() => handleSearchResultClick(`/hr?tab=employees`)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                  >
                    <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <div className="flex-1 truncate">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{emp.name}</span>
                      <span className="text-[10px] text-slate-400 block">{emp.designation} — {emp.department}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Projects Results */}
            {searchResults.projects.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                  Projects ({searchResults.projects.length})
                </span>
                {searchResults.projects.map(proj => (
                  <button
                    key={proj.project_id}
                    onClick={() => handleSearchResultClick(`/projects?tab=projects`)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                  >
                    <FolderKanban className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <div className="flex-1 truncate">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{proj.project_name}</span>
                      <span className="text-[10px] text-slate-400 block">{proj.progress}% completed — {proj.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Products Results */}
            {searchResults.products.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                  Inventory Products ({searchResults.products.length})
                </span>
                {searchResults.products.map(prod => (
                  <button
                    key={prod.product_id}
                    onClick={() => handleSearchResultClick(`/inventory?tab=products`)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                  >
                    <Box className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <div className="flex-1 truncate">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{prod.product_name}</span>
                      <span className="text-[10px] text-slate-400 block">Stock: {prod.quantity} units — {prod.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Transactions Results */}
            {searchResults.transactions.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                  Finance Ledger ({searchResults.transactions.length})
                </span>
                {searchResults.transactions.map(txn => (
                  <button
                    key={txn.transaction_id}
                    onClick={() => handleSearchResultClick(txn.type === 'Revenue' ? `/finance?tab=revenue` : `/finance?tab=expenses`)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                  >
                    <CreditCard className={`h-3.5 w-3.5 shrink-0 ${txn.type === 'Revenue' ? 'text-emerald-500' : 'text-rose-500'}`} />
                    <div className="flex-1 truncate">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{txn.description}</span>
                      <span className="text-[10px] text-slate-400 block">{txn.category} — ₹{txn.amount.toLocaleString()} ({txn.date})</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4 ml-auto">
        <ThemeToggle />

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Alerts & Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((ntf) => (
                    <div 
                      key={ntf.id}
                      onClick={() => handleNotificationClick(ntf.id)}
                      className={`p-3 text-xs flex gap-2 cursor-pointer hover:bg-slate-55 dark:hover:bg-slate-750 transition-colors ${
                        !ntf.read ? 'bg-blue-50/20 dark:bg-blue-500/5' : ''
                      }`}
                    >
                      <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                        ntf.type === 'warning' ? 'text-amber-500' : 
                        ntf.type === 'alert' ? 'text-rose-500' : 
                        ntf.type === 'success' ? 'text-emerald-500' : 
                        'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className={`text-slate-700 dark:text-slate-350 ${!ntf.read ? 'font-medium' : ''}`}>
                          {ntf.message}
                        </p>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">
                          {new Date(ntf.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!ntf.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 self-center shrink-0"></span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
                <svg className="h-6.5 w-6.5 text-slate-400 dark:text-slate-500 fill-current mt-1.5" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
            <div className="text-left hidden lg:block pr-1">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">{user.name}</span>
              <span className="block text-[10px] text-slate-400 capitalize">{user.role}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
              <div className="p-3">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">{user.name}</span>
                <span className="block text-[10px] text-slate-400">{user.email}</span>
              </div>

              <div className="p-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/profile');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md flex items-center gap-2 cursor-pointer"
                >
                  <User className="h-3.5 w-3.5" /> My Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/settings');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="h-3.5 w-3.5" /> Settings
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    router.push('/login');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

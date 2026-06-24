'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, Users, CreditCard, Box, FolderKanban, 
  FileBarChart2, BrainCircuit, Settings, User, LogOut, ChevronDown, ChevronRight, Building2
} from 'lucide-react';
import { translate } from '../../utils/translate';

interface SidebarItem {
  name: string;
  icon: React.ComponentType<any>;
  href: string;
  tab?: string;
  subItems?: { name: string; href: string; tab?: string }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || '';
  const router = useRouter();
  
  const { user, logout } = useAuthStore();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'HR & Payroll': false,
    'Finance': false,
    'Supply Chain': false,
    'Projects': false,
    'Reports': false,
  });

  // Define helper functions first so they can be accessed during render
  // Define menu items based on role
  const getMenuItems = (): SidebarItem[] => {
    const role = user?.role;

    if (role === 'Admin') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { 
          name: 'Finance', 
          icon: CreditCard, 
          href: '/finance',
          subItems: [
            { name: 'Accounts', href: '/finance', tab: 'expenses' },
            { name: 'Invoices', href: '/finance', tab: 'invoices' },
            { name: 'Payments', href: '/finance', tab: 'revenue' },
          ]
        },
        { 
          name: 'HR & Payroll', 
          icon: Users, 
          href: '/hr',
          subItems: [
            { name: 'Employees', href: '/hr', tab: 'employees' },
            { name: 'Attendance', href: '/hr', tab: 'attendance' },
            { name: 'Leave Requests', href: '/hr', tab: 'leave' },
            { name: 'Payroll', href: '/hr', tab: 'payroll' },
          ]
        },
        { 
          name: 'Supply Chain', 
          icon: Box, 
          href: '/inventory',
          subItems: [
            { name: 'Inventory / Products', href: '/inventory', tab: 'products' },
            { name: 'Vendors', href: '/inventory', tab: 'vendors' },
            { name: 'Purchase Orders', href: '/inventory', tab: 'pos' },
          ]
        },
        { 
          name: 'Projects', 
          icon: FolderKanban, 
          href: '/projects',
          subItems: [
            { name: 'Projects', href: '/projects', tab: 'projects' },
            { name: 'Tasks', href: '/projects', tab: 'tasks' },
            { name: 'Resource Allocation', href: '/projects', tab: 'resources' },
          ]
        },
        { 
          name: 'Reports', 
          icon: FileBarChart2, 
          href: '/reports',
          subItems: [
            { name: 'Financial Reports', href: '/reports', tab: 'financial' },
            { name: 'Employee Reports', href: '/reports', tab: 'employee' },
            { name: 'Inventory Reports', href: '/reports', tab: 'inventory' },
          ]
        },
        { name: 'AI Insights', icon: BrainCircuit, href: '/ai-insights' },
        { name: 'Settings', icon: Settings, href: '/settings' },
        { name: 'Profile', icon: User, href: '/profile' },
      ];
    }

    if (role === 'HR') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { 
          name: 'HR & Payroll', 
          icon: Users, 
          href: '/hr',
          subItems: [
            { name: 'Employees', href: '/hr', tab: 'employees' },
            { name: 'Attendance', href: '/hr', tab: 'attendance' },
            { name: 'Leave Requests', href: '/hr', tab: 'leave' },
            { name: 'Payroll', href: '/hr', tab: 'payroll' },
          ]
        },
        { 
          name: 'Reports', 
          icon: FileBarChart2, 
          href: '/reports',
          subItems: [
            { name: 'Employee Reports', href: '/reports', tab: 'employee' },
          ]
        },
        { name: 'Settings', icon: Settings, href: '/settings' },
        { name: 'Profile', icon: User, href: '/profile' },
      ];
    }

    if (role === 'Manager') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'Employees', icon: Users, href: '/hr', tab: 'employees' },
        { 
          name: 'Projects', 
          icon: FolderKanban, 
          href: '/projects',
          subItems: [
            { name: 'Projects', href: '/projects', tab: 'projects' },
            { name: 'Tasks', href: '/projects', tab: 'tasks' },
          ]
        },
        { name: 'Inventory', icon: Box, href: '/inventory', tab: 'products' },
        { 
          name: 'Reports', 
          icon: FileBarChart2, 
          href: '/reports',
          subItems: [
            { name: 'Financial Reports', href: '/reports', tab: 'financial' },
            { name: 'Inventory Reports', href: '/reports', tab: 'inventory' },
          ]
        },
        { name: 'Settings', icon: Settings, href: '/settings' },
        { name: 'Profile', icon: User, href: '/profile' },
      ];
    }

    // Employee
    return [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'My Profile', icon: User, href: '/profile' },
      { name: 'Attendance', icon: Users, href: '/hr', tab: 'attendance' },
      { name: 'Leave Requests', icon: Box, href: '/hr', tab: 'leave' },
      { name: 'Payslips', icon: CreditCard, href: '/hr', tab: 'payroll' },
      { name: 'Settings', icon: Settings, href: '/settings' },
    ];
  };

  const isLinkActive = (href: string, tab?: string) => {
    if (tab) {
      return pathname === href && currentTab === tab;
    }
    // If exact match
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href) && (!currentTab || pathname !== href);
  };

  const isGroupActive = (item: SidebarItem) => {
    if (item.tab && currentTab !== item.tab) return false;
    if (pathname.startsWith(item.href)) return true;
    if (item.subItems) {
      return item.subItems.some(sub => {
        if (sub.tab && currentTab !== sub.tab) return false;
        return pathname.startsWith(sub.href);
      });
    }
    return false;
  };

  // Adjust state during render when pathname or user session changes
  const [prevPathname, setPrevPathname] = useState('');
  const [prevUser, setPrevUser] = useState<any>(null);

  if (pathname !== prevPathname || user !== prevUser) {
    setPrevPathname(pathname);
    setPrevUser(user);
    const items = getMenuItems();
    const activeGroup = items.find(item => item.subItems && isGroupActive(item));
    setOpenMenus(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        next[key] = false;
      });
      if (activeGroup) {
        next[activeGroup.name] = true;
      }
      return next;
    });
  }

  const toggleSubmenu = (menuName: string) => {
    setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col h-full shrink-0 border-r border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-md leading-tight text-slate-900 dark:text-white">Amdox Technologies</h1>
        </div>
      </div>

      {/* User Information */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-10 w-10 rounded-full object-cover border border-indigo-100 dark:border-indigo-950 shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
            <svg className="h-8 w-8 text-slate-400 dark:text-slate-500 fill-current mt-2" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
        <div className="overflow-hidden">
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{user.name}</h2>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{user.role}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isOpen = openMenus[item.name];
          const active = isLinkActive(item.href, item.tab) || (!hasSubItems && isGroupActive(item));

          if (hasSubItems) {
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggleSubmenu(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    isGroupActive(item) 
                      ? 'bg-slate-100/80 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-400' 
                      : 'text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{translate(item.name)}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="pl-9 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-5 mt-1">
                    {item.subItems!.map((sub) => {
                      const subHref = sub.tab ? `${sub.href}?tab=${sub.tab}` : sub.href;
                      const subActive = isLinkActive(sub.href, sub.tab);

                      return (
                        <Link
                          key={sub.name}
                          href={subHref}
                          className={`block px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${
                            subActive
                              ? 'text-indigo-650 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 font-semibold'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {translate(sub.name)}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Flat item
          const itemHref = item.tab ? `${item.href}?tab=${item.tab}` : item.href;
          return (
            <Link
              key={item.name}
              href={itemHref}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                active
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/10'
                  : 'text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{translate(item.name)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/30 hover:text-rose-600 dark:hover:text-rose-450 transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>{translate('Log Out')}</span>
        </button>
      </div>
    </aside>
  );
}

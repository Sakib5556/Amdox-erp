'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, Users, CreditCard, Box, FolderKanban, 
  FileBarChart2, BrainCircuit, Settings, User, LogOut, Building2
} from 'lucide-react';
import { translate } from '../../utils/translate';

interface SidebarItem {
  name: string;
  icon: React.ComponentType<any>;
  href: string;
  tab?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || '';
  const router = useRouter();
  
  const { user, logout } = useAuthStore();

  const getMenuItems = (): SidebarItem[] => {
    const role = user?.role;

    if (role === 'Admin') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'Finance', icon: CreditCard, href: '/finance' },
        { name: 'HR', icon: Users, href: '/hr' },
        { name: 'Inventory', icon: Box, href: '/inventory' },
        { name: 'Projects', icon: FolderKanban, href: '/projects' },
        { name: 'Reports', icon: FileBarChart2, href: '/reports' },
        { name: 'AI Insights', icon: BrainCircuit, href: '/ai-insights' },
        { name: 'Settings', icon: Settings, href: '/settings' },
        { name: 'Profile', icon: User, href: '/profile' },
      ];
    }

    if (role === 'HR') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'HR', icon: Users, href: '/hr' },
        { name: 'Reports', icon: FileBarChart2, href: '/reports' },
        { name: 'Settings', icon: Settings, href: '/settings' },
        { name: 'Profile', icon: User, href: '/profile' },
      ];
    }

    if (role === 'Manager') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'Employees', icon: Users, href: '/hr' },
        { name: 'Projects', icon: FolderKanban, href: '/projects' },
        { name: 'Inventory', icon: Box, href: '/inventory' },
        { name: 'Reports', icon: FileBarChart2, href: '/reports' },
        { name: 'Settings', icon: Settings, href: '/settings' },
        { name: 'Profile', icon: User, href: '/profile' },
      ];
    }

    // Employee
    return [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'Profile', icon: User, href: '/profile' },
      { name: 'Attendance', icon: Users, href: '/hr', tab: 'attendance' },
      { name: 'Leaves', icon: Box, href: '/hr', tab: 'leave' },
      { name: 'Payslips', icon: CreditCard, href: '/hr', tab: 'payroll' },
      { name: 'Settings', icon: Settings, href: '/settings' },
    ];
  };

  const isLinkActive = (href: string, tab?: string) => {
    if (tab) {
      return pathname === href && currentTab === tab;
    }
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const menuItems = getMenuItems();

  const getGroupedMenuItems = () => {
    const mainMenu: SidebarItem[] = [];
    const coreOps: SidebarItem[] = [];
    const analytics: SidebarItem[] = [];

    menuItems.forEach(item => {
      if (item.name === 'Dashboard' || item.name === 'Profile' || item.name === 'Settings') {
        mainMenu.push(item);
      } else if (item.name === 'Reports' || item.name === 'AI Insights') {
        analytics.push(item);
      } else {
        coreOps.push(item);
      }
    });

    return { mainMenu, coreOps, analytics };
   };

  const { mainMenu, coreOps, analytics } = getGroupedMenuItems();

  const renderSection = (title: string, items: SidebarItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 mt-6 mb-2 block select-none">
          {translate(title)}
        </span>
        {items.map((item) => {
          const active = isLinkActive(item.href, item.tab);
          const itemHref = item.tab ? `${item.href}?tab=${item.tab}` : item.href;

          return (
            <Link
              key={item.name}
              href={itemHref}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none ${
                active
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200/40 dark:border-slate-700/60 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <item.icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="truncate">{translate(item.name)}</span>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-[#f8fafc] dark:bg-[#0c0d14] text-slate-800 dark:text-slate-200 flex flex-col h-full shrink-0 border-r border-slate-200/60 dark:border-slate-800/60 select-none">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-200/40 dark:border-slate-800/40">
        <div className="bg-blue-600/10 dark:bg-blue-500/10 p-1.5 rounded-xl text-blue-600 dark:text-blue-400">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="font-black text-md text-slate-850 dark:text-white tracking-wider">Amdox</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
        {renderSection('Main Menu', mainMenu)}
        {renderSection(user.role === 'Employee' ? 'Employee Portal' : 'Operations', coreOps)}
        {renderSection('Analytics', analytics)}
      </nav>

      {/* Logout Footer */}
      <div className="py-4 px-4 border-t border-slate-200/40 dark:border-slate-800/40">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <span>{translate('Log Out')}</span>
        </button>
      </div>
    </aside>
  );
}

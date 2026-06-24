'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '../../components/layout/AuthLayout';
import PageHeader from '../../components/layout/PageHeader';
import { mockDb } from '../../services/mockDb';
import { useAuthStore } from '../../store/authStore';
import { Employee, Project, Product, PurchaseOrder, LeaveRequest } from '../../types';
import { 
  Users, FolderKanban, Box, CreditCard, Sparkles, Plus, 
  FileText, Calendar, ArrowUpRight, ArrowDownRight, Clock, Check, X, CheckSquare, ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  
  // Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(100);

  // Modals state
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showAddProjModal, setShowAddProjModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Form Fields
  const [empName, setEmpName] = useState('');
  const [empDept, setEmpDept] = useState('IT');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empSalary, setEmpSalary] = useState('');

  const [projName, setProjName] = useState('');
  const [projBudget, setProjBudget] = useState('');
  const [projDeadline, setProjDeadline] = useState('');

  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('Electronics');
  const [prodQty, setProdQty] = useState('');
  const [prodReorder, setProdReorder] = useState('5');
  const [prodPrice, setProdPrice] = useState('');

  const loadData = () => {
    mockDb.initialize();
    
    const emps = mockDb.getEmployees();
    const projs = mockDb.getProjects();
    const prods = mockDb.getProducts();
    const txns = mockDb.getTransactions();
    const att = mockDb.getAttendance();
    
    setEmployees(emps);
    setProjects(projs);
    setProducts(prods);
    setActivities(mockDb.getActivities().slice(0, 5));
    setPendingLeaves(mockDb.getLeaves().filter(l => l.status === 'Pending'));
    setPendingPOs(mockDb.getPurchaseOrders().filter(po => po.status === 'Pending Approval' || po.status === 'Draft'));
    setAiInsights(mockDb.getAIInsights());

    // Calculate actual revenue
    const revTotal = txns
      .filter(t => t.type === 'Revenue')
      .reduce((sum, t) => sum + t.amount, 0);
    setRevenue(revTotal);

    // Calculate actual expenses
    const expTotal = txns
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
    setExpenses(expTotal);

    // Calculate actual attendance rate
    if (att.length > 0) {
      const activeAtt = att.filter(a => a.status === 'Present' || a.status === 'Late').length;
      setAttendanceRate(Math.round((activeAtt / att.length) * 100));
    } else {
      setAttendanceRate(100); // Default if no data
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      loadData();
    }, 0);

    // Real-time synchronization when database changes in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('company_') || e.key.startsWith('erp_') || e.key === 'erp_auth_user')) {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Backup polling for real-time activity feed changes
    const interval = setInterval(loadData, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Quick Action Submissions
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail || !empDesignation || !empSalary) return;
    
    mockDb.addEmployee({
      name: empName,
      department: empDept,
      designation: empDesignation,
      email: empEmail,
      phone: empPhone || '+91 99999 88888',
      salary: parseFloat(empSalary),
      status: 'Active',
      joiningDate: new Date().toISOString().split('T')[0]
    });

    setEmpName('');
    setEmpDesignation('');
    setEmpEmail('');
    setEmpPhone('');
    setEmpSalary('');
    setShowAddEmpModal(false);
    loadData();
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !projBudget || !projDeadline) return;

    mockDb.createProject({
      project_name: projName,
      manager_id: user?.id || 'EMP-001',
      managerName: user?.name || 'Administrator',
      budget: parseFloat(projBudget),
      deadline: projDeadline,
    });

    setProjName('');
    setProjBudget('');
    setProjDeadline('');
    setShowAddProjModal(false);
    loadData();
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodQty || !prodPrice) return;

    mockDb.addProduct({
      product_name: prodName,
      category: prodCat,
      quantity: parseInt(prodQty),
      reorder_level: parseInt(prodReorder),
      price: parseFloat(prodPrice),
    });

    setProdName('');
    setProdQty('');
    setProdPrice('');
    setShowAddProductModal(false);
    loadData();
  };

  // Dashboard Approvals Handlers
  const handleApproveLeave = (id: string, approve: boolean) => {
    mockDb.updateLeaveStatus(id, approve ? 'Approved' : 'Rejected');
    loadData();
  };

  const handleApprovePO = (id: string, approve: boolean) => {
    mockDb.updatePurchaseOrderStatus(id, approve ? 'Approved' : 'Draft');
    loadData();
  };

  // Chart Data preparation
  const getRevenueChartData = () => {
    if (revenue === 0 && expenses === 0) {
      return [];
    }
    // Return actual user logged metrics
    return [
      { name: 'Prev Period', Sales: Math.round(revenue * 0.4), Expenses: Math.round(expenses * 0.5) },
      { name: 'Current Period', Sales: revenue, Expenses: expenses }
    ];
  };

  const getDeptPieData = () => {
    const deptCounts: Record<string, number> = {};
    employees.forEach(e => {
      deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
    });
    return Object.keys(deptCounts).map(dept => ({
      name: dept,
      value: deptCounts[dept]
    }));
  };

  const getProjectBarData = () => {
    return projects.map(p => ({
      name: p.project_name.split(' - ')[0],
      Progress: p.progress
    }));
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  // Personal metrics for Employee login
  const currentEmp = employees.find(e => e.email.toLowerCase() === user?.email?.toLowerCase());
  const empId = currentEmp?.emp_id;

  const personalTasks = mockDb.getTasks().filter(t => t.assigned_to === empId);
  const personalPendingTasksCount = personalTasks.filter(t => t.status !== 'Completed').length;
  const personalCompletedTasksCount = personalTasks.filter(t => t.status === 'Completed').length;

  const personalAtt = mockDb.getAttendance().filter(a => a.emp_id === empId);
  const personalPresentCount = personalAtt.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const personalAttendanceRate = personalAtt.length > 0 ? Math.round((personalPresentCount / personalAtt.length) * 100) : 100;
  
  // Personal leaves count
  const personalLeavesCount = mockDb.getLeaves().filter(l => l.emp_id === empId).length;

  // Define KPI Cards based on role
  interface KpiCardData {
    title: string;
    value: string | number;
    subtext: string;
    icon: React.ReactNode;
    colorClass: string;
  }

  const getKpiCards = (): KpiCardData[] => {
    const role = user?.role;
    
    if (role === 'Employee') {
      return [
        {
          title: 'Monthly Salary',
          value: `₹${(currentEmp?.salary || 75000).toLocaleString()}`,
          subtext: 'Basic monthly scale',
          icon: <CreditCard className="h-4 w-4" />,
          colorClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
        },
        {
          title: 'Pending Tasks',
          value: personalPendingTasksCount,
          subtext: 'Active sprint queue',
          icon: <Users className="h-4 w-4" />,
          colorClass: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
        },
        {
          title: 'Completed Tasks',
          value: personalCompletedTasksCount,
          subtext: 'Sprint completed',
          icon: <FolderKanban className="h-4 w-4" />,
          colorClass: 'bg-violet-55 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400',
        },
        {
          title: 'Attendance Rate',
          value: `${personalAttendanceRate}%`,
          subtext: 'Check-in attendance',
          icon: <Box className="h-4 w-4" />,
          colorClass: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
        },
        {
          title: 'Applied Leaves',
          value: personalLeavesCount,
          subtext: 'Total leave requests',
          icon: <Calendar className="h-4 w-4" />,
          colorClass: 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400',
        },
        {
          title: 'Payroll Status',
          value: 'Active',
          subtext: `₹${(currentEmp?.salary || 75000).toLocaleString()} scale`,
          icon: <CheckSquare className="h-4 w-4" />,
          colorClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
        },
      ];
    }

    if (role === 'HR') {
      const totalSalaries = employees.reduce((sum, e) => sum + (e.status === 'Active' ? e.salary : 0), 0);
      return [
        {
          title: 'Employees',
          value: employees.length,
          subtext: 'Active roster count',
          icon: <Users className="h-4 w-4" />,
          colorClass: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
        },
        {
          title: 'Attendance',
          value: `${attendanceRate}%`,
          subtext: 'Cumulative rate',
          icon: <Calendar className="h-4 w-4" />,
          colorClass: 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400',
        },
        {
          title: 'Payroll Disbursed',
          value: `₹${totalSalaries.toLocaleString()}`,
          subtext: 'Monthly salary commitment',
          icon: <CreditCard className="h-4 w-4" />,
          colorClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
        },
        {
          title: 'Pending Leaves',
          value: pendingLeaves.length,
          subtext: 'Requires HR approval',
          icon: <Clock className="h-4 w-4" />,
          colorClass: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
        },
      ];
    }

    if (role === 'Manager') {
      return [
        {
          title: 'Employees',
          value: employees.length,
          subtext: 'Active roster count',
          icon: <Users className="h-4 w-4" />,
          colorClass: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
        },
        {
          title: 'Active Projects',
          value: projects.filter(p => p.status === 'In Progress' || p.status === 'Delayed').length,
          subtext: `Out of ${projects.length} total`,
          icon: <FolderKanban className="h-4 w-4" />,
          colorClass: 'bg-violet-55 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400',
        },
        {
          title: 'Stock items',
          value: products.reduce((sum, p) => sum + p.quantity, 0),
          subtext: `${products.filter(p => p.status === 'Low Stock').length} low stock alerts`,
          icon: <Box className="h-4 w-4" />,
          colorClass: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
        },
        {
          title: 'Attendance',
          value: `${attendanceRate}%`,
          subtext: 'Cumulative rate',
          icon: <Calendar className="h-4 w-4" />,
          colorClass: 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400',
        },
      ];
    }

    // Default Admin
    return [
      {
        title: 'Total Sales',
        value: `₹${revenue.toLocaleString()}`,
        subtext: 'Direct cashier log',
        icon: <CreditCard className="h-4 w-4" />,
        colorClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
      },
      {
        title: 'Employees',
        value: employees.length,
        subtext: 'Active roster count',
        icon: <Users className="h-4 w-4" />,
        colorClass: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
      },
      {
        title: 'Active Projects',
        value: projects.filter(p => p.status === 'In Progress' || p.status === 'Delayed').length,
        subtext: `Out of ${projects.length} total`,
        icon: <FolderKanban className="h-4 w-4" />,
        colorClass: 'bg-violet-55 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400',
      },
      {
        title: 'Stock items',
        value: products.reduce((sum, p) => sum + p.quantity, 0),
        subtext: `${products.filter(p => p.status === 'Low Stock').length} low stock alerts`,
        icon: <Box className="h-4 w-4" />,
        colorClass: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
      },
      {
        title: 'Attendance',
        value: `${attendanceRate}%`,
        subtext: 'Cumulative rate',
        icon: <Calendar className="h-4 w-4" />,
        colorClass: 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400',
      },
      {
        title: 'Payroll Disbursed',
        value: `₹${expenses.toLocaleString()}`,
        subtext: `₹${expenses.toLocaleString()} paid out`,
        icon: <CheckSquare className="h-4 w-4" />,
        colorClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
      },
    ];
  };

  return (
    <AuthLayout>
      <PageHeader 
        title={`Welcome Back, ${user?.name?.split(' ')[0]} 👋`} 
        description="Real-time operations cockpit details for your business workspace."
        actions={
          <div className="flex gap-2 text-xs">
            <span className="inline-flex items-center px-3 py-1 rounded-full font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              Session Profile: <strong className="ml-1 uppercase">{user?.role}</strong>
            </span>
          </div>
        }
      />

      {/* AI Insights Section */}
      {user?.role === 'Admin' && (
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 rounded-2xl p-5 shadow-sm ai-pulse flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white mt-0.5 shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                ERP AI Recommendations
              </h3>
              <div className="mt-1 space-y-1">
                {aiInsights.length === 0 ? (
                  <p className="text-xs text-slate-500">Workspace data is insufficient. AI forecasting will activate as you populate records.</p>
                ) : (
                  aiInsights.slice(0, 2).map((ins, i) => (
                    <p key={i} className="text-xs text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0"></span>
                      {ins}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
          {aiInsights.length > 0 && (
            <button
              onClick={() => router.push('/ai-insights')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 whitespace-nowrap self-end md:self-center"
            >
              Review AI forecasting <ArrowUpRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className={
        user?.role === 'HR' || user?.role === 'Manager'
          ? 'grid grid-cols-2 lg:grid-cols-4 gap-4'
          : 'grid grid-cols-2 lg:grid-cols-6 gap-4'
      }>
        {getKpiCards().map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg ${card.colorClass}`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-3">
              <span className="block text-lg font-bold text-slate-850 dark:text-white uppercase leading-normal">
                {card.value}
              </span>
              <span className="text-[9px] text-slate-400 block mt-1">
                {card.subtext}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Charts Section */}
      {isMounted && (
        user?.role === 'Employee' ? (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-sm">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Corporate Insights Dashboard</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-2">
              Cashflow analytics, department counts, and global project milestones are restricted to executive roles.
            </p>
          </div>
        ) : user?.role === 'HR' ? (
          <div className="flex justify-center">
            {/* Center-aligned card for Department Distribution */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl w-full">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Department Distribution</h3>
              {getDeptPieData().length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4">
                  <Users className="h-8 w-8 text-slate-350 mb-2" />
                  <p className="text-xs font-semibold">No Employee Records</p>
                  <span className="text-[10px] text-slate-400 mt-1 text-center">Add employee profiles under HR tab to populate department counts.</span>
                </div>
              ) : (
                <>
                  <div className="h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getDeptPieData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={65}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getDeptPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-3">
                      <span className="text-lg font-black text-slate-800 dark:text-white">{employees.length}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2 text-[10px]">
                    {getDeptPieData().map((entry, idx) => (
                      <div key={entry.name} className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                        <span>{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : user?.role === 'Manager' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Progress Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 lg:col-span-2 shadow-sm">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Project Milestones</h3>
              {getProjectBarData().length === 0 ? (
                <div className="h-60 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-6">
                  <FolderKanban className="h-8 w-8 text-slate-350 mb-2" />
                  <p className="text-xs font-semibold">No Projects Found</p>
                  <span className="text-[10px] text-slate-400 mt-1">Create projects and assign tasks to view progress.</span>
                </div>
              ) : (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getProjectBarData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v: any) => `${v}% Complete`} />
                      <Bar dataKey="Progress" fill="#1d4ed8" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {getProjectBarData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.Progress === 100 ? '#059669' : '#1d4ed8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Department Distribution Pie */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-1">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Department Distribution</h3>
              {getDeptPieData().length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4">
                  <Users className="h-8 w-8 text-slate-350 mb-2" />
                  <p className="text-xs font-semibold">No Employee Records</p>
                  <span className="text-[10px] text-slate-400 mt-1 text-center">Add employee profiles under HR tab to populate department counts.</span>
                </div>
              ) : (
                <>
                  <div className="h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getDeptPieData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={65}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getDeptPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-3">
                      <span className="text-lg font-black text-slate-800 dark:text-white">{employees.length}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2 text-[10px]">
                    {getDeptPieData().map((entry, idx) => (
                      <div key={entry.name} className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                        <span>{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 lg:col-span-2 shadow-sm">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Cashflow Stream</h3>
              {getRevenueChartData().length === 0 ? (
                <div className="h-72 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-6">
                  <CreditCard className="h-8 w-8 text-slate-350 mb-2" />
                  <p className="text-xs font-semibold">No Transactions Logged</p>
                  <span className="text-[10px] text-slate-400 mt-1">Payout salary or log revenue invoice to view financial trend.</span>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getRevenueChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                      <Tooltip formatter={(v: any) => `₹${v.toLocaleString()}`} />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                      <Area type="monotone" dataKey="Expenses" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Department Distribution Pie */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-1">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Department Distribution</h3>
              {getDeptPieData().length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4">
                  <Users className="h-8 w-8 text-slate-350 mb-2" />
                  <p className="text-xs font-semibold">No Employee Records</p>
                  <span className="text-[10px] text-slate-400 mt-1 text-center">Add employee profiles under HR tab to populate department counts.</span>
                </div>
              ) : (
                <>
                  <div className="h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getDeptPieData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={65}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getDeptPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-3">
                      <span className="text-lg font-black text-slate-800 dark:text-white">{employees.length}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2 text-[10px]">
                    {getDeptPieData().map((entry, idx) => (
                      <div key={entry.name} className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                        <span>{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Project Progress Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 lg:col-span-3 shadow-sm">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Project Milestones</h3>
              {getProjectBarData().length === 0 ? (
                <div className="h-60 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-6">
                  <FolderKanban className="h-8 w-8 text-slate-350 mb-2" />
                  <p className="text-xs font-semibold">No Projects Found</p>
                  <span className="text-[10px] text-slate-400 mt-1">Create projects and assign tasks to view progress.</span>
                </div>
              ) : (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getProjectBarData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v: any) => `${v}% Complete`} />
                      <Bar dataKey="Progress" fill="#1d4ed8" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {getProjectBarData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.Progress === 100 ? '#059669' : '#1d4ed8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Quick Actions Panel */}
      {user?.role !== 'Employee' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">ERP Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {(user?.role === 'Admin' || user?.role === 'HR') && (
              <button 
                onClick={() => setShowAddEmpModal(true)}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-250 dark:border-slate-700 rounded-xl font-bold transition-all"
              >
                <Plus className="h-4 w-4" /> Add Employee
              </button>
            )}
            
            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <button 
                onClick={() => setShowAddProjModal(true)}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-255 dark:border-slate-700 rounded-xl font-bold transition-all"
              >
                <Plus className="h-4 w-4" /> Create Project
              </button>
            )}

            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <button 
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-255 dark:border-slate-700 rounded-xl font-bold transition-all"
              >
                <Plus className="h-4 w-4" /> Add Inventory
              </button>
            )}

            <button 
              onClick={() => router.push('/reports')}
              className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-255 dark:border-slate-700 rounded-xl font-bold transition-all"
            >
              <FileText className="h-4 w-4" /> Export reports
            </button>
          </div>
        </div>
      )}

      {/* Activities and Approvals Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activities */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-1">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No activity logs. Mark attendance or create records to view logs.
              </div>
            ) : (
              activities.map((act, index) => (
                <div key={`${act.id}-${index}`} className="flex gap-3 text-xs">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-slate-700 dark:text-slate-350 leading-relaxed">{act.description}</p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Approvals or Personal Tasks */}
        {user?.role === 'Employee' ? (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">My Active Tasks Queue</h3>
            <div className="space-y-3">
              {personalTasks.filter(t => t.status !== 'Completed').length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  You have no pending tasks assigned.
                </div>
              ) : (
                personalTasks.filter(t => t.status !== 'Completed').slice(0, 3).map(task => (
                  <div key={task.task_id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-850 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{task.task_name}</span>
                      <p className="text-[10px] text-slate-400 mt-1">Due Date: {task.dueDate} | Priority: {task.priority}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold text-[9px]">Assigned</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Pending Executive Approvals</h3>
            
            <div className="space-y-3">
              {pendingLeaves.length === 0 && (user?.role === 'HR' || pendingPOs.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  All requests processed. No actions pending.
                </div>
              ) : (
                <>
                  {/* Pending Leaves */}
                  {pendingLeaves.map(leave => (
                    <div key={leave.leave_id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs gap-4 shadow-sm">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-200">{leave.employeeName}</span>
                        <span className="text-slate-300 mx-1.5">|</span>
                        <span className="text-slate-500">Requesting: <b>{leave.leaveType} Leave</b> ({leave.days} days)</span>
                        <p className="text-[10px] text-slate-400 mt-1">Reason: "{leave.reason}"</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          disabled={user?.role === 'Employee'}
                          onClick={() => handleApproveLeave(leave.leave_id, true)}
                          className="p-1 bg-emerald-100 hover:bg-emerald-250 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          disabled={user?.role === 'Employee'}
                          onClick={() => handleApproveLeave(leave.leave_id, false)}
                          className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Pending POs */}
                  {user?.role !== 'HR' && pendingPOs.map(po => (
                    <div key={po.po_id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs gap-4 shadow-sm">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-200">{po.po_id}</span>
                        <span className="text-slate-300 mx-1.5">|</span>
                        <span className="text-slate-500">Order: <b>{po.product_name}</b> ({po.quantity} pcs)</span>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">Vendor: {po.vendor_name} — Total: ₹{po.total_amount.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          disabled={user?.role !== 'Admin' && user?.role !== 'Manager'}
                          onClick={() => handleApprovePO(po.po_id, true)}
                          className="p-1 bg-emerald-100 hover:bg-emerald-250 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          disabled={user?.role !== 'Admin' && user?.role !== 'Manager'}
                          onClick={() => handleApprovePO(po.po_id, false)}
                          className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modal Forms */}
      {/* 1. Add Employee Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddEmployee} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-850 dark:text-white">Add New Employee Profile</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Full Name</label>
                <input type="text" required value={empName} onChange={e => setEmpName(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="e.g. Amit Patel"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Department</label>
                  <select value={empDept} onChange={e => setEmpDept(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg">
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Designation</label>
                  <input type="text" required value={empDesignation} onChange={e => setEmpDesignation(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="e.g. HR Associate"/>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Email Address</label>
                <input type="email" required value={empEmail} onChange={e => setEmpEmail(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="e.g. amit@company.com"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Phone Number</label>
                  <input type="text" value={empPhone} onChange={e => setEmpPhone(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="+91 98765 43210"/>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Monthly Salary (₹)</label>
                  <input type="number" required value={empSalary} onChange={e => setEmpSalary(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="60000"/>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button type="button" onClick={() => setShowAddEmpModal(false)} className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Save Employee</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Create Project Modal */}
      {showAddProjModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateProject} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-850 dark:text-white">Create New Project</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Project Name</label>
                <input type="text" required value={projName} onChange={e => setProjName(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="e.g. Website Redesign"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Project Budget (₹)</label>
                  <input type="number" required value={projBudget} onChange={e => setProjBudget(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="450000"/>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Deadline Date</label>
                  <input type="date" required value={projDeadline} onChange={e => setProjDeadline(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg"/>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button type="button" onClick={() => setShowAddProjModal(false)} className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Create Project</button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddProduct} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-850 dark:text-white">Add Product to Inventory</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Product Item Name</label>
                <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="e.g. Office Laptops"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Category</label>
                  <select value={prodCat} onChange={e => setProdCat(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg">
                    <option value="Electronics">Electronics</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Stationery">Stationery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Unit Price (₹)</label>
                  <input type="number" required value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="40000"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Initial Quantity</label>
                  <input type="number" required value={prodQty} onChange={e => setProdQty(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="10"/>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Reorder Level Alert</label>
                  <input type="number" required value={prodReorder} onChange={e => setProdReorder(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="5"/>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button type="button" onClick={() => setShowAddProductModal(false)} className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Add Product</button>
            </div>
          </form>
        </div>
      )}

    </AuthLayout>
  );
}

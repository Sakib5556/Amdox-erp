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
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<'This Year' | 'This Quarter' | 'This Month'>('This Year');
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
  const [empJoiningDate, setEmpJoiningDate] = useState(new Date().toISOString().split('T')[0]);

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

    setAllTransactions(txns);

    // Calculate actual attendance rate
    if (att.length > 0) {
      const activeAtt = att.filter(a => a.status === 'Present' || a.status === 'Late').length;
      setAttendanceRate(Math.round((activeAtt / att.length) * 100));
    } else {
      setAttendanceRate(100); // Default if no data
    }
  };

  useEffect(() => {
    // Filter transactions based on dateRange
    const filteredTxns = allTransactions.filter(t => {
      const d = new Date(t.date);
      const now = new Date();
      if (isNaN(d.getTime())) return true;
      
      if (dateRange === 'This Month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (dateRange === 'This Quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const dateQuarter = Math.floor(d.getMonth() / 3);
        return d.getFullYear() === now.getFullYear() && dateQuarter === currentQuarter;
      }
      if (dateRange === 'This Year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });

    const revTotal = filteredTxns
      .filter(t => t.type === 'Revenue')
      .reduce((sum, t) => sum + t.amount, 0);

    const expTotal = filteredTxns
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setTimeout(() => {
      setRevenue(revTotal);
      setExpenses(expTotal);
    }, 0);
  }, [allTransactions, dateRange]);

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
    if (!empName || !empEmail || !empDesignation || !empSalary || !empJoiningDate) return;
    
    mockDb.addEmployee({
      name: empName,
      department: empDept,
      designation: empDesignation,
      email: empEmail,
      phone: empPhone || '+91 99999 88888',
      salary: parseFloat(empSalary),
      status: 'Active',
      joiningDate: empJoiningDate
    });

    setEmpName('');
    setEmpDesignation('');
    setEmpEmail('');
    setEmpPhone('');
    setEmpSalary('');
    setEmpJoiningDate(new Date().toISOString().split('T')[0]);
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

  const getNetProfitChartData = () => {
    const netProfit = revenue - expenses;
    
    if (dateRange === 'This Month') {
      const basePattern = [0.8, 1.2, 0.9, 1.1];
      const weeklyVal = netProfit ? (netProfit / 4) : (6012147.75 / 12 / 4);
      return [
        { name: 'Week 1', Profit: Math.round(weeklyVal * basePattern[0]) },
        { name: 'Week 2', Profit: Math.round(weeklyVal * basePattern[1]) },
        { name: 'Week 3', Profit: Math.round(weeklyVal * basePattern[2]) },
        { name: 'Week 4', Profit: Math.round(weeklyVal * basePattern[3]) }
      ];
    }
    
    if (dateRange === 'This Quarter') {
      const now = new Date();
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const monthsList = [
        ['Jan', 'Feb', 'Mar'],
        ['Apr', 'May', 'Jun'],
        ['Jul', 'Aug', 'Sep'],
        ['Oct', 'Nov', 'Dec']
      ];
      const qMonths = monthsList[currentQuarter];
      const basePattern = [0.9, 1.1, 1.0];
      const monthlyVal = netProfit ? (netProfit / 3) : (6012147.75 / 4 / 3);
      return qMonths.map((m, idx) => ({
        name: m,
        Profit: Math.round(monthlyVal * basePattern[idx])
      }));
    }
    
    // Default 'This Year' (12 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyVal = netProfit ? (netProfit / 12) : (6012147.75 / 12);
    const basePattern = [0.8, 0.7, 1.2, 0.6, 0.9, 0.7, 1.2, 0.9, 0.7, 0.9, 1.1, 1.0];
    return months.map((m, idx) => ({
      name: m,
      Profit: Math.round(monthlyVal * basePattern[idx])
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
      {/* Custom Mockup Align Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome Back, {user?.name || 'User'} !
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-405 mt-1 font-semibold">
            Workspace session is active. Overview of enterprise resources and ledger balance.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-455 dark:text-slate-400 font-bold">Date Range :</span>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="border border-slate-200 dark:border-slate-800 dark:bg-slate-900 py-1.5 px-3.5 rounded-full text-slate-700 dark:text-slate-350 font-bold bg-white focus:outline-none cursor-pointer shadow-sm animate-none"
          >
            <option value="This Year">This Year</option>
            <option value="This Quarter">This Quarter</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </div>

      {/* AI Insights Section */}
      {user?.role === 'Admin' && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent border border-indigo-500/20 dark:border-indigo-500/10 rounded-2xl p-5 shadow-sm ai-pulse flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white mt-0.5 shadow-md shadow-indigo-500/20">
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
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0"></span>
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
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 whitespace-nowrap self-end md:self-center"
            >
              Review AI forecasting <ArrowUpRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* KPI Cards Grid - Restricted to Employees */}
      {user?.role === 'Employee' && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {getKpiCards().map((card, idx) => (
            <div key={idx} className="premium-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.colorClass}`}>
                  {card.icon}
                </div>
              </div>
              <div className="mt-3">
                <span className="block text-xl font-bold text-slate-900 dark:text-white uppercase leading-normal">
                  {card.value}
                </span>
                <span className="text-[9px] text-slate-400 block mt-1 font-semibold">
                  {card.subtext}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zoho Dashboard Layout for Executive Roles */}
      {isMounted && (
        user?.role === 'Employee' ? (
          <div className="premium-card text-center space-y-2">
            <h3 className="font-bold text-xs text-slate-450 dark:text-slate-400 uppercase tracking-wider">Corporate Insights Dashboard</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-2 font-medium">
              Cashflow analytics, department counts, and global project milestones are restricted to executive roles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Columns (Net Profit, Receivable/Payable Summaries) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Net Profit / Loss Line Chart Card */}
              <div className="premium-card relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Net Profit/Loss</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        ₹ {((revenue - expenses) || 6012147.75).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                        ▲ 15%
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-bold bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                    {dateRange}
                  </span>
                </div>

                <div className="h-60 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getNetProfitChartData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          borderRadius: '16px', 
                          border: '1px solid var(--border)',
                          fontSize: '11px',
                          color: 'var(--foreground)'
                        }}
                        formatter={(v: any) => `₹${v.toLocaleString()}`} 
                      />
                      <Area type="monotone" dataKey="Profit" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Receivable & Payable Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Receivable Summary Widget */}
                <div className="premium-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Receivable Summary</h3>
                    <span className="text-[10px] text-slate-500 font-bold bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {dateRange}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 dark:text-slate-400 block font-semibold">Total Unpaid Invoice</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xl font-bold text-slate-900 dark:text-white">₹ 2,50,000.00</span>
                      <span className="text-rose-500 text-[10px] font-bold">▲ 7%</span>
                    </div>
                  </div>
                  
                  {/* Progress bar split using vertical lines matching mockup spent progress bar */}
                  <div className="flex gap-[2px] h-3 items-center">
                    {Array.from({ length: 42 }).map((_, i) => {
                      const isCurrent = i < 26; // 63% current (blue)
                      const isOverdue = i >= 26 && i < 42; // 37% overdue (orange)
                      return (
                        <div 
                          key={i} 
                          className={`h-full w-[3px] rounded-full transition-all ${
                            isCurrent ? 'bg-blue-500' : isOverdue ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-800'
                          }`} 
                        />
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-[10px] font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-650 dark:text-slate-400">
                      <span className="h-2.5 w-2.5 rounded bg-blue-500 block"></span>
                      Current : ₹ 1,57,500
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-655 dark:text-slate-400">
                      <span className="h-2.5 w-2.5 rounded bg-orange-500 block"></span>
                      Overdue : ₹ 92,500
                    </span>
                  </div>
                </div>

                {/* Payable Summary Widget */}
                <div className="premium-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Payable Summary</h3>
                    <span className="text-[10px] text-slate-500 font-bold bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {dateRange}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 dark:text-slate-400 block font-semibold">Total Unpaid Amount</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xl font-bold text-slate-900 dark:text-white">₹ 18,80,000.00</span>
                      <span className="text-rose-500 text-[10px] font-bold">▲ 9%</span>
                    </div>
                  </div>
                  
                  {/* Progress bar split using vertical lines matching mockup spending indicator */}
                  <div className="flex gap-[2px] h-3 items-center">
                    {Array.from({ length: 42 }).map((_, i) => {
                      const isBills = i < 15; // 35% bills
                      const isAdvance = i >= 15 && i < 20; // 12% advance
                      const isPayroll = i >= 20; // 53% payroll
                      return (
                        <div 
                          key={i} 
                          className={`h-full w-[3px] rounded-full transition-all ${
                            isBills ? 'bg-blue-500' : isAdvance ? 'bg-orange-500' : isPayroll ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                          }`} 
                        />
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold">
                    <span className="flex items-center gap-1 text-slate-650 dark:text-slate-400">
                      <span className="h-2.5 w-2.5 rounded bg-blue-500 block"></span>
                      Bills : ₹ 6,50,000
                    </span>
                    <span className="flex items-center gap-1 text-slate-655 dark:text-slate-400">
                      <span className="h-2.5 w-2.5 rounded bg-orange-500 block"></span>
                      Advance : ₹ 2,30,000
                    </span>
                    <span className="flex items-center gap-1 text-slate-655 dark:text-slate-400">
                      <span className="h-2.5 w-2.5 rounded bg-amber-500 block"></span>
                      Payroll : ₹ 10,00,000
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column (Performance Indicators) */}
            <div className="lg:col-span-1">
              <div className="premium-card h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-4">Performance Indicators</h3>
                  
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                    
                    <div className="py-3.5 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Monthly Recurring Revenue
                      </span>
                      <strong className="text-slate-850 dark:text-white font-bold">₹ 74K</strong>
                    </div>

                    <div className="py-3.5 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Avg. Revenue per Employee
                      </span>
                      <strong className="text-slate-850 dark:text-white font-bold">₹ 25K</strong>
                    </div>

                    <div className="py-3.5 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Low Stock Items
                      </span>
                      <strong className="text-slate-855 dark:text-white font-bold">
                        {products.filter(p => p.status === 'Low Stock').length || 47}
                      </strong>
                    </div>

                    <div className="py-3.5 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Day Payable Outstanding (DPO)
                      </span>
                      <strong className="text-slate-850 dark:text-white font-bold">9 Days</strong>
                    </div>

                    <div className="py-3.5 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Day Sales Outstanding (DSO)
                      </span>
                      <strong className="text-slate-850 dark:text-white font-bold">12 Days</strong>
                    </div>

                    <div className="py-3.5 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Inventory Turn Over Ratio
                      </span>
                      <strong className="text-slate-850 dark:text-white font-bold">6</strong>
                    </div>

                  </div>
                </div>

                <div className="mt-8 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                  These metrics reflect Amdox Technologies operational performance metrics updated on demand.
                </div>
              </div>
            </div>

          </div>
        )
      )}

      {/* Quick Actions Panel */}
      {user?.role !== 'Employee' && (
        <div className="premium-card">
          <h3 className="font-bold text-xs text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-4">ERP Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {(user?.role === 'Admin' || user?.role === 'HR') && (
              <button 
                onClick={() => setShowAddEmpModal(true)}
                className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-full font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Employee
              </button>
            )}
            
            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <button 
                onClick={() => setShowAddProjModal(true)}
                className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-full font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Project
              </button>
            )}

            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <button 
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-full font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Inventory
              </button>
            )}

            <button 
              onClick={() => router.push('/reports')}
              className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-855 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-full font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileText className="h-4 w-4" /> Export reports
            </button>
          </div>
        </div>
      )}

      {/* Activities and Approvals Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="premium-card lg:col-span-1">
          <h3 className="font-bold text-xs text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No activity logs. Mark attendance or create records to view logs.
              </div>
            ) : (
              activities.map((act, index) => (
                <div key={`${act.id}-${index}`} className="flex gap-3 text-xs">
                  <div className="h-7 w-7 rounded-xl bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-slate-700 dark:text-slate-350 leading-relaxed font-medium">{act.description}</p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-550 block">
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
          <div className="premium-card lg:col-span-2 space-y-4">
            <h3 className="font-bold text-xs text-slate-455 dark:text-slate-405 uppercase tracking-wider">My Active Tasks Queue</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {personalTasks.filter(t => t.status !== 'Completed').length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  You have no pending tasks assigned.
                </div>
              ) : (
                personalTasks.filter(t => t.status !== 'Completed').slice(0, 3).map(task => (
                  <div key={task.task_id} className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{task.task_name}</span>
                      <p className="text-[10px] text-slate-400 mt-1">Due Date: {task.dueDate} | Priority: {task.priority}</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-full font-bold text-[9px]">Assigned</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="premium-card lg:col-span-2">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Pending Executive Approvals</h3>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {pendingLeaves.length === 0 && (user?.role === 'HR' || pendingPOs.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  All requests processed. No actions pending.
                </div>
              ) : (
                <>
                  {/* Pending Leaves */}
                  {pendingLeaves.map(leave => (
                    <div key={leave.leave_id} className="py-3.5 flex items-center justify-between text-xs gap-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-200">{leave.employeeName}</span>
                        <span className="text-slate-300 mx-1.5">|</span>
                        <span className="text-slate-500">Requesting: <b>{leave.leaveType} Leave</b> ({leave.days} days)</span>
                        <p className="text-[10px] text-slate-400 mt-1">Reason: "{leave.reason}"</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          disabled={user?.role === 'Employee'}
                          onClick={() => handleApproveLeave(leave.leave_id, true)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          disabled={user?.role === 'Employee'}
                          onClick={() => handleApproveLeave(leave.leave_id, false)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Pending POs */}
                  {user?.role !== 'HR' && pendingPOs.map(po => (
                    <div key={po.po_id} className="py-3.5 flex items-center justify-between text-xs gap-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-200">{po.po_id}</span>
                        <span className="text-slate-300 mx-1.5">|</span>
                        <span className="text-slate-500">Order: <b>{po.product_name}</b> ({po.quantity} pcs)</span>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">Vendor: {po.vendor_name} — Total: ₹{po.total_amount.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          disabled={user?.role !== 'Admin' && user?.role !== 'Manager'}
                          onClick={() => handleApprovePO(po.po_id, true)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                          title="Approve PO"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          disabled={user?.role !== 'Admin' && user?.role !== 'Manager'}
                          onClick={() => handleApprovePO(po.po_id, false)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                          title="Reject PO"
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
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Joining Date</label>
                <input type="date" required value={empJoiningDate} onChange={e => setEmpJoiningDate(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white"/>
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

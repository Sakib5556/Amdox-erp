'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthLayout from '../../components/layout/AuthLayout';
import AccessDenied from '../../components/layout/AccessDenied';
import PageHeader from '../../components/layout/PageHeader';
import { mockDb } from '../../services/mockDb';
import { useAuthStore } from '../../store/authStore';
import { Transaction } from '../../types';
import { 
  CreditCard, TrendingUp, TrendingDown, Plus, Download, Search, Filter, 
  ArrowUpRight, ArrowDownRight, Briefcase, DollarSign, Calendar, FileSpreadsheet, FileDown, FileText
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';

function FinancePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const currentTab = searchParams.get('tab') || 'expenses';



  // DB States
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  // Add Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [txType, setTxType] = useState<'Revenue' | 'Expense'>('Expense');
  const [txCat, setTxCat] = useState<Transaction['category']>('Utilities');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState('');

  const loadData = () => {
    setTransactions(mockDb.getTransactions());
  };

  useEffect(() => {
    mockDb.initialize();
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    // Real-time synchronization when database changes in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('company_') || e.key.startsWith('erp_') || e.key === 'erp_auth_user')) {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Backup polling for real-time changes
    const interval = setInterval(loadData, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'addTransaction') {
      setTimeout(() => setShowAddModal(true), 0);
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  if (user?.role !== 'Admin') {
    return (
      <AuthLayout>
        <AccessDenied role={user?.role} allowedRoles={['Admin']} />
      </AuthLayout>
    );
  }

  const changeTab = (tabName: string) => {
    router.push(`/finance?tab=${tabName}`);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txDesc || !txDate) return;

    mockDb.addTransaction({
      type: txType,
      category: txCat,
      amount: parseFloat(txAmount),
      date: txDate,
      description: txDesc,
    });

    setTxAmount('');
    setTxDesc('');
    setTxDate('');
    setShowAddModal(false);
    loadData();
  };

  // Transaction Lists Helpers
  const getExpenses = () => transactions.filter(t => t.type === 'Expense');
  const getRevenue = () => transactions.filter(t => t.type === 'Revenue');

  const getFilteredTransactions = (list: Transaction[]) => {
    return list.filter(t => {
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = catFilter === 'All' || t.category === catFilter;
      return matchSearch && matchCat;
    });
  };

  // Totals
  const getTotalExpenses = () => getExpenses().reduce((sum, t) => sum + t.amount, 0);
  const getTotalRevenue = () => getRevenue().reduce((sum, t) => sum + t.amount, 0);

  // Recharts Expense Data preparation
  const getExpensePieData = () => {
    const categories: Record<string, number> = {};
    getExpenses().forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.keys(categories).map(cat => ({
      name: cat,
      value: categories[cat]
    }));
  };

  // Recharts Revenue Bar Data preparation
  const getRevenueBarData = () => {
    const categories: Record<string, number> = {};
    getRevenue().forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.keys(categories).map(cat => ({
      name: cat,
      value: categories[cat]
    }));
  };

  const PIE_COLORS = ['#f59e0b', '#ec4899', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6'];

  // Simulated Exports (downloads a mock CSV text file in the browser!)
  const handleExport = (reportType: string, format: 'csv' | 'json') => {
    let dataString = '';
    let filename = `erp_${reportType}_report_${new Date().toISOString().split('T')[0]}`;

    if (reportType === 'financial') {
      if (format === 'csv') {
        dataString = 'ID,Type,Category,Amount,Date,Description\n' + 
          transactions.map(t => `"${t.transaction_id}","${t.type}","${t.category}",${t.amount},"${t.date}","${t.description}"`).join('\n');
        filename += '.csv';
      } else {
        dataString = JSON.stringify(transactions, null, 2);
        filename += '.json';
      }
    } else if (reportType === 'inventory') {
      const prods = mockDb.getProducts();
      if (format === 'csv') {
        dataString = 'Product ID,Name,Category,Stock Quantity,Price,Status\n' +
          prods.map(p => `"${p.product_id}","${p.product_name}","${p.category}",${p.quantity},${p.price},"${p.status}"`).join('\n');
        filename += '.csv';
      } else {
        dataString = JSON.stringify(prods, null, 2);
        filename += '.json';
      }
    } else if (reportType === 'attendance') {
      const att = mockDb.getAttendance();
      if (format === 'csv') {
        dataString = 'Attendance ID,Employee ID,Date,Status,Check In,Check Out\n' +
          att.map(a => `"${a.attendance_id}","${a.emp_id}","${a.date}","${a.status}","${a.checkIn || ''}","${a.checkOut || ''}"`).join('\n');
        filename += '.csv';
      } else {
        dataString = JSON.stringify(att, null, 2);
        filename += '.json';
      }
    } else if (reportType === 'projects') {
      const projs = mockDb.getProjects();
      if (format === 'csv') {
        dataString = 'Project ID,Name,Manager,Budget,Deadline,Progress %,Status\n' +
          projs.map(p => `"${p.project_id}","${p.project_name}","${p.managerName}",${p.budget},"${p.deadline}",${p.progress},"${p.status}"`).join('\n');
        filename += '.csv';
      } else {
        dataString = JSON.stringify(projs, null, 2);
        filename += '.json';
      }
    }

    // Trigger download
    const blob = new Blob([dataString], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mockDb.logActivity(`Exported ${reportType} report as ${format.toUpperCase()}`, 'Finance');
  };

  return (
    <AuthLayout>
      <PageHeader
        title="Corporate Finance Ledger"
        description="Analyze corporate revenue streams, issue invoices, log operating expenses, and export fiscal summaries."
        actions={
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button 
              onClick={() => changeTab('expenses')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'expenses' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5" /> Expenses & Accounts
            </button>
            <button 
              onClick={() => changeTab('revenue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'revenue' || currentTab === 'invoices'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" /> Revenue & Invoices
            </button>
            <button 
              onClick={() => changeTab('reports')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'reports' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
              }`}
            >
              <Download className="h-3.5 w-3.5" /> Export Reports
            </button>
          </div>
        }
      />

      {/* -------------------- 1. EXPENSES TAB -------------------- */}
      {currentTab === 'expenses' && (
        <div className="space-y-6">
          
          {/* Stats & Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* KPI Cards column */}
            <div className="space-y-4 lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Ledger Expenses</span>
                  <span className="text-xl font-bold text-slate-850 dark:text-white mt-1 block">₹{getTotalExpenses().toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Operational Categories</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Salaries (HR)</span>
                    <span className="font-mono font-bold">₹7,10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Purchase Orders (Inventory)</span>
                    <span className="font-mono font-bold">₹6,00,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Office Utilities</span>
                    <span className="font-mono font-bold">₹45,000</span>
                  </div>
                </div>
              </div>

              {user?.role === 'Admin' && (
                <button
                  onClick={() => { setTxType('Expense'); setTxCat('Utilities'); setShowAddModal(true); }}
                  className="w-full py-2.5 bg-rose-650 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-650/10"
                >
                  <Plus className="h-4 w-4" /> Add Expense Claim
                </button>
              )}
            </div>

            {/* Expense Distribution Pie */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 lg:col-span-2">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Expenses Category Breakout</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getExpensePieData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={45}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {getExpensePieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => `₹${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Table list */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b dark:border-slate-855 flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Expense Registry Logs</h3>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search expense description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="border dark:border-slate-750 dark:bg-slate-800 px-3 py-1.5 rounded text-xs"
                />
                <select
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value)}
                  className="border dark:border-slate-750 dark:bg-slate-800 px-3 py-1.5 rounded text-xs"
                >
                  <option value="All">All Categories</option>
                  <option value="Salary">Salary</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Purchase Order">Purchase Order</option>
                  <option value="Travel">Travel</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                    <th className="p-4">Txn ID</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Transaction Date</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {getFilteredTransactions(getExpenses()).map((t) => (
                    <tr key={t.transaction_id}>
                      <td className="p-4 font-mono font-semibold text-slate-500">{t.transaction_id}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                          {t.category}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-900 dark:text-white">{t.description}</td>
                      <td className="p-4 text-slate-400 font-mono text-[10px]">{t.date}</td>
                      <td className="p-4 text-right font-mono font-bold text-rose-600">₹{t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- 2. REVENUE TAB -------------------- */}
      {(currentTab === 'revenue' || currentTab === 'invoices') && (
        <div className="space-y-6">
          
          {/* Stats & Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* KPI Cards column */}
            <div className="space-y-4 lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Month Revenue</span>
                  <span className="text-xl font-bold text-slate-850 dark:text-white mt-1 block">₹{getTotalRevenue().toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-2">Revenue Growth Rates</span>
                <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-350">
                  Target threshold growth rate: <span className="text-emerald-500 font-bold flex items-center"><ArrowUpRight className="h-3.5 w-3.5"/> +12.4%</span>
                </p>
                <p className="text-slate-400 mt-1">Enterprise license billing accounts for 75% of overall sales.</p>
              </div>

              {user?.role === 'Admin' && (
                <button
                  onClick={() => { setTxType('Revenue'); setTxCat('Sales'); setShowAddModal(true); }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-650/10"
                >
                  <Plus className="h-4 w-4" /> Log Invoice / Payment
                </button>
              )}
            </div>

            {/* Revenue Breakout */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 lg:col-span-2">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Revenue Stream Allocations</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getRevenueBarData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v/100000}L`} />
                    <Tooltip formatter={(v: any) => `₹${v.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Table list */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b dark:border-slate-855 flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Revenue Transaction Ledger</h3>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="border dark:border-slate-750 dark:bg-slate-800 px-3 py-1.5 rounded text-xs"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                    <th className="p-4">Txn ID</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Transaction Date</th>
                    <th className="p-4 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-855 text-xs">
                  {getFilteredTransactions(getRevenue()).map((t) => (
                    <tr key={t.transaction_id}>
                      <td className="p-4 font-mono font-semibold text-slate-500">{t.transaction_id}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                          {t.category}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-900 dark:text-white">{t.description}</td>
                      <td className="p-4 text-slate-400 font-mono text-[10px]">{t.date}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-600">₹{t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- 3. REPORTS TAB -------------------- */}
      {currentTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
            <div className="flex gap-4">
              <div className="p-3 bg-emerald-55 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-850 dark:text-white">Finance & Ledger Sheets</h4>
                <p className="text-xs text-slate-400 mt-1">Export complete cashflows history of utilities, salary payouts, and revenue streams.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold border-t dark:border-slate-800 pt-3">
              <button 
                onClick={() => handleExport('financial', 'json')} 
                className="px-3 py-1.5 border dark:border-slate-700 rounded-lg text-slate-500"
              >
                Export JSON
              </button>
              <button 
                onClick={() => handleExport('financial', 'csv')} 
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg inline-flex items-center gap-1"
              >
                <FileSpreadsheet className="h-4 w-4" /> Download CSV
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
            <div className="flex gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-850 dark:text-white">Attendance & Absence Logs</h4>
                <p className="text-xs text-slate-400 mt-1">Export employee check-in logs and late entries records.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold border-t dark:border-slate-800 pt-3">
              <button 
                onClick={() => handleExport('attendance', 'json')} 
                className="px-3 py-1.5 border dark:border-slate-700 rounded-lg text-slate-500"
              >
                Export JSON
              </button>
              <button 
                onClick={() => handleExport('attendance', 'csv')} 
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg inline-flex items-center gap-1"
              >
                <FileSpreadsheet className="h-4 w-4" /> Download CSV
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-850 dark:text-white">Inventory Stocks & PO Sheets</h4>
                <p className="text-xs text-slate-400 mt-1">Export stock quantities and purchase orders status lists.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold border-t dark:border-slate-800 pt-3">
              <button 
                onClick={() => handleExport('inventory', 'json')} 
                className="px-3 py-1.5 border dark:border-slate-700 rounded-lg text-slate-500"
              >
                Export JSON
              </button>
              <button 
                onClick={() => handleExport('inventory', 'csv')} 
                className="px-3 py-1.5 bg-amber-550 hover:bg-amber-500 text-white rounded-lg inline-flex items-center gap-1"
              >
                <FileSpreadsheet className="h-4 w-4" /> Download CSV
              </button>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
            <div className="flex gap-4">
              <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-xl shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-850 dark:text-white">Projects Sprint & Resource Utilization</h4>
                <p className="text-xs text-slate-400 mt-1">Export milestone progress and manager metrics data sheets.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold border-t dark:border-slate-800 pt-3">
              <button 
                onClick={() => handleExport('projects', 'json')} 
                className="px-3 py-1.5 border dark:border-slate-700 rounded-lg text-slate-500"
              >
                Export JSON
              </button>
              <button 
                onClick={() => handleExport('projects', 'csv')} 
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg inline-flex items-center gap-1"
              >
                <FileSpreadsheet className="h-4 w-4" /> Download CSV
              </button>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- DYNAMIC MODALS -------------------- */}

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddTransaction} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-850 dark:text-white">Log {txType}</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Category</label>
                  <select 
                    value={txCat} 
                    onChange={e => setTxCat(e.target.value as any)} 
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg"
                  >
                    {txType === 'Expense' ? (
                      <>
                        <option value="Utilities">Utilities</option>
                        <option value="Travel">Travel</option>
                        <option value="Salary">Salary</option>
                        <option value="Operations">Operations</option>
                        <option value="Other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="Sales">Sales Revenue</option>
                        <option value="Other">Other Revenue</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={txAmount} 
                    onChange={e => setTxAmount(e.target.value)} 
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" 
                    placeholder="2500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Transaction Date</label>
                <input 
                  type="date" 
                  required 
                  value={txDate} 
                  onChange={e => setTxDate(e.target.value)} 
                  className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Description</label>
                <input 
                  type="text" 
                  required 
                  value={txDesc} 
                  onChange={e => setTxDesc(e.target.value)} 
                  className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" 
                  placeholder="e.g. Electricity bill payout"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`px-4 py-2 text-white rounded-lg ${
                  txType === 'Expense' ? 'bg-rose-650 hover:bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                Log Transaction
              </button>
            </div>
          </form>
        </div>
      )}

    </AuthLayout>
  );
}

export default function FinancePage() {
  return (
    <React.Suspense fallback={
      <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-xs text-slate-400">Loading Finance ledger...</p>
      </div>
    }>
      <FinancePageContent />
    </React.Suspense>
  );
}


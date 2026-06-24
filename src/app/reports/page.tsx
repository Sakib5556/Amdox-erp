'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthLayout from '../../components/layout/AuthLayout';
import AccessDenied from '../../components/layout/AccessDenied';
import PageHeader from '../../components/layout/PageHeader';
import { mockDb } from '../../services/mockDb';
import { useAuthStore } from '../../store/authStore';
import { 
  FileText, Calendar, Box, FolderKanban, Download, 
  FileSpreadsheet, Sparkles, CheckCircle2, ShieldAlert
} from 'lucide-react';

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const currentTab = searchParams.get('tab') || (user?.role === 'HR' ? 'employee' : 'financial');
  const [successMsg, setSuccessMsg] = useState('');



  useEffect(() => {
    mockDb.initialize();
  }, []);

  if (user?.role === 'Employee') {
    return (
      <AuthLayout>
        <AccessDenied role={user?.role} allowedRoles={['Admin', 'HR', 'Manager']} />
      </AuthLayout>
    );
  }

  if (user?.role === 'HR' && currentTab !== 'employee') {
    return (
      <AuthLayout>
        <AccessDenied role={user?.role} allowedRoles={['HR (Employee Sheets Only)']} />
      </AuthLayout>
    );
  }

  if (user?.role === 'Manager' && currentTab === 'employee') {
    return (
      <AuthLayout>
        <AccessDenied role={user?.role} allowedRoles={['Manager (Fiscal & Stock Sheets Only)']} />
      </AuthLayout>
    );
  }

  const changeTab = (tabName: string) => {
    router.push(`/reports?tab=${tabName}`);
  };

  const handleExport = (reportType: string, format: 'csv' | 'json') => {
    let dataString = '';
    let filename = `erp_${reportType}_report_${new Date().toISOString().split('T')[0]}`;
    const txns = mockDb.getTransactions();

    if (reportType === 'financial') {
      if (format === 'csv') {
        dataString = 'ID,Type,Category,Amount,Date,Description\n' + 
          txns.map(t => `"${t.transaction_id}","${t.type}","${t.category}",${t.amount},"${t.date}","${t.description}"`).join('\n');
        filename += '.csv';
      } else {
        dataString = JSON.stringify(txns, null, 2);
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
    } else if (reportType === 'employee') {
      const emps = mockDb.getEmployees();
      if (format === 'csv') {
        dataString = 'Employee ID,Name,Department,Designation,Email,Phone,Salary,Status\n' +
          emps.map(e => `"${e.emp_id}","${e.name}","${e.department}","${e.designation}","${e.email}","${e.phone}",${e.salary},"${e.status}"`).join('\n');
        filename += '.csv';
      } else {
        dataString = JSON.stringify(emps, null, 2);
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
    
    mockDb.logActivity(`Exported ${reportType} report as ${format.toUpperCase()} from reports portal`, 'Finance');
    setSuccessMsg(`Report downloaded: ${filename}`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  return (
    <AuthLayout>
      <PageHeader 
        title="Reports & Analytics Portal" 
        description="Extract and download enterprise-wide operational CSV/JSON sheets for external audits."
        actions={
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <button 
                onClick={() => changeTab('financial')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'financial' 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Fiscal Ledger
              </button>
            )}
            {(user?.role === 'Admin' || user?.role === 'HR') && (
              <button 
                onClick={() => changeTab('employee')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'employee' 
                    ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" /> Employee Sheets
              </button>
            )}
            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <button 
                onClick={() => changeTab('inventory')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'inventory' 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
                }`}
              >
                <Box className="h-3.5 w-3.5" /> Stock & Supply
              </button>
            )}
          </div>
        }
      />

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 text-emerald-600 dark:text-emerald-450 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        
        {/* Detail Panel */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-4.5 w-4.5" /> Active Report Selection: {currentTab.toUpperCase()}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            This option exports all historical registry fields for {currentTab} parameters directly from the browser local storage context. You can choose either spreadsheet friendly CSV or standard JSON format.
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-850/30 rounded-xl border dark:border-slate-800 flex items-center gap-2 text-slate-500">
            <Sparkles className="h-4 w-4 text-indigo-650" />
            <span>AI recommendation: Exporting monthly ledger lists regularly helps improve predictive demand model accuracy.</span>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleExport(currentTab, 'csv')}
              className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" /> Download CSV Format
            </button>
            <button
              onClick={() => handleExport(currentTab, 'json')}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 font-semibold rounded-lg text-slate-700 dark:text-slate-250 flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" /> Download JSON Format
            </button>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Reports Summary Info</h4>
          <div className="space-y-3">
            <div className="flex justify-between border-b dark:border-slate-850 pb-2">
              <span className="text-slate-500">Finance Transactions</span>
              <span className="font-mono font-bold text-slate-850 dark:text-slate-200">{mockDb.getTransactions().length} Logs</span>
            </div>
            <div className="flex justify-between border-b dark:border-slate-850 pb-2">
              <span className="text-slate-500">Active Employees</span>
              <span className="font-mono font-bold text-slate-850 dark:text-slate-200">{mockDb.getEmployees().filter(e=>e.status==='Active').length} Logs</span>
            </div>
            <div className="flex justify-between border-b dark:border-slate-850 pb-2">
              <span className="text-slate-500">Products Tracked</span>
              <span className="font-mono font-bold text-slate-850 dark:text-slate-200">{mockDb.getProducts().length} Logs</span>
            </div>
            <div className="flex justify-between border-b dark:border-slate-850 pb-2">
              <span className="text-slate-500">Milestone Projects</span>
              <span className="font-mono font-bold text-slate-850 dark:text-slate-200">{mockDb.getProjects().length} Logs</span>
            </div>
          </div>
        </div>

      </div>
    </AuthLayout>
  );
}

export default function ReportsPage() {
  return (
    <React.Suspense fallback={
      <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-xs text-slate-400">Loading Reports portal...</p>
      </div>
    }>
      <ReportsPageContent />
    </React.Suspense>
  );
}


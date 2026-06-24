'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthLayout from '../../components/layout/AuthLayout';
import AccessDenied from '../../components/layout/AccessDenied';
import PageHeader from '../../components/layout/PageHeader';
import { mockDb } from '../../services/mockDb';
import { useAuthStore } from '../../store/authStore';
import { Employee, Attendance, LeaveRequest } from '../../types';
import { 
  Users, Calendar, FileText, BadgeAlert, Plus, Search, Filter, 
  Trash2, Eye, Award, DollarSign, Clock, Check, X, FileDown, ShieldAlert
} from 'lucide-react';

function HRPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const currentTab = searchParams.get('tab') || 'employees';

  // Filters will be declared below database states

  // Database States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Modal / Detail drawer states
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState<Employee | null>(null);

  // Form Fields for Add Employee
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Employee' | 'Manager'>('Employee');
  const [dept, setDept] = useState('IT');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [deptManagers, setDeptManagers] = useState<Record<string, string>>({
    IT: '',
    HR: '',
    Finance: '',
    Operations: ''
  });

  // Form Fields for Attendance Logger
  const [attendanceEmpId, setAttendanceEmpId] = useState('');

  // Form Fields for Leave Application
  const [leaveType, setLeaveType] = useState<'Casual' | 'Sick' | 'Annual' | 'Half Day'>('Casual');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Payroll Calculation States
  const [bonus, setBonus] = useState<Record<string, number>>({});
  const [deduction, setDeduction] = useState<Record<string, number>>({});

  // Find corresponding employee record
  const currentEmp = employees.find(e => e.email.toLowerCase() === user?.email?.toLowerCase());
  const empId = currentEmp?.emp_id;

  // Filter lists based on role
  const filteredAttendance = user?.role === 'Employee'
    ? attendance.filter(a => a.emp_id === empId)
    : attendance;

  const filteredLeaves = user?.role === 'Employee'
    ? leaves.filter(l => l.emp_id === empId || l.employeeName === user?.name)
    : leaves;

  const filteredPayrollEmps = user?.role === 'Employee'
    ? employees.filter(e => e.email.toLowerCase() === user?.email?.toLowerCase() && e.status === 'Active')
    : employees.filter(e => e.status === 'Active');

  const loadData = () => {
    setEmployees(mockDb.getEmployees());
    setAttendance(mockDb.getAttendance());
    setLeaves(mockDb.getLeaves());
    if (typeof window !== 'undefined') {
      const storedManagers = localStorage.getItem('erp_department_managers');
      if (storedManagers) {
        setDeptManagers(JSON.parse(storedManagers));
      }
    }
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

  const changeTab = (tabName: string) => {
    router.push(`/hr?tab=${tabName}`);
  };

  const handleAssignDeptManager = (deptName: string, empId: string) => {
    const updated = { ...deptManagers, [deptName]: empId };
    setDeptManagers(updated);
    localStorage.setItem('erp_department_managers', JSON.stringify(updated));
    
    // Log activity
    const empObj = employees.find(e => e.emp_id === empId);
    const empName = empObj ? empObj.name : 'None';
    mockDb.logActivity(`Assigned ${empName} as Manager for the ${deptName} department`, 'HR');
    mockDb.addNotification(
      `Manager for ${deptName} department has been updated to ${empName}`,
      'success',
      ['Admin', 'HR']
    );
  };

  // 1. Employees Tab Functions
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'Admin' && user?.role !== 'HR') {
      alert('Only Admin and HR are authorized to create user accounts.');
      return;
    }
    if (!name || !email || !personalEmail || !password || !designation || !salary || !joiningDate) return;

    // 1. Create global user account in erp_global_users
    mockDb.registerGlobalUser({
      id: `USR-${Date.now()}`,
      name: name,
      email: email, // Work email is the login credential email
      role: selectedRole,
      password: password,
      avatarUrl: ''
    });

    // 2. Add employee profile to roster
    mockDb.addEmployee({
      name,
      department: dept,
      designation,
      email,
      personalEmail,
      phone: phone || '+91 99999 88888',
      salary: parseFloat(salary),
      status: 'Active',
      joiningDate: joiningDate || new Date().toISOString().split('T')[0]
    });

    // 3. Trigger mock mailing alert and log system notification
    mockDb.addNotification(
      `Welcome email successfully simulated and sent to personal email: ${personalEmail} with corporate login ID: ${email} and password: ${password}`,
      'success',
      ['Admin', 'HR']
    );

    alert(`${selectedRole} added successfully!\n\nCredentials:\nWork Email: ${email}\nInitial Password: ${password}\n\n(A welcome email has been mock-sent to: ${personalEmail})`);

    setName('');
    setSelectedRole('Employee');
    setDesignation('');
    setEmail('');
    setPersonalEmail('');
    setPassword('');
    setPhone('');
    setSalary('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setShowAddModal(false);
    loadData();
  };

  const handleDeleteEmployee = (id: string) => {
    if (user?.role !== 'Admin' && user?.role !== 'HR') {
      alert('Only Admin and HR can delete accounts.');
      return;
    }
    if (confirm('Are you sure you want to delete this employee record?')) {
      mockDb.deleteEmployee(id);
      loadData();
    }
  };

  const toggleEmpStatus = (emp: Employee) => {
    if (user?.role !== 'Admin' && user?.role !== 'HR') {
      alert('Only Admin and HR can change employee status.');
      return;
    }
    mockDb.updateEmployee({
      ...emp,
      status: emp.status === 'Active' ? 'Inactive' : 'Active'
    });
    loadData();
  };

  const getFilteredEmployees = () => {
    return employees.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.emp_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = deptFilter === 'All' || e.department === deptFilter;
      return matchSearch && matchDept;
    });
  };

  // 2. Attendance Tab Functions
  const handleMarkAttendance = (targetEmpId: string, status: 'Present' | 'Late') => {
    if (user?.role !== 'Admin' && user?.role !== 'HR') {
      alert('Only Admin and HR are authorized to mark attendance.');
      return;
    }
    if (!targetEmpId) {
      alert('Please select an employee.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    const alreadyChecked = attendance.some(a => a.emp_id === targetEmpId && a.date === todayStr);
    if (alreadyChecked) {
      alert('Attendance for this employee has already been marked for today.');
      return;
    }

    const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    mockDb.markAttendance({
      emp_id: targetEmpId,
      date: todayStr,
      status,
      checkIn: checkInTime,
      checkOut: '06:00 PM'
    });

    loadData();
    const empName = employees.find(e => e.emp_id === targetEmpId)?.name || 'Employee';
    alert(`Attendance marked for ${empName} successfully at ${checkInTime} as ${status}!`);
    setAttendanceEmpId('');
  };

  const getTodayAttendanceStats = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (user?.role === 'Employee') {
      const personalLogs = attendance.filter(a => a.emp_id === empId);
      const present = personalLogs.filter(a => a.status === 'Present').length;
      const late = personalLogs.filter(a => a.status === 'Late').length;
      const leave = personalLogs.filter(a => a.status === 'Leave').length;
      const halfDay = personalLogs.filter(a => a.status === 'Half Day').length;
      const absent = personalLogs.filter(a => a.status === 'Absent').length;
      return { present, late, leave, absent, halfDay };
    }
    const todayLogs = attendance.filter(a => a.date === todayStr);
    
    const present = todayLogs.filter(a => a.status === 'Present').length;
    const late = todayLogs.filter(a => a.status === 'Late').length;
    const leave = todayLogs.filter(a => a.status === 'Leave').length;
    const halfDay = todayLogs.filter(a => a.status === 'Half Day').length;
    const totalActive = employees.filter(e => e.status === 'Active').length;
    const absent = Math.max(0, totalActive - (present + late + leave + halfDay));

    return { present, late, leave, absent, halfDay };
  };

  // 3. Leaves Tab Functions
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFrom || !leaveTo || !leaveReason) return;

    if (!user) return;
    const matchingEmp = employees.find(e => e.email.toLowerCase() === user.email.toLowerCase());
    
    const from = new Date(leaveFrom);
    const to = new Date(leaveTo);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const daysCount = leaveType === 'Half Day' ? 0.5 : diffDays;

    mockDb.applyLeave({
      emp_id: matchingEmp?.emp_id || 'EMP-003',
      employeeName: user.name,
      leaveType,
      fromDate: leaveFrom,
      toDate: leaveTo,
      days: daysCount,
      reason: leaveReason
    });

    setLeaveFrom('');
    setLeaveTo('');
    setLeaveReason('');
    loadData();
    alert('Leave request submitted successfully.');
  };

  const handleLeaveDecision = (id: string, approve: boolean) => {
    mockDb.updateLeaveStatus(id, approve ? 'Approved' : 'Rejected');
    loadData();
  };

  // 4. Payroll Tab Functions
  const handlePayrollValueChange = (empId: string, type: 'bonus' | 'deduction', val: string) => {
    const numericVal = parseFloat(val) || 0;
    if (type === 'bonus') {
      setBonus(prev => ({ ...prev, [empId]: numericVal }));
    } else {
      setDeduction(prev => ({ ...prev, [empId]: numericVal }));
    }
  };

  return (
    <AuthLayout>
      <PageHeader 
        title="HR & Payroll Management" 
        description="Oversee employee profiles, mark digital attendance cards, handle leaves, and distribute monthly payroll."
        actions={
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button 
              onClick={() => changeTab('employees')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'employees' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              <Users className="h-3.5 w-3.5" /> Employees
            </button>
            <button 
              onClick={() => changeTab('attendance')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'attendance' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> Attendance
            </button>
            <button 
              onClick={() => changeTab('leave')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'leave' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              <BadgeAlert className="h-3.5 w-3.5" /> Leave Requests
            </button>
            <button 
              onClick={() => changeTab('payroll')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'payroll' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Payroll
            </button>
          </div>
        }
      />

      {/* -------------------- 1. EMPLOYEES TAB -------------------- */}
      {currentTab === 'employees' && (
        user?.role === 'Employee' ? (
          <AccessDenied role={user?.role} allowedRoles={['Admin', 'HR', 'Manager']} />
        ) : (
          <div className="space-y-6">
            
            {/* Controls Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-1 gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute inset-y-0 left-0 pl-3 h-full w-4 text-slate-400 self-center pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by ID, name, email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                    className="border dark:border-slate-750 dark:bg-slate-850 py-2 px-3 rounded-lg text-xs"
                  >
                    <option value="All">All Departments</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>
              
              {(user?.role === 'Admin' || user?.role === 'HR') && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 flex items-center gap-1.5 self-start md:self-auto"
                >
                  <Plus className="h-4 w-4" /> Add Employee / Manager
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Employees list */}
              <div className="lg:col-span-2 space-y-4">
                {/* Employees List Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                          <th className="p-4">Employee ID</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">Department</th>
                          <th className="p-4">Designation</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                        {getFilteredEmployees().length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400">
                              No employees found matching the filters.
                            </td>
                          </tr>
                        ) : (
                          getFilteredEmployees().map((emp) => (
                            <tr key={emp.emp_id} className="hover:bg-slate-50 dark:hover:bg-slate-850/40">
                              <td className="p-4 font-mono font-semibold text-slate-500">{emp.emp_id}</td>
                              <td className="p-4 font-semibold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  {emp.avatarUrl ? (
                                    <img src={emp.avatarUrl} alt={emp.name} className="h-6 w-6 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-800" />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-slate-205 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
                                      <svg className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 fill-current mt-1" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                      </svg>
                                    </div>
                                  )}
                                  <span>{emp.name}</span>
                                </div>
                              </td>
                              <td className="p-4">{emp.department}</td>
                              <td className="p-4 text-slate-500">{emp.designation}</td>
                              <td className="p-4 text-slate-500">{emp.email}</td>
                              <td className="p-4">
                                <button
                                  disabled={user?.role !== 'Admin' && user?.role !== 'HR'}
                                  onClick={() => toggleEmpStatus(emp)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer disabled:cursor-default ${
                                    emp.status === 'Active' 
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                                >
                                  {emp.status}
                                </button>
                              </td>
                              <td className="p-4 text-right flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={() => setSelectedEmp(emp)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                                  title="View Profile Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {(user?.role === 'Admin' || user?.role === 'HR') && (
                                  <button 
                                    onClick={() => handleDeleteEmployee(emp.emp_id)}
                                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded text-rose-500"
                                    title="Delete Record"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Department Managers Allocation Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  <div>
                    <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Department Managers</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Assign manager coverage for corporate divisions.</p>
                  </div>
                  
                  <div className="space-y-4 text-xs">
                    {['IT', 'HR', 'Finance', 'Operations'].map((deptName) => {
                      const assignedMgrId = deptManagers[deptName] || '';
                      const assignedEmp = employees.find(e => e.emp_id === assignedMgrId);
                      
                      return (
                        <div key={deptName} className="p-3 bg-slate-50 dark:bg-slate-800/40 border dark:border-slate-800 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[10px] text-slate-400 uppercase">{deptName} Division</span>
                            {assignedEmp && (
                              <span className="text-[9px] bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded">
                                Allocated
                              </span>
                            )}
                          </div>
                          
                          {(user?.role === 'Admin' || user?.role === 'HR') ? (
                            <select
                              value={assignedMgrId}
                              onChange={(e) => handleAssignDeptManager(deptName, e.target.value)}
                              className="w-full px-2 py-1.5 border dark:border-slate-750 dark:bg-slate-800 rounded text-xs text-slate-800 dark:text-slate-200"
                            >
                              <option value="">-- Choose Manager --</option>
                              {employees.map(emp => (
                                <option key={emp.emp_id} value={emp.emp_id}>
                                  {emp.name} ({emp.designation})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="font-medium text-slate-700 dark:text-slate-300 py-1">
                              {assignedEmp ? (
                                <span>{assignedEmp.name} <span className="text-[10px] text-slate-450">({assignedEmp.designation})</span></span>
                              ) : (
                                <span className="text-slate-400 italic">No Manager Assigned</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Details Drawer Modal */}
            {selectedEmp && (
              <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-end">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-100 dark:border-slate-800">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b dark:border-slate-800">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Employee Dossier</h3>
                      <button onClick={() => setSelectedEmp(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="flex flex-col items-center text-center gap-2">
                      {selectedEmp.avatarUrl ? (
                        <img
                          src={selectedEmp.avatarUrl}
                          alt={selectedEmp.name}
                          className="h-20 w-20 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-950 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-slate-205 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 shadow-sm">
                          <svg className="h-16 w-16 text-slate-400 dark:text-slate-500 fill-current mt-3" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{selectedEmp.name}</h4>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{selectedEmp.designation}</span>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-3 py-1.5 border-b dark:border-slate-850">
                        <span className="text-slate-400 font-medium">Employee ID</span>
                        <span className="col-span-2 font-mono font-semibold">{selectedEmp.emp_id}</span>
                      </div>
                      <div className="grid grid-cols-3 py-1.5 border-b dark:border-slate-850">
                        <span className="text-slate-400 font-medium">Department</span>
                        <span className="col-span-2">{selectedEmp.department}</span>
                      </div>
                      <div className="grid grid-cols-3 py-1.5 border-b dark:border-slate-850">
                        <span className="text-slate-400 font-medium">Company Email</span>
                        <span className="col-span-2">{selectedEmp.email}</span>
                      </div>
                      <div className="grid grid-cols-3 py-1.5 border-b dark:border-slate-850">
                        <span className="text-slate-400 font-medium">Personal Email</span>
                        <span className="col-span-2">{selectedEmp.personalEmail || 'Not Recorded'}</span>
                      </div>
                      <div className="grid grid-cols-3 py-1.5 border-b dark:border-slate-850">
                        <span className="text-slate-400 font-medium">Phone</span>
                        <span className="col-span-2">{selectedEmp.phone}</span>
                      </div>
                      <div className="grid grid-cols-3 py-1.5 border-b dark:border-slate-850">
                        <span className="text-slate-400 font-medium">Monthly Salary</span>
                        <span className="col-span-2 font-semibold text-slate-900 dark:text-white">₹{selectedEmp.salary.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-3 py-1.5 border-b dark:border-slate-850">
                        <span className="text-slate-400 font-medium">Joining Date</span>
                        <span className="col-span-2">{selectedEmp.joiningDate}</span>
                      </div>
                      <div className="grid grid-cols-3 py-1.5 border-b dark:border-slate-850">
                        <span className="text-slate-400 font-medium">Work Status</span>
                        <span className="col-span-2 font-semibold">{selectedEmp.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-slate-800">
                    <button 
                      onClick={() => { setShowPayslipModal(selectedEmp); setSelectedEmp(null); }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText className="h-4 w-4" /> View Salary Slip
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )
      )}

      {/* -------------------- 2. ATTENDANCE TAB -------------------- */}
      {currentTab === 'attendance' && (
        <div className="space-y-6">
          
          {/* Today Attendance Cards Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {user?.role === 'Employee' ? 'My Present Days' : 'Today Present'}
              </span>
              <span className="text-2xl font-bold text-emerald-500 mt-2 block">{getTodayAttendanceStats().present}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {user?.role === 'Employee' ? 'My Late Days' : 'Today Late Arrivals'}
              </span>
              <span className="text-2xl font-bold text-amber-500 mt-2 block">{getTodayAttendanceStats().late}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {user?.role === 'Employee' ? 'My Leave Days' : 'On Approved Leave'}
              </span>
              <span className="text-2xl font-bold text-indigo-500 mt-2 block">{getTodayAttendanceStats().leave}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {user?.role === 'Employee' ? 'My Half Days' : 'Today Half Days'}
              </span>
              <span className="text-2xl font-bold text-sky-500 mt-2 block">{getTodayAttendanceStats().halfDay || 0}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {user?.role === 'Employee' ? 'My Absent Days' : 'Today Absentees'}
              </span>
              <span className="text-2xl font-bold text-rose-500 mt-2 block">{getTodayAttendanceStats().absent}</span>
            </div>
          </div>

          {/* Clock In / Attendance Marking Widget */}
          {(user?.role === 'Admin' || user?.role === 'HR') ? (
            <div className="bg-gradient-to-r from-indigo-650 to-indigo-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <h3 className="font-bold text-sm">Employee Attendance Logger</h3>
                <p className="text-xs text-indigo-200">Select an employee to log their attendance card for today.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <select
                  value={attendanceEmpId}
                  onChange={(e) => setAttendanceEmpId(e.target.value)}
                  className="px-3 py-2 bg-indigo-800 text-white border border-indigo-750 rounded-lg focus:outline-none"
                >
                  <option value="" className="text-slate-800">-- Select Employee --</option>
                  {employees.filter(e => e.status === 'Active').map(e => (
                    <option key={e.emp_id} value={e.emp_id} className="text-slate-800">
                      {e.name} ({e.emp_id})
                    </option>
                  ))}
                </select>
                <button 
                  onClick={() => handleMarkAttendance(attendanceEmpId, 'Present')}
                  className="px-4 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Mark Present (On Time)
                </button>
                <button 
                  onClick={() => handleMarkAttendance(attendanceEmpId, 'Late')}
                  className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-400 transition-colors cursor-pointer"
                >
                  Mark Late Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                  <ShieldAlert className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Attendance Logger Locked</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Your attendance card cannot be marked by yourself. Daily check-ins are managed by HR/Admin.</p>
                </div>
              </div>
            </div>
          )}

          {/* Today's Attendance Logs */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <h3 className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider border-b dark:border-slate-850">Today's Attendance Registry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                    <th className="p-4">Employee ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Check-in Time</th>
                    <th className="p-4">Check-out Time</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {filteredAttendance.map((log) => {
                    const emp = employees.find(e => e.emp_id === log.emp_id);
                    return (
                      <tr key={log.attendance_id}>
                        <td className="p-4 font-mono font-semibold text-slate-500">
                          {log.emp_id} <span className="text-slate-400 font-sans ml-1">({emp?.name || 'Loading'})</span>
                        </td>
                        <td className="p-4">{log.date}</td>
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{log.checkIn || '--'}</td>
                        <td className="p-4 text-slate-550">{log.checkOut || '--'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'Present' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                            log.status === 'Late' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                            log.status === 'Leave' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400' :
                            log.status === 'Half Day' ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400' :
                            'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- 3. LEAVE REQUESTS TAB -------------------- */}
      {currentTab === 'leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Apply Leave Form */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 lg:col-span-1 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-850 dark:text-white">Apply for Leave</h3>
              <p className="text-xs text-slate-400 mt-0.5">Submit request for operational approval.</p>
            </div>
            <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Leave Category</label>
                <select value={leaveType} onChange={e=>setLeaveType(e.target.value as any)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg">
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Annual">Annual Leave</option>
                  <option value="Half Day">Half Day Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Start Date</label>
                  <input type="date" required value={leaveFrom} onChange={e=>setLeaveFrom(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg"/>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">End Date</label>
                  <input type="date" required value={leaveTo} onChange={e=>setLeaveTo(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg"/>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Reason Description</label>
                <textarea required rows={3} value={leaveReason} onChange={e=>setLeaveReason(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="Detail reason for leaves..."></textarea>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500">
                Submit Request
              </button>
            </form>
          </div>

          {/* Leave List & Approvals */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 lg:col-span-2 overflow-hidden flex flex-col">
            <h3 className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider border-b dark:border-slate-850">Leave Registry History</h3>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Total Days</th>
                    <th className="p-4">Status</th>
                    {(user?.role === 'Admin' || user?.role === 'HR' || user?.role === 'Manager') && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {filteredLeaves.map((l) => (
                    <tr key={l.leave_id} className="hover:bg-slate-50 dark:hover:bg-slate-850/40">
                      <td className="p-4 font-semibold">{l.employeeName}</td>
                      <td className="p-4">{l.leaveType}</td>
                      <td className="p-4 text-slate-500 font-mono text-[10px]">{l.fromDate} to {l.toDate}</td>
                      <td className="p-4">{l.days} days</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                          l.status === 'Pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                          'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      {(user?.role === 'Admin' || user?.role === 'HR' || user?.role === 'Manager') && (
                        <td className="p-4 text-right flex items-center justify-end gap-1">
                          {l.status === 'Pending' ? (
                            <>
                              <button 
                                onClick={() => handleLeaveDecision(l.leave_id, true)}
                                className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded text-emerald-600"
                                title="Approve Request"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleLeaveDecision(l.leave_id, false)}
                                className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                title="Reject Request"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400">Locked</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- 4. PAYROLL TAB -------------------- */}
      {currentTab === 'payroll' && (
        <div className="space-y-6">
          
          {/* Payroll Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {user?.role === 'Employee' ? 'My Base Salary' : 'Monthly Gross Paid'}
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-white mt-0.5 block">
                  ₹{user?.role === 'Employee' 
                    ? (currentEmp?.salary || 0).toLocaleString() 
                    : employees.reduce((sum, e) => sum + (e.status === 'Active' ? e.salary : 0), 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {user?.role === 'Employee' ? 'My Payroll Status' : 'Active Payrolls'}
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-white mt-0.5 block">
                  {user?.role === 'Employee' ? 'Active' : `${employees.filter(e => e.status === 'Active').length} Profiles`}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {user?.role === 'Employee' ? 'My Deductions' : 'Deductions Logged'}
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-white mt-0.5 block">
                  ₹{(user?.role === 'Employee' ? (deduction[empId || ''] || 0) : Object.values(deduction).reduce((sum, v) => sum + v, 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 rounded-xl">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compliance Tax Rate</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white mt-0.5 block">10.5% (TDS)</span>
              </div>
            </div>
          </div>

          {/* Salary Slip Generation Directory */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b dark:border-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Payroll Processing Ledger</h3>
              {user?.role === 'Admin' && (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 px-2 py-0.5 font-bold rounded">
                  Digital Signature Active
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Base Salary</th>
                    <th className="p-4">Bonus (₹)</th>
                    <th className="p-4">Deduction (₹)</th>
                    <th className="p-4">Estimated TDS Tax (10.5%)</th>
                    <th className="p-4">Net Salary Payable</th>
                    <th className="p-4 text-right">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {filteredPayrollEmps.map((emp) => {
                    const empBonus = bonus[emp.emp_id] || 0;
                    const empDeduct = deduction[emp.emp_id] || 0;
                    const tax = Math.round(emp.salary * 0.105);
                    const netPay = emp.salary + empBonus - empDeduct - tax;

                    return (
                      <tr key={emp.emp_id}>
                        <td className="p-4">
                          <span className="block font-semibold text-slate-800 dark:text-slate-200">{emp.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{emp.emp_id} ({emp.department})</span>
                        </td>
                        <td className="p-4 font-mono font-medium">₹{emp.salary.toLocaleString()}</td>
                        <td className="p-4">
                          <input
                            type="number"
                            disabled={user?.role === 'Employee'}
                            value={bonus[emp.emp_id] || ''}
                            onChange={(e) => handlePayrollValueChange(emp.emp_id, 'bonus', e.target.value)}
                            className="w-20 px-2 py-1 border dark:border-slate-750 dark:bg-slate-800 rounded text-xs text-right font-mono"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            disabled={user?.role === 'Employee'}
                            value={deduction[emp.emp_id] || ''}
                            onChange={(e) => handlePayrollValueChange(emp.emp_id, 'deduction', e.target.value)}
                            className="w-20 px-2 py-1 border dark:border-slate-750 dark:bg-slate-800 rounded text-xs text-right font-mono"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-4 font-mono text-slate-400">₹{tax.toLocaleString()}</td>
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">₹{netPay.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setShowPayslipModal({ ...emp, salary: netPay })}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded text-[11px] inline-flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" /> Generate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- DYNAMIC MODALS -------------------- */}

      {/* 1. Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddEmployee} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-850 dark:text-white">Add New Account (Employee/Manager)</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg text-slate-900" placeholder="e.g. John Doe"/>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Work Role</label>
                  <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as any)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg text-slate-900">
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Department</label>
                  <select value={dept} onChange={e => setDept(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg text-slate-900">
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Designation</label>
                  <input type="text" required value={designation} onChange={e => setDesignation(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg text-slate-900" placeholder="e.g. Lead QA"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Company Login Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg text-slate-900" placeholder="e.g. name@company.com"/>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Initial Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg text-slate-900" placeholder="Set temporary password"/>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Personal Email (for credentials delivery)</label>
                <input type="email" required value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg text-slate-900" placeholder="e.g. personal@gmail.com"/>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Phone Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg text-slate-900" placeholder="+91 99999 88888"/>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Monthly Salary (₹)</label>
                  <input type="number" required value={salary} onChange={e => setSalary(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg text-slate-900" placeholder="55000"/>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Joining Date</label>
                  <input type="date" required value={joiningDate} onChange={e => setJoiningDate(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg text-slate-900" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">Create Account</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Payslip View Modal */}
      {showPayslipModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between text-slate-800 dark:text-slate-200">
            
            {/* Payslip Corporate Style */}
            <div className="space-y-6 pb-6 border-b dark:border-slate-800" id="payslip-print-content">
              
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-650 p-1.5 rounded-lg text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">CloudERP Corporate, Inc.</h3>
                    <span className="text-[10px] text-slate-400">Electronic Salary Receipt Statement</span>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="font-mono text-sm font-bold text-slate-500">PAYSLIP-0{showPayslipModal.emp_id.split('-')[1]}</h4>
                  <span className="text-[9px] text-slate-400">Payment Period: June 2026</span>
                </div>
              </div>

              {/* Employee & Bank Info */}
              <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-slate-850/30 p-3 rounded-lg border dark:border-slate-800">
                <div className="space-y-1">
                  <p>Employee Name: <b>{showPayslipModal.name}</b></p>
                  <p>Employee ID: <span className="font-mono">{showPayslipModal.emp_id}</span></p>
                  <p>Department: <b>{showPayslipModal.department}</b></p>
                </div>
                <div className="space-y-1">
                  <p>Designation: <b>{showPayslipModal.designation}</b></p>
                  <p>Bank Transfer: <b>HDFC Bank ******9845</b></p>
                  <p>TDS Status: <b>Deducted & Paid</b></p>
                </div>
              </div>

              {/* Earnings & Deductions grid */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                
                {/* Earnings */}
                <div className="space-y-2">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block border-b pb-1">Earnings</span>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Base Salary</span>
                    <span className="font-mono font-medium">₹{(showPayslipModal.salary * 0.9).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">HRA Allowance</span>
                    <span className="font-mono font-medium">₹{(showPayslipModal.salary * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-slate-800 dark:text-white border-t pt-1">
                    <span>Gross Earnings</span>
                    <span className="font-mono">₹{showPayslipModal.salary.toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block border-b pb-1">Deductions</span>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Provident Fund (PF)</span>
                    <span className="font-mono text-slate-500">₹{(showPayslipModal.salary * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">TDS Income Tax (10.5%)</span>
                    <span className="font-mono text-slate-500">₹{(showPayslipModal.salary * 0.105).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-rose-500 border-t pt-1">
                    <span>Gross Deductions</span>
                    <span className="font-mono">₹{(showPayslipModal.salary * 0.155).toLocaleString()}</span>
                  </div>
                </div>

              </div>

              {/* Net pay summary banner */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between text-slate-850 dark:text-slate-200">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Net Salary Disbursed</span>
                <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">₹{Math.round(showPayslipModal.salary * 0.845).toLocaleString()}</span>
              </div>

            </div>

            <div className="flex justify-end gap-2 text-xs font-semibold pt-4">
              <button 
                type="button" 
                onClick={() => setShowPayslipModal(null)} 
                className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  mockDb.addNotification(
                    `Your payslip has been processed. Net Disbursed: ₹${Math.round(showPayslipModal.salary * 0.845).toLocaleString()}`,
                    'success',
                    ['Employee'],
                    showPayslipModal.email
                  );
                  alert(`Salary disbursed and notification sent to ${showPayslipModal.name}.`);
                  setShowPayslipModal(null);
                }} 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 inline-flex items-center gap-1.5 font-bold"
              >
                Disburse & Notify
              </button>
              <button 
                onClick={() => { window.print(); }} 
                className="px-4 py-2 bg-indigo-650 text-white rounded-lg hover:bg-indigo-600 inline-flex items-center gap-1.5"
              >
                <FileDown className="h-4 w-4" /> Print PDF Slip
              </button>
            </div>

          </div>
        </div>
      )}

    </AuthLayout>
  );
}

export default function HRPage() {
  return (
    <React.Suspense fallback={
      <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-xs text-slate-400">Loading HR dashboard...</p>
      </div>
    }>
      <HRPageContent />
    </React.Suspense>
  );
}


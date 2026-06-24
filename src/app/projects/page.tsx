'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthLayout from '../../components/layout/AuthLayout';
import AccessDenied from '../../components/layout/AccessDenied';
import PageHeader from '../../components/layout/PageHeader';
import { mockDb } from '../../services/mockDb';
import { useAuthStore } from '../../store/authStore';
import { Project, Task, Employee } from '../../types';
import { 
  FolderKanban, CheckSquare, Users2, Plus, Calendar, 
  Clock, CheckCircle, AlertTriangle, Play, Sparkles, User, Tag
} from 'lucide-react';

function ProjectsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const currentTab = searchParams.get('tab') || 'projects';



  // Filter variables will be declared below state declarations

  // DB States
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Search/Filters
  const [projectFilter, setProjectFilter] = useState('All');

  // Modals / Modifiers
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Add Project Fields
  const [pName, setPName] = useState('');
  const [pBudget, setPBudget] = useState('');
  const [pDeadline, setPDeadline] = useState('');
  const [pManager, setPManager] = useState('');

  // Add Task Fields
  const [tName, setTName] = useState('');
  const [tProject, setTProject] = useState('');
  const [tAssignee, setTAssignee] = useState('');
  const [tPriority, setTPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [tDueDate, setTDueDate] = useState('');

  // Find corresponding employee record
  const currentEmp = employees.find(e => e.email.toLowerCase() === user?.email?.toLowerCase());
  const empId = currentEmp?.emp_id;

  // Filter tasks based on role
  const filteredTasks = tasks.filter(t => {
    const matchProject = projectFilter === 'All' || t.project_id === projectFilter;
    const matchEmployee = user?.role === 'Employee' ? t.assigned_to === empId : true;
    return matchProject && matchEmployee;
  });

  const loadData = () => {
    setProjects(mockDb.getProjects());
    setTasks(mockDb.getTasks());
    setEmployees(mockDb.getEmployees());
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

  if (user?.role !== 'Admin' && user?.role !== 'Manager') {
    return (
      <AuthLayout>
        <AccessDenied role={user?.role} allowedRoles={['Admin', 'Manager']} />
      </AuthLayout>
    );
  }

  const changeTab = (tabName: string) => {
    router.push(`/projects?tab=${tabName}`);
  };

  // Add Project
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pBudget || !pDeadline) return;

    const managerObj = employees.find(emp => emp.emp_id === pManager) || employees[0];

    mockDb.createProject({
      project_name: pName,
      manager_id: managerObj.emp_id,
      managerName: managerObj.name,
      budget: parseFloat(pBudget),
      deadline: pDeadline,
    });

    setPName('');
    setPBudget('');
    setPDeadline('');
    setShowAddProjectModal(false);
    loadData();
  };

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName || !tProject || !tAssignee || !tDueDate) return;

    const projObj = projects.find(p => p.project_id === tProject);
    const empObj = employees.find(emp => emp.emp_id === tAssignee);

    mockDb.addTask({
      project_id: tProject,
      assigned_to: tAssignee,
      assignedName: empObj?.name || 'Unassigned',
      task_name: tName,
      priority: tPriority,
      dueDate: tDueDate
    });

    setTName('');
    setTDueDate('');
    setShowAddTaskModal(false);
    loadData();
  };

  // Toggle Task Completion
  const handleToggleTask = (task: Task) => {
    const nextStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
    mockDb.toggleTask(task.task_id, nextStatus);
    loadData();
  };

  // Statistics
  const getStats = () => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'In Progress').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const delayed = projects.filter(p => p.status === 'Delayed').length;
    return { total, active, completed, delayed };
  };

  // Resources utilization list
  const getResourceAllocation = () => {
    return employees.map(emp => {
      // Calculate active tasks assigned to employee
      const activeTasks = tasks.filter(t => t.assigned_to === emp.emp_id && t.status !== 'Completed');
      const assignedProjs = Array.from(new Set(tasks.filter(t => t.assigned_to === emp.emp_id).map(t => t.project_id)));
      const projNames = assignedProjs.map(pid => projects.find(p => p.project_id === pid)?.project_name.split(' - ')[0]).filter(Boolean).join(', ');

      // Base allocation: 25% per active task, cap at 100%
      const utilization = Math.min(100, activeTasks.length * 25);
      
      return {
        emp_id: emp.emp_id,
        name: emp.name,
        role: emp.designation,
        utilization,
        activeTasksCount: activeTasks.length,
        projectsList: projNames || 'None Assigned'
      };
    });
  };

  return (
    <AuthLayout>
      <PageHeader
        title="Project Management Suite"
        description="Track corporate projects, manage tasks sprint backlogs, and inspect employee resource utilization."
        actions={
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button 
              onClick={() => changeTab('projects')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'projects' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
              }`}
            >
              <FolderKanban className="h-3.5 w-3.5" /> Projects
            </button>
            <button 
              onClick={() => changeTab('tasks')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'tasks' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" /> Tasks
            </button>
            <button 
              onClick={() => changeTab('resources')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'resources' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
              }`}
            >
              <Users2 className="h-3.5 w-3.5" /> Workload Allocation
            </button>
          </div>
        }
      />

      {/* -------------------- 1. PROJECTS TAB -------------------- */}
      {currentTab === 'projects' && (
        <div className="space-y-6">
          
          {/* Projects Dashboard Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Projects</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white mt-1 block">{getStats().total}</span>
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <FolderKanban className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Progress</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white mt-1 block">{getStats().active}</span>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg">
                <Play className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white mt-1 block">{getStats().completed}</span>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delayed Risks</span>
                <span className="text-xl font-bold text-rose-500 mt-1 block">{getStats().delayed}</span>
              </div>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 rounded-lg">
                <AlertTriangle className="h-5 w-5 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Action Row */}
          {(user?.role === 'Admin' || user?.role === 'Manager') && (
            <div className="flex justify-end">
              <button 
                onClick={() => setShowAddProjectModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create Project
              </button>
            </div>
          )}

          {/* Projects Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              const projectTasks = tasks.filter(t => t.project_id === proj.project_id);
              const completedTasksCount = projectTasks.filter(t => t.status === 'Completed').length;
              return (
                <div key={proj.project_id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:shadow-lg transition-shadow">
                  
                  {/* Card Header */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{proj.project_name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                        proj.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                        proj.status === 'Delayed' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 animate-pulse' :
                        'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                      }`}>
                        {proj.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Manager: {proj.managerName}</span>
                  </div>

                  {/* Budget & Date info */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y dark:border-slate-850 my-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Total Budget</span>
                      <span className="font-bold text-slate-850 dark:text-slate-200">
                        {user?.role === 'Employee' ? '₹--,--- (Restricted)' : `₹${proj.budget.toLocaleString()}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Target Deadline</span>
                      <span className="font-bold text-slate-850 dark:text-slate-200 font-mono text-[11px]">{proj.deadline}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Sprint Progress ({completedTasksCount}/{projectTasks.length} tasks)</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{proj.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          proj.status === 'Completed' ? 'bg-emerald-500' : proj.status === 'Delayed' ? 'bg-rose-500' : 'bg-indigo-500'
                        }`} 
                        style={{ width: `${proj.progress}%` }}
                      ></div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* -------------------- 2. TASKS TAB -------------------- */}
      {currentTab === 'tasks' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold">Filter by Project:</span>
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="border dark:border-slate-750 dark:bg-slate-850 py-1.5 px-3 rounded-lg text-xs"
              >
                <option value="All">All Projects</option>
                {projects.map(p => (
                  <option key={p.project_id} value={p.project_id}>{p.project_name.split(' - ')[0]}</option>
                ))}
              </select>
            </div>
            
            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <button 
                onClick={() => setShowAddTaskModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Task
              </button>
            )}
          </div>

          {/* Task Ledger table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                    <th className="p-4 w-12">Done</th>
                    <th className="p-4">Task Name</th>
                    <th className="p-4">Project</th>
                    <th className="p-4">Assignee</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {filteredTasks.map((tsk) => {
                      const p = projects.find(proj => proj.project_id === tsk.project_id);
                      return (
                        <tr key={tsk.task_id} className={`hover:bg-slate-50 dark:hover:bg-slate-850/40 ${tsk.status === 'Completed' ? 'opacity-60' : ''}`}>
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={tsk.status === 'Completed'}
                              onChange={() => handleToggleTask(tsk)}
                              className="rounded text-indigo-650 focus:ring-0 h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <span className={`font-semibold text-slate-900 dark:text-white ${tsk.status === 'Completed' ? 'line-through' : ''}`}>
                              {tsk.task_name}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400 font-medium">{p?.project_name.split(' - ')[0] || 'Unknown'}</td>
                          <td className="p-4 text-slate-500 font-semibold">{tsk.assignedName}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              tsk.priority === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' :
                              tsk.priority === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {tsk.priority}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-mono text-[10px]">{tsk.dueDate}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tsk.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                              tsk.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400' :
                              'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {tsk.status}
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

      {/* -------------------- 3. RESOURCES TAB -------------------- */}
      {currentTab === 'resources' && (
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Workload Balance Registry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getResourceAllocation().map((res) => (
                <div key={res.emp_id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-850 dark:text-white">{res.name}</h4>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{res.role}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      res.utilization > 80 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' :
                      res.utilization > 50 ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' :
                      'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                    }`}>
                      {res.utilization}% Workload
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    <p>Active Tasks Queue: <b className="text-slate-700 dark:text-slate-300">{res.activeTasksCount} Pending Tasks</b></p>
                    <p className="truncate mt-1">Assigned Projects: <b className="text-slate-700 dark:text-slate-300">{res.projectsList}</b></p>
                  </div>

                  {/* Gauge Bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          res.utilization > 80 ? 'bg-rose-500' :
                          res.utilization > 50 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${res.utilization}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* -------------------- DYNAMIC MODALS -------------------- */}

      {/* 1. Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddProject} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-850 dark:text-white">Create New Project</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Project Name</label>
                <input type="text" required value={pName} onChange={e => setPName(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="e.g. Android Mobile App"/>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Project Manager</label>
                <select value={pManager} onChange={e => setPManager(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg">
                  {employees.map(emp => (
                    <option key={emp.emp_id} value={emp.emp_id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Budget (₹)</label>
                  <input type="number" required value={pBudget} onChange={e => setPBudget(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="500000"/>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Deadline Date</label>
                  <input type="date" required value={pDeadline} onChange={e => setPDeadline(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg"/>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button type="button" onClick={() => setShowAddProjectModal(false)} className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">Create Project</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddTask} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-850 dark:text-white">Create New Task</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Task Name</label>
                <input type="text" required value={tName} onChange={e => setTName(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="e.g. Integrate Payment Gateway"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Select Project</label>
                  <select value={tProject} onChange={e => setTProject(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg">
                    <option value="">-- Choose Project --</option>
                    {projects.map(p => (
                      <option key={p.project_id} value={p.project_id}>{p.project_name.split(' - ')[0]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Assigned Employee</label>
                  <select value={tAssignee} onChange={e => setTAssignee(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg">
                    <option value="">-- Choose Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.emp_id} value={emp.emp_id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Priority Level</label>
                  <select value={tPriority} onChange={e => setTPriority(e.target.value as any)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Due Date</label>
                  <input type="date" required value={tDueDate} onChange={e => setTDueDate(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-800 rounded-lg"/>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button type="button" onClick={() => setShowAddTaskModal(false)} className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">Add Task</button>
            </div>
          </form>
        </div>
      )}

    </AuthLayout>
  );
}

export default function ProjectsPage() {
  return (
    <React.Suspense fallback={
      <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-xs text-slate-400">Loading Projects dashboard...</p>
      </div>
    }>
      <ProjectsPageContent />
    </React.Suspense>
  );
}


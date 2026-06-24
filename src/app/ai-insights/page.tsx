'use client';

import React, { useState, useEffect, useRef } from 'react';
import AuthLayout from '../../components/layout/AuthLayout';
import AccessDenied from '../../components/layout/AccessDenied';
import PageHeader from '../../components/layout/PageHeader';
import { mockDb } from '../../services/mockDb';
import { useAuthStore } from '../../store/authStore';
import { 
  BrainCircuit, Sparkles, Send, Bot, User, MessageSquare, 
  TrendingUp, AlertTriangle, AlertCircle, ShoppingCart, Users, HelpCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Legend, LineChart, Line
} from 'recharts';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

export default function AIInsightsPage() {
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  

  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      sender: 'ai', 
      text: "Hello! I am your ERP AI assistant. I have scanned your inventory, HR attendance sheets, and sales ledger. Ask me to 'Predict inventory demand' or 'Summarize attendance trends'. How can I help you?",
      timestamp: new Date() 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    mockDb.initialize();
    setInsights(mockDb.getAIInsights());
    setPredictions(mockDb.getDemandPredictions());
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (user?.role !== 'Admin') {
    return (
      <AuthLayout>
        <AccessDenied role={user?.role} allowedRoles={['Admin']} />
      </AuthLayout>
    );
  }

  // Historical Sales Data + AI Forecast (E.g. Bottles Sold Jan: 100, Feb: 120, Mar: 150 -> AI: Apr: 172)
  const getDemandForecastingData = () => [
    { month: 'Jan', ActualSales: 100, AIForecast: 100 },
    { month: 'Feb', ActualSales: 120, AIForecast: 120 },
    { month: 'Mar', ActualSales: 150, AIForecast: 150 },
    { month: 'Apr', ActualSales: undefined, AIForecast: 172 },
    { month: 'May', ActualSales: undefined, AIForecast: 195 },
    { month: 'Jun', ActualSales: undefined, AIForecast: 210 }
  ];

  // Chat Processing (Simulated NLP Router)
  const handleSendMessage = (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const query = textOverride || inputValue;
    if (!query.trim()) return;

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // 2. Process query and generate AI response
    setTimeout(() => {
      let aiText = '';
      const lowercaseQuery = query.toLowerCase();

      if (lowercaseQuery.includes('attendance') || lowercaseQuery.includes('hr') || lowercaseQuery.includes('absent') || lowercaseQuery.includes('check-in')) {
        const att = mockDb.getAttendance();
        const emps = mockDb.getEmployees();
        const activeEmps = emps.filter(e => e.status === 'Active').length;
        const presentToday = att.filter(a => a.status === 'Present' || a.status === 'Late').length;
        const lateToday = att.filter(a => a.status === 'Late').length;
        const leaves = mockDb.getLeaves().filter(l => l.status === 'Approved').length;
        const attendanceRate = att.length > 0 ? Math.round((presentToday / att.length) * 100) : 94;

        aiText = `Attendance Trend Intelligence: Based on our shared databases, our cumulative attendance rate stands at ${attendanceRate}%. Out of ${activeEmps} active employees, we have logged ${presentToday} check-ins, with ${lateToday} late arrivals and ${leaves} approved leaves. Operations departments show normal attrition indicators.`;
      } else if (lowercaseQuery.includes('inventory') || lowercaseQuery.includes('shortage') || lowercaseQuery.includes('stock') || lowercaseQuery.includes('demand') || lowercaseQuery.includes('product')) {
        const products = mockDb.getProducts();
        const lowItems = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock');
        const lowItemsDesc = lowItems.slice(0, 3).map(p => `'${p.product_name}' (${p.quantity} units left)`).join(', ');
        const totalItemsCount = products.reduce((sum, p) => sum + p.quantity, 0);

        aiText = `Inventory Predictive Analysis: Scan complete. We have ${products.length} distinct products in stock (total ${totalItemsCount} units). Currently, ${lowItems.length} products are below safety thresholds${lowItemsDesc ? `: ${lowItemsDesc}` : ''}. I recommend approving draft Purchase Orders immediately to mitigate supply-chain disruption.`;
      } else if (lowercaseQuery.includes('revenue') || lowercaseQuery.includes('finance') || lowercaseQuery.includes('sales') || lowercaseQuery.includes('profit') || lowercaseQuery.includes('expense')) {
        const txns = mockDb.getTransactions();
        const rev = txns.filter(t => t.type === 'Revenue').reduce((sum, t) => sum + t.amount, 0);
        const exp = txns.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
        const profit = rev - exp;

        aiText = `Financial Projection Engine: Scanner reports total revenue of ₹${rev.toLocaleString()} and expenses of ₹${exp.toLocaleString()}, yielding a net balance of ₹${profit.toLocaleString()}. Our predictive model estimates a +12.4% revenue growth next period driven by recent sales trends.`;
      } else if (lowercaseQuery.includes('project') || lowercaseQuery.includes('delay') || lowercaseQuery.includes('task') || lowercaseQuery.includes('milestone')) {
        const projs = mockDb.getProjects();
        const tasks = mockDb.getTasks();
        const delayed = projs.filter(p => p.status === 'Delayed');
        const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
        const avgProgress = projs.length > 0 ? Math.round(projs.reduce((sum, p) => sum + p.progress, 0) / projs.length) : 0;

        aiText = `Project Track Assessment: We are tracking ${projs.length} active projects with an average milestone progress of ${avgProgress}%. Currently, ${delayed.length} projects are flagged as 'Delayed' due to bottlenecking. There are ${pendingTasks} pending tasks remaining in the sprints. Re-allocating IT resources is recommended.`;
      } else if (lowercaseQuery.includes('attrition') || lowercaseQuery.includes('risk') || lowercaseQuery.includes('quit') || lowercaseQuery.includes('leave') || lowercaseQuery.includes('employee')) {
        const leaves = mockDb.getLeaves();
        const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
        const totalEmps = mockDb.getEmployees().length;

        aiText = `Attrition Risk Scanning: Currently scanning ${totalEmps} employee roster sheets. Leave trends reveal ${pendingLeaves} pending approvals. Workload balance indicators highlight that Operations and IT departments are currently utilized at above-average capacity. No critical turnover risk is flagged at this hour.`;
      } else if (lowercaseQuery.includes('vendor') || lowercaseQuery.includes('supplier')) {
        const vendors = mockDb.getVendors();
        const vendorNames = vendors.slice(0, 4).map(v => v.vendor_name).join(', ');
        aiText = `Vendor Supplier Audit: Our database contains ${vendors.length} registered vendors. Key suppliers are: ${vendorNames || 'None'}. Supply chain integration status is healthy.`;
      } else if (lowercaseQuery.includes('purchase order') || lowercaseQuery.includes('po') || lowercaseQuery.includes('reorder')) {
        const pos = mockDb.getPurchaseOrders();
        const pendingPos = pos.filter(po => po.status === 'Draft' || po.status === 'Approved').length;
        const totalValue = pos.reduce((sum, po) => sum + po.total_amount, 0);
        aiText = `Purchase Order Ledger: We have logged ${pos.length} purchase orders with a total commitment of ₹${totalValue.toLocaleString()}. Currently, there are ${pendingPos} orders pending approval or delivery.`;
      } else if (lowercaseQuery.includes('notification') || lowercaseQuery.includes('alert') || lowercaseQuery.includes('unread')) {
        const notifications = mockDb.getNotifications();
        const unread = notifications.filter(n => !n.read).length;
        const latestMsg = notifications.length > 0 ? notifications[0].message : 'None';
        aiText = `System Notifications Scan: Scanner reports ${notifications.length} total system alerts in your notification queue. You have ${unread} unread notifications. The latest active alert is: "${latestMsg}".`;
      } else if (lowercaseQuery.includes('activity') || lowercaseQuery.includes('audit') || lowercaseQuery.includes('log') || lowercaseQuery.includes('recent')) {
        const activities = mockDb.getActivities();
        const recentDescs = activities.slice(0, 3).map(a => `[${a.category}] ${a.description}`).join('; ');
        aiText = `Audit Trail Logs: DB logs show ${activities.length} recent system activities. Primary actions: ${recentDescs || 'None'}. All transactions are compliant and logged under timestamp verification.`;
      } else if (lowercaseQuery.includes('manager') || lowercaseQuery.includes('department manager') || lowercaseQuery.includes('assigned')) {
        let managersSummary = 'None';
        if (typeof window !== 'undefined') {
          const storedManagers = localStorage.getItem('erp_department_managers');
          if (storedManagers) {
            const parsed = JSON.parse(storedManagers);
            const emps = mockDb.getEmployees();
            managersSummary = Object.entries(parsed)
              .map(([dept, empId]) => {
                const name = emps.find(e => e.emp_id === empId)?.name || 'Unassigned';
                return `${dept}: ${name}`;
              })
              .join(', ');
          }
        }
        aiText = `Department Manager Matrix: Current department manager leads on record are: ${managersSummary}. Admin and HR can reallocate department leads dynamically in the HR section.`;
      } else if (lowercaseQuery.includes('hello') || lowercaseQuery.includes('hi') || lowercaseQuery.includes('hey')) {
        aiText = `Hello! I am your CloudERP AI Core. I am fully synchronized with your transactions, stock sheets, and attendance databases. Ask me anything about finance, projects, inventory, vendors, POs, alerts, or HR attrition.`;
      } else {
        aiText = `Query logged: "${query}". I scanned the databases but detected no anomalies. Try asking: "Predict inventory demand", "Summarize attendance trends", "Check attrition risks", "Who is the IT manager?", or "Show recent logs".`;
      }

      const aiMsg: ChatMessage = {
        id: `MSG-${Date.now() + 1}`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleChipClick = (text: string) => {
    handleSendMessage(undefined, text);
  };

  return (
    <AuthLayout>
      <PageHeader 
        title="AI Intelligence & Projections" 
        description="Predictive demand forecasting, employee attrition risks, and conversational LLM query assistant."
      />

      {/* Top AI Insights Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Projections recommendations list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-indigo-500" /> Active AI recommendations
            </h3>
            <div className="space-y-3">
              {insights.map((ins, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-850/30 border dark:border-slate-800 rounded-xl flex gap-3 text-xs">
                  <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Recommendation Alert</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">{ins}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forecasting Area Chart */}
          {isMounted && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Demand forecasting: Bottles Sold vs AI Forecast
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getDemandForecastingData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line type="monotone" dataKey="ActualSales" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} name="Historical Sales" />
                    <Line type="monotone" dataKey="AIForecast" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" name="AI Predicted Trend" />
                    <ReferenceLine x="Mar" stroke="#ec4899" strokeWidth={1} label={{ value: 'Forecast Start', fill: '#ec4899', fontSize: 10, position: 'top' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-455 text-center mt-2">Historical curve displays high confidence Q1 sales data, forecasting an upward 14% demand surge for Q2.</p>
            </div>
          )}
        </div>

        {/* Prediction Cards Column */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Card 1: Shortage risks */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4 text-amber-500" /> Expected Shortage Risks
            </h4>
            <div className="space-y-3 text-xs">
              {predictions.slice(0, 3).map((pred) => (
                <div key={pred.product_id} className="flex justify-between items-center border-b dark:border-slate-850 pb-2">
                  <div>
                    <span className="font-semibold block text-slate-900 dark:text-white truncate max-w-[140px]">{pred.product_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Current Stock: {pred.current_stock}</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      pred.risk_level === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                    }`}>
                      {pred.risk_level} Shortage
                    </span>
                    <span className="block text-[10px] text-slate-400 font-semibold mt-1">Shortage: {pred.expected_shortage} pcs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Attrition */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-500" /> Attrition Risk Assessment
            </h4>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold">Operations Department</span>
                  <span className="text-rose-500 font-bold">High Risk (65%)</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold">IT & Development</span>
                  <span className="text-amber-500 font-bold">Medium Risk (42%)</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold">Human Resources</span>
                  <span className="text-emerald-500 font-bold">Low Risk (15%)</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* AI Chat Widget Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[500px]">
        
        {/* Chat Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">ERP Assistant Terminal</h3>
              <span className="text-[10px] text-emerald-450 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Online (SQL Sync Active)
              </span>
            </div>
          </div>
          <HelpCircle className="h-5 w-5 text-slate-400" />
        </div>

        {/* Chat Logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/20">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center border ${
                msg.sender === 'user' 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'bg-slate-900 border-slate-800 text-white'
              }`}>
                {msg.sender === 'user' ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
              </div>
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 rounded-tl-none shadow-sm'
              }`}>
                <p>{msg.text}</p>
                <span className={`block text-[9px] mt-1.5 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 border border-slate-800">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none shadow-sm text-xs flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat prompts chips */}
        <div className="px-4 py-2 border-t dark:border-slate-850 flex gap-2 overflow-x-auto whitespace-nowrap bg-slate-50 dark:bg-slate-950/40 select-none">
          <button 
            onClick={() => handleChipClick("Predict inventory demand")}
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 border dark:border-slate-750 dark:bg-slate-800 rounded-full text-[10px] text-slate-650 dark:text-slate-350 cursor-pointer"
          >
            📦 Predict inventory demand
          </button>
          <button 
            onClick={() => handleChipClick("Show attendance trend")}
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 border dark:border-slate-750 dark:bg-slate-800 rounded-full text-[10px] text-slate-650 dark:text-slate-350 cursor-pointer"
          >
            📅 Show attendance trend
          </button>
          <button 
            onClick={() => handleChipClick("Find project delay risks")}
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 border dark:border-slate-750 dark:bg-slate-800 rounded-full text-[10px] text-slate-650 dark:text-slate-350 cursor-pointer"
          >
            ⚠️ Find project delay risks
          </button>
          <button 
            onClick={() => handleChipClick("Check attrition risk")}
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 border dark:border-slate-750 dark:bg-slate-800 rounded-full text-[10px] text-slate-650 dark:text-slate-350 cursor-pointer"
          >
            👥 Check attrition risk
          </button>
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask AI: 'Show attendance trend' or 'Predict inventory shortage'..."
            className="flex-1 px-4 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>

    </AuthLayout>
  );
}

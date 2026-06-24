'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { mockDb } from '../../services/mockDb';
import { Building2, Eye, EyeOff, ShieldCheck, Mail, Lock, ArrowRight, UserPlus, Info, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('HR');
  const [regSuccess, setRegSuccess] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // Forgot Password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Form errors
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('dark');
      mockDb.initialize();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Please verify your credentials or create a new account.');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName || !regEmail || !regPassword) {
      setError('Please fill in all fields.');
      return;
    }

    // Read global users list
    const users = mockDb.getGlobalUsers();
    const emailExists = users.some(u => u.email.toLowerCase() === regEmail.toLowerCase());
    
    if (emailExists) {
      setError('This email is already registered in the system.');
      return;
    }

    // Enforce single Admin constraint
    if (regRole === 'Admin') {
      const hasAdmin = users.some(u => u.role === 'Admin');
      if (hasAdmin) {
        setError('An Administrator account is already registered. Only one Administrator is permitted.');
        return;
      }
    }

    // Enforce single HR constraint
    if (regRole === 'HR') {
      const hasHR = users.some(u => u.role === 'HR');
      if (hasHR) {
        setError('An HR account is already registered. Only one HR is permitted.');
        return;
      }
    }

    // Enforce single Manager constraint
    if (regRole === 'Manager') {
      const hasManager = users.some(u => u.role === 'Manager');
      if (hasManager) {
        setError('A Manager account is already registered. Only one Manager is permitted.');
        return;
      }
    }

    // Save user record globally
    const newId = `USR-${Date.now()}`;
    const newUser = {
      id: newId,
      name: regName,
      email: regEmail,
      role: regRole,
      password: regPassword, // Stored securely in simulated local DB
      avatarUrl: ''
    };

    mockDb.registerGlobalUser(newUser);

    // Bootstrap database files for the shared company database
    mockDb.initialize();
    
    // Add this user as the first employee in shared directory if Employee, Manager, or HR
    if (regRole !== 'Admin') {
      mockDb.addEmployee({
        name: regName,
        department: regRole === 'Manager' ? 'Operations' : regRole === 'HR' ? 'HR' : 'IT',
        designation: regRole === 'Manager' ? 'Operations Manager' : regRole === 'HR' ? 'HR Manager' : 'Software Engineer',
        email: regEmail,
        phone: '+91 99999 88888',
        salary: regRole === 'Manager' ? 120000 : regRole === 'HR' ? 95000 : 75000,
        status: 'Active',
        joiningDate: new Date().toISOString().split('T')[0]
      });
    }

    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      setActiveTab('login');
      setEmail(regEmail);
      setPassword('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
    }, 2000);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setOtpStep(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) return;
    
    // Simulate updating password to "password" globally
    const storedUsers = localStorage.getItem('erp_global_users');
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      const index = users.findIndex((u: any) => u.email.toLowerCase() === forgotEmail.toLowerCase());
      if (index !== -1) {
        users[index].password = 'password';
        localStorage.setItem('erp_global_users', JSON.stringify(users));
      }
    }

    setForgotSuccess(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotEmail('');
      setOtpCode('');
      setOtpStep(false);
      setForgotSuccess(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Centered Login/Register Card Container */}
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        
        {/* Company Header & Brand Logo */}
        <div className="text-center space-y-3">
          <div className="mx-auto bg-blue-600 p-2.5 rounded-2xl text-white inline-flex shadow-md shadow-blue-500/25">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Amdox Technologies</h1>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mt-0.5">Welcome to ERP Portal</span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-600 dark:text-rose-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
            <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {regSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-600 dark:text-emerald-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>Account created successfully! Switching to sign in...</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`w-1/2 text-center py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-455 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`w-1/2 text-center py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'register' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-455 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Forms */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-slate-455 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter email"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-slate-455 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {/* Remember Checkbox */}
            <div className="flex items-center text-xs">
              <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-650 focus:ring-blue-500 h-4 w-4"
                />
                Remember my session
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>

          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Full Name</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Email Address</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter email address"
              />
            </div>

            {/* Role selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Select Work Role</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="HR">HR Manager (HR, Leaves, Attendance, Payroll)</option>
                <option value="Admin">Administrator (Full ERP Control Access)</option>
              </select>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Create Password</label>
              <div className="relative">
                <Lock className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-slate-455 pointer-events-none" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter secure password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-655 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              Create Account
              <UserPlus className="h-4 w-4" />
            </button>

          </form>
        )}

      </div>

      {/* Forgot Password OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-slate-100 dark:border-slate-750">
            
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-blue-650" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Secure Password Reset</h3>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">Reset Completed</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Your password has been successfully reset to "password". Closing...</p>
                </div>
              </div>
            ) : !otpStep ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter your registered email address below. We'll generate a simulated OTP recovery screen.
                </p>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-850 rounded-lg text-xs text-slate-900"
                    placeholder="e.g. rahul@company.com"
                  />
                </div>
                <div className="flex justify-end gap-2 font-semibold pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(false); setForgotEmail(''); }}
                    className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-550 dark:text-slate-350"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                  >
                    Send OTP
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enter any 4-digit code (e.g., <b>1234</b>) to authenticate.
                </p>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold mb-1">4-Digit OTP Code</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-850 rounded-lg text-center tracking-widest text-base font-bold text-slate-900"
                    placeholder="0 0 0 0"
                  />
                </div>
                <div className="flex justify-end gap-2 font-semibold pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-550 dark:text-slate-355"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={otpCode.length < 4}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
                  >
                    Verify & Reset
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

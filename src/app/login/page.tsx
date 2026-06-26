'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import ThemeToggle from '../../components/layout/ThemeToggle';
import { mockDb } from '../../services/mockDb';
import { Building2, Eye, EyeOff, ShieldCheck, Mail, Lock, ArrowRight, UserPlus, Info, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const { initializeTheme } = useThemeStore();
  
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
  const [regRole, setRegRole] = useState<UserRole>('Employee');
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
      initializeTheme();
      mockDb.initialize();
    }
  }, [initializeTheme]);

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

    // Block HR registration from public form
    if (regRole === 'HR') {
      setError('HR accounts cannot be created via public registration. They must be added by an Administrator.');
      return;
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
        department: regRole === 'Manager' ? 'Operations' : 'IT',
        designation: regRole === 'Manager' ? 'Operations Manager' : 'Software Engineer',
        email: regEmail,
        phone: '+91 99999 88888',
        salary: regRole === 'Manager' ? 120000 : 75000,
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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Header Navbar matching transparent/light theme */}
      <header className="h-16 bg-[#f0f2f7]/85 dark:bg-[#090a10]/85 backdrop-blur-md flex items-center justify-between px-6 w-full fixed top-0 left-0 z-20 border-b border-slate-200/40 dark:border-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600/10 dark:bg-blue-500/10 p-1.5 rounded-xl text-blue-600 dark:text-blue-400">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-black text-md text-slate-850 dark:text-white tracking-wider">Amdox</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Ambient Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[80px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/10 dark:bg-blue-650/5 blur-[100px] pointer-events-none"></div>

      {/* Centered Login/Register Card Container */}
      <div className="max-w-md w-full space-y-8 premium-card relative z-10">
        
        {/* Company Header & Brand Logo */}
        <div className="text-center space-y-3">
          <div className="mx-auto bg-blue-600/10 dark:bg-blue-500/10 p-3.5 rounded-2xl text-blue-600 dark:text-blue-400 inline-flex shadow-sm">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Amdox Technologies</h1>
            <span className="text-xs text-slate-450 dark:text-slate-400 font-bold uppercase tracking-widest block mt-0.5">Sign In to Amdox Portal</span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 text-rose-600 dark:text-rose-400 text-xs p-3.5 rounded-2xl flex items-start gap-2.5">
            <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {regSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 text-emerald-600 dark:text-emerald-400 text-xs p-3.5 rounded-2xl flex items-start gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>Account created successfully! Switching to sign in...</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex bg-[#f0f2f7] dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/40 dark:border-slate-900">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`w-1/2 text-center py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'login' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-405 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`w-1/2 text-center py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'register' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-405 hover:text-slate-800 dark:hover:text-slate-200'
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
                <Mail className="absolute inset-y-0 left-0 pl-3.5 h-full w-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  className="text-xs text-blue-600 dark:text-blue-450 font-bold hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute inset-y-0 left-0 pl-3.5 h-full w-5 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {/* Remember Checkbox */}
            <div className="flex items-center text-xs">
              <label className="flex items-center gap-2 text-slate-500 dark:text-slate-405 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-250 dark:border-slate-800"
                />
                Remember my session
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer blue-glow-btn"
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
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-405 block">Email Address</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter email address"
              />
            </div>

            {/* Role selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-404 block">Select Work Role</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="Employee">Employee (Personal Dashboard & profile)</option>
                <option value="Manager">Manager (Projects and tasks control)</option>
                <option value="Admin">Administrator (Full ERP Control Access)</option>
              </select>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Create Password</label>
              <div className="relative">
                <Lock className="absolute inset-y-0 left-0 pl-3.5 h-full w-5 text-slate-400 pointer-events-none" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter secure password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-700 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer blue-glow-btn"
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
          <div className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-md p-6 shadow-xl relative border border-slate-200 dark:border-slate-800">
            
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Secure Password Reset</h3>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">Reset Completed</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Your password has been successfully reset to "password". Closing...</p>
                </div>
              </div>
            ) : !otpStep ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Enter your registered email address below. We'll generate a simulated OTP recovery screen.
                </p>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g. rahul@company.com"
                  />
                </div>
                <div className="flex justify-end gap-2 font-semibold pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(false); setForgotEmail(''); }}
                    className="px-4 py-2 border dark:border-slate-800 rounded-full text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 shadow-md shadow-blue-500/20 cursor-pointer text-xs font-bold"
                  >
                    Send OTP
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                <p className="text-[11px] text-slate-500 dark:text-slate-405 font-semibold">
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
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-xl text-center tracking-widest text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0 0 0 0"
                  />
                </div>
                <div className="flex justify-end gap-2 font-semibold pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="px-4 py-2 border dark:border-slate-800 rounded-full text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={otpCode.length < 4}
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer text-xs font-bold"
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

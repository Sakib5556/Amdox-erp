'use client';

import React, { useState, useEffect, useRef } from 'react';
import AuthLayout from '../../components/layout/AuthLayout';
import PageHeader from '../../components/layout/PageHeader';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { mockDb } from '../../services/mockDb';
import { 
  Settings, Building2, Sun, Moon, Bell, Shield, 
  Mail, MessageSquare, AlertCircle, Save, CheckCircle2,
  Phone, Globe, Database, Trash2, Download, User,
  Laptop, Key, Link2, Camera, HelpCircle, Eye, EyeOff, X,
  Users, Check, Lock, ShieldAlert, KeyRound, Copy
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const { user, updateProfile, changePassword, deleteAccount } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'general' | 'roles' | 'security' | 'notifications' | 'integrations' | 'preferences'>('profile');

  // Retrieve employee details if available
  const employees = mockDb.getEmployees();
  const empDetails = employees.find(e => e.email.toLowerCase() === user?.email?.toLowerCase());

  // 1. My Profile Tab States
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Senior Accountant');
  const [department, setDepartment] = useState('Finance');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [personalEmail, setPersonalEmail] = useState('');
  const [bio, setBio] = useState('');
  const [lastLogin, setLastLogin] = useState('Just now');
  const [showPhotoPopover, setShowPhotoPopover] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // Camera refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 2. Account Settings States
  const [timezone, setTimezone] = useState('IST');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [sessionTimeout, setSessionTimeout] = useState('30 mins');

  // 3. General Tab States
  const [compName, setCompName] = useState('Amdox Technologies, Inc.');
  const [compAddress, setCompAddress] = useState('102, Sakib Tech Parks, Pune, MH, India');
  const [compPhone, setCompPhone] = useState('+91 20 4444 8888');
  const [compEmail, setCompEmail] = useState('corporate@amdox.com');
  const [compWebsite, setCompWebsite] = useState('www.amdox.com');

  // 4. Security Tab States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // 5. Notifications Tab States
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [pushAlerts, setPushAlerts] = useState(true);

  // 6. Integrations Tab States
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX');
  const [teamsWebhook, setTeamsWebhook] = useState('https://amdoxerp.webhook.office.com/webhookb2/c89a0e...');
  const [apiToken, setApiToken] = useState('erp_live_tok_9a38f821bc0d8e22f8319e7a8bb032');
  const [copiedToken, setCopiedToken] = useState(false);

  // 7. Preferences Tab States
  const [compCurrency, setCompCurrency] = useState('INR');
  const [compLanguage, setCompLanguage] = useState('English');
  const [defaultLanding, setDefaultLanding] = useState('/dashboard');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Click outside listener for Avatar popover
  const popoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPhotoPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Webcam stream handlers
  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      setTimeout(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      alert('Could not access camera. Please verify device permissions.');
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const compressAndSetAvatar = (base64Str: string) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 150;
      const MAX_HEIGHT = 150;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        setAvatarUrl(compressed);
      } else {
        setAvatarUrl(base64Str);
      }
    };
    img.onerror = () => {
      setAvatarUrl(base64Str);
    };
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        compressAndSetAvatar(dataUrl);
      }
      stopCamera();
    }
  };

  const loadSettings = React.useCallback(() => {
    if (user) {
      mockDb.initialize();

      // Load fallbacks for general settings
      const storedCompName = localStorage.getItem('erp_comp_name');
      if (storedCompName) setCompName(storedCompName);
      
      const storedCompAddress = localStorage.getItem('erp_comp_address');
      if (storedCompAddress) setCompAddress(storedCompAddress);

      const storedCompPhone = localStorage.getItem('erp_comp_phone');
      if (storedCompPhone) setCompPhone(storedCompPhone);

      const storedCompEmail = localStorage.getItem('erp_comp_email');
      if (storedCompEmail) setCompEmail(storedCompEmail);

      const storedCompWebsite = localStorage.getItem('erp_comp_website');
      if (storedCompWebsite) setCompWebsite(storedCompWebsite);

      const storedCompCurrency = localStorage.getItem('erp_currency');
      if (storedCompCurrency) setCompCurrency(storedCompCurrency);

      const storedCompLanguage = localStorage.getItem('erp_language');
      if (storedCompLanguage) setCompLanguage(storedCompLanguage);

      // Notifications
      const storedEmailAlerts = localStorage.getItem(`erp_email_alerts_${user.id}`);
      if (storedEmailAlerts) setEmailAlerts(JSON.parse(storedEmailAlerts));

      const storedSmsAlerts = localStorage.getItem(`erp_sms_alerts_${user.id}`);
      if (storedSmsAlerts) setSmsAlerts(JSON.parse(storedSmsAlerts));

      const storedPushAlerts = localStorage.getItem(`erp_push_alerts_${user.id}`);
      if (storedPushAlerts) setPushAlerts(JSON.parse(storedPushAlerts));

      // Integrations
      const storedSlack = localStorage.getItem('erp_slack_webhook');
      if (storedSlack) setSlackWebhook(storedSlack);

      const storedTeams = localStorage.getItem('erp_teams_webhook');
      if (storedTeams) setTeamsWebhook(storedTeams);

      // Preferences
      const storedLanding = localStorage.getItem(`erp_landing_page_${user.id}`);
      if (storedLanding) setDefaultLanding(storedLanding);

      // Account settings
      const storedTimezone = localStorage.getItem(`erp_timezone_${user.id}`);
      if (storedTimezone) setTimezone(storedTimezone);

      const storedDateFormat = localStorage.getItem(`erp_date_format_${user.id}`);
      if (storedDateFormat) setDateFormat(storedDateFormat);

      const storedTimeout = localStorage.getItem(`erp_session_timeout_${user.id}`);
      if (storedTimeout) setSessionTimeout(storedTimeout);

      // Load avatar, phone, designation, department fallback from localStorage
      const storedAvatar = localStorage.getItem(`erp_avatar_${user.id}`);
      setAvatarUrl(storedAvatar || user.avatarUrl || '');

      const storedPhone = localStorage.getItem(`erp_phone_${user.id}`);
      setPhone(storedPhone || empDetails?.phone || '');

      const storedDesignation = localStorage.getItem(`erp_designation_${user.id}`);
      setDesignation(storedDesignation || empDetails?.designation || 'Senior Accountant');

      const storedDept = localStorage.getItem(`erp_department_${user.id}`);
      setDepartment(storedDept || empDetails?.department || 'Finance');

      const storedAltEmail = localStorage.getItem(`erp_alt_email_${user.id}`);
      setPersonalEmail(storedAltEmail || user.personalEmail || empDetails?.personalEmail || '');

      const storedBio = localStorage.getItem(`erp_bio_${user.id}`);
      setBio(storedBio || user.aboutMe || '');

      const storedLastLogin = localStorage.getItem(`erp_last_login_${user.id}`);
      setLastLogin(storedLastLogin || 'Just now');

      const stored2fa = localStorage.getItem(`erp_2fa_${user.id}`);
      if (stored2fa) setTwoFactorEnabled(JSON.parse(stored2fa));
    }
  }, [user, empDetails]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSettings();
    }, 0);

    const handleStorageChange = (e: StorageEvent) => {
      // Reload on updates to company prefix or active user
      if (e.key && (e.key.startsWith('company_') || e.key.startsWith('erp_') || e.key === 'erp_auth_user')) {
        loadSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, loadSettings]);

  if (!user) return null;

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (activeTab === 'profile') {
      if (!name || !email) {
        setErrorMsg('Full Name and Email Address are required.');
        return;
      }
      // Update Auth Store
      updateProfile(name, email, avatarUrl, personalEmail, bio);

      // Save to local storage for fallbacks
      localStorage.setItem(`erp_phone_${user.id}`, phone);
      localStorage.setItem(`erp_designation_${user.id}`, designation);
      localStorage.setItem(`erp_department_${user.id}`, department);
      localStorage.setItem(`erp_avatar_${user.id}`, avatarUrl);
      localStorage.setItem(`erp_alt_email_${user.id}`, personalEmail);
      localStorage.setItem(`erp_bio_${user.id}`, bio);

      // Update matching employee record in database
      const employeesList = mockDb.getEmployees();
      const index = employeesList.findIndex(e => e.email.toLowerCase() === user.email.toLowerCase());
      if (index !== -1) {
        employeesList[index].name = name;
        employeesList[index].email = email;
        employeesList[index].phone = phone;
        employeesList[index].designation = designation;
        employeesList[index].department = department;
        employeesList[index].personalEmail = personalEmail;
        employeesList[index].aboutMe = bio;
        mockDb.set('erp_employees', employeesList);
      }

      setSuccessMsg('Your profile changes have been successfully saved.');
    } else if (activeTab === 'account') {
      localStorage.setItem(`erp_timezone_${user.id}`, timezone);
      localStorage.setItem(`erp_date_format_${user.id}`, dateFormat);
      localStorage.setItem(`erp_session_timeout_${user.id}`, sessionTimeout);
      setSuccessMsg('Account settings updated successfully.');
    } else if (activeTab === 'general') {
      localStorage.setItem('erp_comp_name', compName);
      localStorage.setItem('erp_comp_address', compAddress);
      localStorage.setItem('erp_comp_phone', compPhone);
      localStorage.setItem('erp_comp_email', compEmail);
      localStorage.setItem('erp_comp_website', compWebsite);
      setSuccessMsg('Company profile details saved successfully.');
      mockDb.logActivity('Updated company general settings', 'System');
    } else if (activeTab === 'security') {
      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          setErrorMsg('Please fill out all fields to change password.');
          return;
        }
        if (newPassword !== confirmPassword) {
          setErrorMsg('New passwords do not match.');
          return;
        }
        if (newPassword.length < 6) {
          setErrorMsg('New password must be at least 6 characters.');
          return;
        }

        // Validate current password
        const storedUsers = localStorage.getItem('erp_global_users');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const matched = users.find((u: any) => u.id === user.id);
          if (!matched || matched.password !== currentPassword) {
            setErrorMsg('Incorrect current password.');
            return;
          }
        }
        
        changePassword(newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      localStorage.setItem(`erp_2fa_${user.id}`, JSON.stringify(twoFactorEnabled));
      setSuccessMsg('Security credentials updated successfully.');
    } else if (activeTab === 'notifications') {
      localStorage.setItem(`erp_email_alerts_${user.id}`, JSON.stringify(emailAlerts));
      localStorage.setItem(`erp_sms_alerts_${user.id}`, JSON.stringify(smsAlerts));
      localStorage.setItem(`erp_push_alerts_${user.id}`, JSON.stringify(pushAlerts));
      setSuccessMsg('Alert notifications preferences saved.');
    } else if (activeTab === 'integrations') {
      localStorage.setItem('erp_slack_webhook', slackWebhook);
      localStorage.setItem('erp_teams_webhook', teamsWebhook);
      setSuccessMsg('System webhooks integrations saved.');
    } else if (activeTab === 'preferences') {
      localStorage.setItem('erp_currency', compCurrency);
      localStorage.setItem('erp_language', compLanguage);
      localStorage.setItem(`erp_landing_page_${user.id}`, defaultLanding);
      setSuccessMsg('System language and base preferences saved.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }

    setTimeout(() => {
      setSuccessMsg('');
    }, 2500);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleExportBackup = () => {
    if (typeof window === 'undefined') return;
    const backup: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('erp_') || key.startsWith('company_'))) {
        backup[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    mockDb.logActivity('System database settings backup exported', 'System');
    alert('System backup JSON file downloaded successfully.');
  };

  const handleFactoryReset = () => {
    if (confirm('WARNING: This will permanently delete all employee records, attendance history, invoices, purchase orders, and settings. Your session will be logged out. Are you sure?')) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('erp_') || key.startsWith('company_'))) {
          localStorage.removeItem(key);
        }
      }
      localStorage.removeItem('erp_auth_user');
      alert('System reset successfully. Page will reload.');
      window.location.reload();
    }
  };

  return (
    <AuthLayout>
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure system-wide settings and preferences</p>
        </div>
        <button
          onClick={handleSaveChanges}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all inline-flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      {/* Message alerts */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-250 text-emerald-600 dark:text-emerald-450 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/50 p-3.5 rounded-xl text-xs flex items-center gap-2 text-rose-600 dark:text-rose-450">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Settings Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start text-xs">
        
        {/* Left Sidebar Tab Selection */}
        <div className="w-full lg:w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm shrink-0 p-2 space-y-1">
          <button
            onClick={() => { setActiveTab('profile'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            <span>My Profile</span>
          </button>
          <button
            onClick={() => { setActiveTab('account'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-semibold transition-all ${
              activeTab === 'account'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>Account Settings</span>
          </button>
          <button
            onClick={() => { setActiveTab('general'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-semibold transition-all ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>General</span>
          </button>
          <button
            onClick={() => { setActiveTab('roles'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-semibold transition-all ${
              activeTab === 'roles'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Users & Roles</span>
          </button>
          <button
            onClick={() => { setActiveTab('security'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-semibold transition-all ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </button>
          <button
            onClick={() => { setActiveTab('notifications'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-semibold transition-all ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </button>
          <button
            onClick={() => { setActiveTab('integrations'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-semibold transition-all ${
              activeTab === 'integrations'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Link2 className="h-4 w-4" />
            <span>Integrations</span>
          </button>
          <button
            onClick={() => { setActiveTab('preferences'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-semibold transition-all ${
              activeTab === 'preferences'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Right Active Tab Content Area */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px]">
          
          {/* TAB 1: MY PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800">My Profile</h2>
              
              {/* Photo Area */}
              <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b dark:border-slate-800">
                <div className="relative" ref={popoverRef}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="h-24 w-24 rounded-full object-cover border-4 border-slate-150 dark:border-slate-800 shadow-md animate-fade-in"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 shadow-md">
                      <svg className="h-18 w-18 text-slate-400 dark:text-slate-500 fill-current mt-3.5" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPhotoPopover(!showPhotoPopover)}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors shadow-lg cursor-pointer border-2 border-white dark:border-slate-900"
                    title="Change Avatar"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  
                  {/* Photo Actions Dropdown */}
                  {showPhotoPopover && (
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30 p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => { document.getElementById('settings-avatar-input')?.click(); setShowPhotoPopover(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded flex items-center gap-2 cursor-pointer font-medium text-slate-755 dark:text-slate-200"
                      >
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { startCamera(); setShowPhotoPopover(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded flex items-center gap-2 cursor-pointer font-medium text-slate-755 dark:text-slate-200"
                      >
                        <span>Take Photo</span>
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => { setAvatarUrl(''); setShowPhotoPopover(false); }}
                          className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded flex items-center gap-2 cursor-pointer font-semibold text-rose-600 dark:text-rose-400"
                        >
                          <span>Remove Photo</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  id="settings-avatar-input" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          compressAndSetAvatar(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden" 
                />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Profile Photo</h3>
                  <p className="text-slate-400 mt-1 text-[11px]">Upload an image file or take a webcam photo. Click "Save Changes" to apply.</p>
                </div>
              </div>

              {/* Profile Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200 font-mono"
                    placeholder="+91 99999 88888"
                  />
                </div>

                {user.role === 'Admin' ? (
                  <>
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-semibold mb-1">Personal Email ID</label>
                      <input
                        type="email"
                        value={personalEmail}
                        onChange={e => setPersonalEmail(e.target.value)}
                        className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200 font-mono"
                        placeholder="personal@email.com"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="block text-slate-500 font-semibold mb-1">About Me</label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                        placeholder="Write a brief bio about yourself..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-semibold mb-1">Job Title</label>
                      <input
                        type="text"
                        value={designation}
                        onChange={e => setDesignation(e.target.value)}
                        className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-semibold mb-1">Department</label>
                      <select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                      >
                        <option value="IT">IT</option>
                        <option value="HR">HR</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="block text-slate-500 font-semibold mb-1">Personal Email ID</label>
                      <input
                        type="email"
                        value={personalEmail}
                        onChange={e => setPersonalEmail(e.target.value)}
                        className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200 font-mono"
                        placeholder="personal@email.com"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="block text-slate-500 font-semibold mb-1">About Me</label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                        placeholder="Write a brief bio about yourself..."
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Account Information Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border dark:border-slate-800 space-y-3 mt-6">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Account Information</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b dark:border-slate-800">
                    <span className="text-slate-550">Employee ID</span>
                    <span className="font-mono font-bold text-slate-905 dark:text-slate-200">{empDetails?.emp_id || 'u-1'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b dark:border-slate-800">
                    <span className="text-slate-550">Role</span>
                    <span className="font-semibold text-slate-905 dark:text-slate-200 capitalize">{user.role}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b dark:border-slate-800">
                    <span className="text-slate-550">Status</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 animate-pulse">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-550">Last Login</span>
                    <span className="font-semibold text-slate-905 dark:text-slate-200">{lastLogin}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT SETTINGS */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800">Account Settings</h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Account Username</label>
                  <input
                    type="text"
                    disabled
                    value={email.split('@')[0]}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-855 rounded-lg text-slate-900 dark:text-slate-200 disabled:opacity-60 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Username is automatically generated from corporate email address prefix.</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Timezone Location</label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                  >
                    <option value="GMT">GMT (Greenwich Mean Time)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="IST">IST (Indian Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                    <option value="CET">CET (Central European Time)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Date Format Preference</label>
                  <select
                    value={dateFormat}
                    onChange={e => setDateFormat(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 23/06/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/23/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-23)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Automatic Log Session Timeout</label>
                  <select
                    value={sessionTimeout}
                    onChange={e => setSessionTimeout(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                  >
                    <option value="15 mins">15 Minutes</option>
                    <option value="30 mins">30 Minutes</option>
                    <option value="1 hour">1 Hour</option>
                    <option value="Never">Never (Keep Session Active)</option>
                  </select>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t dark:border-slate-800">
                <div className="p-4 bg-rose-50/20 dark:bg-rose-955/5 rounded-xl border border-rose-100 dark:border-rose-900/40 space-y-4">
                  <div>
                    <h3 className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                      <Trash2 className="h-4 w-4" /> Danger Zone
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Permanently delete your user account and all profile metadata from the system directory. This action is irreversible.
                    </p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Are you absolutely sure you want to permanently delete your account? You will be logged out and all your details will be removed.")) {
                          deleteAccount();
                          router.push("/login");
                        }
                      }}
                      className="px-4 py-2 bg-rose-650 hover:bg-rose-550 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Trash2 className="h-4 w-4" /> Delete My Account
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: GENERAL COMPANY INFO */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800">Company Information</h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Company Registered Name</label>
                  <input
                    type="text"
                    value={compName}
                    onChange={e => setCompName(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Office Corporate Address</label>
                  <input
                    type="text"
                    value={compAddress}
                    onChange={e => setCompAddress(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={compPhone}
                    onChange={e => setCompPhone(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={compEmail}
                    onChange={e => setCompEmail(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Corporate Website</label>
                  <input
                    type="text"
                    value={compWebsite}
                    onChange={e => setCompWebsite(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USERS & ROLES */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800">Users & Roles</h2>
              
              {/* RBAC Table */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-4.5 w-4.5 text-indigo-500" /> RBAC Permissions Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-850 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                        <th className="p-3">Module</th>
                        <th className="p-3">Admin</th>
                        <th className="p-3">HR</th>
                        <th className="p-3">Manager</th>
                        <th className="p-3">Employee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      <tr className="hover:bg-slate-100/50 dark:hover:bg-slate-850/40">
                        <td className="p-3 font-semibold">Finance & Ledger</td>
                        <td className="p-3 text-emerald-605 dark:text-emerald-450 font-bold">Write / Read</td>
                        <td className="p-3 text-rose-500">Restricted</td>
                        <td className="p-3 text-rose-500">Restricted</td>
                        <td className="p-3 text-rose-500">Restricted</td>
                      </tr>
                      <tr className="hover:bg-slate-100/50 dark:hover:bg-slate-850/40">
                        <td className="p-3 font-semibold">HR & Payroll</td>
                        <td className="p-3 text-emerald-605 dark:text-emerald-450 font-bold">Write / Read</td>
                        <td className="p-3 text-emerald-605 dark:text-emerald-450 font-bold">Write / Read</td>
                        <td className="p-3 text-indigo-650 dark:text-indigo-400">Read Directory</td>
                        <td className="p-3 text-indigo-650 dark:text-indigo-400">Read Profile</td>
                      </tr>
                      <tr className="hover:bg-slate-100/50 dark:hover:bg-slate-850/40">
                        <td className="p-3 font-semibold">Leaves & POs</td>
                        <td className="p-3 text-emerald-605 dark:text-emerald-450 font-bold">Write / Read</td>
                        <td className="p-3 text-emerald-605 dark:text-emerald-450 font-bold">Approve Leaves</td>
                        <td className="p-3 text-emerald-605 dark:text-emerald-450 font-bold">Approve All</td>
                        <td className="p-3 text-slate-500">Apply Requests</td>
                      </tr>
                      <tr className="hover:bg-slate-100/50 dark:hover:bg-slate-850/40">
                        <td className="p-3 font-semibold">Inventory Stock</td>
                        <td className="p-3 text-emerald-605 dark:text-emerald-450 font-bold">Write / Read</td>
                        <td className="p-3 text-rose-500">Restricted</td>
                        <td className="p-3 text-emerald-605 dark:text-emerald-450 font-bold">Write / Read</td>
                        <td className="p-3 text-rose-500">Restricted</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Roster of Global User Accounts */}
              {user.role === 'Admin' && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border dark:border-slate-800 space-y-4">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4.5 w-4.5 text-indigo-500" /> Registered System Users
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-850 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                          <th className="p-3">Avatar</th>
                          <th className="p-3">Name</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">System Role</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {mockDb.getGlobalUsers().map((u) => (
                          <tr key={u.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-850/40">
                            <td className="p-3">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt={u.name} className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-slate-205 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
                                  <svg className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 fill-current mt-1" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                  </svg>
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">{u.name}</td>
                            <td className="p-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-605 dark:bg-indigo-955/20 dark:text-indigo-400 uppercase">
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3 text-right text-xs font-semibold">
                              {u.id !== user.id ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete the user account for ${u.name} (${u.email})?`)) {
                                      // Remove matching employee entry if it exists
                                      const employees = mockDb.getEmployees();
                                      const filteredEmployees = employees.filter(e => e.email.toLowerCase() !== u.email.toLowerCase());
                                      mockDb.set('erp_employees', filteredEmployees);

                                      // Remove from global users registry
                                      const storedUsers = localStorage.getItem('erp_global_users');
                                      if (storedUsers) {
                                        const users = JSON.parse(storedUsers);
                                        const filteredUsers = users.filter((gu: any) => gu.id !== u.id);
                                        localStorage.setItem('erp_global_users', JSON.stringify(filteredUsers));
                                      }

                                      mockDb.logActivity(`Admin deleted account for ${u.name} (${u.email})`, 'System');
                                      loadSettings();
                                    }
                                  }}
                                  className="p-1 hover:bg-rose-50 dark:hover:bg-rose-955/30 rounded text-rose-500 inline-flex items-center justify-center cursor-pointer"
                                  title="Delete User Account"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Logged In</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SECURITY PREFERENCES */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800">Security & Password</h2>
              
              {/* Change Password Form */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-indigo-500" /> Update Password
                </h3>
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-semibold mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-semibold mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-855 rounded-lg text-slate-900 dark:text-slate-200"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-semibold mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              {/* 2FA Toggle */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-4.5 w-4.5 text-indigo-500" /> Multi-Factor Authentication
                </h3>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-550 dark:text-slate-350">Enable Two-Factor (2FA)</span>
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={e => setTwoFactorEnabled(e.target.checked)}
                    className="rounded text-indigo-650 focus:ring-0 h-4 w-4"
                  />
                </label>
                <p className="text-[10px] text-slate-400 leading-normal">
                  When enabled, your account logins will simulate verification codes checks on credentials check-in.
                </p>
              </div>

              {/* DB Maintenance - Admin Only */}
              {user.role === 'Admin' && (
                <div className="p-4 bg-rose-50/20 dark:bg-rose-955/5 rounded-xl border border-rose-100 dark:border-rose-900/40 space-y-4">
                  <h3 className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="h-4.5 w-4.5 text-rose-500" /> Database Administration
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Perform system database schema exports or execute a complete factory reset.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold flex items-center justify-center gap-1.5 border border-indigo-100 dark:border-indigo-900/50 cursor-pointer"
                    >
                      <Download className="h-4 w-4" /> Export DB Backup
                    </button>
                    <button
                      type="button"
                      onClick={handleFactoryReset}
                      className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-605 dark:text-rose-450 rounded-lg font-bold flex items-center justify-center gap-1.5 border border-rose-100 dark:border-rose-900/30 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" /> Reset ERP Suite
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800">Notifications Channels</h2>
              
              <div className="space-y-3.5">
                <label className="flex items-center justify-between cursor-pointer p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800">
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Email Alerts Channel</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Receive transaction logs and invoice updates via corporate email.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={e => setEmailAlerts(e.target.checked)}
                    className="rounded text-indigo-605 focus:ring-0 h-4.5 w-4.5"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800">
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">SMS Text Alerts Channel</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Receive critical stock shortage and security warnings on contact number.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={e => setSmsAlerts(e.target.checked)}
                    className="rounded text-indigo-605 focus:ring-0 h-4.5 w-4.5"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800">
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Push alerts banner</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Enable immediate top-right alert banner slide-ins within ERP suite.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushAlerts}
                    onChange={e => setPushAlerts(e.target.checked)}
                    className="rounded text-indigo-605 focus:ring-0 h-4.5 w-4.5"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 7: INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800">System Integrations</h2>
              
              {/* Slack Webhook */}
              <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-800/40 border dark:border-slate-800 rounded-xl">
                <label className="block text-slate-800 dark:text-slate-200 font-bold">Slack Incoming Webhook URL</label>
                <input
                  type="text"
                  value={slackWebhook}
                  onChange={e => setSlackWebhook(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-855 rounded-lg text-slate-900 dark:text-slate-200 font-mono text-[11px]"
                />
                <span className="text-[10px] text-slate-400 block">Trigger real-time log alerts directly to your Slack team workspace channels.</span>
              </div>

              {/* Teams Webhook */}
              <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-800/40 border dark:border-slate-800 rounded-xl">
                <label className="block text-slate-800 dark:text-slate-200 font-bold">Microsoft Teams Webhook URL</label>
                <input
                  type="text"
                  value={teamsWebhook}
                  onChange={e => setTeamsWebhook(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-855 rounded-lg text-slate-900 dark:text-slate-200 font-mono text-[11px]"
                />
                <span className="text-[10px] text-slate-400 block">Post workflow notices to Microsoft Teams channels using inbound connectors.</span>
              </div>

              {/* REST API tokens */}
              <div className="space-y-3.5 p-4 bg-slate-50 dark:bg-slate-800/40 border dark:border-slate-800 rounded-xl">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs">ERP REST API Access Token</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Use this token as Bearer authorization header to query company ledger endpoint programmatically.</p>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={apiToken}
                    className="flex-1 px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-500 font-mono text-[10px] select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="px-3.5 bg-white dark:bg-slate-800 border dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
                  >
                    {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-505" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800">System Preferences</h2>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Base Currency */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Base Currency</label>
                  <select
                    value={compCurrency}
                    onChange={e => setCompCurrency(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                    <option value="GBP">£ GBP (British Pound)</option>
                  </select>
                </div>

                {/* System Language */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">System Language</label>
                  <select
                    value={compLanguage}
                    onChange={e => setCompLanguage(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-855 rounded-lg text-slate-900 dark:text-slate-200"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                  </select>
                </div>

                {/* Default Landing Route */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Default Landing Workspace</label>
                  <select
                    value={defaultLanding}
                    onChange={e => setDefaultLanding(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-slate-900 dark:text-slate-200"
                  >
                    <option value="/dashboard">Dashboard Overview</option>
                    {user.role === 'Admin' && <option value="/ai-insights">AI insights</option>}
                    <option value="/hr">HR & Payroll Portal</option>
                    <option value="/inventory">Inventory Stock Manager</option>
                    <option value="/settings">Settings Control Panel</option>
                  </select>
                </div>

                {/* Theme toggle */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800 mt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Application Theme Mode</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Toggle between Dark and Light UI themes.</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="px-3.5 py-1.5 border dark:border-slate-750 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-sm text-slate-700 dark:text-slate-300"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="h-4 w-4 text-amber-500" /> Switch Light
                        </>
                      ) : (
                        <>
                          <Moon className="h-4 w-4 text-indigo-650" /> Switch Dark
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Webcam Photo Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200">
            <h3 className="font-bold text-base text-slate-850 dark:text-white">Take Profile Photo</h3>
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video border dark:border-slate-800">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-550 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="px-4 py-2 bg-blue-650 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
              >
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}

    </AuthLayout>
  );
}

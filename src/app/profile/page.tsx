'use client';

import React, { useState, useEffect } from 'react';
import AuthLayout from '../../components/layout/AuthLayout';
import PageHeader from '../../components/layout/PageHeader';
import { useAuthStore } from '../../store/authStore';
import { mockDb } from '../../services/mockDb';
import { 
  User, Shield, Briefcase, Mail, Phone, Clock, UserCheck, DollarSign, Check
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  // Retrieve employee details if available
  const employees = mockDb.getEmployees();
  const empDetails = employees.find(e => e.email.toLowerCase() === user?.email?.toLowerCase());
  
  // Profile display states
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [alternateEmail, setAlternateEmail] = useState('');
  const [bio, setBio] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [personalActivities, setPersonalActivities] = useState<any[]>([]);

  // Corporate Bank states
  const [companyBankName, setCompanyBankName] = useState('State Bank of India');
  const [companyBankAccount, setCompanyBankAccount] = useState('33045612890');
  const [companyBankIfsc, setCompanyBankIfsc] = useState('SBIN0000301');
  const [companyBankBalanceStr, setCompanyBankBalanceStr] = useState('500000');
  const [syncingFeed, setSyncingFeed] = useState(false);
  const [secondsSinceSync, setSecondsSinceSync] = useState(0);

  // Edit Modal States
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [editBankName, setEditBankName] = useState('');
  const [editBankAccount, setEditBankAccount] = useState('');
  const [editBankIfsc, setEditBankIfsc] = useState('');
  const [editBankBalance, setEditBankBalance] = useState('');

  const loadProfile = React.useCallback(() => {
    if (user) {
      // Load personal activity feed
      const allActivities = mockDb.getActivities();
      // Filter activities containing user's name
      const filtered = allActivities.filter(act => 
        act.description.toLowerCase().includes(user.name.toLowerCase())
      );
      setPersonalActivities(filtered.slice(0, 10));

      // Load 2FA preference status
      const stored2fa = localStorage.getItem(`erp_2fa_${user.id}`);
      if (stored2fa) {
        setTwoFactorEnabled(JSON.parse(stored2fa));
      }

      // Load biography from local storage
      const storedBio = localStorage.getItem(`erp_bio_${user.id}`);
      setBio(storedBio || user.aboutMe || '');

      // Load avatar from local storage fallback
      const storedAvatar = localStorage.getItem(`erp_avatar_${user.id}`);
      setAvatarUrl(storedAvatar || user.avatarUrl || '');

      // Load phone from local storage fallback or employee details
      const storedPhone = localStorage.getItem(`erp_phone_${user.id}`);
      setPhone(storedPhone || empDetails?.phone || '');

      // Load alternate email from local storage fallback or employee details
      const storedAltEmail = localStorage.getItem(`erp_alt_email_${user.id}`);
      setAlternateEmail(storedAltEmail || user.personalEmail || empDetails?.personalEmail || '');

      // Load company bank details
      const storedCompBankName = localStorage.getItem('company_bank_name');
      if (storedCompBankName) setCompanyBankName(storedCompBankName);

      const storedCompBankAccount = localStorage.getItem('company_bank_account');
      if (storedCompBankAccount) setCompanyBankAccount(storedCompBankAccount);

      const storedCompBankIfsc = localStorage.getItem('company_bank_ifsc');
      if (storedCompBankIfsc) setCompanyBankIfsc(storedCompBankIfsc);

      const storedCompBankBalance = localStorage.getItem('company_bank_balance');
      if (storedCompBankBalance) setCompanyBankBalanceStr(storedCompBankBalance);

      setSecondsSinceSync(0);
    }
  }, [user, empDetails]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfile();
    }, 0);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('company_') || e.key.startsWith('erp_') || e.key === 'erp_auth_user')) {
        loadProfile();
      }
    };

    // Periodically poll localStorage for changes in company bank balance/details
    const pollInterval = setInterval(() => {
      loadProfile();
    }, 3000);

    // Periodically increment seconds since sync for visual update
    const syncTimer = setInterval(() => {
      setSecondsSinceSync(prev => prev + 1);
    }, 1000);

    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearTimeout(timer);
      clearInterval(pollInterval);
      clearInterval(syncTimer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, loadProfile]);

  if (!user) return null;

  const name = user.name;
  const email = user.email;

  return (
    <AuthLayout>
      <PageHeader 
        title="User Dossier & Profile" 
        description="View your personal identity, system credentials, and official corporate dossier. Profile updates can be made inside the Settings page."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        
        {/* Left Column: Dossier Information */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Official Employee Metadata Card */}
          {(empDetails || user.role === 'Admin') && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="h-4.5 w-4.5 text-indigo-650" /> Corporate Roster Dossier
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-1 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Employee ID</span>
                  <span className="font-mono font-bold text-slate-805 dark:text-slate-200 mt-1 block">{empDetails?.emp_id || user.id}</span>
                </div>
                {user.role !== 'Admin' && (
                  <>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Department</span>
                      <span className="font-bold text-slate-805 dark:text-slate-200 mt-1 block">{empDetails?.department || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Designation</span>
                      <span className="font-bold text-slate-805 dark:text-slate-200 mt-1 block truncate" title={empDetails?.designation}>{empDetails?.designation || 'N/A'}</span>
                    </div>
                  </>
                )}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Joining Date</span>
                  <span className="font-mono font-bold text-slate-850 dark:text-slate-200 mt-1 block">{empDetails?.joiningDate || '2025-01-01'}</span>
                </div>
              </div>
            </div>
          )}

          {/* User Dossier Profile Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b dark:border-slate-850">
              <User className="h-4.5 w-4.5 text-indigo-500" /> User Profile Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="block text-slate-400 font-semibold mb-0.5">Full Name</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium py-1.5 px-3 bg-slate-50 dark:bg-slate-850 rounded-lg">{name}</p>
              </div>
              <div className="space-y-1">
                <span className="block text-slate-400 font-semibold mb-0.5">Corporate Login Email</span>
                <p className="text-slate-805 dark:text-slate-200 font-medium py-1.5 px-3 bg-slate-50 dark:bg-slate-850 rounded-lg font-mono">{email}</p>
              </div>
              <div className="space-y-1">
                <span className="block text-slate-400 font-semibold mb-0.5">Alternate / Personal Email</span>
                <p className="text-slate-805 dark:text-slate-200 font-medium py-1.5 px-3 bg-slate-50 dark:bg-slate-850 rounded-lg font-mono">
                  {alternateEmail || <span className="text-slate-400 italic">No alternate email added</span>}
                </p>
              </div>
              <div className="space-y-1">
                <span className="block text-slate-400 font-semibold mb-0.5">Contact Phone Number</span>
                <p className="text-slate-805 dark:text-slate-200 font-medium py-1.5 px-3 bg-slate-50 dark:bg-slate-850 rounded-lg font-mono">
                  {phone || <span className="text-slate-400 italic">No phone number added</span>}
                </p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="block text-slate-400 font-semibold mb-0.5">About Me / Biography</span>
                <p className="text-slate-805 dark:text-slate-200 font-medium py-2 px-3 bg-slate-50 dark:bg-slate-850 rounded-lg leading-relaxed whitespace-pre-wrap">
                  {bio || <span className="text-slate-400 italic">No biography details provided yet.</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Corporate Bank Account Details Card */}
          {empDetails && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b dark:border-slate-850">
                <DollarSign className="h-4.5 w-4.5 text-emerald-500" /> Bank & Salary Disbursement Details
              </h3>
              {empDetails.bankName || empDetails.bankAccount || empDetails.bankIfsc ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="block text-slate-400 font-semibold mb-0.5">Bank Name</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium py-1.5 px-3 bg-slate-50 dark:bg-slate-850 rounded-lg">
                      {empDetails.bankName || <span className="text-slate-400 italic">Not set</span>}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-slate-400 font-semibold mb-0.5">Account Number</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium py-1.5 px-3 bg-slate-50 dark:bg-slate-850 rounded-lg font-mono">
                      {empDetails.bankAccount || <span className="text-slate-400 italic">Not set</span>}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-slate-400 font-semibold mb-0.5">IFSC Code</span>
                    <p className="text-slate-805 dark:text-slate-200 font-medium py-1.5 px-3 bg-slate-50 dark:bg-slate-850 rounded-lg font-mono uppercase">
                      {empDetails.bankIfsc || <span className="text-slate-400 italic">Not set</span>}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-850/40 rounded-xl text-center text-slate-450 border border-dashed dark:border-slate-800">
                  No corporate salary account details configured. Please contact the payroll administration department to set up your bank account.
                </div>
              )}
              <p className="text-[10px] text-slate-400 italic">
                Note: Your bank disbursement details are managed by the company administration. If there is an error or you wish to update your details, please contact HR/Finance.
              </p>
            </div>
          )}

          {/* Corporate Funding & Bank Feed Card */}
          {user.role === 'Admin' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b dark:border-slate-850">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4.5 w-4.5 text-blue-500" /> Corporate Funding & Bank Feed
                </h3>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold uppercase tracking-wider">Live Bank Feed</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="block text-slate-400 font-semibold mb-0.5">Connected Bank Name</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium py-1.5 px-3 bg-slate-50 dark:bg-slate-850 rounded-lg">
                    {companyBankName}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="block text-slate-400 font-semibold mb-0.5">Account Number</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium py-1.5 px-3 bg-slate-50 dark:bg-slate-850 rounded-lg font-mono">
                    {companyBankAccount}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="block text-slate-400 font-semibold mb-0.5">IFSC Routing Code</span>
                  <p className="text-slate-805 dark:text-slate-200 font-medium py-1.5 px-3 bg-slate-50 dark:bg-slate-850 rounded-lg font-mono uppercase">
                    {companyBankIfsc}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-850/40 rounded-xl border dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Real-Time Available Balance</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-mono font-black text-slate-855 dark:text-white block">
                      ₹{parseFloat(companyBankBalanceStr).toLocaleString()}
                    </span>
                    <span className="flex h-2 w-2 relative self-center mb-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <span className="text-[9px] text-emerald-650 dark:text-emerald-400 font-medium block">
                    Active Connection • Last Synced: {secondsSinceSync === 0 ? 'Just now' : `${secondsSinceSync}s ago`}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={syncingFeed}
                    onClick={() => {
                      setSyncingFeed(true);
                      setTimeout(() => {
                        setSyncingFeed(false);
                        loadProfile();
                        setSecondsSinceSync(0);
                        alert('Bank Feed Synchronized! Available balance is up-to-date.');
                      }, 1200);
                    }}
                    className={`px-4 py-2 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer ${
                      syncingFeed ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Clock className={`h-3.5 w-3.5 ${syncingFeed ? 'animate-spin text-blue-500' : 'text-slate-450'}`} />
                    {syncingFeed ? 'Syncing...' : 'Sync Bank Feed'}
                  </button>

                  {user.role === 'Admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditBankName(companyBankName);
                        setEditBankAccount(companyBankAccount);
                        setEditBankIfsc(companyBankIfsc);
                        setEditBankBalance(companyBankBalanceStr);
                        setShowEditBankModal(true);
                      }}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Modify Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* User Audit Log Activity Feed */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-indigo-500" /> My Actions Audit Feed
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {personalActivities.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">
                  No personal action logs recorded. Any operations you perform will log here.
                </div>
              ) : (
                personalActivities.map((act, index) => (
                  <div key={`${act.id}-${index}`} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border dark:border-slate-800 flex items-start gap-2.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-0.5">
                      <p className="text-slate-700 dark:text-slate-300 leading-normal">{act.description}</p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Avatar Summary & Security Panel */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Profile Quick Card Summary */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="relative flex flex-col items-center gap-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="h-20 w-20 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
                  <svg className="h-16 w-16 text-slate-400 dark:text-slate-500 fill-current mt-3" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-850 dark:text-white">{user.name}</h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">
                {user.role}
              </span>
            </div>
            
            {/* Contact dossier card details */}
            <div className="w-full border-t dark:border-slate-800 pt-3 text-left space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2 truncate">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span className={phone ? 'text-slate-700 dark:text-slate-300 font-mono' : 'text-slate-450 italic'}>
                  {phone || 'No phone added'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span className={alternateEmail ? 'text-slate-700 dark:text-slate-300' : 'text-slate-450 italic'}>
                  {alternateEmail || 'No personal email added'}
                </span>
              </div>
              
              <div className="border-t dark:border-slate-800 pt-2.5 mt-2.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">About Me</span>
                <p className={`text-[11px] leading-normal ${bio ? 'text-slate-700 dark:text-slate-300' : 'italic text-slate-450'}`}>
                  {bio || 'No biography details provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Security Status preferences */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-4.5 w-4.5 text-indigo-500" /> Security Roster Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b dark:border-slate-850">
                <span className="text-slate-500">2-Factor Auth (2FA)</span>
                <span className={`font-semibold ${twoFactorEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-850">
                <span className="text-slate-500">Sign-in Status</span>
                <span className="text-emerald-500 font-semibold">Active Session</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-550">Account Integrity</span>
                <span className="text-indigo-650 dark:text-indigo-400 font-semibold">Verified Dossier</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Edit Corporate Bank Modal */}
      {showEditBankModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!editBankName || !editBankAccount || !editBankIfsc) return;
              localStorage.setItem('company_bank_name', editBankName);
              localStorage.setItem('company_bank_account', editBankAccount);
              localStorage.setItem('company_bank_ifsc', editBankIfsc);
              mockDb.recalculateCompanyBankBalance();
              mockDb.logActivity('Admin updated corporate banking details and feed routing code', 'System');
              setShowEditBankModal(false);
              loadProfile();
              alert('Connected Corporate Account updated successfully!');
            }} 
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center gap-2 pb-2 border-b dark:border-slate-800">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-955/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-850 dark:text-white">Modify Connected Corporate Account</h3>
                <p className="text-[10px] text-slate-400">Configure corporate bank feed node parameters.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Bank Name</label>
                <input
                  type="text"
                  required
                  value={editBankName}
                  onChange={e => setEditBankName(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg"
                  placeholder="e.g. HDFC Bank"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  value={editBankAccount}
                  onChange={e => setEditBankAccount(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg font-mono"
                  placeholder="e.g. 501004328912"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">IFSC Code</label>
                  <input
                    type="text"
                    required
                    value={editBankIfsc}
                    onChange={e => setEditBankIfsc(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg font-mono uppercase"
                    placeholder="e.g. HDFC0000104"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Live Balance (₹)</label>
                  <input
                    type="text"
                    disabled={true}
                    value={parseFloat(editBankBalance).toLocaleString()}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-450 dark:text-slate-500 rounded-lg font-mono cursor-not-allowed"
                  />
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">
                    Recalculated dynamically in real-time based on ledger transactions.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs font-semibold pt-2 border-t dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditBankModal(false)}
                className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
              >
                Save Connected Feed
              </button>
            </div>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}

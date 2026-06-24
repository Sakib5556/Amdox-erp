'use client';

import React, { useState, useEffect } from 'react';
import AuthLayout from '../../components/layout/AuthLayout';
import PageHeader from '../../components/layout/PageHeader';
import { useAuthStore } from '../../store/authStore';
import { mockDb } from '../../services/mockDb';
import { 
  User, Shield, Briefcase, Mail, Phone, Clock, UserCheck
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

    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearTimeout(timer);
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

    </AuthLayout>
  );
}

import { create } from 'zustand';
import { User, UserRole } from '../types';
import { mockDb } from '../services/mockDb';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  initializeAuth: () => void;
  updateProfile: (name: string, email: string, avatarUrl?: string, personalEmail?: string, aboutMe?: string) => void;
  deleteAccount: () => void;
  changePassword: (newPassword: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initializeAuth: () => {
    if (typeof window === 'undefined') return;
    
    // Always bootstrap/seed default mock database on application load
    mockDb.initialize();

    const syncAuth = () => {
      const storedUser = localStorage.getItem('erp_auth_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        set({ 
          user: u, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    syncAuth();

    // Cross-tab authentication and profile update sync
    window.addEventListener('storage', (e) => {
      if (e.key === 'erp_auth_user') {
        syncAuth();
      }
    });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    
    // Simulate brief API latency
    await new Promise(resolve => setTimeout(resolve, 400));

    if (typeof window === 'undefined') {
      set({ isLoading: false });
      return false;
    }

    // Ensure database is initialized before validating login credentials
    mockDb.initialize();

    // Read global user accounts registry directly
    const storedUsers = localStorage.getItem('erp_global_users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];

    const matched = users.find(
      (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!matched) {
      set({ isLoading: false });
      return false;
    }

    const sessionUser: User = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      role: matched.role as UserRole,
      avatarUrl: matched.avatarUrl || ''
    };

    localStorage.setItem('erp_auth_user', JSON.stringify(sessionUser));
    set({ 
      user: sessionUser, 
      isAuthenticated: true, 
      isLoading: false 
    });

    // Initialize mock database context under prefix
    mockDb.initialize();

    // Auto-mark attendance on login for non-Admin users (HR, Manager, Employee)
    if (sessionUser.role !== 'Admin') {
      const emp = mockDb.getEmployees().find(e => e.email.toLowerCase() === sessionUser.email.toLowerCase());
      if (emp) {
        const todayStr = new Date().toISOString().split('T')[0];
        const attendanceList = mockDb.getAttendance();
        const alreadyMarked = attendanceList.some(a => a.emp_id === emp.emp_id && a.date === todayStr);
        
        if (!alreadyMarked) {
          // Check for approved leave covering today
          const leaves = mockDb.getLeaves();
          const hasApprovedLeave = leaves.some(l => 
            l.emp_id === emp.emp_id && 
            l.status === 'Approved' && 
            todayStr >= l.fromDate && 
            todayStr <= l.toDate
          );

          if (hasApprovedLeave) {
            mockDb.markAttendance({
              emp_id: emp.emp_id,
              date: todayStr,
              status: 'Leave'
            });
          } else {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            // Attendance marking starts from 9:50 AM and stops after 6:00 PM
            const isBefore950 = currentHour < 9 || (currentHour === 9 && currentMinute < 50);
            const isAfter6PM = currentHour >= 18;

            if (!isBefore950 && !isAfter6PM) {
              const checkInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const status = currentHour < 10 ? 'Present' : 'Late';
              mockDb.markAttendance({
                emp_id: emp.emp_id,
                date: todayStr,
                status: status,
                checkIn: checkInTime,
                checkOut: '06:00 PM'
              });
            }
          }
        }
      }
    }
    
    mockDb.logActivity(`${sessionUser.name} logged in successfully`, 'System');
    localStorage.setItem(`erp_last_login_${sessionUser.id}`, new Date().toLocaleString());
    return true;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('erp_auth_user');
      if (storedUser) {
        const u = JSON.parse(storedUser) as User;
        
        // Update checkout time and mark Half Day if early logout
        if (u.role !== 'Admin') {
          const emp = mockDb.getEmployees().find(e => e.email.toLowerCase() === u.email.toLowerCase());
          if (emp) {
            const todayStr = new Date().toISOString().split('T')[0];
            const attendanceList = mockDb.getAttendance();
            const attIndex = attendanceList.findIndex(a => a.emp_id === emp.emp_id && a.date === todayStr);
            if (attIndex !== -1) {
              const now = new Date();
              const checkOutTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              // Company working hours are 10:00 AM to 6:00 PM
              // If current hour is before 18 (6:00 PM), mark as "Half Day"
              const currentHour = now.getHours();
              const isBefore6PM = currentHour < 18;
              
              attendanceList[attIndex].checkOut = checkOutTime;
              if (isBefore6PM) {
                attendanceList[attIndex].status = 'Half Day';
                mockDb.logActivity(`${u.name} logged out early. Status marked as Half Day.`, 'HR');
              } else {
                // If they checked out at or after 6:00 PM, determine if Present or Late based on checkIn time
                const checkInStr = attendanceList[attIndex].checkIn || '09:00 AM';
                const checkInParts = checkInStr.split(' ');
                const timeParts = checkInParts[0].split(':');
                let checkInHour = parseInt(timeParts[0]) || 9;
                const isPM = checkInParts[1] === 'PM';
                if (isPM && checkInHour !== 12) checkInHour += 12;
                if (!isPM && checkInHour === 12) checkInHour = 0;
                
                attendanceList[attIndex].status = checkInHour < 10 ? 'Present' : 'Late';
                mockDb.logActivity(`${u.name} checked out. Status marked as ${attendanceList[attIndex].status}.`, 'HR');
              }
              mockDb.set('erp_attendance', attendanceList);
            }
          }
        }
        
        mockDb.logActivity(`${u.name} logged out`, 'System');
      }
      localStorage.removeItem('erp_auth_user');
    }
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: (name: string, email: string, avatarUrl?: string, personalEmail?: string, aboutMe?: string) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    const updatedUser = { ...currentUser, name, email };
    if (avatarUrl !== undefined) {
      updatedUser.avatarUrl = avatarUrl;
    }
    if (personalEmail !== undefined) {
      updatedUser.personalEmail = personalEmail;
    }
    if (aboutMe !== undefined) {
      updatedUser.aboutMe = aboutMe;
    }

    localStorage.setItem('erp_auth_user', JSON.stringify(updatedUser));
    
    // Update in global users registry as well
    const storedUsers = localStorage.getItem('erp_global_users');
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      const index = users.findIndex((u: any) => u.id === currentUser.id);
      if (index !== -1) {
        users[index] = { 
          ...users[index], 
          name, 
          email, 
          avatarUrl: avatarUrl !== undefined ? avatarUrl : users[index].avatarUrl,
          personalEmail: personalEmail !== undefined ? personalEmail : users[index].personalEmail,
          aboutMe: aboutMe !== undefined ? aboutMe : users[index].aboutMe
        };
        localStorage.setItem('erp_global_users', JSON.stringify(users));
      }
    }

    // Also update in employee directory if matches
    const employees = mockDb.getEmployees();
    const empIndex = employees.findIndex(e => e.email.toLowerCase() === currentUser.email.toLowerCase());
    if (empIndex !== -1) {
      employees[empIndex].name = name;
      employees[empIndex].email = email;
      if (avatarUrl !== undefined) {
        employees[empIndex].avatarUrl = avatarUrl;
      }
      if (personalEmail !== undefined) {
        employees[empIndex].personalEmail = personalEmail;
      }
      if (aboutMe !== undefined) {
        employees[empIndex].aboutMe = aboutMe;
      }
      mockDb.set('erp_employees', employees);
    }

    set({ user: updatedUser });
    mockDb.logActivity(`${name} updated profile details`, 'System');
  },

  deleteAccount: () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    if (typeof window !== 'undefined') {
      // 1. Remove from erp_global_users
      const storedUsers = localStorage.getItem('erp_global_users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const filteredUsers = users.filter((u: any) => u.id !== currentUser.id);
        localStorage.setItem('erp_global_users', JSON.stringify(filteredUsers));
      }

      // 2. Remove matching employee by email from erp_employees
      const employees = mockDb.getEmployees();
      const filteredEmployees = employees.filter(e => e.email.toLowerCase() !== currentUser.email.toLowerCase());
      mockDb.set('erp_employees', filteredEmployees);

      // 3. Clear auth session
      localStorage.removeItem('erp_auth_user');
      mockDb.logActivity(`User account ${currentUser.name} (${currentUser.email}) was permanently deleted`, 'System');
    }

    set({ user: null, isAuthenticated: false });
  },

  changePassword: (newPassword: string) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    if (typeof window !== 'undefined') {
      const storedUsers = localStorage.getItem('erp_global_users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const index = users.findIndex((u: any) => u.id === currentUser.id);
        if (index !== -1) {
          users[index].password = newPassword;
          localStorage.setItem('erp_global_users', JSON.stringify(users));
        }
      }
      mockDb.logActivity(`${currentUser.name} changed their password`, 'System');
    }
  }
}));

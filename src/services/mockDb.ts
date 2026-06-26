import { 
  Employee, Attendance, LeaveRequest, Product, Vendor, 
  PurchaseOrder, Project, Task, Transaction, ActivityLog, ERPNotification, User, UserRole
} from '../types';

// Storage Keys
const KEYS = {
  GLOBAL_USERS: 'erp_global_users', // Global registry for all accounts
  EMPLOYEES: 'erp_employees',
  ATTENDANCE: 'erp_attendance',
  LEAVES: 'erp_leaves',
  PRODUCTS: 'erp_products',
  VENDORS: 'erp_vendors',
  POS: 'erp_pos',
  PROJECTS: 'erp_projects',
  TASKS: 'erp_tasks',
  TRANSACTIONS: 'erp_transactions',
  ACTIVITIES: 'erp_activities',
  NOTIFICATIONS: 'erp_notifications'
};

const getPrefix = (): string => {
  return 'company_';
};

const getStorageKey = (baseKey: string): string => {
  if (baseKey === KEYS.GLOBAL_USERS) {
    return baseKey; // Global registered users database is shared
  }
  return `${getPrefix()}${baseKey}`;
};

// DB Helper Functions
export const mockDb = {
  initialize: () => {
    if (typeof window === 'undefined') return;
    
    // Seed empty arrays if they don't exist under the workspace prefix
    const checkAndInitEmpty = (key: string, initialData: any[] = []) => {
      const fullKey = getStorageKey(key);
      if (!localStorage.getItem(fullKey)) {
        localStorage.setItem(fullKey, JSON.stringify(initialData));
      }
    };

    const seedVersion = localStorage.getItem('erp_seeded_version_v5');

    if (seedVersion !== 'true') {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // 1. Seed Global Users (with sakib@amdox.com as Admin login)
      const existingUsersStr = localStorage.getItem('erp_global_users');
      const existingUsers: User[] = existingUsersStr ? JSON.parse(existingUsersStr) : [];

      const seedUsers: User[] = [
        { id: 'USR-ADMIN', name: 'Sakib Mulla', email: 'sakib@amdox.com', role: 'Admin', password: 'password', avatarUrl: '' },
        { id: 'USR-HR', name: 'Sarah Jenkins', email: 'hr@amdox.com', role: 'HR', password: 'password', avatarUrl: '' },
        { id: 'USR-MGR', name: 'John Doe', email: 'manager@amdox.com', role: 'Manager', password: 'password', avatarUrl: '' },
        { id: 'USR-EMP', name: 'Alex Rivera', email: 'employee@amdox.com', role: 'Employee', password: 'password', avatarUrl: '' }
      ];

      // Keep existing passwords/details if user exists in localStorage
      const mergedUsers = seedUsers.map(su => {
        const matched = existingUsers.find(eu => eu.email.toLowerCase() === su.email.toLowerCase() || eu.id === su.id);
        if (matched) {
          return {
            ...su,
            name: matched.name || su.name,
            email: matched.email || su.email,
            password: matched.password || su.password,
            avatarUrl: matched.avatarUrl || su.avatarUrl,
            personalEmail: matched.personalEmail || su.personalEmail,
            aboutMe: matched.aboutMe || su.aboutMe
          };
        }
        return su;
      });

      // Keep any other custom users
      existingUsers.forEach(eu => {
        if (!mergedUsers.some(mu => mu.email.toLowerCase() === eu.email.toLowerCase() || mu.id === eu.id)) {
          mergedUsers.push(eu);
        }
      });

      localStorage.setItem('erp_global_users', JSON.stringify(mergedUsers));

      // 2. Seed Employees
      const existingEmployeesStr = localStorage.getItem(getStorageKey(KEYS.EMPLOYEES));
      const existingEmployees: Employee[] = existingEmployeesStr ? JSON.parse(existingEmployeesStr) : [];

      const seedEmployees: Employee[] = [
        { emp_id: 'EMP-01', name: 'Sarah Jenkins', department: 'HR', designation: 'HR Manager', email: 'hr@amdox.com', personalEmail: 'sarah.j@gmail.com', phone: '+91 98765 43210', salary: 95000, status: 'Active', joiningDate: '2025-01-15', avatarUrl: '', bankName: 'HDFC Bank', bankAccount: '50100432891201', bankIfsc: 'HDFC0000104' },
        { emp_id: 'EMP-02', name: 'John Doe', department: 'Operations', designation: 'Operations Manager', email: 'manager@amdox.com', personalEmail: 'john.doe@gmail.com', phone: '+91 98765 43211', salary: 120000, status: 'Active', joiningDate: '2025-02-10', avatarUrl: '', bankName: 'ICICI Bank', bankAccount: '000401509822', bankIfsc: 'ICIC0000004' },
        { emp_id: 'EMP-03', name: 'Alex Rivera', department: 'IT', designation: 'Senior Software Engineer', email: 'employee@amdox.com', personalEmail: 'alex.rivera@gmail.com', phone: '+91 98765 43212', salary: 85000, status: 'Active', joiningDate: '2025-03-01', avatarUrl: '', bankName: 'State Bank of India', bankAccount: '30456128911', bankIfsc: 'SBIN0000301' },
        { emp_id: 'EMP-04', name: 'Jane Smith', department: 'IT', designation: 'Developer', email: 'jane.smith@amdox.com', personalEmail: 'jane.s@gmail.com', phone: '+91 98765 43213', salary: 75000, status: 'Active', joiningDate: '2025-04-12', avatarUrl: '', bankName: 'HDFC Bank', bankAccount: '50100432891256', bankIfsc: 'HDFC0000104' },
        { emp_id: 'EMP-05', name: 'Robert Johnson', department: 'Finance', designation: 'Accountant', email: 'robert.j@amdox.com', personalEmail: 'robert.j@gmail.com', phone: '+91 98765 43214', salary: 70000, status: 'Active', joiningDate: '2025-05-20', avatarUrl: '', bankName: 'Axis Bank', bankAccount: '912010034567891', bankIfsc: 'UTIB0000004' }
      ];

      const mergedEmployees = seedEmployees.map(se => {
        const matched = existingEmployees.find(ee => ee.email.toLowerCase() === se.email.toLowerCase() || ee.emp_id === se.emp_id);
        if (matched) {
          return {
            ...se,
            ...matched
          };
        }
        return se;
      });

      existingEmployees.forEach(ee => {
        if (!mergedEmployees.some(me => me.email.toLowerCase() === ee.email.toLowerCase() || me.emp_id === ee.emp_id)) {
          mergedEmployees.push(ee);
        }
      });

      localStorage.setItem(getStorageKey(KEYS.EMPLOYEES), JSON.stringify(mergedEmployees));

      // 3. Seed Attendance
      const seedAttendance: Attendance[] = [
        // Yesterday
        { attendance_id: 'ATT-1', emp_id: 'EMP-01', date: yesterdayStr, status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM' },
        { attendance_id: 'ATT-2', emp_id: 'EMP-02', date: yesterdayStr, status: 'Present', checkIn: '08:55 AM', checkOut: '06:00 PM' },
        { attendance_id: 'ATT-3', emp_id: 'EMP-03', date: yesterdayStr, status: 'Present', checkIn: '09:15 AM', checkOut: '06:00 PM' },
        { attendance_id: 'ATT-4', emp_id: 'EMP-04', date: yesterdayStr, status: 'Present', checkIn: '09:02 AM', checkOut: '06:00 PM' },
        { attendance_id: 'ATT-5', emp_id: 'EMP-05', date: yesterdayStr, status: 'Present', checkIn: '08:48 AM', checkOut: '06:00 PM' },
        // Today
        { attendance_id: 'ATT-6', emp_id: 'EMP-01', date: todayStr, status: 'Present', checkIn: '08:58 AM' },
        { attendance_id: 'ATT-7', emp_id: 'EMP-02', date: todayStr, status: 'Late', checkIn: '09:40 AM' },
        { attendance_id: 'ATT-8', emp_id: 'EMP-03', date: todayStr, status: 'Present', checkIn: '09:05 AM' },
        { attendance_id: 'ATT-9', emp_id: 'EMP-04', date: todayStr, status: 'Leave' }
      ];
      localStorage.setItem(getStorageKey(KEYS.ATTENDANCE), JSON.stringify(seedAttendance));

      // 4. Seed Leave Requests
      const seedLeaves: LeaveRequest[] = [
        { leave_id: 'LV-1', emp_id: 'EMP-04', employeeName: 'Jane Smith', leaveType: 'Casual', fromDate: todayStr, toDate: todayStr, days: 1, reason: 'Family event', status: 'Pending' },
        { leave_id: 'LV-2', emp_id: 'EMP-03', employeeName: 'Alex Rivera', leaveType: 'Sick', fromDate: yesterdayStr, toDate: yesterdayStr, days: 1, reason: 'Fever and recovery', status: 'Approved' }
      ];
      localStorage.setItem(getStorageKey(KEYS.LEAVES), JSON.stringify(seedLeaves));

      // 5. Seed Products
      const seedProducts: Product[] = [
        { product_id: 'PRD-01', product_name: 'MacBook Pro 16"', category: 'Electronics', quantity: 12, reorder_level: 5, price: 145000, status: 'In Stock' },
        { product_id: 'PRD-02', product_name: 'Dell UltraSharp 27"', category: 'Electronics', quantity: 3, reorder_level: 8, price: 32000, status: 'Low Stock' },
        { product_id: 'PRD-03', product_name: 'Logitech MX Master 3S', category: 'Accessories', quantity: 25, reorder_level: 10, price: 9500, status: 'In Stock' },
        { product_id: 'PRD-04', product_name: 'Ergonomic Office Chair', category: 'Furniture', quantity: 1, reorder_level: 3, price: 18000, status: 'Low Stock' }
      ];
      localStorage.setItem(getStorageKey(KEYS.PRODUCTS), JSON.stringify(seedProducts));

      // 6. Seed Vendors
      const seedVendors: Vendor[] = [
        { vendor_id: 'VND-01', vendor_name: 'Apex Tech Distributors', contact_info: 'Mr. Ramesh Kumar', email: 'sales@apextech.com', phone: '+91 80 4112 5555', rating: 4.5 },
        { vendor_id: 'VND-02', vendor_name: 'Comfort Seating Solutions', contact_info: 'Ms. Priya Sharma', email: 'info@comfortseating.com', phone: '+91 22 2555 1234', rating: 4.2 }
      ];
      localStorage.setItem(getStorageKey(KEYS.VENDORS), JSON.stringify(seedVendors));

      // 7. Seed Purchase Orders
      const seedPOs: PurchaseOrder[] = [
        { po_id: 'PO-01', vendor_id: 'VND-01', vendor_name: 'Apex Tech Distributors', product_id: 'PRD-02', product_name: 'Dell UltraSharp 27"', quantity: 24, total_amount: 614400, date: yesterdayStr, status: 'Draft' },
        { po_id: 'PO-02', vendor_id: 'VND-02', vendor_name: 'Comfort Seating Solutions', product_id: 'PRD-04', product_name: 'Ergonomic Office Chair', quantity: 9, total_amount: 129600, date: yesterdayStr, status: 'Pending Approval' }
      ];
      localStorage.setItem(getStorageKey(KEYS.POS), JSON.stringify(seedPOs));

      // 8. Seed Projects
      const seedProjects: Project[] = [
        { project_id: 'PRJ-01', project_name: 'Enterprise Cloud Migration', manager_id: 'EMP-02', managerName: 'John Doe', budget: 1500000, deadline: '2026-09-30', progress: 45, status: 'In Progress' },
        { project_id: 'PRJ-02', project_name: 'SAP Integration Sprint', manager_id: 'EMP-02', managerName: 'John Doe', budget: 800000, deadline: '2026-08-15', progress: 10, status: 'In Progress' },
        { project_id: 'PRJ-03', project_name: 'HR Portal Redesign', manager_id: 'EMP-02', managerName: 'John Doe', budget: 350000, deadline: '2026-05-31', progress: 100, status: 'Completed' },
        { project_id: 'PRJ-04', project_name: 'AI Demand Forecasting', manager_id: 'EMP-02', managerName: 'John Doe', budget: 1200000, deadline: '2026-07-20', progress: 65, status: 'Delayed' }
      ];
      localStorage.setItem(getStorageKey(KEYS.PROJECTS), JSON.stringify(seedProjects));

      // 9. Seed Tasks
      const seedTasks: Task[] = [
        { task_id: 'TSK-01', project_id: 'PRJ-01', assigned_to: 'EMP-03', assignedName: 'Alex Rivera', task_name: 'Database Schema Setup', priority: 'High', status: 'Completed', dueDate: yesterdayStr },
        { task_id: 'TSK-02', project_id: 'PRJ-01', assigned_to: 'EMP-04', assignedName: 'Jane Smith', task_name: 'API Security Auditing', priority: 'High', status: 'In Progress', dueDate: todayStr },
        { task_id: 'TSK-03', project_id: 'PRJ-02', assigned_to: 'EMP-03', assignedName: 'Alex Rivera', task_name: 'Configure Webhooks', priority: 'Medium', status: 'Pending', dueDate: todayStr },
        { task_id: 'TSK-04', project_id: 'PRJ-04', assigned_to: 'EMP-04', assignedName: 'Jane Smith', task_name: 'Train Forecasting Model', priority: 'High', status: 'In Progress', dueDate: yesterdayStr }
      ];
      localStorage.setItem(getStorageKey(KEYS.TASKS), JSON.stringify(seedTasks));

      // 10. Seed Transactions
      const seedTransactions: Transaction[] = [
        { transaction_id: 'TXN-01', type: 'Revenue', category: 'Sales', amount: 850000, date: yesterdayStr, description: 'Enterprise licensing renewal' },
        { transaction_id: 'TXN-02', type: 'Revenue', category: 'Sales', amount: 450000, date: todayStr, description: 'Consultancy milestone payout' },
        { transaction_id: 'TXN-03', type: 'Expense', category: 'Utilities', amount: 15000, date: yesterdayStr, description: 'Office Internet Lease line' },
        { transaction_id: 'TXN-04', type: 'Expense', category: 'Purchase Order', amount: 129600, date: yesterdayStr, description: 'Fulfillment of PO PO-02 for Ergonomic Office Chair' },
        { transaction_id: 'TXN-05', type: 'Expense', category: 'Salary', amount: 85000, date: yesterdayStr, description: 'Alex Rivera June Salary Payout' },
        { transaction_id: 'TXN-06', type: 'Expense', category: 'Operations', amount: 65000, date: yesterdayStr, description: 'AWS cloud hosting fee' }
      ];
      localStorage.setItem(getStorageKey(KEYS.TRANSACTIONS), JSON.stringify(seedTransactions));

      // 11. Seed Activities
      const seedActivities: ActivityLog[] = [
        { id: 'ACT-1', description: 'System database seeded with realistic enterprise data', timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), category: 'System' },
        { id: 'ACT-2', description: 'Alex Rivera marked attendance as Present', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), category: 'HR' },
        { id: 'ACT-3', description: 'Created Draft Purchase Order PO-01 for Dell UltraSharp 27"', timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), category: 'Inventory' }
      ];
      localStorage.setItem(getStorageKey(KEYS.ACTIVITIES), JSON.stringify(seedActivities));

      // 12. Seed Notifications
      const seedNotifications: ERPNotification[] = [
        { id: 'NTF-1', message: 'Low Stock Alert: Dell UltraSharp 27" is below threshold (3 left)', type: 'warning', read: false, timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), targetRoles: ['Admin', 'Manager'] },
        { id: 'NTF-2', message: 'New task assigned to you: "API Security Auditing"', type: 'info', read: false, timestamp: new Date(Date.now() - 1800 * 1000).toISOString(), targetRoles: ['Employee'], targetEmail: 'jane.smith@amdox.com' }
      ];
      localStorage.setItem(getStorageKey(KEYS.NOTIFICATIONS), JSON.stringify(seedNotifications));

      localStorage.setItem('erp_seeded_version_v5', 'true');
      localStorage.setItem('erp_seeded', 'true');
    }

    if (!localStorage.getItem('company_bank_name')) {
      localStorage.setItem('company_bank_name', 'State Bank of India');
    }
    if (!localStorage.getItem('company_bank_account')) {
      localStorage.setItem('company_bank_account', '33045612890');
    }
    if (!localStorage.getItem('company_bank_ifsc')) {
      localStorage.setItem('company_bank_ifsc', 'SBIN0000301');
    }
    if (!localStorage.getItem('company_bank_balance')) {
      localStorage.setItem('company_bank_balance', '500000');
    }

    checkAndInitEmpty(KEYS.GLOBAL_USERS);
    checkAndInitEmpty(KEYS.EMPLOYEES);

    // Self-healing check for duplicate employee IDs (e.g. from deleted items length shifts)
    const employeesList = mockDb.getEmployees();
    if (employeesList.length > 0) {
      const activeIds = new Set<string>();
      let modified = false;
      const updatedList = employeesList.map(emp => {
        if (!emp.emp_id || activeIds.has(emp.emp_id)) {
          let num = 1;
          let newId = '';
          while (true) {
            const candidateId = `EMP-${num < 10 ? '0' : ''}${num}`;
            if (!activeIds.has(candidateId) && !employeesList.some(e => e !== emp && e.emp_id === candidateId)) {
              newId = candidateId;
              break;
            }
            num++;
          }
          activeIds.add(newId);
          modified = true;
          return { ...emp, emp_id: newId };
        } else {
          activeIds.add(emp.emp_id);
          return emp;
        }
      });
      if (modified) {
        mockDb.set(KEYS.EMPLOYEES, updatedList);
      }
    }

    checkAndInitEmpty(KEYS.ATTENDANCE);
    checkAndInitEmpty(KEYS.LEAVES);
    checkAndInitEmpty(KEYS.PRODUCTS);
    checkAndInitEmpty(KEYS.VENDORS);
    checkAndInitEmpty(KEYS.POS);
    checkAndInitEmpty(KEYS.PROJECTS);
    checkAndInitEmpty(KEYS.TASKS);
    checkAndInitEmpty(KEYS.TRANSACTIONS);
    checkAndInitEmpty(KEYS.ACTIVITIES);
    checkAndInitEmpty(KEYS.NOTIFICATIONS);
    
    mockDb.recalculateCompanyBankBalance();
  },

  // Generic Get & Set
  get: <T>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    const fullKey = getStorageKey(key);
    const data = localStorage.getItem(fullKey);
    return data ? JSON.parse(data) : [];
  },

  set: <T>(key: string, data: T[]): void => {
    if (typeof window === 'undefined') return;
    const fullKey = getStorageKey(key);
    localStorage.setItem(fullKey, JSON.stringify(data));
  },

  // GLOBAL USERS REGISTRY
  getGlobalUsers: (): User[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.GLOBAL_USERS);
    return data ? JSON.parse(data) : [];
  },

  registerGlobalUser: (user: User): void => {
    if (typeof window === 'undefined') return;
    const users = mockDb.getGlobalUsers();
    // Prevent duplicate emails
    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) return;
    users.push(user);
    localStorage.setItem(KEYS.GLOBAL_USERS, JSON.stringify(users));
  },

  // EMPLOYEES
  getEmployees: (): Employee[] => mockDb.get<Employee>(KEYS.EMPLOYEES),
  addEmployee: (emp: Omit<Employee, 'emp_id'>): Employee => {
    const list = mockDb.getEmployees();
    
    // Find the next available unique ID (filling any gaps from deleted employees)
    const activeIds = new Set(list.map(e => e.emp_id));
    let num = 1;
    let newId = '';
    while (true) {
      const candidateId = `EMP-${num < 10 ? '0' : ''}${num}`;
      if (!activeIds.has(candidateId)) {
        newId = candidateId;
        break;
      }
      num++;
    }

    const newEmp: Employee = { ...emp, emp_id: newId };
    list.unshift(newEmp);
    mockDb.set(KEYS.EMPLOYEES, list);
    mockDb.logActivity(`Employee ${emp.name} added to ${emp.department} department`, 'HR');
    return newEmp;
  },
  updateEmployee: (updated: Employee, oldEmail: string, role: UserRole): void => {
    const list = mockDb.getEmployees();
    const index = list.findIndex(e => e.emp_id === updated.emp_id);
    if (index !== -1) {
      list[index] = updated;
      mockDb.set(KEYS.EMPLOYEES, list);

      // Update global user credentials
      if (typeof window !== 'undefined') {
        const storedUsers = localStorage.getItem('erp_global_users');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const uIndex = users.findIndex((u: any) => u.email.toLowerCase() === oldEmail.toLowerCase());
          if (uIndex !== -1) {
            users[uIndex].name = updated.name;
            users[uIndex].email = updated.email;
            users[uIndex].role = role;
            localStorage.setItem('erp_global_users', JSON.stringify(users));
          }
        }
      }
      mockDb.logActivity(`Employee details updated for ${updated.name} (Role: ${role})`, 'HR');
    }
  },
  deleteEmployee: (id: string): void => {
    const list = mockDb.getEmployees();
    const employeeToDelete = list.find(e => e.emp_id === id);
    const filtered = list.filter(e => e.emp_id !== id);
    mockDb.set(KEYS.EMPLOYEES, filtered);

    if (employeeToDelete && typeof window !== 'undefined') {
      const storedUsers = localStorage.getItem(KEYS.GLOBAL_USERS);
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const filteredUsers = users.filter((u: any) => u.email.toLowerCase() !== employeeToDelete.email.toLowerCase());
        localStorage.setItem(KEYS.GLOBAL_USERS, JSON.stringify(filteredUsers));
      }
      mockDb.logActivity(`Global login account and employee record for ${employeeToDelete.name} (${employeeToDelete.email}) deleted`, 'HR');
    }
  },

  // ATTENDANCE
  getAttendance: (): Attendance[] => mockDb.get<Attendance>(KEYS.ATTENDANCE),
  markAttendance: (attendance: Omit<Attendance, 'attendance_id'>): Attendance => {
    const list = mockDb.getAttendance();
    const newId = `ATT-${list.length + 1}`;
    const newAtt = { ...attendance, attendance_id: newId };
    list.push(newAtt);
    mockDb.set(KEYS.ATTENDANCE, list);
    
    const emp = mockDb.getEmployees().find(e => e.emp_id === attendance.emp_id);
    mockDb.logActivity(`${emp?.name || 'Employee'} marked attendance as ${attendance.status}`, 'HR');
    mockDb.addNotification(`${emp?.name || 'Employee'} marked attendance as ${attendance.status}`, attendance.status === 'Late' ? 'warning' : 'success', ['Admin', 'Manager']);
    return newAtt;
  },

  // LEAVE REQUESTS
  getLeaves: (): LeaveRequest[] => mockDb.get<LeaveRequest>(KEYS.LEAVES),
  applyLeave: (leave: Omit<LeaveRequest, 'leave_id' | 'status'>): LeaveRequest => {
    const list = mockDb.getLeaves();
    const newId = `LV-${list.length + 1}`;
    const newLeave: LeaveRequest = { ...leave, leave_id: newId, status: 'Pending' };
    list.unshift(newLeave);
    mockDb.set(KEYS.LEAVES, list);
    
    mockDb.logActivity(`Leave request applied by ${leave.employeeName} for ${leave.days} days`, 'HR');
    mockDb.addNotification(`Leave request from ${leave.employeeName} is pending approval`, 'info', ['Admin', 'Manager']);
    return newLeave;
  },
  updateLeaveStatus: (id: string, status: 'Approved' | 'Rejected'): void => {
    const list = mockDb.getLeaves();
    const index = list.findIndex(l => l.leave_id === id);
    if (index !== -1) {
      list[index].status = status;
      mockDb.set(KEYS.LEAVES, list);
      
      const leave = list[index];
      mockDb.logActivity(`Leave request for ${leave.employeeName} was ${status.toLowerCase()}`, 'HR');
      
      const employee = mockDb.getEmployees().find(e => e.emp_id === leave.emp_id);
      if (employee) {
        mockDb.addNotification(`Your leave request from ${leave.fromDate} to ${leave.toDate} has been ${status}`, status === 'Approved' ? 'success' : 'alert', ['Employee'], employee.email);
      }

      // If approved and leave covers today, mark attendance as Leave or Half Day
      if (status === 'Approved') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (todayStr >= leave.fromDate && todayStr <= leave.toDate) {
          const attList = mockDb.getAttendance();
          const attIndex = attList.findIndex(a => a.emp_id === leave.emp_id && a.date === todayStr);
          const leaveStatus = leave.leaveType === 'Half Day' ? 'Half Day' : 'Leave';
          if (attIndex === -1) {
            mockDb.markAttendance({
              emp_id: leave.emp_id,
              date: todayStr,
              status: leaveStatus
            });
          } else {
            attList[attIndex].status = leaveStatus;
            mockDb.set(KEYS.ATTENDANCE, attList);
          }
        }
      }
    }
  },

  // PRODUCTS (INVENTORY)
  getProducts: (): Product[] => mockDb.get<Product>(KEYS.PRODUCTS),
  addProduct: (prd: Omit<Product, 'product_id' | 'status'>): Product => {
    const list = mockDb.getProducts();
    const newId = `PRD-0${list.length + 1}`.replace('PRD-00', 'PRD-0');
    const status: Product['status'] = prd.quantity === 0 ? 'Out of Stock' : prd.quantity <= prd.reorder_level ? 'Low Stock' : 'In Stock';
    const newPrd = { ...prd, product_id: newId, status };
    list.push(newPrd);
    mockDb.set(KEYS.PRODUCTS, list);
    mockDb.logActivity(`New product ${prd.product_name} added to inventory`, 'Inventory');
    return newPrd;
  },
  updateProductStock: (id: string, quantity: number): void => {
    const list = mockDb.getProducts();
    const index = list.findIndex(p => p.product_id === id);
    if (index !== -1) {
      const product = list[index];
      product.quantity = quantity;
      product.status = quantity === 0 ? 'Out of Stock' : quantity <= product.reorder_level ? 'Low Stock' : 'In Stock';
      mockDb.set(KEYS.PRODUCTS, list);
      
      mockDb.logActivity(`Stock quantity updated for ${product.product_name} (New quantity: ${quantity})`, 'Inventory');

      // Reorder logic check
      if (product.status === 'Low Stock' || product.status === 'Out of Stock') {
        mockDb.addNotification(`Low Stock Alert: ${product.product_name} is below threshold (${quantity} left)`, 'warning', ['Admin', 'HR']);
        
        // Auto-create Draft Purchase Order if not already drafted
        const poList = mockDb.getPurchaseOrders();
        const hasDraft = poList.some(po => po.product_id === id && po.status === 'Draft');
        if (!hasDraft) {
          const vendors = mockDb.getVendors();
          // Find vendor or fallback
          const vendor = vendors[0];
          if (vendor) {
            mockDb.createPurchaseOrder({
              vendor_id: vendor.vendor_id,
              vendor_name: vendor.vendor_name,
              product_id: product.product_id,
              product_name: product.product_name,
              quantity: product.reorder_level * 3,
              total_amount: (product.reorder_level * 3) * product.price * 0.8,
              date: new Date().toISOString().split('T')[0],
            });
          }
        }
      }
    }
  },

  // VENDORS
  getVendors: (): Vendor[] => mockDb.get<Vendor>(KEYS.VENDORS),
  addVendor: (vendor: Omit<Vendor, 'vendor_id'>): Vendor => {
    const list = mockDb.getVendors();
    const newId = `VND-0${list.length + 1}`.replace('VND-00', 'VND-0');
    const newVendor = { ...vendor, vendor_id: newId };
    list.push(newVendor);
    mockDb.set(KEYS.VENDORS, list);
    mockDb.logActivity(`Vendor '${vendor.vendor_name}' added to supplier index`, 'Inventory');
    return newVendor;
  },

  // PURCHASE ORDERS
  getPurchaseOrders: (): PurchaseOrder[] => mockDb.get<PurchaseOrder>(KEYS.POS),
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'po_id' | 'status'>): PurchaseOrder => {
    const list = mockDb.getPurchaseOrders();
    const newId = `PO-0${list.length + 1}`.replace('PO-00', 'PO-0');
    const newPo: PurchaseOrder = { ...po, po_id: newId, status: 'Draft' };
    list.unshift(newPo);
    mockDb.set(KEYS.POS, list);
    mockDb.logActivity(`Draft Purchase Order ${newId} created for ${po.vendor_name}`, 'Inventory');
    mockDb.addNotification(`Draft Purchase Order ${newId} created for ${po.vendor_name}`, 'info', ['Admin', 'HR']);
    return newPo;
  },
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']): void => {
    const list = mockDb.getPurchaseOrders();
    const index = list.findIndex(p => p.po_id === id);
    if (index !== -1) {
      const po = list[index];
      po.status = status;
      mockDb.set(KEYS.POS, list);
      
      mockDb.logActivity(`Purchase Order ${id} status updated to ${status}`, 'Inventory');
      mockDb.addNotification(`Purchase Order ${id} status updated to ${status}`, 'success', ['Admin', 'HR']);

      // If approved -> creates expense
      if (status === 'Approved') {
        mockDb.addTransaction({
          type: 'Expense',
          category: 'Purchase Order',
          amount: po.total_amount,
          date: new Date().toISOString().split('T')[0],
          description: `Fulfillment of PO ${po.po_id} for ${po.product_name}`
        });
      }

      // If received -> increment stock
      if (status === 'Received') {
        const products = mockDb.getProducts();
        const pIndex = products.findIndex(p => p.product_id === po.product_id);
        if (pIndex !== -1) {
          const qty = products[pIndex].quantity + po.quantity;
          mockDb.updateProductStock(po.product_id, qty);
        }
      }
    }
  },

  // PROJECTS
  getProjects: (): Project[] => mockDb.get<Project>(KEYS.PROJECTS),
  createProject: (prj: Omit<Project, 'project_id' | 'progress' | 'status'>): Project => {
    const list = mockDb.getProjects();
    const newId = `PRJ-0${list.length + 1}`.replace('PRJ-00', 'PRJ-0');
    const newPrj: Project = { ...prj, project_id: newId, progress: 0, status: 'Planned' };
    list.unshift(newPrj);
    mockDb.set(KEYS.PROJECTS, list);
    mockDb.logActivity(`New project created: ${prj.project_name}`, 'Projects');
    return newPrj;
  },

  // TASKS
  getTasks: (): Task[] => mockDb.get<Task>(KEYS.TASKS),
  addTask: (tsk: Omit<Task, 'task_id' | 'status'>): Task => {
    const list = mockDb.getTasks();
    const newId = `TSK-0${list.length + 1}`.replace('TSK-00', 'TSK-0');
    const newTsk: Task = { ...tsk, task_id: newId, status: 'Pending' };
    list.unshift(newTsk);
    mockDb.set(KEYS.TASKS, list);
    
    mockDb.logActivity(`Task "${tsk.task_name}" assigned to ${tsk.assignedName}`, 'Projects');
    mockDb.recalculateProjectProgress(tsk.project_id);

    const empObj = mockDb.getEmployees().find(e => e.emp_id === tsk.assigned_to);
    if (empObj) {
      mockDb.addNotification(`New task assigned to you: "${tsk.task_name}"`, 'info', ['Employee'], empObj.email);
    }
    return newTsk;
  },
  toggleTask: (id: string, status: Task['status']): void => {
    const list = mockDb.getTasks();
    const index = list.findIndex(t => t.task_id === id);
    if (index !== -1) {
      list[index].status = status;
      mockDb.set(KEYS.TASKS, list);
      
      const task = list[index];
      mockDb.logActivity(`Task "${task.task_name}" is now marked as ${status}`, 'Projects');
      mockDb.recalculateProjectProgress(task.project_id);
    }
  },

  recalculateProjectProgress: (projectId: string) => {
    const tasks = mockDb.getTasks().filter(t => t.project_id === projectId);
    if (tasks.length === 0) return;
    
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const progress = Math.round((completed / tasks.length) * 100);
    
    const projects = mockDb.getProjects();
    const pIndex = projects.findIndex(p => p.project_id === projectId);
    if (pIndex !== -1) {
      projects[pIndex].progress = progress;
      if (progress === 100) {
        projects[pIndex].status = 'Completed';
      } else if (projects[pIndex].status === 'Completed' || projects[pIndex].status === 'Planned') {
        projects[pIndex].status = 'In Progress';
      }
      mockDb.set(KEYS.PROJECTS, projects);
    }
  },

  // TRANSACTIONS
  getTransactions: (): Transaction[] => mockDb.get<Transaction>(KEYS.TRANSACTIONS),

  recalculateCompanyBankBalance: (): void => {
    if (typeof window === 'undefined') return;
    const startingBalance = 500000; // Baseline starting balance
    const txns = mockDb.getTransactions();
    let balance = startingBalance;
    txns.forEach(t => {
      if (t.type === 'Revenue') {
        balance += t.amount;
      } else if (t.type === 'Expense') {
        balance -= t.amount;
      }
    });
    localStorage.setItem('company_bank_balance', balance.toString());
    window.dispatchEvent(new StorageEvent('storage', { key: 'company_bank_balance' }));
  },

  addTransaction: (txn: Omit<Transaction, 'transaction_id'>): Transaction => {
    const list = mockDb.getTransactions();
    const newId = `TXN-0${list.length + 1}`.replace('TXN-00', 'TXN-0');
    const newTxn = { ...txn, transaction_id: newId };
    list.unshift(newTxn);
    mockDb.set(KEYS.TRANSACTIONS, list);
    
    // Recalculate company bank balance in real time based on transactions list
    mockDb.recalculateCompanyBankBalance();

    mockDb.logActivity(`New ${txn.type.toLowerCase()} of ₹${txn.amount} logged under ${txn.category}`, 'Finance');
    return newTxn;
  },

  // ACTIVITIES
  getActivities: (): ActivityLog[] => mockDb.get<ActivityLog>(KEYS.ACTIVITIES),
  logActivity: (desc: string, category: ActivityLog['category']): void => {
    const list = mockDb.getActivities();
    const newId = `ACT-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newLog = { id: newId, description: desc, timestamp: new Date().toISOString(), category };
    list.unshift(newLog);
    if (list.length > 50) list.pop();
    mockDb.set(KEYS.ACTIVITIES, list);
  },

  // NOTIFICATIONS
  getNotifications: (): ERPNotification[] => mockDb.get<ERPNotification>(KEYS.NOTIFICATIONS),
  addNotification: (msg: string, type: ERPNotification['type'] = 'info', targetRoles?: UserRole[], targetEmail?: string): void => {
    const list = mockDb.getNotifications();
    const newId = `NTF-${Date.now()}`;
    const newNtf = { 
      id: newId, 
      message: msg, 
      type, 
      read: false, 
      timestamp: new Date().toISOString(),
      targetRoles,
      targetEmail
    };
    list.unshift(newNtf);
    mockDb.set(KEYS.NOTIFICATIONS, list);
  },
  readNotification: (id: string): void => {
    const list = mockDb.getNotifications();
    const index = list.findIndex(n => n.id === id);
    if (index !== -1) {
      list[index].read = true;
      mockDb.set(KEYS.NOTIFICATIONS, list);
    }
  },
  clearAllNotifications: (): void => {
    const list = mockDb.getNotifications().map(n => ({ ...n, read: true }));
    mockDb.set(KEYS.NOTIFICATIONS, list);
  },

  getEmployeeByEmail: (email: string): Employee | undefined => {
    const list = mockDb.getEmployees();
    return list.find(e => e.email.toLowerCase() === email.toLowerCase());
  },

  // AI INSIGHTS & DEMAND PREDICTION
  getAIInsights: () => {
    const products = mockDb.getProducts();
    const lowStockCount = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length;
    const projects = mockDb.getProjects();
    const delayedCount = projects.filter(p => p.status === 'Delayed').length;
    const leaves = mockDb.getLeaves().filter(l => l.status === 'Pending').length;

    const insights = [];

    if (lowStockCount > 0) {
      insights.push(`Inventory stock low for ${lowStockCount} items (reorder drafts automatically created)`);
    } else {
      insights.push(`Inventory levels are optimal across all tracked items.`);
    }

    if (delayedCount > 0) {
      const delayedNames = projects.filter(p => p.status === 'Delayed').map(p => p.project_name.split(' - ')[0]).join(', ');
      insights.push(`Project ${delayedNames} may miss deadline (current probability of delay: 78%)`);
    } else {
      insights.push(`All projects currently match target delivery sprint schedules.`);
    }

    if (leaves > 2) {
      insights.push(`Employee attrition risk: Leave rates elevated in operations department by 12%`);
    }

    return insights;
  },

  getDemandPredictions: () => {
    const products = mockDb.getProducts();
    return products.map(p => {
      const predictedDemandNextMonth = Math.round(p.quantity * 1.4 + 10);
      const expectedShortage = Math.max(0, predictedDemandNextMonth - p.quantity);
      return {
        product_id: p.product_id,
        product_name: p.product_name,
        current_stock: p.quantity,
        predicted_demand: predictedDemandNextMonth,
        expected_shortage: expectedShortage,
        risk_level: expectedShortage > 15 ? 'High' : expectedShortage > 0 ? 'Medium' : 'Low'
      };
    });
  }
};

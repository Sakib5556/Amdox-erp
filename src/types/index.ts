export type UserRole = 'Admin' | 'HR' | 'Manager' | 'Employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  password?: string;
  personalEmail?: string;
  aboutMe?: string;
}

export interface Employee {
  emp_id: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  personalEmail?: string;
  phone: string;
  salary: number;
  status: 'Active' | 'Inactive';
  joiningDate: string;
  avatarUrl?: string;
  aboutMe?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
}

export interface Attendance {
  attendance_id: string;
  emp_id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'Half Day';
  checkIn?: string;
  checkOut?: string;
}

export interface LeaveRequest {
  leave_id: string;
  emp_id: string;
  employeeName: string;
  leaveType: 'Casual' | 'Sick' | 'Annual' | 'Maternity' | 'Paternity' | 'Half Day';
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Product {
  product_id: string;
  product_name: string;
  category: string;
  quantity: number;
  reorder_level: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface Vendor {
  vendor_id: string;
  vendor_name: string;
  contact_info: string;
  email: string;
  phone: string;
  rating: number;
}

export interface PurchaseOrder {
  po_id: string;
  vendor_id: string;
  vendor_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  total_amount: number;
  date: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Shipped' | 'Received';
}

export interface Project {
  project_id: string;
  project_name: string;
  manager_id: string;
  managerName: string;
  budget: number;
  deadline: string;
  progress: number; // 0 to 100
  status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed';
}

export interface Task {
  task_id: string;
  project_id: string;
  assigned_to: string; // Employee ID
  assignedName: string;
  task_name: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
}

export interface Transaction {
  transaction_id: string;
  type: 'Revenue' | 'Expense';
  category: 'Salary' | 'Utilities' | 'Travel' | 'Operations' | 'Sales' | 'Purchase Order' | 'Other';
  amount: number;
  date: string;
  description: string;
}

export interface ActivityLog {
  id: string;
  description: string;
  timestamp: string;
  category: 'HR' | 'Finance' | 'Inventory' | 'Projects' | 'System';
}

export interface ERPNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  read: boolean;
  timestamp: string;
  targetRoles?: UserRole[];
  targetEmail?: string;
}

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthLayout from '../../components/layout/AuthLayout';
import AccessDenied from '../../components/layout/AccessDenied';
import PageHeader from '../../components/layout/PageHeader';
import { mockDb } from '../../services/mockDb';
import { useAuthStore } from '../../store/authStore';
import { Product, Vendor, PurchaseOrder } from '../../types';
import { 
  Box, Users, Receipt, Plus, Search, Filter, Edit2, 
  Trash2, AlertTriangle, ArrowRight, ShieldCheck, Check, Truck, ChevronRight
} from 'lucide-react';

function InventoryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const currentTab = searchParams.get('tab') || 'products';



  // DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  // Search & Category Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  // Modals / Editors
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddPOModal, setShowAddPOModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [editingStockProduct, setEditingStockProduct] = useState<Product | null>(null);
  const [editQty, setEditQty] = useState('');

  // Add Product Form fields
  const [pName, setPName] = useState('');
  const [pCat, setPCat] = useState('Electronics');
  const [pQty, setPQty] = useState('');
  const [pReorder, setPReorder] = useState('5');
  const [pPrice, setPPrice] = useState('');

  // Add PO Form fields
  const [poVendor, setPoVendor] = useState('');
  const [poProduct, setPoProduct] = useState('');
  const [poQty, setPoQty] = useState('');

  // Add Vendor Form fields
  const [vName, setVName] = useState('');
  const [vContact, setVContact] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vRating, setVRating] = useState('4.5');

  const loadData = () => {
    setProducts(mockDb.getProducts());
    setVendors(mockDb.getVendors());
    setPurchaseOrders(mockDb.getPurchaseOrders());
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

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'addProduct') {
      setTimeout(() => setShowAddProductModal(true), 0);
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  if (user?.role === 'Employee' || user?.role === 'HR') {
    return (
      <AuthLayout>
        <AccessDenied role={user?.role} allowedRoles={['Admin', 'Manager']} />
      </AuthLayout>
    );
  }

  const changeTab = (tabName: string) => {
    router.push(`/inventory?tab=${tabName}`);
  };

  // 1. Products Tab Functions
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pQty || !pPrice) return;

    mockDb.addProduct({
      product_name: pName,
      category: pCat,
      quantity: parseInt(pQty),
      reorder_level: parseInt(pReorder),
      price: parseFloat(pPrice),
    });

    setPName('');
    setPQty('');
    setPPrice('');
    setShowAddProductModal(false);
    loadData();
  };

  const handleUpdateStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockProduct || !editQty) return;

    mockDb.updateProductStock(editingStockProduct.product_id, parseInt(editQty));
    setEditingStockProduct(null);
    setEditQty('');
    loadData();
  };

  const getFilteredProducts = () => {
    return products.filter(p => {
      const matchSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.product_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = catFilter === 'All' || p.category === catFilter;
      return matchSearch && matchCat;
    });
  };

  // 2. Vendors Tab Functions
  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName || !vContact || !vEmail) return;

    mockDb.addVendor({
      vendor_name: vName,
      contact_info: vContact,
      email: vEmail,
      phone: vPhone || '+91 99999 88888',
      rating: parseFloat(vRating) || 4.0
    });

    setVName('');
    setVContact('');
    setVEmail('');
    setVPhone('');
    setShowAddVendorModal(false);
    loadData();
  };

  // 3. Purchase Orders Functions
  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poVendor || !poProduct || !poQty) return;

    const vendorObj = vendors.find(v => v.vendor_id === poVendor);
    const prodObj = products.find(p => p.product_id === poProduct);
    if (!vendorObj || !prodObj) return;

    const qty = parseInt(poQty);
    const total = qty * prodObj.price * 0.85;

    mockDb.createPurchaseOrder({
      vendor_id: poVendor,
      vendor_name: vendorObj.vendor_name,
      product_id: poProduct,
      product_name: prodObj.product_name,
      quantity: qty,
      total_amount: total,
      date: new Date().toISOString().split('T')[0],
    });

    setPoVendor('');
    setPoProduct('');
    setPoQty('');
    setShowAddPOModal(false);
    loadData();
  };

  const handlePOStatusCycle = (po: PurchaseOrder) => {
    let nextStatus: PurchaseOrder['status'] = 'Draft';
    if (po.status === 'Draft') nextStatus = 'Pending Approval';
    else if (po.status === 'Pending Approval') nextStatus = 'Approved';
    else if (po.status === 'Approved') nextStatus = 'Shipped';
    else if (po.status === 'Shipped') nextStatus = 'Received';

    mockDb.updatePurchaseOrderStatus(po.po_id, nextStatus);
    loadData();
  };

  return (
    <div className="space-y-6">
      
      {/* -------------------- 1. PRODUCTS TAB -------------------- */}
      {currentTab === 'products' && (
        <div className="space-y-6">
          
          {/* Controls */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute inset-y-0 left-0 pl-3 h-full w-4 text-slate-400 self-center pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border dark:border-slate-750 dark:bg-slate-850 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value)}
                  className="border dark:border-slate-750 dark:bg-slate-850 py-2 px-3 rounded-lg text-xs"
                >
                  <option value="All">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Stationery">Stationery</option>
                </select>
              </div>
            </div>
            
            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <button 
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto shadow-md"
              >
                <Plus className="h-4 w-4" /> Add Product
              </button>
            )}
          </div>

          {/* Low Stock Alert */}
          {products.some(p => p.status === 'Low Stock' || p.status === 'Out of Stock') && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-205 text-amber-700 dark:text-amber-400 p-4 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-550 animate-bounce shrink-0" />
                <span>Low stock items identified. Click issue Purchase Order to restock.</span>
              </div>
              <button onClick={() => changeTab('pos')} className="font-bold underline">Review POs</button>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                    <th className="p-4">Product ID</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Stock Qty</th>
                    <th className="p-4">Reorder Level</th>
                    <th className="p-4">Unit Price</th>
                    <th className="p-4">Status</th>
                    {(user?.role === 'Admin' || user?.role === 'Manager') && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No product inventory recorded. Click "Add Product" to log stock.
                      </td>
                    </tr>
                  ) : (
                    getFilteredProducts().map((prod) => (
                      <tr key={prod.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-850/40">
                        <td className="p-4 font-mono font-semibold text-slate-500">{prod.product_id}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{prod.product_name}</td>
                        <td className="p-4 text-slate-550">{prod.category}</td>
                        <td className="p-4 font-bold font-mono">{prod.quantity} units</td>
                        <td className="p-4 text-slate-400 font-mono">{prod.reorder_level} units</td>
                        <td className="p-4 font-mono">₹{prod.price.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.status === 'In Stock' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                            prod.status === 'Low Stock' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' :
                            'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                          }`}>
                            {prod.status}
                          </span>
                        </td>
                        {(user?.role === 'Admin' || user?.role === 'Manager') && (
                          <td className="p-4 text-right">
                            <button
                              onClick={() => { setEditingStockProduct(prod); setEditQty(String(prod.quantity)); }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-blue-600"
                              title="Update Stock Levels"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- 2. VENDORS TAB -------------------- */}
      {currentTab === 'vendors' && (
        <div className="space-y-6">
          
          {/* Controls */}
          <div className="flex justify-end">
            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <button 
                onClick={() => setShowAddVendorModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
              >
                <Plus className="h-4 w-4" /> Add Vendor
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                    <th className="p-4">Vendor ID</th>
                    <th className="p-4">Vendor Name</th>
                    <th className="p-4">Contact Person</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4 text-right">Supplier Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No vendor records registered. Click "+ Add Vendor" to insert supplier details.
                      </td>
                    </tr>
                  ) : (
                    vendors.map((v) => (
                      <tr key={v.vendor_id}>
                        <td className="p-4 font-mono font-semibold text-slate-500">{v.vendor_id}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{v.vendor_name}</td>
                        <td className="p-4">{v.contact_info}</td>
                        <td className="p-4 text-slate-500">{v.email}</td>
                        <td className="p-4 text-slate-500 font-mono">{v.phone}</td>
                        <td className="p-4 text-right">
                          <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{v.rating} / 5.0</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- 3. PURCHASE ORDERS TAB -------------------- */}
      {currentTab === 'pos' && (
        <div className="space-y-6">
          
          <div className="flex justify-end gap-2">
            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <button 
                onClick={() => setShowAddPOModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
              >
                <Plus className="h-4 w-4" /> Issue Purchase Order
              </button>
            )}
          </div>

          {/* PO List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800">
                    <th className="p-4">PO Code</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Product Ordered</th>
                    <th className="p-4">Qty</th>
                    <th className="p-4">Total Price</th>
                    <th className="p-4">Date Issued</th>
                    <th className="p-4">Status</th>
                    {(user?.role === 'Admin' || user?.role === 'Manager') && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No purchase orders issued. Add products and click "Issue Purchase Order" to restock.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po.po_id} className="hover:bg-slate-50 dark:hover:bg-slate-850/40">
                        <td className="p-4 font-mono font-semibold text-slate-500">{po.po_id}</td>
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">{po.vendor_name}</td>
                        <td className="p-4">{po.product_name}</td>
                        <td className="p-4 font-mono font-medium">{po.quantity} pcs</td>
                        <td className="p-4 font-bold font-mono">₹{po.total_amount.toLocaleString()}</td>
                        <td className="p-4 text-slate-400 font-mono text-[10px]">{po.date}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            po.status === 'Received' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' :
                            po.status === 'Approved' ? 'bg-blue-50 text-blue-650 dark:bg-blue-950/20' :
                            po.status === 'Shipped' ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/20' :
                            po.status === 'Pending Approval' ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-105 text-slate-550'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        {(user?.role === 'Admin' || user?.role === 'Manager') && (
                          <td className="p-4 text-right">
                            {po.status === 'Draft' && (
                              <button
                                onClick={() => handlePOStatusCycle(po)}
                                className="px-2.5 py-1 bg-amber-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 ml-auto"
                              >
                                Submit Approval <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                            {po.status === 'Pending Approval' && user.role === 'Admin' && (
                              <button
                                onClick={() => handlePOStatusCycle(po)}
                                className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-semibold flex items-center gap-1 ml-auto"
                              >
                                Approve & Pay <ShieldCheck className="h-3 w-3" />
                              </button>
                            )}
                            {po.status === 'Approved' && (
                              <button
                                onClick={() => handlePOStatusCycle(po)}
                                className="px-2.5 py-1 bg-sky-600 text-white rounded text-[10px] font-semibold flex items-center gap-1 ml-auto"
                              >
                                Mark Shipped <Truck className="h-3 w-3" />
                              </button>
                            )}
                            {po.status === 'Shipped' && (
                              <button
                                onClick={() => handlePOStatusCycle(po)}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold flex items-center gap-1 ml-auto"
                              >
                                Confirm Received <Check className="h-3 w-3" />
                              </button>
                            )}
                            {po.status === 'Received' && (
                              <span className="text-[10px] text-slate-400">Inventory Updated</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- DYNAMIC MODALS -------------------- */}

      {/* 1. Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddProduct} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-850 dark:text-white">Add Product to Stock</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Product Item Name</label>
                <input type="text" required value={pName} onChange={e => setPName(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="e.g. Ergonomic Office Chairs"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Category</label>
                  <select value={pCat} onChange={e => setPCat(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg">
                    <option value="Electronics">Electronics</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Stationery">Stationery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Unit Price (₹)</label>
                  <input type="number" required value={pPrice} onChange={e => setPPrice(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="15000"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Initial Quantity</label>
                  <input type="number" required value={pQty} onChange={e => setPQty(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="25"/>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Reorder Level Alert</label>
                  <input type="number" required value={pReorder} onChange={e => setPReorder(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="5"/>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button type="button" onClick={() => setShowAddProductModal(false)} className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Save Product</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Issue PO Modal */}
      {showAddPOModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleCreatePO} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-850 dark:text-white">Issue Purchase Order</h3>
            
            {vendors.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 rounded-xl space-y-2">
                <p>You cannot create Purchase Orders without vendors.</p>
                <button
                  type="button"
                  onClick={() => { setShowAddPOModal(false); setShowAddVendorModal(true); changeTab('vendors'); }}
                  className="text-xs font-bold text-blue-600 underline"
                >
                  Create a vendor first
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 rounded-xl space-y-2">
                <p>You must add products to your stock list before ordering.</p>
                <button
                  type="button"
                  onClick={() => { setShowAddPOModal(false); setShowAddProductModal(true); changeTab('products'); }}
                  className="text-xs font-bold text-blue-600 underline"
                >
                  Create a product first
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Choose Vendor Supplier</label>
                    <select required value={poVendor} onChange={e => setPoVendor(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg">
                      <option value="">-- Choose Vendor --</option>
                      {vendors.map(v => (
                        <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Choose Product Stock</label>
                    <select required value={poProduct} onChange={e => setPoProduct(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg">
                      <option value="">-- Choose Product --</option>
                      {products.map(p => (
                        <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Quantity (pcs)</label>
                    <input type="number" required value={poQty} onChange={e => setPoQty(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="50"/>
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
                  <button type="button" onClick={() => setShowAddPOModal(false)} className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Create PO Draft</button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* 3. Add Vendor Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddVendor} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-850 dark:text-white">Add New Supplier Vendor</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Vendor Company Name</label>
                <input type="text" required value={vName} onChange={e => setVName(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="e.g. Featherlite Furniture"/>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Contact Person</label>
                <input type="text" required value={vContact} onChange={e => setVContact(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="e.g. Priyesh Sen"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Email Address</label>
                  <input type="email" required value={vEmail} onChange={e => setVEmail(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="sales@featherlite.com"/>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Phone Number</label>
                  <input type="text" value={vPhone} onChange={e => setVPhone(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="+91 80 1234 5678"/>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Initial Performance Score (out of 5.0)</label>
                <input type="number" step="0.1" min="1" max="5" value={vRating} onChange={e => setVRating(e.target.value)} className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg" placeholder="4.5"/>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button type="button" onClick={() => setShowAddVendorModal(false)} className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Save Vendor</button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Adjust Stock Modal */}
      {editingStockProduct && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleUpdateStockSubmit} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-850 dark:text-white">Adjust Stock Level</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="block text-slate-500 mb-1">Product: <b>{editingStockProduct.product_name}</b></span>
                <span className="block text-slate-405">Current Qty: <b>{editingStockProduct.quantity} units</b></span>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">New Stock Level (units)</label>
                <input
                  type="number"
                  required
                  value={editQty}
                  onChange={e => setEditQty(e.target.value)}
                  className="w-full px-3 py-2.5 border dark:border-slate-750 dark:bg-slate-800 rounded-lg"
                  placeholder="25"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button type="button" onClick={() => setEditingStockProduct(null)} className="px-4 py-2 border dark:border-slate-700 rounded-lg text-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Update Stock</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default function InventoryPage() {
  return (
    <AuthLayout>
      <PageHeader
        title="Inventory & Supply Chain"
        description="Oversee raw product levels, manage purchase orders (POs), and maintain supplier relations."
      />
      <React.Suspense fallback={
        <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-xs text-slate-400">Loading Inventory dashboard...</p>
        </div>
      }>
        <InventoryPageContent />
      </React.Suspense>
    </AuthLayout>
  );
}

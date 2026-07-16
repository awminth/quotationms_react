import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import html2pdf from 'html2pdf.js';
import { 
  LayoutDashboard, 
  FileText, 
  Settings as SettingsIcon, 
  Users, 
  Package, 
  Plus, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  CreditCard, 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  MinusCircle, 
  Check, 
  Search,
  Building
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('isLoggedIn') === 'true');
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, create-quotation, view-quotation, modules, clients, settings
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) return;
    setLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      if (res.ok) {
        const data = await res.json();
        setIsLoggedIn(true);
        sessionStorage.setItem('isLoggedIn', 'true');
        setSuccessMsg(`Welcome back, ${data.username}!`);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Connection to auth server failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('isLoggedIn');
    setSuccessMsg('Logged out successfully.');
  };

  // Core Data States
  const [settings, setSettings] = useState(null);
  const [modules, setModules] = useState([]);
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  // Search Filter
  const [quoteSearch, setQuoteSearch] = useState('');

  // Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);

  // Form States
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'KBZPay',
    reference_no: '',
    notes: ''
  });

  const [clientForm, setClientForm] = useState({
    id: null,
    name: '',
    company_name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [moduleForm, setModuleForm] = useState({
    id: null, // null for new, number for edit
    name: '',
    description: '',
    price: '',
    features: ['']
  });

  // Quotation Creator Wizard States
  const [wizardStep, setWizardStep] = useState(1);
  const [quoteClientId, setQuoteClientId] = useState('');
  const [quoteSelectedModules, setQuoteSelectedModules] = useState([]); // Array of modules with overridden prices/features
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteServerFee, setQuoteServerFee] = useState('');
  const [quoteServerFeeDuration, setQuoteServerFeeDuration] = useState('12'); // default to 12 months

  // Auto-hide alert banners after 4 seconds
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Load Initial Data
  useEffect(() => {
    fetchSettings();
    fetchModules();
    fetchClients();
    fetchQuotations();
    fetchDashboardStats();
  }, []);

  // API Call Helpers
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch(`${API_BASE}/modules`);
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/clients`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchQuotations = async () => {
    try {
      const res = await fetch(`${API_BASE}/quotations`);
      if (res.ok) {
        const data = await res.json();
        setQuotations(data);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`);
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  const viewQuotationDetail = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/quotations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedQuotation(data);
        setCurrentView('view-quotation');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to load quotation details');
      }
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  const viewQuotationVoucher = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/quotations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedQuotation(data);
        setCurrentView('voucher-view');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to load voucher details');
      }
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  // Submit Handlers
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setSuccessMsg('Company settings updated successfully!');
      } else {
        setError('Failed to update company settings');
      }
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!clientForm.name) return;
    setLoading(true);
    try {
      let url = `${API_BASE}/clients`;
      let method = 'POST';
      if (clientForm.id) {
        url = `${API_BASE}/clients/${clientForm.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm)
      });

      if (res.ok) {
        const savedClient = await res.json();
        if (clientForm.id) {
          setClients(prev => prev.map(c => c.id === savedClient.id ? savedClient : c));
          setSuccessMsg('Client profile updated successfully!');
        } else {
          setClients(prev => [...prev, savedClient]);
          setSuccessMsg('Client added successfully!');
          if (currentView === 'create-quotation') {
            setQuoteClientId(savedClient.id);
          }
        }
        setClientForm({ id: null, name: '', company_name: '', phone: '', email: '', address: '' });
        setShowClientModal(false);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to save client');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to delete this client? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#0a0f1d',
      color: '#f8fafc',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: 'rgba(255,255,255,0.08)',
      customClass: {
        popup: 'glass-panel'
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire({
            title: 'Deleted!',
            text: 'Client has been deleted.',
            icon: 'success',
            background: '#0a0f1d',
            color: '#f8fafc',
            confirmButtonColor: '#8b5cf6'
          });
          fetchClients();
        } else {
          const errData = await res.json();
          Swal.fire({
            title: 'Error!',
            text: errData.error || 'Failed to delete client.',
            icon: 'error',
            background: '#0a0f1d',
            color: '#f8fafc',
            confirmButtonColor: '#8b5cf6'
          });
        }
      } catch (err) {
        Swal.fire({
          title: 'Error!',
          text: 'Connection failed.',
          icon: 'error',
          background: '#0a0f1d',
          color: '#f8fafc',
          confirmButtonColor: '#8b5cf6'
        });
      }
    }
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!moduleForm.name || !moduleForm.price) return;
    setLoading(true);
    const cleanFeatures = moduleForm.features.filter(f => f.trim() !== '');
    const body = {
      ...moduleForm,
      features: cleanFeatures,
      price: parseFloat(moduleForm.price)
    };

    try {
      let url = `${API_BASE}/modules`;
      let method = 'POST';
      if (moduleForm.id) {
        url = `${API_BASE}/modules/${moduleForm.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        fetchModules();
        setShowModuleModal(false);
        setModuleForm({ id: null, name: '', description: '', price: '', features: [''] });
        setSuccessMsg(moduleForm.id ? 'System module updated!' : 'System module created!');
      } else {
        setError('Failed to save module');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to delete this system module? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#0a0f1d',
      color: '#f8fafc',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: 'rgba(255,255,255,0.08)',
      customClass: {
        popup: 'glass-panel'
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/modules/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire({
            title: 'Deleted!',
            text: 'System module has been deleted.',
            icon: 'success',
            background: '#0a0f1d',
            color: '#f8fafc',
            confirmButtonColor: '#8b5cf6'
          });
          fetchModules();
        } else {
          Swal.fire({
            title: 'Error!',
            text: 'Failed to delete module.',
            icon: 'error',
            background: '#0a0f1d',
            color: '#f8fafc',
            confirmButtonColor: '#8b5cf6'
          });
        }
      } catch (err) {
        Swal.fire({
          title: 'Error!',
          text: 'Connection failed.',
          icon: 'error',
          background: '#0a0f1d',
          color: '#f8fafc',
          confirmButtonColor: '#8b5cf6'
        });
      }
    }
  };

  const handleDeleteQuotation = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to delete this quotation? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#0a0f1d',
      color: '#f8fafc',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: 'rgba(255,255,255,0.08)',
      customClass: {
        popup: 'glass-panel'
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/quotations/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire({
            title: 'Deleted!',
            text: 'Quotation has been deleted.',
            icon: 'success',
            background: '#0a0f1d',
            color: '#f8fafc',
            confirmButtonColor: '#8b5cf6'
          });
          fetchQuotations();
          fetchDashboardStats();
          if (currentView === 'view-quotation' || currentView === 'voucher-view') {
            setCurrentView('quotations-list');
          }
        } else {
          const errData = await res.json();
          Swal.fire({
            title: 'Error!',
            text: errData.error || 'Failed to delete quotation.',
            icon: 'error',
            background: '#0a0f1d',
            color: '#f8fafc',
            confirmButtonColor: '#8b5cf6'
          });
        }
      } catch (err) {
        Swal.fire({
          title: 'Error!',
          text: 'Connection failed.',
          icon: 'error',
          background: '#0a0f1d',
          color: '#f8fafc',
          confirmButtonColor: '#8b5cf6'
        });
      }
    }
  };

  // Quotation Wizard Module Toggle Logic
  const handleToggleModuleSelection = (module) => {
    const isSelected = quoteSelectedModules.find(m => m.originalId === module.id);
    if (isSelected) {
      setQuoteSelectedModules(prev => prev.filter(m => m.originalId !== module.id));
    } else {
      setQuoteSelectedModules(prev => [
        ...prev,
        {
          originalId: module.id,
          name: module.name,
          description: module.description,
          features: [...module.features],
          price: module.price
        }
      ]);
    }
  };

  const handleOverrideModulePrice = (origId, newPrice) => {
    setQuoteSelectedModules(prev => prev.map(m => {
      if (m.originalId === origId) {
        return { ...m, price: newPrice };
      }
      return m;
    }));
  };

  const handleAddFeatureOverride = (origId) => {
    setQuoteSelectedModules(prev => prev.map(m => {
      if (m.originalId === origId) {
        return { ...m, features: [...m.features, ''] };
      }
      return m;
    }));
  };

  const handleUpdateFeatureOverride = (origId, index, value) => {
    setQuoteSelectedModules(prev => prev.map(m => {
      if (m.originalId === origId) {
        const newFeatures = [...m.features];
        newFeatures[index] = value;
        return { ...m, features: newFeatures };
      }
      return m;
    }));
  };

  const handleRemoveFeatureOverride = (origId, index) => {
    setQuoteSelectedModules(prev => prev.map(m => {
      if (m.originalId === origId) {
        return { ...m, features: m.features.filter((_, idx) => idx !== index) };
      }
      return m;
    }));
  };

  // Save Quotation
  const handleGenerateQuotation = async () => {
    if (!quoteClientId) {
      setError('Please select a client first');
      return;
    }
    if (quoteSelectedModules.length === 0) {
      setError('Please select at least one module');
      return;
    }
    setLoading(true);
    try {
      const cleanModules = quoteSelectedModules.map(m => ({
        name: m.name,
        description: m.description,
        features: m.features.filter(f => f.trim() !== ''),
        price: parseFloat(m.price) || 0
      }));

      const res = await fetch(`${API_BASE}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: parseInt(quoteClientId),
          modules: cleanModules,
          server_fee: parseFloat(quoteServerFee) || 0,
          server_fee_duration: parseInt(quoteServerFeeDuration) || 1,
          notes: quoteNotes
        })
      });

      if (res.ok) {
        const quoteResult = await res.json();
        setSuccessMsg('Quotation successfully generated!');
        // Reset states
        setQuoteClientId('');
        setQuoteSelectedModules([]);
        setQuoteNotes('');
        setQuoteServerFee('');
        setQuoteServerFeeDuration('12');
        setWizardStep(1);
        
        // Refresh tables and view details
        fetchQuotations();
        fetchDashboardStats();
        viewQuotationDetail(quoteResult.id);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to generate quotation');
      }
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/quotations/${selectedQuotation.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          reference_no: paymentForm.reference_no,
          notes: paymentForm.notes
        })
      });

      if (res.ok) {
        setSuccessMsg('Payment successfully logged!');
        setShowPaymentModal(false);
        // Reset payment form
        setPaymentForm({
          amount: '',
          payment_date: new Date().toISOString().slice(0, 10),
          payment_method: 'KBZPay',
          reference_no: '',
          notes: ''
        });
        // Refresh quotation detail view
        viewQuotationDetail(selectedQuotation.id);
        fetchQuotations();
        fetchDashboardStats();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to record payment');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  // Download PDF using html2pdf.js bundle
  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-voucher');
    if (!element) return;
    
    setLoading(true);
    
    const opt = {
      margin:       [0.4, 0.4, 0.4, 0.4],
      filename:     `Quotation_${selectedQuotation.quote_number}_${selectedQuotation.client_name || 'Client'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2.5, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => setLoading(false))
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setError('PDF generation failed.');
      });
  };

  // Format money helper (e.g. 1,000,000 MMK)
  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('en-US') + ' MMK';
  };

  // Shared component method to render quotation sheet (A4 Voucher)
  const renderVoucherSheet = (quote) => {
    if (!quote) return null;
    return (
      <div className="invoice-sheet" id="printable-voucher">
        {/* Colored accent top bar */}
        <div style={{ height: '6px', background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', margin: '-3.5rem -3.5rem 2.5rem -3.5rem', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}></div>
        
        {/* 1. Logo and Company Header in a recognizable Banner Box with soft bg */}
        <div className="invoice-header-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              background: '#ffffff',
              padding: '6px',
              borderRadius: '16px',
              border: '2px solid rgba(139, 92, 246, 0.25)',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src="/logo.png" alt="Logo" style={{ width: '72px', height: '72px', borderRadius: '10px', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: '850', letterSpacing: '-0.5px', color: '#0f172a !important', margin: 0, lineHeight: 1.2 }}>
                {settings ? settings.company_name : 'ALPHA SOFTWARE'}
              </h1>
              {settings && (
                <div className="invoice-company-details" style={{ fontSize: '0.85rem', color: '#475569 !important', marginTop: '0.4rem', fontWeight: '500' }}>
                  <p style={{ margin: 0 }}>{settings.address}</p>
                  <p style={{ margin: 0 }}>Phone: {settings.phone} | Email: {settings.email}</p>
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8b5cf6 !important', backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: '0.4rem 1rem', borderRadius: '50px', display: 'inline-block', marginBottom: '0.5rem' }}>
              PROPOSAL DOCUMENT
            </span>
            <p style={{ fontSize: '0.875rem', color: '#64748b !important', margin: '0.2rem 0 0 0', fontWeight: '600' }}>
              Date: {new Date(quote.quote_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* 2. Client & Meta Info */}
        <div className="invoice-meta-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', gap: '2rem' }}>
          <div className="invoice-client-details" style={{ textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b !important', marginBottom: '0.5rem' }}>Prepared For:</h4>
            <p style={{ fontWeight: '700', fontSize: '1.15rem', color: '#0f172a !important' }}>{quote.client_name}</p>
            {quote.client_company && <p style={{ fontWeight: '600', color: '#334155 !important' }}>Company: {quote.client_company}</p>}
            {quote.client_phone && <p>Phone: {quote.client_phone}</p>}
            {quote.client_email && <p>Email: {quote.client_email}</p>}
            {quote.client_address && <p>Address: {quote.client_address}</p>}
          </div>
          
          <div style={{ textAlign: 'right', minWidth: '200px' }}>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b !important', marginBottom: '0.5rem' }}>Quotation Summary:</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.35rem' }}>
              <span>Total Amount:</span>
              <span style={{ fontWeight: '600', color: '#0f172a !important' }}>{formatMoney(quote.total_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.35rem' }}>
              <span>Paid to Date:</span>
              <span style={{ fontWeight: '600', color: '#10b981 !important' }}>{formatMoney(quote.paid_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
              <span style={{ fontWeight: '700' }}>Balance Due:</span>
              <span style={{ fontWeight: '700', color: Number(quote.balance) > 0 ? '#d97706 !important' : '#10b981 !important' }}>
                {formatMoney(quote.balance)}
              </span>
            </div>
          </div>
        </div>

        <div className="invoice-separator"></div>

        {/* 3. Selected Modules Table */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: '75%' }}>Product / Module Description</th>
              <th style={{ textAlign: 'right', width: '25%' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {quote.modules && quote.modules.map((m, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'left' }}>
                  <div className="invoice-item-name">{m.module_name}</div>
                  <div className="invoice-item-desc">{m.description}</div>
                  {m.features && m.features.length > 0 && (
                    <ul className="invoice-item-features" style={{ paddingLeft: '0.5rem', textAlign: 'left' }}>
                      {m.features.map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span className="invoice-feature-bullet" style={{ color: '#10b981 !important', fontWeight: 'bold' }}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.05rem', color: '#0f172a !important', verticalAlign: 'top' }}>
                  {formatMoney(m.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 4. Financial breakdown */}
        <div className="invoice-totals-wrapper" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
          <div className="invoice-totals" style={{ width: '320px' }}>
            <div className="invoice-total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: '500' }}>{formatMoney(quote.total_amount - ((quote.server_fee || 0) * (quote.server_fee_duration || 1)))}</span>
            </div>
            {quote.server_fee && Number(quote.server_fee) > 0 ? (
              <div className="invoice-total-row" style={{ display: 'flex', justifyContent: 'flex-start', padding: '0.5rem 0', gap: '1rem', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
                    Server Fee ({formatMoney(quote.server_fee)} x {quote.server_fee_duration || 1} mos):
                  </span>
                  <span style={{ fontWeight: '500' }}>
                    {formatMoney(quote.server_fee * (quote.server_fee_duration || 1))}
                  </span>
                </div>
              </div>
            ) : null}
            <div className="invoice-total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: '600', borderTop: '1px solid #cbd5e1' }}>
              <span>Total Amount:</span>
              <span>{formatMoney(quote.total_amount)}</span>
            </div>
            <div className="invoice-total-row paid" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#10b981 !important' }}>
              <span>Amount Paid:</span>
              <span>- {formatMoney(quote.paid_amount)}</span>
            </div>
            <div className="invoice-total-row grand-total balance" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '2px solid #cbd5e1', fontWeight: '700', fontSize: '1.2rem', color: '#ef4444 !important' }}>
              <span>Remaining Balance:</span>
              <span>{formatMoney(quote.balance)}</span>
            </div>
          </div>
        </div>

        {/* 5. Terms & Notes */}
        {quote.notes && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid #cbd5e1', paddingTop: '1.5rem', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b !important', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Terms & Notes</h4>
            <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-line', color: '#334155 !important' }}>{quote.notes}</p>
          </div>
        )}

        {/* 6. KBZPay Details Setup (From company settings) */}
        {settings && (settings.kpay_name || settings.kpay_phone) && (
          <div className="payment-instructions-card" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '1.5rem', backgroundColor: '#f8fafc', marginTop: '2.5rem', textAlign: 'left' }}>
            <h3 className="payment-instructions-title" style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#334155 !important', marginBottom: '0.85rem' }}>Payment Instructions</h3>
            <div className="payment-instructions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
              {settings.kpay_name && (
                <div className="payment-instruction-item">
                  <h5 style={{ fontWeight: '700', color: '#475569 !important', margin: 0, fontSize: '0.8rem' }}>KBZPay Account Name</h5>
                  <p style={{ color: '#0f172a !important', fontWeight: '600', margin: '0.2rem 0 0 0' }}>{settings.kpay_name}</p>
                </div>
              )}
              {settings.kpay_phone && (
                <div className="payment-instruction-item">
                  <h5 style={{ fontWeight: '700', color: '#475569 !important', margin: 0, fontSize: '0.8rem' }}>KBZPay Phone No.</h5>
                  <p style={{ color: '#0f172a !important', fontWeight: '600', margin: '0.2rem 0 0 0' }}>{settings.kpay_phone}</p>
                </div>
              )}
              {settings.phone && (
                <div className="payment-instruction-item" style={{ gridColumn: 'span 2', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b !important' }}>
                    * Please send a screenshotted payment slip to our contact phone: <strong>{settings.phone}</strong> after completing the transfer.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Payments History logs */}
        {quote.payments && quote.payments.length > 0 && (
          <div className="payment-history-section" style={{ marginTop: '3rem', borderTop: '1px dashed #cbd5e1', paddingTop: '2rem', textAlign: 'left' }}>
            <h3 className="payment-history-title" style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1.1rem', color: '#0f172a !important' }}>Payment History & Receipts</h3>
            <table className="payment-history-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.65rem 0.5rem', color: '#64748b !important', borderBottom: '1px solid #cbd5e1' }}>Payment Date</th>
                  <th style={{ textAlign: 'left', padding: '0.65rem 0.5rem', color: '#64748b !important', borderBottom: '1px solid #cbd5e1' }}>Method</th>
                  <th style={{ textAlign: 'left', padding: '0.65rem 0.5rem', color: '#64748b !important', borderBottom: '1px solid #cbd5e1' }}>Ref No.</th>
                  <th style={{ textAlign: 'left', padding: '0.65rem 0.5rem', color: '#64748b !important', borderBottom: '1px solid #cbd5e1' }}>Notes</th>
                  <th style={{ textAlign: 'right', padding: '0.65rem 0.5rem', color: '#64748b !important', borderBottom: '1px solid #cbd5e1' }}>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {quote.payments.map((p, index) => (
                  <tr key={index}>
                    <td style={{ padding: '0.85rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td style={{ padding: '0.85rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>{p.payment_method}</td>
                    <td style={{ padding: '0.85rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>{p.reference_no || '-'}</td>
                    <td style={{ padding: '0.85rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>{p.notes || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981 !important', padding: '0.85rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                      {formatMoney(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Search filter quotations
  const filteredQuotations = quotations.filter(q => {
    const qnum = q.quote_number.toLowerCase();
    const cname = q.client_name ? q.client_name.toLowerCase() : '';
    const ccomp = q.client_company ? q.client_company.toLowerCase() : '';
    const query = quoteSearch.toLowerCase();
    return qnum.includes(query) || cname.includes(query) || ccomp.includes(query);
  });

  return (
    <>
      {/* Decorative ambient background orbs */}
      <div className="glow-background">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>

      {/* Dynamic Alerts */}
      {successMsg && (
        <div className="no-print" style={{
          position: 'fixed', top: '20px', right: '20px', backgroundColor: 'var(--primary)',
          color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', zIndex: 2000,
          boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'modalSlideUp 0.3s'
        }}>
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="no-print" style={{
          position: 'fixed', top: '20px', right: '20px', backgroundColor: 'var(--danger)',
          color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', zIndex: 2000,
          boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'modalSlideUp 0.3s'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!isLoggedIn ? (
        <div className="login-container">
          <div className="login-card glass-panel">
            <div className="login-header">
              <img src="/logo.png" alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '16px', marginBottom: '1rem', objectFit: 'cover', boxShadow: '0 8px 20px rgba(139, 92, 246, 0.35)' }} />
              <h1 className="login-title">QuotePro</h1>
              <p className="login-subtitle">Quotation Management System</p>
            </div>
            
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  placeholder="admin" 
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control" 
                  required
                  placeholder="Password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  style={{
                    position: 'absolute', right: '10px', top: '35px', background: 'none', 
                    border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary login-btn"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="spinner" style={{
                      width: '14px', height: '14px', border: '2px solid white', 
                      borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block',
                      animation: 'spin 0.6s linear infinite'
                    }}></span>
                    Signing in...
                  </span>
                ) : "Sign In to Workspace"}
              </button>
            </form>

            <div style={{ marginTop: '2rem', padding: '1rem', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem' }}>
                Demo Credentials (Prefilled)
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: '500' }}>
                admin / admin123
              </p>
            </div>
          </div>
          
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <div className={`app-container ${currentView === 'voucher-view' ? 'fullscreen-voucher' : ''}`}>
          {/* Sidebar - HIDDEN during print or in fullscreen voucher view */}
          {currentView !== 'voucher-view' && (
            <aside className="sidebar no-print">
              <div className="logo-container">
                <img src="/logo.png" alt="Logo" style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)' }} />
                <span className="logo-text">QuotePro</span>
              </div>

              <ul className="nav-menu">
                <li className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
                  <LayoutDashboard className="nav-icon" /> Dashboard
                </li>
                <li className={`nav-item ${currentView === 'create-quotation' ? 'active' : ''}`} onClick={() => { setCurrentView('create-quotation'); setWizardStep(1); }}>
                  <PlusCircle className="nav-icon" /> Create Quotation
                </li>
                <li className={`nav-item ${currentView === 'quotations-list' ? 'active' : ''}`} onClick={() => setCurrentView('quotations-list')}>
                  <FileText className="nav-icon" /> Quotations List
                </li>
                <li className={`nav-item ${currentView === 'modules' ? 'active' : ''}`} onClick={() => setCurrentView('modules')}>
                  <Package className="nav-icon" /> System Modules
                </li>
                <li className={`nav-item ${currentView === 'clients' ? 'active' : ''}`} onClick={() => setCurrentView('clients')}>
                  <Users className="nav-icon" /> Clients
                </li>
                <li className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => setCurrentView('settings')}>
                  <SettingsIcon className="nav-icon" /> Company Setup
                </li>
              </ul>

              {settings && (
                <div className="company-badge">
                  <p className="company-badge-name">{settings.company_name}</p>
                  <div className="company-badge-role">
                    <span>System Workspace</span>
                    <span className="logout-link" onClick={handleLogout}>Logout</span>
                  </div>
                </div>
              )}
            </aside>
          )}

          {/* Main Content Area */}
          <main className={`main-content ${currentView === 'voucher-view' ? 'fullscreen' : ''}`}>
        
        {/* VIEW 1: DASHBOARD */}
        {currentView === 'dashboard' && (
          <div className="no-print">
            <div className="header-bar">
              <div>
                <h1 className="header-title">Sales Dashboard</h1>
                <p className="header-subtitle">Welcome back! Manage client software quotations and track receipts.</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setCurrentView('create-quotation'); setWizardStep(1); }}>
                <Plus size={16} /> New Quotation
              </button>
            </div>

            {/* Dashboard Stats */}
            {dashboardStats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Quotations</h3>
                    <p>{dashboardStats.summary.total_count}</p>
                  </div>
                  <div className="stat-icon-wrapper secondary">
                    <FileText size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Total Value</h3>
                    <p>{formatMoney(dashboardStats.summary.total_revenue)}</p>
                  </div>
                  <div className="stat-icon-wrapper primary">
                    <DollarSign size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Collected</h3>
                    <p>{formatMoney(dashboardStats.summary.total_collected)}</p>
                  </div>
                  <div className="stat-icon-wrapper accent">
                    <CheckCircle size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Outstanding</h3>
                    <p>{formatMoney(dashboardStats.summary.total_outstanding)}</p>
                  </div>
                  <div className="stat-icon-wrapper danger">
                    <Clock size={24} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: CREATE QUOTATION WIZARD */}
        {currentView === 'create-quotation' && (
          <div className="no-print">
            <div className="header-bar">
              <div>
                <h1 className="header-title">Create Quotation</h1>
                <p className="header-subtitle">Follow the wizard steps to build a customized client proposal.</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setCurrentView('dashboard')}>
                <ArrowLeft size={16} /> Back
              </button>
            </div>

            {/* Steps bar */}
            <div className="wizard-steps">
              <div className={`wizard-step ${wizardStep === 1 ? 'active' : wizardStep > 1 ? 'completed' : ''}`}>
                <div className="wizard-number">1</div>
                <span>Select Client</span>
              </div>
              <div className={`wizard-step ${wizardStep === 2 ? 'active' : wizardStep > 2 ? 'completed' : ''}`}>
                <div className="wizard-number">2</div>
                <span>Select Modules</span>
              </div>
              <div className={`wizard-step ${wizardStep === 3 ? 'active' : ''}`}>
                <div className="wizard-number">3</div>
                <span>Review & Save</span>
              </div>
            </div>

            {/* STEP 1: CLIENT SELECTION */}
            {wizardStep === 1 && (
              <div style={{ maxWidth: '600px', margin: '0 auto' }} className="creator-panel">
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Who is this quotation for?</h2>
                <div className="form-group">
                  <label className="form-label">Choose Existing Client</label>
                  <select 
                    className="form-control" 
                    value={quoteClientId} 
                    onChange={(e) => setQuoteClientId(e.target.value)}
                  >
                    <option value="">-- Select a Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company_name ? `(${c.company_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-muted)' }}>
                  — OR —
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => setShowClientModal(true)}>
                    <Plus size={16} /> Add New Client
                  </button>
                </div>

                <div className="form-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <button 
                    className="btn btn-primary" 
                    disabled={!quoteClientId}
                    onClick={() => setWizardStep(2)}
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: MODULES SELECTION */}
            {wizardStep === 2 && (
              <div className="creator-container">
                {/* Select Modules Grid */}
                <div className="creator-panel">
                  <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Select Software Systems / Modules</h2>
                  
                  <div className="module-cards-grid">
                    {modules.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', gridColumn: 'span 2' }}>
                        No modules available. Setup system modules first.
                      </p>
                    ) : (
                      modules.map(m => {
                        const isSelected = quoteSelectedModules.find(qm => qm.originalId === m.id);
                        return (
                          <div 
                            key={m.id} 
                            className={`module-select-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleToggleModuleSelection(m)}
                          >
                            <div className="module-card-header">
                              <h3 className="module-card-title">{m.name}</h3>
                              {isSelected ? (
                                <span style={{
                                  backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', 
                                  width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <Check size={14} />
                                </span>
                              ) : (
                                <span className="module-card-price">{formatMoney(m.price)}</span>
                              )}
                            </div>
                            <p className="module-card-desc">{m.description}</p>
                            
                            <ul className="module-card-features-list">
                              {m.features.slice(0, 4).map((f, i) => (
                                <li key={i}>
                                  <span className="feature-dot"></span>
                                  {f}
                                </li>
                              ))}
                              {m.features.length > 4 && (
                                <li style={{ fontStyle: 'italic' }}>+ {m.features.length - 4} more features</li>
                              )}
                            </ul>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Overridden Config & Sidebar Pricing Overview */}
                <div className="creator-summary-panel">
                  <h3 className="summary-title">Selected Modules ({quoteSelectedModules.length})</h3>
                  
                  {quoteSelectedModules.map(qm => (
                    <div key={qm.originalId} style={{ marginBottom: '1.5rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{qm.name}</span>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                          onClick={() => setQuoteSelectedModules(prev => prev.filter(m => m.originalId !== qm.originalId))}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Custom Price Overrider */}
                      <div className="form-group">
                        <label className="form-label">Customize Price (MMK)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={qm.price} 
                          onChange={(e) => handleOverrideModulePrice(qm.originalId, e.target.value)}
                        />
                      </div>

                      {/* Custom Features List Editor */}
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Included Features</span>
                          <button 
                            type="button" 
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}
                            onClick={() => handleAddFeatureOverride(qm.originalId)}
                          >
                            <PlusCircle size={12} /> Add Custom
                          </button>
                        </label>
                        <div className="features-edit-list">
                          {qm.features.map((feat, idx) => (
                            <div key={idx} className="feature-edit-item">
                              <input 
                                type="text" 
                                className="form-control" 
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                                value={feat}
                                onChange={(e) => handleUpdateFeatureOverride(qm.originalId, idx, e.target.value)}
                              />
                              <button 
                                type="button" 
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                onClick={() => handleRemoveFeatureOverride(qm.originalId, idx)}
                              >
                                <MinusCircle size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Server Fee Input */}
                  <div className="form-group" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border-color)' }}>
                    <div className="server-fee-grid">
                      <div className="server-fee-field">
                        <label className="form-label">Server Fee / Month (MMK)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="E.g. 15000"
                          value={quoteServerFee} 
                          onChange={(e) => setQuoteServerFee(e.target.value)}
                        />
                      </div>
                      <div className="server-fee-field">
                        <label className="form-label">Duration (Months)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          min="1"
                          placeholder="Months"
                          value={quoteServerFeeDuration} 
                          onChange={(e) => setQuoteServerFeeDuration(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="summary-item total">
                    <span>Grand Total:</span>
                    <span>
                      {formatMoney(
                        quoteSelectedModules.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0) + 
                        ((parseFloat(quoteServerFee) || 0) * (parseInt(quoteServerFeeDuration) || 1))
                      )}
                    </span>
                  </div>

                  <div className="form-actions">
                    <button className="btn btn-secondary" onClick={() => setWizardStep(1)}>Back</button>
                    <button 
                      className="btn btn-primary" 
                      disabled={quoteSelectedModules.length === 0}
                      onClick={() => setWizardStep(3)}
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & SAVE */}
            {wizardStep === 3 && (
              <div style={{ maxWidth: '700px', margin: '0 auto' }} className="creator-panel">
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Review Details & Notes</h2>
                
                {/* Client brief */}
                {(() => {
                  const client = clients.find(c => c.id === parseInt(quoteClientId));
                  return client ? (
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                      <h4 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>Client Details</h4>
                      <p style={{ fontWeight: '600' }}>{client.name}</p>
                      {client.company_name && <p style={{ fontSize: '0.85rem' }}>Company: {client.company_name}</p>}
                      <p style={{ fontSize: '0.85rem' }}>Phone: {client.phone}</p>
                    </div>
                  ) : null;
                })()}

                {/* Modules brief */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Selected Modules & Setup</h4>
                  <table className="custom-table" style={{ border: '1px solid var(--border-color)' }}>
                    <thead>
                      <tr>
                        <th>Module</th>
                        <th style={{ textAlign: 'right' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteSelectedModules.map(qm => (
                        <tr key={qm.originalId}>
                          <td>
                            <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{qm.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{qm.features.filter(f => f.trim() !== '').length} features included</p>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatMoney(qm.price)}</td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          Server Fee ({formatMoney(quoteServerFee || 0)} x {quoteServerFeeDuration || 1} mos):
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>
                          {formatMoney((parseFloat(quoteServerFee) || 0) * (parseInt(quoteServerFeeDuration) || 1))}
                        </td>
                      </tr>
                      <tr style={{ fontWeight: '700', borderTop: '2px solid var(--border-color)' }}>
                        <td>Total Quotation Amount:</td>
                        <td style={{ textAlign: 'right', color: 'var(--primary)' }}>
                          {formatMoney(
                            quoteSelectedModules.reduce((a, b) => a + (parseFloat(b.price) || 0), 0) + 
                            ((parseFloat(quoteServerFee) || 0) * (parseInt(quoteServerFeeDuration) || 1))
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="form-group">
                  <label className="form-label">Special Terms & Notes (Printed on Quotation)</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    placeholder="E.g. Validity period, custom system integration, timeline notes, payment splits..."
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                  />
                </div>

                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setWizardStep(2)}>Back</button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleGenerateQuotation}
                  >
                    Generate Quotation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: VIEW QUOTATION DETAIL (PDF LAYOUT & PAYMENTS) */}
        {currentView === 'view-quotation' && selectedQuotation && (
          <div>
            {/* Top Toolbar - HIDDEN during print */}
            <div className="header-bar no-print">
              <div>
                <button className="btn btn-secondary btn-sm" onClick={() => { setCurrentView('quotations-list'); }} style={{ marginBottom: '1rem' }}>
                  <ArrowLeft size={16} /> Back to List
                </button>
                <h1 className="header-title">Quotation Details</h1>
                <p className="header-subtitle">Manage payments, trace balance, and view/download voucher</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={() => setCurrentView('voucher-view')}>
                  Full Preview
                </button>
                <button className="btn btn-secondary btn-glow" onClick={handleDownloadPDF}>
                  Download PDF
                </button>
                <button className="btn btn-secondary" onClick={handlePrint}>
                  <Printer size={16} /> Print
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteQuotation(selectedQuotation.id)}>
                  <Trash2 size={16} /> Delete
                </button>
                {Number(selectedQuotation.balance) > 0 && (
                  <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
                    <CreditCard size={16} /> Add Payment
                  </button>
                )}
              </div>
            </div>

            {/* In-view status alert - HIDDEN during print */}
            <div className="no-print" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
              padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem'
            }}>
              <div>
                <span className="form-label" style={{ marginBottom: '0.25rem' }}>Status</span>
                <span className={`badge ${selectedQuotation.status.toLowerCase().replace(' ', '-')}`}>
                  {selectedQuotation.status}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="form-label" style={{ marginBottom: '0.25rem' }}>Remaining Balance</span>
                <span style={{ fontWeight: '700', fontSize: '1.2rem', color: Number(selectedQuotation.balance) > 0 ? 'var(--accent)' : 'var(--primary)' }}>
                  {formatMoney(selectedQuotation.balance)}
                </span>
              </div>
            </div>

            {/* A4 PRINT LAYOUT CONTAINER */}
            <div className="invoice-sheet-container">
              {renderVoucherSheet(selectedQuotation)}
            </div>
          </div>
        )}

        {/* VIEW 7: QUOTATIONS LIST RECORD ARCHIVE */}
        {currentView === 'quotations-list' && (
          <div className="no-print">
            <div className="header-bar">
              <div>
                <h1 className="header-title">Quotations Record</h1>
                <p className="header-subtitle">Browse and manage all created customer quotations. View details or open full-screen vouchers.</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setCurrentView('create-quotation'); setWizardStep(1); }}>
                <Plus size={16} /> New Quotation
              </button>
            </div>

            <div className="table-card">
              <div className="table-header-row">
                <h2 className="table-title">All Quotations ({filteredQuotations.length})</h2>
                <div style={{ position: 'relative', width: '300px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search client, company or number..." 
                    className="form-control" 
                    style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }} 
                    value={quoteSearch}
                    onChange={(e) => setQuoteSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="custom-table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Quote Number</th>
                      <th>Client Name</th>
                      <th>Company</th>
                      <th>Date</th>
                      <th>Server Fee</th>
                      <th>Total Amount</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotations.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          No quotations matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredQuotations.map(q => (
                        <tr key={q.id}>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{q.quote_number}</td>
                          <td>{q.client_name}</td>
                          <td>{q.client_company || '-'}</td>
                          <td>{new Date(q.quote_date).toLocaleDateString()}</td>
                          <td>
                            {q.server_fee && Number(q.server_fee) > 0 ? (
                              <>
                                <div>{formatMoney(q.server_fee)} / mo</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({q.server_fee_duration || 1} mos)</div>
                              </>
                            ) : '-'}
                          </td>
                          <td>{formatMoney(q.total_amount)}</td>
                          <td style={{ color: Number(q.balance) > 0 ? 'var(--accent)' : 'inherit', fontWeight: '500' }}>{formatMoney(q.balance)}</td>
                          <td>
                            <span className={`badge ${q.status.toLowerCase().replace(' ', '-')}`}>
                              {q.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => viewQuotationDetail(q.id)}>
                                Manage Payments
                              </button>
                              <button className="btn btn-primary btn-sm btn-glow" onClick={() => viewQuotationVoucher(q.id)}>
                                View Voucher
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuotation(q.id)}>
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
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

        {/* VIEW 8: STANDALONE VOUCHER VIEW */}
        {currentView === 'voucher-view' && selectedQuotation && (
          <div className="voucher-preview-container">
            {/* Top Toolbar - HIDDEN during print */}
            <div className="voucher-toolbar no-print">
              <div className="voucher-toolbar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setCurrentView('quotations-list')}
                >
                  <ArrowLeft size={14} /> Back to List
                </button>
                <span style={{ color: 'var(--border-color)' }}>|</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  Client: {selectedQuotation.client_name} {selectedQuotation.client_company ? `(${selectedQuotation.client_company})` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('view-quotation')}>
                  Manage Payments
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
                  <Printer size={14} /> Print
                </button>
                <button className="btn btn-primary btn-sm btn-glow" onClick={handleDownloadPDF}>
                  Download PDF
                </button>
              </div>
            </div>

            {/* Centered A4 Sheet paper */}
            <div className="invoice-sheet-container">
              {renderVoucherSheet(selectedQuotation)}
            </div>
          </div>
        )}

        {/* VIEW 4: SYSTEM MODULES CRUD */}
        {currentView === 'modules' && (
          <div className="no-print">
            <div className="header-bar">
              <div>
                <h1 className="header-title">System Modules Setup</h1>
                <p className="header-subtitle">Define pre-configured software systems, pricing, and default feature bullet points.</p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setModuleForm({ id: null, name: '', description: '', price: '', features: [''] });
                  setShowModuleModal(true);
                }}
              >
                <Plus size={16} /> Add Module
              </button>
            </div>

            <div className="table-card">
              <div className="custom-table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>System Module</th>
                      <th style={{ width: '40%' }}>Description</th>
                      <th style={{ width: '15%' }}>Base Price</th>
                      <th style={{ width: '20%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No modules available.
                        </td>
                      </tr>
                    ) : (
                      modules.map(m => (
                        <tr key={m.id}>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{m.name}</td>
                          <td>
                            <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>{m.description}</p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {m.features.map((f, i) => (
                                <span key={i} style={{ fontSize: '0.7rem', backgroundColor: 'var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                  ✓ {f}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ fontWeight: '600' }}>{formatMoney(m.price)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => {
                                  setModuleForm({
                                    id: m.id,
                                    name: m.name,
                                    description: m.description || '',
                                    price: m.price,
                                    features: m.features.length > 0 ? [...m.features] : ['']
                                  });
                                  setShowModuleModal(true);
                                }}
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteModule(m.id)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
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

        {/* VIEW 5: CLIENTS MANAGER */}
        {currentView === 'clients' && (
          <div className="no-print">
            <div className="header-bar">
              <div>
                <h1 className="header-title">Clients Database</h1>
                <p className="header-subtitle">Manage client profiles, company names, contact numbers, and invoice billing records.</p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setClientForm({ id: null, name: '', company_name: '', phone: '', email: '', address: '' });
                  setShowClientModal(true);
                }}
              >
                <Plus size={16} /> Add Client
              </button>
            </div>

            <div className="table-card">
              <div className="custom-table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Company Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Address</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No clients saved.
                        </td>
                      </tr>
                    ) : (
                      clients.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{c.name}</td>
                          <td>{c.company_name || '-'}</td>
                          <td>{c.phone || '-'}</td>
                          <td>{c.email || '-'}</td>
                          <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.address || '-'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => {
                                  setClientForm({
                                    id: c.id,
                                    name: c.name,
                                    company_name: c.company_name || '',
                                    phone: c.phone || '',
                                    email: c.email || '',
                                    address: c.address || ''
                                  });
                                  setShowClientModal(true);
                                }}
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteClient(c.id)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
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

        {/* VIEW 6: COMPANY SETTINGS / SETUP */}
        {currentView === 'settings' && (
          <div className="no-print" style={{ maxWidth: '700px' }}>
            <div className="header-bar">
              <div>
                <h1 className="header-title">Company Profile & KPay Setup</h1>
                <p className="header-subtitle">Edit company information displayed on proposal heads and print headers.</p>
              </div>
            </div>

            <div className="creator-panel">
              <form onSubmit={handleSaveSettings}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Company Name</label>
                    <input 
                      type="text" 
                      name="company_name" 
                      className="form-control" 
                      required
                      defaultValue={settings ? settings.company_name : ''}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone No.</label>
                    <input 
                      type="text" 
                      name="phone" 
                      className="form-control" 
                      defaultValue={settings ? settings.phone : ''}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      className="form-control" 
                      defaultValue={settings ? settings.email : ''}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Company Address</label>
                    <textarea 
                      name="address" 
                      rows="3" 
                      className="form-control" 
                      defaultValue={settings ? settings.address : ''}
                    />
                  </div>

                  <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', gridColumn: 'span 2', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '1rem' }}>KBZPay Bank Setup</h3>
                  </div>

                  <div className="form-group">
                    <label className="form-label">KPay Account Name</label>
                    <input 
                      type="text" 
                      name="kpay_name" 
                      className="form-control" 
                      defaultValue={settings ? settings.kpay_name : ''}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">KPay Phone Number</label>
                    <input 
                      type="text" 
                      name="kpay_phone" 
                      className="form-control" 
                      defaultValue={settings ? settings.kpay_phone : ''}
                    />
                  </div>
                </div>

                <div className="form-actions" style={{ marginTop: '2rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    Save Company Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL WINDOWS                                                 */}
      {/* ============================================================== */}

      {/* MODAL 1: ADD PAYMENT */}
      {showPaymentModal && selectedQuotation && (
        <div className="modal-overlay no-print">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Record Payment / Installment</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label className="form-label">Total Outstanding Balance</label>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent)' }}>
                  {formatMoney(selectedQuotation.balance)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Amount (MMK)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="E.g. 300000"
                  required
                  min="1"
                  max={selectedQuotation.balance}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  required
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select 
                  className="form-control"
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                >
                  <option value="KBZPay">KBZPay</option>
                  <option value="WavePay">WavePay</option>
                  <option value="AYA Pay">AYA Pay</option>
                  <option value="CB Pay">CB Pay</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Transaction ID / Reference No.</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Optional txn reference number"
                  value={paymentForm.reference_no}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, reference_no: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Slip Note / Remarks</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="E.g. First 50% deposit payment"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CLIENT */}
      {showClientModal && (
        <div className="modal-overlay no-print">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{clientForm.id ? 'Edit Client Profile' : 'Create Client Profile'}</h2>
              <button className="modal-close" onClick={() => { setShowClientModal(false); setClientForm({ id: null, name: '', company_name: '', phone: '', email: '', address: '' }); }}>×</button>
            </div>
            <form onSubmit={handleSaveClient}>
              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  placeholder="Customer Name"
                  value={clientForm.name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company / Shop Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Optional company name"
                  value={clientForm.company_name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, company_name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Contact phone number"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Contact email address"
                  value={clientForm.email}
                  onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  placeholder="Billing address details"
                  value={clientForm.address}
                  onChange={(e) => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowClientModal(false); setClientForm({ id: null, name: '', company_name: '', phone: '', email: '', address: '' }); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {clientForm.id ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD/EDIT MODULE */}
      {showModuleModal && (
        <div className="modal-overlay no-print" style={{ overflowY: 'auto', padding: '2rem 0' }}>
          <div className="modal-content" style={{ maxWidth: '600px', margin: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">{moduleForm.id ? 'Edit System Module' : 'Create System Module'}</h2>
              <button className="modal-close" onClick={() => setShowModuleModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveModule}>
              <div className="form-group">
                <label className="form-label">Module Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  placeholder="E.g. Stock Control System"
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  placeholder="Describe the system module..."
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Base Price (MMK) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required
                  placeholder="Base Price E.g. 500000"
                  value={moduleForm.price}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>System Features Checklist</span>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    style={{ padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                    onClick={() => setModuleForm(prev => ({ ...prev, features: [...prev.features, ''] }))}
                  >
                    <Plus size={12} /> Add Feature Line
                  </button>
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '5px' }}>
                  {moduleForm.features.map((feature, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{idx + 1}.</span>
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        placeholder="E.g. Invoice print layout templates"
                        value={feature}
                        onChange={(e) => {
                          const newFeats = [...moduleForm.features];
                          newFeats[idx] = e.target.value;
                          setModuleForm(prev => ({ ...prev, features: newFeats }));
                        }}
                      />
                      <button 
                        type="button" 
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        disabled={moduleForm.features.length <= 1}
                        onClick={() => {
                          const newFeats = moduleForm.features.filter((_, i) => i !== idx);
                          setModuleForm(prev => ({ ...prev, features: newFeats }));
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModuleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Save Module</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
      )}
    </>
  );
}

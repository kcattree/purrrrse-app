import React, { useState, useEffect } from 'react';
import { Plus, X, DollarSign, LogOut, Menu, Trash2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB3n3nH3w58CE0jTwaxrPKSg5csTV0TtP8",
  authDomain: "purrrrse.firebaseapp.com",
  projectId: "purrrrse",
  storageBucket: "purrrrse.firebasestorage.app",
  messagingSenderId: "590137436686",
  appId: "1:590137436686:web:37383d02d639267d466a5f",
  measurementId: "G-RKDKCQE4D5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function FinanceApp() {
  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Login/Signup State
  const [showSignup, setShowSignup] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Navigation
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showPageMenu, setShowPageMenu] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [userName, setUserName] = useState('User');
  const [budgets, setBudgets] = useState({
    'Housing & Rent': 1740, 'Utilities & Bills': 160, 'Groceries': 500, 'Food Delivery': 400,
    'Dining Out': 600, 'Party': 500, 'Assets': 1000, 'Transportation': 600,
    'Miscellaneous': 500, 'Personal Care & Health': 300, 'Lifestyle & Entertainment': 400,
    'Loan & Insurance': 500, 'Investment': 800, 'Bad Debts & Losses': 200
  });
  const [categoryOrder, setCategoryOrder] = useState([
    'Housing & Rent', 'Utilities & Bills', 'Groceries', 'Food Delivery', 'Dining Out', 'Party',
    'Assets', 'Transportation', 'Miscellaneous', 'Personal Care & Health', 'Lifestyle & Entertainment',
    'Loan & Insurance', 'Investment', 'Bad Debts & Losses'
  ]);
  const [monthlyIncome, setMonthlyIncome] = useState(26500);
  const [bankBalance, setBankBalance] = useState(115213.24);

  // Modal States
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingTransactionData, setEditingTransactionData] = useState({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    date: currentDate.toISOString().split('T')[0],
    category: '',
    amount: '',
    details: '',
    type: 'expense'
  });

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setCurrentUser(null);
      }
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  // Load transactions in real-time
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'transactions'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(txns);
    });

    return unsubscribe;
  }, [currentUser]);

  // Load user settings
  useEffect(() => {
    if (!currentUser) return;

    const loadSettings = async () => {
      const q = query(collection(db, 'userSettings'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const settings = snapshot.docs[0].data();
        if (settings.userName) setUserName(settings.userName);
        if (settings.budgets) setBudgets(settings.budgets);
        if (settings.categoryOrder) setCategoryOrder(settings.categoryOrder);
        if (settings.monthlyIncome) setMonthlyIncome(settings.monthlyIncome);
        if (settings.bankBalance) setBankBalance(settings.bankBalance);
      }
    };

    loadSettings();
  }, [currentUser]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (signupPassword !== signupPasswordConfirm) {
      setAuthError('Passwords do not match');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      
      // Create user settings document
      await addDoc(collection(db, 'userSettings'), {
        userId: userCredential.user.uid,
        userName: 'User',
        budgets,
        categoryOrder,
        monthlyIncome,
        bankBalance
      });

      setShowSignup(false);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentPage('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle Add Transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.amount || (formData.type === 'expense' && !formData.category)) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        date: formData.date,
        category: formData.category || 'Income',
        amount: parseFloat(formData.amount),
        details: formData.details,
        type: formData.type,
        createdAt: new Date()
      });

      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        details: '',
        type: 'expense'
      });
      setShowAddTransactionModal(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  // Handle Edit Transaction
  const handleEditTransaction = async () => {
    try {
      await updateDoc(doc(db, 'transactions', editingTransaction), {
        date: editingTransactionData.date,
        category: editingTransactionData.category,
        amount: parseFloat(editingTransactionData.amount),
        details: editingTransactionData.details,
        type: editingTransactionData.type
      });
      setEditingTransaction(null);
      setEditingTransactionData({});
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  // Handle Delete Transaction
  const handleDeleteTransaction = async () => {
    try {
      await deleteDoc(doc(db, 'transactions', deleteTarget));
      setShowConfirmDelete(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async () => {
    try {
      const q = query(collection(db, 'userSettings'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(db, 'userSettings', docId), {
          userName,
          budgets,
          categoryOrder,
          monthlyIncome,
          bankBalance
        });
      }
      setCurrentPage('dashboard');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Data Processing Functions
  const getDashboardStats = (month) => {
    const filtered = transactions.filter(t => t.date.startsWith(month) && t.type !== 'income');
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    return { total };
  };

  const getSpendingData = (month) => {
    const filtered = transactions.filter(t => t.date.startsWith(month) && t.type !== 'income');
    const data = {};
    filtered.forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return data;
  };

  const getCategoryAnalysis = (month) => {
    const filtered = transactions.filter(t => t.date.startsWith(month) && t.type !== 'income');
    const totals = {};
    filtered.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return totals;
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;

    if (filterMode === 'month') {
      filtered = filtered.filter(t => t.date.startsWith(selectedMonth));
    } else if (filterMode === 'range') {
      filtered = filtered.filter(t => {
        const tDate = new Date(t.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && tDate < start) return false;
        if (end && tDate > end) return false;
        return true;
      });
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const CATEGORY_COLORS = {
    'Housing & Rent': { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
    'Utilities & Bills': { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-700' },
    'Groceries': { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700' },
    'Food Delivery': { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700' },
    'Dining Out': { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700' },
    'Party': { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-700' },
    'Assets': { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700' },
    'Transportation': { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700' },
    'Miscellaneous': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
    'Personal Care & Health': { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
    'Lifestyle & Entertainment': { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700' },
    'Loan & Insurance': { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700' },
    'Investment': { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
    'Bad Debts & Losses': { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700' }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl font-bold mb-4">Purrrrse</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐱</div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Purrrrse</h1>
            <p className="text-slate-600">No more scratching your head about spending</p>
          </div>

          <form onSubmit={showSignup ? handleSignup : handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Email</label>
              <input
                type="text"
                value={showSignup ? signupEmail : loginEmail}
                onChange={(e) => showSignup ? setSignupEmail(e.target.value) : setLoginEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={showSignup ? signupPassword : loginPassword}
                  onChange={(e) => showSignup ? setSignupPassword(e.target.value) : setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {showSignup && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={signupPasswordConfirm}
                  onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            )}

            {authError && <div className="text-red-600 text-sm">{authError}</div>}

            <button
              type="submit"
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              {showSignup ? 'Create Account' : 'Login'}
            </button>
          </form>

          <button
            onClick={() => {
              setShowSignup(!showSignup);
              setAuthError('');
            }}
            className="w-full mt-4 text-purple-600 hover:text-purple-700 font-semibold"
          >
            {showSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
          </button>

          <div className="text-center text-xs text-slate-500 mt-6">Dreamt by CatTree</div>
        </div>
      </div>
    );
  }

  // Dashboard Page
  if (currentPage === 'dashboard') {
    const stats = getDashboardStats(dashboardMonth);
    const budgetAllocated = categoryOrder.reduce((sum, cat) => sum + budgets[cat], 0);
    const budgetLeft = budgetAllocated - stats.total;

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🐱</div>
              <h1 className="text-2xl font-bold text-slate-900">Purrrrse</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">Hello, {userName}</div>
              <button onClick={handleLogout} className="text-slate-600 hover:text-slate-900"><LogOut size={20} /></button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Select Month</label>
            <input
              type="month"
              value={dashboardMonth}
              onChange={(e) => setDashboardMonth(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-slate-600 text-sm font-semibold mb-2">Total Spent</p>
              <p className="text-3xl font-bold text-red-600">${stats.total.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-slate-600 text-sm font-semibold mb-2">Budget Left</p>
              <p className="text-3xl font-bold text-green-600">${budgetLeft.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-8">
            <button onClick={() => setCurrentPage('spending')} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 transition-all">Spending</button>
            <button onClick={() => setCurrentPage('analysis')} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 transition-all">Analysis</button>
            <button onClick={() => setCurrentPage('history')} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 transition-all">History</button>
            <button onClick={() => setCurrentPage('settings')} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 transition-all">Settings</button>
          </div>
        </div>

        <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30">
          <Plus className="w-8 h-8" />
        </button>

        <div className="text-center pb-8 text-xs text-slate-500">Dreamt by CatTree</div>
      </div>
    );
  }

  // Spending Page
  if (currentPage === 'spending') {
    const spendingData = getSpendingData(spendingMonth);
    const pieChartData = Object.entries(spendingData).filter(([_, v]) => v > 0).map(([cat, amount]) => ({
      name: cat,
      value: amount
    }));
    const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#eab308', '#64748b', '#10b981', '#6366f1', '#7c3aed', '#f59e0b', '#e11d48'];

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentPage('dashboard')}><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Spending by Category</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Select Month</label>
            <input
              type="month"
              value={spendingMonth}
              onChange={(e) => setSpendingMonth(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-2">
            <div className="flex-1 flex justify-center">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-0.5 overflow-y-auto max-h-80">
              {Object.entries(spendingData).map(([cat, amount]) => (
                <div key={cat} className={`${CATEGORY_COLORS[cat]?.bg || 'bg-slate-50'} border ${CATEGORY_COLORS[cat]?.border || 'border-slate-200'} rounded p-2`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-semibold ${CATEGORY_COLORS[cat]?.text || 'text-slate-700'}`}>{cat}</span>
                    <span className={`text-xs font-bold ${amount < 0 ? 'text-blue-600' : CATEGORY_COLORS[cat]?.text}`}>{amount < 0 ? '↩️ ' : ''}${Math.abs(amount).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30">
          <Plus className="w-8 h-8" />
        </button>

        <div className="text-center pb-8 text-xs text-slate-500">Dreamt by CatTree</div>
      </div>
    );
  }

  // Analysis Page
  if (currentPage === 'analysis') {
    const categoryTotals = getCategoryAnalysis(analysisMonth);

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentPage('dashboard')}><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Category Analysis</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Select Month</label>
            <input
              type="month"
              value={analysisMonth}
              onChange={(e) => setAnalysisMonth(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            {categoryOrder.map(cat => {
              const spent = categoryTotals[cat] || 0;
              const budget = budgets[cat] || 0;
              const percentage = budget > 0 ? (spent / budget) * 100 : 0;
              if (spent === 0) return null;

              return (
                <div
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage('category-detail');
                  }}
                  className={`${CATEGORY_COLORS[cat]?.bg || 'bg-slate-50'} border ${CATEGORY_COLORS[cat]?.border || 'border-slate-200'} rounded p-2.5 cursor-pointer hover:shadow-sm transition-all`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-semibold ${CATEGORY_COLORS[cat]?.text || 'text-slate-700'}`}>{cat}</span>
                    <span className="text-xs font-bold text-slate-900">${Math.abs(spent).toFixed(2)} / ${budget.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-300 rounded-full h-1.5 overflow-hidden">
                    <div style={{ width: `${Math.min(percentage, 100)}%` }} className={`h-full ${percentage > 100 ? 'bg-red-600' : 'bg-green-600'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30">
          <Plus className="w-8 h-8" />
        </button>

        <div className="text-center pb-8 text-xs text-slate-500">Dreamt by CatTree</div>
      </div>
    );
  }

  // Category Detail Page
  if (currentPage === 'category-detail') {
    const categoryTransactions = transactions.filter(t => t.category === selectedCategory && t.type !== 'income').sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentPage('analysis')}><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">{selectedCategory}</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-sm text-slate-600">{categoryTransactions.length} transactions</p>
        </div>

        <div className="max-w-6xl mx-auto px-6 space-y-0">
          {categoryTransactions.map(txn => (
            <div key={txn.id} className={`${CATEGORY_COLORS[txn.category]?.bg || 'bg-slate-50'} border-b border-slate-200 px-4 py-2 flex justify-between items-center hover:bg-slate-100 transition-all group`}>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${CATEGORY_COLORS[txn.category]?.text || 'text-slate-700'}`}>{txn.category}</p>
                <p className="text-xs text-slate-500">{txn.date}</p>
                <p className="text-xs text-slate-600">{txn.details}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">${txn.amount.toFixed(2)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingTransaction(txn.id); setEditingTransactionData(txn); }} className="text-blue-600 hover:text-blue-900"><DollarSign size={16} /></button>
                  <button onClick={() => { setDeleteTarget(txn.id); setShowConfirmDelete(true); }} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30">
          <Plus className="w-8 h-8" />
        </button>

        <div className="text-center pb-8 text-xs text-slate-500">Dreamt by CatTree</div>
      </div>
    );
  }

  // History Page
  if (currentPage === 'history') {
    const filteredTxns = getFilteredTransactions();

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentPage('dashboard')}><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Filter by</label>
              <div className="flex gap-2">
                <button onClick={() => setFilterMode('month')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${filterMode === 'month' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-900'}`}>Month</button>
                <button onClick={() => setFilterMode('range')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${filterMode === 'range' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-900'}`}>Date Range</button>
              </div>
            </div>

            {filterMode === 'month' && (
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg" />
            )}

            {filterMode === 'range' && (
              <div className="space-y-2">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg" placeholder="From" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg" placeholder="To" />
              </div>
            )}
          </div>

          <div className="text-sm text-slate-600 mb-4">{filteredTxns.length} transactions</div>

          <div className="space-y-0">
            {filteredTxns.map(txn => (
              <div key={txn.id} className={`${txn.type === 'income' ? 'bg-green-50 border-green-100' : CATEGORY_COLORS[txn.category]?.bg} border-b border-slate-200 px-4 py-2 flex justify-between items-center hover:bg-slate-100 transition-all group`}>
                <div className="flex-1">
                  {txn.type === 'income' ? (
                    <p className="text-xs font-semibold text-green-700">💰 Income</p>
                  ) : (
                    <p className={`text-xs font-semibold ${CATEGORY_COLORS[txn.category]?.text}`}>{txn.category}</p>
                  )}
                  <p className="text-xs text-slate-500">{txn.date}</p>
                  <p className="text-xs text-slate-600">{txn.details}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${txn.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>{txn.type === 'income' ? '+' : ''}{txn.type === 'income' ? '$' : '$'}{txn.amount.toFixed(2)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingTransaction(txn.id); setEditingTransactionData(txn); }} className="text-blue-600 hover:text-blue-900"><DollarSign size={16} /></button>
                    <button onClick={() => { setDeleteTarget(txn.id); setShowConfirmDelete(true); }} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30">
          <Plus className="w-8 h-8" />
        </button>

        <div className="text-center pb-8 text-xs text-slate-500">Dreamt by CatTree</div>
      </div>
    );
  }

  // Settings Page
  if (currentPage === 'settings') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentPage('dashboard')}><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Profile Settings</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Name</label>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Email</label>
                <input type="text" value={currentUser.email} disabled className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-100" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Bank Settings</h3>
            {!showBankEdit ? (
              <button onClick={() => setShowBankEdit(true)} className="px-3 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600">Edit Bank Info</button>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">Starting Balance</label>
                  <input type="number" value={editBankBalance} onChange={(e) => setEditBankBalance(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">Monthly Income</label>
                  <input type="number" value={editMonthlyIncome} onChange={(e) => setEditMonthlyIncome(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg" />
                </div>
                <button
                  onClick={() => {
                    setBankBalance(parseFloat(editBankBalance));
                    setMonthlyIncome(parseFloat(editMonthlyIncome));
                    setShowBankEdit(false);
                  }}
                  className="px-3 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Category Budgets</h3>
            <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
              {categoryOrder.map(cat => (
                <div key={cat} className="flex gap-2 items-center">
                  <input type="number" value={budgets[cat]} onChange={(e) => setBudgets({ ...budgets, [cat]: parseFloat(e.target.value) })} className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded" />
                  <span className="text-xs font-semibold text-slate-700 flex-1">{cat}</span>
                </div>
              ))}
            </div>

            {showAddCategory && (
              <div className="space-y-2 mb-3 p-2 bg-slate-50 rounded">
                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category name" className="w-full px-2 py-1 text-xs border border-slate-300 rounded" />
                <input type="number" value={newCategoryBudget} onChange={(e) => setNewCategoryBudget(e.target.value)} placeholder="Budget" className="w-full px-2 py-1 text-xs border border-slate-300 rounded" />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newCategoryName && newCategoryBudget) {
                        setBudgets({ ...budgets, [newCategoryName]: parseFloat(newCategoryBudget) });
                        setCategoryOrder([...categoryOrder, newCategoryName]);
                        setNewCategoryName('');
                        setNewCategoryBudget('');
                        setShowAddCategory(false);
                      }
                    }}
                    className="flex-1 px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button onClick={() => setShowAddCategory(false)} className="flex-1 px-2 py-1 text-xs font-semibold bg-slate-300 text-slate-900 rounded hover:bg-slate-400">Cancel</button>
                </div>
              </div>
            )}

            <button onClick={() => setShowAddCategory(true)} className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Category</button>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Save Settings
          </button>
        </div>

        <div className="text-center pb-8 text-xs text-slate-500">Dreamt by CatTree</div>
      </div>
    );
  }

  // Delete Confirmation Modal
  if (showConfirmDelete) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Delete Transaction?</h2>
          <p className="text-slate-600 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirmDelete(false)} className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50">Cancel</button>
            <button onClick={handleDeleteTransaction} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Delete</button>
          </div>
        </div>
      </div>
    );
  }

  // Edit Transaction Modal
  if (editingTransaction) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditingTransaction(null)}>
        <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Edit Transaction</h2>
            <button onClick={() => setEditingTransaction(null)} className="text-slate-600 hover:text-slate-900 cursor-pointer p-1"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Type</label>
              <div className="flex gap-2">
                <button onClick={() => setEditingTransactionData({ ...editingTransactionData, type: 'expense', category: '' })} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${editingTransactionData.type === 'expense' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Expense</button>
                <button onClick={() => setEditingTransactionData({ ...editingTransactionData, type: 'income', category: 'Income' })} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${editingTransactionData.type === 'income' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Income</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Date</label>
              <input type="date" value={editingTransactionData.date} onChange={(e) => setEditingTransactionData({ ...editingTransactionData, date: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            {editingTransactionData.type === 'expense' && (
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Category</label>
                <select value={editingTransactionData.category} onChange={(e) => setEditingTransactionData({ ...editingTransactionData, category: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="">Select Category</option>
                  {categoryOrder.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Amount</label>
              <input type="number" step="0.01" value={editingTransactionData.amount} onChange={(e) => setEditingTransactionData({ ...editingTransactionData, amount: parseFloat(e.target.value) })} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Details</label>
              <input type="text" value={editingTransactionData.details} onChange={(e) => setEditingTransactionData({ ...editingTransactionData, details: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder={editingTransactionData.type === 'income' ? 'What was this income from?' : 'What was this for?'} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingTransaction(null)} className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-lg font-semibold text-sm text-slate-900 hover:bg-slate-50 cursor-pointer transition-all">Cancel</button>
              <button onClick={handleEditTransaction} className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg cursor-pointer transition-all">Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add Transaction Modal
  if (showAddTransactionModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddTransactionModal(false)}>
        <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Add Transaction</h2>
            <button onClick={() => setShowAddTransactionModal(false)} className="text-slate-600 hover:text-slate-900 cursor-pointer p-1"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleAddTransaction} className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setFormData({ ...formData, type: 'expense', category: '' })} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${formData.type === 'expense' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Expense</button>
                <button type="button" onClick={() => setFormData({ ...formData, type: 'income', category: 'Income' })} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${formData.type === 'income' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Income</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            {formData.type === 'expense' && (
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="">Select Category</option>
                  {categoryOrder.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Amount</label>
              <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Details</label>
              <input type="text" value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder={formData.type === 'income' ? 'What was this income from?' : 'What was this for?'} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAddTransactionModal(false)} className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-lg font-semibold text-sm text-slate-900 hover:bg-slate-50 cursor-pointer transition-all">Cancel</button>
              <button type="submit" className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg cursor-pointer transition-all">Add</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}

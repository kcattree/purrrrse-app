import React, { useState, useMemo, useEffect } from 'react';
import { Settings, Plus, X, TrendingDown, DollarSign, Lock, LogOut, Home, List, Menu, Trash2, Mail, Key, ArrowLeft, Eye, EyeOff } from 'lucide-react';
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
  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().split('T')[0].substring(0, 7);

  const fixedExpenses = ['Housing & Rent', 'Utilities & Bills', 'Assets', 'Loan & Insurance', 'Investment'];
  const variableExpenses = ['Groceries', 'Food Delivery', 'Dining Out', 'Party', 'Transportation', 'Miscellaneous', 'Personal Care & Health', 'Bad Debts & Losses'];

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Navigation
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showPageMenu, setShowPageMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // User settings
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('User');
  const [userPassword, setUserPassword] = useState('admin');
  const [userPin, setUserPin] = useState('1234');

  // Bank/Income
  const [monthlyIncome, setMonthlyIncome] = useState(26500);
  const [bankBalance, setBankBalance] = useState(115213.24);
  const [bankPageUnlocked, setBankPageUnlocked] = useState(false);

  // PIN modals
  const [bankPin, setBankPin] = useState('');
  const [bankPinError, setBankPinError] = useState('');

  // Bank & Income modal
  const [showBankIncomeEdit, setShowBankIncomeEdit] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [bankIncomePin, setBankIncomePin] = useState('');
  const [bankIncomeError, setBankIncomeError] = useState('');

  // PIN/Password change
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [verifyPin, setVerifyPin] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Add transaction modal
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);

  // Categories and budgets
  const [budgets, setBudgets] = useState({
    'Housing & Rent': 1740,
    'Utilities & Bills': 160,
    'Groceries': 500,
    'Food Delivery': 400,
    'Dining Out': 600,
    'Party': 500,
    'Assets': 1000,
    'Transportation': 600,
    'Miscellaneous': 500,
    'Personal Care & Health': 300,
    'Lifestyle & Entertainment': 400,
    'Loan & Insurance': 500,
    'Investment': 800,
    'Bad Debts & Losses': 200,
  });

  const [categoryOrder, setCategoryOrder] = useState([
    'Housing & Rent', 'Utilities & Bills', 'Groceries', 'Food Delivery',
    'Dining Out', 'Party', 'Assets', 'Transportation', 'Miscellaneous',
    'Personal Care & Health', 'Lifestyle & Entertainment', 'Loan & Insurance', 'Investment', 'Bad Debts & Losses'
  ]);

  // Transactions
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    date: currentDate.toISOString().split('T')[0],
    category: '',
    amount: '',
    details: '',
    type: 'expense',
  });

  // Edit/Delete
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingTransactionData, setEditingTransactionData] = useState({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filters
  const [dashboardMonth, setDashboardMonth] = useState(currentMonth);
  const [spendingMonth, setSpendingMonth] = useState(currentMonth);
  const [analysisMonth, setAnalysisMonth] = useState(currentMonth);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Auth effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setUserEmail(user.email);
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
        if (settings.userPin) setUserPin(settings.userPin);
        if (settings.userPassword) setUserPassword(settings.userPassword);
      }
    };
    loadSettings();
  }, [currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (signupPassword !== signupPasswordConfirm) {
      setLoginError('Passwords do not match');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      await addDoc(collection(db, 'userSettings'), {
        userId: userCredential.user.uid,
        userName: 'User',
        budgets,
        categoryOrder,
        monthlyIncome,
        bankBalance,
        userPin: '1234',
        userPassword: 'admin'
      });
      setShowSignup(false);
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentPage('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
        createdAt: new Date(),
        id: Math.random().toString(36).substr(2, 9)
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

  const handleReorderCategory = (idx, direction) => {
    const newOrder = [...categoryOrder];
    if (direction === 'up' && idx > 0) {
      [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
    } else if (direction === 'down' && idx < newOrder.length - 1) {
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    }
    setCategoryOrder(newOrder);
  };

  const handleNavigation = (page) => {
    setBankPageUnlocked(false);
    setCurrentPage(page);
    setShowPageMenu(false);
  };

  const getDashboardStats = (month) => {
    const filtered = transactions.filter(t => t.date.startsWith(month) && t.type !== 'income');
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    return { total };
  };

  const dashboardStats = getDashboardStats(dashboardMonth);
  const dashboardBudgetTotal = Object.values(budgets).reduce((a, b) => a + b, 0);
  const dashboardBudgetLeft = dashboardBudgetTotal - dashboardStats.total;

  // LOGIN PAGE
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
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-center mb-2">
              <svg width="150" height="150" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="200" cy="230" rx="96" ry="84" fill="#9b59b6" opacity="0.95"/>
                <path d="M 120 210 Q 120 150 200 136 Q 280 150 280 210" fill="#a76ec1" stroke="#8e44ad" strokeWidth="3"/>
                <path d="M 150 150 Q 150 70 200 56 Q 250 70 250 150" fill="none" stroke="#8e44ad" strokeWidth="18" strokeLinecap="round" opacity="0.9"/>
                <rect x="160" y="200" width="16" height="44" fill="#f39c12" rx="4" opacity="0.85"/>
                <rect x="192" y="200" width="16" height="44" fill="#f39c12" rx="4" opacity="0.85"/>
                <rect x="224" y="200" width="16" height="44" fill="#f39c12" rx="4" opacity="0.85"/>
                <circle cx="200" cy="260" r="44" fill="#ff9a56"/>
                <polygon points="170,190 160,150 174,186" fill="#ff9a56"/>
                <polygon points="230,190 240,150 226,186" fill="#ff9a56"/>
                <circle cx="188" cy="256" r="7" fill="#000"/>
                <circle cx="212" cy="256" r="7" fill="#000"/>
                <circle cx="189" cy="253" r="2" fill="#fff"/>
                <circle cx="213" cy="253" r="2" fill="#fff"/>
                <polygon points="200,270 196,278 204,278" fill="#ff6b9d"/>
                <path d="M 184 284 Q 200 290 216 284" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-center text-slate-900 -mt-6 mb-1">Purrrrse</h1>
            <p className="text-center text-slate-600 mb-6 text-sm">No more scratching your head about spending</p>
            
            {!showSignup && !showForgotPassword ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Email</label>
                  <input type="text" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" placeholder="abc@cba.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                {loginError && <p className="text-red-600 text-sm font-medium">{loginError}</p>}
                <button onClick={handleLogin} className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all cursor-pointer text-sm">Login</button>
                <button onClick={() => { setShowSignup(true); setLoginError(''); }} className="w-full text-sm text-slate-600 hover:text-slate-900 font-semibold cursor-pointer">Don't have an account? Sign up</button>
                <button onClick={() => setShowForgotPassword(true)} className="w-full text-sm text-slate-600 hover:text-slate-900 font-semibold cursor-pointer flex items-center justify-center gap-1"><Mail size={16} /> Forgot Password?</button>
              </div>
            ) : showSignup ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Email</label>
                  <input type="text" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" placeholder="abc@cba.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Password</label>
                  <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Confirm Password</label>
                  <input type="password" value={signupPasswordConfirm} onChange={(e) => setSignupPasswordConfirm(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" placeholder="••••••••" />
                </div>
                {loginError && <p className="text-red-600 text-sm font-medium">{loginError}</p>}
                <button onClick={handleSignup} className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all cursor-pointer text-sm">Create Account</button>
                <button onClick={() => { setShowSignup(false); setLoginError(''); setSignupEmail(''); setSignupPassword(''); setSignupPasswordConfirm(''); }} className="w-full text-sm text-slate-600 hover:text-slate-900 font-semibold cursor-pointer">Back to Login</button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">Enter your email to reset your password</p>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Email</label>
                  <input type="text" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" placeholder="abc@cba.com" />
                </div>
                {loginError && <p className="text-red-600 text-sm font-medium">{loginError}</p>}
                <button onClick={() => { if (!forgotEmail) { setLoginError('Please enter your email'); } else { setLoginError(''); alert('Password reset link would be sent to ' + forgotEmail); setShowForgotPassword(false); setForgotEmail(''); } }} className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all cursor-pointer text-sm">Send Reset Link</button>
                <button onClick={() => { setShowForgotPassword(false); setLoginError(''); setForgotEmail(''); }} className="w-full text-sm text-slate-600 hover:text-slate-900 font-semibold cursor-pointer">Back to Login</button>
              </div>
            )}
          </div>
        </div>
        <p className="absolute bottom-4 text-white text-sm">Dreamt by CatTree</p>
      </div>
    );
  }

  // EDIT TRANSACTION MODAL
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
                <button onClick={() => setEditingTransactionData({...editingTransactionData, type: 'expense', category: ''})} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${editingTransactionData.type === 'expense' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Expense</button>
                <button onClick={() => setEditingTransactionData({...editingTransactionData, type: 'income', category: 'Income'})} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${editingTransactionData.type === 'income' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Income</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Date</label>
              <input type="date" value={editingTransactionData.date} onChange={(e) => setEditingTransactionData({...editingTransactionData, date: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            {editingTransactionData.type === 'expense' && (
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Category</label>
                <select value={editingTransactionData.category} onChange={(e) => setEditingTransactionData({...editingTransactionData, category: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"><option value="">Select Category</option>{categoryOrder.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Amount</label>
              <input type="number" step="0.01" value={editingTransactionData.amount} onChange={(e) => setEditingTransactionData({...editingTransactionData, amount: parseFloat(e.target.value)})} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Details</label>
              <input type="text" value={editingTransactionData.details} onChange={(e) => setEditingTransactionData({...editingTransactionData, details: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder={editingTransactionData.type === 'income' ? 'What was this income from?' : 'What was this for?'} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingTransaction(null)} className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-lg font-semibold text-sm text-slate-900 hover:bg-slate-50 cursor-pointer transition-all">Cancel</button>
              <button onClick={() => { setTransactions(transactions.map(t => t.id === editingTransaction ? {...editingTransactionData, id: editingTransaction} : t)); setEditingTransaction(null); setEditingTransactionData({}); }} className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg cursor-pointer transition-all">Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DELETE CONFIRMATION
  if (showConfirmDelete) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Confirm Delete</h2>
          <p className="text-slate-600 mb-6">Are you sure you want to delete this transaction?</p>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirmDelete(false)} className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 cursor-pointer transition-all">Cancel</button>
            <button onClick={() => { setTransactions(transactions.filter(t => t.id !== deleteTarget)); setShowConfirmDelete(false); setDeleteTarget(null); }} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 cursor-pointer transition-all">Delete</button>
          </div>
        </div>
      </div>
    );
  }

  // ADD TRANSACTION MODAL
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
                <button type="button" onClick={() => setFormData({...formData, type: 'expense', category: ''})} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${formData.type === 'expense' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Expense</button>
                <button type="button" onClick={() => setFormData({...formData, type: 'income', category: 'Income'})} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${formData.type === 'income' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Income</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            {formData.type === 'expense' && (
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"><option value="">Select Category</option>{categoryOrder.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Amount</label>
              <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Details</label>
              <input type="text" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder={formData.type === 'income' ? 'What was this income from?' : 'What was this for?'} />
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

  // DASHBOARD PAGE
  if (currentPage === 'dashboard') {
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
              <button onClick={() => setShowPageMenu(!showPageMenu)} className="text-slate-600 hover:text-slate-900"><Menu size={20} /></button>
              <button onClick={handleLogout} className="text-slate-600 hover:text-slate-900"><LogOut size={20} /></button>
            </div>
          </div>
        </div>

        {showPageMenu && (
          <div className="fixed top-16 right-6 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-48">
            <button onClick={() => handleNavigation('dashboard')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2"><Home size={18} /> Dashboard</button>
            <button onClick={() => handleNavigation('spending')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2"><TrendingDown size={18} /> Spending</button>
            <button onClick={() => handleNavigation('analysis')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2"><List size={18} /> Analysis</button>
            <button onClick={() => handleNavigation('history')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2"><Mail size={18} /> History</button>
            <button onClick={() => handleNavigation('bank')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2"><DollarSign size={18} /> Bank</button>
            <button onClick={() => handleNavigation('settings')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2"><Settings size={18} /> Settings</button>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Select Month</label>
            <input type="month" value={dashboardMonth} onChange={(e) => setDashboardMonth(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-slate-600 text-sm font-semibold mb-2">Total Spent</p>
              <p className="text-3xl font-bold text-red-600">${dashboardStats.total.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-slate-600 text-sm font-semibold mb-2">Budget Left</p>
              <p className="text-3xl font-bold text-green-600">${dashboardBudgetLeft.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => handleNavigation('spending')} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 transition-all">Spending</button>
            <button onClick={() => handleNavigation('analysis')} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 transition-all">Analysis</button>
            <button onClick={() => handleNavigation('history')} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 transition-all">History</button>
            <button onClick={() => handleNavigation('bank')} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><Lock size={18} /> Bank</button>
            <button onClick={() => handleNavigation('settings')} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 transition-all">Settings</button>
          </div>
        </div>

        <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30">
          <Plus className="w-8 h-8" />
        </button>

        <div className="text-center pb-8 text-xs text-slate-500">Dreamt by CatTree</div>
      </div>
    );
  }

  // SPENDING PAGE
  if (currentPage === 'spending') {
    const spendingData = Object.fromEntries(
      categoryOrder.map(cat => {
        const spent = transactions.filter(t => t.category === cat && t.type !== 'income' && t.date.startsWith(spendingMonth)).reduce((sum, t) => sum + t.amount, 0);
        return [cat, spent];
      }).filter(([_, spent]) => spent > 0)
    );

    const pieChartData = Object.entries(spendingData).filter(([_, v]) => v > 0).map(([cat, amount]) => ({ name: cat, value: amount }));
    const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#eab308', '#64748b', '#10b981', '#6366f1', '#7c3aed', '#f59e0b', '#e11d48'];

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => handleNavigation('dashboard')}><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Spending by Category</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Select Month</label>
            <input type="month" value={spendingMonth} onChange={(e) => setSpendingMonth(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg" />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex justify-center">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={pieChartData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                      {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-500">No expenses this month</div>
              )}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-80">
              {Object.entries(spendingData).map(([cat, amount]) => (
                <div key={cat} className="bg-white border border-slate-200 rounded p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-900">{cat}</span>
                    <span className="text-sm font-bold text-slate-900">${amount.toFixed(2)}</span>
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

  // ANALYSIS PAGE
  if (currentPage === 'analysis') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => handleNavigation('dashboard')}><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Category Analysis</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Select Month</label>
            <input type="month" value={analysisMonth} onChange={(e) => setAnalysisMonth(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg" />
          </div>

          <div className="space-y-2">
            {categoryOrder.map(cat => {
              const spent = transactions.filter(t => t.category === cat && t.type !== 'income' && t.date.startsWith(analysisMonth)).reduce((sum, t) => sum + t.amount, 0);
              const budget = budgets[cat] || 0;
              const percentage = budget > 0 ? (spent / budget) * 100 : 0;
              if (spent === 0) return null;

              return (
                <div key={cat} className="bg-white border border-slate-200 rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-900">{cat}</span>
                    <span className="text-sm font-bold text-slate-900">${spent.toFixed(2)} / ${budget.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-300 rounded-full h-2 overflow-hidden">
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

  // HISTORY PAGE
  if (currentPage === 'history') {
    const filteredTxns = transactions.filter(t => t.date.startsWith(selectedMonth || currentMonth)).sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => handleNavigation('dashboard')}><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Select Month</label>
            <input type="month" value={selectedMonth || currentMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
          </div>

          <div className="text-sm text-slate-600 mb-4">{filteredTxns.length} transactions</div>

          <div className="space-y-1">
            {filteredTxns.map(txn => (
              <div key={txn.id} className={`${txn.type === 'income' ? 'bg-green-50' : 'bg-white'} border border-slate-200 px-4 py-3 flex justify-between items-center hover:bg-slate-50 transition-all group`}>
                <div className="flex-1">
                  {txn.type === 'income' ? (
                    <p className="text-sm font-semibold text-green-700">💰 Income</p>
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">{txn.category}</p>
                  )}
                  <p className="text-xs text-slate-500">{txn.date}</p>
                  <p className="text-xs text-slate-600">{txn.details}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${txn.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>{txn.type === 'income' ? '+' : ''}${txn.amount.toFixed(2)}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

  // BANK PAGE
  if (currentPage === 'bank') {
    if (!bankPageUnlocked) {
      return (
        <div className="min-h-screen bg-slate-50">
          <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
              <button onClick={() => handleNavigation('dashboard')}><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Bank Overview</h1>
            </div>
          </div>

          <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-4"><Lock className="w-8 h-8 text-purple-600" /></div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 text-center">Enter PIN to unlock Bank</h2>
            <input type="password" value={bankPin} onChange={(e) => setBankPin(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4 text-center text-2xl tracking-widest" maxLength="4" placeholder="••••" />
            {bankPinError && <p className="text-red-600 text-sm mb-4">{bankPinError}</p>}
            <button onClick={() => {
              if (bankPin === userPin) {
                setBankPageUnlocked(true);
                setBankPin('');
                setBankPinError('');
              } else {
                setBankPinError('Incorrect PIN');
                setBankPin('');
              }
            }} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">Unlock</button>
          </div>

          <div className="text-center pb-8 text-xs text-slate-500 mt-20">Dreamt by CatTree</div>
        </div>
      );
    }

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type !== 'income').reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = bankBalance + totalIncome - totalExpenses;

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => handleNavigation('dashboard')}><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Bank Overview</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-slate-600 text-sm font-semibold mb-2">Current Balance</p>
              <p className="text-3xl font-bold text-blue-600">${currentBalance.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-slate-600 text-sm font-semibold mb-2">Total Income</p>
              <p className="text-3xl font-bold text-green-600">+${totalIncome.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-slate-600 text-sm font-semibold mb-2">Total Expenses</p>
              <p className="text-3xl font-bold text-red-600">-${totalExpenses.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Bank & Income</h2>
            <div className="space-y-2">
              <button onClick={() => setShowBankIncomeEdit(!showBankIncomeEdit)} className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer font-semibold text-sm flex items-center justify-center gap-1"><Lock className="w-4 h-4" />{showBankIncomeEdit ? 'Hide' : 'Unlock'}</button>
              {showBankIncomeEdit && (
                <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <input type="password" value={bankIncomePin} onChange={(e) => setBankIncomePin(e.target.value)} placeholder="Enter PIN to unlock" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs" />
                  {bankIncomeError && <p className="text-red-600 text-xs">{bankIncomeError}</p>}
                  {bankIncomePin === userPin && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 mb-0.5">Monthly Income</label>
                        <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(parseFloat(e.target.value))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 mb-0.5">Starting Balance</label>
                        <input type="number" value={bankBalance} onChange={(e) => setBankBalance(parseFloat(e.target.value))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs" />
                      </div>
                      <button onClick={() => { setShowBankIncomeEdit(false); setBankIncomePin(''); setBankIncomeError(''); }} className="w-full px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer font-semibold text-xs">Done</button>
                    </>
                  )}
                  {bankIncomePin && bankIncomePin !== userPin && <p className="text-red-600 text-xs">Incorrect PIN</p>}
                </div>
              )}
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

  // SETTINGS PAGE
  if (currentPage === 'settings') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => handleNavigation('dashboard')}><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Profile Settings</h2>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Name</label>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Email</label>
                <input type="text" value={userEmail} disabled className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-100 text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Bank & Income</h2>
            <div className="space-y-1.5">
              <button onClick={() => setShowBankIncomeEdit(!showBankIncomeEdit)} className="px-2 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer font-semibold text-xs"><Lock className="w-3 h-3 inline mr-1" />{showBankIncomeEdit ? 'Hide' : 'Unlock'}</button>
              {showBankIncomeEdit && (
                <div className="p-2 bg-slate-50 rounded-lg space-y-1.5">
                  <input type="password" value={bankIncomePin} onChange={(e) => setBankIncomePin(e.target.value)} placeholder="Enter PIN to unlock" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs" />
                  {bankIncomeError && <p className="text-red-600 text-xs">{bankIncomeError}</p>}
                  {bankIncomePin === userPin && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 mb-0.5">Monthly Income</label>
                        <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(parseFloat(e.target.value))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 mb-0.5">Starting Balance</label>
                        <input type="number" value={bankBalance} onChange={(e) => setBankBalance(parseFloat(e.target.value))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs" />
                      </div>
                      <button onClick={() => { setShowBankIncomeEdit(false); setBankIncomePin(''); setBankIncomeError(''); }} className="w-full px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer font-semibold text-xs">Done</button>
                    </>
                  )}
                  {bankIncomePin && bankIncomePin !== userPin && <p className="text-red-600 text-xs">Incorrect PIN</p>}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Category Budgets</h2>
            <div className="space-y-0.5 max-h-40 overflow-y-auto mb-2">
              {categoryOrder.map((cat, idx) => (
                <div key={cat} className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded hover:bg-slate-100 transition-all text-xs">
                  <button onClick={() => handleReorderCategory(idx, 'up')} className="text-purple-600 hover:bg-purple-50 p-0.5 rounded cursor-pointer text-xs" title="Move up">▲</button>
                  <button onClick={() => handleReorderCategory(idx, 'down')} className="text-purple-600 hover:bg-purple-50 p-0.5 rounded cursor-pointer text-xs" title="Move down">▼</button>
                  <span className="flex-1 font-semibold text-slate-900 text-xs">{cat}</span>
                  <input type="number" value={budgets[cat]} onChange={(e) => setBudgets({...budgets, [cat]: parseFloat(e.target.value)})} className="w-16 px-1.5 py-0.5 border border-slate-300 rounded outline-none text-xs font-semibold" />
                  <button onClick={() => { const newBudgets = {...budgets}; delete newBudgets[cat]; setBudgets(newBudgets); setCategoryOrder(categoryOrder.filter(c => c !== cat)); }} className="text-red-600 hover:text-red-800 cursor-pointer text-xs">🗑️</button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddCategory(!showAddCategory)} className="w-full px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer font-semibold text-xs">+ Add Category</button>
            {showAddCategory && (
              <div className="p-2 bg-slate-50 rounded-lg space-y-1.5 mt-2">
                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category name" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs" />
                <input type="number" value={newCategoryBudget} onChange={(e) => setNewCategoryBudget(e.target.value)} placeholder="Budget amount" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs" />
                <div className="flex gap-1.5">
                  <button onClick={() => { if (newCategoryName && newCategoryBudget) { setCategoryOrder([...categoryOrder, newCategoryName]); setBudgets({...budgets, [newCategoryName]: parseFloat(newCategoryBudget)}); setNewCategoryName(''); setNewCategoryBudget(''); setShowAddCategory(false); } }} className="flex-1 px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer font-semibold text-xs">Add</button>
                  <button onClick={() => { setShowAddCategory(false); setNewCategoryName(''); setNewCategoryBudget(''); }} className="flex-1 px-2 py-1.5 bg-slate-400 text-white rounded-lg hover:bg-slate-500 cursor-pointer font-semibold text-xs">Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Change PIN</h2>
            <div className="space-y-1.5">
              <button onClick={() => setShowPinChange(!showPinChange)} className="px-2 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer font-semibold text-xs">{showPinChange ? 'Hide' : 'Show'} PIN Form</button>
              {showPinChange && (
                <div className="p-2 bg-slate-50 rounded-lg space-y-1.5">
                  <input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} placeholder="Current PIN" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs" />
                  <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="New PIN" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs" />
                  <input type="password" value={verifyPin} onChange={(e) => setVerifyPin(e.target.value)} placeholder="Verify PIN" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs" />
                  {pinChangeError && <p className="text-red-600 text-xs">{pinChangeError}</p>}
                  <button onClick={() => { if (currentPin !== userPin) { setPinChangeError('Current PIN is incorrect'); } else if (newPin !== verifyPin) { setPinChangeError('PINs do not match'); } else if (newPin.length < 4) { setPinChangeError('PIN must be at least 4 digits'); } else { setUserPin(newPin); setPinChangeError(''); setShowPinChange(false); setCurrentPin(''); setNewPin(''); setVerifyPin(''); } }} className="w-full px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer font-semibold text-xs">Update PIN</button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Change Password</h2>
            <div className="space-y-1.5">
              <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="px-2 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer font-semibold text-xs">{showPasswordChange ? 'Hide' : 'Show'} Password Form</button>
              {showPasswordChange && (
                <div className="p-2 bg-slate-50 rounded-lg space-y-1.5">
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current Password" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs" />
                  <input type="password" value={verifyPassword} onChange={(e) => setVerifyPassword(e.target.value)} placeholder="Verify Password" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs" />
                  {passwordError && <p className="text-red-600 text-xs">{passwordError}</p>}
                  <button onClick={() => { if (currentPassword !== userPassword) { setPasswordError('Current password is incorrect'); } else if (newPassword !== verifyPassword) { setPasswordError('Passwords do not match'); } else { setUserPassword(newPassword); setPasswordError(''); setShowPasswordChange(false); setCurrentPassword(''); setNewPassword(''); setVerifyPassword(''); } }} className="w-full px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer font-semibold text-xs">Update Password</button>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => handleNavigation('dashboard')} className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-all cursor-pointer text-sm">Apply Settings</button>
        </div>

        <p className="text-center text-slate-400 text-xs py-8">Dreamt by CatTree</p>
      </div>
    );
  }

  return null;
}

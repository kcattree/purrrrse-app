import React, { useState, useMemo, useEffect } from 'react';
import { Settings, Plus, X, TrendingDown, DollarSign, Lock, LogOut, Home, List, Menu, Trash2, Mail, Key, ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
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
  const monthYear = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const fixedExpenses = ['Housing & Rent', 'Utilities & Bills', 'Assets', 'Loan & Insurance', 'Investment'];
  const variableExpenses = ['Groceries', 'Food Delivery', 'Dining Out', 'Party', 'Transportation', 'Miscellaneous', 'Personal Care & Health', 'Bad Debts & Losses'];

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [signupName, setSignupName] = useState('');
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
  const [userCurrency, setUserCurrency] = useState('USD');

  // Bank/Income - start at 0, will load from Firebase if user has set them
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);
  const [bankPageUnlocked, setBankPageUnlocked] = useState(false);
  const [bankIncomeUnlocked, setBankIncomeUnlocked] = useState(false);

  // PIN modals
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalAction, setPinModalAction] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showBankPinModal, setShowBankPinModal] = useState(false);
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
    'Housing & Rent': 0,
    'Utilities & Bills': 0,
    'Groceries': 0,
    'Food Delivery': 0,
    'Dining Out': 0,
    'Party': 0,
    'Assets': 0,
    'Transportation': 0,
    'Miscellaneous': 0,
    'Personal Care & Health': 0,
    'Lifestyle & Entertainment': 0,
    'Loan & Insurance': 0,
    'Investment': 0,
    'Bad Debts & Losses': 0,
  });

  const [categoryOrder, setCategoryOrder] = useState([
    'Housing & Rent', 'Utilities & Bills', 'Groceries', 'Food Delivery',
    'Dining Out', 'Party', 'Assets', 'Transportation', 'Miscellaneous',
    'Personal Care & Health', 'Lifestyle & Entertainment', 'Loan & Insurance', 'Investment', 'Bad Debts & Losses'
  ]);

  // Transactions - starts empty, loaded from Firebase
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    date: currentDate.toISOString().split('T')[0],
    category: '',
    amount: '',
    details: '',
    type: 'expense', // 'expense' or 'income'
  });

  // Edit/Delete
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingTransactionData, setEditingTransactionData] = useState({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  // Filters
  const [dashboardMonth, setDashboardMonth] = useState(currentMonth);
  const [spendingMonth, setSpendingMonth] = useState(currentMonth);
  const [analysisMonth, setAnalysisMonth] = useState(currentMonth);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Load and save transactions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        setUserEmail(user.email);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  // Real-time transactions sync
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

  // Load user settings from Firebase
  useEffect(() => {
    if (!currentUser) return;
    const loadSettings = async () => {
      try {
        const q = query(collection(db, 'userSettings'), where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const settings = snapshot.docs[0].data();
          console.log('Loaded settings from Firebase:', settings);
          if (settings.userName) setUserName(settings.userName);
          if (settings.budgets) {
            // Ensure all category budgets are present, defaulting missing ones to 0
            const completeBudgets = {
              'Housing & Rent': 0,
              'Utilities & Bills': 0,
              'Groceries': 0,
              'Food Delivery': 0,
              'Dining Out': 0,
              'Party': 0,
              'Assets': 0,
              'Transportation': 0,
              'Miscellaneous': 0,
              'Personal Care & Health': 0,
              'Lifestyle & Entertainment': 0,
              'Loan & Insurance': 0,
              'Investment': 0,
              'Bad Debts & Losses': 0,
              ...settings.budgets
            };
            setBudgets(completeBudgets);
          }
          if (settings.categoryOrder) setCategoryOrder(settings.categoryOrder);
          if (settings.monthlyIncome !== undefined) setMonthlyIncome(settings.monthlyIncome);
          if (settings.bankBalance !== undefined) setBankBalance(settings.bankBalance);
          if (settings.userPin) setUserPin(settings.userPin);
          if (settings.userPassword) setUserPassword(settings.userPassword);
          if (settings.userCurrency) setUserCurrency(settings.userCurrency);
        } else {
          console.log('No settings found in Firebase for this user');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, [currentUser]);

  // Don't auto-save - only save when user clicks "Apply Settings"

  const handleNavigation = (page) => {
    setBankPageUnlocked(false);
    setBankIncomeUnlocked(false);
    setCurrentPage(page);
    setShowPageMenu(false);
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

  const handleDeleteTransaction = async () => {
    try {
      await deleteDoc(doc(db, 'transactions', deleteTarget));
      setShowConfirmDelete(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

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

  const handleSaveSettings = async () => {
    try {
      const q = query(collection(db, 'userSettings'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      const dataToSave = {
        userName,
        budgets,
        categoryOrder,
        monthlyIncome,
        bankBalance,
        userPin,
        userPassword,
        userCurrency
      };
      console.log('Saving settings to Firebase:', dataToSave);
      
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(db, 'userSettings', docId), dataToSave);
        console.log('Settings updated in Firebase');
      } else {
        // Create new settings document if it doesn't exist
        await addDoc(collection(db, 'userSettings'), {
          userId: currentUser.uid,
          ...dataToSave
        });
        console.log('Settings created in Firebase');
      }
      setCurrentPage('dashboard');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'AED': 'د.إ',
      'INR': '₹',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CHF': 'CHF',
      'CNY': '¥',
      'SGD': 'S$',
      'HKD': 'HK$',
      'NZD': 'NZ$',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'PLN': 'zł',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'RON': 'lei',
      'BGN': 'лв',
      'HRK': 'kn',
      'RUB': '₽',
      'TRY': '₺',
      'ZAR': 'R',
      'MXN': '$',
      'BRL': 'R$',
      'ARS': '$',
      'CLP': '$',
      'KRW': '₩',
      'THB': '฿',
      'MYR': 'RM',
      'PHP': '₱',
      'IDR': 'Rp',
      'VND': '₫',
      'PKR': '₨',
      'BDT': '৳',
      'LKR': 'Rs',
      'NGN': '₦',
      'GHS': '₵',
      'KES': 'KSh',
      'EGP': 'E£',
      'SAR': '﷼',
      'QAR': 'QR',
      'KWD': 'د.ك',
      'BHD': '.د.ب',
      'OMR': 'ر.ع.',
      'JOD': 'د.ا',
      'LBP': 'ل.ل',
      'ILS': '₪'
    };
    return symbols[currency] || '$';
  };

  const getDashboardStats = (month) => {
    const filtered = transactions.filter(t => t.date.startsWith(month) && t.type !== 'income');
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    return { total };
  };

  const dashboardStats = getDashboardStats(dashboardMonth);
  const dashboardBudgetTotal = Object.values(budgets).reduce((a, b) => a + b, 0);
  const dashboardBudgetLeft = dashboardBudgetTotal - dashboardStats.total;

  // LOADING SCREEN
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

  // LOGIN PAGE
  if (!isLoggedIn) {
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
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" placeholder="••••••••" />
                </div>
                {loginError && <p className="text-red-600 text-sm font-medium">{loginError}</p>}
                <button onClick={async () => { 
                  setLoginError('');
                  try {
                    await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
                  } catch (error) {
                    setLoginError(error.message);
                  }
                }} className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all cursor-pointer text-sm">Sign In</button>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setShowSignup(true); setLoginError(''); setLoginEmail(''); setLoginPassword(''); }} className="flex-1 text-sm text-purple-600 hover:text-purple-800 font-semibold cursor-pointer">Create Account</button>
                  <button onClick={() => { setShowForgotPassword(true); setLoginError(''); setLoginEmail(''); }} className="flex-1 text-sm text-purple-600 hover:text-purple-800 font-semibold cursor-pointer">Forgot Password?</button>
                </div>
              </div>
            ) : showSignup ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Name</label>
                  <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Email</label>
                  <input type="text" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" placeholder="your@email.com" />
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
                <button onClick={async () => { 
                  setLoginError('');
                  if (!signupName || !signupEmail || !signupPassword || !signupPasswordConfirm) { 
                    setLoginError('Please fill all fields'); 
                  } else if (signupPassword !== signupPasswordConfirm) { 
                    setLoginError('Passwords do not match'); 
                  } else {
                    try {
                      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
                      // Create initial empty budgets (all 0)
                      const initialBudgets = {
                        'Housing & Rent': 0,
                        'Utilities & Bills': 0,
                        'Groceries': 0,
                        'Food Delivery': 0,
                        'Dining Out': 0,
                        'Party': 0,
                        'Assets': 0,
                        'Transportation': 0,
                        'Miscellaneous': 0,
                        'Personal Care & Health': 0,
                        'Lifestyle & Entertainment': 0,
                        'Loan & Insurance': 0,
                        'Investment': 0,
                        'Bad Debts & Losses': 0,
                      };
                      const initialCategories = [
                        'Housing & Rent', 'Utilities & Bills', 'Groceries', 'Food Delivery',
                        'Dining Out', 'Party', 'Assets', 'Transportation', 'Miscellaneous',
                        'Personal Care & Health', 'Lifestyle & Entertainment', 'Loan & Insurance', 'Investment', 'Bad Debts & Losses'
                      ];
                      await addDoc(collection(db, 'userSettings'), {
                        userId: userCredential.user.uid,
                        userName: signupName,
                        budgets: initialBudgets,
                        categoryOrder: initialCategories,
                        monthlyIncome: 0,
                        bankBalance: 0,
                        userPin: '1234',
                        userPassword: 'admin',
                        userCurrency: 'USD'
                      });
                      setShowSignup(false);
                      setSignupName('');
                    } catch (error) {
                      setLoginError(error.message);
                    }
                  }
                }} className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all cursor-pointer text-sm">Create Account</button>
                <button onClick={() => { setShowSignup(false); setLoginError(''); setSignupName(''); setSignupEmail(''); setSignupPassword(''); setSignupPasswordConfirm(''); }} className="w-full text-sm text-slate-600 hover:text-slate-900 font-semibold cursor-pointer">Back to Login</button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">Enter your email to reset your password</p>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Email</label>
                  <input type="text" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" placeholder="abc@cba.com" />
                </div>
                {loginError && <p className="text-red-600 text-sm font-medium">{loginError}</p>}
                <button onClick={async () => { 
                  if (!forgotEmail) { 
                    setLoginError('Please enter your email'); 
                  } else { 
                    try {
                      await sendPasswordResetEmail(auth, forgotEmail);
                      setLoginError('');
                      alert('Password reset email sent to ' + forgotEmail + '. Please check your email to reset your password.');
                      setShowForgotPassword(false);
                      setForgotEmail('');
                    } catch (error) {
                      setLoginError(error.message);
                    }
                  }
                }} className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all cursor-pointer text-sm">Send Reset Link</button>
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
          <p className="text-slate-600 mb-6">Are you sure you want to delete this {deleteType}?</p>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirmDelete(false)} className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 cursor-pointer transition-all">Cancel</button>
            <button onClick={() => { if (deleteType === 'transaction') { setTransactions(transactions.filter(t => t.id !== deleteTarget)); } setShowConfirmDelete(false); setDeleteTarget(null); setDeleteType(null); }} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 cursor-pointer transition-all">Delete</button>
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
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Type</label>
              <div className="flex gap-2">
                <button onClick={() => setFormData({...formData, type: 'expense', category: ''})} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${formData.type === 'expense' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Expense</button>
                <button onClick={() => setFormData({...formData, type: 'income', category: 'Income'})} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${formData.type === 'income' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Income</button>
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
              <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Details</label>
              <input type="text" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder={formData.type === 'income' ? 'What was this income from?' : 'What was this for?'} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddTransactionModal(false)} className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-lg font-semibold text-sm text-slate-900 hover:bg-slate-50 cursor-pointer transition-all">Cancel</button>
              <button onClick={() => { if (formData.type === 'expense' && (!formData.category || !formData.amount)) { alert('Please fill all fields'); return; } if (!formData.amount) { alert('Please enter amount'); return; } setTransactions([...transactions, { ...formData, id: Date.now(), amount: parseFloat(formData.amount) }]); setFormData({ date: currentDate.toISOString().split('T')[0], category: '', amount: '', details: '', type: 'expense' }); setShowAddTransactionModal(false); }} className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg cursor-pointer transition-all">Add</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BANK PIN MODAL
  if (showBankPinModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl p-5 max-w-sm w-full">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Bank Overview</h2>
          <p className="text-slate-600 text-xs mb-4">Enter PIN to access</p>
          <input type="password" value={bankPin} onChange={(e) => setBankPin(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { if (bankPin === userPin) { setBankPageUnlocked(true); handleNavigation('bank'); setShowBankPinModal(false); setBankPin(''); setBankPinError(''); } else { setBankPinError('Incorrect PIN'); setBankPin(''); } } }} className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none mb-3" placeholder="••••" autoFocus />
          {bankPinError && <p className="text-red-600 text-xs font-medium mb-3">{bankPinError}</p>}
          <div className="flex gap-2">
            <button onClick={(e) => { e.preventDefault(); setShowBankPinModal(false); setBankPin(''); setBankPinError(''); }} className="flex-1 px-3 py-2 text-sm border-2 border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 cursor-pointer transition-all">Cancel</button>
            <button onClick={(e) => { e.preventDefault(); if (bankPin === userPin) { setBankPageUnlocked(true); handleNavigation('bank'); setShowBankPinModal(false); setBankPin(''); setBankPinError(''); } else { setBankPinError('Incorrect PIN'); setBankPin(''); } }} className="flex-1 px-3 py-2 text-sm bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 cursor-pointer transition-all">Submit</button>
          </div>
        </div>
      </div>
    );
  }

  // PAGE MENU
  if (showPageMenu) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-start justify-end p-4 z-50" onClick={() => setShowPageMenu(false)}>
        <div className="bg-white rounded-lg shadow-2xl max-w-xs w-full mt-14" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Navigation</h2>
            <button onClick={() => setShowPageMenu(false)} className="text-slate-600 hover:text-slate-900 cursor-pointer p-0.5"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-2.5 space-y-1">
            <button onClick={() => { handleNavigation('dashboard'); }} className="w-full text-left px-3 py-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-all font-semibold text-sm">📊 Dashboard</button>
            <button onClick={() => { setCurrentPage('spending'); setShowPageMenu(false); }} className="w-full text-left px-3 py-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-all font-semibold text-sm">📈 Spending</button>
            <button onClick={() => { setCurrentPage('analysis'); setShowPageMenu(false); }} className="w-full text-left px-3 py-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-all font-semibold text-sm">📉 Analysis</button>
            <button onClick={() => { setCurrentPage('history'); setShowPageMenu(false); }} className="w-full text-left px-3 py-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-all font-semibold text-sm">📋 History</button>
            <button onClick={() => { if (!bankPageUnlocked) { setShowBankPinModal(true); setShowPageMenu(false); } else { handleNavigation('bank'); } }} className="w-full text-left px-3 py-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-all font-semibold text-sm">🏦 Bank</button>
            <button onClick={() => { setCurrentPage('settings'); setShowPageMenu(false); }} className="w-full text-left px-3 py-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-all font-semibold text-sm">⚙️ Settings</button>
            <button onClick={() => { setShowAddTransactionModal(true); setShowPageMenu(false); }} className="w-full text-left px-3 py-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-all font-semibold text-sm">➕ Add Transaction</button>
            <hr className="my-1.5" />
            <button onClick={() => { handleLogout(); setShowPageMenu(false); }} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all font-semibold text-sm">🚪 Logout</button>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  if (currentPage === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg width="40" height="40" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
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
              <h1 className="text-2xl font-bold text-slate-900">Purrrrse</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Hello {userName}</span>
              <button onClick={handleLogout} className="text-slate-600 hover:text-slate-900 cursor-pointer text-sm font-semibold">Logout</button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6"><label className="block text-sm font-semibold text-slate-900 mb-2">Select Month</label><input type="month" value={dashboardMonth} onChange={(e) => setDashboardMonth(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none max-w-xs" /></div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-red-50 p-6 rounded-xl border border-red-100"><p className="text-slate-600 text-sm mb-2">Total Spent</p><p className="text-3xl font-bold text-red-600">{getCurrencySymbol(userCurrency)}{dashboardStats.total.toFixed(2)}</p></div>
            <div className={`p-6 rounded-xl border ${dashboardBudgetLeft >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}><p className="text-slate-600 text-sm mb-2">Budget Left</p><p className={`text-3xl font-bold ${dashboardBudgetLeft >= 0 ? 'text-green-600' : 'text-red-600'}`}>{getCurrencySymbol(userCurrency)}{dashboardBudgetLeft.toFixed(2)}</p></div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            <button onClick={() => { setCurrentPage('spending'); setShowPageMenu(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-all cursor-pointer"><TrendingDown className="w-6 h-6 text-purple-600" /><span className="text-xs font-semibold text-purple-900">Spending</span></button>
            <button onClick={() => { setCurrentPage('analysis'); setShowPageMenu(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all cursor-pointer"><TrendingDown className="w-6 h-6 text-red-600" /><span className="text-xs font-semibold text-red-900">Analysis</span></button>
            <button onClick={() => { setCurrentPage('history'); setShowPageMenu(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-all cursor-pointer"><List className="w-6 h-6 text-green-600" /><span className="text-xs font-semibold text-green-900">History</span></button>
            <button onClick={() => { if (!bankPageUnlocked) { setShowBankPinModal(true); } else { handleNavigation('bank'); } }} className="flex flex-col items-center justify-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-all cursor-pointer"><DollarSign className="w-6 h-6 text-orange-600" /><span className="text-xs font-semibold text-orange-900">Bank</span><Lock className="w-3 h-3 text-orange-600" /></button>
            <button onClick={() => { setCurrentPage('settings'); setShowPageMenu(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-200 hover:bg-slate-300 rounded-xl border border-slate-300 transition-all cursor-pointer"><Settings className="w-6 h-6 text-slate-600" /><span className="text-xs font-semibold text-slate-900">Settings</span></button>
          </div>
          <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30"><Plus className="w-8 h-8" /></button>
        </div>
        <p className="text-center text-slate-400 text-xs py-8">Dreamt by CatTree</p>
      </div>
    );
  }

  // SPENDING
  if (currentPage === 'spending') {
    const spendingTransactions = transactions.filter(t => t.date.startsWith(spendingMonth) && t.type !== 'income');
    const spendingData = {};
    spendingTransactions.forEach(t => { spendingData[t.category] = (spendingData[t.category] || 0) + t.amount; });
    // Filter out negative amounts for pie chart display
    const pieChartData = Object.entries(spendingData).filter(([_, val]) => val > 0).reduce((obj, [key, val]) => {obj[key] = val; return obj;}, {});
    const totalSpending = Object.values(pieChartData).reduce((a, b) => a + b, 0);
    const COLORS = ['#9b59b6', '#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#e67e22', '#1abc9c', '#34495e', '#d35400', '#c0392b', '#16a085', '#8e44ad'];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => handleNavigation('dashboard')} className="text-slate-600 hover:text-slate-900 cursor-pointer p-1 hover:bg-slate-100 rounded-lg transition-all"><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Spending by Category</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)} className="text-slate-600 hover:text-slate-900 cursor-pointer"><Menu className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="mb-3"><label className="block text-xs font-semibold text-slate-900 mb-1">Select Month</label><input type="month" value={spendingMonth} onChange={(e) => setSpendingMonth(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none max-w-xs" /></div>
          <div className="bg-white p-5 rounded-lg border border-slate-200">
            {Object.keys(pieChartData).length > 0 ? (
              <div className="flex flex-col lg:flex-row gap-2">
                <div className="flex-1 flex justify-center">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie 
                        data={Object.entries(pieChartData).map(([cat, val]) => ({name: cat, value: val}))} 
                        cx="50%" 
                        cy="50%" 
                        labelLine={false} 
                        label={({value}) => `${((value/totalSpending)*100).toFixed(0)}%`}
                        outerRadius={100} 
                        fill="#8884d8" 
                        dataKey="value"
                      >
                        {Object.entries(pieChartData).map((_, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => `${getCurrencySymbol(userCurrency)}${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-0.5 overflow-y-auto max-h-80">
                  {Object.entries(spendingData).map(([cat, val], idx) => (
                    <div key={cat} className={`flex items-center gap-2 p-1 rounded text-xs ${val < 0 ? 'bg-blue-50' : 'bg-slate-50'}`}>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor: val < 0 ? '#3b82f6' : COLORS[idx % COLORS.length]}}></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{cat}</p>
                        <p className={`${val < 0 ? 'text-blue-600' : 'text-slate-600'}`}>{getCurrencySymbol(userCurrency)}{val.toFixed(2)}</p>
                      </div>
                      <p className={`font-bold flex-shrink-0 ${val < 0 ? 'text-blue-700' : 'text-slate-700'}`}>{val > 0 ? `${((val/totalSpending)*100).toFixed(0)}%` : 'Refund'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-500 text-sm">No spending data</p>
            )}
          </div>
        </div>
        <p className="text-center text-slate-400 text-xs py-8">Dreamt by CatTree</p>
        {currentPage !== 'settings' && (
          <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30"><Plus className="w-8 h-8" /></button>
        )}
      </div>
    );
  }

  // ANALYSIS
  if (currentPage === 'analysis') {
    const analysisTransactions = transactions.filter(t => t.date.startsWith(analysisMonth) && t.type !== 'income');
    const categoryTotals = {};
    analysisTransactions.forEach(t => { categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount; });
    let categoriesWithTransactions = Object.keys(categoryTotals).filter(cat => categoryTotals[cat] !== 0);
    
    // Sort by categoryOrder if available
    categoriesWithTransactions = categoriesWithTransactions.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);
      return aIndex - bIndex;
    });

    const handleReorderCategory = (cat, direction) => {
      const idx = categoriesWithTransactions.indexOf(cat);
      if ((direction === 'up' && idx > 0) || (direction === 'down' && idx < categoriesWithTransactions.length - 1)) {
        const newOrder = [...categoryOrder];
        const cat1 = categoriesWithTransactions[idx];
        const cat2 = categoriesWithTransactions[idx + (direction === 'up' ? -1 : 1)];
        const idx1 = newOrder.indexOf(cat1);
        const idx2 = newOrder.indexOf(cat2);
        [newOrder[idx1], newOrder[idx2]] = [newOrder[idx2], newOrder[idx1]];
        setCategoryOrder(newOrder);
      }
    };

    const CATEGORY_COLORS = {
      'Housing & Rent': 'bg-blue-50 border-blue-100',
      'Utilities & Bills': 'bg-cyan-50 border-cyan-100',
      'Groceries': 'bg-green-50 border-green-100',
      'Food Delivery': 'bg-orange-50 border-orange-100',
      'Dining Out': 'bg-red-50 border-red-100',
      'Party': 'bg-pink-50 border-pink-100',
      'Assets': 'bg-purple-50 border-purple-100',
      'Transportation': 'bg-yellow-50 border-yellow-100',
      'Miscellaneous': 'bg-slate-50 border-slate-200',
      'Personal Care & Health': 'bg-emerald-50 border-emerald-100',
      'Lifestyle & Entertainment': 'bg-indigo-50 border-indigo-100',
      'Loan & Insurance': 'bg-violet-50 border-violet-100',
      'Investment': 'bg-amber-50 border-amber-100',
      'Bad Debts & Losses': 'bg-rose-50 border-rose-100',
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => handleNavigation('dashboard')} className="text-slate-600 hover:text-slate-900 cursor-pointer p-1 hover:bg-slate-100 rounded-lg transition-all"><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Category Analysis</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)} className="text-slate-600 hover:text-slate-900 cursor-pointer"><Menu className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="mb-3"><label className="block text-xs font-semibold text-slate-900 mb-1">Select Month</label><input type="month" value={analysisMonth} onChange={(e) => setAnalysisMonth(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none max-w-xs" /></div>
          <div className="space-y-1.5">
            {categoriesWithTransactions.length > 0 ? categoriesWithTransactions.map((cat, idx) => {
              const spent = categoryTotals[cat] || 0;
              const budget = budgets[cat] || 0;
              const pct = budget > 0 ? (spent / budget) * 100 : 0;
              const colorClass = CATEGORY_COLORS[cat] || 'bg-slate-50 border-slate-200';
              return (
                <div key={cat} className={`p-2.5 rounded-lg border hover:shadow-md transition-all flex items-start gap-1.5 ${colorClass}`}>
                  <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                    <button onClick={() => handleReorderCategory(cat, 'up')} disabled={idx === 0} className={`text-xs p-0.5 rounded hover:bg-white transition-all ${idx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900 cursor-pointer'}`}>▲</button>
                    <button onClick={() => handleReorderCategory(cat, 'down')} disabled={idx === categoriesWithTransactions.length - 1} className={`text-xs p-0.5 rounded hover:bg-white transition-all ${idx === categoriesWithTransactions.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900 cursor-pointer'}`}>▼</button>
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => { setSelectedCategory(cat); setCurrentPage('category-detail'); }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-900 text-xs">{cat}</span>
                      <span className="text-xs font-bold text-slate-600 bg-white px-1.5 py-0 rounded">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                      <div className="h-full bg-gradient-to-r from-purple-600 to-orange-500 rounded-full" style={{width: `${Math.min(pct, 100)}%`}} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{getCurrencySymbol(userCurrency)}{spent.toFixed(2)}</span>
                      <span className="text-slate-500">of {getCurrencySymbol(userCurrency)}{budget.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            }) : (<p className="text-center text-slate-500 py-4 text-sm">No transactions for this month</p>)}
          </div>
        </div>
        <p className="text-center text-slate-400 text-xs py-8">Dreamt by CatTree</p>
        {currentPage !== 'settings' && (
          <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30"><Plus className="w-8 h-8" /></button>
        )}
      </div>
    );
  }

  // CATEGORY DETAIL
  if (currentPage === 'category-detail' && selectedCategory) {
    const catTransactions = transactions.filter(t => t.category === selectedCategory && t.type !== 'income').sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const CATEGORY_COLORS = {
      'Housing & Rent': 'text-blue-700',
      'Utilities & Bills': 'text-cyan-700',
      'Groceries': 'text-green-700',
      'Food Delivery': 'text-orange-700',
      'Dining Out': 'text-red-700',
      'Party': 'text-pink-700',
      'Assets': 'text-purple-700',
      'Transportation': 'text-yellow-700',
      'Miscellaneous': 'text-slate-700',
      'Personal Care & Health': 'text-emerald-700',
      'Lifestyle & Entertainment': 'text-indigo-700',
      'Loan & Insurance': 'text-violet-700',
      'Investment': 'text-amber-700',
      'Bad Debts & Losses': 'text-rose-700',
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentPage('analysis')} className="text-slate-600 hover:text-slate-900 cursor-pointer p-1 hover:bg-slate-100 rounded-lg transition-all"><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">{selectedCategory}</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)} className="text-slate-600 hover:text-slate-900 cursor-pointer"><Menu className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            {catTransactions.length} transaction{catTransactions.length !== 1 ? 's' : ''}
          </div>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {catTransactions.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {catTransactions.map((t) => {
                  const colorClass = CATEGORY_COLORS[t.category] || 'text-slate-700';
                  const dateObj = new Date(t.date);
                  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <div key={t.id} className="px-3 py-2 hover:bg-slate-50 transition-all flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 text-sm">
                      <div className="font-semibold text-slate-700 text-xs lg:w-20">{formattedDate}</div>
                      <div className="lg:w-32">
                        <p className={`font-semibold text-xs ${colorClass}`}>{t.category}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600">{t.details}</p>
                      </div>
                      <div className="flex items-center gap-2 lg:flex-shrink-0">
                        <p className="font-bold lg:w-16 lg:text-right text-sm text-slate-900">{getCurrencySymbol(userCurrency)}{t.amount.toFixed(2)}</p>
                        <div className="flex gap-0.5 hidden lg:flex">
                          <button onClick={() => { setEditingTransactionData(t); setEditingTransaction(t.id); }} className="text-purple-600 hover:text-purple-800 cursor-pointer p-0.5 hover:bg-purple-50 rounded transition-all">✏️</button>
                          <button onClick={() => { setDeleteTarget(t.id); setDeleteType('transaction'); setShowConfirmDelete(true); }} className="text-red-600 hover:text-red-800 cursor-pointer p-0.5 hover:bg-red-50 rounded transition-all">🗑️</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-slate-500 text-xs">No transactions in this category</p>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-slate-400 text-xs py-8">Dreamt by CatTree</p>
        {currentPage !== 'settings' && (
          <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30"><Plus className="w-8 h-8" /></button>
        )}
      </div>
    );
  }

  // HISTORY
  if (currentPage === 'history') {
    let historyTransactions = transactions;
    
    if (selectedMonth) {
      historyTransactions = historyTransactions.filter(t => t.date.startsWith(selectedMonth));
    }
    if (startDate && endDate) {
      historyTransactions = historyTransactions.filter(t => t.date >= startDate && t.date <= endDate);
    }

    // Sort by date descending
    historyTransactions = [...historyTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    const CATEGORY_COLORS = {
      'Housing & Rent': 'text-blue-700',
      'Utilities & Bills': 'text-cyan-700',
      'Groceries': 'text-green-700',
      'Food Delivery': 'text-orange-700',
      'Dining Out': 'text-red-700',
      'Party': 'text-pink-700',
      'Assets': 'text-purple-700',
      'Transportation': 'text-yellow-700',
      'Miscellaneous': 'text-slate-700',
      'Personal Care & Health': 'text-emerald-700',
      'Lifestyle & Entertainment': 'text-indigo-700',
      'Loan & Insurance': 'text-violet-700',
      'Investment': 'text-amber-700',
      'Bad Debts & Losses': 'text-rose-700',
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => handleNavigation('dashboard')} className="text-slate-600 hover:text-slate-900 cursor-pointer p-1 hover:bg-slate-100 rounded-lg transition-all"><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)} className="text-slate-600 hover:text-slate-900 cursor-pointer"><Menu className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="mb-4 flex gap-3 flex-wrap items-end justify-between">
            <div className="flex gap-3 flex-wrap">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Month</label>
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">From</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">To</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {historyTransactions.length} transaction{historyTransactions.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {historyTransactions.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {historyTransactions.map((t) => {
                  const isIncome = t.type === 'income';
                  const colorClass = isIncome ? 'text-green-700' : (CATEGORY_COLORS[t.category] || 'text-slate-700');
                  const dateObj = new Date(t.date);
                  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <div key={t.id} className="px-3 py-2 hover:bg-slate-50 transition-all flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 text-sm">
                      <div className="font-semibold text-slate-700 text-xs lg:w-20">{formattedDate}</div>
                      <div className="lg:w-32">
                        <p className={`font-semibold text-xs ${colorClass}`}>{isIncome ? '💰 Income' : t.category}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600">{t.details}</p>
                      </div>
                      <div className="flex items-center gap-2 lg:flex-shrink-0">
                        <p className={`font-bold lg:w-16 lg:text-right text-sm ${isIncome ? 'text-green-600' : 'text-slate-900'}`}>{getCurrencySymbol(userCurrency)}{isIncome ? '+' : ''}{t.amount.toFixed(2)}</p>
                        <div className="flex gap-0.5 hidden lg:flex">
                          <button onClick={() => { setEditingTransactionData(t); setEditingTransaction(t.id); }} className="text-purple-600 hover:text-purple-800 cursor-pointer p-0.5 hover:bg-purple-50 rounded transition-all">✏️</button>
                          <button onClick={() => { setDeleteTarget(t.id); setDeleteType('transaction'); setShowConfirmDelete(true); }} className="text-red-600 hover:text-red-800 cursor-pointer p-0.5 hover:bg-red-50 rounded transition-all">🗑️</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-slate-500 text-xs">No transactions found</p>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-slate-400 text-xs py-8">Dreamt by CatTree</p>
        {currentPage !== 'settings' && (
          <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30"><Plus className="w-8 h-8" /></button>
        )}
      </div>
    );
  }

  // BANK
  if (currentPage === 'bank') {
    // Get all months with transactions
    const allMonths = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort();
    
    // Find current month and previous month
    const currentMonthStr = dashboardMonth;
    const currentMonthIndex = allMonths.indexOf(currentMonthStr);
    const previousMonth = currentMonthIndex > 0 ? allMonths[currentMonthIndex - 1] : null;
    
    // Calculate previous month's ending balance
    let startingBalanceForCurrentMonth = 0;
    if (previousMonth) {
      const prevMonthTransactions = transactions.filter(t => t.date.startsWith(previousMonth));
      const prevIncome = prevMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const prevExpenses = prevMonthTransactions.filter(t => t.type !== 'income').reduce((sum, t) => sum + t.amount, 0);
      startingBalanceForCurrentMonth = prevIncome - prevExpenses; // Previous month's balance becomes this month's starting
    }
    
    // Calculate current month's income and expenses
    const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonthStr));
    const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = monthlyTransactions.filter(t => t.type !== 'income').reduce((sum, t) => sum + t.amount, 0);
    
    // Current balance = starting balance + this month's income - this month's expenses
    const monthCurrentBalance = startingBalanceForCurrentMonth + monthlyIncome - monthlyExpenses;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => { handleNavigation('dashboard'); setBankPageUnlocked(false); }} className="text-slate-600 hover:text-slate-900 cursor-pointer p-1 hover:bg-slate-100 rounded-lg transition-all"><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Bank Overview</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)} className="text-slate-600 hover:text-slate-900 cursor-pointer"><Menu className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-blue-700 text-xs font-semibold mb-0.5">Monthly Income</p>
                  <p className="text-3xl font-bold text-blue-900">{getCurrencySymbol(userCurrency)}{monthlyIncome.toFixed(2)}</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-purple-700 text-xs font-semibold mb-0.5">Budget Allocated</p>
                  <p className="text-3xl font-bold text-purple-900">{getCurrencySymbol(userCurrency)}{dashboardBudgetTotal.toFixed(2)}</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
              <p className="text-xs text-purple-600">{monthlyIncome > 0 ? ((dashboardBudgetTotal / monthlyIncome) * 100).toFixed(0) : '0'}% of income</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <p className="text-orange-700 text-xs font-semibold mb-0.5">Starting Balance</p>
                    <p className="text-2xl font-bold text-orange-900">{getCurrencySymbol(userCurrency)}{startingBalanceForCurrentMonth.toFixed(2)}</p>
                  </div>
                  <div className="text-2xl">📈</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <p className="text-green-700 text-xs font-semibold mb-0.5">Current Balance</p>
                    <p className="text-2xl font-bold text-green-900">{getCurrencySymbol(userCurrency)}{monthCurrentBalance.toFixed(2)}</p>
                  </div>
                  <div className="text-2xl">💳</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <p className="text-slate-600 text-xs mb-3 font-semibold">Monthly Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-700">Total Income</span>
                  <span className="font-bold text-green-600">+{getCurrencySymbol(userCurrency)}{monthlyIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Total Spent</span>
                  <span className="font-bold text-red-600">-{getCurrencySymbol(userCurrency)}{monthlyExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Remaining Budget</span>
                  <span className={`font-bold ${(dashboardBudgetTotal - monthlyExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{getCurrencySymbol(userCurrency)}{(dashboardBudgetTotal - monthlyExpenses).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Balance Change</span>
                  <span className={`font-bold ${(monthlyIncome - monthlyExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(monthlyIncome - monthlyExpenses) >= 0 ? '+' : ''}{getCurrencySymbol(userCurrency)}{(monthlyIncome - monthlyExpenses).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold">
                  <span className="text-slate-700">Usage</span>
                  <span className="text-slate-900">{dashboardBudgetTotal > 0 ? ((monthlyExpenses / dashboardBudgetTotal) * 100).toFixed(0) : '0'}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-400 text-xs py-8">Dreamt by CatTree</p>
        {currentPage !== 'settings' && (
          <button onClick={() => setShowAddTransactionModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer z-30"><Plus className="w-8 h-8" /></button>
        )}
      </div>
    );
  }

  // SETTINGS
  if (currentPage === 'settings') {
    const handleReorderCategory = (index, direction) => {
      const newOrder = [...categoryOrder];
      if (direction === 'up' && index > 0) {
        [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        setCategoryOrder(newOrder);
      } else if (direction === 'down' && index < newOrder.length - 1) {
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        setCategoryOrder(newOrder);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => handleNavigation('dashboard')} className="text-slate-600 hover:text-slate-900 cursor-pointer p-1 hover:bg-slate-100 rounded-lg transition-all"><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            </div>
            <button onClick={() => setShowPageMenu(!showPageMenu)} className="text-slate-600 hover:text-slate-900 cursor-pointer"><Menu className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 mb-2">Category Budgets</h2>
              <div className="space-y-0.5 max-h-40 overflow-y-auto mb-2">
                {categoryOrder.map((cat, idx) => (
                  <div key={cat} className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded hover:bg-slate-100 transition-all text-xs">
                    <button onClick={() => handleReorderCategory(idx, 'up')} className="text-purple-600 hover:bg-purple-50 p-0.5 rounded cursor-pointer text-xs" title="Move up">▲</button>
                    <button onClick={() => handleReorderCategory(idx, 'down')} className="text-purple-600 hover:bg-purple-50 p-0.5 rounded cursor-pointer text-xs" title="Move down">▼</button>
                    <span className="flex-1 font-semibold text-slate-900 text-xs">{cat}</span>
                    <input type="number" value={budgets[cat] || 0} onChange={(e) => setBudgets({...budgets, [cat]: parseFloat(e.target.value) || 0})} className="w-16 px-1.5 py-0.5 border border-slate-300 rounded outline-none text-xs font-semibold" />
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
                    <button onClick={() => { if (currentPin !== userPin) { setPinChangeError('Current PIN is incorrect'); } else if (newPin !== verifyPin) { setPinChangeError('PINs do not match'); } else if (newPin.length < 4) { setPinChangeError('PIN must be at least 4 digits'); } else { setUserPin(newPin); setPinChangeError(''); setShowPinChange(false); setCurrentPin(''); setNewPin(''); setVerifyPin(''); } }} className="w-full px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer font-semibold text-sm">Update PIN</button>
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
                    <button onClick={async () => { 
                      if (!currentPassword || !newPassword || !verifyPassword) {
                        setPasswordError('Please fill all fields');
                      } else if (newPassword !== verifyPassword) {
                        setPasswordError('Passwords do not match');
                      } else if (newPassword.length < 6) {
                        setPasswordError('Password must be at least 6 characters');
                      } else {
                        try {
                          // Re-authenticate user with current password
                          const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
                          await reauthenticateWithCredential(currentUser, credential);
                          
                          // Update password in Firebase Auth
                          await updatePassword(currentUser, newPassword);
                          
                          setPasswordError('');
                          alert('Password updated successfully!');
                          setShowPasswordChange(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setVerifyPassword('');
                        } catch (error) {
                          setPasswordError(error.message || 'Failed to update password');
                        }
                      }
                    }} className="w-full px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer font-semibold text-sm">Update Password</button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Profile Settings</h2>
              <div className="space-y-1.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-0.5">Name</label>
                  <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-0.5">Email</label>
                  <input type="text" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-0.5">Currency</label>
                  <select value={userCurrency} onChange={(e) => setUserCurrency(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs">
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                    <option value="GBP">GBP - British Pound (£)</option>
                    <option value="AED">AED - UAE Dirham (د.إ)</option>
                    <option value="INR">INR - Indian Rupee (₹)</option>
                    <option value="CAD">CAD - Canadian Dollar (C$)</option>
                    <option value="AUD">AUD - Australian Dollar (A$)</option>
                    <option value="JPY">JPY - Japanese Yen (¥)</option>
                    <option value="CHF">CHF - Swiss Franc (CHF)</option>
                    <option value="CNY">CNY - Chinese Yuan (¥)</option>
                    <option value="SGD">SGD - Singapore Dollar (S$)</option>
                    <option value="HKD">HKD - Hong Kong Dollar (HK$)</option>
                    <option value="NZD">NZD - New Zealand Dollar (NZ$)</option>
                    <option value="SEK">SEK - Swedish Krona (kr)</option>
                    <option value="NOK">NOK - Norwegian Krone (kr)</option>
                    <option value="DKK">DKK - Danish Krone (kr)</option>
                    <option value="PLN">PLN - Polish Zloty (zł)</option>
                    <option value="CZK">CZK - Czech Koruna (Kč)</option>
                    <option value="HUF">HUF - Hungarian Forint (Ft)</option>
                    <option value="RON">RON - Romanian Leu (lei)</option>
                    <option value="BGN">BGN - Bulgarian Lev (лв)</option>
                    <option value="HRK">HRK - Croatian Kuna (kn)</option>
                    <option value="RUB">RUB - Russian Ruble (₽)</option>
                    <option value="TRY">TRY - Turkish Lira (₺)</option>
                    <option value="ZAR">ZAR - South African Rand (R)</option>
                    <option value="MXN">MXN - Mexican Peso ($)</option>
                    <option value="BRL">BRL - Brazilian Real (R$)</option>
                    <option value="ARS">ARS - Argentine Peso ($)</option>
                    <option value="CLP">CLP - Chilean Peso ($)</option>
                    <option value="KRW">KRW - South Korean Won (₩)</option>
                    <option value="THB">THB - Thai Baht (฿)</option>
                    <option value="MYR">MYR - Malaysian Ringgit (RM)</option>
                    <option value="PHP">PHP - Philippine Peso (₱)</option>
                    <option value="IDR">IDR - Indonesian Rupiah (Rp)</option>
                    <option value="VND">VND - Vietnamese Dong (₫)</option>
                    <option value="PKR">PKR - Pakistani Rupee (₨)</option>
                    <option value="BDT">BDT - Bangladeshi Taka (৳)</option>
                    <option value="LKR">LKR - Sri Lankan Rupee (Rs)</option>
                    <option value="NGN">NGN - Nigerian Naira (₦)</option>
                    <option value="GHS">GHS - Ghanaian Cedi (₵)</option>
                    <option value="KES">KES - Kenyan Shilling (KSh)</option>
                    <option value="EGP">EGP - Egyptian Pound (E£)</option>
                    <option value="SAR">SAR - Saudi Riyal (﷼)</option>
                    <option value="QAR">QAR - Qatari Riyal (QR)</option>
                    <option value="KWD">KWD - Kuwaiti Dinar (د.ك)</option>
                    <option value="BHD">BHD - Bahraini Dinar (.د.ب)</option>
                    <option value="OMR">OMR - Omani Rial (ر.ع.)</option>
                    <option value="JOD">JOD - Jordanian Dinar (د.ا)</option>
                    <option value="LBP">LBP - Lebanese Pound (ل.ل)</option>
                    <option value="ILS">ILS - Israeli Shekel (₪)</option>
                  </select>
                </div>
              </div>
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-all cursor-pointer text-sm">Apply Settings</button>
          </div>
        </div>
        <p className="text-center text-slate-400 text-xs py-8">Dreamt by CatTree</p>
      </div>
    );
  }

  // DELETE CONFIRMATION (moved to top)

  return null;
}

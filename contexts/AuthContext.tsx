import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Member, MemberRole, PlanType, Plan, PaymentRecord, UsageRecord, AdminStats } from '../types';

// ===== Plans Configuration =====
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    nameZh: '免费版',
    price: 0,
    priceYearly: 0,
    credits: 10,
    features: ['10 credits/month', 'Basic models', 'Standard resolution', 'Community support'],
    featuresZh: ['每月10次生成', '基础模型', '标准分辨率', '社区支持'],
  },
  {
    id: 'basic',
    name: 'Basic',
    nameZh: '基础版',
    price: 9.9,
    priceYearly: 99,
    credits: 100,
    features: ['100 credits/month', 'All models', 'HD resolution', 'Email support'],
    featuresZh: ['每月100次生成', '全部模型', '高清分辨率', '邮件支持'],
  },
  {
    id: 'pro',
    name: 'Pro',
    nameZh: '专业版',
    price: 29.9,
    priceYearly: 299,
    credits: 500,
    features: ['500 credits/month', 'All models', '4K resolution', 'Priority support', 'API access'],
    featuresZh: ['每月500次生成', '全部模型', '4K分辨率', '优先支持', 'API访问'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameZh: '企业版',
    price: 99.9,
    priceYearly: 999,
    credits: 2000,
    features: ['2000 credits/month', 'All features', 'Custom models', 'Dedicated support', 'White-label'],
    featuresZh: ['每月2000次生成', '全部功能', '自定义模型', '专属客服', '白标定制'],
  },
];

// ===== Context Types =====
interface AuthContextType {
  // Legacy support
  isLoggedIn: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  changePassword: (newPassword: string) => void;
  paymentQrCode: string | null;
  setPaymentQrCode: (base64: string | null) => void;
  
  // Member system
  currentMember: Member | null;
  members: Member[];
  memberLogin: (email: string, password: string) => { success: boolean; error?: string };
  memberRegister: (email: string, username: string, password: string) => { success: boolean; error?: string };
  memberLogout: () => void;
  updateMember: (memberId: string, updates: Partial<Member>) => void;
  deleteMember: (memberId: string) => void;
  useCredits: (amount: number) => boolean;
  
  // Payment
  payments: PaymentRecord[];
  addPayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => void;
  upgradePlan: (plan: PlanType) => void;
  
  // Usage
  usageRecords: UsageRecord[];
  addUsageRecord: (record: Omit<UsageRecord, 'id' | 'createdAt'>) => void;
  
  // Admin
  isAdmin: boolean;
  getAdminStats: () => AdminStats;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage Keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'xuanchen_auth_token',
  PAYMENT_QR: 'xuanchen_payment_qr',
  ACCESS_PASSWORD: 'xuanchen_access_password',
  MEMBERS: 'xuanchen_members',
  CURRENT_MEMBER: 'xuanchen_current_member',
  PAYMENTS: 'xuanchen_payments',
  USAGE: 'xuanchen_usage',
};

const DEFAULT_PASSWORD = 'admin123';

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// Default admin account
const DEFAULT_ADMIN: Member = {
  id: 'admin_001',
  email: 'admin@xuanchen.ai',
  username: 'Admin',
  password: 'admin123',
  role: 'admin',
  plan: 'enterprise',
  credits: 99999,
  totalCredits: 99999,
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  isActive: true,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Legacy state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [paymentQrCode, setQrCodeState] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState<string>(DEFAULT_PASSWORD);
  
  // Member state
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);

  // Load from storage
  useEffect(() => {
    // Legacy auth
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) setIsLoggedIn(true);
    
    const savedQr = localStorage.getItem(STORAGE_KEYS.PAYMENT_QR);
    if (savedQr) setQrCodeState(savedQr);
    
    const savedPassword = localStorage.getItem(STORAGE_KEYS.ACCESS_PASSWORD);
    if (savedPassword) setCurrentPassword(savedPassword);
    
    // Members
    const savedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (savedMembers) {
      const parsed = JSON.parse(savedMembers);
      // Ensure admin exists
      if (!parsed.find((m: Member) => m.role === 'admin')) {
        parsed.unshift(DEFAULT_ADMIN);
      }
      setMembers(parsed);
    } else {
      setMembers([DEFAULT_ADMIN]);
    }
    
    // Current member
    const savedCurrentMember = localStorage.getItem(STORAGE_KEYS.CURRENT_MEMBER);
    if (savedCurrentMember) {
      setCurrentMember(JSON.parse(savedCurrentMember));
    }
    
    // Payments
    const savedPayments = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (savedPayments) setPayments(JSON.parse(savedPayments));
    
    // Usage
    const savedUsage = localStorage.getItem(STORAGE_KEYS.USAGE);
    if (savedUsage) setUsageRecords(JSON.parse(savedUsage));
  }, []);

  // Save to storage
  useEffect(() => {
    if (members.length > 0) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }
  }, [members]);

  useEffect(() => {
    if (currentMember) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_MEMBER, JSON.stringify(currentMember));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_MEMBER);
    }
  }, [currentMember]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(usageRecords));
  }, [usageRecords]);

  // ===== Legacy Methods =====
  const login = (password: string): boolean => {
    if (password === currentPassword) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'mock_token_' + Date.now());
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    setIsLoggedIn(false);
  };

  const changePassword = (newPassword: string) => {
    setCurrentPassword(newPassword);
    localStorage.setItem(STORAGE_KEYS.ACCESS_PASSWORD, newPassword);
  };

  const setPaymentQrCode = (base64: string | null) => {
    if (base64) {
      localStorage.setItem(STORAGE_KEYS.PAYMENT_QR, base64);
    } else {
      localStorage.removeItem(STORAGE_KEYS.PAYMENT_QR);
    }
    setQrCodeState(base64);
  };

  // ===== Member Methods =====
  const memberLogin = (email: string, password: string) => {
    const member = members.find(m => m.email.toLowerCase() === email.toLowerCase());
    
    if (!member) {
      return { success: false, error: 'Account not found' };
    }
    
    if (member.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }
    
    if (!member.isActive) {
      return { success: false, error: 'Account disabled' };
    }
    
    // Update last login
    const updated = { ...member, lastLoginAt: new Date().toISOString() };
    setMembers(prev => prev.map(m => m.id === member.id ? updated : m));
    setCurrentMember(updated);
    
    return { success: true };
  };

  const memberRegister = (email: string, username: string, password: string) => {
    // Check if email exists
    if (members.find(m => m.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Email already registered' };
    }
    
    // Create new member
    const newMember: Member = {
      id: generateId(),
      email,
      username,
      password,
      role: 'user',
      plan: 'free',
      credits: 10,
      totalCredits: 10,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true,
    };
    
    setMembers(prev => [...prev, newMember]);
    setCurrentMember(newMember);
    
    return { success: true };
  };

  const memberLogout = () => {
    setCurrentMember(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_MEMBER);
  };

  const updateMember = (memberId: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, ...updates } : m
    ));
    
    if (currentMember?.id === memberId) {
      setCurrentMember(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteMember = (memberId: string) => {
    if (memberId === 'admin_001') return; // Protect default admin
    setMembers(prev => prev.filter(m => m.id !== memberId));
    if (currentMember?.id === memberId) {
      memberLogout();
    }
  };

  const useCredits = (amount: number): boolean => {
    if (!currentMember || currentMember.credits < amount) {
      return false;
    }
    
    updateMember(currentMember.id, {
      credits: currentMember.credits - amount,
    });
    
    return true;
  };

  // ===== Payment Methods =====
  const addPayment = (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => {
    const newPayment: PaymentRecord = {
      ...payment,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setPayments(prev => [newPayment, ...prev]);
  };

  const upgradePlan = (plan: PlanType) => {
    if (!currentMember) return;
    
    const planConfig = PLANS.find(p => p.id === plan);
    if (!planConfig) return;
    
    // Add credits and update plan
    updateMember(currentMember.id, {
      plan,
      credits: currentMember.credits + planConfig.credits,
      totalCredits: currentMember.totalCredits + planConfig.credits,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });
    
    // Record payment
    addPayment({
      memberId: currentMember.id,
      plan,
      amount: planConfig.price,
      currency: 'CNY',
      status: 'completed',
      method: 'wechat',
    });
  };

  // ===== Usage Methods =====
  const addUsageRecord = (record: Omit<UsageRecord, 'id' | 'createdAt'>) => {
    const newRecord: UsageRecord = {
      ...record,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setUsageRecords(prev => [newRecord, ...prev]);
  };

  // ===== Admin Methods =====
  const isAdmin = currentMember?.role === 'admin';

  const getAdminStats = (): AdminStats => {
    const today = new Date().toDateString();
    const todayPayments = payments.filter(p => 
      new Date(p.createdAt).toDateString() === today && p.status === 'completed'
    );
    const todayUsers = members.filter(m => 
      new Date(m.createdAt).toDateString() === today
    );
    
    return {
      totalUsers: members.length,
      activeUsers: members.filter(m => m.isActive).length,
      totalRevenue: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      totalGenerations: usageRecords.length,
      newUsersToday: todayUsers.length,
      revenueToday: todayPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  };

  return (
    <AuthContext.Provider value={{
      // Legacy
      isLoggedIn,
      login,
      logout,
      changePassword,
      paymentQrCode,
      setPaymentQrCode,
      // Member
      currentMember,
      members,
      memberLogin,
      memberRegister,
      memberLogout,
      updateMember,
      deleteMember,
      useCredits,
      // Payment
      payments,
      addPayment,
      upgradePlan,
      // Usage
      usageRecords,
      addUsageRecord,
      // Admin
      isAdmin,
      getAdminStats,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

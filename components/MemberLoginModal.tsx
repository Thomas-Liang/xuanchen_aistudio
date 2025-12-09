import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface MemberLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'login' | 'register';

export const MemberLoginModal: React.FC<MemberLoginModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const { memberLogin, memberRegister } = useAuth();
  
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError(language === 'zh' ? '请填写邮箱和密码' : 'Please fill in email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = memberLogin(email, password);
    
    if (result.success) {
      onClose();
      setEmail('');
      setPassword('');
    } else {
      setError(language === 'zh' 
        ? (result.error === 'Account not found' ? '账户不存在' : 
           result.error === 'Incorrect password' ? '密码错误' :
           result.error === 'Account disabled' ? '账户已禁用' : result.error || '登录失败')
        : (result.error || 'Login failed'));
    }
    
    setIsLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !username || !password) {
      setError(language === 'zh' ? '请填写所有必填项' : 'Please fill in all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError(language === 'zh' ? '两次密码不一致' : 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError(language === 'zh' ? '密码至少6位' : 'Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = memberRegister(email, username, password);
    
    if (result.success) {
      onClose();
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } else {
      setError(language === 'zh' 
        ? (result.error === 'Email already registered' ? '邮箱已注册' : result.error || '注册失败')
        : (result.error || 'Registration failed'));
    }
    
    setIsLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-800 border border-dark-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-brand-500/20 via-dark-800 to-dark-800 border-b border-dark-700">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-dark-700 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="text-brand-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {language === 'zh' ? 'XuanChen 会员' : 'XuanChen Member'}
              </h2>
              <p className="text-slate-400 text-sm">
                {language === 'zh' ? '解锁更多创作可能' : 'Unlock creative possibilities'}
              </p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-dark-900/50 p-1 rounded-xl">
            <button
              onClick={() => { setTab('login'); resetForm(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                tab === 'login' 
                  ? 'bg-dark-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn size={16} />
              {language === 'zh' ? '登录' : 'Login'}
            </button>
            <button
              onClick={() => { setTab('register'); resetForm(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                tab === 'register' 
                  ? 'bg-dark-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus size={16} />
              {language === 'zh' ? '注册' : 'Register'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              {language === 'zh' ? '邮箱' : 'Email'}
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === 'zh' ? '请输入邮箱' : 'Enter your email'}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:border-brand-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
          
          {/* Username (Register only) */}
          {tab === 'register' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                {language === 'zh' ? '用户名' : 'Username'}
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={language === 'zh' ? '请输入用户名' : 'Enter your username'}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}
          
          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              {language === 'zh' ? '密码' : 'Password'}
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={language === 'zh' ? '请输入密码' : 'Enter your password'}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-10 pr-12 py-3 text-slate-200 placeholder-slate-600 focus:border-brand-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          {/* Confirm Password (Register only) */}
          {tab === 'register' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                {language === 'zh' ? '确认密码' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={language === 'zh' ? '请再次输入密码' : 'Confirm your password'}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <button
            onClick={tab === 'login' ? handleLogin : handleRegister}
            disabled={isLoading}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20 mt-6"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {tab === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                {tab === 'login' 
                  ? (language === 'zh' ? '登录' : 'Login')
                  : (language === 'zh' ? '创建账户' : 'Create Account')
                }
              </>
            )}
          </button>
          
          {/* Demo Login */}
          {tab === 'login' && (
            <div className="pt-4 border-t border-dark-700">
              <p className="text-center text-slate-500 text-xs mb-3">
                {language === 'zh' ? '演示账户' : 'Demo Account'}
              </p>
              <button
                onClick={() => {
                  setEmail('admin@xuanchen.ai');
                  setPassword('admin123');
                }}
                className="w-full py-2.5 bg-dark-900 hover:bg-dark-700 border border-dark-600 text-slate-300 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRight size={14} />
                {language === 'zh' ? '使用管理员账户' : 'Use Admin Account'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


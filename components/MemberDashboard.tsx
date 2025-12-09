import React, { useState } from 'react';
import { 
  X, User, Crown, CreditCard, History, Settings, LogOut, 
  Zap, Check, Sparkles, ChevronRight, Calendar, Gift,
  Star, Shield, ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth, PLANS } from '../contexts/AuthContext';
import { PlanType } from '../types';

interface MemberDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
  onOpenRecharge?: () => void;
}

type Tab = 'profile' | 'plans' | 'history';

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ isOpen, onClose, onOpenAdmin, onOpenRecharge }) => {
  const { language } = useLanguage();
  const { currentMember, memberLogout, usageRecords, payments, upgradePlan, isAdmin, paymentQrCode } = useAuth();
  
  const [tab, setTab] = useState<Tab>('profile');
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [showPaymentQR, setShowPaymentQR] = useState(false);

  const memberUsage = usageRecords.filter(r => r.memberId === currentMember?.id);
  const memberPayments = payments.filter(p => p.memberId === currentMember?.id);

  const handleUpgrade = (planId: PlanType) => {
    setSelectedPlan(planId);
    if (paymentQrCode) {
      setShowPaymentQR(true);
    } else {
      // Simulate immediate upgrade for demo
      upgradePlan(planId);
      setSelectedPlan(null);
    }
  };

  const confirmPayment = () => {
    if (selectedPlan) {
      upgradePlan(selectedPlan);
      setSelectedPlan(null);
      setShowPaymentQR(false);
    }
  };

  if (!isOpen || !currentMember) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-800 border border-dark-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        
        {/* Header with User Info */}
        <div className="p-4 sm:p-6 bg-gradient-to-br from-brand-500/20 via-dark-800 to-dark-800 border-b border-dark-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center text-brand-400 text-xl sm:text-2xl font-bold">
                {currentMember.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white">{currentMember.username}</h2>
                  {currentMember.role === 'admin' && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                      <Shield size={10} /> Admin
                    </span>
                  )}
                  {currentMember.role === 'vip' && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
                      <Crown size={10} /> VIP
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">{currentMember.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                    currentMember.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                    currentMember.plan === 'pro' ? 'bg-brand-500/20 text-brand-400' :
                    currentMember.plan === 'basic' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {currentMember.plan}
                  </span>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Zap size={12} className="text-amber-400" />
                    {currentMember.credits} {language === 'zh' ? '积分' : 'credits'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-dark-700 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {isAdmin && onOpenAdmin && (
              <button
                onClick={() => { onClose(); onOpenAdmin(); }}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Shield size={14} />
                {language === 'zh' ? '后台管理' : 'Admin Panel'}
              </button>
            )}
            <button
              onClick={() => { 
                if (onOpenRecharge) {
                  onClose();
                  onOpenRecharge();
                } else {
                  setTab('plans');
                }
              }}
              className="px-4 py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Crown size={14} />
              {language === 'zh' ? '充值 / 升级' : 'Recharge'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-dark-700 px-4 flex gap-1">
          {[
            { id: 'profile', icon: User, label: language === 'zh' ? '资料' : 'Profile' },
            { id: 'plans', icon: Crown, label: language === 'zh' ? '套餐' : 'Plans' },
            { id: 'history', icon: History, label: language === 'zh' ? '记录' : 'History' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
              className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 ${
                tab === item.id 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="space-y-6">
              {/* Credits Card */}
              <div className="bg-gradient-to-br from-brand-500/10 via-dark-900 to-dark-900 rounded-xl border border-brand-500/30 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Zap className="text-amber-400" size={18} />
                    {language === 'zh' ? '积分余额' : 'Credit Balance'}
                  </h3>
                  <button 
                    onClick={() => {
                      if (onOpenRecharge) {
                        onClose();
                        onOpenRecharge();
                      } else {
                        setTab('plans');
                      }
                    }}
                    className="text-brand-400 text-xs hover:underline flex items-center gap-1"
                  >
                    {language === 'zh' ? '充值' : 'Top up'} <ChevronRight size={12} />
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-white">{currentMember.credits}</span>
                  <span className="text-slate-500 text-sm mb-1">/ {currentMember.totalCredits} {language === 'zh' ? '总计' : 'total'}</span>
                </div>
                <div className="mt-3 h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all"
                    style={{ width: `${(currentMember.credits / currentMember.totalCredits) * 100}%` }}
                  />
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-dark-900/50 rounded-xl border border-dark-700 divide-y divide-dark-700">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-slate-500" />
                    <span className="text-slate-400 text-sm">{language === 'zh' ? '注册时间' : 'Joined'}</span>
                  </div>
                  <span className="text-slate-200 text-sm">
                    {new Date(currentMember.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {currentMember.expiresAt && (
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Gift size={16} className="text-slate-500" />
                      <span className="text-slate-400 text-sm">{language === 'zh' ? '套餐到期' : 'Expires'}</span>
                    </div>
                    <span className="text-slate-200 text-sm">
                      {new Date(currentMember.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles size={16} className="text-slate-500" />
                    <span className="text-slate-400 text-sm">{language === 'zh' ? '生成次数' : 'Generations'}</span>
                  </div>
                  <span className="text-slate-200 text-sm">{memberUsage.length}</span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => { memberLogout(); onClose(); }}
                className="w-full py-3 bg-dark-900 hover:bg-red-500/10 border border-dark-700 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                {language === 'zh' ? '退出登录' : 'Logout'}
              </button>
            </div>
          )}

          {/* Plans Tab */}
          {tab === 'plans' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm text-center mb-6">
                {language === 'zh' ? '选择适合您的套餐，解锁更多创作可能' : 'Choose a plan that fits your needs'}
              </p>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {PLANS.map(plan => (
                  <div 
                    key={plan.id}
                    className={`rounded-xl border p-4 transition-all ${
                      plan.popular 
                        ? 'bg-brand-500/10 border-brand-500/50 shadow-lg shadow-brand-500/10' 
                        : 'bg-dark-900/50 border-dark-700 hover:border-dark-600'
                    } ${currentMember.plan === plan.id ? 'ring-2 ring-brand-500' : ''}`}
                  >
                    {plan.popular && (
                      <span className="px-2 py-0.5 bg-brand-500 text-white text-xs rounded-full mb-3 inline-block">
                        {language === 'zh' ? '最受欢迎' : 'Most Popular'}
                      </span>
                    )}
                    
                    <h3 className="text-lg font-bold text-white">
                      {language === 'zh' ? plan.nameZh : plan.name}
                    </h3>
                    
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">¥{plan.price}</span>
                      <span className="text-slate-500 text-sm">/{language === 'zh' ? '月' : 'mo'}</span>
                    </div>
                    
                    <ul className="mt-4 space-y-2">
                      {(language === 'zh' ? plan.featuresZh : plan.features).map((feature, i) => (
                        <li key={i} className="text-slate-400 text-sm flex items-center gap-2">
                          <Check size={14} className="text-brand-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={currentMember.plan === plan.id}
                      className={`w-full mt-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        currentMember.plan === plan.id
                          ? 'bg-dark-700 text-slate-500 cursor-not-allowed'
                          : plan.popular
                            ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                            : 'bg-dark-700 hover:bg-dark-600 text-slate-200'
                      }`}
                    >
                      {currentMember.plan === plan.id 
                        ? (language === 'zh' ? '当前套餐' : 'Current Plan')
                        : (language === 'zh' ? '立即订阅' : 'Subscribe')
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Tab */}
          {tab === 'history' && (
            <div className="space-y-6">
              {/* Payment History */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-brand-400" />
                  {language === 'zh' ? '订单记录' : 'Payment History'}
                </h3>
                <div className="bg-dark-900/50 rounded-xl border border-dark-700 divide-y divide-dark-700">
                  {memberPayments.length === 0 ? (
                    <p className="p-4 text-center text-slate-500 text-sm">
                      {language === 'zh' ? '暂无订单' : 'No payments yet'}
                    </p>
                  ) : (
                    memberPayments.slice(0, 5).map(payment => (
                      <div key={payment.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-slate-200 text-sm capitalize">{payment.plan} Plan</p>
                          <p className="text-slate-500 text-xs">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">¥{payment.amount.toFixed(2)}</p>
                          <span className={`text-xs ${
                            payment.status === 'completed' ? 'text-green-400' : 'text-amber-400'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Usage History */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <History size={16} className="text-brand-400" />
                  {language === 'zh' ? '使用记录' : 'Usage History'}
                </h3>
                <div className="bg-dark-900/50 rounded-xl border border-dark-700 divide-y divide-dark-700">
                  {memberUsage.length === 0 ? (
                    <p className="p-4 text-center text-slate-500 text-sm">
                      {language === 'zh' ? '暂无使用记录' : 'No usage yet'}
                    </p>
                  ) : (
                    memberUsage.slice(0, 10).map(record => (
                      <div key={record.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            record.type === 'generation' ? 'bg-brand-400' :
                            record.type === 'edit' ? 'bg-blue-400' : 'bg-purple-400'
                          }`} />
                          <div>
                            <p className="text-slate-200 text-sm capitalize">{record.type}</p>
                            <p className="text-slate-500 text-xs truncate max-w-[200px]">
                              {record.prompt || '-'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 text-sm">-{record.creditsUsed}</p>
                          <p className="text-slate-500 text-xs">
                            {new Date(record.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment QR Modal */}
        {showPaymentQR && paymentQrCode && selectedPlan && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-10">
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-sm text-center space-y-4 animate-in zoom-in-95">
              <h3 className="text-lg font-bold text-white">
                {language === 'zh' ? '扫码支付' : 'Scan to Pay'}
              </h3>
              <p className="text-slate-400 text-sm">
                {PLANS.find(p => p.id === selectedPlan)?.name} - ¥{PLANS.find(p => p.id === selectedPlan)?.price}
              </p>
              <img 
                src={paymentQrCode} 
                alt="Payment QR" 
                className="w-48 h-48 mx-auto rounded-lg bg-white p-2"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPaymentQR(false); setSelectedPlan(null); }}
                  className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-slate-300 rounded-xl transition-colors"
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  onClick={confirmPayment}
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors"
                >
                  {language === 'zh' ? '已完成支付' : 'Payment Done'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


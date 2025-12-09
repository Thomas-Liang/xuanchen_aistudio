import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Zap, CreditCard, Check, Crown, Sparkles, Gift,
  QrCode, Smartphone, ArrowRight, Clock, Shield, Star,
  Loader2, RefreshCw, Settings, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth, PLANS } from '../contexts/AuthContext';
import { PlanType } from '../types';
import { 
  createPaymentOrder, 
  generateOrderId, 
  queryOrderStatus,
  simulatePaymentSuccess,
  isPaymentConfigured,
  PaymentOrder,
  PaymentMethod as PayMethod
} from '../services/paymentService';
import { PaymentSettings } from './PaymentSettings';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'plans' | 'credits';
type PaymentMethod = 'wechat' | 'alipay' | 'card';

// Credit packages
const CREDIT_PACKAGES = [
  { id: 'small', credits: 50, price: 4.9, bonus: 0 },
  { id: 'medium', credits: 200, price: 18, bonus: 20, popular: true },
  { id: 'large', credits: 500, price: 39, bonus: 60 },
  { id: 'mega', credits: 1000, price: 68, bonus: 150 },
];

export const RechargeModal: React.FC<RechargeModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { currentMember, upgradePlan, updateMember, addPayment, isAdmin } = useAuth();
  
  const [tab, setTab] = useState<Tab>('plans');
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Real payment states
  const [currentOrder, setCurrentOrder] = useState<PaymentOrder | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setShowPayment(false);
      setCurrentOrder(null);
      setOrderError('');
      setPaymentSuccess(false);
      setSelectedPlan(null);
      setSelectedPackage(null);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [isOpen]);

  const handleSelectPlan = (planId: PlanType) => {
    if (currentMember?.plan === planId) return;
    setSelectedPlan(planId);
    setSelectedPackage(null);
    setShowPayment(true);
  };

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
    setSelectedPlan(null);
    setShowPayment(true);
  };

  // Create real payment order
  const handleCreateOrder = async () => {
    if (!currentMember) return;
    
    setIsProcessing(true);
    setOrderError('');
    
    let amount = 0;
    let title = '';
    
    if (selectedPlan) {
      const plan = PLANS.find(p => p.id === selectedPlan);
      if (plan) {
        amount = plan.price;
        title = `${plan.name} 套餐订阅`;
      }
    } else if (selectedPackage) {
      const pkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage);
      if (pkg) {
        amount = pkg.price;
        title = `${pkg.credits}积分充值包`;
      }
    }

    if (amount === 0) {
      setOrderError('无效的订单金额');
      setIsProcessing(false);
      return;
    }

    const orderId = generateOrderId();
    
    const result = await createPaymentOrder({
      orderId,
      amount,
      title,
      method: paymentMethod as PayMethod,
      userId: currentMember.id,
      metadata: { selectedPlan, selectedPackage },
    });

    setIsProcessing(false);

    if (result.success && result.order) {
      setCurrentOrder(result.order);
      setCountdown(300);
      startPolling(result.order.orderId);
      startCountdown();
    } else {
      setOrderError(result.error || '创建订单失败');
    }
  };

  // Start polling for payment status
  const startPolling = (orderId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    pollingRef.current = setInterval(async () => {
      const order = await queryOrderStatus(orderId);
      if (order) {
        setCurrentOrder(order);
        
        if (order.status === 'paid') {
          handlePaymentSuccess();
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
        } else if (order.status === 'expired' || order.status === 'failed') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      }
    }, 3000); // Poll every 3 seconds
  };

  // Start countdown timer
  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    if (!currentMember) return;
    
    if (selectedPlan) {
      upgradePlan(selectedPlan);
    } else if (selectedPackage) {
      const pkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage);
      if (pkg) {
        const totalCredits = pkg.credits + pkg.bonus;
        updateMember(currentMember.id, {
          credits: currentMember.credits + totalCredits,
          totalCredits: currentMember.totalCredits + totalCredits,
        });
        addPayment({
          memberId: currentMember.id,
          plan: currentMember.plan,
          amount: pkg.price,
          currency: 'CNY',
          status: 'completed',
          method: paymentMethod,
        });
      }
    }
    
    setPaymentSuccess(true);
    
    setTimeout(() => {
      setShowPayment(false);
      setPaymentSuccess(false);
      setSelectedPlan(null);
      setSelectedPackage(null);
      setCurrentOrder(null);
      onClose();
    }, 2000);
  };

  // Demo: Simulate payment (for testing without real gateway)
  const handleSimulatePayment = async () => {
    if (!currentOrder) return;
    
    setIsProcessing(true);
    
    // 模拟支付处理
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    simulatePaymentSuccess(currentOrder.orderId);
    
    setIsProcessing(false);
    handlePaymentSuccess();
  };

  // Legacy confirm (for QR code mode)
  const handleConfirmPayment = async () => {
    if (!currentMember) return;
    handlePaymentSuccess();
  };

  const getSelectedItem = () => {
    if (selectedPlan) {
      return PLANS.find(p => p.id === selectedPlan);
    }
    if (selectedPackage) {
      return CREDIT_PACKAGES.find(p => p.id === selectedPackage);
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-800 border border-dark-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-br from-amber-500/20 via-dark-800 to-dark-800 border-b border-dark-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Zap className="text-amber-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {language === 'zh' ? '充值中心' : 'Recharge Center'}
                </h2>
                <p className="text-slate-400 text-sm">
                  {language === 'zh' ? '选择套餐或积分包' : 'Choose plan or credit package'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-dark-700 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Current Balance */}
          {currentMember && (
            <div className="mt-4 flex items-center gap-4 p-3 bg-dark-900/50 rounded-xl">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                <span className="text-slate-400 text-sm">
                  {language === 'zh' ? '当前积分' : 'Current Credits'}:
                </span>
                <span className="text-white font-bold">{currentMember.credits}</span>
              </div>
              <div className="w-px h-4 bg-dark-700" />
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-brand-400" />
                <span className="text-slate-400 text-sm">
                  {language === 'zh' ? '当前套餐' : 'Plan'}:
                </span>
                <span className="text-brand-400 font-medium capitalize">{currentMember.plan}</span>
              </div>
            </div>
          )}
          
          {/* Tabs */}
          <div className="flex bg-dark-900/50 p-1 rounded-xl mt-4">
            <button
              onClick={() => setTab('plans')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                tab === 'plans' 
                  ? 'bg-dark-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown size={16} />
              {language === 'zh' ? '订阅套餐' : 'Subscription'}
            </button>
            <button
              onClick={() => setTab('credits')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                tab === 'credits' 
                  ? 'bg-dark-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap size={16} />
              {language === 'zh' ? '积分充值' : 'Buy Credits'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* Plans Tab */}
          {tab === 'plans' && !showPayment && (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {PLANS.map(plan => (
                <div 
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    plan.popular 
                      ? 'bg-brand-500/10 border-brand-500/50 shadow-lg shadow-brand-500/10' 
                      : 'bg-dark-900/50 border-dark-700 hover:border-dark-600'
                  } ${currentMember?.plan === plan.id ? 'ring-2 ring-brand-500 opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                >
                  {plan.popular && (
                    <span className="px-2 py-0.5 bg-brand-500 text-white text-xs rounded-full mb-2 inline-flex items-center gap-1">
                      <Star size={10} /> {language === 'zh' ? '推荐' : 'Popular'}
                    </span>
                  )}
                  
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {plan.id === 'enterprise' && <Shield size={16} className="text-purple-400" />}
                    {plan.id === 'pro' && <Crown size={16} className="text-brand-400" />}
                    {language === 'zh' ? plan.nameZh : plan.name}
                  </h3>
                  
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">¥{plan.price}</span>
                    <span className="text-slate-500 text-sm">/{language === 'zh' ? '月' : 'mo'}</span>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2 text-amber-400 text-sm">
                    <Zap size={14} />
                    <span>{plan.credits} {language === 'zh' ? '积分/月' : 'credits/mo'}</span>
                  </div>
                  
                  <ul className="mt-3 space-y-1.5">
                    {(language === 'zh' ? plan.featuresZh : plan.features).slice(0, 3).map((feature, i) => (
                      <li key={i} className="text-slate-400 text-xs flex items-center gap-2">
                        <Check size={12} className="text-brand-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {currentMember?.plan === plan.id && (
                    <div className="mt-3 text-center text-slate-500 text-xs py-2 bg-dark-800 rounded-lg">
                      {language === 'zh' ? '当前套餐' : 'Current Plan'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Credits Tab */}
          {tab === 'credits' && !showPayment && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm text-center">
                {language === 'zh' ? '选择积分包，即买即用' : 'Choose a credit package, use immediately'}
              </p>
              
              <div className="grid gap-3 grid-cols-2">
                {CREDIT_PACKAGES.map(pkg => (
                  <div 
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg.id)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.02] ${
                      pkg.popular 
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10' 
                        : 'bg-dark-900/50 border-dark-700 hover:border-dark-600'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full mb-2 inline-flex items-center gap-1">
                        <Gift size={10} /> {language === 'zh' ? '超值' : 'Best Value'}
                      </span>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Zap size={20} className="text-amber-400" />
                      <span className="text-xl font-bold text-white">{pkg.credits}</span>
                      {pkg.bonus > 0 && (
                        <span className="text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                          +{pkg.bonus}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-white">¥{pkg.price}</span>
                    </div>
                    
                    {pkg.bonus > 0 && (
                      <p className="text-xs text-green-400 mt-1">
                        {language === 'zh' ? `赠送 ${pkg.bonus} 积分` : `+${pkg.bonus} bonus credits`}
                      </p>
                    )}
                    
                    <p className="text-xs text-slate-500 mt-2">
                      ≈ ¥{(pkg.price / (pkg.credits + pkg.bonus)).toFixed(2)}/{language === 'zh' ? '次' : 'gen'}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                  <Sparkles size={14} className="text-brand-400" />
                  {language === 'zh' ? '积分说明' : 'Credit Info'}
                </h4>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• {language === 'zh' ? '每次图片生成消耗 1 积分' : '1 credit per image generation'}</li>
                  <li>• {language === 'zh' ? '积分永久有效，不会过期' : 'Credits never expire'}</li>
                  <li>• {language === 'zh' ? '支持微信、支付宝支付' : 'WeChat & Alipay supported'}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Payment View */}
          {showPayment && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
              {paymentSuccess ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Check size={40} className="text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {language === 'zh' ? '支付成功！' : 'Payment Success!'}
                  </h3>
                  <p className="text-slate-400">
                    {language === 'zh' ? '积分已到账，感谢您的支持' : 'Credits added, thank you!'}
                  </p>
                </div>
              ) : currentOrder ? (
                // Real Payment Order View
                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-400 text-xs">
                        {language === 'zh' ? '订单号' : 'Order ID'}
                      </span>
                      <span className="text-slate-300 font-mono text-xs">{currentOrder.orderId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">{language === 'zh' ? '支付金额' : 'Amount'}</span>
                      <span className="text-2xl font-bold text-white">¥{currentOrder.amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  {currentOrder.qrCodeUrl && currentOrder.status === 'pending' && (
                    <div className="bg-white rounded-xl p-6 text-center">
                      <img 
                        src={currentOrder.qrCodeUrl} 
                        alt="Payment QR" 
                        className="w-48 h-48 mx-auto rounded-lg"
                      />
                      <p className="text-slate-600 text-sm mt-3">
                        {language === 'zh' 
                          ? `请使用${currentOrder.method === 'wechat' ? '微信' : '支付宝'}扫码支付` 
                          : `Scan with ${currentOrder.method === 'wechat' ? 'WeChat' : 'Alipay'}`}
                      </p>
                      
                      {/* Countdown */}
                      <div className="mt-3 flex items-center justify-center gap-2 text-amber-500">
                        <Clock size={14} />
                        <span className="text-sm">
                          {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  {currentOrder.status === 'expired' && (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-slate-500/20 rounded-full flex items-center justify-center mx-auto">
                        <Clock size={32} className="text-slate-400" />
                      </div>
                      <p className="text-slate-400">{language === 'zh' ? '订单已过期' : 'Order expired'}</p>
                      <button
                        onClick={() => setCurrentOrder(null)}
                        className="text-brand-400 text-sm hover:underline"
                      >
                        {language === 'zh' ? '重新下单' : 'Create new order'}
                      </button>
                    </div>
                  )}

                  {/* Polling Status */}
                  {currentOrder.status === 'pending' && (
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <Loader2 size={14} className="animate-spin" />
                      {language === 'zh' ? '等待支付中...' : 'Waiting for payment...'}
                    </div>
                  )}

                  {/* Demo Mode Notice */}
                  {!isPaymentConfigured() && currentOrder.status === 'pending' && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <AlertCircle size={18} />
                        <span className="font-medium">
                          {language === 'zh' ? '演示模式' : 'Demo Mode'}
                        </span>
                      </div>
                      <p className="text-amber-400/80 text-sm">
                        {language === 'zh' 
                          ? '当前未配置真实支付，点击下方按钮模拟支付成功，测试完整流程。' 
                          : 'Payment not configured. Click below to simulate a successful payment.'}
                      </p>
                      <button
                        onClick={handleSimulatePayment}
                        disabled={isProcessing}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            {language === 'zh' ? '处理中...' : 'Processing...'}
                          </>
                        ) : (
                          <>
                            <Check size={18} />
                            {language === 'zh' ? '模拟支付成功' : 'Simulate Payment Success'}
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setCurrentOrder(null);
                        setShowPayment(false);
                        setSelectedPlan(null);
                        setSelectedPackage(null);
                        if (pollingRef.current) clearInterval(pollingRef.current);
                        if (countdownRef.current) clearInterval(countdownRef.current);
                      }}
                      disabled={isProcessing}
                      className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-slate-300 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      {language === 'zh' ? '取消订单' : 'Cancel Order'}
                    </button>
                  </div>
                </div>
              ) : (
                // Order Creation View
                <>
                  {/* Error */}
                  {orderError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-400 text-sm">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                    <h4 className="text-slate-400 text-xs uppercase mb-3">
                      {language === 'zh' ? '订单详情' : 'Order Summary'}
                    </h4>
                    
                    {selectedPlan && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex items-center justify-center">
                            <Crown className="text-brand-400" size={20} />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {PLANS.find(p => p.id === selectedPlan)?.name} {language === 'zh' ? '套餐' : 'Plan'}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {PLANS.find(p => p.id === selectedPlan)?.credits} {language === 'zh' ? '积分/月' : 'credits/mo'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-white">
                          ¥{PLANS.find(p => p.id === selectedPlan)?.price}
                        </span>
                      </div>
                    )}
                    
                    {selectedPackage && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <Zap className="text-amber-400" size={20} />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.credits} {language === 'zh' ? '积分' : 'Credits'}
                            </p>
                            {CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.bonus! > 0 && (
                              <p className="text-green-400 text-xs">
                                +{CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.bonus} {language === 'zh' ? '赠送' : 'bonus'}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xl font-bold text-white">
                          ¥{CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.price}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h4 className="text-slate-400 text-xs uppercase mb-3">
                      {language === 'zh' ? '支付方式' : 'Payment Method'}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod('wechat')}
                        disabled={isProcessing}
                        className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${
                          paymentMethod === 'wechat'
                            ? 'bg-green-500/10 border-green-500/50 text-green-400'
                            : 'bg-dark-900/50 border-dark-700 text-slate-400 hover:border-dark-600'
                        }`}
                      >
                        <QrCode size={24} />
                        <span className="font-medium">{language === 'zh' ? '微信支付' : 'WeChat Pay'}</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('alipay')}
                        disabled={isProcessing}
                        className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${
                          paymentMethod === 'alipay'
                            ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                            : 'bg-dark-900/50 border-dark-700 text-slate-400 hover:border-dark-600'
                        }`}
                      >
                        <Smartphone size={24} />
                        <span className="font-medium">{language === 'zh' ? '支付宝' : 'Alipay'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Config Status */}
                  {!isPaymentConfigured() && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-400 text-sm">
                        <AlertCircle size={16} />
                        <span>{language === 'zh' ? '演示模式（未配置支付）' : 'Demo mode (payment not configured)'}</span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setIsPaymentSettingsOpen(true)}
                          className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1"
                        >
                          <Settings size={12} />
                          {language === 'zh' ? '配置' : 'Configure'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowPayment(false);
                        setSelectedPlan(null);
                        setSelectedPackage(null);
                        setOrderError('');
                      }}
                      disabled={isProcessing}
                      className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-slate-300 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      {language === 'zh' ? '返回' : 'Back'}
                    </button>
                    <button
                      onClick={handleCreateOrder}
                      disabled={isProcessing}
                      className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-brand-500/20"
                    >
                      {isProcessing ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <ArrowRight size={18} />
                          {language === 'zh' ? '创建订单' : 'Create Order'}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Security Note */}
                  <p className="text-center text-slate-500 text-xs flex items-center justify-center gap-1">
                    <Shield size={12} />
                    {language === 'zh' ? '安全支付，隐私保护' : 'Secure payment, privacy protected'}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Payment Settings Modal */}
          <PaymentSettings 
            isOpen={isPaymentSettingsOpen}
            onClose={() => setIsPaymentSettingsOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Save, CreditCard, Key, Link, CheckCircle,
  AlertCircle, ExternalLink, Shield
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  PaymentConfig, 
  getPaymentConfig, 
  savePaymentConfig,
  isPaymentConfigured,
  getPaymentPlatformName
} from '../services/paymentService';

interface PaymentSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

type Platform = 'xunhupay' | 'payjs' | 'yipay' | 'custom';

const PLATFORMS = [
  { 
    id: 'xunhupay', 
    name: '虎皮椒', 
    nameEn: 'XunHuPay',
    url: 'https://www.xunhupay.com',
    description: '个人免签约，支持微信/支付宝',
    descriptionEn: 'No contract needed, WeChat/Alipay supported',
    apiUrl: 'https://api.xunhupay.com/payment/do.html',
  },
  { 
    id: 'payjs', 
    name: 'PayJS', 
    nameEn: 'PayJS',
    url: 'https://payjs.cn',
    description: '个人收款，费率低',
    descriptionEn: 'Personal payment, low rate',
    apiUrl: 'https://payjs.cn/api/native',
  },
  { 
    id: 'yipay', 
    name: '易支付', 
    nameEn: 'YiPay',
    url: '',
    description: '自建易支付系统',
    descriptionEn: 'Self-hosted YiPay',
    apiUrl: '',
  },
  { 
    id: 'custom', 
    name: '自定义', 
    nameEn: 'Custom',
    url: '',
    description: '自定义支付接口',
    descriptionEn: 'Custom payment API',
    apiUrl: '',
  },
];

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  
  const [config, setConfig] = useState<PaymentConfig>({
    platform: 'xunhupay',
    appId: '',
    appSecret: '',
    apiUrl: '',
    notifyUrl: '',
    returnUrl: '',
  });
  
  const [saved, setSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = getPaymentConfig();
      if (existing) {
        setConfig(existing);
      } else {
        // 设置默认回调地址
        setConfig(prev => ({
          ...prev,
          notifyUrl: window.location.origin + '/api/payment/notify',
          returnUrl: window.location.origin + '/payment/success',
        }));
      }
    }
  }, [isOpen]);

  const handlePlatformChange = (platform: Platform) => {
    const platformInfo = PLATFORMS.find(p => p.id === platform);
    setConfig(prev => ({
      ...prev,
      platform,
      apiUrl: platformInfo?.apiUrl || prev.apiUrl,
    }));
  };

  const handleSave = () => {
    savePaymentConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  const currentPlatform = PLATFORMS.find(p => p.id === config.platform);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-dark-700 bg-dark-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CreditCard className="text-green-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {language === 'zh' ? '支付配置' : 'Payment Settings'}
              </h2>
              <p className="text-slate-500 text-xs">
                {language === 'zh' ? '配置真实支付通道参数' : 'Configure real payment gateway'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Platform Select */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">
              {language === 'zh' ? '支付平台' : 'Payment Platform'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformChange(platform.id as Platform)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    config.platform === platform.id
                      ? 'bg-brand-500/10 border-brand-500/50 text-brand-400'
                      : 'bg-dark-900/50 border-dark-700 text-slate-400 hover:border-dark-600'
                  }`}
                >
                  <div className="font-medium text-sm">
                    {language === 'zh' ? platform.name : platform.nameEn}
                  </div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {language === 'zh' ? platform.description : platform.descriptionEn}
                  </div>
                </button>
              ))}
            </div>
            
            {currentPlatform?.url && (
              <a 
                href={currentPlatform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-400 hover:underline flex items-center gap-1"
              >
                {language === 'zh' ? '前往官网注册' : 'Register on official site'}
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {/* API Credentials */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Key size={14} />
                App ID / 商户号
              </label>
              <input
                type="text"
                value={config.appId}
                onChange={(e) => setConfig(prev => ({ ...prev, appId: e.target.value }))}
                placeholder={language === 'zh' ? '从支付平台获取' : 'Get from payment platform'}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-brand-500 focus:outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Shield size={14} />
                App Secret / 密钥
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={config.appSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                  placeholder="••••••••••••••••"
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-brand-500 focus:outline-none pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  {showSecret ? (language === 'zh' ? '隐藏' : 'Hide') : (language === 'zh' ? '显示' : 'Show')}
                </button>
              </div>
            </div>
          </div>

          {/* API URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Link size={14} />
              API URL
            </label>
            <input
              type="url"
              value={config.apiUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
              placeholder="https://api.example.com/pay"
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-brand-500 focus:outline-none font-mono text-sm"
            />
          </div>

          {/* Callback URLs */}
          <div className="space-y-4 p-4 bg-dark-900/50 rounded-xl border border-dark-700">
            <h4 className="text-sm font-medium text-slate-300">
              {language === 'zh' ? '回调地址（填写到支付平台）' : 'Callback URLs (Set in payment platform)'}
            </h4>
            
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Notify URL (异步通知)</label>
              <input
                type="url"
                value={config.notifyUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, notifyUrl: e.target.value }))}
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-slate-300 font-mono text-xs"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Return URL (同步跳转)</label>
              <input
                type="url"
                value={config.returnUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, returnUrl: e.target.value }))}
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-slate-300 font-mono text-xs"
              />
            </div>
          </div>

          {/* Status */}
          <div className={`p-3 rounded-xl flex items-center gap-3 ${
            isPaymentConfigured() 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-amber-500/10 border border-amber-500/30'
          }`}>
            {isPaymentConfigured() ? (
              <>
                <CheckCircle size={18} className="text-green-400" />
                <span className="text-green-400 text-sm">
                  {language === 'zh' ? '支付已配置' : 'Payment configured'}: {getPaymentPlatformName()}
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={18} className="text-amber-400" />
                <span className="text-amber-400 text-sm">
                  {language === 'zh' ? '支付未配置，当前为演示模式' : 'Not configured, demo mode'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-700 bg-dark-900/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-slate-300 rounded-xl font-medium transition-colors"
          >
            {language === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
          >
            {saved ? (
              <>
                <CheckCircle size={18} />
                {language === 'zh' ? '已保存' : 'Saved'}
              </>
            ) : (
              <>
                <Save size={18} />
                {language === 'zh' ? '保存配置' : 'Save Config'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


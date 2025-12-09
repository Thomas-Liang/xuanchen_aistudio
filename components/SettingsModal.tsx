import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: { apiKey: string; baseUrl: string; model: string }) => void;
  initialConfig: { apiKey: string; baseUrl: string; model: string };
}

type UrlPreset = 'google' | 'openrouter' | 'custom';

const BASE_URL_PRESETS: Record<UrlPreset, string> = {
  google: 'https://generativelanguage.googleapis.com',
  openrouter: 'https://openrouter.ai/api',
  custom: 'https://ai.t8star.cn/',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}) => {
  const { t } = useLanguage();
  
  const [apiKey, setApiKey] = useState(initialConfig.apiKey);
  const [baseUrl, setBaseUrl] = useState(initialConfig.baseUrl);
  const [model, setModel] = useState(initialConfig.model);
  const [urlProvider, setUrlProvider] = useState<UrlPreset>('custom');

  const BANANA_OPTIONS = [
    { value: 'nano-banana', label: 'Banana (Nano Banana)' },
    { value: 'nano-banana-pro', label: 'Banana Pro (Nano Banana Pro)' },
  ];

  const GOOGLE_OPTIONS = [
    { value: 'models/gemini-3-pro-image-preview', label: `${t('settings.provider_google')} (Gemini 3 Pro)` },
  ];

  useEffect(() => {
    if (isOpen) {
      setApiKey(initialConfig.apiKey);
      setBaseUrl(initialConfig.baseUrl);
      setModel(initialConfig.model);
      
      // URL Detection
      if (initialConfig.baseUrl.includes('googleapis.com')) setUrlProvider('google');
      else if (initialConfig.baseUrl.includes('openrouter')) setUrlProvider('openrouter');
      else setUrlProvider('custom');
    }
  }, [isOpen, initialConfig]);

  const handleUrlProviderChange = (provider: UrlPreset) => {
    setUrlProvider(provider);
    if (provider === 'google') {
      setBaseUrl(BASE_URL_PRESETS.google);
      setModel('models/gemini-3-pro-image-preview');
    } else if (provider === 'openrouter') {
      setBaseUrl(BASE_URL_PRESETS.openrouter);
      if (model.includes('gemini-3-pro')) {
        setModel('nano-banana');
      }
    } else {
      setBaseUrl(BASE_URL_PRESETS.custom);
      if (model.includes('gemini-3-pro')) {
         setModel('nano-banana');
      }
    }
  };

  const activeModelOptions = urlProvider === 'google' ? GOOGLE_OPTIONS : BANANA_OPTIONS;

  const handleModelSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value !== 'custom') {
      setModel(value);
    } else {
      if (activeModelOptions.some(opt => opt.value === model)) {
        setModel('');
      }
    }
  };

  const handleSave = () => {
    onSave({ apiKey, baseUrl, model });
    onClose();
  };

  if (!isOpen) return null;

  const activeBtnClass = "bg-brand-500 text-white border-transparent shadow-md";
  const inactiveBtnClass = "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent";
  const currentSelectValue = activeModelOptions.some(opt => opt.value === model) ? model : 'custom';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 font-sans custom-scrollbar">
        
        {/* Header */}
        <div className="pt-8 pb-6 px-8 text-center space-y-2 sticky top-0 bg-white z-10 border-b border-slate-100">
          <h2 className="text-2xl font-serif font-bold text-dark-900">{t('settings.title')}</h2>
          <p className="text-slate-500 text-xs">{t('settings.subtitle')}</p>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 space-y-8 mt-6">
          
          {/* Section: API Settings */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-dark-900 border-b border-slate-100 pb-2 mb-4">API Configuration</h3>
            
            {/* API Key */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block">
                {t('settings.apikey_label')}
                </label>
                <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t('settings.apikey_placeholder')}
                className="w-full bg-[#F3F4F6] border-none rounded-md px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400">
                {t('settings.apikey_help')}
                </p>
            </div>

            {/* Base URL */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 block">
                {t('settings.baseurl_label')}
                </label>
                <div className="flex justify-between items-center gap-2">
                {(['google', 'openrouter', 'custom'] as UrlPreset[]).map((p) => (
                    <button
                    key={p}
                    onClick={() => handleUrlProviderChange(p)}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all border ${urlProvider === p ? activeBtnClass : inactiveBtnClass}`}
                    >
                    {p === 'google' ? t('settings.provider_google') : p === 'openrouter' ? t('settings.provider_openrouter') : t('settings.provider_custom')}
                    </button>
                ))}
                </div>
                {(urlProvider === 'custom' || urlProvider === 'openrouter') && (
                <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={urlProvider === 'openrouter' ? "https://openrouter.ai/api" : "https://ai.t8star.cn/"}
                className="w-full bg-[#F3F4F6] border-none rounded-md px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:outline-none mt-2"
                />
                )}
            </div>

            {/* Model Name */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 block">
                {t('settings.model_label')}
                </label>
                
                <div className="relative">
                <select
                    value={currentSelectValue}
                    onChange={handleModelSelectChange}
                    className="w-full bg-[#F3F4F6] border-none rounded-md pl-4 pr-10 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:outline-none appearance-none cursor-pointer"
                >
                    {activeModelOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                    ))}
                    <option value="custom">{t('settings.model_custom')}</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronDown size={16} />
                </div>
                </div>

                {currentSelectValue === 'custom' && (
                <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={t('settings.custom_placeholder')}
                    className="w-full bg-[#F3F4F6] border-none rounded-md px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:outline-none font-mono"
                />
                )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex gap-3 sticky bottom-0 bg-white pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            {t('settings.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20"
          >
            {t('settings.save')}
          </button>
        </div>

      </div>
    </div>
  );
};
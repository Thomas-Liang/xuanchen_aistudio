import React from 'react';
import { X, BookOpen, ImageIcon, Wand2, Settings, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[650px] max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-100 text-brand-600 rounded-xl shadow-sm">
                <BookOpen size={22} />
            </div>
            <div>
                <h2 className="text-xl font-serif font-bold text-dark-900">{t('docs.title')}</h2>
                <p className="text-slate-500 text-xs">{t('docs.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8 text-slate-700">
            
            {/* Section 1: Introduction */}
            <section className="space-y-3">
                <h3 className="font-bold text-dark-800 flex items-center gap-2 text-lg">
                    <Wand2 size={18} className="text-brand-500"/> 
                    {t('docs.core_features')}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                    {t('docs.core_desc')}
                </p>
            </section>

            {/* Section 2: API Configuration */}
            <section className="space-y-3">
                <h3 className="font-bold text-dark-800 flex items-center gap-2 text-lg">
                    <Settings size={18} className="text-brand-500"/> 
                    {t('docs.api_config')}
                </h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-3">
                    <div className="flex gap-3">
                         <div className="min-w-[4px] rounded-full bg-brand-400"></div>
                         <div>
                            <span className="font-bold block text-dark-800 mb-1">{t('docs.api_key')}</span>
                            <span className="text-slate-600 leading-relaxed">
                                {t('docs.api_key_desc')}
                            </span>
                         </div>
                    </div>
                    <div className="flex gap-3">
                         <div className="min-w-[4px] rounded-full bg-brand-400"></div>
                         <div>
                            <span className="font-bold block text-dark-800 mb-1">{t('docs.base_url')}</span>
                            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-1">
                                <li>{t('docs.base_url_google')}</li>
                                <li>{t('docs.base_url_openrouter')}</li>
                                <li>{t('docs.base_url_custom')}</li>
                            </ul>
                         </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Models */}
            <section className="space-y-3">
                 <h3 className="font-bold text-dark-800 flex items-center gap-2 text-lg">
                    <Zap size={18} className="text-brand-500"/> 
                    {t('docs.model_strategy')}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="border border-slate-200 bg-white rounded-lg p-3 hover:border-brand-300 transition-colors shadow-sm">
                        <div className="font-bold text-dark-900 text-sm mb-1">Banana (Nano)</div>
                        <div className="text-xs text-slate-500">
                            {t('docs.model_banana_fast')}
                        </div>
                    </div>
                    <div className="border border-slate-200 bg-white rounded-lg p-3 hover:border-brand-300 transition-colors shadow-sm">
                        <div className="font-bold text-dark-900 text-sm mb-1">Banana Pro</div>
                        <div className="text-xs text-slate-500">
                            {t('docs.model_banana_pro')}
                        </div>
                    </div>
                    <div className="border border-slate-200 bg-white rounded-lg p-3 hover:border-brand-300 transition-colors col-span-full shadow-sm">
                        <div className="font-bold text-dark-900 text-sm mb-1">Google Official (Gemini 3 Pro)</div>
                        <div className="text-xs text-slate-500">
                            {t('docs.model_google')}
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 4: Image Reference */}
            <section className="space-y-3">
                 <h3 className="font-bold text-dark-800 flex items-center gap-2 text-lg">
                    <ImageIcon size={18} className="text-brand-500"/> 
                    {t('docs.img_ref')}
                </h3>
                <p className="text-sm text-slate-600">
                    {t('docs.img_ref_desc')}
                </p>
                <div className="text-xs bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100 flex gap-2 items-start">
                    <span className="font-bold shrink-0">Note:</span>
                    <span>{t('docs.img_ref_note')}</span>
                </div>
            </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button
                onClick={onClose}
                className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium shadow-lg shadow-brand-500/20 active:scale-95 transform duration-100"
            >
                {t('docs.got_it')}
            </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Settings2, Sliders } from 'lucide-react';
import { AspectRatio, ImageSize } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ControlPanelProps {
  model: string;
  onOpenSettings: () => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  imageSize: ImageSize;
  setImageSize: (s: ImageSize) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  model,
  onOpenSettings,
  aspectRatio,
  setAspectRatio,
  imageSize,
  setImageSize,
}) => {
  const { t } = useLanguage();
  // Determine if we should show image size options (for HD/Pro models)
  const showImageSize = model.includes('hd') || model.includes('pro') || model.includes('size');

  return (
    <div className="space-y-6 bg-dark-800/50 p-6 rounded-2xl border border-dark-700 h-full">
      <div className="flex items-center justify-between pb-4 border-b border-dark-700">
        <div className="flex items-center space-x-2">
            <Sliders className="text-brand-400" size={20} />
            <h2 className="text-lg font-semibold text-white">{t('controls.title')}</h2>
        </div>
        <button 
          onClick={onOpenSettings}
          className="p-2 hover:bg-dark-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          title={t('controls.configure_btn')}
        >
            <Settings2 size={18} />
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Current Model Display */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('controls.active_model')}</label>
            <div className="flex items-center justify-between px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0 shadow-[0_0_8px_rgba(114,152,148,0.6)]" />
                    <span className="text-sm text-slate-200 truncate font-mono" title={model}>
                        {model}
                    </span>
                </div>
            </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">{t('controls.aspect_ratio')}</label>
            <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
            {Object.entries(AspectRatio).map(([key, value]) => (
                <option key={key} value={value}>
                {value} ({key.replace(/([A-Z])/g, ' $1').trim()})
                </option>
            ))}
            </select>
        </div>

        {/* Image Size - Conditional */}
        {showImageSize && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-sm font-medium text-slate-300">{t('controls.resolution')}</label>
            <div className="flex bg-dark-900 p-1 rounded-lg border border-dark-700">
                {Object.values(ImageSize).map((size) => (
                <button
                    key={size}
                    onClick={() => setImageSize(size)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    imageSize === size
                        ? 'bg-dark-700 text-brand-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    {size}
                </button>
                ))}
            </div>
            </div>
        )}
      </div>
      
      <div className="pt-4 border-t border-dark-700">
        <button 
            onClick={onOpenSettings}
            className="w-full py-2.5 px-4 rounded-lg border border-dashed border-dark-600 text-slate-400 hover:text-white hover:border-brand-500 hover:bg-dark-700/50 transition-all text-sm flex items-center justify-center gap-2"
        >
            <Settings2 size={16} />
            {t('controls.configure_btn')}
        </button>
      </div>
    </div>
  );
};

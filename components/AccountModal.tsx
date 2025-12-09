import React, { useState, useRef, useEffect } from 'react';
import { X, User, Save, Upload, Trash2, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { changePassword, paymentQrCode, setPaymentQrCode } = useAuth();

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // QR Code State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localQrPreview, setLocalQrPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setPasswordMessage('');
      setLocalQrPreview(paymentQrCode);
    }
  }, [isOpen, paymentQrCode]);

  const handlePasswordChange = () => {
    if (newPassword.trim().length > 0) {
        changePassword(newPassword.trim());
        setPasswordMessage(t('settings.password_saved'));
        setNewPassword('');
        setTimeout(() => setPasswordMessage(''), 3000);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLocalQrPreview(base64);
        setPaymentQrCode(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearQrCode = () => {
    setLocalQrPreview(null);
    setPaymentQrCode(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-100 text-brand-600 rounded-xl shadow-sm">
                <User size={22} />
            </div>
            <div>
                <h2 className="text-xl font-serif font-bold text-dark-900">{t('account.title')}</h2>
                <p className="text-slate-500 text-xs">{t('account.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
            
            {/* Section: Security */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-dark-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-brand-500"/>
                    {t('settings.security_title')}
                </h3>
                
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                    <label className="text-xs font-bold text-slate-600 block">
                        {t('settings.change_password')}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t('settings.new_password_placeholder')}
                            className="flex-1 bg-white border border-slate-200 rounded-md px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:outline-none focus:border-brand-500 transition-all"
                        />
                        <button
                            onClick={handlePasswordChange}
                            disabled={!newPassword.trim()}
                            className="px-4 py-2 bg-dark-800 text-white rounded-md text-xs font-bold hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        >
                            <Save size={14} />
                            {t('settings.update_btn')}
                        </button>
                    </div>
                    {passwordMessage && (
                        <div className="flex items-center gap-1.5 text-xs text-brand-600 font-medium animate-in fade-in slide-in-from-top-1 bg-brand-50 p-2 rounded-lg border border-brand-100">
                            <ShieldCheck size={12} />
                            {passwordMessage}
                        </div>
                    )}
                </div>
            </div>

            {/* Section: Payment Config */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-dark-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <ImageIcon size={16} className="text-brand-500"/>
                    {t('settings.payment_config')}
                </h3>
                
                <div className="flex items-start gap-4">
                    <div className="shrink-0 w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden relative group">
                        {localQrPreview ? (
                            <>
                                <img src={localQrPreview} alt="QR Preview" className="w-full h-full object-cover" />
                                <button 
                                    onClick={clearQrCode}
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        ) : (
                            <Upload className="text-slate-300" size={24} />
                        )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef}
                            onChange={handleQrUpload}
                            className="hidden" 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Upload size={14} />
                            {t('settings.qr_upload_btn')}
                        </button>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                            {t('settings.qr_upload_help')}
                        </p>
                    </div>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button
                onClick={onClose}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
                {t('docs.got_it')}
            </button>
        </div>

      </div>
    </div>
  );
};
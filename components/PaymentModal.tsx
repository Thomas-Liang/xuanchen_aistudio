import React from 'react';
import { X, CreditCard, ScanLine } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { paymentQrCode } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[450px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-100 text-brand-600 rounded-xl shadow-sm">
                <CreditCard size={22} />
            </div>
            <div>
                <h2 className="text-xl font-serif font-bold text-dark-900">{t('payment.title')}</h2>
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
        <div className="p-8 text-center space-y-6">
          <p className="text-slate-500 text-sm">
            {t('payment.subtitle')}
          </p>

          <div className="relative mx-auto bg-white p-4 rounded-xl border-2 border-dashed border-slate-200 shadow-inner w-fit">
            {paymentQrCode ? (
              <img 
                src={paymentQrCode} 
                alt="Payment QR Code" 
                className="max-w-[250px] max-h-[250px] object-contain rounded-lg"
              />
            ) : (
              <div className="w-[250px] h-[250px] flex flex-col items-center justify-center text-slate-300 bg-slate-50 rounded-lg">
                <ScanLine size={48} className="mb-2" />
                <span className="text-sm">{t('payment.no_qr')}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

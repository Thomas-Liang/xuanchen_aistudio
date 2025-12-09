import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export const LoginModal: React.FC = () => {
  const { t } = useLanguage();
  const { login, isLoggedIn } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (isLoggedIn) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/95 backdrop-blur-md">
      <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden font-sans p-8 text-center animate-in zoom-in-95 duration-300">
        
        <div className="mx-auto w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 mb-6">
          <Lock size={32} />
        </div>

        <h2 className="text-2xl font-serif font-bold text-dark-900 mb-2">{t('auth.title')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="text-left space-y-2">
            <label className="text-xs font-bold text-slate-600 ml-1">
              {t('auth.password_label')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder={t('auth.password_placeholder')}
              className={`w-full bg-[#F3F4F6] border-2 rounded-xl px-4 py-3 text-lg text-center text-slate-800 focus:outline-none transition-all ${
                error 
                  ? 'border-red-300 focus:border-red-500 bg-red-50' 
                  : 'border-transparent focus:border-brand-500 focus:bg-white'
              }`}
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brand-500 text-white font-bold text-lg hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 active:scale-[0.98] transform duration-100"
          >
            {t('auth.enter')}
          </button>
        </form>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { AspectRatio, ImageSize, GenerationResult, ApiResponse } from './types';
import { ControlPanel } from './components/ControlPanel';
import { FileUpload } from './components/FileUpload';
import { SettingsModal } from './components/SettingsModal';
import { DocsModal } from './components/DocsModal';
import { LoginModal } from './components/LoginModal';
import { PaymentModal } from './components/PaymentModal';
import { AccountModal } from './components/AccountModal';
import { generateImage } from './services/apiService';
import { DEFAULT_BASE_URL } from './constants';
import { Loader2, Download, AlertCircle, Wand2, Image as ImageIcon, BookOpen, Languages, Lock, Crown, UserCircle, Palette, Github } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { GitHubSyncModal } from './components/GitHubSyncModal';

const App: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { logout } = useAuth();
  const { theme, setTheme, availableThemes } = useTheme();

  // Config State
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState<string>('models/gemini-3-pro-image-preview');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Square);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.Size1K);
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isGitHubOpen, setIsGitHubOpen] = useState(false);
  
  // Input State
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // Execution State
  const [result, setResult] = useState<GenerationResult>({
    imageUrl: null,
    error: null,
    isLoading: false,
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setResult(prev => ({ ...prev, error: t('app.error_prompt') }));
      return;
    }

    setResult({ imageUrl: null, error: null, isLoading: true });

    try {
      const response: ApiResponse = await generateImage({
        baseUrl,
        apiKey,
        model,
        prompt,
        files,
        aspectRatio,
        imageSize,
      });

      if (response.data && response.data.length > 0) {
        let finalImage = null;
        const item = response.data[0];
        
        // Robustly handle different response formats and Base64 prefixes
        // Some proxies return 'b64_json', others 'base64' or 'image'
        const rawBase64 = item.b64_json || item.base64 || item.image;

        if (rawBase64) {
          if (rawBase64.startsWith('data:')) {
            // It already has the prefix (e.g., data:image/png;base64,...)
            finalImage = rawBase64;
          } else {
            // It is raw base64, add the standard PNG prefix
            // Note: Most browsers can handle JPEG data with a PNG prefix, but we default to PNG.
            finalImage = `data:image/png;base64,${rawBase64}`;
          }
        } else if (item.url) {
          finalImage = item.url;
        }

        if (finalImage) {
            setResult({ imageUrl: finalImage, error: null, isLoading: false });
        } else {
            throw new Error("No recognized image data format (b64_json, base64, or url) received.");
        }
      } else {
        throw new Error("Empty response from server");
      }
    } catch (err: any) {
      setResult({ imageUrl: null, error: err.message, isLoading: false });
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const cycleTheme = () => {
    const currentIndex = availableThemes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    setTheme(availableThemes[nextIndex]);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-200 font-sans p-4 md:p-8 transition-colors duration-500">
      <LoginModal />
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialConfig={{ apiKey, baseUrl, model }}
        onSave={(config) => {
            setApiKey(config.apiKey);
            setBaseUrl(config.baseUrl);
            setModel(config.model);
        }}
      />
      
      <DocsModal 
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
      />

      <GitHubSyncModal
        isOpen={isGitHubOpen}
        onClose={() => setIsGitHubOpen(false)}
      />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-dark-700 pb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-bold tracking-tight text-white flex items-center gap-2">
              {t('app.title')}
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              {t('app.description')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
                onClick={() => setIsPaymentOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white transition-all text-xs font-bold uppercase"
            >
                <Crown size={14} />
                <span>{t('app.payment_btn')}</span>
            </button>
            
            {/* Theme Toggle */}
            <button 
              onClick={cycleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-dark-800 border border-dark-700 text-slate-300 hover:text-white hover:border-brand-500 transition-all text-xs font-medium uppercase group"
              title={t('app.theme_btn')}
            >
              <Palette size={14} className="text-brand-400 group-hover:text-brand-300" />
              <span>{t(`theme.${theme}`)}</span>
            </button>

            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-dark-800 border border-dark-700 text-slate-300 hover:text-white hover:border-brand-500 transition-all text-xs font-medium uppercase"
            >
              <Languages size={14} className="text-brand-400" />
              <span>{language === 'en' ? '中文' : 'EN'}</span>
            </button>
            <button 
              onClick={() => setIsDocsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800 border border-dark-700 text-slate-300 hover:text-white hover:border-brand-500 transition-all text-sm group"
            >
              <BookOpen size={16} className="text-brand-400 group-hover:text-brand-300" />
              <span>{t('app.usage_guide')}</span>
            </button>
            <button 
              onClick={() => setIsAccountOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-dark-800 border border-dark-700 text-slate-400 hover:text-white hover:border-brand-500 transition-all text-sm"
              title={t('app.account_btn')}
            >
              <UserCircle size={16} />
            </button>
            <button 
              onClick={() => setIsGitHubOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-dark-800 border border-dark-700 text-slate-400 hover:text-white hover:border-brand-500 transition-all text-sm"
              title="GitHub Sync"
            >
              <Github size={16} />
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-dark-800 border border-dark-700 text-slate-400 hover:text-red-400 hover:border-red-400/50 transition-all text-sm"
              title={t('app.logout_btn')}
            >
              <Lock size={16} />
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Settings */}
          <div className="lg:col-span-3 lg:sticky lg:top-8 z-10">
            <ControlPanel 
              model={model}
              onOpenSettings={() => setIsSettingsOpen(true)}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              imageSize={imageSize}
              setImageSize={setImageSize}
            />
          </div>

          {/* Center Column: Workspace */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Prompt Input */}
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700 shadow-sm backdrop-blur-sm">
                <label className="block text-sm font-medium text-brand-400 mb-2">
                    {t('app.prompt_label')}
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('app.prompt_placeholder')}
                    className="w-full h-32 bg-dark-900 border border-dark-700 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none transition-all"
                />
            </div>

            {/* Reference Images */}
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700 shadow-sm backdrop-blur-sm">
                 <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('app.reference_label')}
                </label>
                <FileUpload files={files} onFilesChange={setFiles} />
            </div>

            {/* Generate Action */}
            <button
                onClick={handleGenerate}
                disabled={result.isLoading || !prompt.trim()}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${
                    result.isLoading || !prompt.trim()
                    ? 'bg-dark-700 text-slate-500 cursor-not-allowed'
                    : 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20'
                }`}
            >
                {result.isLoading ? (
                    <>
                        <Loader2 className="animate-spin" />
                        {t('app.generating')}
                    </>
                ) : (
                    <>
                        <Wand2 size={20} />
                        {t('app.generate_btn')}
                    </>
                )}
            </button>

            {/* Error Message */}
            {result.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                    <p className="text-sm">{result.error}</p>
                </div>
            )}
          </div>

          {/* Right Column: Preview / Result */}
          <div className="lg:col-span-4 lg:sticky lg:top-8">
            <div className="bg-dark-800/50 rounded-2xl border border-dark-700 overflow-hidden min-h-[400px] flex flex-col">
                <div className="p-4 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
                    <h3 className="font-semibold text-slate-200">{t('app.output_title')}</h3>
                    {result.imageUrl && (
                         <a 
                         href={result.imageUrl} 
                         download={`xuanchen-ai-studio-${Date.now()}.png`}
                         className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 px-3 py-1.5 rounded-full transition-colors"
                       >
                         <Download size={14} />
                         {t('app.download')}
                       </a>
                    )}
                </div>
                
                <div className="flex-1 flex items-center justify-center p-6 bg-black/20 relative">
                    {result.isLoading ? (
                        <div className="flex flex-col items-center justify-center space-y-4 animate-pulse-slow">
                             <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center">
                                <Loader2 className="animate-spin text-brand-500" size={32} />
                             </div>
                             <p className="text-slate-500 text-sm">{t('app.processing')}</p>
                        </div>
                    ) : result.imageUrl ? (
                        <div className="relative w-full h-full min-h-[300px] flex items-center justify-center group">
                            <img 
                                src={result.imageUrl} 
                                alt="Generated Art" 
                                className="max-w-full max-h-[600px] rounded-lg shadow-2xl object-contain"
                            />
                        </div>
                    ) : (
                        <div className="text-center space-y-3 p-8 border-2 border-dashed border-dark-700 rounded-xl w-full">
                            <div className="mx-auto w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center text-dark-600">
                                <ImageIcon size={24} />
                            </div>
                            <p className="text-slate-500 text-sm whitespace-pre-line">
                                {t('app.waiting_msg')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default App;
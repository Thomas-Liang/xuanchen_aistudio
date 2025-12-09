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
import { Loader2, Download, AlertCircle, Wand2, Image as ImageIcon, BookOpen, Lock, Crown, UserCircle, Palette, Github } from 'lucide-react';
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
    <div className="min-h-screen bg-dark-900 text-slate-200 font-sans p-3 sm:p-4 md:p-6 lg:p-8 transition-colors duration-500">
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

      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 lg:space-y-8">
        
        {/* Header */}
        <header className="border-b border-dark-700 pb-4">
          {/* Top Row: Title + Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif font-bold tracking-tight text-white truncate">
              {t('app.title')}
            </h1>
            
            {/* Action Buttons - Always visible, compact */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Premium */}
              <button 
                  onClick={() => setIsPaymentOpen(true)}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white transition-all text-xs font-bold"
                  title={t('app.payment_btn')}
              >
                  <Crown size={14} />
                  <span className="hidden sm:inline">{t('app.payment_btn')}</span>
              </button>
              
              {/* Theme */}
              <button 
                onClick={cycleTheme}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-dark-800 border border-dark-700 text-slate-300 hover:text-white hover:border-brand-500 transition-all"
                title={t('app.theme_btn')}
              >
                <Palette size={16} className="text-brand-400" />
              </button>

              {/* Language */}
              <button 
                onClick={toggleLanguage}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-dark-800 border border-dark-700 text-slate-300 hover:text-white hover:border-brand-500 transition-all text-xs font-bold"
                title={language === 'en' ? '中文' : 'EN'}
              >
                {language === 'en' ? '中' : 'EN'}
              </button>
              
              {/* Docs */}
              <button 
                onClick={() => setIsDocsOpen(true)}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-dark-800 border border-dark-700 text-slate-300 hover:text-white hover:border-brand-500 transition-all"
                title={t('app.usage_guide')}
              >
                <BookOpen size={16} className="text-brand-400" />
              </button>
              
              {/* Divider */}
              <div className="w-px h-6 bg-dark-700 mx-0.5 hidden sm:block" />
              
              {/* Account */}
              <button 
                onClick={() => setIsAccountOpen(true)}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-dark-800 border border-dark-700 text-slate-400 hover:text-white hover:border-brand-500 transition-all"
                title={t('app.account_btn')}
              >
                <UserCircle size={16} />
              </button>
              
              {/* GitHub */}
              <button 
                onClick={() => setIsGitHubOpen(true)}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-dark-800 border border-dark-700 text-slate-400 hover:text-white hover:border-brand-500 transition-all"
                title="GitHub Sync"
              >
                <Github size={16} />
              </button>
              
              {/* Logout */}
              <button 
                onClick={logout}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-dark-800 border border-dark-700 text-slate-400 hover:text-red-400 hover:border-red-400/50 transition-all"
                title={t('app.logout_btn')}
              >
                <Lock size={16} />
              </button>
            </div>
          </div>
          
          {/* Subtitle - Only on larger screens */}
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed mt-2 hidden md:block">
            {t('app.description')}
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Settings - Collapsible on Mobile */}
          <div className="lg:col-span-3 lg:sticky lg:top-8 z-10 order-2 lg:order-1">
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
          <div className="lg:col-span-5 space-y-4 md:space-y-6 order-1 lg:order-2">
            
            {/* Prompt Input */}
            <div className="bg-dark-800/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-dark-700 shadow-sm backdrop-blur-sm">
                <label className="block text-sm font-medium text-brand-400 mb-2">
                    {t('app.prompt_label')}
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('app.prompt_placeholder')}
                    className="w-full h-24 md:h-32 bg-dark-900 border border-dark-700 rounded-lg md:rounded-xl p-3 md:p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none transition-all text-sm md:text-base"
                />
            </div>

            {/* Reference Images */}
            <div className="bg-dark-800/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-dark-700 shadow-sm backdrop-blur-sm">
                 <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('app.reference_label')}
                </label>
                <FileUpload files={files} onFilesChange={setFiles} />
            </div>

            {/* Generate Action */}
            <button
                onClick={handleGenerate}
                disabled={result.isLoading || !prompt.trim()}
                className={`w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${
                    result.isLoading || !prompt.trim()
                    ? 'bg-dark-700 text-slate-500 cursor-not-allowed'
                    : 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20'
                }`}
            >
                {result.isLoading ? (
                    <>
                        <Loader2 className="animate-spin" size={18} />
                        <span className="text-sm md:text-base">{t('app.generating')}</span>
                    </>
                ) : (
                    <>
                        <Wand2 size={18} />
                        <span>{t('app.generate_btn')}</span>
                    </>
                )}
            </button>

            {/* Error Message */}
            {result.error && (
                <div className="p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="text-xs md:text-sm">{result.error}</p>
                </div>
            )}
          </div>

          {/* Right Column: Preview / Result */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 order-3">
            <div className="bg-dark-800/50 rounded-xl md:rounded-2xl border border-dark-700 overflow-hidden min-h-[300px] md:min-h-[400px] flex flex-col">
                <div className="p-3 md:p-4 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
                    <h3 className="font-semibold text-slate-200 text-sm md:text-base">{t('app.output_title')}</h3>
                    {result.imageUrl && (
                         <a 
                         href={result.imageUrl} 
                         download={`xuanchen-ai-studio-${Date.now()}.png`}
                         className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 px-2 md:px-3 py-1 md:py-1.5 rounded-full transition-colors"
                       >
                         <Download size={12} />
                         <span className="hidden sm:inline">{t('app.download')}</span>
                       </a>
                    )}
                </div>
                
                <div className="flex-1 flex items-center justify-center p-4 md:p-6 bg-black/20 relative">
                    {result.isLoading ? (
                        <div className="flex flex-col items-center justify-center space-y-4 animate-pulse-slow">
                             <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-brand-500/20 flex items-center justify-center">
                                <Loader2 className="animate-spin text-brand-500" size={24} />
                             </div>
                             <p className="text-slate-500 text-xs md:text-sm">{t('app.processing')}</p>
                        </div>
                    ) : result.imageUrl ? (
                        <div className="relative w-full h-full min-h-[200px] md:min-h-[300px] flex items-center justify-center group">
                            <img 
                                src={result.imageUrl} 
                                alt="Generated Art" 
                                className="max-w-full max-h-[400px] md:max-h-[600px] rounded-lg shadow-2xl object-contain"
                            />
                        </div>
                    ) : (
                        <div className="text-center space-y-3 p-4 md:p-8 border-2 border-dashed border-dark-700 rounded-xl w-full">
                            <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-dark-800 rounded-full flex items-center justify-center text-dark-600">
                                <ImageIcon size={20} />
                            </div>
                            <p className="text-slate-500 text-xs md:text-sm whitespace-pre-line">
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
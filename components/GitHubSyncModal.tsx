import React, { useState, useRef, useEffect } from 'react';
import { Github, Upload, FolderInput, CheckCircle, AlertCircle, Loader2, Save, Plus, GitBranch, RefreshCw, FileDiff, ArrowRight, Lock, Globe, Bot, Play, Square, History } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
    RepoInfo, 
    FileEntry, 
    getUserRepos, 
    createRepository, 
    getBranches, 
    getRemoteTree, 
    computeGitSha, 
    uploadToGitHub 
} from '../services/githubService';
import { FileSystemDirectoryHandle, getFilesFromDirectoryHandle, saveDirectoryHandle, getSavedDirectoryHandle } from '../utils/fileSystem';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'manual' | 'bot';
type Step = 'auth' | 'repo_select' | 'diff' | 'sync';
type FileStatus = 'new' | 'modified' | 'unchanged' | 'deleted'; 

interface DiffResult {
    path: string;
    status: FileStatus;
    fileEntry?: FileEntry;
}

interface BotLog {
    timestamp: Date;
    message: string;
    type: 'info' | 'success' | 'error' | 'action';
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage(); 
  
  // -- Mode State --
  const [mode, setMode] = useState<Mode>('manual');

  // -- Auth State --
  const [token, setToken] = useState(() => localStorage.getItem('github_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // -- Repo State --
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepoInfo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);

  // -- File/Diff State --
  const [localFiles, setLocalFiles] = useState<FileEntry[]>([]);
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  
  // -- Manual Operation State --
  const [step, setStep] = useState<Step>('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState('');
  const [commitMessage, setCommitMessage] = useState('Update from Nanobanana Studio');

  // -- Bot State --
  const [botActive, setBotActive] = useState(false);
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [botInterval, setBotInterval] = useState(60); // seconds
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved handle on mount
  useEffect(() => {
    const loadHandle = async () => {
        try {
            const saved = await getSavedDirectoryHandle();
            if (saved) {
                setDirHandle(saved);
                addBotLog(`Restored folder: ${saved.name}`, 'info');
            }
        } catch (e) {
            console.warn("Failed to load saved directory handle", e);
        }
    };
    loadHandle();
  }, []);

  // ... (Keep existing useEffects) ...
  // Auto-login if token exists
  useEffect(() => {
      if (isOpen && token && !isAuthenticated && repos.length === 0) {
          handleConnect();
      }
  }, [isOpen]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
        setStep('auth');
        setDiffResults([]);
        setLocalFiles([]);
        setErrorMsg('');
        stopBot(false);
    }
  }, [isOpen]);

  // Cleanup bot on unmount
  useEffect(() => {
      return () => stopBot(false);
  }, []);

  const addBotLog = (message: string, type: BotLog['type'] = 'info') => {
      setBotLogs(prev => [{ timestamp: new Date(), message, type }, ...prev].slice(0, 50));
  };

  const stopBot = (showLog = true) => {
      if (botTimerRef.current) {
          clearInterval(botTimerRef.current);
          botTimerRef.current = null;
      }
      
      // Only log if we were actually running or user forced it, AND showLog is true
      if (botActive && showLog) {
          addBotLog('Bot stopped.', 'info');
      }
      
      setBotActive(false);
  };

  const startBot = async () => {
      if (!selectedRepo || !dirHandle) {
          setErrorMsg('Please select a repository and a local folder first.');
          return;
      }
      
      setBotActive(true);
      addBotLog(`Bot started. Watching for changes every ${botInterval}s...`, 'success');
      
      // Immediate first run
      await runBotCycle();

      // Interval run
      botTimerRef.current = setInterval(async () => {
          await runBotCycle();
      }, botInterval * 1000);
  };

  const runBotCycle = async () => {
      if (!dirHandle || !selectedRepo) return;
      
      addBotLog('Scanning for changes...', 'action');
      
      try {
          // 1. Read Files using Handle
          const files = await getFilesFromDirectoryHandle(dirHandle);
          const entries: FileEntry[] = [];
          
          for (const { path, file } of files) {
             const isBinary = file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/') || file.name.endsWith('.pdf') || file.name.endsWith('.zip');
             let content: string | ArrayBuffer;
             if (isBinary) content = await file.arrayBuffer();
             else content = await file.text();
             
             const sha = await computeGitSha(content, isBinary);
             entries.push({ path, content, isBinary, sha });
          }

          // 2. Compare with Remote
          const remoteMap = await getRemoteTree(token, selectedRepo.owner.login, selectedRepo.name, selectedBranch);
          
          const changes = entries.filter(local => {
             const remoteSha = remoteMap?.get(local.path);
             return !remoteSha || remoteSha !== local.sha;
          });

          if (changes.length > 0) {
              const fileNames = changes.map(c => c.path.split('/').pop()).slice(0, 3).join(', ');
              const more = changes.length > 3 ? ` and ${changes.length - 3} more` : '';
              addBotLog(`Detected ${changes.length} changes: ${fileNames}${more}`, 'info');
              addBotLog('Pushing changes...', 'action');
              
              await uploadToGitHub(
                  { token, owner: selectedRepo.owner.login, repo: selectedRepo.name, branch: selectedBranch },
                  changes,
                  `Auto-save by Bot at ${new Date().toLocaleTimeString()}`,
                  (c, t, s) => {} // Silent progress for bot
              );
              
              addBotLog('Successfully pushed changes to GitHub.', 'success');
          } else {
              addBotLog('No changes detected.', 'info');
          }

      } catch (e: any) {
          addBotLog(`Error: ${e.message}`, 'error');
          // Don't stop bot on error, just log it
      }
  };

  const handleConnect = async () => {
      if (!token) return;
      setIsLoading(true);
      setErrorMsg('');
      try {
          const repoList = await getUserRepos(token);
          setRepos(repoList);
          setIsAuthenticated(true);
          // Don't change step here if already in bot mode
          if (step === 'auth') setStep('repo_select');
          localStorage.setItem('github_token', token);
      } catch (e: any) {
          setErrorMsg(e.message);
          setIsAuthenticated(false);
      } finally {
          setIsLoading(false);
      }
  };

  const handleCreateRepo = async () => {
      // ... (Same as before)
      if (!newRepoName) return;
      setIsLoading(true);
      setErrorMsg('');
      try {
          const newRepo = await createRepository(token, newRepoName, newRepoPrivate);
          setRepos([newRepo, ...repos]);
          setSelectedRepo(newRepo);
          setSelectedBranch(newRepo.default_branch || 'main');
          setBranches([newRepo.default_branch || 'main']);
          setIsCreatingRepo(false);
          setNewRepoName('');
      } catch (e: any) {
          setErrorMsg(e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleRepoSelect = async (repoId: string) => {
      // ... (Same as before)
      const repo = repos.find(r => r.id.toString() === repoId);
      if (!repo) return;
      
      setSelectedRepo(repo);
      setIsLoading(true);
      setBranches([]);
      
      try {
          const branchList = await getBranches(token, repo.owner.login, repo.name);
          setBranches(branchList);
          if (branchList.includes(repo.default_branch)) {
              setSelectedBranch(repo.default_branch);
          } else if (branchList.length > 0) {
              setSelectedBranch(branchList[0]);
          } else {
             setSelectedBranch('main'); // Empty repo
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  // Helper: Process and hash files (shared between manual and bot)
  const processFiles = async (fileList: { path: string, file: File }[]) => {
      const entries: FileEntry[] = [];
      for (const { path, file } of fileList) {
            const isBinary = file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/') || file.name.endsWith('.pdf') || file.name.endsWith('.zip');
            
            let content: string | ArrayBuffer;
            if (isBinary) content = await file.arrayBuffer();
            else content = await file.text();

            const sha = await computeGitSha(content, isBinary);
            entries.push({ path, content, isBinary, sha });
      }
      return entries;
  };

  // Helper: Compare with remote and update state
  const analyzeChanges = async (entries: FileEntry[]) => {
        setLocalFiles(entries);
        
        setStatusText('Fetching remote comparison...');
        const remoteMap = await getRemoteTree(token, selectedRepo!.owner.login, selectedRepo!.name, selectedBranch);
        
        const results: DiffResult[] = [];
        for (const local of entries) {
            const remoteSha = remoteMap?.get(local.path);
            if (!remoteSha) {
                results.push({ path: local.path, status: 'new', fileEntry: local });
            } else if (remoteSha !== local.sha) {
                results.push({ path: local.path, status: 'modified', fileEntry: local });
            } else {
                results.push({ path: local.path, status: 'unchanged' });
            }
        }
        setDiffResults(results);
        setStep('diff');
  };

  // Manual File Select (Input)
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedRepo) {
      setIsLoading(true);
      setStatusText('Reading local files...');
      setErrorMsg('');
      
      try {
        const rawFiles = Array.from(e.target.files);
        const shouldIgnore = (path: string) => {
            const p = path.replace(/\\/g, '/');
            return p.includes('/node_modules/') || 
                   p.includes('/.git/') || 
                   p.includes('/dist/') ||
                   p.includes('/build/') ||
                   p.includes('/.next/') ||
                   p.includes('/.DS_Store');
        };

        const normalizedFiles = rawFiles
            .filter(f => !shouldIgnore(f.webkitRelativePath))
            .map(f => {
                const parts = f.webkitRelativePath.split('/');
                return {
                    path: parts.slice(1).join('/'), // strip root
                    file: f
                };
            })
            .filter(f => f.path); // remove empty paths (root files)

        const entries = await processFiles(normalizedFiles);
        await analyzeChanges(entries);

      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setIsLoading(false);
        setStatusText('');
      }
    }
  };

  // Combined Smart Select (Manual Mode)
  const handleSmartSelect = async () => {
      // @ts-ignore
      if (typeof window.showDirectoryPicker === 'function') {
          try {
              // @ts-ignore
              const handle = await window.showDirectoryPicker();
              setDirHandle(handle);
              await saveDirectoryHandle(handle);
              
              // Immediately process for manual mode
              setIsLoading(true);
              setStatusText('Reading local files...');
              
              const files = await getFilesFromDirectoryHandle(handle);
              const entries = await processFiles(files);
              await analyzeChanges(entries);
              
          } catch (e: any) {
              if (e.name !== 'AbortError') {
                  console.error(e);
                  setErrorMsg('Failed to access folder via API. Trying fallback...');
                  fileInputRef.current?.click();
              }
          } finally {
              setIsLoading(false);
              setStatusText('');
          }
      } else {
          // Fallback for non-Chromium browsers
          fileInputRef.current?.click();
      }
  };

  // Bot Folder Select (Using File System Access API)
  const handleBotFolderSelect = async () => {
      try {
          // @ts-ignore - showDirectoryPicker is experimental/new
          const handle = await window.showDirectoryPicker();
          setDirHandle(handle);
          addBotLog(`Selected directory: ${handle.name}`, 'info');
      } catch (e: any) {
          if (e.name !== 'AbortError') {
              setErrorMsg('File System Access API not supported or denied. Please use Chrome/Edge.');
          }
      }
  };

  const handlePush = async () => {
      // ... (Same as before)
      if (!selectedRepo) return;
      
      const filesToUpload = diffResults
          .filter(d => (d.status === 'new' || d.status === 'modified') && d.fileEntry)
          .map(d => d.fileEntry!);

      if (filesToUpload.length === 0) {
          setErrorMsg("No changes to push.");
          return;
      }

      setIsLoading(true);
      setStep('sync');
      
      try {
          await uploadToGitHub(
              { token, owner: selectedRepo.owner.login, repo: selectedRepo.name, branch: selectedBranch },
              filesToUpload,
              commitMessage,
              (current, total, text) => {
                  setProgress({ current, total });
                  setStatusText(text);
              }
          );
          
          setStatusText('Success!');
          setTimeout(() => {
              onClose();
          }, 1500);

      } catch (e: any) {
          setErrorMsg(e.message);
          setStep('diff'); 
      } finally {
          setIsLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
          <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Github className="text-white" />
                GitHub Sync
              </h2>
              {/* Mode Toggle */}
              <div className="flex bg-dark-800 p-1 rounded-lg border border-dark-700">
                  <button 
                    onClick={() => setMode('manual')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === 'manual' ? 'bg-dark-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                      Manual
                  </button>
                  <button 
                    onClick={() => setMode('bot')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${mode === 'bot' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                      <Bot size={12} />
                      Auto Bot
                  </button>
              </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            
            {/* Error Banner */}
            {errorMsg && (
                <div className="mb-4 flex items-start gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {step === 'auth' ? (
                // Auth View (Shared)
                <div className="space-y-4">
                    <div className="text-center pb-4">
                        <Github size={48} className="mx-auto text-slate-500 mb-2" />
                        <h3 className="text-lg font-medium text-white">Connect to GitHub</h3>
                        <p className="text-slate-400 text-sm">Enter your Personal Access Token with 'repo' scope.</p>
                    </div>
                    <div className="space-y-2">
                         <label className="text-sm font-medium text-slate-300">Personal Access Token</label>
                         <input
                             type="password"
                             value={token}
                             onChange={(e) => setToken(e.target.value)}
                             className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-slate-200 focus:border-brand-500 focus:outline-none"
                             placeholder="ghp_..."
                         />
                    </div>
                    <button
                        onClick={handleConnect}
                        disabled={isLoading || !token}
                        className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                        Connect
                    </button>
                </div>
            ) : mode === 'bot' ? (
                // --- BOT MODE ---
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 flex items-start gap-3">
                        <Bot className="text-brand-400 mt-1" size={20} />
                        <div>
                            <h4 className="text-brand-400 font-bold text-sm">Automated Watch Mode</h4>
                            <p className="text-slate-400 text-xs mt-1">
                                The bot will monitor your selected local folder and automatically push changes to GitHub at the specified interval.
                                <br/>
                                <span className="opacity-70 italic">Note: Requires 'Edit' permissions on the folder (Chrome/Edge only).</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         {/* Repo Select */}
                         <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase">Target Repository</label>
                             <select
                                value={selectedRepo?.id || ''}
                                onChange={(e) => handleRepoSelect(e.target.value)}
                                disabled={botActive}
                                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                            >
                                <option value="" disabled>Select Repo...</option>
                                {repos.map(r => (
                                    <option key={r.id} value={r.id}>{r.full_name}</option>
                                ))}
                            </select>
                         </div>
                         
                         {/* Interval */}
                         <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase">Check Interval</label>
                             <select
                                value={botInterval}
                                onChange={(e) => setBotInterval(Number(e.target.value))}
                                disabled={botActive}
                                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                            >
                                <option value={5}>Every 5 seconds (Fast)</option>
                                <option value={10}>Every 10 seconds</option>
                                <option value={30}>Every 30 seconds</option>
                                <option value={60}>Every 1 minute</option>
                                <option value={300}>Every 5 minutes</option>
                                <option value={600}>Every 10 minutes</option>
                                <option value={1800}>Every 30 minutes</option>
                                <option value={3600}>Every 1 hour</option>
                            </select>
                         </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Local Watch Folder</label>
                        <button 
                            onClick={handleBotFolderSelect}
                            disabled={botActive}
                            className={`w-full py-3 px-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${
                                dirHandle 
                                ? 'border-brand-500/50 bg-brand-500/5 text-brand-400' 
                                : 'border-dark-600 bg-dark-900/50 text-slate-400 hover:border-slate-500'
                            }`}
                        >
                            <FolderInput size={20} />
                            {dirHandle ? dirHandle.name : 'Select Folder to Watch...'}
                        </button>
                    </div>

                    {/* Bot Controls */}
                    <div className="flex gap-3 pt-2">
                        {!botActive ? (
                            <button
                                onClick={startBot}
                                disabled={!dirHandle || !selectedRepo}
                                className="flex-1 py-3 bg-[#2da44e] hover:bg-[#2c974b] text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                            >
                                <Play size={18} fill="currentColor" />
                                Start Bot
                            </button>
                        ) : (
                            <button
                                onClick={() => stopBot(true)}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                            >
                                <Square size={18} fill="currentColor" />
                                Stop Bot
                            </button>
                        )}
                    </div>

                    {/* Terminal Log */}
                    <div className="bg-black/40 rounded-xl border border-dark-700 p-4 font-mono text-xs h-48 overflow-y-auto">
                        <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-dark-700 pb-2">
                            <History size={12} />
                            <span>Activity Log</span>
                        </div>
                        <div className="space-y-1">
                            {botLogs.length === 0 && <span className="text-slate-600 italic">Waiting to start...</span>}
                            {botLogs.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-slate-600">[{log.timestamp.toLocaleTimeString()}]</span>
                                    <span className={`
                                        ${log.type === 'error' ? 'text-red-400' : ''}
                                        ${log.type === 'success' ? 'text-green-400' : ''}
                                        ${log.type === 'action' ? 'text-brand-400' : ''}
                                        ${log.type === 'info' ? 'text-slate-300' : ''}
                                    `}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                // --- MANUAL MODE (Existing) ---
                <div className="space-y-6">
                    {step === 'repo_select' && (
                         <div className="space-y-6">
                            {/* Repo Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex justify-between">
                                    Repository
                                    <button 
                                        onClick={() => setIsCreatingRepo(!isCreatingRepo)}
                                        className="text-brand-400 text-xs hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={12} /> New Repository
                                    </button>
                                </label>
        
                                {isCreatingRepo ? (
                                    <div className="p-4 bg-dark-900 rounded-xl border border-dark-700 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-white">Create New Repository</span>
                                            <button onClick={() => setIsCreatingRepo(false)} className="text-xs text-slate-500">Cancel</button>
                                        </div>
                                        <input
                                            type="text"
                                            value={newRepoName}
                                            onChange={(e) => setNewRepoName(e.target.value)}
                                            placeholder="Repository Name"
                                            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                                        />
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    checked={newRepoPrivate} 
                                                    onChange={() => setNewRepoPrivate(true)} 
                                                    className="text-brand-500"
                                                />
                                                <Lock size={14} /> Private
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    checked={!newRepoPrivate} 
                                                    onChange={() => setNewRepoPrivate(false)} 
                                                    className="text-brand-500"
                                                />
                                                <Globe size={14} /> Public
                                            </label>
                                        </div>
                                        <button
                                            onClick={handleCreateRepo}
                                            disabled={isLoading || !newRepoName}
                                            className="w-full py-2 bg-brand-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                        >
                                            {isLoading ? 'Creating...' : 'Create Repository'}
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedRepo?.id || ''}
                                        onChange={(e) => handleRepoSelect(e.target.value)}
                                        className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-slate-200 focus:border-brand-500 focus:outline-none"
                                    >
                                        <option value="" disabled>Select a repository...</option>
                                        {repos.map(r => (
                                            <option key={r.id} value={r.id}>{r.full_name} ({r.private ? 'Private' : 'Public'})</option>
                                        ))}
                                    </select>
                                )}
                            </div>
        
                            {/* Branch Selector */}
                            {selectedRepo && !isCreatingRepo && (
                                 <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Branch</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedBranch}
                                            onChange={(e) => setSelectedBranch(e.target.value)}
                                            className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-slate-200 focus:border-brand-500 focus:outline-none"
                                        >
                                            {branches.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                            {branches.length === 0 && <option value="main">main (default)</option>}
                                        </select>
                                        <button 
                                            onClick={() => handleRepoSelect(selectedRepo.id.toString())}
                                            className="p-3 bg-dark-900 border border-dark-700 rounded-xl text-slate-400 hover:text-white"
                                            title="Refresh Branches"
                                        >
                                            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                                        </button>
                                    </div>
                                 </div>
                            )}
        
                            {/* Folder Picker */}
                            {selectedRepo && !isCreatingRepo && (
                                <div className="pt-4 border-t border-dark-700">
                                     {dirHandle ? (
                                         <div className="bg-dark-900/50 rounded-xl border border-brand-500/30 p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                             <div className="mx-auto w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center text-brand-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                 <FolderInput size={32} />
                                             </div>
                                             <div>
                                                 <h4 className="text-white font-bold text-lg">{dirHandle.name}</h4>
                                                 <p className="text-slate-500 text-sm">Folder automatically identified</p>
                                             </div>
                                             
                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                 <button 
                                                     onClick={async () => {
                                                         setIsLoading(true);
                                                         setStatusText('Scanning saved folder...');
                                                         try {
                                                             const hasPerm = await verifyPermission(dirHandle, false);
                                                             if (!hasPerm) {
                                                                 setErrorMsg('Permission check failed. Please re-select.');
                                                                 setIsLoading(false);
                                                                 return;
                                                             }
                                                             const files = await getFilesFromDirectoryHandle(dirHandle);
                                                             const entries = await processFiles(files);
                                                             await analyzeChanges(entries);
                                                         } catch (e: any) {
                                                             setErrorMsg(e.message);
                                                         } finally {
                                                             setIsLoading(false);
                                                         }
                                                     }}
                                                     className="py-3 bg-[#2da44e] hover:bg-[#2c974b] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all transform active:scale-95"
                                                 >
                                                     <ArrowRight size={18} />
                                                     Scan Changes
                                                 </button>
                                                 <button 
                                                     onClick={handleSmartSelect}
                                                     className="py-3 bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-600 rounded-xl font-medium transition-all"
                                                 >
                                                     Change Folder
                                                 </button>
                                             </div>
                                         </div>
                                     ) : (
                                         <div 
                                            onClick={handleSmartSelect}
                                            className="cursor-pointer group p-8 bg-dark-900/50 rounded-xl border-2 border-dashed border-dark-600 hover:border-brand-500 transition-all flex flex-col items-center justify-center text-center"
                                         >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                // @ts-ignore
                                                webkitdirectory=""
                                                directory=""
                                                onChange={handleFolderSelect}
                                                className="hidden"
                                            />
                                            {isLoading ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="animate-spin text-brand-500" size={32} />
                                                    <p className="text-slate-400 text-sm">{statusText || 'Processing...'}</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <FolderInput size={32} className="text-slate-400 group-hover:text-brand-400 transition-colors mb-2" />
                                                    <h4 className="text-slate-200 font-medium">Select Project Folder</h4>
                                                    <p className="text-slate-500 text-xs mt-1">
                                                        {typeof window.showDirectoryPicker === 'function' 
                                                            ? 'Auto-detects using File System API' 
                                                            : 'Click to analyze changes'
                                                        }
                                                    </p>
                                                </>
                                            )}
                                         </div>
                                     )}
                                </div>
                            )}
                        </div>
                    )}
        
                    {step === 'diff' && (
                        <div className="space-y-4 h-full flex flex-col">
                             <div className="flex items-center justify-between">
                                 <h3 className="text-white font-medium flex items-center gap-2">
                                     <FileDiff size={18} className="text-brand-400" />
                                     Changes Detected
                                 </h3>
                                 <button onClick={() => setStep('repo_select')} className="text-xs text-slate-500 hover:text-white">
                                     Change Folder
                                 </button>
                             </div>
        
                             <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden flex-1 min-h-[200px] overflow-y-auto">
                                 {diffResults.filter(d => d.status !== 'unchanged').length === 0 ? (
                                     <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500">
                                         <CheckCircle size={32} className="mb-2 text-green-500/50" />
                                         <p>Your local folder matches the remote branch.</p>
                                         <p className="text-xs">No changes to push.</p>
                                     </div>
                                 ) : (
                                     <table className="w-full text-sm text-left">
                                         <thead className="bg-dark-800 text-slate-400 font-medium text-xs uppercase">
                                             <tr>
                                                 <th className="px-4 py-2">Status</th>
                                                 <th className="px-4 py-2">File</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-dark-800">
                                             {diffResults.filter(d => d.status !== 'unchanged').map((diff) => (
                                                 <tr key={diff.path} className="hover:bg-dark-800/50">
                                                     <td className="px-4 py-2 w-20">
                                                         {diff.status === 'new' && <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">NEW</span>}
                                                         {diff.status === 'modified' && <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">MOD</span>}
                                                     </td>
                                                     <td className="px-4 py-2 text-slate-300 font-mono text-xs truncate max-w-[300px]" title={diff.path}>
                                                         {diff.path}
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 )}
                             </div>
        
                             <div className="space-y-3 pt-2">
                                 <input
                                    type="text"
                                    value={commitMessage}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                    placeholder="Commit message..."
                                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2 text-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                                 />
                                 <button
                                    onClick={handlePush}
                                    disabled={diffResults.filter(d => d.status !== 'unchanged').length === 0}
                                    className="w-full py-3 bg-[#2da44e] hover:bg-[#2c974b] text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                                 >
                                     <Upload size={18} />
                                     Push Changes
                                 </button>
                             </div>
                        </div>
                    )}
        
                    {step === 'sync' && (
                        <div className="h-full flex flex-col items-center justify-center space-y-6 py-8">
                             <div className="relative">
                                <div className="w-20 h-20 border-4 border-dark-700 border-t-brand-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-brand-500">
                                        {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                                    </span>
                                </div>
                             </div>
                             <div className="text-center space-y-2">
                                 <h3 className="text-xl font-semibold text-white">Pushing to GitHub...</h3>
                                 <p className="text-slate-400 text-sm">{statusText}</p>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

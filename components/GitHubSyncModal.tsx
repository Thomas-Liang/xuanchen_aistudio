import React, { useState, useRef } from 'react';
import { Github, Upload, FolderInput, CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { parseRepoUrl, uploadToGitHub } from '../services/githubService';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage(); // Assuming we can use t, or fallback to english strings
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('github_token') || '');
  const [message, setMessage] = useState('Update from Nanobanana Studio');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, statusText: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      
      const shouldIgnore = (path: string) => {
          const p = path.replace(/\\/g, '/');
          // Ignore patterns
          return p.includes('/node_modules/') || 
                 p.includes('/.git/') || 
                 p.includes('/dist/') ||
                 p.includes('/build/') ||
                 p.includes('/.next/') ||
                 p.includes('/.DS_Store');
      };

      // Filter out node_modules and .git to prevent massive uploads/hanging
      const filtered = fileList.filter(f => !shouldIgnore(f.webkitRelativePath));
      
      setSelectedFiles(filtered);
      setStatus('idle');
    }
  };

  const handleSync = async () => {
    if (!repoUrl || !token || selectedFiles.length === 0) {
      setErrorMsg('Please fill in all fields and select a folder.');
      return;
    }

    const repoInfo = parseRepoUrl(repoUrl);
    if (!repoInfo) {
      setErrorMsg('Invalid repository URL.');
      return;
    }

    // Save token
    localStorage.setItem('github_token', token);

    setStatus('scanning');
    setErrorMsg('');

    try {
      // 1. Read files
      const filesToUpload = [];
      const total = selectedFiles.length;
      
      for (let i = 0; i < total; i++) {
        const file = selectedFiles[i];
        setProgress({ current: i + 1, total, statusText: `Reading ${file.name}...` });
        
        // Simple heuristic for binary files
        const isBinary = file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/') || file.name.endsWith('.pdf') || file.name.endsWith('.zip');
        
        let content;
        if (isBinary) {
            content = await file.arrayBuffer();
        } else {
            content = await file.text();
        }

        // Remove the root folder name from the path if preferred, or keep it.
        // webkitRelativePath is usually "FolderName/sub/file.ext"
        // We probably want to strip "FolderName/" to put contents at root of repo, 
        const pathParts = file.webkitRelativePath.split('/');
        
        // If the path is somehow invalid or just the root folder name
        if (pathParts.length < 2) continue;

        const relativePath = pathParts.slice(1).join('/');
        
        // Double check ignoring logic in case
        if (relativePath.includes('node_modules/') || relativePath.startsWith('.git/')) {
            continue;
        }
        
        if (relativePath) { // Skip if it's just the root folder itself somehow
            filesToUpload.push({
                path: relativePath,
                content,
                isBinary
            });
        }
      }

      setStatus('uploading');
      
      await uploadToGitHub(
        { ...repoInfo, token, branch: 'main' },
        filesToUpload,
        message,
        (current, total, statusText) => {
            setProgress({ current, total, statusText });
        }
      );

      setStatus('success');
      setTimeout(() => {
          onClose();
          setStatus('idle');
          setSelectedFiles([]);
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Upload failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-dark-700 pb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Github className="text-white" />
            GitHub Sync
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
           {/* Repo URL */}
           <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Repository URL
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2 text-slate-200 focus:border-brand-500 focus:outline-none"
              />
           </div>

           {/* Token */}
           <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Personal Access Token (Repo Scope)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2 text-slate-200 focus:border-brand-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Token is saved locally. Never share your token.
              </p>
           </div>

           {/* Commit Message */}
           <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Commit Message
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2 text-slate-200 focus:border-brand-500 focus:outline-none"
              />
           </div>

           {/* File Selection */}
           <div className="p-4 bg-dark-900/50 rounded-xl border border-dashed border-dark-600 flex flex-col items-center justify-center text-center">
              <input
                ref={fileInputRef}
                type="file"
                // @ts-ignore - webkitdirectory is non-standard but widely supported
                webkitdirectory=""
                directory=""
                onChange={handleFolderSelect}
                className="hidden"
              />
              
              {selectedFiles.length > 0 ? (
                <div className="flex flex-col items-center gap-2 text-green-400">
                    <CheckCircle size={24} />
                    <span className="font-medium">{selectedFiles.length} files selected</span>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-slate-500 underline hover:text-slate-300"
                    >
                        Change Selection
                    </button>
                </div>
              ) : (
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <FolderInput size={32} />
                    <span className="text-sm">Select Project Folder</span>
                </button>
              )}
           </div>
        </div>

        {errorMsg && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg break-words">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                    {errorMsg.includes('403') || errorMsg.includes('Resource not accessible') 
                        ? 'Permission Denied (403). Your Token does not have "repo" or "workflow" scope, or the Token has expired. Please regenerate a Classic Token with "repo" checkbox selected.'
                        : errorMsg
                    }
                </span>
            </div>
        )}

        {status === 'uploading' || status === 'scanning' ? (
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                    <span>{progress.statusText}</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                </div>
                <div className="h-2 bg-dark-900 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-brand-500 transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                </div>
            </div>
        ) : (
            <button
                onClick={handleSync}
                disabled={status !== 'idle' || selectedFiles.length === 0}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    status !== 'idle' || selectedFiles.length === 0
                    ? 'bg-dark-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-[#2da44e] text-white hover:bg-[#2c974b] shadow-lg shadow-green-900/20'
                }`}
            >
                {status === 'success' ? (
                    <>
                        <CheckCircle size={20} />
                        Synced Successfully
                    </>
                ) : (
                    <>
                        <Upload size={20} />
                        Push to GitHub
                    </>
                )}
            </button>
        )}
      </div>
    </div>
  );
};


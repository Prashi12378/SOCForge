import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, LayoutDashboard, FileText, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';

const UploadPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, clearData, isLoading } = useAppStore();
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'cleared'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus('idle');
      await uploadFile(file);
      setStatus('success');
      setMessage(`Successfully uploaded and processed ${file.name}`);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.detail || error.message || 'Failed to upload file');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="glass-panel rounded-2xl p-10 text-center relative overflow-hidden animate-fade-in-up">
        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyber-primary/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
        
        <div className="relative z-10 w-24 h-24 bg-cyber-primary/10 border border-cyber-primary/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
          <UploadCloud className={`w-12 h-12 text-cyber-primary ${isLoading ? 'animate-pulse-glow animate-bounce' : ''}`} />
        </div>
        
        <h2 className="text-3xl font-black text-cyber-text mb-3 tracking-wide drop-shadow-sm relative z-10">Upload Security Datasets</h2>
        <p className="text-cyber-muted mb-6 max-w-lg mx-auto font-medium tracking-wide relative z-10">
          Drag and drop your CSV, JSON, or image evidence files here. All files are parsed locally within your browser and <span className="text-cyber-primary">never leave this machine.</span>
        </p>

        <div className="flex justify-center mb-8 relative z-10">
          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to clear the entire SOCForge offline database? This cannot be undone.')) {
                await clearData();
                setStatus('cleared');
                setMessage('Database successfully cleared. You are starting fresh.');
              }
            }}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg font-bold transition-colors text-sm border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
          >
            <Trash2 className="w-4 h-4" />
            Clear Local Database
          </button>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".csv,.json,.png,.jpg,.jpeg,.webp" 
        />
        
        <div 
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`relative z-10 border-2 border-dashed border-cyber-border/80 bg-black/20 hover:bg-cyber-primary/5 hover:border-cyber-primary/50 hover:shadow-[inset_0_0_30px_rgba(0,240,255,0.05)] transition-all duration-300 rounded-2xl p-16 cursor-pointer group ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
        >
          <div className="flex flex-col items-center gap-4">
            <UploadCloud className="w-10 h-10 text-cyber-muted group-hover:text-cyber-primary group-hover:scale-110 transition-all duration-300 drop-shadow-md" />
            <span className="text-cyber-muted font-bold text-lg tracking-wide group-hover:text-cyber-text transition-colors">
              {isLoading ? 'Processing file locally...' : 'Click to browse or drag files here'}
            </span>
            <span className="text-sm text-cyber-muted/70 font-medium">
              Supported formats: .csv, .json, .png, .jpg
            </span>
          </div>
        </div>

        {status === 'success' && (
          <div className="mt-8 animate-fade-in-up relative z-10 space-y-6">
            <div className="p-5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.1)] font-bold tracking-wide">
              <CheckCircle className="w-6 h-6 drop-shadow-sm" />
              <span>{message}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/"
                className="flex items-center gap-2 bg-cyber-bg/50 border border-cyber-primary/30 text-cyber-primary px-6 py-3 rounded-lg font-bold hover:bg-cyber-primary/10 transition-colors w-full sm:w-auto justify-center"
              >
                <LayoutDashboard className="w-5 h-5" />
                View Dashboard
              </Link>
              <Link 
                to="/reports"
                className="flex items-center gap-2 bg-cyber-primary text-cyber-bg px-6 py-3 rounded-lg font-bold hover:bg-cyber-primary/90 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)] w-full sm:w-auto justify-center"
              >
                <FileText className="w-5 h-5" />
                Generate Reports
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8 p-5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)] animate-fade-in-up relative z-10 font-bold tracking-wide">
            <AlertTriangle className="w-6 h-6 drop-shadow-sm" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;

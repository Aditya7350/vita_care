import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Zap, Download, CheckCircle, AlertCircle, Link as LinkIcon, ExternalLink, Share2 } from 'lucide-react';
import { processPdf } from './utils/pdf-processor';

function App() {
  // States
  const [pdfs, setPdfs] = useState([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [error, setError] = useState(null);

  // Branding Buffer States (Hidden from UI)
  const [branding, setBranding] = useState({ logo: null, footer: null });

  // Auto-load branding assets from public/assets
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const [logoRes, footerRes] = await Promise.all([
          fetch('/assets/logo.png'),
          fetch('/assets/footer.png')
        ]);

        let logo = null;
        let footer = null;

        if (logoRes.ok && logoRes.headers.get('content-type')?.includes('image')) {
          const blob = await logoRes.blob();
          logo = await blob.arrayBuffer();
        }
        if (footerRes.ok && footerRes.headers.get('content-type')?.includes('image')) {
          const blob = await footerRes.blob();
          footer = await blob.arrayBuffer();
        }

        setBranding({ logo, footer });
      } catch (e) {
        console.error("Failed to load background branding:", e);
      }
    };
    loadAssets();
  }, []);

  const processAndAdd = async (file) => {
    setIsProcessing(true);
    setError(null);
    try {
      const processedBytes = await processPdf({
        pdfFile: file,
        logoBuffer: branding.logo,
        footerBuffer: branding.footer,
      });
      const blob = new Blob([processedBytes], { type: 'application/pdf' });
      const newFile = {
        filename: file.name,
        url: URL.createObjectURL(blob),
        id: Math.random().toString(36).substr(2, 9)
      };
      setProcessedFiles(prev => [newFile, ...prev]);
    } catch (err) {
      setError(`Failed to process ${file.name}: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(acceptedFiles => {
    acceptedFiles.forEach(file => processAndAdd(file));
  }, [branding]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  });

  const handleImportUrl = async () => {
    if (!pdfUrl.trim()) return;

    setIsProcessing(true);
    setError(null);
    try {
      const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Could not fetch PDF from the provided link.");

      const blob = await response.blob();
      const fileName = pdfUrl.split('/').pop().split('?')[0] || 'document.pdf';
      const fileObj = new File([blob], fileName, { type: 'application/pdf' });

      await processAndAdd(fileObj);
      setPdfUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadToDrive = async (fileData) => {
    try {
      const blob = await fetch(fileData.url).then(r => r.blob());
      const file = new File([blob], fileData.filename, { type: 'application/pdf' });
      const form = new FormData();
      form.append('file', file);
      form.append('filename', file.name);

      const res = await fetch('/api/upload-pdf', { method: 'POST', body: form });
      const data = await res.json();

      setProcessedFiles(prev => prev.map(f =>
        f.id === fileData.id
          ? { ...f, driveLink: data.drive?.webViewLink }
          : f
      ));
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  const handleShareWhatsApp = (file) => {
    const shareText = `Processed Healthcare Report: ${file.filename}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 font-sans selection:bg-blue-500/30 overflow-hidden">

      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-glow"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[120px] -z-10 animate-glow delay-2000"></div>

      {/* Floating Particles/Shapes for extra flair */}
      <div className="fixed top-20 right-[15%] w-24 h-24 border border-white/5 rounded-full -z-10 animate-float"></div>
      <div className="fixed bottom-40 left-[10%] w-16 h-16 border border-white/5 rounded-xl rotate-45 -z-10 animate-float delay-700"></div>

      <div className="w-full max-w-4xl space-y-12 relative">

        {/* Main Interface Area */}
        <div className="glass-panel overflow-hidden border border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-1000 relative">

          {/* Subtle Shimmer Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none"></div>

          <div className="p-10 sm:p-16 space-y-12 text-center relative z-10">

            {/* Dropzone with Scan Effect */}
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-[3rem] p-16 transition-all duration-700 cursor-pointer group overflow-hidden
                ${isDragActive ? 'border-blue-400 bg-blue-500/10 scale-[0.98]' : 'border-slate-800 hover:border-blue-500/40 bg-slate-900/40'}`}
            >
              <input {...getInputProps()} />

              {/* Scan Line Animation (only during drag or hover) */}
              <div className="scan-line group-hover:block transition-opacity opacity-0 group-hover:opacity-100"></div>

              <div className="flex flex-col items-center space-y-8 relative z-20">
                <div className="w-32 h-32 bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-700 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border border-white/5">
                  <FileText className={`transition-all duration-700 ${isDragActive ? 'text-blue-400 scale-110' : 'text-slate-500 group-hover:text-blue-400'}`} size={64} strokeWidth={1} />
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-2xl">
                    Import Report
                  </h2>
                  <p className="text-slate-400 text-lg font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                    Drag and drop your PDF or click to browse
                  </p>
                </div>
              </div>
            </div>

            {/* OR Separator */}
            <div className="relative flex items-center justify-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
              <span className="absolute bg-[#0b0f1e] px-10 text-[10px] font-black text-slate-500 tracking-[1em] uppercase">Connect</span>
            </div>

            {/* URL Input Area with High Contrast */}
            <div className="flex flex-col sm:flex-row gap-5 items-stretch px-4">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <LinkIcon size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Paste secure link or Google Drive URL..."
                  className="w-full h-20 bg-slate-900/60 border border-slate-800 rounded-[1.5rem] pl-16 pr-6 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-800/80 text-white placeholder:text-slate-600 font-medium text-lg shadow-inner"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleImportUrl()}
                />
              </div>
              <button
                onClick={handleImportUrl}
                disabled={isProcessing || !pdfUrl.trim()}
                className={`h-20 px-14 rounded-[1.5rem] font-black text-xl transition-all duration-500 flex items-center justify-center gap-4 group relative overflow-hidden
                  ${isProcessing || !pdfUrl.trim() ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:scale-95'}`}
              >
                <div className="relative z-10 flex items-center gap-3">
                  {isProcessing ? (
                    <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full"></div>
                  ) : (
                    <>
                      <Zap size={22} className="group-hover:fill-current transition-all" />
                      <span>Automate</span>
                    </>
                  )}
                </div>
                {/* Button Shine Effect */}
                {!isProcessing && pdfUrl.trim() && <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-[shimmer_2s_infinite]"></div>}
              </button>
            </div>
          </div>

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="relative">
                {/* Spinning Rings */}
                <div className="w-32 h-32 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-32 h-32 border-4 border-indigo-500/20 border-b-indigo-500 rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="text-blue-400 animate-pulse" size={32} />
                </div>
              </div>
              <div className="mt-8 space-y-2 text-center">
                <h3 className="text-2xl font-black text-white tracking-widest uppercase animate-pulse">Analyzing Report</h3>
                <p className="text-slate-500 font-bold text-xs tracking-[0.4em] uppercase">Applying Neural Branding Layers</p>
              </div>

              {/* Progress Bar (Fake but impressive) */}
              <div className="w-64 h-1 bg-slate-800 rounded-full mt-10 overflow-hidden">
                <div className="h-full bg-blue-500 animate-[shimmer_1.5s_infinite] w-full origin-left"></div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message with Shake Animation */}
        {error && (
          <div className="animate-in slide-in-from-top-4 fade-in flex items-center gap-4 bg-red-500/10 border border-red-500/20 text-red-100 p-6 rounded-[2rem] font-bold text-center justify-center shadow-2xl backdrop-blur-md">
            <AlertCircle size={24} className="text-red-500" />
            {error}
          </div>
        )}

        {/* Results List with Staggered Animations */}
        {processedFiles.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="flex items-center justify-between px-8">
              <h3 className="text-xl font-black text-slate-400 flex items-center gap-3 uppercase tracking-[0.4em]">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                Processed Vault
              </h3>
              <button onClick={() => setProcessedFiles([])} className="text-[10px] font-black text-slate-600 hover:text-red-400 transition-all uppercase tracking-[0.2em] border-b border-transparent hover:border-red-400">Flush Queue</button>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {processedFiles.map((file, index) => (
                <div
                  key={file.id}
                  style={{ animationDelay: `${index * 150}ms` }}
                  className="glass-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-blue-500/30 transition-all duration-500 border border-white/5 hover:translate-x-2 animate-in fade-in slide-in-from-left-8 overflow-hidden shimmer-bg"
                >
                  <div className="flex items-center gap-6 w-full sm:w-auto overflow-hidden relative z-10">
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner border border-white/5">
                      <FileText size={32} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col min-w-0 text-center sm:text-left">
                      <span className="font-extrabold text-white text-xl truncate pr-4 group-hover:text-blue-400 transition-colors">{file.filename}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-500 font-black">Encrypted</span>
                        <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold">PDF-Branded</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-10">
                    <button
                      onClick={() => handleShareWhatsApp(file)}
                      className="p-4 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-[1.5rem] transition-all duration-500 shadow-sm border border-emerald-500/10 scale-90 hover:scale-100"
                      title="Share Telegram/WhatsApp"
                    >
                      <Share2 size={24} />
                    </button>

                    <button
                      onClick={() => handleUploadToDrive(file)}
                      className={`p-4 rounded-[1.5rem] transition-all duration-500 shadow-sm border scale-90 hover:scale-100
                        ${file.driveLink ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-slate-800 border-white/5 hover:bg-slate-700 text-slate-400 hover:text-white'}`}
                      title={file.driveLink ? "Vaulted in Drive" : "Upload to Cloud"}
                    >
                      <ExternalLink size={24} />
                    </button>

                    <a
                      href={file.url}
                      download={file.filename}
                      className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] transition-all duration-500 shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] px-10 flex items-center gap-3 font-bold group/btn"
                      title="Download Analysis"
                    >
                      <Download size={24} className="group-hover/btn:translate-y-0.5 transition-transform" />
                      <span className="hidden sm:inline font-black tracking-wide text-lg">Save</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Futuristic Bottom Branding */}
      <footer className="mt-24 text-slate-700 text-[10px] font-black tracking-[0.6em] uppercase opacity-40 select-none pb-12 flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-blue-500 to-transparent"></div>
          <div className="w-10 h-10 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center text-blue-500 font-black italic shadow-inner animate-float text-xl">V</div>
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-blue-500 to-transparent"></div>
        </div>
        <span>Vita Healthcare Automation Core v4.0</span>
      </footer>
    </div>
  );
}

export default App;

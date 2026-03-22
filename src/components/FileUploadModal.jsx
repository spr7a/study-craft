import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { extractTextFromPdf, extractTextFromTxt } from '../lib/pdfParser';

export default function FileUploadModal({ isOpen, onClose, onContextExtracted }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [activeTab, setActiveTab] = useState('upload'); // upload, paste
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile) => {
    setFile(selectedFile);
    setStatus('processing');
    setErrorMsg('');

    try {
      let extractedText = '';
      if (selectedFile.type === 'application/pdf') {
        extractedText = await extractTextFromPdf(selectedFile);
      } else if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.md')) {
        extractedText = await extractTextFromTxt(selectedFile);
      } else {
        throw new Error('Unsupported file type. Please upload a PDF, TXT, or MD file.');
      }
      
      setStatus('success');
      setTimeout(() => {
        onContextExtracted(extractedText, selectedFile.name);
        onClose();
        reset();
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Error processing file. Ensure it is a valid format.');
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    setStatus('processing');
    setTimeout(() => {
        onContextExtracted(pastedText, "Pasted Content");
        setStatus('success');
        setTimeout(() => {
            onClose();
            reset();
        }, 800);
    }, 500);
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setErrorMsg('');
    setPastedText('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-text-primary/10 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 p-8 bg-bg border border-bg-tertiary rounded-md shadow-lg"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-serif text-text-primary tracking-tight">Update Context</h3>
                <p className="text-sm text-text-secondary mt-1">Provide study material for the RAG AI Tutor.</p>
              </div>
              <button onClick={onClose} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-secondary rounded-sm transition-colors">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex gap-2 mb-6 bg-bg-secondary border border-bg-tertiary p-1 rounded-sm w-full">
                <button 
                    onClick={() => setActiveTab('upload')} 
                    className={`flex-1 py-1.5 text-xs uppercase tracking-[0.06em] font-semibold rounded-[2px] transition-colors ${activeTab === 'upload' ? 'bg-text-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    File Upload
                </button>
                <button 
                    onClick={() => setActiveTab('paste')} 
                    className={`flex-1 py-1.5 text-xs uppercase tracking-[0.06em] font-semibold rounded-[2px] transition-colors ${activeTab === 'paste' ? 'bg-text-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    Paste Text
                </button>
            </div>

            {activeTab === 'upload' ? (
                <div 
                  className={`border border-dashed rounded-md p-10 text-center transition-all duration-200 ${
                    isDragging 
                      ? 'border-text-primary bg-bg-tertiary' 
                      : status === 'error' ? 'border-error/50 bg-error/5' : 'border-text-tertiary hover:border-text-secondary bg-bg-secondary'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => status === 'idle' || status === 'error' ? fileInputRef.current?.click() : null}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.md"
                  />
                  
                  {status === 'idle' && (
                    <div className="flex flex-col items-center cursor-pointer">
                      <div className="w-14 h-14 rounded-sm bg-bg border border-bg-tertiary flex items-center justify-center text-text-secondary mb-5 shadow-sm">
                        <UploadCloud size={24} strokeWidth={1.5} />
                      </div>
                      <p className="font-serif text-text-primary text-xl mb-2">Click or drag and drop</p>
                      <p className="text-[11px] uppercase tracking-[0.06em] font-semibold text-text-tertiary">PDF, TXT, or MD (Max 10MB)</p>
                    </div>
                  )}

                  {status === 'processing' && (
                    <div className="flex flex-col items-center text-text-primary py-4">
                      <Loader2 size={32} strokeWidth={1.5} className="animate-spin mb-4 text-text-secondary" />
                      <p className="font-serif text-lg">Extracting content...</p>
                      <p className="text-xs text-text-secondary mt-2 max-w-[200px] leading-relaxed">{file?.name}</p>
                    </div>
                  )}

                  {status === 'success' && (
                    <div className="flex flex-col items-center text-success py-4">
                      <CheckCircle2 size={36} strokeWidth={1.5} className="mb-4" />
                      <p className="font-serif text-lg text-text-primary">Processed successfully.</p>
                      <p className="text-xs text-text-secondary mt-2">{file?.name} integrated.</p>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex flex-col items-center text-error cursor-pointer py-2">
                      <AlertCircle size={36} strokeWidth={1.5} className="mb-4" />
                      <p className="font-serif text-lg">Processing failed</p>
                      <p className="text-xs mt-2 opacity-80 max-w-[250px] leading-relaxed">{errorMsg}</p>
                      <p className="text-[10px] uppercase font-bold tracking-wider mt-5 underline underline-offset-4">Click to try again</p>
                    </div>
                  )}
                </div>
            ) : (
                <div className="flex flex-col h-64">
                    <textarea 
                        className="flex-1 w-full bg-bg border border-bg-tertiary rounded-sm p-5 text-sm text-text-primary leading-relaxed resize-none focus:outline-none focus:border-text-primary focus:ring-1 focus:ring-text-primary custom-scrollbar shadow-sm"
                        placeholder="Paste your syllabus, notes, or article text here..."
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        disabled={status !== 'idle'}
                    />
                    <div className="mt-5 flex justify-end">
                        <Button 
                            onClick={handlePasteSubmit} 
                            disabled={!pastedText.trim() || status !== 'idle'}
                            className="w-full sm:w-auto px-8"
                        >
                            {status === 'processing' ? <Loader2 size={18} className="animate-spin mr-2" /> : <FileText size={18} className="mr-2" strokeWidth={1.5} />}
                            {status === 'processing' ? 'Processing...' : 'Set Context'}
                        </Button>
                    </div>
                </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

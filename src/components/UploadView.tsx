import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TenderDocument } from '../types';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, Search, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as PDFJS from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { extractTenderData } from '../lib/llm';
import { cn } from '../lib/utils';

// Set up PDF.js worker
PDFJS.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function UploadView({ user, onComplete }: { user: User, onComplete: (doc: TenderDocument) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [tenderId, setTenderId] = useState('');
  const [isKpppLoading, setIsKpppLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'extracting' | 'analyzing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + '\n';
    }
    return fullText;
  };

  const extractTextFromExcel = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    let fullText = '';
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      fullText += JSON.stringify(json) + '\n';
    });
    return fullText;
  };

  const handleKpppSearch = async () => {
    if (!tenderId.trim()) return;
    
    setIsKpppLoading(true);
    setError('');
    setStatus('extracting');
    setProgress(20);

    try {
      // 1. Fetch from backend
      const response = await axios.get(`/api/kppp/tender/${tenderId}`);
      if (!response.data.success) throw new Error(response.data.error);

      const { title, content } = response.data.data;
      setProgress(40);

      // 2. Create document entry in Firestore
      const docRef = await addDoc(collection(db, 'documents'), {
        userId: user.uid,
        fileName: title || `KPPP Tender ${tenderId}`,
        fileType: 'pdf', // Mock as PDF for UI consistency
        uploadDate: new Date().toISOString(),
        status: 'processing',
        extractedText: content
      });

      // 3. Analyze with Groq
      setStatus('analyzing');
      setProgress(70);
      const extractedData = await extractTenderData(content);

      // 4. Save extracted data to subcollection
      const extractedDataRef = collection(db, 'documents', docRef.id, 'extracted_data');
      for (const item of extractedData) {
        await addDoc(extractedDataRef, {
          documentId: docRef.id,
          ...item,
          confidenceScore: 0.95
        });
      }

      // 5. Update document status
      await updateDoc(doc(db, 'documents', docRef.id), {
        status: 'completed'
      });

      setStatus('completed');
      setProgress(100);

      const finalDoc: TenderDocument = {
        id: docRef.id,
        userId: user.uid,
        fileName: title || `KPPP Tender ${tenderId}`,
        fileType: 'pdf',
        uploadDate: new Date().toISOString(),
        status: 'completed'
      };
      
      setTimeout(() => onComplete(finalDoc), 1000);

    } catch (err: any) {
      console.error("KPPP Processing error:", err);
      setError(err.response?.data?.error || err.message || 'Failed to process KPPP tender');
      setStatus('error');
    } finally {
      setIsKpppLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setStatus('uploading');
    setProgress(20);

    try {
      // 1. Create document entry in Firestore
      const docRef = await addDoc(collection(db, 'documents'), {
        userId: user.uid,
        fileName: file.name,
        fileType: file.name.endsWith('.pdf') ? 'pdf' : 'xlsx',
        uploadDate: new Date().toISOString(),
        status: 'processing',
        extractedText: '' // Placeholder
      });

      // 2. Extract text from file
      setStatus('extracting');
      setProgress(40);
      let text = '';
      if (file.name.endsWith('.pdf')) {
        text = await extractTextFromPDF(file);
      } else {
        text = await extractTextFromExcel(file);
      }

      // Store the extracted text for re-analysis
      await updateDoc(doc(db, 'documents', docRef.id), {
        extractedText: text
      });

      // 3. Analyze with Gemini
      setStatus('analyzing');
      setProgress(70);
      const extractedData = await extractTenderData(text);

      // 4. Save extracted data to subcollection
      const extractedDataRef = collection(db, 'documents', docRef.id, 'extracted_data');
      for (const item of extractedData) {
        await addDoc(extractedDataRef, {
          documentId: docRef.id,
          ...item,
          confidenceScore: 0.95 // Mock confidence for now
        });
      }

      // 5. Update document status
      await updateDoc(doc(db, 'documents', docRef.id), {
        status: 'completed'
      });

      setStatus('completed');
      setProgress(100);

      // Notify parent
      const finalDoc: TenderDocument = {
        id: docRef.id,
        userId: user.uid,
        fileName: file.name,
        fileType: file.name.endsWith('.pdf') ? 'pdf' : 'xlsx',
        uploadDate: new Date().toISOString(),
        status: 'completed'
      };
      
      setTimeout(() => onComplete(finalDoc), 1000);

    } catch (err: any) {
      console.error("Processing error:", err);
      setError(err.message || 'Failed to process document');
      setStatus('error');
    }
  };

  return (
    <div className="glass-card rounded-5xl p-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-primary mb-3 font-display tracking-tight">Import Tender Specifications</h2>
          <p className="text-lg text-secondary font-medium">Upload a document or search by KPPP Tender ID to extract technical requirements.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* KPPP Search */}
          <div className="glass-card rounded-4xl p-8 border-2 border-slate-100 hover:border-primary/20 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary">KPPP Portal</h3>
                <p className="text-sm text-secondary">Search by Tender ID</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Enter Tender ID (e.g., 12345)" 
                  value={tenderId}
                  onChange={(e) => setTenderId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 ring-primary/10 focus:border-primary transition-all"
                />
              </div>
              <button 
                onClick={handleKpppSearch}
                disabled={!tenderId.trim() || isKpppLoading || status !== 'idle'}
                className="w-full btn-primary py-3.5 text-sm"
              >
                {isKpppLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search & Analyze'}
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div 
            {...getRootProps()}
            className={cn(
              "glass-card rounded-4xl p-8 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center",
              isDragActive ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary hover:bg-slate-50"
            )}
          >
            <input {...getInputProps()} />
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-1">Upload File</h3>
            <p className="text-sm text-secondary">PDF or XLSX (Max 10MB)</p>
            
            {file && (
              <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary truncate max-w-[120px]">{file.name}</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status !== 'idle' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 bg-slate-50 rounded-4xl border border-slate-100"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-10 shadow-lg shadow-slate-200">
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  ) : status === 'error' ? (
                    <AlertCircle className="w-12 h-12 text-tertiary" />
                  ) : (
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  )}
                </div>

                <h3 className="text-3xl font-bold text-primary mb-3">
                  {status === 'uploading' && 'Uploading Document...'}
                  {status === 'extracting' && 'Extracting Text...'}
                  {status === 'analyzing' && 'AI Analysis in Progress...'}
                  {status === 'completed' && 'Analysis Successful!'}
                  {status === 'error' && 'Something went wrong'}
                </h3>
                <p className="text-lg text-secondary font-medium mb-10">
                  {status === 'analyzing' ? 'Our LLM is parsing technical specifications...' : 
                   status === 'completed' ? 'Redirecting to results dashboard...' : 
                   status === 'error' ? error : 'Please wait while we process your file.'}
                </p>

                <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden mb-6 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={cn(
                      "h-full transition-all duration-500",
                      status === 'error' ? "bg-tertiary" : "bg-primary"
                    )}
                  />
                </div>
                <span className="text-lg font-extrabold text-primary">{progress}% Complete</span>

                {status === 'error' && (
                  <button 
                    onClick={() => setStatus('idle')}
                    className="mt-10 text-primary font-bold hover:underline text-lg"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {file && status === 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 flex justify-center"
          >
            <button 
              onClick={handleProcess}
              className="btn-primary"
            >
              Start AI Analysis <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

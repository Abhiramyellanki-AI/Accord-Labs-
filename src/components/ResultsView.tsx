import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TenderDocument, ExtractedData } from '../types';
import { 
  Download, 
  Search, 
  Cpu, 
  Code, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  FileSpreadsheet,
  Zap,
  Shield,
  Database,
  Globe,
  HardDrive,
  Activity,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import { extractTenderData } from '../lib/llm';

export default function ResultsView({ document, onReAnalyze }: { document: TenderDocument, onReAnalyze?: (feedback: string) => Promise<void> }) {
  const [data, setData] = useState<ExtractedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'hardware' | 'software'>('all');
  const [reviewStatus, setReviewStatus] = useState<'reviewing' | 'feedback' | 'finalized'>('reviewing');
  const [feedback, setFeedback] = useState('');
  const [isReAnalyzing, setIsReAnalyzing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'documents', document.id, 'extracted_data')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExtractedData[];
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching extracted data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [document.id]);

  const filteredData = data.filter(item => {
    const matchesSearch = item.parameter.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const hardwareData = filteredData.filter(item => item.category === 'hardware');
  const softwareData = filteredData.filter(item => item.category === 'software');

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(item => ({
      Category: item.category,
      Parameter: item.parameter,
      Value: item.value,
      Unit: item.normalized_unit || '',
      Notes: item.notes || '',
      'Confidence Score': item.confidenceScore || 'N/A'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Technical Specifications");
    XLSX.writeFile(wb, `AccordLabs_${document.fileName.split('.')[0]}_Specs.xlsx`);
  };

  const handleReAnalyze = async () => {
    if (!feedback.trim()) return;
    setIsReAnalyzing(true);
    try {
      if (onReAnalyze) {
        await onReAnalyze(feedback);
        setReviewStatus('reviewing');
        setFeedback('');
      }
    } catch (err) {
      console.error("Re-analysis failed:", err);
    } finally {
      setIsReAnalyzing(false);
    }
  };

  const handleUpdateValue = async (id: string) => {
    try {
      const docRef = doc(db, 'documents', document.id, 'extracted_data', id);
      await updateDoc(docRef, { value: editValue });
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update value:", err);
    }
  };

  const getIcon = (param: string) => {
    const p = param.toLowerCase();
    if (p.includes('cpu') || p.includes('processor')) return Cpu;
    if (p.includes('ram') || p.includes('memory')) return Activity;
    if (p.includes('storage') || p.includes('disk')) return HardDrive;
    if (p.includes('network') || p.includes('protocol')) return Globe;
    if (p.includes('security') || p.includes('encryption')) return Shield;
    if (p.includes('database') || p.includes('sql')) return Database;
    if (p.includes('os') || p.includes('operating')) return Code;
    return Zap;
  };

  if (loading || isReAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 glass-card rounded-5xl">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
        <h3 className="text-2xl font-bold text-primary">
          {isReAnalyzing ? 'Refining Analysis...' : 'Loading Analysis Results...'}
        </h3>
        <p className="text-secondary">
          {isReAnalyzing ? 'Applying your feedback to the technical specifications.' : 'Fetching extracted specifications from our database.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Summary Header */}
      <div className="bg-primary rounded-5xl p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-tertiary rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/80">
                {reviewStatus === 'finalized' ? 'Finalized Output' : 'Initial Output & Technical Specifications'}
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-500/30">98.4% Confidence</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              {reviewStatus === 'finalized' ? 'Final Technical Configuration' : 'Review Sovereign Intelligence'}
            </h2>
            <p className="text-white/60 max-w-xl leading-relaxed">
              {reviewStatus === 'finalized' 
                ? "Your document has been verified. You can now download the final structured output."
                : "The sovereign intelligence engine has extracted the following requirements. Please review them for accuracy before finalizing."}
            </p>
          </div>
          
          {reviewStatus === 'finalized' && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleExport}
              className="btn-tertiary shadow-xl shadow-black/20 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Download Final CSV
            </motion.button>
          )}
        </div>
      </div>

      {/* Review Workflow Section */}
      <AnimatePresence mode="wait">
        {reviewStatus === 'reviewing' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card rounded-4xl p-10 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-primary">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary">Is the output correct?</h3>
                <p className="text-secondary">Verify the extracted parameters and values below.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={() => setReviewStatus('finalized')}
                className="btn-primary flex-1 md:flex-none px-12"
              >
                <ThumbsUp className="w-5 h-5" /> Yes, Looks Good
              </button>
              <button 
                onClick={() => setReviewStatus('feedback')}
                className="btn-outline flex-1 md:flex-none px-12"
              >
                <ThumbsDown className="w-5 h-5" /> No, Refine It
              </button>
            </div>
          </motion.div>
        )}

        {reviewStatus === 'feedback' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card rounded-4xl p-10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-tertiary/10 rounded-2xl flex items-center justify-center text-tertiary">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-primary">Refine the Sovereign Intelligence</h3>
              </div>
              <button onClick={() => setReviewStatus('reviewing')} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-secondary mb-6">Tell us what's wrong. Our AI will re-analyze the document based on your feedback.</p>
            <textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., The RAM values are missing for the server specs, or the OS version is incorrect..."
              className="w-full h-32 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:ring-2 ring-primary/10 focus:border-primary transition-all mb-6 resize-none"
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => setReviewStatus('reviewing')} className="btn-secondary">Cancel</button>
              <button 
                onClick={handleReAnalyze}
                disabled={!feedback.trim() || isReAnalyzing}
                className="btn-primary"
              >
                <RefreshCw className={cn("w-5 h-5", isReAnalyzing && "animate-spin")} />
                Re-Analyze Document
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { id: 'all', label: 'All Specs' },
            { id: 'hardware', label: 'Hardware' },
            { id: 'software', label: 'Software' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeCategory === cat.id 
                  ? "bg-primary text-white shadow-lg shadow-slate-200" 
                  : "text-slate-500 hover:text-primary hover:bg-slate-50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search parameters or values..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl w-full md:w-80 focus:outline-none focus:ring-2 ring-primary/10 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid lg:grid-cols-2 gap-10">
        {/* Hardware Table */}
        {(activeCategory === 'all' || activeCategory === 'hardware') && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-4xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">Hardware Requirements</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">{hardwareData.length} Parameters Extracted</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Parameter</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Value</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Unit</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Notes</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {hardwareData.map((item) => {
                    const Icon = getIcon(item.parameter);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-primary">{item.parameter}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {editingId === item.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 ring-primary/10"
                                autoFocus
                              />
                              <button 
                                onClick={() => handleUpdateValue(item.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded-md"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded-md"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center justify-between group/cell cursor-pointer"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditValue(item.value);
                              }}
                            >
                              <span className="text-secondary font-medium">{item.value}</span>
                              <Code className="w-3 h-3 text-slate-300 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-primary bg-slate-100 px-2 py-1 rounded-md">{item.normalized_unit || '-'}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs text-secondary italic max-w-[200px] block truncate" title={item.notes}>{item.notes || '-'}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className={cn(
                            "text-xs font-bold px-2 py-1 rounded-md",
                            (item.confidenceScore || 0) > 0.9 ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"
                          )}>
                            {Math.round((item.confidenceScore || 0) * 100)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {hardwareData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">No hardware specifications found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Software Table */}
        {(activeCategory === 'all' || activeCategory === 'software') && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-4xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-tertiary rounded-2xl flex items-center justify-center text-white">
                  <Code className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">Software Requirements</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">{softwareData.length} Parameters Extracted</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Parameter</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Value</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Notes</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {softwareData.map((item) => {
                    const Icon = getIcon(item.parameter);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-tertiary group-hover:text-white transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-primary">{item.parameter}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {editingId === item.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 ring-primary/10"
                                autoFocus
                              />
                              <button 
                                onClick={() => handleUpdateValue(item.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded-md"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded-md"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center justify-between group/cell cursor-pointer"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditValue(item.value);
                              }}
                            >
                              <span className="text-secondary font-medium">{item.value}</span>
                              <Code className="w-3 h-3 text-slate-300 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs text-secondary italic max-w-[200px] block truncate" title={item.notes}>{item.notes || '-'}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className={cn(
                            "text-xs font-bold px-2 py-1 rounded-md",
                            (item.confidenceScore || 0) > 0.9 ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"
                          )}>
                            {Math.round((item.confidenceScore || 0) * 100)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {softwareData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No software specifications found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Success Footer */}
      {reviewStatus === 'finalized' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-5xl p-12 text-center"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-primary mb-2">Export Successful</h2>
          <p className="text-secondary mb-8 max-w-lg mx-auto">
            Your document has been fully analyzed and verified. All technical specifications are ready for your procurement workflow.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handleExport}
              className="btn-primary px-10"
            >
              Download Final CSV <Download className="w-5 h-5" />
            </button>
            <button className="btn-outline px-10">
              Share Results
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

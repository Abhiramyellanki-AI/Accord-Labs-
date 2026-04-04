import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  deleteDoc,
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { TenderDocument, ExtractedData } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  User as UserIcon,
  Plus,
  Loader2,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UploadView from './UploadView';
import ResultsView from './ResultsView';
import Logo from './Logo';
import { cn, formatDate } from '../lib/utils';
import { extractTenderData } from '../lib/llm';

export default function Dashboard({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'documents'>('dashboard');
  const [documents, setDocuments] = useState<TenderDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<TenderDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    // Check backend health
    axios.get('/api/health')
      .then(res => setIsBackendHealthy(res.data.status === 'ok'))
      .catch(() => setIsBackendHealthy(false));

    const q = query(
      collection(db, 'documents'),
      where('userId', '==', user.uid),
      orderBy('uploadDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TenderDocument[];
      setDocuments(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching documents:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleLogout = () => signOut(auth);

  const handleDelete = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDoc(doc(db, 'documents', docId));
        if (selectedDoc?.id === docId) setSelectedDoc(null);
      } catch (err) {
        console.error("Error deleting document:", err);
      }
    }
  };

  const handleReAnalyze = async (feedback: string) => {
    if (!selectedDoc) return;

    try {
      // 1. Get the extracted text from the document
      const docRef = doc(db, 'documents', selectedDoc.id);
      const docSnap = await getDoc(docRef);
      const text = docSnap.data()?.extractedText;

      if (!text) throw new Error("No extracted text found for this document.");

      // 2. Call Gemini with feedback
      const refinedData = await extractTenderData(text, feedback);

      // 3. Clear old data and save new data in a batch
      const batch = writeBatch(db);
      const oldDataSnap = await getDocs(collection(db, 'documents', selectedDoc.id, 'extracted_data'));
      oldDataSnap.docs.forEach(d => batch.delete(d.ref));

      const extractedDataRef = collection(db, 'documents', selectedDoc.id, 'extracted_data');
      refinedData.forEach(item => {
        const newDocRef = doc(extractedDataRef);
        batch.set(newDocRef, {
          documentId: selectedDoc.id,
          ...item,
          confidenceScore: 0.98 // Higher confidence for refined data
        });
      });

      await batch.commit();
    } catch (err) {
      console.error("Error during re-analysis:", err);
      throw err;
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral flex font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-primary text-white flex flex-col p-10 fixed h-full z-20">
        <Logo className="mb-16" />

        <nav className="flex-1 space-y-3">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'documents', icon: FileText, label: 'Documents' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setSelectedDoc(null);
              }}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group",
                activeTab === item.id 
                  ? "bg-white/10 text-white font-bold shadow-inner" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-6 h-6", activeTab === item.id ? "text-white" : "text-white/40 group-hover:text-white")} />
              <span className="text-lg">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-10 border-t border-white/10 space-y-6">
          <div className="flex items-center gap-4 px-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-6 h-6 text-white/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold truncate">{user.displayName || 'User'}</p>
              <p className="text-sm text-white/30 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-white/40 hover:text-tertiary hover:bg-tertiary/10 transition-all group"
          >
            <LogOut className="w-6 h-6 group-hover:text-tertiary" />
            <span className="text-lg font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-80 p-16">
        <header className="flex items-center justify-between mb-16">
          <div>
            <h1 className="text-4xl font-extrabold text-primary mb-2">
              {selectedDoc ? 'Sovereign Analysis' : 
               activeTab === 'dashboard' ? 'Welcome back, ' + (user.displayName?.split(' ')[0] || 'User') :
               'Intelligence Repository'}
            </h1>
            <p className="text-xl text-secondary font-medium">
              {selectedDoc ? `Processing ${selectedDoc.fileName}` : 
               activeTab === 'dashboard' ? 'Your technical specification intelligence hub.' :
               'Access and manage your analyzed tender documents.'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {isBackendHealthy === false && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 shadow-sm">
                <AlertCircle className="w-4 h-4" />
                Backend Disconnected
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-96 focus:outline-none focus:ring-4 ring-primary/5 focus:border-primary transition-all shadow-sm"
              />
            </div>
            <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all relative shadow-sm">
              <Bell className="w-6 h-6" />
              <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-tertiary rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {selectedDoc ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button 
                onClick={() => setSelectedDoc(null)}
                className="flex items-center gap-3 text-secondary hover:text-primary mb-10 transition-colors group font-bold text-lg"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to {activeTab === 'dashboard' ? 'Dashboard' : 'Documents'}
              </button>
              <ResultsView document={selectedDoc} onReAnalyze={handleReAnalyze} />
            </motion.div>
          ) : activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              <UploadView user={user} onComplete={(doc) => setSelectedDoc(doc)} />

              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-primary">Recent Activity</h2>
                  <button 
                    onClick={() => setActiveTab('documents')}
                    className="text-base font-bold text-primary hover:text-tertiary transition-colors"
                  >
                    View All Documents
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-12 h-12 animate-spin text-slate-300" />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="glass-card rounded-5xl p-24 text-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-4xl flex items-center justify-center mx-auto mb-8">
                      <FileText className="w-12 h-12 text-slate-200" />
                    </div>
                    <h3 className="text-3xl font-bold text-primary mb-4">
                      {searchTerm ? 'No matches found' : 'No documents analyzed'}
                    </h3>
                    <p className="text-xl text-secondary mb-10 max-w-md mx-auto">
                      {searchTerm ? `No documents match "${searchTerm}"` : 'Upload your first government tender document to start the sovereign analysis pipeline.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredDocuments.slice(0, 3).map((doc) => (
                      <motion.div 
                        key={doc.id}
                        layoutId={doc.id}
                        className="glass-card p-8 rounded-4xl hover:shadow-2xl hover:shadow-slate-200/50 transition-all group cursor-pointer border-transparent hover:border-primary/10"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <div className="flex items-start justify-between mb-8">
                          <div className={cn(
                            "w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm",
                            doc.fileType === 'pdf' ? "bg-red-50 text-tertiary" : "bg-green-50 text-green-600"
                          )}>
                            <FileText className="w-8 h-8" />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-2 truncate">{doc.fileName}</h3>
                        <p className="text-base text-secondary font-medium mb-8">{formatDate(doc.uploadDate)}</p>
                        
                        <div className="flex items-center justify-end pt-8 border-t border-slate-50">
                          <button className="text-primary font-extrabold text-sm flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                            View Analysis <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary">All Documents</h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="btn-primary py-3 px-6 text-sm"
                  >
                    <Plus className="w-5 h-5" /> Upload New
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="w-12 h-12 animate-spin text-slate-300" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="glass-card rounded-5xl p-24 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-4xl flex items-center justify-center mx-auto mb-8">
                    <FileText className="w-12 h-12 text-slate-200" />
                  </div>
                  <h3 className="text-3xl font-bold text-primary mb-4">
                    {searchTerm ? 'No matches found' : 'No documents found'}
                  </h3>
                  <p className="text-xl text-secondary mb-10 max-w-md mx-auto">
                    {searchTerm ? `No documents match "${searchTerm}"` : "You haven't uploaded any documents yet."}
                  </p>
                  {!searchTerm && (
                    <button onClick={() => setActiveTab('dashboard')} className="btn-primary mx-auto">
                      <Plus className="w-6 h-6" /> Upload Document
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredDocuments.map((doc) => (
                    <motion.div 
                      key={doc.id}
                      layoutId={doc.id}
                      className="glass-card p-8 rounded-4xl hover:shadow-2xl hover:shadow-slate-200/50 transition-all group cursor-pointer border-transparent hover:border-primary/10 relative"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        className="absolute top-6 right-6 p-2 text-slate-300 hover:text-tertiary hover:bg-tertiary/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="flex items-start justify-between mb-8">
                        <div className={cn(
                          "w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm",
                          doc.fileType === 'pdf' ? "bg-red-50 text-tertiary" : "bg-green-50 text-green-600"
                        )}>
                          <FileText className="w-8 h-8" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-primary mb-2 truncate">{doc.fileName}</h3>
                      <p className="text-base text-secondary font-medium mb-8">{formatDate(doc.uploadDate)}</p>
                      
                      <div className="flex items-center justify-end pt-8 border-t border-slate-50">
                        <button className="text-primary font-extrabold text-sm flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                          View Analysis <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

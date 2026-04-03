import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'motion/react';
import { FileText, Loader2, ArrowLeft, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import Logo from './Logo';

export default function Auth({ onBack }: { onBack: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email,
          name,
          createdAt: new Date().toISOString(),
          role: 'user'
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral font-sans">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden p-20 flex-col justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary opacity-50"></div>
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-tertiary rounded-full blur-[160px] opacity-20"></div>
        <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-secondary rounded-full blur-[160px] opacity-30"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <Logo className="mb-16" />
          <h2 className="text-6xl font-extrabold text-white leading-tight mb-8 font-display tracking-tighter">
            The Sovereign Intelligence for Federal Compliance.
          </h2>
          <p className="text-2xl text-white/70 max-w-lg leading-relaxed font-medium">
            Automate your technical specification extraction with AI-driven precision. Secure, compliant, and efficient.
          </p>
        </motion.div>

        <div className="relative z-10 flex items-center gap-6 text-white/40 text-sm font-bold tracking-widest uppercase">
          <span>© 2026 AccordLabs Inc.</span>
          <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-12 bg-neutral">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-lg"
        >
          <button 
            onClick={onBack}
            className="flex items-center gap-3 text-secondary hover:text-primary mb-12 transition-colors group font-bold text-lg"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </button>

          <div className="glass-card p-12 rounded-5xl">
            <h1 className="text-4xl font-extrabold text-primary mb-3 font-display tracking-tight">
              {isLogin ? 'Sign in to AccordLabs' : 'Join the Intelligence'}
            </h1>
            <p className="text-lg text-secondary mb-10 font-medium">
              {isLogin ? 'Welcome back! Please enter your details.' : 'Create an account to start automating your tenders.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-primary uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 ring-primary/5 focus:border-primary transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-bold text-primary uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 ring-primary/5 focus:border-primary transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-primary uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 ring-primary/5 focus:border-primary transition-all font-medium"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-red-50 border border-red-100 text-tertiary text-sm font-bold rounded-2xl flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full py-5 text-lg"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-10 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-base text-secondary hover:text-primary font-bold transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

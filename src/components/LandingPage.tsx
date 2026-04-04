import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Shield, Zap, FileText } from 'lucide-react';
import Logo from './Logo';

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Logo className="text-[#1E293B]" />
        <div className="flex items-center gap-8">
          <button 
            onClick={onGetStarted}
            className="bg-[#1E293B] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#334155] transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-20 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-bold text-[#1E293B] leading-tight mb-6">
            Automate Tender Requirements Extraction with LLM Analysis
          </h1>
          <p className="text-xl text-[#334155] mb-8 leading-relaxed">
            Transform dense government procurement documents into actionable data. 
            Our Sovereign Intelligence engine parses, classifies, and extracts technical 
            specifications with precision.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={onGetStarted}
              className="bg-[#1E293B] text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2 hover:bg-[#334155] transition-all shadow-lg shadow-slate-200"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <button className="bg-white text-[#1E293B] px-8 py-4 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 transition-all">
              Watch Demo
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <img 
              src="https://picsum.photos/seed/tender/800/600" 
              alt="Dashboard Preview" 
              className="rounded-2xl w-full h-auto"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-[#E11D48] text-white p-6 rounded-2xl shadow-xl max-w-xs">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 fill-white" />
              <span className="font-bold">98.4% Accuracy</span>
            </div>
            <p className="text-sm opacity-90">AI-driven extraction validated against federal compliance standards.</p>
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section className="bg-white py-24 mt-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1E293B] mb-4">Why Our App?</h2>
            <p className="text-[#334155]">The sovereign intelligence engine built for federal compliance.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: "Automated Extraction", desc: "Instantly extract hardware and software specs from PDF/XLSX." },
              { icon: CheckCircle2, title: "Smart Classification", desc: "AI-powered categorization into hardware and software tables." },
              { icon: Shield, title: "Accuracy with LLM", desc: "Leverage state-of-the-art models for high-precision parsing." },
              { icon: FileText, title: "Easy Export", desc: "Download structured specifications in Excel format instantly." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-[#1E293B] transition-all group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#1E293B] transition-colors">
                  <feature.icon className="w-6 h-6 text-[#1E293B] group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#1E293B] mb-3">{feature.title}</h3>
                <p className="text-[#334155] text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 max-w-7xl mx-auto px-8">
        <div className="bg-[#1E293B] rounded-[40px] p-16 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-6">Ready to transform your procurement process?</h2>
            <p className="text-lg opacity-80 mb-10 max-w-2xl mx-auto">
              Join leading government contractors using AccordLabs to get a competitive edge through intelligent analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white/10 border border-white/20 px-6 py-4 rounded-xl w-full max-w-sm focus:outline-none focus:ring-2 ring-white/30"
              />
              <button 
                onClick={onGetStarted}
                className="bg-[#E11D48] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#F43F5E] transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E293B] text-white py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <Logo className="mb-6" />
            <p className="text-white/60 max-w-sm">
              The sovereign intelligence engine for federal compliance. 
              Built for precision, security, and efficiency in procurement.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

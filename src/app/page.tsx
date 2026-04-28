import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30">
      {/* Glow Effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 blur-[120px] pointer-events-none rounded-full" />

      <nav className="relative z-10 border-b border-slate-800/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg rotate-12 flex items-center justify-center font-bold text-white">G</div>
            <span className="text-xl font-bold tracking-tight text-white">GENESIS <span className="text-blue-500">AI</span></span>
          </div>
          <button className="text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-full transition-all">
            Enter Platform
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-6xl md:text-7xl font-extrabold text-white tracking-tight mb-8">
          The Operating System for <br/>
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Clinical Workflows</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Genesis orchestrates autonomous AI agents to handle medical documentation, patient triaging, and real-time analytics. Built for high-performance clinical teams.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-blue-900/20 transition-all">
            Deploy Genesis Agent
          </button>
          <button className="w-full sm:w-auto bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-bold px-8 py-4 rounded-2xl transition-all">
            View API Docs
          </button>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="mt-24 relative p-2 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
           <div className="bg-[#020617] rounded-2xl border border-slate-800 p-8 h-64 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-slate-800 h-10 w-10"></div>
                  <div className="flex-1 space-y-6 py-1">
                    <div className="h-2 bg-slate-800 rounded w-48"></div>
                    <div className="h-2 bg-slate-800 rounded w-32"></div>
                  </div>
                </div>
                <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Genesis Core Engine Online</p>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

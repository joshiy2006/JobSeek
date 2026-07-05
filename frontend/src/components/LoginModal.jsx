import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, Lock, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export default function LoginModal({ onLoginSuccess, onCancel }) {
  const [mode, setMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (mode=='login'){
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Registration successful! Please check your email to confirm your account before logging in.');
        setMode('login');
      }
    } catch (error) {
      setErrorMsg(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }

  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/10 via-slate-100/20 to-emerald-50/10" />

      {/* Modal Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50 mb-3">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-heading">
            {mode === 'login' ? 'Access Workforce Intelligence' : 'Register New account'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'login' 
              ? 'Enter credentials to authorize credentials' 
              : 'Register for India\'s Open Workforce Intelligence platform'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:text-slate-500"
          >
            {isLoading ? 'Authenticating...' : (
              <>
                {mode === 'login' ? 'Authorize Dashboard Access' : 'Register Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="border-t border-slate-100 pt-4 flex flex-col items-center justify-center gap-2 text-xs">
          {mode === 'login' ? (
            <p className="text-slate-600">
              Don't have an account?{' '}
              <button 
                onClick={() => setMode('register')} 
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Register here
              </button>
            </p>
          ) : (
            <p className="text-slate-600">
              Already have an account?{' '}
              <button 
                onClick={() => setMode('login')} 
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Login here
              </button>
            </p>
          )}

          <button
            onClick={onCancel}
            className="text-[11px] text-slate-455 hover:text-slate-600 mt-1 cursor-pointer font-medium"
          >
            Go back to Landing Page
          </button>
        </div>

      </div>
    </div>
  );
}

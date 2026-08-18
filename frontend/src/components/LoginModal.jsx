import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, Lock, Cpu, ArrowRight } from 'lucide-react';

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
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="card p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 dark:bg-slate-900">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-3 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading dark:text-slate-100">
            {mode === 'login' ? 'Access Workforce Intelligence' : 'Register New Account'}
          </h2>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            {mode === 'login'
              ? 'Enter your credentials to continue'
              : "Register for India's Open Workforce Intelligence platform"}
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="badge badge-orange w-full justify-center py-2.5 text-xs normal-case tracking-normal">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 dark:text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="input-base w-full pl-10 pr-3 py-3 text-sm"
              />
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 dark:text-slate-400">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base w-full pl-10 pr-3 py-3 text-sm"
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                {mode === 'login' ? 'Authorize Dashboard Access' : 'Register Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="border-t border-slate-100 pt-4 flex flex-col items-center justify-center gap-2 text-xs dark:border-slate-800">
          {mode === 'login' ? (
            <p className="text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <button
                onClick={() => { setMode('register'); setErrorMsg(''); }}
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Register here
              </button>
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Login here
              </button>
            </p>
          )}

          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 mt-1 cursor-pointer font-medium dark:text-slate-500 dark:hover:text-slate-300"
          >
            Back to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
}

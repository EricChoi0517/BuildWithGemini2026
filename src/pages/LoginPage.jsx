import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // login | signup | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signUp(email, password, displayName);
        navigate('/');
      } else if (mode === 'login') {
        await signIn(email, password);
        navigate('/');
      } else if (mode === 'reset') {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-echo-bg flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-echo-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-echo-accent/10 border border-echo-accent/20 mb-4 text-echo-accent">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <h1 className="font-pageTitle font-bold text-4xl md:text-5xl text-echo-text text-center tracking-tight">
            Echo Journal
          </h1>
          <p className="text-echo-text-muted text-sm mt-2">
            30 seconds. Your voice. Your story.
          </p>
        </div>

        {mode === 'reset' && (
          <div className="mb-6 text-center">
            <h2 className="text-echo-text text-lg font-medium">Reset your password</h2>
            <p className="text-echo-text-muted text-sm mt-1">
              Enter your email and we&apos;ll send you a link to choose a new password.
            </p>
          </div>
        )}

        {/* Mode Switcher */}
        {mode !== 'reset' && (
          <div className="flex bg-echo-surface rounded-xl p-1 mb-6 border border-echo-border">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setResetSent(false); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === m
                  ? 'bg-echo-accent text-white shadow-lg shadow-echo-accent/20'
                  : 'text-echo-text-muted hover:text-echo-text'
                  }`}
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-echo-surface border border-echo-border rounded-xl text-echo-text placeholder:text-echo-text-dim focus:border-echo-accent transition-colors"
                  required={mode === 'signup'}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 bg-echo-surface border border-echo-border rounded-xl text-echo-text placeholder:text-echo-text-dim focus:border-echo-accent transition-colors"
            required
          />

          {mode !== 'reset' && (
            <>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-echo-surface border border-echo-border rounded-xl text-echo-text placeholder:text-echo-text-dim focus:border-echo-accent transition-colors"
                required
                minLength={6}
              />

              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-echo-surface border border-echo-border rounded-xl text-echo-text placeholder:text-echo-text-dim focus:border-echo-accent transition-colors"
                      required={mode === 'signup'}
                      minLength={6}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {mode === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-xs text-echo-accent hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

          {resetSent && (
            <p className="text-echo-accent text-sm text-center bg-echo-accent/5 py-2 rounded-lg border border-echo-accent/20">
              Check your email for a recovery link!
            </p>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-echo-red text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || (mode === 'reset' && resetSent)}
              className="w-full py-3.5 bg-echo-accent hover:bg-echo-accent/90 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-echo-accent/20"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Logging in...' : mode === 'signup' ? 'Creating account...' : 'Sending link...'}
                </span>
              ) : (
                mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
              )}
            </button>
          </div>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setResetSent(false); setError(''); }}
              className="w-full text-sm text-echo-text-muted hover:text-echo-text py-2 transition-colors"
            >
              Back to login
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}

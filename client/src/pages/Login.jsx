import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Eye, EyeOff, Zap, Lock, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('import.meta.env.VITE_API_URL/api/auth/login', { email, password });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-split">
        {/* Left panel — branding */}
        <motion.div
          className="auth-brand-panel"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-brand-inner">
            <div className="auth-logo-wrap">
              <div className="auth-logo-icon"><ShieldAlert size={28} color="white" /></div>
              <span className="auth-logo-text">PuneSafetyAI</span>
            </div>
            <h2 className="auth-brand-heading">
              AI-Powered<br /><span className="auth-brand-gradient">Road Safety</span><br />Intelligence
            </h2>
            <p className="auth-brand-sub">
              Predict. Monitor. Prevent. Our ensemble ML engine classifies accident severity
              in real-time across Pune's road network.
            </p>
            <div className="auth-brand-stats">
              {[
                { icon: '🎯', val: '91.8%', lbl: 'Accuracy' },
                { icon: '🤖', val: '3 Models', lbl: 'Ensemble' },
                { icon: '⚡', val: '<200ms', lbl: 'Latency' },
              ].map((s, i) => (
                <div key={i} className="auth-brand-stat">
                  <span>{s.icon}</span>
                  <strong>{s.val}</strong>
                  <span className="auth-brand-stat-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right panel — form */}
        <div className="auth-form-panel">
          <motion.div
            className="auth-glass-card"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="auth-card-header">
              <div className="auth-card-icon-wrap">
                <Lock size={22} color="#6366f1" />
              </div>
              <h2 className="auth-card-title">Welcome Back</h2>
              <p className="auth-card-sub">Sign in to your dashboard</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="auth-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={submitHandler} className="auth-form">
              <div className="auth-field">
                <label className="auth-label"><Mail size={14} /> Email Address</label>
                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                  placeholder="you@example.com"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label"><Lock size={14} /> Password</label>
                <div className="auth-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="auth-input auth-input-pw"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <><Zap size={16} /> Sign In</>
                )}
              </motion.button>
            </form>

            <p className="auth-footer-link">
              New user? <Link to="/register">Create an account →</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

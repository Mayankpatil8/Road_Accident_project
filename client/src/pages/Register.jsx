import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Zap, User, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Register() {
  const [name, setName] = useState('');
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
const { data } = await axios.post(
  `${import.meta.env.VITE_API_URL}/api/auth/register`,
  { name, email, password }
);

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
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-split">
        {/* Left panel */}
        <motion.div
          className="auth-brand-panel"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-brand-inner">
            <div className="auth-logo-wrap">
              <div className="auth-logo-icon"><ShieldCheck size={28} color="white" /></div>
              <span className="auth-logo-text">PuneSafetyAI</span>
            </div>
            <h2 className="auth-brand-heading">
              Join the<br /><span className="auth-brand-gradient">Safety Network</span><br />Today
            </h2>
            <p className="auth-brand-sub">
              Get instant access to real-time accident prediction, live risk mapping,
              and AI-powered safety analytics for Pune's road network.
            </p>
            <div className="auth-brand-features">
              {[
                '🗺️ Live interactive risk map',
                '🧠 Ensemble ML predictions',
                '📊 Analytics dashboard',
                '⚡ Real-time monitoring',
              ].map((f, i) => (
                <div key={i} className="auth-feature-item">{f}</div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right panel */}
        <div className="auth-form-panel">
          <motion.div
            className="auth-glass-card"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="auth-card-header">
              <div className="auth-card-icon-wrap">
                <ShieldCheck size={22} color="#6366f1" />
              </div>
              <h2 className="auth-card-title">Create Account</h2>
              <p className="auth-card-sub">Start predicting road safety today</p>
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
                <label className="auth-label"><User size={14} /> Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="auth-input"
                  placeholder="John Doe"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label"><Mail size={14} /> Email Address</label>
                <input
                  type="email"
                  value={email}
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
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="auth-input auth-input-pw"
                    placeholder="Create a password"
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
                  <><Zap size={16} /> Create Account</>
                )}
              </motion.button>
            </form>

            <p className="auth-footer-link">
              Already have an account? <Link to="/login">Sign in →</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

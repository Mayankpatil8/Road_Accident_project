import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PredictionForm from '../components/PredictionForm';
import ResultPanel from '../components/ResultPanel';
import { Brain, Activity, Zap, Search, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_FORM = {
  hour: 12, day_of_week: 1, is_weekend: 0, road_type: 2, lanes: 2, traffic_signal: 1,
  weather: 1, visibility: 2, temperature: 30, humidity: 50, traffic_density: 2,
  vehicles_involved: 2, vehicle_type: 2, lighting_condition: 1, road_surface_cond: 1,
  is_drunk_driving: 0, casualties: 0, is_peak_hour: 0, risk_score: 0.5,
};

const PUNE_FALLBACK_LOCATIONS = [
  { name: 'Katraj', lat: 18.4575, lng: 73.8677 },
  { name: 'Kharadi', lat: 18.5515, lng: 73.9475 },
  { name: 'Hinjewadi', lat: 18.5913, lng: 73.7389 },
  { name: 'Viman Nagar', lat: 18.5679, lng: 73.9143 },
  { name: 'Wagholi', lat: 18.5808, lng: 73.9787 },
  { name: 'Swargate', lat: 18.5018, lng: 73.8636 },
  { name: 'Kothrud', lat: 18.5089, lng: 73.8066 },
  { name: 'Baner', lat: 18.559, lng: 73.7868 },
  { name: 'Hadapsar', lat: 18.5089, lng: 73.9260 },
  { name: 'Shivajinagar', lat: 18.5308, lng: 73.8475 },
];

const findFallbackLocation = (query) => {
  const n = query.toLowerCase().trim();
  if (!n) return null;
  return PUNE_FALLBACK_LOCATIONS.find(i => i.name.toLowerCase().includes(n)) ||
    PUNE_FALLBACK_LOCATIONS.find(i => n.includes(i.name.toLowerCase())) || null;
};

const clampInt = (v, min, max, fb) => { const n = Number(v); return !Number.isFinite(n) ? fb : Math.min(max, Math.max(min, Math.round(n))); };
const clampFloat = (v, min, max, fb) => { const n = Number(v); return !Number.isFinite(n) ? fb : Math.min(max, Math.max(min, n)); };
const sanitizePredictionPayload = (raw) => ({
  hour: clampInt(raw.hour, 0, 23, 12), day_of_week: clampInt(raw.day_of_week, 1, 7, 1),
  is_weekend: clampInt(raw.is_weekend, 0, 1, 0), road_type: clampInt(raw.road_type, 1, 3, 2),
  lanes: clampInt(raw.lanes, 1, 6, 2), traffic_signal: clampInt(raw.traffic_signal, 0, 1, 1),
  weather: clampInt(raw.weather, 1, 3, 1), visibility: clampInt(raw.visibility, 1, 3, 2),
  temperature: clampInt(raw.temperature, -20, 60, 30), humidity: clampInt(raw.humidity, 0, 100, 50),
  traffic_density: clampInt(raw.traffic_density, 1, 4, 2), vehicles_involved: clampInt(raw.vehicles_involved, 1, 15, 2),
  vehicle_type: clampInt(raw.vehicle_type, 1, 4, 2), lighting_condition: clampInt(raw.lighting_condition, 1, 4, 1),
  road_surface_cond: clampInt(raw.road_surface_cond, 1, 4, 1), casualties: clampInt(raw.casualties, 0, 25, 0),
  is_peak_hour: clampInt(raw.is_peak_hour, 0, 1, 0), is_drunk_driving: clampInt(raw.is_drunk_driving, 0, 1, 0),
  risk_score: clampFloat(raw.risk_score, 0, 1, 0.5),
});

export default function Predict() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const [searchLocation, setSearchLocation] = useState('');
  const [autoFillLoading, setAutoFillLoading] = useState(false);

  const buildAuthConfig = () => {
    if (!user?.token) throw new Error('LOGIN_REQUIRED');
    return { headers: { Authorization: `Bearer ${user.token}` } };
  };

  const submitPrediction = async (payload) => {
    const config = buildAuthConfig();
    const safePayload = sanitizePredictionPayload(payload);
    const { data } = await axios.post('import.meta.env.VITE_API_URL/api/predict', safePayload, config);
    setResult(data.prediction);
    if (window.innerWidth < 768) {
      const el = document.querySelector('.result-section');
      if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
    }
  };

  const handleAutoFill = async (e) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;
    setAutoFillLoading(true);
    setError(null);
    try {
      const config = buildAuthConfig();
      const fallback = findFallbackLocation(searchLocation);
      let resolved = fallback ? { ...fallback } : null;
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${searchLocation}, Pune, Maharashtra`)}&limit=1`, { headers: { Accept: 'application/json' } });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData?.length > 0) resolved = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon), name: geoData[0].display_name.split(',')[0] };
        }
      } catch { /* keep fallback */ }
      if (!resolved) { setError(`Could not locate "${searchLocation}". Try Katraj or Kharadi.`); return; }
      const scanRes = await axios.post('import.meta.env.VITE_API_URL/api/predict/live', { lat: resolved.lat, lng: resolved.lng, name: resolved.name }, config);
      if (scanRes.data?.liveContext) {
        const lc = scanRes.data.liveContext;
        const nextForm = { ...form, temperature: lc.temperature || form.temperature, humidity: lc.humidity || form.humidity, weather: lc.weatherType === 'Rain' ? 2 : lc.weatherType === 'Fog/Snow' ? 3 : 1, road_type: lc.roadType === 'Highway' ? 1 : lc.roadType === 'Urban' ? 2 : 3, is_peak_hour: lc.isPeakHour ? 1 : 0 };
        setForm(nextForm);
        setLoading(true);
        setResult(null);
        await new Promise(r => setTimeout(r, 800));
        await submitPrediction(nextForm);
      } else {
        setError('Live context unavailable. Please enter values manually.');
      }
    } catch (err) {
      if (err.message === 'LOGIN_REQUIRED') setError('Please login to use live auto-fill.');
      else if (err.response?.status === 401) setError('Session expired. Please login again.');
      else setError(err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || 'Auto-fill failed. Try again or enter values manually.');
    } finally {
      setAutoFillLoading(false);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const n = Number(value);
    setForm(prev => ({ ...prev, [name]: Number.isFinite(n) ? n : prev[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    await new Promise(r => setTimeout(r, 800));
    try {
      await submitPrediction(form);
    } catch (err) {
      if (err.message === 'LOGIN_REQUIRED') setError('Please login first to run predictions.');
      else setError(err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'The neural ensemble is offline. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="predict-page">
      <div className="predict-container">

        {/* Header */}
        <motion.section
          className="predict-header"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="section-tag">
            <Zap size={12} /> B.E. Final Year Project — Ensemble ML
          </span>
          <h1 className="predict-title">
            Accident <span className="predict-title-gradient">Severity Analysis</span>
          </h1>
          <p className="predict-desc">
            Our integrated neural ensemble (Random Forest + XGBoost + ANN) analyses 18 critical
            parameters to predict road accident severity with <strong>91.8% accuracy</strong>.
          </p>
        </motion.section>

        {/* Two-column layout */}
        <div className="predict-layout">
          {/* Left: Form */}
          <motion.section
            className="predict-form-col"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="predict-glass-card">

              {/* Autofill */}
              <div className="predict-autofill-box">
                <h4 className="predict-autofill-title">
                  <MapPin size={16} /> Live Pune Telemetry Autofill
                </h4>
                <form onSubmit={handleAutoFill} className="predict-autofill-form">
                  <input
                    type="text"
                    placeholder="Search area (e.g., Katraj, Kharadi)..."
                    value={searchLocation}
                    onChange={e => setSearchLocation(e.target.value)}
                    className="predict-autofill-input"
                  />
                  <button type="submit" disabled={autoFillLoading} className="predict-autofill-btn">
                    {autoFillLoading
                      ? <span className="predict-mini-spinner" />
                      : <Search size={15} />}
                    {autoFillLoading ? 'Fetching...' : 'Autofill'}
                  </button>
                </form>
              </div>

              {/* Form heading */}
              <div className="predict-form-heading">
                <div className="predict-brain-icon"><Brain size={26} color="#6366f1" /></div>
                <div>
                  <h3>Scenario Neural Input</h3>
                  <p>Configure 18-dimensional parameter space</p>
                </div>
              </div>

              <PredictionForm
                form={form}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                loading={loading}
                error={error}
              />
            </div>
          </motion.section>

          {/* Right: Result */}
          <motion.section
            className="predict-result-col result-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="predict-glass-card predict-result-card">
              <div className="predict-form-heading">
                <div className="predict-brain-icon predict-brain-icon--pink"><Activity size={26} color="#e879f9" /></div>
                <div>
                  <h3>Ensemble Prediction</h3>
                  <p>Real-time severity classification</p>
                </div>
              </div>

              {/* Loading state */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    className="predict-ai-scan"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="predict-scan-rings">
                      <div className="predict-ring predict-ring-1" />
                      <div className="predict-ring predict-ring-2" />
                      <div className="predict-ring predict-ring-3" />
                      <Brain size={28} color="#6366f1" style={{ position: 'relative', zIndex: 1 }} />
                    </div>
                    <p className="predict-scan-text">Neural ensemble processing...</p>
                    <p className="predict-scan-sub">Analyzing 18 risk parameters</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!loading && <ResultPanel result={result} loading={loading} />}
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}

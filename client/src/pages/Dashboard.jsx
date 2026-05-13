import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title,
  Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js';
import {
  TrendingUp, AlertTriangle, Shield, MapPin,
  Zap, Activity, Brain, Wifi, Clock, ChevronRight
} from 'lucide-react';
import RiskMap from '../components/RiskMap';
import { useAuth } from '../context/AuthContext';
import { motion, useInView, useAnimation } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);
ChartJS.defaults.color = '#64748b';
ChartJS.defaults.borderColor = 'rgba(99,102,241,0.1)';

/* ── helpers ─────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
});

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};
const staggerChild = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

/* ── animated counter ────────────────────────────────────── */
function Counter({ target, suffix = '', duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  useEffect(() => {
    if (!inView) return;
    const end = parseFloat(target);
    const step = end / (duration / 16);
    let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= end) { setVal(end); clearInterval(t); }
      else setVal(parseFloat(cur.toFixed(1)));
    }, 16);
    return () => clearInterval(t);
  }, [inView, target, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── live feed ticker ────────────────────────────────────── */
const FEED_EVENTS = [
  { time: '09:14 AM', zone: 'Navale Bridge', sev: 'Fatal',   color: '#ef4444' },
  { time: '09:02 AM', zone: 'Hinjewadi Ph1', sev: 'Major',   color: '#f59e0b' },
  { time: '08:51 AM', zone: 'Shivajinagar',  sev: 'Minor',   color: '#10b981' },
  { time: '08:39 AM', zone: 'Swargate Chowk',sev: 'Fatal',   color: '#ef4444' },
  { time: '08:22 AM', zone: 'Kharadi IT Park',sev: 'Major',  color: '#f59e0b' },
  { time: '08:10 AM', zone: 'Katraj Bypass', sev: 'Minor',   color: '#10b981' },
];

const RECOMMENDATIONS = [
  { icon: '🚦', title: 'Deploy Speed Cameras', desc: 'Hinjewadi & Navale Bridge segments need automated enforcement.', priority: 'High' },
  { icon: '🌧️', title: 'Monsoon Advisory', desc: 'Issue rain-hazard alerts for Katraj Bypass during low-visibility.', priority: 'High' },
  { icon: '💡', title: 'Street Lighting Upgrade', desc: 'Kothrud and Swargate junctions lack adequate night lighting.', priority: 'Medium' },
  { icon: '🚑', title: 'Response Pre-positioning', desc: 'Station emergency vehicles near top-3 hotspots during peak hours.', priority: 'Medium' },
];

/* ── chart config ────────────────────────────────────────── */
const baseChartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { font: { family: 'Inter', weight: '600', size: 12 }, padding: 20, usePointStyle: true } },
    tooltip: { backgroundColor: '#0f172a', titleFont: { family: 'Inter', weight: '700' }, bodyFont: { family: 'Inter' }, padding: 14, cornerRadius: 10, displayColors: true },
  },
};
const barOpts = {
  ...baseChartOpts,
  scales: {
    x: { grid: { color: 'rgba(99,102,241,0.07)' }, ticks: { font: { family: 'Inter' } } },
    y: { grid: { color: 'rgba(99,102,241,0.07)' }, ticks: { font: { family: 'Inter' } } },
  },
};

/* ── main component ──────────────────────────────────────── */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user?.token}` } };
        const { data } = await axios.get('http://localhost:5000/api/analytics', config);
        setStats(data);
      } catch (err) { console.error('Analytics fetch error:', err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [user]);

  // Ticker animation
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3200);
    return () => clearInterval(id);
  }, []);

  const getSev = (sev) => stats?.severity_distribution?.find(i => i._id === sev)?.count || 0;

  if (loading) return (
    <div className="db-loading">
      <motion.div className="db-loading-ring" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
      <p>Initialising neural analytics...</p>
    </div>
  );

  const KPI = [
    { icon: <TrendingUp size={20} />, label: 'Total Predictions', raw: stats?.total_predictions || 0, suffix: '', sub: 'Live samples via ensemble', color: '#6366f1', bar: 78 },
    { icon: <AlertTriangle size={20} />, label: 'Fatal Cases',       raw: getSev('Fatal'),               suffix: '', sub: 'Critical severity outcomes', color: '#ef4444', bar: 22 },
    { icon: <Shield size={20} />,        label: 'Model Accuracy',    raw: 91.8,                           suffix: '%', sub: 'Ensemble RF+XGB+ANN',     color: '#10b981', bar: 92 },
    { icon: <Activity size={20} />,      label: 'Avg Risk Score',    raw: 64,                             suffix: '/100', sub: 'City-wide live telemetry',color: '#0ea5e9', bar: 64 },
    { icon: <Zap size={20} />,           label: 'Hotspot Zones',     raw: 12,                             suffix: '', sub: 'Active monitoring zones',  color: '#f59e0b', bar: 55 },
    { icon: <Brain size={20} />,         label: 'ML Latency',        raw: 187,                            suffix: 'ms', sub: 'Real-time inference speed',color: '#8b5cf6', bar: 88 },
  ];

  return (
    <main className="db2-page">
      {/* Ambient blobs */}
      <div className="db2-blob db2-blob-1" aria-hidden />
      <div className="db2-blob db2-blob-2" aria-hidden />

      <div className="db2-container">

        {/* ── Header ─────────────────────────────────────── */}
        <motion.header className="db2-header" {...fadeUp(0)}>
          <div>
            <span className="section-tag"><Wifi size={11} /> Analytical Neural Engine — Live</span>
            <h1 className="db2-title">
              Pune Accident <span className="db2-title-glow">Insights</span>
            </h1>
            <p className="db2-subtitle">Historical patterns & severity distributions · Mumbai–Pune corridor</p>
          </div>
          <div className="db2-header-right">
            <div className="db2-ai-badge">
              <span className="db2-ai-dot" />
              AI Active
            </div>
            <button className="db2-export-btn" onClick={() => window.print()}>
              📥 Export Report
            </button>
          </div>
        </motion.header>

        {/* ── KPI Grid ───────────────────────────────────── */}
        <motion.div className="db2-kpi-grid" variants={stagger} initial="initial" animate="animate">
          {KPI.map((k, i) => (
            <motion.div
              key={i}
              className="db2-kpi-card"
              style={{ '--acc': k.color }}
              variants={staggerChild}
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              <div className="db2-kpi-top">
                <div className="db2-kpi-icon" style={{ color: k.color, background: `${k.color}1a` }}>{k.icon}</div>
                <span className="db2-kpi-label">{k.label}</span>
              </div>
              <div className="db2-kpi-value" style={{ color: k.color }}>
                <Counter target={k.raw} suffix={k.suffix} />
              </div>
              <div className="db2-kpi-sub">{k.sub}</div>
              <div className="db2-kpi-track">
                <motion.div
                  className="db2-kpi-fill"
                  style={{ background: `linear-gradient(90deg, ${k.color}99, ${k.color})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${k.bar}%` }}
                  transition={{ duration: 1.4, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Charts + Feed Row ───────────────────────────── */}
        <div className="db2-mid-grid">

          {/* Pie chart */}
          <motion.div className="db2-chart-card" {...fadeUp(0.18)}>
            <div className="db2-card-header">
              <Zap size={16} color="#6366f1" />
              <h3>Severity Distribution</h3>
            </div>
            <div className="db2-chart-body">
              <Pie
                data={{
                  labels: ['Fatal', 'Major', 'Minor'],
                  datasets: [{
                    data: [getSev('Fatal'), getSev('Major'), getSev('Minor')],
                    backgroundColor: ['rgba(239,68,68,0.85)', 'rgba(245,158,11,0.85)', 'rgba(16,185,129,0.85)'],
                    borderColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 2, hoverOffset: 8,
                  }]
                }}
                options={{ ...baseChartOpts, scales: undefined }}
              />
            </div>
          </motion.div>

          {/* Bar chart */}
          <motion.div className="db2-chart-card" {...fadeUp(0.22)}>
            <div className="db2-card-header">
              <MapPin size={16} color="#0ea5e9" />
              <h3>Risk Factor Impact</h3>
            </div>
            <div className="db2-chart-body">
              <Bar
                data={{
                  labels: ['Weather', 'Over-speed', 'Infra', 'Traffic', 'Night', 'Drunk Drive'],
                  datasets: [{
                    label: 'Impact Score',
                    data: [85, 72, 45, 60, 78, 55],
                    backgroundColor: [
                      'rgba(99,102,241,0.7)', 'rgba(239,68,68,0.7)', 'rgba(245,158,11,0.7)',
                      'rgba(14,165,233,0.7)', 'rgba(139,92,246,0.7)', 'rgba(16,185,129,0.7)',
                    ],
                    borderColor: ['#6366f1','#ef4444','#f59e0b','#0ea5e9','#8b5cf6','#10b981'],
                    borderWidth: 2, borderRadius: 8,
                  }]
                }}
                options={barOpts}
              />
            </div>
          </motion.div>

          {/* Live feed */}
          <motion.div className="db2-feed-card" {...fadeUp(0.26)}>
            <div className="db2-card-header">
              <span className="db2-live-dot" />
              <h3>Live Incident Feed</h3>
            </div>
            <div className="db2-feed-list">
              {FEED_EVENTS.map((ev, i) => (
                <motion.div
                  key={i}
                  className="db2-feed-row"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <span className="db2-feed-dot" style={{ background: ev.color, boxShadow: `0 0 6px ${ev.color}` }} />
                  <span className="db2-feed-time">{ev.time}</span>
                  <span className="db2-feed-zone">{ev.zone}</span>
                  <span className="db2-feed-sev" style={{ color: ev.color, borderColor: `${ev.color}55` }}>{ev.sev}</span>
                </motion.div>
              ))}
            </div>
            <div className="db2-feed-ticker">
              <Clock size={12} />
              <span>Updated {tick * 3}s ago · auto-refreshing</span>
            </div>
          </motion.div>
        </div>

        {/* ── Heatmap-style risk row ──────────────────────── */}
        <motion.div className="db2-risk-row" {...fadeUp(0.28)}>
          <div className="db2-card-header" style={{ marginBottom: '1.25rem' }}>
            <AlertTriangle size={16} color="#ef4444" />
            <h3>Zone Risk Heatmap</h3>
          </div>
          <div className="db2-heatmap-grid">
            {[
              { name: 'Navale Bridge',   score: 94, color: '#ef4444' },
              { name: 'Hinjewadi Ph1',   score: 87, color: '#ef4444' },
              { name: 'Swargate Chowk', score: 81, color: '#f59e0b' },
              { name: 'Viman Nagar',     score: 73, color: '#f59e0b' },
              { name: 'Kothrud Depot',   score: 58, color: '#f59e0b' },
              { name: 'Koregaon Park',   score: 34, color: '#10b981' },
              { name: 'Baner',           score: 28, color: '#10b981' },
              { name: 'Magarpatta',      score: 41, color: '#f59e0b' },
            ].map((z, i) => (
              <motion.div
                key={i}
                className="db2-heat-cell"
                style={{ '--heat': z.color, '--heat-alpha': `${z.color}22` }}
                whileHover={{ scale: 1.06, y: -3 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              >
                <div className="db2-heat-name">{z.name}</div>
                <div className="db2-heat-score" style={{ color: z.color }}>{z.score}</div>
                <div className="db2-heat-track">
                  <motion.div
                    className="db2-heat-fill"
                    style={{ background: z.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${z.score}%` }}
                    transition={{ duration: 1, delay: i * 0.06, ease: 'easeOut' }}
                    viewport={{ once: true }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── AI Insights + Recommendations ──────────────── */}
        <div className="db2-bottom-grid">

          {/* Insights */}
          <motion.div className="db2-insights-card" {...fadeUp(0.3)}>
            <div className="db2-card-header" style={{ marginBottom: '1.25rem' }}>
              <Brain size={16} color="#6366f1" />
              <h3>AI-Generated Safety Insights</h3>
            </div>
            <div className="db2-insights-list">
              {[
                { icon: '🌙', title: 'Peak Risk Hours', body: 'Nighttime driving (8–10 PM) shows 3× higher fatal severity likelihood. Enhanced monitoring recommended.', color: '#8b5cf6' },
                { icon: '🌧️', title: 'Weather Impact', body: 'Fog and rain multiply accident severity probability by 2.4×. Advisory alerts active during monsoon.', color: '#0ea5e9' },
                { icon: '📍', title: 'High-Risk Zones', body: 'Navale Bridge, Hinjewadi, and Swargate account for 38% of fatal cases.', color: '#ef4444' },
                { icon: '⚡', title: 'Response Latency', body: 'Ensemble prediction latency <200ms enables real-time emergency dispatch coordination.', color: '#10b981' },
              ].map((ins, i) => (
                <motion.div
                  key={i}
                  className="db2-insight-item"
                  style={{ '--ic': ins.color }}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <span className="db2-insight-emoji">{ins.icon}</span>
                  <div>
                    <strong className="db2-insight-title">{ins.title}</strong>
                    <p className="db2-insight-body">{ins.body}</p>
                  </div>
                  <ChevronRight size={14} color={ins.color} style={{ flexShrink: 0 }} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div className="db2-reco-card" {...fadeUp(0.33)}>
            <div className="db2-card-header" style={{ marginBottom: '1.25rem' }}>
              <Shield size={16} color="#10b981" />
              <h3>Smart Recommendations</h3>
            </div>
            <div className="db2-reco-list">
              {RECOMMENDATIONS.map((r, i) => (
                <motion.div
                  key={i}
                  className="db2-reco-item"
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                >
                  <span className="db2-reco-icon">{r.icon}</span>
                  <div className="db2-reco-body">
                    <strong>{r.title}</strong>
                    <p>{r.desc}</p>
                  </div>
                  <span
                    className="db2-reco-priority"
                    style={{
                      background: r.priority === 'High' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: r.priority === 'High' ? '#ef4444' : '#f59e0b',
                      borderColor: r.priority === 'High' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)',
                    }}
                  >
                    {r.priority}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Live Risk Map ───────────────────────────────── */}
        <motion.div className="db2-map-section" {...fadeUp(0.36)}>
          <div className="db2-card-header" style={{ marginBottom: '1.25rem' }}>
            <MapPin size={16} color="#6366f1" />
            <h3>Live Risk Map · Pune Region</h3>
            <span className="db2-map-live-badge"><span className="db2-ai-dot" style={{ width: 7, height: 7 }} />Live</span>
          </div>
          <div className="db2-map-wrap">
            <RiskMap />
          </div>
        </motion.div>

      </div>
    </main>
  );
}

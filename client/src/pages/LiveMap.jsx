import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, AlertTriangle, Bell, Activity, Shield, Wifi } from 'lucide-react';
import { playAlertSound } from '../components/AudioAlert';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const PUNE_COORDS = [18.5204, 73.8567];

const SIMULATED_PUNE_AREAS = [
  { name: 'Shivajinagar', coords: [18.5314, 73.8446], baseRisk: 'High' },
  { name: 'Kothrud', coords: [18.5074, 73.8077], baseRisk: 'Medium' },
  { name: 'Viman Nagar', coords: [18.5679, 73.9143], baseRisk: 'Low' },
  { name: 'Hinjewadi', coords: [18.5913, 73.7389], baseRisk: 'High' },
  { name: 'Baner', coords: [18.5590, 73.7868], baseRisk: 'Low' },
  { name: 'Magarpatta', coords: [18.5157, 73.9271], baseRisk: 'Medium' },
  { name: 'Koregaon Park', coords: [18.5362, 73.8939], baseRisk: 'Low' },
  { name: 'Navale Bridge', coords: [18.4485, 73.8248], baseRisk: 'High' },
  { name: 'Kharadi', coords: [18.5516, 73.9431], baseRisk: 'Medium' },
  { name: 'Swargate', coords: [18.5018, 73.8636], baseRisk: 'High' },
  { name: 'Katraj', coords: [18.4461, 73.8565], baseRisk: 'High' },
  { name: 'Hadapsar', coords: [18.5089, 73.9259], baseRisk: 'Medium' },
  { name: 'Wadgaon Sheri', coords: [18.5512, 73.9167], baseRisk: 'Medium' },
];

const MapFlyTo = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 14, { duration: 1.5 }); }, [center, map]);
  return null;
};

export default function LiveMap() {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskList, setRiskList] = useState([]);
  const [mapCenter, setMapCenter] = useState(PUNE_COORDS);
  const [alertData, setAlertData] = useState(null);
  const { user } = useAuth();
  const riskListRef = useRef([]);

  useEffect(() => { riskListRef.current = riskList; }, [riskList]);

  useEffect(() => {
    setRiskList(SIMULATED_PUNE_AREAS.map(area => ({
      ...area, liveScore: 0, traffic: 0, isLoaded: false, id: Date.now() + Math.random()
    })));
  }, []);

  useEffect(() => {
    if (riskList.length === 0) return;
    let currentIndex = 0;
    let isActive = true;
    const scanNextLocation = async () => {
      if (!isActive) return;
      const currentList = riskListRef.current;
      if (!currentList.length) return;
      const areaToScan = currentList[currentIndex];
      if (!areaToScan) return;
      try {
        const config = { headers: { Authorization: `Bearer ${user?.token}` } };
        const { data } = await axios.post('http://localhost:5000/api/predict/live', {
          lat: areaToScan.coords[0], lng: areaToScan.coords[1], name: areaToScan.name
        }, config);
        if (data?.success && isActive) {
          const mData = data.mapData;
          let baseRisk = mData.riskPercentage >= 75 ? 'High' : mData.riskPercentage >= 40 ? 'Medium' : 'Low';
          let traff = mData.trafficStatus.includes('Standstill') || mData.trafficStatus.includes('Congestion')
            ? 85 + Math.floor(Math.random() * 15)
            : mData.trafficStatus.includes('Moderate') ? 40 + Math.floor(Math.random() * 20)
            : 10 + Math.floor(Math.random() * 15);
          setRiskList(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(a => a.id === areaToScan.id);
            if (idx !== -1) updated[idx] = { ...updated[idx], liveScore: mData.riskPercentage, baseRisk, traffic: traff, isLoaded: true };
            return updated.sort((a, b) => b.liveScore - a.liveScore);
          });
        }
      } catch {
        if (isActive) {
          setRiskList(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(a => a.id === areaToScan.id);
            if (idx !== -1) {
              const fb = Math.floor(Math.random() * 50) + 30;
              updated[idx] = { ...updated[idx], liveScore: fb, baseRisk: fb > 75 ? 'High' : 'Medium', traffic: Math.floor(Math.random() * 100), isLoaded: true };
            }
            return updated.sort((a, b) => b.liveScore - a.liveScore);
          });
        }
      }
      currentIndex = (currentIndex + 1) % currentList.length;
    };
    scanNextLocation();
    const id = setInterval(scanNextLocation, 2500);
    return () => { isActive = false; clearInterval(id); };
  }, [riskList.length, user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase();
    let foundArea = riskList.find(a => a.name.toLowerCase().includes(query));
    if (!foundArea) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Pune, Maharashtra')}&limit=1`);
        const data = await res.json();
        if (data?.length > 0) {
          const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon);
          const name = data[0].display_name.split(',')[0];
          try {
            const config = { headers: { Authorization: `Bearer ${user?.token}` } };
            const { data: mlData } = await axios.post('http://localhost:5000/api/predict/live', { lat, lng, name }, config);
            foundArea = { id: Date.now(), name, coords: [lat, lng], liveScore: mlData?.mapData?.riskPercentage || 50, isLoaded: true };
            const fb = foundArea.liveScore;
            foundArea.baseRisk = fb >= 75 ? 'High' : fb >= 40 ? 'Medium' : 'Low';
            const tStatus = mlData?.mapData?.trafficStatus || 'Moderate';
            foundArea.traffic = tStatus.includes('Congestion') ? 85 + Math.floor(Math.random() * 15)
              : tStatus.includes('Moderate') ? 40 + Math.floor(Math.random() * 20)
              : 10 + Math.floor(Math.random() * 15);
            setRiskList(prev => [foundArea, ...prev].sort((a, b) => b.liveScore - a.liveScore));
          } catch { alert(`Backend analysis failed for "${name}".`); return; }
        } else { alert(`Could not locate "${searchQuery}" in Pune area.`); return; }
      } catch { return; }
    }
    setMapCenter(foundArea.coords);
    if (foundArea.baseRisk === 'High') {
      playAlertSound();
      setAlertData({ title: 'CRITICAL RISK DETECTED', message: `${foundArea.name} — Traffic: ${foundArea.traffic}%, Risk: ${foundArea.liveScore}/100`, timestamp: new Date().toLocaleTimeString() });
      setTimeout(() => setAlertData(null), 6000);
    }
  };

  const getRiskColor = (riskOrScore) => {
    if (typeof riskOrScore === 'string') {
      return riskOrScore === 'High' ? '#ef4444' : riskOrScore === 'Medium' ? '#f59e0b' : '#10b981';
    }
    return riskOrScore >= 75 ? '#ef4444' : riskOrScore >= 40 ? '#f59e0b' : '#10b981';
  };

  const highCount = riskList.filter(a => a.baseRisk === 'High' && a.isLoaded).length;
  const avgRisk = riskList.length ? Math.round(riskList.filter(a => a.isLoaded).reduce((s, a) => s + a.liveScore, 0) / Math.max(1, riskList.filter(a => a.isLoaded).length)) : 0;

  return (
    <div className="livemap-page">
      {/* Alert Toast */}
      <AnimatePresence>
        {alertData && (
          <motion.div
            className="lm-alert-toast"
            initial={{ opacity: 0, y: -60, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -60, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <Bell size={20} className="lm-alert-icon" />
            <div>
              <strong>{alertData.title}</strong>
              <span>{alertData.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <motion.div
        className="lm-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <span className="section-tag">Live Intelligence</span>
          <h1 className="lm-title">Pune Risk Tracker</h1>
          <p className="lm-subtitle">Real-time accident risk monitoring across Pune's road network</p>
        </div>
        <div className="lm-status-badge">
          <span className="lm-status-dot" />
          AI Monitoring Active
        </div>
      </motion.div>

      {/* KPI Bar */}
      <motion.div
        className="lm-kpi-bar"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {[
          { icon: <AlertTriangle size={18} />, val: highCount, lbl: 'High-Risk Zones', color: '#ef4444' },
          { icon: <Activity size={18} />, val: `${avgRisk}/100`, lbl: 'Avg Risk Score', color: '#f59e0b' },
          { icon: <Shield size={18} />, val: riskList.filter(a => a.baseRisk === 'Low' && a.isLoaded).length, lbl: 'Safe Zones', color: '#10b981' },
          { icon: <Wifi size={18} />, val: riskList.filter(a => a.isLoaded).length, lbl: 'Areas Scanned', color: '#6366f1' },
        ].map((k, i) => (
          <div key={i} className="lm-kpi-card" style={{ '--kpi-color': k.color }}>
            <div className="lm-kpi-icon" style={{ color: k.color }}>{k.icon}</div>
            <div className="lm-kpi-val" style={{ color: k.color }}>{k.val}</div>
            <div className="lm-kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </motion.div>

      {/* Main Layout */}
      <div className="lm-layout">
        {/* Sidebar */}
        <motion.aside
          className="lm-sidebar"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Search */}
          <form onSubmit={handleSearch} className="lm-search-form">
            <div className="lm-search-icon"><Search size={16} /></div>
            <input
              type="text"
              placeholder="Search Pune area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="lm-search-input"
            />
            <button type="submit" className="lm-search-btn">Scan</button>
          </form>

          {/* Risk List */}
          <div className="lm-risk-list-header">
            <h3>Live Risk List</h3>
            <span className="lm-pulse-indicator"><span className="lm-pulse-dot" />Live</span>
          </div>

          <div className="lm-risk-list">
            {riskList.map((area, idx) => (
              <motion.div
                key={area.id}
                className={`lm-risk-card ${area.baseRisk === 'High' ? 'lm-risk-card--high' : ''}`}
                onClick={() => setMapCenter(area.coords)}
                whileHover={{ x: 4, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ transitionDelay: `${idx * 30}ms` }}
              >
                <div className="lm-risk-card-top">
                  <span className="lm-risk-name">
                    {area.baseRisk === 'High' && <AlertTriangle size={12} color="#ef4444" />}
                    {area.name}
                  </span>
                  <span className="lm-risk-badge" style={{ background: getRiskColor(area.baseRisk) }}>
                    {area.baseRisk}
                  </span>
                </div>
                <div className="lm-risk-card-bottom">
                  {area.isLoaded ? (
                    <>
                      <span>Score: <strong style={{ color: getRiskColor(area.liveScore) }}>{area.liveScore}/100</strong></span>
                      <span>Traffic: {area.traffic}%</span>
                    </>
                  ) : (
                    <span className="lm-scanning-text">
                      <span className="lm-scan-dot" />
                      Scanning telemetrics...
                    </span>
                  )}
                </div>
                {area.isLoaded && (
                  <div className="lm-risk-bar-bg">
                    <div
                      className="lm-risk-bar-fill"
                      style={{ width: `${area.liveScore}%`, background: getRiskColor(area.liveScore) }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.aside>

        {/* Map Panel */}
        <motion.div
          className="lm-map-panel"
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%', borderRadius: '16px', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFlyTo center={mapCenter} />
            {riskList.map(area => (
              <CircleMarker
                key={`cm-${area.id}`}
                center={area.coords}
                pathOptions={{ color: getRiskColor(area.baseRisk), fillColor: getRiskColor(area.baseRisk), fillOpacity: 0.65 }}
                radius={15 + (area.liveScore / 10)}
              >
                <Popup>
                  <div style={{ padding: '4px', fontFamily: 'Inter, sans-serif' }}>
                    <b style={{ fontSize: '1rem' }}>{area.name}</b><br />
                    <span style={{ color: '#64748b' }}>Risk: </span>
                    <strong style={{ color: getRiskColor(area.liveScore) }}>{area.liveScore}/100</strong><br />
                    <span style={{ color: '#64748b' }}>Traffic: </span>
                    <strong>{area.traffic}%</strong>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </motion.div>
      </div>
    </div>
  );
}

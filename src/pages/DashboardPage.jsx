import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, Users, Clock, CheckCircle2, TrendingUp,
  TrendingDown, ArrowUpRight, Filter, MapPin, Loader
} from 'lucide-react';
import { categoryColors } from '../data/needs';
import { subscribeToNeeds, subscribeToVolunteers, subscribeToTasks } from '../firebase/services';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import 'leaflet/dist/leaflet.css';
import '../components/Dashboard/Dashboard.css';

// Fallback imports for when Firestore is empty
import { needs as fallbackNeeds } from '../data/needs';
import { volunteers as fallbackVolunteers } from '../data/volunteers';
import { tasks as fallbackTasks } from '../data/tasks';
import { weeklyTrend as fallbackWeeklyTrend } from '../data/analytics';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = typeof value === 'number' ? value : parseInt(value);
    if (isNaN(end)) { setDisplay(value); return; }
    const duration = 1200;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = end / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);
  return <>{typeof value === 'number' ? display.toLocaleString() : display}{suffix}</>;
}

export default function DashboardPage() {
  const [needs, setNeeds] = useState(null);
  const [volunteers, setVolunteers] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');

  // Subscribe to real-time Firestore data, fallback to hardcoded if empty
  useEffect(() => {
    const unsubs = [];
    unsubs.push(subscribeToNeeds((data) => {
      setNeeds(data.length > 0 ? data : fallbackNeeds);
    }));
    unsubs.push(subscribeToVolunteers((data) => {
      setVolunteers(data.length > 0 ? data : fallbackVolunteers);
    }));
    unsubs.push(subscribeToTasks((data) => {
      setTasks(data.length > 0 ? data : fallbackTasks);
    }));
    return () => unsubs.forEach(u => u());
  }, []);

  // Use fallback data while loading
  const activeNeeds = needs || fallbackNeeds;
  const activeVolunteers = volunteers || fallbackVolunteers;
  const activeTasks = tasks || fallbackTasks;

  const weeklyTrend = fallbackWeeklyTrend;

  const openNeeds = activeNeeds.filter(n => n.status === 'Open').length;
  const activeVolCount = activeVolunteers.filter(v => v.availability === 'available').length;
  const completedTasks = activeTasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = activeTasks.filter(t => t.status === 'In Progress').length;

  const topNeeds = useMemo(() => {
    let filtered = [...activeNeeds];
    if (filterCategory !== 'All') filtered = filtered.filter(n => n.category === filterCategory);
    return filtered.sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, 10);
  }, [filterCategory, activeNeeds]);

  const categories = ['All', ...new Set(activeNeeds.map(n => n.category))];

  // Category distribution for doughnut
  const catCounts = {};
  activeNeeds.forEach(n => { catCounts[n.category] = (catCounts[n.category] || 0) + 1; });
  const doughnutData = {
    labels: Object.keys(catCounts),
    datasets: [{
      data: Object.values(catCounts),
      backgroundColor: Object.keys(catCounts).map(c => categoryColors[c] || '#64748b'),
      borderColor: 'transparent',
      borderWidth: 0,
      hoverOffset: 6,
    }]
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(51, 65, 85, 0.5)',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 12,
        cornerRadius: 8,
      }
    }
  };

  // Weekly trend line chart
  const trendData = {
    labels: weeklyTrend.map(w => w.week),
    datasets: [
      {
        label: 'Opened',
        data: weeklyTrend.map(w => w.open),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#f59e0b',
      },
      {
        label: 'Resolved',
        data: weeklyTrend.map(w => w.resolved),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
      },
    ]
  };
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.2)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.2)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      }
    },
    plugins: {
      legend: {
        labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(51, 65, 85, 0.5)',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 12,
        cornerRadius: 8,
      }
    }
  };

  const getUrgencyColor = (score) => {
    if (score >= 90) return 'var(--urgency-5)';
    if (score >= 75) return 'var(--urgency-4)';
    if (score >= 60) return 'var(--urgency-3)';
    if (score >= 40) return 'var(--urgency-2)';
    return 'var(--urgency-1)';
  };

  const getStatusBadge = (status) => {
    const map = {
      'Open': 'badge-warning',
      'Matched': 'badge-info',
      'Assigned': 'badge-purple',
      'In Progress': 'badge-info',
      'Completed': 'badge-success',
      'Escalated': 'badge-danger',
      'Cancelled': 'badge-danger',
    };
    return map[status] || 'badge-info';
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="dashboard">
      {/* KPI Cards */}
      <div className="kpi-grid stagger-children">
        <div className="kpi-card kpi-urgent">
          <div className="kpi-icon-wrap kpi-icon-danger">
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value"><AnimatedNumber value={openNeeds} /></span>
            <span className="kpi-label">Open Needs</span>
          </div>
          <div className="kpi-trend trend-up">
            <TrendingUp size={14} />
            <span>+5 today</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-icon-success">
            <Users size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value"><AnimatedNumber value={activeVolCount} /></span>
            <span className="kpi-label">Active Volunteers</span>
          </div>
          <div className="kpi-trend trend-up">
            <TrendingUp size={14} />
            <span>+2 this week</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-icon-info">
            <Clock size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value"><AnimatedNumber value={28} suffix=" min" /></span>
            <span className="kpi-label">Avg Response Time</span>
          </div>
          <div className="kpi-trend trend-down-good">
            <TrendingDown size={14} />
            <span>-12min</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-icon-purple">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value"><AnimatedNumber value={completedTasks + inProgressTasks} /></span>
            <span className="kpi-label">Tasks Active/Done</span>
          </div>
          <div className="kpi-trend trend-up">
            <ArrowUpRight size={14} />
            <span>{completedTasks} completed</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Heat Map */}
        <div className="glass-card dash-map-card animate-fade-in-up">
          <div className="card-header">
            <div>
              <h3>Need Intensity Map</h3>
              <p className="card-subtitle"><span className="live-dot"></span>Live across India</p>
            </div>
          </div>
          <div className="map-container" id="needs-heatmap">
            <MapContainer
              center={[22.5, 79]}
              zoom={5}
              style={{ height: '100%', width: '100%', borderRadius: '12px' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {activeNeeds.map((n) => (
                <CircleMarker
                  key={n.id}
                  center={[n.location.lat, n.location.lng]}
                  radius={Math.max(6, n.urgencyScore / 8)}
                  fillColor={getUrgencyColor(n.urgencyScore)}
                  color="transparent"
                  fillOpacity={0.7}
                >
                  <Popup>
                    <div style={{ color: '#1e293b', minWidth: 180 }}>
                      <strong>{n.title}</strong><br />
                      <span style={{ fontSize: '0.8em' }}>{n.location.city}, {n.location.state}</span><br />
                      <span style={{ fontSize: '0.8em' }}>Urgency: {n.urgencyScore}/100 • {n.status}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Top Priority Needs */}
        <div className="glass-card dash-needs-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="card-header">
            <div>
              <h3>Top Priority Needs</h3>
              <p className="card-subtitle">Sorted by urgency score</p>
            </div>
            <div className="card-filter">
              <Filter size={14} />
              <select
                className="select-field select-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="priority-list">
            {topNeeds.map((need, i) => (
              <div className="priority-item" key={need.id}>
                <div className="priority-rank">
                  <div
                    className="urgency-ring"
                    style={{
                      '--score': need.urgencyScore,
                      '--color': getUrgencyColor(need.urgencyScore),
                    }}
                  >
                    <span>{need.urgencyScore}</span>
                  </div>
                </div>
                <div className="priority-info">
                  <h4>{need.title}</h4>
                  <div className="priority-meta">
                    <span className="meta-item">
                      <MapPin size={12} />
                      {need.location.city}
                    </span>
                    <span className={`badge ${getStatusBadge(need.status)}`}>{need.status}</span>
                    <span className="meta-time">{timeAgo(need.reportedAt)}</span>
                  </div>
                </div>
                <div
                  className="priority-cat-dot"
                  style={{ background: categoryColors[need.category] }}
                  title={need.category}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="glass-card dash-chart-card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <div>
              <h3>Needs by Category</h3>
              <p className="card-subtitle">{activeNeeds.length} total reported</p>
            </div>
          </div>
          <div className="doughnut-wrapper">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="doughnut-center">
              <span className="doughnut-value">{activeNeeds.length}</span>
              <span className="doughnut-label">Total</span>
            </div>
          </div>
          <div className="legend-grid">
            {Object.entries(catCounts).map(([cat, count]) => (
              <div className="legend-item" key={cat}>
                <span className="legend-dot" style={{ background: categoryColors[cat] }} />
                <span className="legend-name">{cat}</span>
                <span className="legend-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="glass-card dash-trend-card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="card-header">
            <div>
              <h3>Weekly Trend</h3>
              <p className="card-subtitle">Needs opened vs resolved</p>
            </div>
          </div>
          <div className="trend-chart-wrapper">
            <Line data={trendData} options={trendOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

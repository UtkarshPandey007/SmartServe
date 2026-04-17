import { useState, useEffect } from 'react';
import { Trophy, Download, TrendingUp, Users, Clock, CheckCircle2, MapPin, Award } from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { monthlyStats as fallbackMonthly, kpiData as fallbackKpi, leaderboard as fallbackLeaderboard, geographicCoverage as fallbackGeo, categoryDistribution as fallbackCatDist } from '../data/analytics';
import { categoryColors } from '../data/needs';
import { subscribeToNeeds, subscribeToVolunteers, subscribeToTasks} from '../firebase/services';
import { needs as fallbackNeeds } from '../data/needs';
import { volunteers as fallbackVolunteers } from '../data/volunteers';
import { tasks as fallbackTasks } from '../data/tasks';
import './Pages.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const chartTooltip = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderColor: 'rgba(51, 65, 85, 0.5)',
  borderWidth: 1,
  titleColor: '#f1f5f9',
  bodyColor: '#94a3b8',
  padding: 12,
  cornerRadius: 8,
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [liveNeeds, setLiveNeeds] = useState(null);
  const [liveVolunteers, setLiveVolunteers] = useState(null);
  const [liveTasks, setLiveTasks] = useState(null);

  // Subscribe to real-time data for live stats
  useEffect(() => {
    const unsubs = [];
    unsubs.push(subscribeToNeeds((data) => setLiveNeeds(data.length > 0 ? data : fallbackNeeds)));
    unsubs.push(subscribeToVolunteers((data) => setLiveVolunteers(data.length > 0 ? data : fallbackVolunteers)));
    unsubs.push(subscribeToTasks((data) => setLiveTasks(data.length > 0 ? data : fallbackTasks)));
    return () => unsubs.forEach(u => u());
  }, []);

  const activeNeeds = liveNeeds || fallbackNeeds;
  const activeVolunteers = liveVolunteers || fallbackVolunteers;
  const activeTasks = liveTasks || fallbackTasks;

  // Compute live KPIs from data
  const totalResolved = activeNeeds.filter(n => n.status === 'Completed').length;
  const totalReported = activeNeeds.length;
  const activeVolCount = activeVolunteers.filter(v => v.availability === 'available').length;
  const totalHours = activeVolunteers.reduce((sum, v) => sum + (v.hoursContributed || 0), 0);
  const utilization = Math.round((activeTasks.filter(t => ['In Progress', 'Assigned'].includes(t.status)).length / Math.max(1, activeVolunteers.length)) * 100);

  // Build leaderboard from live volunteer data
  const liveLeaderboard = [...activeVolunteers]
    .sort((a, b) => b.hoursContributed - a.hoursContributed)
    .slice(0, 10)
    .map((v, i) => ({
      rank: i + 1,
      volunteerId: v.id,
      name: v.name,
      hours: v.hoursContributed,
      tasks: v.tasksCompleted,
      rating: v.rating,
      city: v.location.city,
    }));

  // Use fallback analytics for charts (these are historical)
  const monthlyStats = fallbackMonthly;
  const categoryDistribution = fallbackCatDist;
  const geographicCoverage = fallbackGeo;

  // Monthly bar chart
  const monthlyBarData = {
    labels: monthlyStats.map(m => m.month),
    datasets: [
      {
        label: 'Reported',
        data: monthlyStats.map(m => m.needsReported),
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderRadius: 6,
        barThickness: 18,
      },
      {
        label: 'Resolved',
        data: monthlyStats.map(m => m.needsResolved),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 6,
        barThickness: 18,
      },
    ]
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { color: 'rgba(51,65,85,0.2)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { grid: { color: 'rgba(51,65,85,0.2)' }, ticks: { color: '#64748b', font: { size: 11 } } },
    },
    plugins: {
      legend: { labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 16 } },
      tooltip: chartTooltip,
    }
  };

  // Response time line
  const responseLineData = {
    labels: monthlyStats.map(m => m.month),
    datasets: [{
      label: 'Avg Response (hrs)',
      data: monthlyStats.map(m => m.avgResponseHours),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: '#06b6d4',
    }]
  };
  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { color: 'rgba(51,65,85,0.2)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { grid: { color: 'rgba(51,65,85,0.2)' }, ticks: { color: '#64748b', font: { size: 11 } }, title: { display: true, text: 'Hours', color: '#64748b' } },
    },
    plugins: {
      legend: { labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle' } },
      tooltip: chartTooltip,
    }
  };

  // Category doughnut
  const catDoughnutData = {
    labels: categoryDistribution.map(c => c.category),
    datasets: [{
      data: categoryDistribution.map(c => c.count),
      backgroundColor: categoryDistribution.map(c => categoryColors[c.category]),
      borderColor: 'transparent',
      hoverOffset: 6,
    }]
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Tab nav */}
      <div className="report-tabs glass-card">
        {['overview', 'leaderboard', 'geographic'].map(tab => (
          <button
            key={tab}
            className={`report-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && <TrendingUp size={15} />}
            {tab === 'leaderboard' && <Trophy size={15} />}
            {tab === 'geographic' && <MapPin size={15} />}
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn-secondary">
          <Download size={14} /> Export PDF
        </button>
        <button className="btn-secondary">
          <Download size={14} /> Export Excel
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="report-overview">
          {/* KPI Summary — now uses live data */}
          <div className="report-kpi-grid stagger-children">
            <div className="report-kpi glass-card">
              <div className="rkpi-icon" style={{ background: 'var(--status-info-bg)', color: 'var(--status-info)' }}><CheckCircle2 size={20} /></div>
              <div className="rkpi-data">
                <span className="rkpi-val">{totalResolved}</span>
                <span className="rkpi-label">Needs Resolved</span>
              </div>
              <span className="rkpi-of">of {totalReported}</span>
            </div>
            <div className="report-kpi glass-card">
              <div className="rkpi-icon" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)' }}><Clock size={20} /></div>
              <div className="rkpi-data">
                <span className="rkpi-val">28 min</span>
                <span className="rkpi-label">Avg Response</span>
              </div>
              <span className="rkpi-trend">↓ 72% from baseline</span>
            </div>
            <div className="report-kpi glass-card">
              <div className="rkpi-icon" style={{ background: 'var(--status-purple-bg)', color: 'var(--status-purple)' }}><Users size={20} /></div>
              <div className="rkpi-data">
                <span className="rkpi-val">{utilization}%</span>
                <span className="rkpi-label">Volunteer Utilization</span>
              </div>
              <span className="rkpi-trend">Target: 75%</span>
            </div>
            <div className="report-kpi glass-card">
              <div className="rkpi-icon" style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}><TrendingUp size={20} /></div>
              <div className="rkpi-data">
                <span className="rkpi-val">{totalHours.toLocaleString()}</span>
                <span className="rkpi-label">Total Volunteer Hours</span>
              </div>
              <span className="rkpi-trend">{activeVolCount} active</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="glass-card chart-card">
              <h3>Needs Reported vs Resolved</h3>
              <div className="chart-wrapper"><Bar data={monthlyBarData} options={barOptions} /></div>
            </div>
            <div className="glass-card chart-card">
              <h3>Response Time Trend</h3>
              <div className="chart-wrapper"><Line data={responseLineData} options={lineOptions} /></div>
            </div>
            <div className="glass-card chart-card chart-card-sm">
              <h3>Category Distribution</h3>
              <div className="chart-wrapper chart-doughnut-wrap">
                <Doughnut data={catDoughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } }, tooltip: chartTooltip } }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="leaderboard-section animate-fade-in">
          <div className="glass-card leaderboard-card">
            <div className="leaderboard-header">
              <Trophy size={20} color="#f59e0b" />
              <h3>Volunteer Leaderboard</h3>
              <span className="leaderboard-sub">Top contributors by hours & tasks (live data)</span>
            </div>
            <table className="data-table" id="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Volunteer</th>
                  <th>City</th>
                  <th>Hours</th>
                  <th>Tasks</th>
                  <th>Rating</th>
                  <th>Impact Score</th>
                </tr>
              </thead>
              <tbody>
                {liveLeaderboard.map((entry) => (
                  <tr key={entry.rank}>
                    <td>
                      <span className={`rank-badge ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}>
                        {entry.rank <= 3 ? <Trophy size={14} /> : entry.rank}
                      </span>
                    </td>
                    <td>
                      <div className="lb-name-cell">
                        <div className="lb-avatar">{entry.name.split(' ').map(n => n[0]).join('')}</div>
                        <span>{entry.name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{entry.city}</td>
                    <td><strong>{entry.hours}</strong></td>
                    <td>{entry.tasks}</td>
                    <td>
                      <div className="lb-rating">
                        <Award size={13} color="#f59e0b" />
                        <span>{entry.rating}</span>
                      </div>
                    </td>
                    <td>
                      <div className="impact-bar">
                        <div className="impact-fill" style={{ width: `${Math.min(100, (entry.hours / 4) + (entry.tasks * 0.5))}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'geographic' && (
        <div className="geo-section animate-fade-in">
          <div className="glass-card geo-card">
            <h3>Geographic Coverage by State</h3>
            <table className="data-table" id="geographic-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Needs</th>
                  <th>Volunteers</th>
                  <th>Coverage</th>
                  <th>Coverage Bar</th>
                </tr>
              </thead>
              <tbody>
                {geographicCoverage.map(g => (
                  <tr key={g.state}>
                    <td><strong>{g.state}</strong></td>
                    <td>{g.needs}</td>
                    <td>{g.volunteers}</td>
                    <td>{g.coverage}%</td>
                    <td>
                      <div className="coverage-bar">
                        <div className="coverage-fill" style={{
                          width: `${g.coverage}%`,
                          background: g.coverage >= 70 ? 'var(--status-success)' : g.coverage >= 50 ? 'var(--status-warning)' : 'var(--status-danger)',
                        }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

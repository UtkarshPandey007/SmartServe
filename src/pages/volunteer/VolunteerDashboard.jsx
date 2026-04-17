import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToTasksByVolunteer, subscribeToNeeds, acceptTask, completeTask
} from '../../firebase/services';
import { needs as fallbackNeeds } from '../../data/needs';
import {
  CheckCircle2, Clock, TrendingUp, Zap, MapPin, Star, Award,
  ArrowUpRight, Activity
} from 'lucide-react';
import './VolunteerPages.css';

export default function VolunteerDashboard() {
  const { user, volunteerProfile } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [allNeeds, setAllNeeds] = useState([]);
  const volId = volunteerProfile?.id;

  useEffect(() => {
    const unsubs = [];
    if (volId) {
      unsubs.push(subscribeToTasksByVolunteer(volId, setMyTasks));
    }
    unsubs.push(subscribeToNeeds((data) => {
      setAllNeeds(data.length > 0 ? data : fallbackNeeds);
    }));
    return () => unsubs.forEach(u => u());
  }, [volId]);

  const activeTasks = myTasks.filter(t => ['Assigned', 'In Progress'].includes(t.status));
  const completedTasks = myTasks.filter(t => t.status === 'Completed');
  const totalHours = volunteerProfile?.hoursContributed || completedTasks.reduce((s, t) => s + (t.hoursLogged || 0), 0);
  const getNeed = (id) => allNeeds.find(n => n.id === id);

  const displayName = user?.displayName || 'Volunteer';

  const getUrgencyColor = (score) => {
    if (!score) return 'var(--text-muted)';
    if (score >= 90) return 'var(--urgency-5)';
    if (score >= 75) return 'var(--urgency-4)';
    if (score >= 60) return 'var(--urgency-3)';
    return 'var(--urgency-2)';
  };

  const timeAgo = (d) => {
    if (!d) return '';
    const hrs = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="vol-dashboard animate-fade-in">
      {/* Welcome Banner */}
      <div className="vol-welcome glass-card">
        <div className="vol-welcome-text">
          <h2>Welcome back, <span className="gradient-text">{displayName}</span> 👋</h2>
          <p>Here's your volunteering summary at a glance</p>
        </div>
        <div className="vol-welcome-stats">
          <div className="vw-stat">
            <span className="vw-val">{activeTasks.length}</span>
            <span className="vw-label">Active Tasks</span>
          </div>
          <div className="vw-stat">
            <span className="vw-val">{completedTasks.length}</span>
            <span className="vw-label">Completed</span>
          </div>
          <div className="vw-stat">
            <span className="vw-val">{totalHours}</span>
            <span className="vw-label">Hours</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="vol-kpi-grid stagger-children">
        <div className="vol-kpi glass-card">
          <div className="vol-kpi-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-primary)' }}>
            <Activity size={20} />
          </div>
          <div>
            <span className="vol-kpi-val">{activeTasks.length}</span>
            <span className="vol-kpi-label">Active Tasks</span>
          </div>
        </div>
        <div className="vol-kpi glass-card">
          <div className="vol-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="vol-kpi-val">{completedTasks.length}</span>
            <span className="vol-kpi-label">Completed</span>
          </div>
        </div>
        <div className="vol-kpi glass-card">
          <div className="vol-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)' }}>
            <Clock size={20} />
          </div>
          <div>
            <span className="vol-kpi-val">{totalHours}h</span>
            <span className="vol-kpi-label">Hours Given</span>
          </div>
        </div>
        <div className="vol-kpi glass-card">
          <div className="vol-kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Star size={20} />
          </div>
          <div>
            <span className="vol-kpi-val">{volunteerProfile?.rating || '—'}</span>
            <span className="vol-kpi-label">Rating</span>
          </div>
        </div>
      </div>

      <div className="vol-dash-grid">
        {/* My Active Tasks */}
        <div className="glass-card vol-section">
          <div className="vol-section-header">
            <h3><Zap size={16} /> My Active Tasks</h3>
            <span className="vol-section-count">{activeTasks.length}</span>
          </div>
          {activeTasks.length === 0 ? (
            <div className="vol-empty">
              <p>No active tasks yet. Browse open needs to get started!</p>
            </div>
          ) : (
            <div className="vol-task-list">
              {activeTasks.map(task => {
                const need = getNeed(task.needId);
                return (
                  <div className="vol-task-card" key={task.id}>
                    <div className="vol-task-top">
                      <span className="vol-task-id">{task.id}</span>
                      <span className={`badge ${task.status === 'In Progress' ? 'badge-info' : 'badge-purple'}`}>
                        {task.status}
                      </span>
                    </div>
                    {need && (
                      <>
                        <h4>{need.title}</h4>
                        <div className="vol-task-meta">
                          <span><MapPin size={12} /> {need.location.city}</span>
                          <span style={{ color: getUrgencyColor(need.urgencyScore) }}>
                            Score: {need.urgencyScore}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="vol-task-actions">
                      {task.status === 'Assigned' && (
                        <button className="btn-primary btn-sm" onClick={() => acceptTask(task._docId)}>
                          <ArrowUpRight size={14} /> <span>Start</span>
                        </button>
                      )}
                      {task.status === 'In Progress' && (
                        <button className="btn-primary btn-sm btn-success" onClick={() => completeTask(task._docId, 2)}>
                          <CheckCircle2 size={14} /> <span>Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Completions */}
        <div className="glass-card vol-section">
          <div className="vol-section-header">
            <h3><Award size={16} /> Recent Completions</h3>
          </div>
          {completedTasks.length === 0 ? (
            <div className="vol-empty">
              <p>Complete tasks to see your impact here!</p>
            </div>
          ) : (
            <div className="vol-task-list">
              {completedTasks.slice(0, 5).map(task => {
                const need = getNeed(task.needId);
                return (
                  <div className="vol-task-card completed" key={task.id}>
                    <div className="vol-task-top">
                      <span className="vol-task-id">{task.id}</span>
                      <span className="badge badge-success">Completed</span>
                    </div>
                    {need && <h4>{need.title}</h4>}
                    <div className="vol-task-meta">
                      <span><Clock size={12} /> {timeAgo(task.completedAt)}</span>
                      {task.hoursLogged > 0 && <span>{task.hoursLogged}h logged</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

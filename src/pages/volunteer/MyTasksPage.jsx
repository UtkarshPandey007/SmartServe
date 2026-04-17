import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToTasksByVolunteer, subscribeToNeeds, acceptTask, completeTask, declineTask
} from '../../firebase/services';
import { needs as fallbackNeeds } from '../../data/needs';
import { categoryColors } from '../../data/needs';
import {
  CheckCircle2, Clock, MapPin, ArrowUpRight, X, Filter, AlertTriangle
} from 'lucide-react';
import './VolunteerPages.css';

export default function MyTasksPage() {
  const { volunteerProfile } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [allNeeds, setAllNeeds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [completing, setCompleting] = useState(null);
  const [hoursInput, setHoursInput] = useState('');
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

  const getNeed = (id) => allNeeds.find(n => n.id === id);

  const filtered = statusFilter === 'All'
    ? myTasks
    : myTasks.filter(t => t.status === statusFilter);

  const statuses = ['All', 'Assigned', 'In Progress', 'Completed'];

  const handleComplete = async (taskDocId) => {
    const hours = parseFloat(hoursInput) || 0;
    await completeTask(taskDocId, hours);
    setCompleting(null);
    setHoursInput('');
  };

  const getUrgencyColor = (score) => {
    if (!score) return 'var(--text-muted)';
    if (score >= 90) return 'var(--urgency-5)';
    if (score >= 75) return 'var(--urgency-4)';
    if (score >= 60) return 'var(--urgency-3)';
    return 'var(--urgency-2)';
  };

  const timeAgo = (d) => {
    if (!d) return '—';
    const hrs = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Filters */}
      <div className="filters-bar glass-card">
        <div className="vol-status-tabs">
          {statuses.map(s => (
            <button
              key={s}
              className={`vol-status-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s} {s !== 'All' && <span className="tab-count">{myTasks.filter(t => t.status === s).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="mytasks-grid stagger-children">
        {filtered.length === 0 ? (
          <div className="vol-empty glass-card">
            <AlertTriangle size={24} />
            <p>No tasks {statusFilter !== 'All' ? `with status "${statusFilter}"` : 'yet'}. Browse open needs to get started!</p>
          </div>
        ) : (
          filtered.map(task => {
            const need = getNeed(task.needId);
            const isCompleting = completing === task._docId;
            return (
              <div className={`mytask-card glass-card ${task.status === 'Completed' ? 'completed' : ''}`} key={task.id}>
                <div className="mytask-header">
                  <span className="mytask-id">{task.id}</span>
                  <span className={`badge ${
                    task.status === 'Completed' ? 'badge-success' :
                    task.status === 'In Progress' ? 'badge-info' :
                    task.status === 'Assigned' ? 'badge-purple' : 'badge-warning'
                  }`}>{task.status}</span>
                </div>

                {need && (
                  <>
                    <h3 className="mytask-title">{need.title}</h3>
                    <p className="mytask-desc">{need.description?.slice(0, 120)}...</p>
                    <div className="mytask-meta">
                      <span className="mytask-loc"><MapPin size={13} /> {need.location.city}, {need.location.state}</span>
                      <span className="cat-tag" style={{ background: `${categoryColors[need.category]}20`, color: categoryColors[need.category] }}>
                        {need.category}
                      </span>
                    </div>
                    <div className="mytask-urgency">
                      <span>Urgency Score:</span>
                      <span className="mytask-score" style={{ color: getUrgencyColor(need.urgencyScore) }}>
                        {need.urgencyScore}/100
                      </span>
                    </div>
                  </>
                )}

                <div className="mytask-footer">
                  <span className="mytask-time"><Clock size={12} /> Assigned {timeAgo(task.assignedAt)}</span>
                  {task.completedAt && <span className="mytask-time"><CheckCircle2 size={12} /> Done {timeAgo(task.completedAt)}</span>}
                </div>

                {/* Action buttons */}
                <div className="mytask-actions">
                  {task.status === 'Assigned' && (
                    <>
                      <button className="btn-primary btn-sm" onClick={() => acceptTask(task._docId)}>
                        <ArrowUpRight size={14} /> <span>Accept & Start</span>
                      </button>
                      <button className="btn-secondary btn-sm" onClick={() => declineTask(task._docId)}>
                        <X size={14} /> Decline
                      </button>
                    </>
                  )}
                  {task.status === 'In Progress' && !isCompleting && (
                    <button className="btn-primary btn-sm btn-success" onClick={() => setCompleting(task._docId)}>
                      <CheckCircle2 size={14} /> <span>Mark Complete</span>
                    </button>
                  )}
                  {isCompleting && (
                    <div className="complete-form animate-fade-in">
                      <input
                        type="number"
                        placeholder="Hours spent"
                        className="input-field"
                        value={hoursInput}
                        onChange={(e) => setHoursInput(e.target.value)}
                        min={0}
                        step={0.5}
                        autoFocus
                      />
                      <button className="btn-primary btn-sm btn-success" onClick={() => handleComplete(task._docId)}>
                        <CheckCircle2 size={14} /> <span>Submit</span>
                      </button>
                      <button className="btn-secondary btn-sm" onClick={() => setCompleting(null)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

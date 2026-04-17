import { useState, useMemo, useEffect } from 'react';
import { needs as fallbackNeeds } from '../data/needs';
import { volunteers as fallbackVolunteers } from '../data/volunteers';
import { tasks as fallbackTasks } from '../data/tasks';
import { subscribeToTasks, subscribeToNeeds, subscribeToVolunteers, updateTask } from '../firebase/services';
import { GripVertical, Clock, User, MapPin, AlertTriangle } from 'lucide-react';
import './Pages.css';

const columns = [
  { key: 'Open', color: 'var(--status-warning)' },
  { key: 'Matched', color: 'var(--status-info)' },
  { key: 'Assigned', color: 'var(--status-purple)' },
  { key: 'In Progress', color: 'var(--accent-primary)' },
  { key: 'Completed', color: 'var(--status-success)' },
  { key: 'Escalated', color: 'var(--status-danger)' },
];

export default function TasksPage() {
  const [taskData, setTaskData] = useState(null);
  const [needsData, setNeedsData] = useState(null);
  const [volData, setVolData] = useState(null);
  const [dragItem, setDragItem] = useState(null);

  // Subscribe to real-time data
  useEffect(() => {
    const unsubs = [];
    unsubs.push(subscribeToTasks((data) => {
      setTaskData(data.length > 0 ? data : fallbackTasks);
    }));
    unsubs.push(subscribeToNeeds((data) => {
      setNeedsData(data.length > 0 ? data : fallbackNeeds);
    }));
    unsubs.push(subscribeToVolunteers((data) => {
      setVolData(data.length > 0 ? data : fallbackVolunteers);
    }));
    return () => unsubs.forEach(u => u());
  }, []);

  const activeTasks = taskData || fallbackTasks;
  const activeNeeds = needsData || fallbackNeeds;
  const activeVols = volData || fallbackVolunteers;

  const getNeed = (id) => activeNeeds.find(n => n.id === id);
  const getVol = (id) => activeVols.find(v => v.id === id);

  const grouped = useMemo(() => {
    const g = {};
    columns.forEach(c => { g[c.key] = []; });
    activeTasks.forEach(t => {
      if (g[t.status]) g[t.status].push(t);
    });
    return g;
  }, [activeTasks]);

  const timeAgo = (d) => {
    if (!d) return '—';
    const hrs = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getUrgencyColor = (score) => {
    if (!score) return 'var(--text-muted)';
    if (score >= 90) return 'var(--urgency-5)';
    if (score >= 75) return 'var(--urgency-4)';
    if (score >= 60) return 'var(--urgency-3)';
    if (score >= 40) return 'var(--urgency-2)';
    return 'var(--urgency-1)';
  };

  const handleDragStart = (task) => setDragItem(task);

  const handleDrop = async (newStatus) => {
    if (!dragItem) return;

    // Optimistically update local state
    setTaskData(prev => {
      const list = prev || fallbackTasks;
      return list.map(t =>
        t.id === dragItem.id ? { ...t, status: newStatus } : t
      );
    });

    // Persist to Firestore if we have a docId
    if (dragItem._docId) {
      try {
        const updateData = { status: newStatus };
        if (newStatus === 'Completed') {
          updateData.completedAt = new Date().toISOString();
        }
        if (newStatus === 'Assigned' || newStatus === 'In Progress') {
          updateData.assignedAt = updateData.assignedAt || new Date().toISOString();
        }
        await updateTask(dragItem._docId, updateData);
      } catch (err) {
        console.error('Failed to update task:', err);
      }
    }

    setDragItem(null);
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Stats */}
      <div className="task-stats">
        {columns.map(col => (
          <div className="task-stat-pill" key={col.key}>
            <span className="stat-dot" style={{ background: col.color }} />
            <span className="stat-key">{col.key}</span>
            <span className="stat-count">{grouped[col.key]?.length || 0}</span>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {columns.map(col => (
          <div
            className="kanban-column"
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
          >
            <div className="kanban-col-header">
              <span className="kanban-col-dot" style={{ background: col.color }} />
              <h3>{col.key}</h3>
              <span className="kanban-col-count">{grouped[col.key]?.length || 0}</span>
            </div>
            <div className="kanban-col-body">
              {(grouped[col.key] || []).map(task => {
                const need = getNeed(task.needId);
                const vol = getVol(task.volunteerId);
                return (
                  <div
                    className="kanban-card glass-card"
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                  >
                    <div className="kanban-card-top">
                      <span className="kanban-task-id">{task.id}</span>
                      {need && (
                        <span className="kanban-urgency" style={{ color: getUrgencyColor(need.urgencyScore) }}>
                          {need.urgencyScore}
                        </span>
                      )}
                    </div>
                    {need && <h4 className="kanban-title">{need.title}</h4>}
                    {need && (
                      <div className="kanban-meta">
                        <MapPin size={11} />
                        <span>{need.location.city}</span>
                      </div>
                    )}
                    {vol ? (
                      <div className="kanban-volunteer">
                        <div className="kanban-vol-avatar">{vol.avatar}</div>
                        <span>{vol.name}</span>
                      </div>
                    ) : (
                      <div className="kanban-no-vol">
                        <User size={12} />
                        <span>Unassigned</span>
                      </div>
                    )}
                    {task.notes && (
                      <p className="kanban-notes">{task.notes}</p>
                    )}
                    <div className="kanban-card-footer">
                      <Clock size={11} />
                      <span>{timeAgo(task.assignedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

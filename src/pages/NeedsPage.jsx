import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, MapPin, Clock, ChevronDown, ChevronUp, AlertTriangle, Trash2 } from 'lucide-react';
import { categoryColors, categories } from '../data/needs';
import { needs as fallbackNeeds } from '../data/needs';
import { subscribeToNeeds, deleteNeed, updateNeed } from '../firebase/services';
import '../components/Dashboard/Dashboard.css';
import './Pages.css';

export default function NeedsPage() {
  const [needs, setNeeds] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('urgencyScore');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedId, setExpandedId] = useState(null);

  // Subscribe to real-time Firestore data
  useEffect(() => {
    const unsub = subscribeToNeeds((data) => {
      setNeeds(data.length > 0 ? data : fallbackNeeds);
    });
    return unsub;
  }, []);

  const activeNeeds = needs || fallbackNeeds;

  const statuses = ['All', 'Open', 'Matched', 'Assigned', 'In Progress', 'Completed', 'Escalated', 'Cancelled'];

  const filtered = useMemo(() => {
    let result = [...activeNeeds];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(s) ||
        n.description.toLowerCase().includes(s) ||
        n.location.city.toLowerCase().includes(s) ||
        n.location.state.toLowerCase().includes(s)
      );
    }
    if (catFilter !== 'All') result = result.filter(n => n.category === catFilter);
    if (statusFilter !== 'All') result = result.filter(n => n.status === statusFilter);
    result.sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy];
      if (sortDir === 'asc') return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });
    return result;
  }, [search, catFilter, statusFilter, sortBy, sortDir, activeNeeds]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const getStatusBadge = (status) => {
    const map = { 'Open': 'badge-warning', 'Matched': 'badge-info', 'Assigned': 'badge-purple', 'In Progress': 'badge-info', 'Completed': 'badge-success', 'Escalated': 'badge-danger', 'Cancelled': 'badge-danger' };
    return map[status] || 'badge-info';
  };

  const getUrgencyColor = (u) => {
    const colors = { 1: 'var(--urgency-1)', 2: 'var(--urgency-2)', 3: 'var(--urgency-3)', 4: 'var(--urgency-4)', 5: 'var(--urgency-5)' };
    return colors[u] || 'var(--text-muted)';
  };

  const timeAgo = (d) => {
    const hrs = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleDelete = async (e, need) => {
    e.stopPropagation();
    if (!need._docId) return;
    if (confirm(`Delete "${need.title}"?`)) {
      await deleteNeed(need._docId);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Filters */}
      <div className="filters-bar glass-card">
        <div className="filter-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search needs by title, location..."
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <Filter size={14} />
            <select className="select-field" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <select className="select-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        <span>{filtered.length} needs found</span>
      </div>

      {/* Table */}
      <div className="glass-card table-card">
        <div className="table-scroll">
          <table className="data-table" id="needs-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('urgencyScore')} className="sortable-th">
                  Score {sortBy === 'urgencyScore' && (sortDir === 'desc' ? <ChevronDown size={12}/> : <ChevronUp size={12}/>)}
                </th>
                <th>Need</th>
                <th>Category</th>
                <th>Location</th>
                <th onClick={() => toggleSort('urgency')} className="sortable-th">
                  Urgency {sortBy === 'urgency' && (sortDir === 'desc' ? <ChevronDown size={12}/> : <ChevronUp size={12}/>)}
                </th>
                <th>Status</th>
                <th>Reported</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((need) => (
                <>
                  <tr key={need.id} onClick={() => setExpandedId(expandedId === need.id ? null : need.id)} className="clickable-row">
                    <td>
                      <div className="score-cell" style={{ color: getUrgencyColor(need.urgency) }}>
                        {need.urgencyScore}
                      </div>
                    </td>
                    <td>
                      <div className="need-title-cell">
                        <span className="need-id">{need.id}</span>
                        <span className="need-title">{need.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cat-tag" style={{ background: `${categoryColors[need.category]}20`, color: categoryColors[need.category] }}>
                        {need.category}
                      </span>
                    </td>
                    <td>
                      <div className="location-cell">
                        <MapPin size={12} />
                        <span>{need.location.city}, {need.location.state}</span>
                      </div>
                    </td>
                    <td>
                      <div className="urgency-dots">
                        {[1,2,3,4,5].map(i => (
                          <span key={i} className="urgency-dot" style={{ background: i <= need.urgency ? getUrgencyColor(need.urgency) : 'var(--border-color)' }} />
                        ))}
                      </div>
                    </td>
                    <td><span className={`badge ${getStatusBadge(need.status)}`}>{need.status}</span></td>
                    <td>
                      <div className="time-cell">
                        <Clock size={12} />
                        <span>{timeAgo(need.reportedAt)}</span>
                      </div>
                    </td>
                    <td>
                      {need._docId && (
                        <button className="icon-action-btn" onClick={(e) => handleDelete(e, need)} title="Delete need">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === need.id && (
                    <tr key={`${need.id}-detail`} className="detail-row">
                      <td colSpan={8}>
                        <div className="detail-content">
                          <p className="detail-desc">{need.description}</p>
                          <div className="detail-meta">
                            <span><strong>Reporter:</strong> {need.reportedBy}</span>
                            <span><strong>Frequency:</strong> {need.frequency} similar reports</span>
                            <span><strong>Contact:</strong> {need.reporterContact}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

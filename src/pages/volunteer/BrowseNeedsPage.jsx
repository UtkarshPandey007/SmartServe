import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToNeeds, selfAssignTask } from '../../firebase/services';
import { needs as fallbackNeeds, categoryColors, categories } from '../../data/needs';
import { MapPin, Search, Filter, Heart, Clock, AlertTriangle, Check } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './VolunteerPages.css';

export default function BrowseNeedsPage() {
  const { volunteerProfile } = useAuth();
  const [needs, setNeeds] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [assigningId, setAssigningId] = useState(null);
  const [assignedIds, setAssignedIds] = useState(new Set());

  useEffect(() => {
    const unsub = subscribeToNeeds((data) => {
      setNeeds(data.length > 0 ? data : fallbackNeeds);
    });
    return unsub;
  }, []);

  // Only show open/unassigned needs
  const openNeeds = needs.filter(n => ['Open', 'Matched'].includes(n.status));

  const filtered = openNeeds.filter(n => {
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.location.city.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || n.category === catFilter;
    return matchSearch && matchCat;
  }).sort((a, b) => b.urgencyScore - a.urgencyScore);

  const handleAssign = async (need) => {
    if (!volunteerProfile?.id) {
      alert('Your volunteer profile is not set up yet. Please contact a coordinator.');
      return;
    }
    setAssigningId(need.id);
    try {
      await selfAssignTask(volunteerProfile.id, need);
      setAssignedIds(prev => new Set([...prev, need.id]));
    } catch (err) {
      alert('Failed to self-assign: ' + err.message);
    } finally {
      setAssigningId(null);
    }
  };

  const getUrgencyColor = (score) => {
    if (score >= 90) return 'var(--urgency-5)';
    if (score >= 75) return 'var(--urgency-4)';
    if (score >= 60) return 'var(--urgency-3)';
    if (score >= 40) return 'var(--urgency-2)';
    return 'var(--urgency-1)';
  };

  const timeAgo = (d) => {
    if (!d) return '';
    const hrs = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Filters */}
      <div className="filters-bar glass-card">
        <div className="filter-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search needs by title, city..."
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
        </div>
      </div>

      <div className="browse-layout">
        {/* Map */}
        <div className="glass-card browse-map-card">
          <h3 className="browse-map-title">Needs Near You</h3>
          <div className="browse-map-wrap">
            <MapContainer
              center={[22.5, 79]}
              zoom={5}
              style={{ height: '100%', width: '100%', borderRadius: '10px' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {filtered.map(n => (
                <CircleMarker
                  key={n.id}
                  center={[n.location.lat, n.location.lng]}
                  radius={Math.max(6, n.urgencyScore / 10)}
                  fillColor={getUrgencyColor(n.urgencyScore)}
                  color="transparent"
                  fillOpacity={0.7}
                >
                  <Popup>
                    <div style={{ color: '#1e293b', minWidth: 160 }}>
                      <strong>{n.title}</strong><br />
                      <span style={{ fontSize: '0.8em' }}>{n.location.city} • Score: {n.urgencyScore}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Needs List */}
        <div className="browse-needs-list">
          <div className="browse-results-info">
            <span>{filtered.length} open needs available</span>
          </div>
          <div className="browse-cards stagger-children">
            {filtered.map(need => {
              const isAssigning = assigningId === need.id;
              const isAssigned = assignedIds.has(need.id);
              return (
                <div className="browse-card glass-card" key={need.id}>
                  <div className="browse-card-top">
                    <span className="browse-score" style={{ color: getUrgencyColor(need.urgencyScore) }}>
                      {need.urgencyScore}
                    </span>
                    <span className="cat-tag" style={{ background: `${categoryColors[need.category]}20`, color: categoryColors[need.category] }}>
                      {need.category}
                    </span>
                  </div>
                  <h4 className="browse-title">{need.title}</h4>
                  <p className="browse-desc">{need.description?.slice(0, 100)}...</p>
                  <div className="browse-meta">
                    <span><MapPin size={12} /> {need.location.city}, {need.location.state}</span>
                    <span><Clock size={12} /> {timeAgo(need.reportedAt)}</span>
                  </div>
                  <button
                    className={`btn-primary btn-sm browse-assign-btn ${isAssigned ? 'btn-assigned' : ''}`}
                    onClick={() => handleAssign(need)}
                    disabled={isAssigning || isAssigned}
                  >
                    {isAssigned ? (
                      <><Check size={14} /> <span>Assigned to you!</span></>
                    ) : isAssigning ? (
                      <span className="login-spinner" style={{ width: 14, height: 14 }} />
                    ) : (
                      <><Heart size={14} /> <span>I Can Help</span></>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

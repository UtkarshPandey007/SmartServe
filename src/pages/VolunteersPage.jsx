import { useState, useMemo, useEffect } from 'react';
import { Search, Star, MapPin, Clock, Award, Filter, ChevronRight, X, Zap, Check } from 'lucide-react';
import { volunteers as fallbackVolunteers, availabilityColors, availabilityLabels } from '../data/volunteers';
import { needs as fallbackNeeds, categoryColors } from '../data/needs';
import { subscribeToVolunteers, subscribeToNeeds, addTask, updateNeed } from '../firebase/services';
import './Pages.css';

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState(null);
  const [needs, setNeeds] = useState(null);
  const [search, setSearch] = useState('');
  const [availFilter, setAvailFilter] = useState('All');
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [showMatching, setShowMatching] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [assignedPairs, setAssignedPairs] = useState(new Set());

  // Subscribe to real-time data
  useEffect(() => {
    const unsubs = [];
    unsubs.push(subscribeToVolunteers((data) => {
      setVolunteers(data.length > 0 ? data : fallbackVolunteers);
    }));
    unsubs.push(subscribeToNeeds((data) => {
      setNeeds(data.length > 0 ? data : fallbackNeeds);
    }));
    return () => unsubs.forEach(u => u());
  }, []);

  const activeVolunteers = volunteers || fallbackVolunteers;
  const activeNeeds = needs || fallbackNeeds;

  const filtered = useMemo(() => {
    let result = [...activeVolunteers];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(v =>
        v.name.toLowerCase().includes(s) ||
        v.skills.some(sk => sk.toLowerCase().includes(s)) ||
        v.location.city.toLowerCase().includes(s)
      );
    }
    if (availFilter !== 'All') result = result.filter(v => v.availability === availFilter);
    return result;
  }, [search, availFilter, activeVolunteers]);

  // Matching engine
  const openNeeds = activeNeeds.filter(n => ['Open', 'Matched'].includes(n.status));

  const getMatchScore = (volunteer, need) => {
    // Skill match (40%)
    const skillMatch = volunteer.preferredCategories.includes(need.category) ? 40 : 10;
    // Proximity (25%) - simplified using same state = high, same region = medium
    const sameState = volunteer.location.state === need.location.state;
    const proximity = sameState ? 25 : Math.max(5, 25 - Math.floor(
      Math.sqrt(Math.pow(volunteer.location.lat - need.location.lat, 2) + Math.pow(volunteer.location.lng - need.location.lng, 2)) * 2
    ));
    // Availability (20%)
    const availability = volunteer.availability === 'available' ? 20 : 5;
    // Rating (15%)
    const rating = Math.floor((volunteer.rating / 5) * 15);
    return { total: skillMatch + proximity + availability + rating, skillMatch, proximity, availability, rating };
  };

  const matchResults = useMemo(() => {
    if (!selectedNeed) return [];
    return activeVolunteers
      .map(v => ({ ...v, match: getMatchScore(v, selectedNeed) }))
      .sort((a, b) => b.match.total - a.match.total)
      .slice(0, 3);
  }, [selectedNeed, activeVolunteers]);

  const handleAssign = async (volunteer) => {
    if (!selectedNeed) return;
    const pairKey = `${volunteer.id}-${selectedNeed.id}`;
    setAssigning(pairKey);
    try {
      // Create a task in Firestore
      await addTask({
        id: `T-${Date.now().toString(36).toUpperCase()}`,
        needId: selectedNeed.id,
        volunteerId: volunteer.id,
        status: 'Assigned',
        assignedAt: new Date().toISOString(),
        completedAt: null,
        notes: '',
      });

      // Update the need status to Assigned
      if (selectedNeed._docId) {
        await updateNeed(selectedNeed._docId, { status: 'Assigned' });
      }

      setAssignedPairs(prev => new Set([...prev, pairKey]));
    } catch (err) {
      console.error('Assignment failed:', err);
      alert('Failed to assign: ' + err.message);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Controls */}
      <div className="volunteers-controls">
        <div className="filters-bar glass-card">
          <div className="filter-search">
            <Search size={16} />
            <input type="text" placeholder="Search by name, skill, city..." className="input-field" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-group">
            <div className="filter-item">
              <Filter size={14} />
              <select className="select-field" value={availFilter} onChange={(e) => setAvailFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <button className="btn-primary" onClick={() => setShowMatching(!showMatching)}>
              <Zap size={16} /> <span>{showMatching ? 'Hide' : 'Show'} Matching Engine</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`volunteers-layout ${showMatching ? 'with-matching' : ''}`}>
        {/* Volunteer Grid */}
        <div className="volunteer-grid stagger-children">
          {filtered.map((v) => (
            <div className="volunteer-card glass-card" key={v.id}>
              <div className="vol-card-header">
                <div className="vol-avatar" style={{ background: v.availability === 'available' ? 'var(--accent-gradient)' : 'linear-gradient(135deg, #475569, #64748b)' }}>
                  {v.avatar}
                </div>
                <div className="vol-status-dot" style={{ background: availabilityColors[v.availability] }} title={availabilityLabels[v.availability]} />
              </div>
              <h4 className="vol-name">{v.name}</h4>
              <div className="vol-location">
                <MapPin size={12} />
                <span>{v.location.city}, {v.location.state}</span>
              </div>
              <div className="vol-rating">
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <span>{v.rating}</span>
                <span className="vol-tasks">• {v.tasksCompleted} tasks</span>
              </div>
              <div className="vol-skills">
                {v.skills.slice(0, 3).map(s => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
                {v.skills.length > 3 && <span className="skill-more">+{v.skills.length - 3}</span>}
              </div>
              <div className="vol-stats">
                <div className="vol-stat">
                  <span className="stat-val">{v.hoursContributed}</span>
                  <span className="stat-lbl">Hours</span>
                </div>
                <div className="vol-stat">
                  <span className="stat-val">{v.radius}km</span>
                  <span className="stat-lbl">Radius</span>
                </div>
                <div className="vol-stat">
                  <span className="stat-val">{v.availableDays.length}</span>
                  <span className="stat-lbl">Days/wk</span>
                </div>
              </div>
              {v.certifications.length > 0 && (
                <div className="vol-certs">
                  <Award size={12} />
                  <span>{v.certifications[0]}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Matching Engine Panel */}
        {showMatching && (
          <div className="matching-panel glass-card animate-slide-in">
            <div className="matching-header">
              <h3><Zap size={18} /> Smart Matching Engine</h3>
              <p>Select an open need to find the best volunteer match</p>
            </div>

            <div className="matching-needs-list">
              <label className="form-label">Select Need:</label>
              <div className="matching-needs-scroll">
                {openNeeds.slice(0, 8).map(n => (
                  <div
                    key={n.id}
                    className={`matching-need-item ${selectedNeed?.id === n.id ? 'selected' : ''}`}
                    onClick={() => setSelectedNeed(n)}
                  >
                    <span className="score-mini" style={{ color: n.urgencyScore >= 80 ? 'var(--urgency-5)' : 'var(--urgency-3)' }}>
                      {n.urgencyScore}
                    </span>
                    <div className="matching-need-info">
                      <span className="matching-need-title">{n.title}</span>
                      <span className="matching-need-loc">{n.location.city} • {n.category}</span>
                    </div>
                    <ChevronRight size={14} />
                  </div>
                ))}
              </div>
            </div>

            {selectedNeed && matchResults.length > 0 && (
              <div className="match-results animate-fade-in">
                <h4>Top 3 Matches for: <span className="gradient-text">{selectedNeed.title}</span></h4>
                {matchResults.map((v, i) => {
                  const pairKey = `${v.id}-${selectedNeed.id}`;
                  const isAssigned = assignedPairs.has(pairKey);
                  const isAssigningThis = assigning === pairKey;
                  return (
                    <div className="match-result-card" key={v.id}>
                      <div className="match-rank">#{i + 1}</div>
                      <div className="match-info">
                        <div className="match-name-row">
                          <span className="match-name">{v.name}</span>
                          <span className="match-total-score">{v.match.total}%</span>
                        </div>
                        <span className="match-city">{v.location.city}</span>
                        <div className="match-breakdown">
                          <div className="match-bar">
                            <span className="bar-label">Skill</span>
                            <div className="bar-track"><div className="bar-fill" style={{ width: `${(v.match.skillMatch / 40) * 100}%`, background: '#3b82f6' }} /></div>
                            <span className="bar-val">{v.match.skillMatch}/40</span>
                          </div>
                          <div className="match-bar">
                            <span className="bar-label">Proximity</span>
                            <div className="bar-track"><div className="bar-fill" style={{ width: `${(v.match.proximity / 25) * 100}%`, background: '#06b6d4' }} /></div>
                            <span className="bar-val">{v.match.proximity}/25</span>
                          </div>
                          <div className="match-bar">
                            <span className="bar-label">Available</span>
                            <div className="bar-track"><div className="bar-fill" style={{ width: `${(v.match.availability / 20) * 100}%`, background: '#10b981' }} /></div>
                            <span className="bar-val">{v.match.availability}/20</span>
                          </div>
                          <div className="match-bar">
                            <span className="bar-label">Rating</span>
                            <div className="bar-track"><div className="bar-fill" style={{ width: `${(v.match.rating / 15) * 100}%`, background: '#f59e0b' }} /></div>
                            <span className="bar-val">{v.match.rating}/15</span>
                          </div>
                        </div>
                        <button
                          className={`btn-primary btn-sm ${isAssigned ? 'btn-assigned' : ''}`}
                          onClick={() => handleAssign(v)}
                          disabled={isAssigningThis || isAssigned}
                        >
                          {isAssigned ? (
                            <><Check size={14} /> <span>Assigned!</span></>
                          ) : isAssigningThis ? (
                            <span className="login-spinner" style={{ width: 14, height: 14 }} />
                          ) : (
                            <span>Assign Volunteer</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

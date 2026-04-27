import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateVolunteerProfile, subscribeToTasksByVolunteer } from '../../firebase/services';
import { User, MapPin, Star, Award, Clock, CheckCircle2, Save, Edit3 } from 'lucide-react';
import './VolunteerPages.css';

const allSkills = [
  'First Aid', 'Teaching', 'Construction', 'Cooking', 'Driving',
  'Counseling', 'Medical', 'IT Support', 'Translation', 'Logistics',
  'Childcare', 'Plumbing', 'Agriculture', 'Legal Aid', 'Finance',
];

const allCategories = [
  'Healthcare', 'Education', 'Water & Sanitation', 'Food Security',
  'Shelter', 'Elder Care', 'Disability Support', 'Disaster Relief',
];

const availabilityOptions = [
  { value: 'available', label: 'Available', color: 'var(--status-success)' },
  { value: 'busy', label: 'Busy', color: 'var(--status-warning)' },
  { value: 'unavailable', label: 'Unavailable', color: 'var(--status-danger)' },
];

export default function MyProfilePage() {
  const { user, volunteerProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const volId = volunteerProfile?.id;

  useEffect(() => {
    if (volunteerProfile) {
      setProfile({ ...volunteerProfile });
    }
  }, [volunteerProfile]);

  // Subscribe to tasks for real-time stats
  useEffect(() => {
    if (!volId) return;
    const unsub = subscribeToTasksByVolunteer(volId, setMyTasks);
    return () => unsub();
  }, [volId]);

  // Compute stats from live task data (same source of truth as dashboard)
  const completedTasks = myTasks.filter(t => t.status === 'Completed');
  const totalTasksDone = completedTasks.length;
  const totalHours = completedTasks.reduce((sum, t) => sum + (t.hoursLogged || 0), 0);

  const handleSave = async () => {
    if (!profile?._docId) return;
    setSaving(true);
    try {
      await updateVolunteerProfile(profile._docId, {
        name: profile.name,
        phone: profile.phone,
        skills: profile.skills,
        preferredCategories: profile.preferredCategories,
        availability: profile.availability,
        radius: profile.radius,
        location: profile.location,
      });
      setEditing(false);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill) => {
    setProfile(p => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter(s => s !== skill) : [...p.skills, skill]
    }));
  };

  const toggleCategory = (cat) => {
    setProfile(p => ({
      ...p,
      preferredCategories: p.preferredCategories.includes(cat)
        ? p.preferredCategories.filter(c => c !== cat)
        : [...p.preferredCategories, cat]
    }));
  };

  if (!profile) {
    return (
      <div className="page-container">
        <div className="vol-empty glass-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="profile-layout">
        {/* Profile Card */}
        <div className="glass-card profile-hero">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" />
              ) : (
                <span>{profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
              )}
            </div>
            <div className="profile-availability-dot" style={{
              background: availabilityOptions.find(a => a.value === profile.availability)?.color
            }} />
          </div>
          <h2 className="profile-name">{profile.name}</h2>
          <p className="profile-email">{user?.email}</p>

          <div className="profile-stats-row">
            <div className="profile-stat">
              <Star size={16} color="#f59e0b" />
              <span className="ps-val">{profile.rating || '—'}</span>
              <span className="ps-label">Rating</span>
            </div>
            <div className="profile-stat">
              <CheckCircle2 size={16} color="var(--status-success)" />
              <span className="ps-val">{totalTasksDone}</span>
              <span className="ps-label">Tasks</span>
            </div>
            <div className="profile-stat">
              <Clock size={16} color="var(--accent-primary)" />
              <span className="ps-val">{totalHours}</span>
              <span className="ps-label">Hours</span>
            </div>
          </div>

          <div className="profile-location">
            <MapPin size={14} />
            <span>{profile.location?.city}, {profile.location?.state}</span>
            <span className="profile-radius">• {profile.radius}km radius</span>
          </div>

          {!editing ? (
            <button className="btn-primary profile-edit-btn" onClick={() => setEditing(true)}>
              <Edit3 size={14} /> <span>Edit Profile</span>
            </button>
          ) : (
            <button className="btn-primary profile-edit-btn btn-success" onClick={handleSave} disabled={saving}>
              {saving ? <span className="login-spinner" style={{ width: 14, height: 14 }} /> : <><Save size={14} /> <span>Save Changes</span></>}
            </button>
          )}
        </div>

        {/* Editable Details */}
        <div className="glass-card profile-details">
          <h3>Profile Details</h3>

          {editing ? (
            <div className="profile-form">
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input className="input-field" value={profile.name || ''} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="input-field" value={profile.location?.city || ''} onChange={e => setProfile(p => ({ ...p, location: { ...p.location, city: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input className="input-field" value={profile.location?.state || ''} onChange={e => setProfile(p => ({ ...p, location: { ...p.location, state: e.target.value } }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Service Radius (km)</label>
                <input className="input-field" type="number" value={profile.radius || 25} onChange={e => setProfile(p => ({ ...p, radius: parseInt(e.target.value) || 25 }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Availability</label>
                <div className="availability-btns">
                  {availabilityOptions.map(opt => (
                    <button
                      key={opt.value}
                      className={`avail-btn ${profile.availability === opt.value ? 'active' : ''}`}
                      style={profile.availability === opt.value ? { borderColor: opt.color, color: opt.color } : {}}
                      onClick={() => setProfile(p => ({ ...p, availability: opt.value }))}
                    >
                      <span className="avail-dot" style={{ background: opt.color }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Skills</label>
                <div className="chip-grid">
                  {allSkills.map(s => (
                    <button key={s} type="button" className={`chip ${profile.skills?.includes(s) ? 'chip-active' : ''}`} onClick={() => toggleSkill(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Categories</label>
                <div className="chip-grid">
                  {allCategories.map(c => (
                    <button key={c} type="button" className={`chip ${profile.preferredCategories?.includes(c) ? 'chip-active' : ''}`} onClick={() => toggleCategory(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="profile-view">
              <div className="pv-section">
                <h4>Skills</h4>
                <div className="chip-grid">
                  {(profile.skills || []).map(s => (
                    <span key={s} className="chip chip-active">{s}</span>
                  ))}
                  {(!profile.skills || profile.skills.length === 0) && <span className="text-muted">No skills set</span>}
                </div>
              </div>
              <div className="pv-section">
                <h4>Preferred Categories</h4>
                <div className="chip-grid">
                  {(profile.preferredCategories || []).map(c => (
                    <span key={c} className="chip chip-active">{c}</span>
                  ))}
                  {(!profile.preferredCategories || profile.preferredCategories.length === 0) && <span className="text-muted">No preferences set</span>}
                </div>
              </div>
              <div className="pv-section">
                <h4>Certifications</h4>
                <div className="cert-list">
                  {(profile.certifications || []).map(c => (
                    <div key={c} className="cert-badge"><Award size={14} /> {c}</div>
                  ))}
                  {(!profile.certifications || profile.certifications.length === 0) && <span className="text-muted">None yet</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

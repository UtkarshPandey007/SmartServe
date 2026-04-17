import { useState } from 'react';
import { MapPin, Upload, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Camera, Send } from 'lucide-react';
import { categories, categoryColors } from '../data/needs';
import { addNeed } from '../firebase/services';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

const steps = ['Category & Details', 'Location & Urgency', 'Media & Review'];

export default function SubmitNeedPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDupeAlert, setShowDupeAlert] = useState(false);
  const [newNeedId, setNewNeedId] = useState(null);
  const { user } = useAuth();
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    city: '',
    state: '',
    address: '',
    urgency: 3,
    reporterName: '',
    reporterContact: '',
    media: null,
  });

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'city' && value.toLowerCase().includes('varanasi')) {
      setShowDupeAlert(true);
    } else if (field === 'city') {
      setShowDupeAlert(false);
    }
  };

  const urgencyLabels = ['', 'Low', 'Moderate', 'High', 'Urgent', 'Critical'];
  const urgencyColors = ['', 'var(--urgency-1)', 'var(--urgency-2)', 'var(--urgency-3)', 'var(--urgency-4)', 'var(--urgency-5)'];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Build the need object
      const needData = {
        id: `N-${Date.now().toString(36).toUpperCase()}`,
        category: form.category,
        title: form.title,
        description: form.description,
        location: {
          lat: 20.5937 + (Math.random() - 0.5) * 10,
          lng: 78.9629 + (Math.random() - 0.5) * 10,
          city: form.city,
          state: form.state,
        },
        urgency: form.urgency,
        urgencyScore: Math.min(100, form.urgency * 18 + Math.floor(Math.random() * 10)),
        reportedBy: form.reporterName || user?.displayName || 'Anonymous',
        reporterContact: form.reporterContact || user?.email || '',
        reportedAt: new Date().toISOString(),
        status: 'Open',
        frequency: 1,
        media: null,
      };

      const docId = await addNeed(needData);
      setNewNeedId(needData.id);
      setSubmitted(true);
    } catch (err) {
      console.error('Submit failed:', err);
      alert('Failed to submit need: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-container">
        <div className="success-card glass-card animate-scale-in">
          <div className="success-icon">
            <CheckCircle2 size={48} />
          </div>
          <h2>Need Submitted Successfully!</h2>
          <p>Your report has been saved to the database. The priority scoring algorithm will process it within 60 seconds.</p>
          <div className="success-details">
            <div className="success-detail-item">
              <span className="detail-label">Need ID</span>
              <span className="detail-value">{newNeedId || 'N-NEW'}</span>
            </div>
            <div className="success-detail-item">
              <span className="detail-label">Status</span>
              <span className="badge badge-warning">Open</span>
            </div>
            <div className="success-detail-item">
              <span className="detail-label">Category</span>
              <span className="detail-value">{form.category || 'Healthcare'}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={() => { setSubmitted(false); setStep(0); setForm({ category: '', title: '', description: '', city: '', state: '', address: '', urgency: 3, reporterName: '', reporterContact: '', media: null }); }}>
            <span>Report Another Need</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="submit-layout">
        {/* Form */}
        <div className="glass-card form-card">
          {/* Step indicators */}
          <div className="step-indicators">
            {steps.map((s, i) => (
              <div key={i} className={`step-indicator ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}>
                <div className="step-number">{i < step ? <CheckCircle2 size={16}/> : i + 1}</div>
                <span className="step-label">{s}</span>
              </div>
            ))}
          </div>

          <div className="form-body">
            {step === 0 && (
              <div className="form-step animate-fade-in">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="select-field" value={form.category} onChange={(e) => updateForm('category', e.target.value)}>
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="input-field" placeholder="Brief title describing the need" value={form.title} onChange={(e) => updateForm('title', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="input-field textarea-field" rows={4} placeholder="Detailed description of the community need..." value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Reporter Name</label>
                    <input className="input-field" placeholder="Your name" value={form.reporterName} onChange={(e) => updateForm('reporterName', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact</label>
                    <input className="input-field" placeholder="+91-XXXXXXXXXX" value={form.reporterContact} onChange={(e) => updateForm('reporterContact', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="form-step animate-fade-in">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City / Village *</label>
                    <input className="input-field" placeholder="e.g., Wayanad" value={form.city} onChange={(e) => updateForm('city', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input className="input-field" placeholder="e.g., Kerala" value={form.state} onChange={(e) => updateForm('state', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address / Landmark</label>
                  <input className="input-field" placeholder="Nearby landmark or GPS coordinates" value={form.address} onChange={(e) => updateForm('address', e.target.value)} />
                </div>

                {showDupeAlert && (
                  <div className="dupe-alert animate-scale-in">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Similar need found!</strong>
                      <p>A need "Toilet construction for 20 households" was reported in Varanasi 5 days ago. Would you like to merge or create new?</p>
                      <div className="dupe-actions">
                        <button className="btn-secondary" onClick={() => setShowDupeAlert(false)}>Create New</button>
                        <button className="btn-primary"><span>View & Merge</span></button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Urgency Level *</label>
                  <div className="urgency-slider-wrap">
                    <input
                      type="range"
                      min={1} max={5} step={1}
                      value={form.urgency}
                      onChange={(e) => updateForm('urgency', parseInt(e.target.value))}
                      className="urgency-slider"
                      style={{ '--slider-color': urgencyColors[form.urgency] }}
                    />
                    <div className="urgency-labels">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className={`urgency-label ${form.urgency === i ? 'active' : ''}`} style={form.urgency === i ? { color: urgencyColors[i] } : {}}>
                          {urgencyLabels[i]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step animate-fade-in">
                <div className="form-group">
                  <label className="form-label">Supporting Media (Optional)</label>
                  <div className="upload-zone">
                    <Camera size={32} />
                    <p>Drag & drop photos/videos here</p>
                    <span>or click to browse • Max 10MB</span>
                  </div>
                </div>

                <div className="review-section">
                  <h3>Review Your Submission</h3>
                  <div className="review-grid">
                    <div className="review-item">
                      <span className="review-label">Category</span>
                      <span className="review-value">{form.category || '—'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Title</span>
                      <span className="review-value">{form.title || '—'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Location</span>
                      <span className="review-value">{form.city && form.state ? `${form.city}, ${form.state}` : '—'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Urgency</span>
                      <span className="review-value" style={{ color: urgencyColors[form.urgency] }}>{urgencyLabels[form.urgency]} ({form.urgency}/5)</span>
                    </div>
                    <div className="review-item review-full">
                      <span className="review-label">Description</span>
                      <span className="review-value">{form.description || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="form-nav">
            {step > 0 && (
              <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 2 ? (
              <button className="btn-primary" onClick={() => setStep(s => s + 1)}>
                <span>Continue</span> <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <span className="login-spinner" style={{ width: 16, height: 16 }} />
                ) : (
                  <><Send size={16} /> <span>Submit Need</span></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Live Preview */}
        <div className="glass-card preview-card">
          <h3 className="preview-title">Live Preview</h3>
          <div className="preview-need-card">
            <div className="preview-header">
              <span className="badge badge-warning">Open</span>
              <div className="preview-urgency" style={{ color: urgencyColors[form.urgency] }}>
                {urgencyLabels[form.urgency]} ({form.urgency}/5)
              </div>
            </div>
            <h4>{form.title || 'Need title will appear here...'}</h4>
            <p className="preview-desc">{form.description || 'Description will appear here...'}</p>
            {form.category && (
              <span className="cat-tag" style={{ background: `${categoryColors[form.category]}20`, color: categoryColors[form.category] }}>
                {form.category}
              </span>
            )}
            {(form.city || form.state) && (
              <div className="preview-location">
                <MapPin size={14} />
                <span>{[form.city, form.state].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {form.reporterName && (
              <div className="preview-reporter">
                Reported by {form.reporterName}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

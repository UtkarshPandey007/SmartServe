import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, User, Eye, EyeOff, Zap, AlertCircle, MapPin, Briefcase, Heart, Shield, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import './LoginPage.css';

const skillOptions = [
  'First Aid', 'Teaching', 'Construction', 'Cooking', 'Driving',
  'Counseling', 'Medical', 'IT Support', 'Translation', 'Logistics',
  'Childcare', 'Plumbing', 'Agriculture', 'Legal Aid', 'Finance',
];

const categoryOptions = [
  'Healthcare', 'Education', 'Water & Sanitation', 'Food Security',
  'Shelter', 'Elder Care', 'Disability Support', 'Disaster Relief',
];

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('coordinator');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Volunteer-specific fields
  const [volCity, setVolCity] = useState('');
  const [volState, setVolState] = useState('');
  const [volSkills, setVolSkills] = useState([]);
  const [volCategories, setVolCategories] = useState([]);

  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const toggleSkill = (skill) => {
    setVolSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleCategory = (cat) => {
    setVolCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        const volunteerData = role === 'volunteer' ? {
          city: volCity,
          state: volState,
          skills: volSkills,
          categories: volCategories,
        } : null;
        await signup(email, password, name, role, volunteerData);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      const messages = {
        'auth/invalid-credential': 'Invalid email or password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/weak-password': 'Password must be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
        'auth/user-not-found': 'No account found with this email',
      };
      setError(messages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      const messages = {
        'auth/invalid-email': 'Please enter a valid email address',
        'auth/user-not-found': 'No account found with this email',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
      };
      setError(messages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(isSignup ? role : undefined);
      navigate('/dashboard');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchToForgotPassword = () => {
    setIsForgotPassword(true);
    setError('');
    setResetSent(false);
  };

  const switchToLogin = () => {
    setIsForgotPassword(false);
    setIsSignup(false);
    setError('');
    setResetSent(false);
  };

  return (
    <div className="login-page">
      {/* Animated background shapes */}
      <div className="login-bg">
        <div className="bg-shape shape-1" />
        <div className="bg-shape shape-2" />
        <div className="bg-shape shape-3" />
      </div>

      <div className="login-container">
        {/* Brand */}
        <div className="login-brand">
          <div className="brand-icon">
            <Zap size={28} />
          </div>
          <h1>SmartServe</h1>
          <p>Data-Driven Volunteer Coordination</p>
        </div>

        {/* Card */}
        <div className="login-card glass-card">
          {/* ===== FORGOT PASSWORD MODE ===== */}
          {isForgotPassword ? (
            <>
              <h2>Reset Password</h2>
              <p className="login-subtitle">
                {resetSent
                  ? 'Check your inbox for the reset link'
                  : 'Enter your email to receive a password reset link'}
              </p>

              {error && (
                <div className="login-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {resetSent ? (
                <div className="reset-success animate-fade-in">
                  <div className="reset-success-icon">
                    <CheckCircle2 size={40} />
                  </div>
                  <p className="reset-success-text">
                    We've sent a password reset link to <strong>{email}</strong>. 
                    Please check your email and follow the instructions.
                  </p>
                  <p className="reset-success-hint">
                    Didn't receive it? Check your spam folder or try again.
                  </p>
                  <button
                    className="btn-primary login-btn"
                    onClick={switchToLogin}
                    id="back-to-login-btn"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="login-form">
                  <div className="login-field">
                    <Mail size={16} className="field-icon" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-field"
                      id="reset-email"
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="btn-primary login-btn" disabled={loading} id="send-reset-btn">
                    {loading ? (
                      <span className="login-spinner" />
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {!resetSent && (
                <p className="login-switch" style={{ marginTop: 20 }}>
                  Remember your password?{' '}
                  <button type="button" onClick={switchToLogin}>
                    Sign In
                  </button>
                </p>
              )}
            </>
          ) : (
            <>
              {/* ===== NORMAL LOGIN / SIGNUP MODE ===== */}
              <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
              <p className="login-subtitle">
                {isSignup ? 'Join the volunteer coordination platform' : 'Sign in to your dashboard'}
              </p>

              {error && (
                <div className="login-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                {/* Role selector — only on signup */}
                {isSignup && (
                  <div className="role-selector">
                    <button
                      type="button"
                      className={`role-btn ${role === 'coordinator' ? 'active' : ''}`}
                      onClick={() => setRole('coordinator')}
                    >
                      <Shield size={18} />
                      <div>
                        <span className="role-title">Coordinator</span>
                        <span className="role-desc">Manage needs & assign volunteers</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`role-btn ${role === 'volunteer' ? 'active' : ''}`}
                      onClick={() => setRole('volunteer')}
                    >
                      <Heart size={18} />
                      <div>
                        <span className="role-title">Volunteer</span>
                        <span className="role-desc">Help with community needs</span>
                      </div>
                    </button>
                  </div>
                )}

                {isSignup && (
                  <div className="login-field">
                    <User size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="input-field"
                      id="signup-name"
                    />
                  </div>
                )}
                <div className="login-field">
                  <Mail size={16} className="field-icon" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field"
                    id="login-email"
                  />
                </div>
                <div className="login-field">
                  <Lock size={16} className="field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input-field"
                    id="login-password"
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Forgot password link — only on login */}
                {!isSignup && (
                  <div className="forgot-password-row">
                    <button
                      type="button"
                      className="forgot-password-link"
                      onClick={switchToForgotPassword}
                      id="forgot-password-btn"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Volunteer extra fields */}
                {isSignup && role === 'volunteer' && (
                  <div className="vol-signup-fields animate-fade-in">
                    <div className="login-field-row">
                      <div className="login-field">
                        <MapPin size={16} className="field-icon" />
                        <input
                          type="text"
                          placeholder="City"
                          value={volCity}
                          onChange={(e) => setVolCity(e.target.value)}
                          required
                          className="input-field"
                        />
                      </div>
                      <div className="login-field">
                        <input
                          type="text"
                          placeholder="State"
                          value={volState}
                          onChange={(e) => setVolState(e.target.value)}
                          required
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div className="vol-field-group">
                      <label className="vol-field-label"><Briefcase size={13} /> Your Skills</label>
                      <div className="chip-grid">
                        {skillOptions.map(s => (
                          <button
                            key={s}
                            type="button"
                            className={`chip ${volSkills.includes(s) ? 'chip-active' : ''}`}
                            onClick={() => toggleSkill(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="vol-field-group">
                      <label className="vol-field-label"><Heart size={13} /> Preferred Categories</label>
                      <div className="chip-grid">
                        {categoryOptions.map(c => (
                          <button
                            key={c}
                            type="button"
                            className={`chip ${volCategories.includes(c) ? 'chip-active' : ''}`}
                            onClick={() => toggleCategory(c)}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-primary login-btn" disabled={loading} id="login-submit">
                  {loading ? (
                    <span className="login-spinner" />
                  ) : (
                    <>
                      <LogIn size={16} />
                      <span>{isSignup ? 'Create Account' : 'Sign In'}</span>
                    </>
                  )}
                </button>
              </form>

              <div className="login-divider">
                <span>or</span>
              </div>

              <button className="google-btn" onClick={handleGoogle} disabled={loading} id="google-signin">
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <p className="login-switch">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button type="button" onClick={() => { setIsSignup(!isSignup); setError(''); }}>
                  {isSignup ? 'Sign In' : 'Create one'}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="login-footer">
          Built for GDG Solution Challenge 2026
        </p>
      </div>
    </div>
  );
}

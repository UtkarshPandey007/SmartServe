import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PlusCircle, Users, ClipboardList,
  BarChart3, Zap, Shield, Heart, Search, User, MapPinned
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const coordinatorNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/needs', label: 'Needs', icon: FileText },
  { path: '/submit', label: 'Report Need', icon: PlusCircle },
  { path: '/volunteers', label: 'Volunteers', icon: Users },
  { path: '/tasks', label: 'Tasks', icon: ClipboardList },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

const volunteerNav = [
  { path: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { path: '/my-tasks', label: 'My Tasks', icon: ClipboardList },
  { path: '/browse', label: 'Browse Needs', icon: MapPinned },
  { path: '/profile', label: 'My Profile', icon: User },
];

export default function Sidebar() {
  const location = useLocation();
  const { isVolunteer } = useAuth();
  const navItems = isVolunteer ? volunteerNav : coordinatorNav;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Zap size={22} />
          </div>
          <div className="logo-text">
            <h1>VolunteerIQ</h1>
            <span className="logo-tagline">
              {isVolunteer ? 'Volunteer Portal' : 'Smart Coordination'}
            </span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-label">
            {isVolunteer ? 'Volunteer Menu' : 'Main Menu'}
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-item-icon">
                  <Icon size={18} />
                </div>
                <span className="nav-item-label">{item.label}</span>
                {isActive && <div className="nav-active-indicator" />}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-card">
          {isVolunteer ? <Heart size={16} /> : <Shield size={16} />}
          <div>
            <span className="footer-card-title">Cloud Catalyst</span>
            <span className="footer-card-sub">v1.0 • GDG Hackathon</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

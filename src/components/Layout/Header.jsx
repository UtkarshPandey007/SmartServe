import { useLocation } from 'react-router-dom';
import { Bell, Search, User, LogOut, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { seedDatabase } from '../../firebase/seed';
import { isDatabaseSeeded } from '../../firebase/services';
import { useState } from 'react';
import './Header.css';

const pageTitles = {
  '/dashboard': { title: 'Priority Dashboard', sub: 'Real-time community intelligence overview' },
  '/needs': { title: 'Community Needs', sub: 'Manage and track all reported needs' },
  '/submit': { title: 'Report a Need', sub: 'Submit a new community need for prioritization' },
  '/volunteers': { title: 'Volunteer Hub', sub: 'Profiles, matching engine & deployment' },
  '/tasks': { title: 'Task Tracker', sub: 'Real-time task lifecycle management' },
  '/reports': { title: 'Impact Reports', sub: 'Analytics, leaderboard & exportable reports' },
  // Volunteer pages
  '/my-tasks': { title: 'My Tasks', sub: 'Tasks assigned to you — accept, track & complete' },
  '/browse': { title: 'Browse Needs', sub: 'Find open community needs you can help with' },
  '/profile': { title: 'My Profile', sub: 'Manage your skills, availability & preferences' },
};

export default function Header() {
  const location = useLocation();
  const { user, userProfile, logout } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const pageInfo = pageTitles[location.pathname] || {
    title: userProfile?.role === 'volunteer' ? 'My Dashboard' : 'VolunteerIQ',
    sub: userProfile?.role === 'volunteer' ? 'Your personal volunteering overview' : '',
  };

  const roleLabel = userProfile?.role === 'volunteer' ? 'Volunteer' : 'Coordinator';

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const alreadySeeded = await isDatabaseSeeded();
      if (alreadySeeded) {
        setSeedDone(true);
        alert('Database already has data! No need to seed again.');
      } else {
        await seedDatabase();
        setSeedDone(true);
        alert('✅ Database seeded successfully! Refresh the page to see live data.');
      }
    } catch (err) {
      alert('❌ Seeding failed: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div>
          <h2 className="header-title">{pageInfo.title}</h2>
          <p className="header-sub">{pageInfo.sub}</p>
        </div>
      </div>

      <div className="header-right">
        <div className="header-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search needs, volunteers..."
            className="search-input"
          />
        </div>

        {!seedDone && (
          <button
            className="header-icon-btn seed-btn"
            onClick={handleSeed}
            disabled={seeding}
            title="Seed database with sample data"
            id="seed-database-btn"
          >
            <Database size={18} />
            {seeding && <span className="seed-spinner" />}
          </button>
        )}

        <button className="header-icon-btn" id="notifications-btn">
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>

        <div className="header-user">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="user-avatar-img" />
          ) : (
            <div className="user-avatar">
              {initials}
            </div>
          )}
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{roleLabel}</span>
          </div>
        </div>

        <button className="header-icon-btn logout-btn" onClick={logout} title="Sign out" id="logout-btn">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

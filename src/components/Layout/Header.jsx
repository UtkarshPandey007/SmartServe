import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut, Database, Settings, ChevronDown, X, FileText, Users, ClipboardList, MapPin, AlertTriangle, CheckCircle2, UserPlus, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { seedDatabase } from '../../firebase/seed';
import { isDatabaseSeeded, subscribeToNeeds, subscribeToVolunteers, subscribeToTasks } from '../../firebase/services';
import { needs as fallbackNeeds } from '../../data/needs';
import { volunteers as fallbackVolunteers } from '../../data/volunteers';
import { tasks as fallbackTasks } from '../../data/tasks';
import { useState, useEffect, useRef, useMemo } from 'react';
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

// Helper: generate notifications from live data
function generateNotifications(needs, volunteers, tasks, isVolunteer) {
  const notifications = [];
  const now = Date.now();

  // Urgent needs (score >= 90)
  needs
    .filter(n => n.urgencyScore >= 90 && n.status === 'Open')
    .slice(0, 3)
    .forEach(n => {
      notifications.push({
        id: `urgent-${n.id}`,
        type: 'urgent',
        icon: AlertTriangle,
        iconColor: '#ef4444',
        title: 'Urgent need reported',
        message: n.title,
        sub: `${n.location?.city} • Score: ${n.urgencyScore}`,
        time: n.reportedAt,
        link: '/needs',
      });
    });

  // Recently completed tasks
  tasks
    .filter(t => t.status === 'Completed' && t.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 3)
    .forEach(t => {
      const need = needs.find(n => n.id === t.needId);
      notifications.push({
        id: `completed-${t.id}`,
        type: 'success',
        icon: CheckCircle2,
        iconColor: '#10b981',
        title: 'Task completed',
        message: need?.title || t.needId,
        sub: t.id,
        time: t.completedAt,
        link: isVolunteer ? '/my-tasks' : '/tasks',
      });
    });

  // Recently assigned tasks
  tasks
    .filter(t => t.status === 'Assigned' && t.assignedAt)
    .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt))
    .slice(0, 3)
    .forEach(t => {
      const vol = volunteers.find(v => v.id === t.volunteerId);
      const need = needs.find(n => n.id === t.needId);
      notifications.push({
        id: `assigned-${t.id}`,
        type: 'info',
        icon: UserPlus,
        iconColor: '#8b5cf6',
        title: isVolunteer ? 'New task assigned to you' : `Volunteer ${vol?.name || 'Unknown'} assigned`,
        message: need?.title || t.needId,
        sub: t.id,
        time: t.assignedAt,
        link: isVolunteer ? '/my-tasks' : '/tasks',
      });
    });

  // In-progress tasks
  tasks
    .filter(t => t.status === 'In Progress')
    .slice(0, 2)
    .forEach(t => {
      const need = needs.find(n => n.id === t.needId);
      notifications.push({
        id: `progress-${t.id}`,
        type: 'info',
        icon: Clock,
        iconColor: '#06b6d4',
        title: 'Task in progress',
        message: need?.title || t.needId,
        sub: t.id,
        time: t.assignedAt,
        link: isVolunteer ? '/my-tasks' : '/tasks',
      });
    });

  // Sort by time (most recent first) and limit
  return notifications
    .sort((a, b) => {
      const ta = a.time ? new Date(a.time).getTime() : 0;
      const tb = b.time ? new Date(b.time).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 10);
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, logout, isVolunteer } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [needs, setNeeds] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const searchRef = useRef(null);

  // Profile dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('smartserve_dismissed_notifs') || '[]'));
    } catch { return new Set(); }
  });
  const notifRef = useRef(null);

  const pageInfo = pageTitles[location.pathname] || {
    title: userProfile?.role === 'volunteer' ? 'My Dashboard' : 'SmartServe',
    sub: userProfile?.role === 'volunteer' ? 'Your personal volunteering overview' : '',
  };

  const roleLabel = userProfile?.role === 'volunteer' ? 'Volunteer' : 'Coordinator';
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Subscribe to data for search + notifications
  useEffect(() => {
    const unsubs = [];
    unsubs.push(subscribeToNeeds((data) => setNeeds(data.length > 0 ? data : fallbackNeeds)));
    unsubs.push(subscribeToVolunteers((data) => setVolunteers(data.length > 0 ? data : fallbackVolunteers)));
    unsubs.push(subscribeToTasks((data) => setTasks(data.length > 0 ? data : fallbackTasks)));
    return () => unsubs.forEach(u => u());
  }, []);

  // Generate notifications from live data
  const notifications = useMemo(
    () => generateNotifications(needs, volunteers, tasks, isVolunteer),
    [needs, volunteers, tasks, isVolunteer]
  );

  const unreadCount = notifications.filter(n => !dismissedIds.has(n.id)).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleDismissNotif = (id, e) => {
    e.stopPropagation();
    const updated = new Set([...dismissedIds, id]);
    setDismissedIds(updated);
    localStorage.setItem('smartserve_dismissed_notifs', JSON.stringify([...updated]));
  };

  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setDismissedIds(allIds);
    localStorage.setItem('smartserve_dismissed_notifs', JSON.stringify([...allIds]));
  };

  const handleNotifClick = (notif) => {
    navigate(notif.link);
    setShowNotifications(false);
    // Mark as read
    const updated = new Set([...dismissedIds, notif.id]);
    setDismissedIds(updated);
    localStorage.setItem('smartserve_dismissed_notifs', JSON.stringify([...updated]));
  };

  // Search filtering
  const getSearchResults = () => {
    if (!searchQuery.trim()) return { needs: [], volunteers: [], tasks: [] };
    const q = searchQuery.toLowerCase();

    const matchedNeeds = needs
      .filter(n =>
        n.title?.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.location?.city?.toLowerCase().includes(q) ||
        n.location?.state?.toLowerCase().includes(q) ||
        n.category?.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const matchedVolunteers = volunteers
      .filter(v =>
        v.name?.toLowerCase().includes(q) ||
        v.location?.city?.toLowerCase().includes(q) ||
        v.skills?.some(s => s.toLowerCase().includes(q))
      )
      .slice(0, 5);

    const matchedTasks = tasks
      .filter(t =>
        t.id?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q) ||
        t.needId?.toLowerCase().includes(q)
      )
      .slice(0, 5);

    return { needs: matchedNeeds, volunteers: matchedVolunteers, tasks: matchedTasks };
  };

  const searchResults = getSearchResults();
  const hasResults = searchResults.needs.length > 0 || searchResults.volunteers.length > 0 || searchResults.tasks.length > 0;

  const handleSearchInput = (e) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(true);
  };

  const handleSearchResultClick = (type) => {
    if (type === 'need') navigate('/needs');
    else if (type === 'volunteer') navigate('/volunteers');
    else if (type === 'task') navigate('/tasks');
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

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

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleProfileNav = (path) => {
    navigate(path);
    setShowProfileMenu(false);
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
        {/* Global Search */}
        <div className="header-search" ref={searchRef}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search needs, volunteers..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearchInput}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            id="global-search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={clearSearch} title="Clear search">
              <X size={14} />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.trim() && (
            <div className="search-results-dropdown glass-card animate-fade-in">
              {!hasResults ? (
                <div className="search-empty">
                  <Search size={18} />
                  <span>No results for "{searchQuery}"</span>
                </div>
              ) : (
                <>
                  {searchResults.needs.length > 0 && (
                    <div className="search-category">
                      <div className="search-category-label">
                        <FileText size={13} />
                        <span>Needs</span>
                      </div>
                      {searchResults.needs.map(n => (
                        <button
                          key={n.id}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick('need')}
                        >
                          <div className="search-result-main">
                            <span className="search-result-title">{n.title}</span>
                            <span className="search-result-meta">
                              <MapPin size={11} /> {n.location?.city} • {n.category}
                            </span>
                          </div>
                          <span className="search-result-badge">{n.status}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.volunteers.length > 0 && (
                    <div className="search-category">
                      <div className="search-category-label">
                        <Users size={13} />
                        <span>Volunteers</span>
                      </div>
                      {searchResults.volunteers.map(v => (
                        <button
                          key={v.id}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick('volunteer')}
                        >
                          <div className="search-result-main">
                            <span className="search-result-title">{v.name}</span>
                            <span className="search-result-meta">
                              <MapPin size={11} /> {v.location?.city} • {v.skills?.slice(0, 2).join(', ')}
                            </span>
                          </div>
                          <span className="search-result-badge" style={{ textTransform: 'capitalize' }}>{v.availability}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.tasks.length > 0 && (
                    <div className="search-category">
                      <div className="search-category-label">
                        <ClipboardList size={13} />
                        <span>Tasks</span>
                      </div>
                      {searchResults.tasks.map(t => (
                        <button
                          key={t.id}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick('task')}
                        >
                          <div className="search-result-main">
                            <span className="search-result-title">{t.id}</span>
                            <span className="search-result-meta">Need: {t.needId}</span>
                          </div>
                          <span className="search-result-badge">{t.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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

        {/* Notifications */}
        <div className="notif-wrapper" ref={notifRef}>
          <button
            className="header-icon-btn"
            id="notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notif-dropdown glass-card animate-fade-in">
              <div className="notif-dropdown-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-dropdown-body">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={24} />
                    <span>No notifications yet</span>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const Icon = notif.icon;
                    const isRead = dismissedIds.has(notif.id);
                    return (
                      <div
                        key={notif.id}
                        className={`notif-item ${isRead ? 'notif-read' : ''}`}
                        onClick={() => handleNotifClick(notif)}
                      >
                        <div className="notif-icon" style={{ color: notif.iconColor, background: `${notif.iconColor}15` }}>
                          <Icon size={16} />
                        </div>
                        <div className="notif-content">
                          <span className="notif-title">{notif.title}</span>
                          <span className="notif-message">{notif.message}</span>
                          <span className="notif-time">{timeAgo(notif.time)}</span>
                        </div>
                        {!isRead && (
                          <button
                            className="notif-dismiss"
                            onClick={(e) => handleDismissNotif(notif.id, e)}
                            title="Dismiss"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Area with Dropdown */}
        <div className="header-user-wrapper" ref={profileRef}>
          <div className="header-user" onClick={handleProfileClick} id="profile-trigger">
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
            <ChevronDown size={14} className={`profile-chevron ${showProfileMenu ? 'rotated' : ''}`} />
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="profile-dropdown glass-card animate-fade-in">
              <div className="profile-dropdown-header">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="dropdown-avatar-img" />
                ) : (
                  <div className="dropdown-avatar">
                    {initials}
                  </div>
                )}
                <div className="dropdown-user-info">
                  <span className="dropdown-user-name">{displayName}</span>
                  <span className="dropdown-user-email">{user?.email}</span>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              <button
                className="profile-dropdown-item"
                onClick={() => handleProfileNav(isVolunteer ? '/profile' : '/dashboard')}
                id="dropdown-profile-btn"
              >
                <User size={16} />
                <span>{isVolunteer ? 'My Profile' : 'Dashboard'}</span>
              </button>

              <button
                className="profile-dropdown-item"
                onClick={() => handleProfileNav(isVolunteer ? '/my-tasks' : '/tasks')}
                id="dropdown-tasks-btn"
              >
                <ClipboardList size={16} />
                <span>{isVolunteer ? 'My Tasks' : 'Task Tracker'}</span>
              </button>

              <button
                className="profile-dropdown-item"
                onClick={() => handleProfileNav(isVolunteer ? '/browse' : '/reports')}
                id="dropdown-browse-btn"
              >
                <Settings size={16} />
                <span>{isVolunteer ? 'Browse Needs' : 'Reports'}</span>
              </button>

              <div className="profile-dropdown-divider" />

              <button
                className="profile-dropdown-item profile-dropdown-danger"
                onClick={() => { logout(); setShowProfileMenu(false); }}
                id="dropdown-logout-btn"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        <button className="header-icon-btn logout-btn" onClick={logout} title="Sign out" id="logout-btn">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

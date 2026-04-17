// Auto-seeder component: checks if Firestore is empty and seeds on first load
import { useState, useEffect } from 'react';
import { isDatabaseSeeded } from '../firebase/services';
import { seedDatabase } from '../firebase/seed';
import { useAuth } from '../context/AuthContext';
import { Database, CheckCircle2, Loader } from 'lucide-react';

export default function AutoSeeder({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('checking'); // checking | seeding | done | error

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function checkAndSeed() {
      try {
        setStatus('checking');
        const seeded = await isDatabaseSeeded();

        if (cancelled) return;

        if (seeded) {
          setStatus('done');
        } else {
          setStatus('seeding');
          await seedDatabase();
          if (!cancelled) setStatus('done');
        }
      } catch (err) {
        console.error('Auto-seed error:', err);
        if (!cancelled) {
          // If seeding fails (e.g. permissions), just continue with fallback data
          setStatus('done');
        }
      }
    }

    checkAndSeed();
    return () => { cancelled = true; };
  }, [user]);

  // Show seeding progress overlay
  if (status === 'checking' || status === 'seeding') {
    return (
      <div className="seed-overlay">
        <div className="seed-card glass-card">
          <div className="seed-icon-wrap">
            <Database size={32} className="seed-icon-spin" />
          </div>
          <h3>{status === 'checking' ? 'Checking database...' : 'Setting up your database...'}</h3>
          <p>
            {status === 'checking'
              ? 'Verifying if sample data exists'
              : 'Populating 35 needs, 20 volunteers, 25 tasks & analytics'}
          </p>
          <div className="seed-progress">
            <div className="seed-progress-bar" />
          </div>
        </div>
      </div>
    );
  }

  return children;
}

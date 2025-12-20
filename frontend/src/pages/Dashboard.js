import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { dashboardAPI } from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getActivity()
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h1 style={styles.logo}>🛡️ TenantGuard</h1>
        <div style={styles.navRight}>
          <span style={styles.userName}>{user?.profile?.fullName || user?.email}</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={styles.content}>
        <h2 style={styles.welcome}>Welcome back, {user?.profile?.fullName}!</h2>
        
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📄</div>
            <div style={styles.statValue}>{stats?.documents || 0}</div>
            <div style={styles.statLabel}>Documents</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💾</div>
            <div style={styles.statValue}>{stats?.storage || '0 MB'}</div>
            <div style={styles.statLabel}>Storage Used</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🔗</div>
            <div style={styles.statValue}>{stats?.shared || 0}</div>
            <div style={styles.statLabel}>Shared Links</div>
          </div>
        </div>

        <div style={styles.activitySection}>
          <h3 style={styles.sectionTitle}>Recent Activity</h3>
          {activity.length > 0 ? (
            <div style={styles.activityList}>
              {activity.map((item, index) => (
                <div key={index} style={styles.activityItem}>
                  <span style={styles.activityIcon}>{item.icon}</span>
                  <div style={styles.activityContent}>
                    <div style={styles.activityMessage}>{item.message}</div>
                    <div style={styles.activityTime}>
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.noActivity}>No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  navbar: {
    background: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logo: {
    margin: 0,
    color: '#667eea',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userName: {
    color: '#666',
  },
  logoutBtn: {
    padding: '0.5rem 1rem',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  },
  welcome: {
    marginBottom: '2rem',
    color: '#333',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    background: 'white',
    padding: '2rem',
    borderRadius: '10px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statIcon: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '0.5rem',
  },
  statLabel: {
    color: '#666',
    fontSize: '0.9rem',
  },
  activitySection: {
    background: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    marginBottom: '1rem',
    color: '#333',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: '#f9f9f9',
    borderRadius: '5px',
  },
  activityIcon: {
    fontSize: '1.5rem',
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    color: '#333',
    marginBottom: '0.25rem',
  },
  activityTime: {
    color: '#999',
    fontSize: '0.85rem',
  },
  noActivity: {
    textAlign: 'center',
    color: '#999',
    padding: '2rem',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.5rem',
    color: '#667eea',
  },
};

export default Dashboard;
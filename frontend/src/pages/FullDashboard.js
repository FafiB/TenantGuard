import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { dashboardAPI, documentsAPI, usersAPI } from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');
      
      // Load stats
      let statsRes, docsRes, usersRes;
      
      try {
        statsRes = await dashboardAPI.getStats();
        console.log('Stats loaded:', statsRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Stats failed:', error);
        setStats({});
      }
      
      try {
        docsRes = await documentsAPI.getDocuments();
        console.log('Documents loaded:', docsRes.data);
        setDocuments(docsRes.data);
      } catch (error) {
        console.error('Documents failed:', error);
        setDocuments([]);
      }
      
      try {
        usersRes = await usersAPI.getUsers();
        console.log('Users loaded:', usersRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.error('Users failed:', error);
        setUsers([]);
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadFile.name);
    formData.append('description', 'Uploaded document');

    try {
      await documentsAPI.uploadDocument(formData);
      setUploadFile(null);
      loadDashboardData();
      alert('Document uploaded successfully!');
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return;

    try {
      await documentsAPI.deleteDocument(docId);
      loadDashboardData();
      alert('Document deleted!');
    } catch (error) {
      alert('Delete failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DocumentsTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.uploadSection}>
        <h3>Upload Document</h3>
        <form onSubmit={handleFileUpload} style={styles.uploadForm}>
          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files[0])}
            style={styles.fileInput}
            required
          />
          <button type="submit" disabled={loading || !uploadFile} style={styles.uploadBtn}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      <div style={styles.searchSection}>
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.documentsGrid}>
        {filteredDocuments.map(doc => (
          <div key={doc._id} style={styles.documentCard}>
            <h4>{doc.title}</h4>
            <p>{doc.description}</p>
            <p>Size: {(doc.fileSize / 1024).toFixed(2)} KB</p>
            <p>Type: {doc.fileType}</p>
            <div style={styles.cardActions}>
              <button 
                onClick={() => window.open(`http://localhost:5000/api/documents/${doc._id}/download`, '_blank')}
                style={styles.viewBtn}
              >
                View
              </button>
              <button 
                onClick={() => handleDeleteDocument(doc._id)}
                style={styles.deleteBtn}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AdminPanel = () => (
    <div style={styles.tabContent}>
      <h3>Admin Panel</h3>
      <div style={styles.adminSection}>
        <div style={styles.adminCard}>
          <h4>System Statistics</h4>
          <p>Total Users: {users.length}</p>
          <p>Total Documents: {documents.length}</p>
          <p>System Storage: {stats.storage || '0 MB'}</p>
        </div>
        
        <div style={styles.adminCard}>
          <h4>User Management</h4>
          <button style={styles.adminBtn}>Create User</button>
          <button style={styles.adminBtn}>Bulk Operations</button>
          <button style={styles.adminBtn}>Export Data</button>
        </div>
        
        <div style={styles.adminCard}>
          <h4>System Settings</h4>
          <button style={styles.adminBtn}>Security Settings</button>
          <button style={styles.adminBtn}>Backup System</button>
          <button style={styles.adminBtn}>Audit Logs</button>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div style={styles.tabContent}>
      <h3>Users Management</h3>
      <div style={styles.usersGrid}>
        {users.map(user => (
          <div key={user._id} style={styles.userCard}>
            <h4>{user.profile?.fullName || 'No Name'}</h4>
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>
            <p>Tenant: {user.tenantId?.name || 'Unknown'}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const PaymentTab = () => (
    <div style={styles.tabContent}>
      <h3>Payment & Billing</h3>
      <div style={styles.paymentSection}>
        <div style={styles.planCard}>
          <h4>Current Plan: Free Trial</h4>
          <p>Days remaining: 14</p>
          <p>Storage used: {stats.storage || '0 MB'}</p>
          <button style={styles.upgradeBtn}>Upgrade Plan</button>
        </div>
        
        <div style={styles.billingForm}>
          <h4>Payment Information</h4>
          <input type="text" placeholder="Card Number" style={styles.input} />
          <input type="text" placeholder="Expiry Date" style={styles.input} />
          <input type="text" placeholder="CVV" style={styles.input} />
          <button style={styles.payBtn}>Save Payment Info</button>
        </div>
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div style={styles.tabContent}>
      <h3>Analytics Dashboard</h3>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h4>Total Documents</h4>
          <p style={styles.statNumber}>{documents.length}</p>
        </div>
        <div style={styles.statCard}>
          <h4>Storage Used</h4>
          <p style={styles.statNumber}>{stats.storage || '0 MB'}</p>
        </div>
        <div style={styles.statCard}>
          <h4>Total Users</h4>
          <p style={styles.statNumber}>{users.length}</p>
        </div>
        <div style={styles.statCard}>
          <h4>Shared Documents</h4>
          <p style={styles.statNumber}>{stats.shared || 0}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>TenantGuard Dashboard</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.profile?.fullName || user?.email} ({user?.role})</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <nav style={styles.nav}>
        {['documents', 'users', 'analytics', 'payment', ...(user?.role === 'admin' ? ['admin'] : [])].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.navBtn,
              ...(activeTab === tab ? styles.activeNavBtn : {})
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'payment' && <PaymentTab />}
        {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  header: {
    background: '#667eea',
    color: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoutBtn: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  nav: {
    background: 'white',
    padding: '0 2rem',
    display: 'flex',
    gap: '1rem',
    borderBottom: '1px solid #ddd',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    padding: '1rem',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
  },
  activeNavBtn: {
    borderBottomColor: '#667eea',
    color: '#667eea',
  },
  main: {
    padding: '2rem',
  },
  tabContent: {
    background: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  uploadSection: {
    marginBottom: '2rem',
    padding: '1rem',
    border: '2px dashed #ddd',
    borderRadius: '10px',
  },
  uploadForm: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  fileInput: {
    flex: 1,
    padding: '0.5rem',
  },
  uploadBtn: {
    background: '#27ae60',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  searchSection: {
    marginBottom: '2rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '1rem',
  },
  documentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  documentCard: {
    border: '1px solid #ddd',
    borderRadius: '10px',
    padding: '1rem',
    background: '#f9f9f9',
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  viewBtn: {
    background: '#3498db',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  deleteBtn: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  usersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
  },
  userCard: {
    border: '1px solid #ddd',
    borderRadius: '10px',
    padding: '1rem',
    background: '#f9f9f9',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  statCard: {
    background: '#667eea',
    color: 'white',
    padding: '1.5rem',
    borderRadius: '10px',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '0.5rem 0',
  },
  paymentSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
  },
  planCard: {
    border: '1px solid #ddd',
    borderRadius: '10px',
    padding: '1.5rem',
    background: '#f9f9f9',
  },
  billingForm: {
    border: '1px solid #ddd',
    borderRadius: '10px',
    padding: '1.5rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '5px',
    marginBottom: '1rem',
  },
  upgradeBtn: {
    background: '#f39c12',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
  },
  payBtn: {
    background: '#27ae60',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
  },
  adminSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  adminCard: {
    border: '1px solid #ddd',
    borderRadius: '10px',
    padding: '1.5rem',
    background: '#f9f9f9',
  },
  adminBtn: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    margin: '0.25rem',
    width: '100%',
  },
};

export default Dashboard;
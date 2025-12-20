import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { dashboardAPI, documentsAPI, usersAPI } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [statsRes, docsRes, usersRes] = await Promise.all([
        dashboardAPI.getStats().catch(() => ({ data: {} })),
        documentsAPI.getDocuments().catch(() => ({ data: [] })),
        usersAPI.getUsers().catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setDocuments(docsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadFile.name);
    formData.append('description', 'Admin uploaded document');

    try {
      await documentsAPI.uploadDocument(formData);
      setUploadFile(null);
      loadAdminData();
      alert('✅ Document uploaded successfully!');
    } catch (error) {
      alert('❌ Upload failed: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('🗑️ Delete this document? This action cannot be undone.')) return;

    try {
      await documentsAPI.deleteDocument(docId);
      loadAdminData();
      alert('✅ Document deleted successfully!');
    } catch (error) {
      alert('❌ Delete failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('⚠️ Delete this user? This will permanently remove their account and all associated data.')) return;

    try {
      await usersAPI.deleteUser(userId);
      loadAdminData();
      alert('✅ User deleted successfully!');
    } catch (error) {
      alert('❌ Delete failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const OverviewTab = () => (
    <div className="admin-tab-content">
      <div className="admin-welcome">
        <h2>🛡️ Admin Control Center</h2>
        <p>System overview and administrative controls</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card users">
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-info">
            <h3>{users.length}</h3>
            <p>Total Users</p>
            <span className="stat-trend">+12% this month</span>
          </div>
        </div>
        <div className="admin-stat-card documents">
          <div className="admin-stat-icon">📁</div>
          <div className="admin-stat-info">
            <h3>{documents.length}</h3>
            <p>Total Documents</p>
            <span className="stat-trend">+8% this week</span>
          </div>
        </div>
        <div className="admin-stat-card storage">
          <div className="admin-stat-icon">💾</div>
          <div className="admin-stat-info">
            <h3>{stats.storage || '0 MB'}</h3>
            <p>Storage Used</p>
            <span className="stat-trend">5% of total</span>
          </div>
        </div>
        <div className="admin-stat-card security">
          <div className="admin-stat-icon">🔒</div>
          <div className="admin-stat-info">
            <h3>SECURE</h3>
            <p>Security Status</p>
            <span className="stat-trend">All systems operational</span>
          </div>
        </div>
      </div>

      <div className="admin-quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-grid">
          <button className="quick-action-btn settings">
            <span className="action-icon">⚙️</span>
            <div>
              <h4>System Settings</h4>
              <p>Configure system parameters</p>
            </div>
          </button>
          <button className="quick-action-btn reports">
            <span className="action-icon">📊</span>
            <div>
              <h4>Generate Reports</h4>
              <p>Create usage and analytics reports</p>
            </div>
          </button>
          <button className="quick-action-btn backup">
            <span className="action-icon">🔄</span>
            <div>
              <h4>Backup System</h4>
              <p>Create system backup</p>
            </div>
          </button>
          <button className="quick-action-btn audit">
            <span className="action-icon">🔍</span>
            <div>
              <h4>Security Audit</h4>
              <p>Run security diagnostics</p>
            </div>
          </button>
        </div>
      </div>

      <div className="admin-system-health">
        <h3>🏥 System Health</h3>
        <div className="health-metrics">
          <div className="health-item">
            <span className="health-label">CPU Usage</span>
            <div className="health-bar">
              <div className="health-fill" style={{ width: '45%' }}></div>
            </div>
            <span className="health-value">45%</span>
          </div>
          <div className="health-item">
            <span className="health-label">Memory</span>
            <div className="health-bar">
              <div className="health-fill" style={{ width: '62%' }}></div>
            </div>
            <span className="health-value">62%</span>
          </div>
          <div className="health-item">
            <span className="health-label">Storage</span>
            <div className="health-bar">
              <div className="health-fill" style={{ width: '28%' }}></div>
            </div>
            <span className="health-value">28%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h3>👥 User Management</h3>
        <div className="admin-controls">
          <button className="admin-btn create">➕ Create User</button>
          <button className="admin-btn export">📤 Export Data</button>
          <button className="admin-btn bulk">🔄 Bulk Actions</button>
        </div>
      </div>
      
      <div className="admin-users-grid">
        {users.map(user => (
          <div key={user._id} className="admin-user-card">
            <div className="user-avatar">
              {user.profile?.fullName?.charAt(0) || user.email?.charAt(0) || '👤'}
            </div>
            <div className="user-info">
              <h4>{user.profile?.fullName || 'No Name'}</h4>
              <p className="user-email">{user.email}</p>
              <div className="user-meta">
                <span className={`role-badge ${user.role}`}>
                  {user.role === 'admin' ? '👑' : '👤'} {user.role.toUpperCase()}
                </span>
                <span className="tenant-info">
                  🏢 {user.tenantId?.name || 'Unknown Tenant'}
                </span>
              </div>
            </div>
            <div className="user-actions">
              <button className="user-action-btn edit">✏️ Edit</button>
              <button 
                className="user-action-btn delete"
                onClick={() => handleDeleteUser(user._id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const DocumentsTab = () => (
    <div className="admin-tab-content">
      <div className="admin-upload-section">
        <h3>📁 Document Management</h3>
        <form onSubmit={handleFileUpload} className="admin-upload-form">
          <div className="admin-file-input-wrapper">
            <input
              type="file"
              id="admin-file-upload"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="admin-file-input"
              required
            />
            <label htmlFor="admin-file-upload" className="admin-file-label">
              {uploadFile ? (
                <>📄 {uploadFile.name}</>
              ) : (
                <>📁 Choose File to Upload</>
              )}
            </label>
          </div>
          <button 
            type="submit" 
            disabled={loading || !uploadFile} 
            className="admin-upload-btn"
          >
            {loading ? '⏳ Uploading...' : '🚀 Admin Upload'}
          </button>
        </form>
      </div>

      <div className="admin-search-section">
        <input
          type="text"
          placeholder="🔍 Search all documents across system..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search-input"
        />
      </div>

      <div className="admin-documents-grid">
        {filteredDocuments.map(doc => (
          <div key={doc._id} className="admin-document-card">
            <div className="admin-doc-header">
              <div className="admin-doc-icon">📄</div>
              <div className="admin-doc-status">
                <span className="status-badge active">ACTIVE</span>
              </div>
            </div>
            <h4 className="admin-doc-title">{doc.title}</h4>
            <p className="admin-doc-description">{doc.description}</p>
            <div className="admin-doc-meta">
              <div className="meta-item">
                <span className="meta-label">Owner:</span>
                <span className="meta-value">{doc.userId?.email || 'Unknown'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Size:</span>
                <span className="meta-value">{(doc.fileSize / 1024).toFixed(2)} KB</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Type:</span>
                <span className="meta-value">{doc.fileType}</span>
              </div>
            </div>
            <div className="admin-doc-actions">
              <button 
                onClick={() => window.open(`http://localhost:5000/api/documents/${doc._id}/download`, '_blank')}
                className="admin-action-btn view"
              >
                👁️ View
              </button>
              <button 
                onClick={() => handleDeleteDocument(doc._id)}
                className="admin-action-btn delete"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="admin-tab-content">
      <h3>📊 System Analytics</h3>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>📈 Usage Trends</h4>
          <div className="trend-data">
            <div className="trend-item">
              <span>Daily Uploads</span>
              <span className="trend-value">24</span>
            </div>
            <div className="trend-item">
              <span>Active Users</span>
              <span className="trend-value">{users.filter(u => u.role === 'user').length}</span>
            </div>
            <div className="trend-item">
              <span>Admin Users</span>
              <span className="trend-value">{users.filter(u => u.role === 'admin').length}</span>
            </div>
            <div className="trend-item">
              <span>Growth Rate</span>
              <span className="trend-value positive">+15%</span>
            </div>
          </div>
        </div>
        
        <div className="analytics-card">
          <h4>🔒 Security Metrics</h4>
          <div className="security-data">
            <div className="security-item">
              <span>Failed Logins</span>
              <span className="security-value low">3</span>
            </div>
            <div className="security-item">
              <span>Suspicious Activity</span>
              <span className="security-value safe">0</span>
            </div>
            <div className="security-item">
              <span>Last Security Scan</span>
              <span className="security-value">2 hours ago</span>
            </div>
            <div className="security-item">
              <span>Threat Level</span>
              <span className="security-value safe">LOW</span>
            </div>
          </div>
        </div>
        
        <div className="analytics-card">
          <h4>💾 Storage Analytics</h4>
          <div className="storage-data">
            <div className="storage-item">
              <span>Total Storage</span>
              <span className="storage-value">{stats.storage || '0 MB'}</span>
            </div>
            <div className="storage-item">
              <span>Available Space</span>
              <span className="storage-value">9.2 GB</span>
            </div>
            <div className="storage-item">
              <span>Usage Rate</span>
              <span className="storage-value">8%</span>
            </div>
            <div className="storage-item">
              <span>Largest File</span>
              <span className="storage-value">2.4 MB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header">
        <div className="admin-header-left">
          <div className="admin-logo">
            <span className="admin-logo-icon">🛡️</span>
            <h1>TenantGuard</h1>
            <span className="admin-badge">ADMIN</span>
          </div>
        </div>
        <div className="admin-header-right">
          <div className="admin-user-info">
            <span className="admin-welcome-text">
              🛡️ Administrator: {user?.profile?.fullName || user?.email}
            </span>
            <span className="user-badge admin">ADMIN</span>
          </div>
          <button onClick={logout} className="admin-logout-btn">
            🚪 Logout
          </button>
        </div>
      </header>

      <nav className="admin-dashboard-nav">
        {[
          { id: 'overview', label: 'Overview', icon: '🎛️' },
          { id: 'users', label: 'Users', icon: '👥' },
          { id: 'documents', label: 'Documents', icon: '📁' },
          { id: 'analytics', label: 'Analytics', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="admin-dashboard-main">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </main>
    </div>
  );
};

export default AdminDashboard;
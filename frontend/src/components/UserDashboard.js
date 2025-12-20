import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { dashboardAPI, documentsAPI, profileAPI, paymentAPI } from '../services/api';
import './Dashboard.css';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [statsRes, docsRes] = await Promise.all([
        dashboardAPI.getStats().catch(() => ({ data: {} })),
        documentsAPI.getDocuments().catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setDocuments(docsRes.data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    console.log('Upload triggered:', { uploadFile, loading });
    
    if (!uploadFile) {
      alert('❌ Please select a file first!');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadFile.name);
    formData.append('description', 'User uploaded document');
    
    console.log('FormData created:', {
      fileName: uploadFile.name,
      fileSize: uploadFile.size,
      fileType: uploadFile.type
    });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      console.log('Starting upload...');
      const response = await documentsAPI.uploadDocument(formData);
      console.log('Upload response:', response.data);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadFile(null);
        setUploadProgress(0);
        loadUserData();
        alert(`✅ Document uploaded successfully!\nTransaction ID: ${response.data.document?._id}\nServer Path: ${response.data.serverPath}`);
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(0);
      alert(`❌ Upload failed: ${error.response?.data?.error || error.message}\nDetails: ${error.response?.data?.details || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('🗑️ Are you sure you want to delete this document?')) return;

    try {
      await documentsAPI.deleteDocument(docId);
      loadUserData();
      alert('✅ Document deleted successfully!');
    } catch (error) {
      alert('❌ Delete failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleViewDocument = async (docId) => {
    try {
      const response = await documentsAPI.viewDocument(docId);
      const { document, content, contentType, fileStats, systemInfo } = response.data;
      
      // Create a modal or new window to display content
      const viewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
      
      let displayContent = '';
      
      if (contentType === 'image') {
        displayContent = `<img src="${content}" style="max-width: 100%; height: auto;" />`;
      } else if (contentType === 'application/pdf') {
        displayContent = `<embed src="data:application/pdf;base64,${content}" width="100%" height="500px" type="application/pdf">`;
      } else if (contentType === 'text/plain') {
        displayContent = `<pre style="white-space: pre-wrap; font-family: monospace; padding: 20px; background: #f5f5f5; border-radius: 5px;">${content}</pre>`;
      } else if (contentType === 'binary/hex') {
        displayContent = `
          <div style="padding: 20px; background: #f0f0f0; border-radius: 5px;">
            <h3>Binary File (Hex View)</h3>
            <pre style="font-family: monospace; font-size: 12px; line-height: 1.4; max-height: 400px; overflow-y: auto;">${content.match(/.{1,32}/g)?.join('\n') || content}</pre>
          </div>
        `;
      }
      
      viewWindow.document.write(`
        <html>
          <head>
            <title>View: ${document.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #fff; }
              .header { background: #667eea; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin-bottom: 20px; color: #856404; }
              .system-info { background: #e9ecef; padding: 10px; border-radius: 5px; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>📄 ${document.title}</h2>
              <p>File: ${document.originalName} | Size: ${(document.fileSize / 1024).toFixed(2)} KB | Type: ${document.fileType}</p>
            </div>
            
            <div class="warning">
              ⚠️ <strong>Security Warning:</strong> This file viewer has no security restrictions and may expose sensitive data.
            </div>
            
            <div class="info">
              <strong>Description:</strong> ${document.description || 'No description'}<br>
              <strong>Owner:</strong> ${document.owner?.email || 'Unknown'}<br>
              <strong>Created:</strong> ${new Date(document.createdAt).toLocaleString()}<br>
              <strong>File Path:</strong> <code>${fileStats.fullPath}</code>
            </div>
            
            <div style="border: 1px solid #ddd; border-radius: 5px; padding: 20px; background: white;">
              ${displayContent}
            </div>
            
            <div class="system-info">
              <strong>System Info:</strong> ${systemInfo.platform} | Node: ${systemInfo.nodeVersion} | Working Dir: ${systemInfo.workingDirectory}
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
              <button onclick="window.close()" style="background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                💫 Close Viewer
              </button>
            </div>
          </body>
        </html>
      `);
      
      viewWindow.document.close();
      
    } catch (error) {
      alert(`❌ Failed to view document: ${error.response?.data?.error || error.message}\n\nDetails: ${error.response?.data?.stack || 'Unknown error'}`);
    }
  };

  const handleDownloadDocument = async (docId, filename) => {
    try {
      const response = await documentsAPI.downloadDocument(docId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('❌ Download failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const OverviewTab = () => (
    <div className="tab-content">
      <div className="welcome-section">
        <h2>👋 Welcome back, {user?.profile?.fullName || user?.email}!</h2>
        <p>Here's what's happening with your documents today.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📁</div>
          <div className="stat-info">
            <h3>{documents.length}</h3>
            <p>Total Documents</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">💾</div>
          <div className="stat-info">
            <h3>{stats.storage || '0 MB'}</h3>
            <p>Storage Used</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">🔗</div>
          <div className="stat-info">
            <h3>{stats.shared || 0}</h3>
            <p>Shared Files</p>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>14</h3>
            <p>Trial Days Left</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>📊 Recent Activity</h3>
        <div className="activity-list">
          {documents.slice(0, 5).map(doc => (
            <div key={doc._id} className="activity-item">
              <div className="activity-icon">📄</div>
              <div className="activity-info">
                <p><strong>{doc.title}</strong> was uploaded</p>
                <span className="activity-time">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DocumentsTab = () => (
    <div className="tab-content">
      <div className="upload-section">
        <h3>📤 Upload New Document</h3>
        <form onSubmit={handleFileUpload} className="upload-form">
          <div className="file-input-wrapper">
            <input
              type="file"
              id="file-upload"
              onChange={(e) => {
                const file = e.target.files[0];
                console.log('File selected:', file);
                setUploadFile(file);
              }}
              className="file-input"
              accept="*/*"
            />
            <label htmlFor="file-upload" className="file-label">
              {uploadFile ? (
                <>📄 {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)</>
              ) : (
                <>📁 Choose Any File (No Restrictions)</>
              )}
            </label>
          </div>
          
          {uploadProgress > 0 && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading} 
            className="upload-btn"
          >
            {loading ? '⏳ Uploading...' : uploadFile ? `🚀 Upload ${uploadFile.name}` : '📁 Select File First'}
          </button>
        </form>
      </div>

      <div className="search-section">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="🔍 Search your documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="documents-grid">
        {filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No documents found</h3>
            <p>Upload your first document to get started!</p>
          </div>
        ) : (
          filteredDocuments.map(doc => (
            <div key={doc._id} className="document-card">
              <div className="doc-header">
                <div className="doc-icon">📄</div>
                <div className="doc-menu">⋮</div>
              </div>
              <h4 className="doc-title">{doc.title}</h4>
              <p className="doc-description">{doc.description}</p>
              <div className="doc-meta">
                <span className="doc-size">📊 {(doc.fileSize / 1024).toFixed(2)} KB</span>
                <span className="doc-type">📋 {doc.fileType}</span>
              </div>
              <div className="doc-actions">
                <button 
                  onClick={() => handleViewDocument(doc._id)}
                  className="action-btn view"
                >
                  👁️ View
                </button>
                <button 
                  onClick={() => handleDownloadDocument(doc._id, doc.originalName)}
                  className="action-btn download"
                >
                  💾 Download
                </button>
                <button 
                  onClick={() => handleDeleteDocument(doc._id)}
                  className="action-btn delete"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const ProfileTab = () => {
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({
      fullName: user?.profile?.fullName || '',
      bio: user?.profile?.bio || '',
      phone: user?.profile?.phone || '',
      address: user?.profile?.address || ''
    });
    const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    const handleProfileUpdate = async (e) => {
      e.preventDefault();
      try {
        await profileAPI.updateProfile(profileData);
        setEditMode(false);
        alert('✅ Profile updated successfully!');
        // Update local user data
        const updatedUser = { ...user, profile: { ...user.profile, ...profileData } };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        alert('❌ Update failed: ' + (error.response?.data?.error || 'Unknown error'));
      }
    };

    const handlePasswordChange = async (e) => {
      e.preventDefault();
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert('❌ New passwords do not match!');
        return;
      }
      try {
        await profileAPI.changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        alert('✅ Password changed successfully!');
      } catch (error) {
        alert('❌ Password change failed: ' + (error.response?.data?.error || 'Unknown error'));
      }
    };

    return (
      <div className="tab-content">
        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {user?.profile?.fullName?.charAt(0) || user?.email?.charAt(0) || '👤'}
              </div>
            </div>
            <div className="profile-info">
              <h2>{user?.profile?.fullName || 'User'}</h2>
              <p className="profile-email">{user?.email}</p>
              <span className="profile-badge user">USER</span>
            </div>
          </div>

          <div className="profile-cards">
            <div className="profile-card">
              <h3>👤 Personal Information</h3>
              {editMode ? (
                <form onSubmit={handleProfileUpdate} className="edit-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      className="form-input"
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn">💾 Save Changes</button>
                    <button type="button" onClick={() => setEditMode(false)} className="cancel-btn">❌ Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Full Name</label>
                      <span>{user?.profile?.fullName || 'Not set'}</span>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <span>{user?.email}</span>
                    </div>
                    <div className="info-item">
                      <label>Bio</label>
                      <span>{user?.profile?.bio || 'Not set'}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <span>{user?.profile?.phone || 'Not set'}</span>
                    </div>
                    <div className="info-item">
                      <label>Address</label>
                      <span>{user?.profile?.address || 'Not set'}</span>
                    </div>
                    <div className="info-item">
                      <label>Role</label>
                      <span>{user?.role}</span>
                    </div>
                  </div>
                  <button onClick={() => setEditMode(true)} className="edit-btn">✏️ Edit Profile</button>
                </>
              )}
            </div>
            
            <div className="profile-card">
              <h3>🔒 Change Password</h3>
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <button type="submit" className="password-btn">🔐 Change Password</button>
              </form>
            </div>

            <div className="profile-card">
              <h3>📊 Account Statistics</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">Documents</span>
                  <span className="stat-value">{documents.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Storage Used</span>
                  <span className="stat-value">{stats.storage || '0 MB'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Shared Files</span>
                  <span className="stat-value">{stats.shared || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Member Since</span>
                  <span className="stat-value">
                    {new Date(user?.createdAt).toLocaleDateString() || 'Today'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PaymentTab = () => {
    const [paymentData, setPaymentData] = useState({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      amount: 29.99,
      plan: 'premium',
      billingAddress: ''
    });
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      loadPaymentHistory();
    }, []);

    const loadPaymentHistory = async () => {
      try {
        const response = await paymentAPI.getPaymentHistory();
        setPaymentHistory(response.data.paymentHistory || []);
      } catch (error) {
        console.error('Failed to load payment history:', error);
      }
    };

    const handlePayment = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const response = await paymentAPI.processPayment(paymentData);
        alert('✅ Payment processed successfully! Transaction ID: ' + response.data.transactionId);
        setPaymentData({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: '',
          amount: 29.99,
          plan: 'premium',
          billingAddress: ''
        });
        loadPaymentHistory();
      } catch (error) {
        alert('❌ Payment failed: ' + (error.response?.data?.error || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="tab-content">
        <div className="payment-section">
          <div className="payment-header">
            <h2>💳 Payment & Billing</h2>
            <p>Upgrade your account and manage billing</p>
          </div>

          <div className="payment-cards">
            <div className="payment-card">
              <h3>🎆 Upgrade to Premium</h3>
              <div className="plan-info">
                <div className="plan-price">
                  <span className="price">${paymentData.amount}</span>
                  <span className="period">/month</span>
                </div>
                <ul className="plan-features">
                  <li>✅ Unlimited Documents</li>
                  <li>✅ 100GB Storage</li>
                  <li>✅ Advanced Security</li>
                  <li>✅ Priority Support</li>
                  <li>✅ Team Collaboration</li>
                </ul>
              </div>
              
              <form onSubmit={handlePayment} className="payment-form">
                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    value={paymentData.cardholderName}
                    onChange={(e) => setPaymentData({...paymentData, cardholderName: e.target.value})}
                    className="form-input"
                    placeholder="Selemon Hailu"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                    className="form-input"
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      value={paymentData.expiryDate}
                      onChange={(e) => setPaymentData({...paymentData, expiryDate: e.target.value})}
                      className="form-input"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value})}
                      className="form-input"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Billing Address</label>
                  <textarea
                    value={paymentData.billingAddress}
                    onChange={(e) => setPaymentData({...paymentData, billingAddress: e.target.value})}
                    className="form-input"
                    placeholder="123 Main St, City, State, ZIP"
                    rows="3"
                    required
                  />
                </div>
                
                <button type="submit" disabled={loading} className="payment-btn">
                  {loading ? '⏳ Processing...' : '🚀 Upgrade Now'}
                </button>
              </form>
            </div>

            <div className="payment-card">
              <h3>📊 Payment History</h3>
              <div className="payment-history">
                {paymentHistory.length === 0 ? (
                  <div className="empty-history">
                    <div className="empty-icon">💳</div>
                    <p>No payment history yet</p>
                  </div>
                ) : (
                  paymentHistory.map((payment, index) => (
                    <div key={index} className="payment-item">
                      <div className="payment-info">
                        <h4>Premium Plan</h4>
                        <p>Transaction ID: {payment.transactionId}</p>
                        <p>Date: {new Date(payment.processedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="payment-amount">
                        <span className="amount">${payment.amount}</span>
                        <span className={`status ${payment.status}`}>{payment.status.toUpperCase()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🛡️</span>
            <h1>TenantGuard</h1>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="welcome-text">
              👋 {user?.profile?.fullName || user?.email}
            </span>
            <span className="user-badge user">USER</span>
          </div>
          <button onClick={logout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        {[  
          { id: 'overview', label: 'Overview', icon: '🏠' },
          { id: 'documents', label: 'Documents', icon: '📁' },
          { id: 'profile', label: 'Profile', icon: '👤' },
          { id: 'payment', label: 'Payment', icon: '💳' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="dashboard-main">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'payment' && <PaymentTab />}
      </main>
    </div>
  );
};

export default UserDashboard;
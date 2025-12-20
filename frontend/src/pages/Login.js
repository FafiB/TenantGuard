import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { authAPI } from '../services/api';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === 'admin') {
      setFormData({
        email: 'demo@tenantguard.com',
        password: 'demo123'
      });
    } else {
      setFormData({
        email: 'test@tenantguard.com',
        password: 'test123'
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-overlay"></div>
      </div>
      
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo">
              <div className="logo-icon">🛡️</div>
              <h1>TenantGuard</h1>
            </div>
            <p className="tagline">Enterprise Document Management</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <h2>Welcome Back</h2>
            
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="demo-section">
              <p>Try Demo Accounts:</p>
              <div className="demo-buttons">
                <button 
                  type="button" 
                  className="demo-btn admin"
                  onClick={() => fillDemo('admin')}
                >
                  👑 Admin Demo
                </button>
                <button 
                  type="button" 
                  className="demo-btn user"
                  onClick={() => fillDemo('user')}
                >
                  👤 User Demo
                </button>
              </div>
            </div>

            <div className="auth-links">
              <Link to="/register" className="link">
                Don't have an account? Sign up
              </Link>
            </div>
          </form>
        </div>

        <div className="features-panel">
          <h3>Why Choose TenantGuard?</h3>
          <div className="features-list">
            <div className="feature">
              <span className="feature-icon">🔒</span>
              <div>
                <h4>Enterprise Security</h4>
                <p>Advanced encryption and access controls</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">🏢</span>
              <div>
                <h4>Multi-Tenant</h4>
                <p>Isolated workspaces for organizations</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">📊</span>
              <div>
                <h4>Analytics</h4>
                <p>Real-time insights and reporting</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">☁️</span>
              <div>
                <h4>Cloud Storage</h4>
                <p>Secure document management</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { authAPI } from '../services/api';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    tenantName: ''
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
      const response = await authAPI.register(formData);
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
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
            <h2>Create Account</h2>
            
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

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
              <label htmlFor="tenantName">Organization Name</label>
              <input
                type="text"
                id="tenantName"
                name="tenantName"
                value={formData.tenantName}
                onChange={handleChange}
                placeholder="Enter your organization name"
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
                placeholder="Create a password"
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="auth-links">
              <Link to="/login" className="link">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>

        <div className="features-panel">
          <h3>Get Started Today</h3>
          <div className="features-list">
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <div>
                <h4>Quick Setup</h4>
                <p>Get started in under 2 minutes</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">🆓</span>
              <div>
                <h4>Free Trial</h4>
                <p>14-day free trial, no credit card required</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">🔧</span>
              <div>
                <h4>Easy Integration</h4>
                <p>Seamless integration with existing tools</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">📞</span>
              <div>
                <h4>24/7 Support</h4>
                <p>Round-the-clock customer support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Phone, Lock, ShieldCheck, ClipboardList, LogOut, CheckCircle, AlertCircle, Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAdmin, updateProfile, changePassword, logout } = useAuth();

  // Profile Form state
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsapp_number || user?.phone_number || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Change Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setProfileLoading(true);

    const res = await updateProfile({
      username,
      email,
      whatsapp_number: whatsappNumber,
    });

    setProfileLoading(false);
    if (res.success) {
      setProfileSuccess('Profile details updated successfully!');
    } else {
      setProfileError(res.error || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    const res = await changePassword(oldPassword, newPassword);
    setPasswordLoading(false);

    if (res.success) {
      setPasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.error || 'Failed to change password. Check your current password.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="profile-page">
      <Helmet>
        <title>My Profile — Mcubes Cafe</title>
        <meta name="description" content="Manage your Mcubes Cafe account settings and security." />
      </Helmet>

      <div className="container">
        <button className="btn-page-back" onClick={() => navigate(-1)} title="Go Back">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="profile-wrapper">
          {/* Sidebar Info Card */}
          <div className="profile-card profile-sidebar">
            <div className="profile-avatar-wrapper">
              <div className={`profile-avatar-large ${user?.avatar ? 'has-avatar-img' : ''}`}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={`${user?.username || 'user'} avatar`} />
                ) : (
                  user?.username?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <h2 className="profile-username">{user?.username}</h2>
              <span className={`profile-role-badge badge ${isAdmin ? 'badge-yellow' : 'badge-green'}`}>
                {user?.role === 'admin' ? 'Admin Access' : 'Verified Customer'}
              </span>
            </div>

            <div className="profile-info-list">
              <div className="info-item">
                <Mail size={16} className="info-icon" />
                <span>{user?.email || 'No email provided'}</span>
              </div>
              <div className="info-item">
                <Phone size={16} className="info-icon" />
                <span>{user?.whatsapp_number || user?.phone_number || 'No phone added'}</span>
              </div>
            </div>

            <div className="profile-quick-actions">
              {isAdmin ? (
                <Link to="/admin-dashboard" className="btn btn-outline btn-block">
                  <ShieldCheck size={18} /> Admin Dashboard
                </Link>
              ) : (
                <Link to="/orders" className="btn btn-outline btn-block">
                  <ClipboardList size={18} /> My Order History
                </Link>
              )}
              <button className="btn btn-danger btn-block logout-btn" onClick={handleLogout}>
                <LogOut size={18} /> Log Out
              </button>
            </div>
          </div>

          {/* Main Profile Edit Sections */}
          <div className="profile-main">
            {/* Account Details Form */}
            <div className="profile-card">
              <div className="card-header-row">
                <User size={22} className="card-header-icon" />
                <h3>Account Information</h3>
              </div>

              {profileSuccess && (
                <div className="alert alert-success">
                  <CheckCircle size={18} /> {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="alert alert-error">
                  <AlertCircle size={18} /> {profileError}
                </div>
              )}

              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Number (for order notifications)</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                  {profileLoading ? <><Loader2 size={16} className="spin" /> Saving...</> : 'Save Account Details'}
                </button>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="profile-card" style={{ marginTop: '1.75rem' }}>
              <div className="card-header-row">
                <KeyRound size={22} className="card-header-icon" />
                <h3>Change Password</h3>
              </div>

              {passwordSuccess && (
                <div className="alert alert-success">
                  <CheckCircle size={18} /> {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div className="alert alert-error">
                  <AlertCircle size={18} /> {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter your current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? <><Loader2 size={16} className="spin" /> Updating Password...</> : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

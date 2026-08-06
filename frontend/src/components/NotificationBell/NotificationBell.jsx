import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, CheckCircle, Coins, RefreshCw, Sparkles, Receipt, Megaphone, Volume2, VolumeX } from 'lucide-react';
import { playNewOrderSound, testNotificationSound, isSoundMuted, toggleSoundMute } from '../../utils/sound';
import './NotificationBell.css';

export default function NotificationBell() {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [hasAuthError, setHasAuthError] = useState(false);
  const [muted, setMuted] = useState(() => isSoundMuted());
  const bellRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const isInitialFetchRef = useRef(true);

  // Reset auth error flag when authentication status changes
  useEffect(() => {
    setHasAuthError(false);
    seenIdsRef.current.clear();
    isInitialFetchRef.current = true;
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || hasAuthError || authLoading) return;
    try {
      const endpoint = isAdmin ? '/admin/notifications/' : '/notifications/';
      const response = await api.get(endpoint, { params: { limit: 20 } });
      const fetched = response.data.notifications || [];
      const newUnreadCount = response.data.unread_count || 0;

      // Check for new 'new_order' notifications if admin and not the initial load
      if (isAdmin && !isInitialFetchRef.current) {
        const brandNewOrderNotif = fetched.find(
          (n) => !n.is_read && n.type === 'new_order' && !seenIdsRef.current.has(n.id)
        );

        if (brandNewOrderNotif) {
          playNewOrderSound();
          window.dispatchEvent(new CustomEvent('new-order-received', { detail: brandNewOrderNotif }));
        }
      }

      // Update seen IDs
      fetched.forEach((n) => seenIdsRef.current.add(n.id));
      isInitialFetchRef.current = false;

      setNotifications(fetched);
      setUnreadCount(newUnreadCount);
    } catch (err) {
      if (err.response?.status === 401) {
        setHasAuthError(true);
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  }, [isAuthenticated, isAdmin, hasAuthError, authLoading]);

  useEffect(() => {
    if (!isAuthenticated || hasAuthError || authLoading) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [isAuthenticated, hasAuthError, authLoading, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    try {
      await api.post(`/notifications/${notification.id}/mark-read/`);
    } catch {
      // Silently fail
    }

    setOpen(false);

    // Navigate based on notification type
    if (notification.order_id) {
      if (isAdmin) {
        navigate(`/admin-dashboard?order=${notification.order_id}`);
      } else {
        navigate(`/orders`);
      }
    }
  };

  const handleToggleMute = (e) => {
    e.stopPropagation();
    const isMutedNow = toggleSoundMute();
    setMuted(isMutedNow);
  };

  const handleTestSound = (e) => {
    e.stopPropagation();
    testNotificationSound();
  };

  const toggleBell = () => {
    if (!open) {
      fetchNotifications();
    }
    setOpen(!open);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'order_confirmed': return <CheckCircle size={16} style={{ color: 'var(--success)' }} />;
      case 'payment_received': return <Coins size={16} style={{ color: 'var(--yellow)' }} />;
      case 'status_change': return <RefreshCw size={16} style={{ color: 'var(--info)' }} />;
      case 'new_order': return <Sparkles size={16} style={{ color: 'var(--yellow)' }} />;
      case 'bill_sent': return <Receipt size={16} style={{ color: 'var(--yellow)' }} />;
      default: return <Megaphone size={16} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  return (
    <div className="notification-bell" ref={bellRef}>
      <button className="bell-btn" onClick={toggleBell} aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div className="notification-header-title">
              <h3>Notifications</h3>
              {isAdmin && (
                <div className="sound-controls">
                  <button
                    className={`sound-toggle-btn ${muted ? 'muted' : ''}`}
                    onClick={handleToggleMute}
                    title={muted ? 'Unmute order notification sound' : 'Mute order notification sound'}
                  >
                    {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <button
                    className="test-sound-btn"
                    onClick={handleTestSound}
                    title="Test chime sound"
                  >
                    Test Sound
                  </button>
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${n.is_read ? '' : 'unread'}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <span className="notification-icon">{getTypeIcon(n.type)}</span>
                  <div className="notification-content">
                    <p className="notification-message">{n.message}</p>
                    <span className="notification-time">
                      {new Date(n.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {!n.is_read && <span className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, Keyboard, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import './UserMenu.css';

/**
 * Profile menu, opened from the avatar in the top bar.
 * Account identity at the top, navigation in the middle, sign-out last.
 */
export default function UserMenu() {
  const { user, initials, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  if (!user) return null;

  const close = () => setIsOpen(false);
  const handleLogout = () => {
    close();
    logout();
    navigate('/login');
  };
  const openShortcuts = () => {
    close();
    window.dispatchEvent(new Event('toggle-shortcuts-help'));
  };

  const avatar = user.avatar
    ? <img src={user.avatar} alt="" className="um__avatar-img" />
    : (initials || '?').slice(0, 2);

  return (
    <div className="um" ref={menuRef}>
      <button
        className={`um__trigger${isOpen ? ' um__trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Account menu"
      >
        {avatar}
      </button>

      {isOpen && (
        <div className="um__menu" role="menu">
          <div className="um__account">
            <span className="um__account-avatar">{avatar}</span>
            <div className="um__account-text">
              <div className="um__name">{user.name}</div>
              <div className="um__email">{user.email}</div>
            </div>
          </div>

          <div className="um__group">
            <Link to="/profile" className="um__item" role="menuitem" onClick={close}>
              <User size={15} /> Profile
            </Link>
            <Link to="/settings" className="um__item" role="menuitem" onClick={close}>
              <Settings size={15} /> Settings
            </Link>
            <button className="um__item" role="menuitem" onClick={openShortcuts}>
              <Keyboard size={15} /> Keyboard shortcuts
              <kbd className="um__kbd">?</kbd>
            </button>
          </div>

          <div className="um__group">
            <button className="um__item um__item--danger" role="menuitem" onClick={handleLogout}>
              <LogOut size={15} /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

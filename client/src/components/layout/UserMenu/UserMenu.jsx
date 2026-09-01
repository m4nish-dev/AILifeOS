import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import './UserMenu.css';

export default function UserMenu() {
  const { user, initials, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  if (!user) return null;

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button className="user-menu-avatar" onClick={() => setIsOpen(!isOpen)}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="user-menu-avatar-img" />
        ) : (
          initials
        )}
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <div className="user-menu-name">{user.name}</div>
            <div className="user-menu-email">{user.email}</div>
          </div>
          <div className="user-menu-divider" />
          
          <Link to="/profile" className="user-menu-item" onClick={() => setIsOpen(false)}>
            <User size={16} /> Profile
          </Link>
          <Link to="/settings" className="user-menu-item" onClick={() => setIsOpen(false)}>
            <Settings size={16} /> Settings
          </Link>
          <button className="user-menu-item" onClick={() => { toggleTheme(); setIsOpen(false); }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} 
            Toggle Theme
          </button>
          
          <div className="user-menu-divider" />
          <button className="user-menu-item user-menu-item--danger" onClick={handleLogout}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

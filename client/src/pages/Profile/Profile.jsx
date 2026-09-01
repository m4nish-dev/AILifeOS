import { useAuth } from '../../context/AuthContext';
import { User, Mail, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32 }}>Your Profile</h1>
      
      <div style={{ background: 'var(--surface-100)', padding: 32, borderRadius: 16, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        
        {user.avatar ? (
          <img src={user.avatar} alt="Avatar" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--blue-500)' }} />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--blue-500)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 600 }}>{user.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-tertiary)', marginTop: 8 }}>
            <Mail size={14} /> {user.email}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-tertiary)', marginTop: 4 }}>
            <Calendar size={14} /> Joined {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div style={{ width: '100%', height: 1, background: 'var(--border-color)', margin: '16px 0' }} />

        <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--surface-200)', borderRadius: 8, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
          <User size={16} /> Edit Profile Settings
        </Link>
      </div>
    </div>
  );
}

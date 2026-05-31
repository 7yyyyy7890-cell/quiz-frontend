import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { ar } from '../i18n/ar';
import '../styles/layout.css';

export default function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {!isAdmin && showBanner && (
        <div style={{
          backgroundColor: 'var(--gold)',
          color: 'var(--black)',
          padding: '0.75rem',
          textAlign: 'center',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 1000,
          position: 'relative'
        }} onClick={handleInstallClick}>
          <span>📲 ثبّت المنصة كتطبيق على جهازك للوصول السريع!</span>
          <button style={{
            background: 'var(--black)',
            color: 'var(--white)',
            border: 'none',
            padding: '0.4rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            تثبيت الآن
          </button>
        </div>
      )}
      <header className="app-header">
        <Logo size={40} />
        <nav>
          {isAdmin ? (
            <>
              <NavLink to="/admin" end>
                لوحة الإدارة 🛠️
              </NavLink>
              <NavLink to="/admin/keys">
                إدارة الحسابات 🔑
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" end>{ar.nav.competition}</NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">{ar.footer}</footer>
    </>
  );
}

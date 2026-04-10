'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="unauth-wrapper">
      <div className="unauth-card">
        <div className="unauth-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>Your account is not authorized to access the Admin Panel. Restricted to primary administrators only.</p>
        
        <div className="unauth-actions">
          <Link href="/" className="btn-home">
            Return to Store
          </Link>
          <div className="btn-switch">
            <button onClick={handleLogout}>Login with Another Account</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .unauth-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          padding: 24px;
        }
        .unauth-card {
          width: 100%;
          max-width: 480px;
          background: white;
          padding: 48px;
          border-radius: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          text-align: center;
        }
        .unauth-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
        }
        p {
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .unauth-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn-home {
          background: #2E7D32;
          color: white;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-home:hover {
          background: #1b4b1e;
          transform: translateY(-1px);
        }
        .btn-switch button {
          width: 100%;
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-switch button:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}

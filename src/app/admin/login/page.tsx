'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const { login, user, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error("Login detail error:", err);
      
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please check your email/password OR ensure "Email/Password" is ENABLED in your Firebase Console.');
      } else if (err.message === 'Access Denied: You do not have administrator privileges.') {
        setError('Unauthorized: Your email is not registered as an Admin in the Firestore database.');
      } else {
        setError(err.message || 'Login failed. Please verify your settings and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-layout">
      {/* Left Section - Brand and Visuals */}
      <div className="login-brand-section">
        <div className="brand-content animate-fade-in">
          <div className="logo-container">
             <Image
              src="/assets/logo.png"
              alt="Godavari Specials"
              width={250}
              height={125}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div className="brand-text">
            <h2>Management Console</h2>
            <p>Secure Enterprise Access</p>
          </div>
        </div>
        <div className="vertical-divider"></div>
      </div>

      {/* Right Section - Login Form */}
      <div className="login-form-section">
        <div className="form-wrapper animate-slide-up">
          <header className="header-group">
            <h1 className="welcome-title">Welcome</h1>
            <p className="instruction-text">PLEASE LOGIN TO ADMIN DASHBOARD.</p>
          </header>

          {error && (
            <div className="error-alert">
              <ShieldCheck className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="admin-auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input 
                  type="email" 
                  placeholder="admin@godavarispecials.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-help">
              <p>💡 <strong>Note:</strong> Make sure your email is assigned the <code>admin</code> role in Firestore.</p>
            </div>

            <button 
              type="submit" 
              disabled={loading || authLoading}
              className="admin-login-submit"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <KeyRound size={20} />
                  <span>LOGIN TO DASHBOARD</span>
                </>
              )}
            </button>
          </form>

          <p className="security-note">
            Authorized personnel only. Access is monitored.
          </p>
        </div>
      </div>

      <style jsx>{`
        .admin-login-layout {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          background-color: #002121;
          color: white;
          font-family: 'Outfit', 'Inter', sans-serif;
          overflow-x: hidden;
        }

        /* Brand Section (Left) */
        .login-brand-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 40px;
          background: linear-gradient(135deg, #002121 0%, #003030 100%);
        }
        .brand-content {
          text-align: center;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .brand-text h2 {
          font-size: 24px;
          font-weight: 300;
          letter-spacing: 3px;
          margin-top: 24px;
          text-transform: uppercase;
          color: #00ffcc;
        }
        .brand-text p {
          font-size: 14px;
          opacity: 0.6;
          letter-spacing: 1px;
        }
        .logo-container {
          filter: drop-shadow(0 0 15px rgba(0, 255, 204, 0.2));
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .vertical-divider {
          position: absolute;
          right: 0;
          top: 15%;
          bottom: 15%;
          width: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Form Section (Right) */
        .login-form-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        .form-wrapper {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .header-group {
          text-align: left;
          margin-bottom: 8px;
        }
        .welcome-title {
          font-size: 48px;
          font-weight: 300;
          letter-spacing: 2px;
          margin-bottom: 8px;
          color: #ffffff;
        }
        .instruction-text {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          opacity: 0.8;
          color: #00ffcc;
        }

        /* Form Controls */
        .admin-auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-group label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.6);
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-with-icon :global(svg) {
          position: absolute;
          left: 16px;
          color: #00ffcc;
          opacity: 0.7;
        }
        .input-with-icon input {
          width: 100%;
          height: 56px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0 16px 0 48px;
          color: white;
          font-size: 15px;
          transition: all 0.3s ease;
        }
        .input-with-icon input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.1);
          border-color: #00ffcc;
          box-shadow: 0 0 20px rgba(0, 255, 204, 0.1);
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 50%;
        }
        .password-toggle:hover {
          color: #00ffcc;
          background: rgba(0, 255, 204, 0.1);
          transform: translateY(-50%) scale(1.1);
        }

        .login-help {
          background: rgba(0, 255, 204, 0.05);
          border-left: 3px solid #00ffcc;
          padding: 12px;
          border-radius: 4px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }
        .login-help code {
          color: #00ffcc;
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 4px;
          border-radius: 4px;
        }

        .admin-login-submit {
          width: 100%;
          height: 60px;
          background-color: #00ffcc;
          color: #002121;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 10px;
          box-shadow: 0 8px 15px rgba(0, 255, 204, 0.2);
        }
        .admin-login-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(0, 255, 204, 0.3);
          background-color: #33ffdd;
        }
        .admin-login-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .security-note {
          text-align: center;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-top: 10px;
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (max-width: 900px) {
          .admin-login-layout {
            flex-direction: column;
            overflow-y: auto;
          }
          .vertical-divider {
            display: none;
          }
          .login-brand-section {
            flex: initial;
            padding: 60px 40px 40px;
          }
          .login-form-section {
            flex: initial;
            padding: 20px 40px 80px;
          }
          .welcome-title {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
}



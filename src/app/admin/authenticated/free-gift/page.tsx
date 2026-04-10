"use client";

import React, { useState, useEffect } from 'react';
import { getStoreSettings, updateStoreSettings } from '@/services/productService';
import { Gift, Save, Ghost, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function FreeGiftConfigPage() {
  const [settings, setSettings] = useState({
    freeGiftThreshold: 2000,
    isFreeGiftEnabled: false,
    giftName: "Premium Gift Pack"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getStoreSettings();
      setSettings({
        freeGiftThreshold: data.freeGiftThreshold ?? 2000,
        isFreeGiftEnabled: data.isFreeGiftEnabled ?? false,
        giftName: data.giftName ?? "Premium Gift Pack"
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateStoreSettings(settings);
      setMessage({ type: 'success', text: 'Free Gift configuration updated!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update configuration.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <Loader2 className="animate-spin" size={40} />
        <p>Loading Free Gift configuration...</p>
      </div>
    );
  }

  return (
    <div className="settings-container animate-fade-in">
      <div className="settings-header">
        <div className="header-icon-box">
          <Gift size={32} />
        </div>
        <div className="header-text">
          <h1>Free Gift Management</h1>
          <p>Configure a free gift pack for high-value orders</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings-card">
        <div className="settings-section">
          <div className="section-title">
            <Sparkles className="text-yellow-500" size={24} />
            <h2>Campaign Configuration</h2>
          </div>
          
          <div className="section-content">
            <div className="toggle-group">
              <div className="toggle-info">
                <label>Active Free Gift System</label>
                <span>Automatically add a gift pack to qualifying orders</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.isFreeGiftEnabled}
                  onChange={(e) => setSettings({ ...settings, isFreeGiftEnabled: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="input-row">
              <div className="input-field">
                <label>Qualifying Purchase Amount (₹)</label>
                <input
                  type="number"
                  value={settings.freeGiftThreshold}
                  onChange={(e) => setSettings({ ...settings, freeGiftThreshold: Number(e.target.value) })}
                  placeholder="e.g. 2000"
                  required
                />
              </div>

              <div className="input-field">
                <label>Gift Pack Header Name</label>
                <input
                  type="text"
                  value={settings.giftName}
                  onChange={(e) => setSettings({ ...settings, giftName: e.target.value })}
                  placeholder="e.g. Premium Gift Pack"
                  required
                />
              </div>
            </div>
            
            <div className="gift-preview">
              <div className="preview-label">How customers see it:</div>
              <div className="preview-bubble">
                 🎁 <strong>Congrats! You earned a FREE {settings.giftName}!</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          {message.text && (
            <div className={`status-message ${message.type}`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}
          
          <button 
            type="submit" 
            className="save-settings-btn" 
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {saving ? 'Updating...' : 'Publish Configuration'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .settings-container {
          padding: 30px;
          max-width: 900px;
          margin: 0 auto;
        }

        .settings-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
        }

        .header-icon-box {
          background: #ec4899;
          color: white;
          padding: 15px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(236, 72, 153, 0.3);
        }

        .header-text h1 {
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
        }

        .header-text p {
          color: #666;
          margin: 5px 0 0 0;
        }

        .settings-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .settings-section {
          padding: 40px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f0f0f0;
        }

        .section-title h2 {
          font-size: 20px;
          font-weight: 700;
          color: #333;
          margin: 0;
        }

        .toggle-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff5f7;
          padding: 25px;
          border-radius: 16px;
          margin-bottom: 30px;
          border: 1px solid #fce7f3;
        }

        .toggle-info label {
          display: block;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .toggle-info span {
          font-size: 13px;
          color: #666;
        }

        .input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }

        .input-field label {
          display: block;
          font-weight: 700;
          font-size: 13px;
          color: #444;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-field input {
          width: 100%;
          padding: 14px 18px;
          border-radius: 12px;
          border: 2px solid #eef2f6;
          background: #fcfdfe;
          font-size: 15px;
          transition: all 0.3s;
          color: #222;
        }

        .input-field input:focus {
          outline: none;
          border-color: #ec4899;
          background: white;
          box-shadow: 0 0 15px rgba(236, 72, 153, 0.1);
        }

        .gift-preview {
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .preview-label {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .preview-bubble {
          padding: 12px 20px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          color: #166534;
          font-size: 14px;
          display: inline-block;
        }

        .settings-footer {
          background: #fcfcfc;
          padding: 25px 40px;
          border-top: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .save-settings-btn {
          background: #ec4899;
          color: white;
          border: none;
          padding: 14px 30px;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .save-settings-btn:hover:not(:disabled) {
          background: #db2777;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(236, 72, 153, 0.2);
        }

        .save-settings-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .status-message {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .status-message.success { color: #10b981; }
        .status-message.error { color: #ef4444; }

        .switch {
          position: relative;
          display: inline-block;
          width: 52px;
          height: 28px;
        }

        .switch input { opacity: 0; width: 0; height: 0; }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 28px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 20px; width: 20px;
          left: 4px; bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider { background-color: #10b981; }
        input:checked + .slider:before { transform: translateX(24px); }

        .settings-loading {
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 15px;
          color: #666;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .input-row { grid-template-columns: 1fr; }
          .settings-footer { flex-direction: column; gap: 20px; }
          .save-settings-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

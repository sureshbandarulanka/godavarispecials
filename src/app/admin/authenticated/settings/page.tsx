"use client";

import React, { useState, useEffect } from 'react';
import { getStoreSettings, updateStoreSettings } from '@/services/productService';
import { Gift, Save, Settings2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StoreSettingsPage() {
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
      setMessage({ type: 'success', text: 'Store settings updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <Loader2 className="animate-spin" size={40} />
        <p>Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="settings-container animate-fade-in">
      <div className="settings-header">
        <div className="header-icon-box">
          <Settings2 size={32} />
        </div>
        <div className="header-text">
          <h1>Store Settings</h1>
          <p>Global configurations for orders and discounts</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings-card">
        <div className="settings-section">
          <div className="section-title">
            <Gift className="text-pink-500" size={24} />
            <h2>Free Gift Configuration</h2>
          </div>
          
          <div className="section-content">
            <div className="toggle-group">
              <div className="toggle-info">
                <label>Enable Free Gift Pack</label>
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
                <label>Minimum Purchase Amount (₹)</label>
                <input
                  type="number"
                  value={settings.freeGiftThreshold}
                  onChange={(e) => setSettings({ ...settings, freeGiftThreshold: Number(e.target.value) })}
                  placeholder="e.g. 2000"
                  required
                />
              </div>

              <div className="input-field">
                <label>Gift Pack Name</label>
                <input
                  type="text"
                  value={settings.giftName}
                  onChange={(e) => setSettings({ ...settings, giftName: e.target.value })}
                  placeholder="e.g. Premium Godavari Sweets Pack"
                  required
                />
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
            {saving ? 'Saving...' : 'Save Configurations'}
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
          background: #1a73e8;
          color: white;
          padding: 15px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(26, 115, 232, 0.3);
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
          background: #f8faff;
          padding: 25px;
          border-radius: 16px;
          margin-bottom: 30px;
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
          border-color: #1a73e8;
          background: white;
          box-shadow: 0 0 15px rgba(26, 115, 232, 0.1);
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
          background: #1a1a1a;
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
          background: #333;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
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

        /* Switch Styling */
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

"use client";

import React, { useState, useEffect } from 'react';
import { getStoreSettings, updateStoreSettings } from '@/services/productService';
import { Gift, Save, Trash2, Plus, Loader2, CheckCircle2, AlertCircle, Sparkles, Wand2, Ghost } from 'lucide-react';

interface GiftOffer {
  id: string;
  threshold: number;
  giftName: string;
}

export default function FreeGiftConfigPage() {
  const [isFreeGiftEnabled, setIsFreeGiftEnabled] = useState(false);
  const [offers, setOffers] = useState<GiftOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Add Local State for New Offer Input
  const [newOffer, setNewOffer] = useState({ threshold: 1000, giftName: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getStoreSettings();
      setIsFreeGiftEnabled(data.isFreeGiftEnabled ?? false);
      setOffers(data.offers ?? []);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const addOffer = () => {
    if (!newOffer.giftName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a gift name' });
      return;
    }
    const offer: GiftOffer = {
      id: `GIFT-${Date.now()}`,
      threshold: newOffer.threshold,
      giftName: newOffer.giftName.trim()
    };
    setOffers(prev => [...prev, offer].sort((a, b) => a.threshold - b.threshold));
    setNewOffer({ threshold: 1000, giftName: '' });
    setMessage({ type: 'success', text: 'Offer added! Press Submit to sync.' });
  };

  const removeOffer = async (id: string) => {
    const updatedOffers = offers.filter(o => o.id !== id);
    setOffers(updatedOffers);
    
    // Immediate live delete
    try {
      await updateStoreSettings({
        isFreeGiftEnabled,
        offers: updatedOffers
      });
      setMessage({ type: 'success', text: 'Tier removed from website! 🗑️' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove from live site.' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateStoreSettings({
        isFreeGiftEnabled,
        offers
      });
      setMessage({ type: 'success', text: 'Campaign updated successfully! 🎉' });
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
        <p>Loading Campaigns...</p>
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
          <h1>Multi-Tier Free Gift</h1>
          <p>Create tiers of rewards for high-value shoppers</p>
        </div>
      </div>

      <div className="settings-card">
        {/* Global Master Toggle */}
        <div className="master-toggle-section">
          <div className="toggle-group">
            <div className="toggle-info">
              <label>Master Campaign Switch</label>
              <span>Enable or disable all free gift offers across the store</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={isFreeGiftEnabled}
                onChange={(e) => setIsFreeGiftEnabled(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        {/* Add New Offer Section */}
        <div className="add-section">
          <div className="section-title">
            <Plus className="text-pink-500" size={20} />
            <h3>Add New Tier</h3>
          </div>
          <div className="add-form-row">
            <div className="input-group">
              <label>Threshold (₹)</label>
              <input 
                type="number" 
                value={newOffer.threshold}
                onChange={e => setNewOffer({...newOffer, threshold: Number(e.target.value)})}
                placeholder="2000"
              />
            </div>
            <div className="input-group flex-1">
              <label>Reward / Gift Name</label>
              <input 
                type="text" 
                value={newOffer.giftName}
                onChange={e => setNewOffer({...newOffer, giftName: e.target.value})}
                placeholder="Godavari Classic Box"
              />
            </div>
            <button className="add-tier-btn" onClick={addOffer}>
              <Plus size={18} /> Add Tier
            </button>
          </div>
        </div>

        {/* Active Offers List */}
        <div className="offers-list-section">
          <div className="section-title">
            <Sparkles className="text-yellow-500" size={20} />
            <h3>Active Reward Tiers</h3>
          </div>
          
          {offers.length === 0 ? (
            <div className="empty-offers">
              <Ghost size={40} strokeWidth={1} />
              <p>No active gift tiers. Start by adding one above!</p>
            </div>
          ) : (
            <div className="tiers-grid">
              {offers.map((offer) => (
                <div key={offer.id} className="tier-card">
                  <div className="tier-threshold">₹{offer.threshold}</div>
                  <div className="tier-gift-info">
                    <strong>{offer.giftName}</strong>
                    <span>Min. Purchase Required</span>
                  </div>
                  <button className="remove-tier-btn" onClick={() => removeOffer(offer.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="settings-footer">
          {message.text && (
            <div className={`status-message ${message.type}`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}
          
          <button 
            className="save-settings-btn" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
            {saving ? 'Saving...' : 'Submit Tier'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .settings-container {
          padding: 30px;
          max-width: 1000px;
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
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .master-toggle-section {
          padding: 30px 40px;
          background: #fdf2f2;
          border-bottom: 1px solid #fce7f3;
        }

        .toggle-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .toggle-info label {
          display: block;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 2px;
        }

        .toggle-info span {
          font-size: 13px;
          color: #666;
        }

        .add-section {
          padding: 40px;
          border-bottom: 1px solid #f1f5f9;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .section-title h3 {
          font-size: 16px;
          font-weight: 800;
          color: #334155;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .add-form-row {
          display: flex;
          gap: 16px;
          align-items: flex-end;
          background: #f8fafc;
          padding: 24px;
          border-radius: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .flex-1 { flex: 1; }

        .input-group label {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .input-group input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          font-size: 14px;
          transition: all 0.2s;
        }

        .input-group input:focus {
          border-color: #ec4899;
          outline: none;
          background: white;
        }

        .add-tier-btn {
          background: #ec4899;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          height: 48px;
        }

        .add-tier-btn:hover { background: #db2777; transform: translateY(-1px); }

        .offers-list-section {
          padding: 40px;
        }

        .tiers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .tier-card {
          background: white;
          border: 1.5px solid #f1f5f9;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: all 0.2s;
        }

        .tier-card:hover { 
          border-color: #ec4899; 
          box-shadow: 0 4px 15px rgba(236, 72, 153, 0.05);
        }

        .tier-threshold {
          background: #ffe4e6;
          color: #e11d48;
          font-weight: 800;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 14px;
        }

        .tier-gift-info { flex: 1; display: flex; flex-direction: column; }
        .tier-gift-info strong { font-size: 15px; color: #1e293b; }
        .tier-gift-info span { font-size: 11px; color: #94a3b8; }

        .remove-tier-btn {
          background: #fee2e2;
          color: #ef4444;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .remove-tier-btn:hover { background: #fee2e2; transform: scale(1.1); }

        .empty-offers {
          text-align: center;
          padding: 60px;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          background: #fcfdfe;
          border: 1.5px dashed #e2e8f0;
          border-radius: 20px;
        }

        .settings-footer {
          background: #f8fafc;
          padding: 25px 40px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .save-settings-btn {
          background: #1e293b;
          color: white;
          border: none;
          padding: 14px 30px;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-settings-btn:hover { 
          background: #000; 
          transform: translateY(-2px); 
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

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
          background-color: #cbd5e1;
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

        .animate-fade-in { animation: fadeIn 0.6s ease forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .add-form-row { flex-direction: column; align-items: stretch; }
          .settings-footer { flex-direction: column; gap: 20px; }
          .save-settings-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

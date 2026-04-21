import React from 'react';
import styles from './EditProfileModal.module.css';
import { X, User, Phone, Calendar, MapPin, Loader2 } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    name: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

export default function EditProfileModal({ 
  isOpen, 
  onClose, 
  formData, 
  onChange, 
  onSubmit,
  loading
}: EditProfileModalProps) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.dragHandle} />
        
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>Edit Profile</h2>
            <p className={styles.subtitle}>Update your personal information</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <User size={16} />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                placeholder="Enter your name"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                className={styles.input}
                readOnly
                style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed', color: '#64748b' }}
              />
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', marginLeft: '24px' }}>Linked to your Google account</p>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <Phone size={16} />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onChange}
                placeholder="10-digit mobile number"
                className={styles.input}
                pattern="[0-9]{10}"
              />
            </div>


            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <MapPin size={16} />
                Detailed Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={onChange}
                placeholder="House no, Building, Street, etc."
                className={styles.textarea}
                rows={3}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button 
              type="submit" 
              className={styles.saveBtn} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className={styles.spinner} size={20} />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

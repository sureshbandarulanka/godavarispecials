"use client";

import React from 'react';
import SendNotification from '@/components/admin/SendNotification';

export default function NotificationsPage() {
  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Push Notifications</h1>
        <p className="admin-page-subtitle">Send instant web and mobile notifications to your customers</p>
      </div>

      <div className="admin-page-content">
        <SendNotification />
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';

// Admin Notification Context for Mute/Unmute
const AdminNotificationContext = createContext<{
  isMuted: boolean;
  toggleMute: () => void;
  permissionStatus: NotificationPermission;
  requestPermission: () => Promise<void>;
}>({
  isMuted: false,
  toggleMute: () => {},
  permissionStatus: 'default',
  requestPermission: async () => {},
});

export const useAdminNotifications = () => useContext(AdminNotificationContext);

export default function AdminNotificationHandler({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const lastOrderId = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // 1. Initialize Mute state from LocalStorage
    const savedMute = localStorage.getItem('admin_notifications_muted') === 'true';
    setIsMuted(savedMute);

    // 2. Initialize Permission Status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }

    // 3. Initialize Audio
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.load();

    // 4. Set up Firestore Listener
    // We only want orders created AFTER this listener starts
    const startTime = Timestamp.now();
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>', startTime),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const orderData = change.doc.data();
          const orderId = change.doc.id;

          // Prevent Duplicate Notifications
          if (lastOrderId.current === orderId) return;
          lastOrderId.current = orderId;

          handleNewOrder(orderId, orderData);
        }
      });
    }, (error) => {
      console.error("Firestore Listener Error:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleNewOrder = (orderId: string, data: any) => {
    // 1. Play Sound (if not muted)
    if (!isMuted && audioRef.current) {
      audioRef.current.play().catch(e => console.warn("Audio play blocked:", e));
    }

    // 2. Browser Notification (if tab is inactive/hidden)
    if (document.hidden && Notification.permission === 'granted') {
      new Notification("New Order Received! 💰", {
        body: `Order ID: ${orderId}\nAmount: ₹${data.total || data.pricing?.totalAmount || '0'}`,
        icon: '/assets/logo.png', // Fallback to provided logo path
        tag: 'new-order'
      });
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    localStorage.setItem('admin_notifications_muted', String(nextMute));
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const status = await Notification.requestPermission();
    setPermissionStatus(status);
  };

  return (
    <AdminNotificationContext.Provider value={{ isMuted, toggleMute, permissionStatus, requestPermission }}>
      {children}
    </AdminNotificationContext.Provider>
  );
}

"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * A wrapper component to protect routes that require authentication.
 * If the user is not logged in, it opens the login modal and can optionally redirect.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, openLoginModal } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
      // Optionally redirect to home or previous page
      // router.push('/');
    }
  }, [user, loading, openLoginModal, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="text-gray-600 mb-6">Please log in to access this page.</p>
        <button 
          onClick={openLoginModal}
          className="bg-amber-500 text-white px-8 py-3 rounded-full font-bold hover:bg-amber-600 transition-colors"
        >
          Login Now
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import { useClientMount } from '@/hooks/useClientMount';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import LocationModal from './LocationModal';
import { useProducts } from '@/context/ProductContext';
import VoiceSearch from './VoiceSearch';
import { useRef } from 'react';

export default function MobileHeader() {
  const { user, openLoginModal } = useAuth();
  const { cartItems, openCart } = useCart();
  const { location, isHydrated } = useLocation();
  const { products } = useProducts();
  const mounted = useClientMount();
  const router = useRouter();
  const pathname = usePathname();

  // Show stable default until client has read localStorage
  const displayCity = (mounted && isHydrated) ? (location?.city || 'Hyderabad') : 'Hyderabad';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Listen for external open request
  useEffect(() => {
    const handleOpenModal = () => setIsLocationOpen(true);
    window.addEventListener('open-location-modal', handleOpenModal);
    return () => window.removeEventListener('open-location-modal', handleOpenModal);
  }, []);

  // Effect to handle outside click for search suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide global header on specialized pages to prevent double headers
  if (pathname === '/my-profile' || pathname.startsWith('/track-order')) return null;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!value.trim()) {
      const popular = products.slice(0, 5);
      setSuggestions(popular);
      return;
    }
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(value.toLowerCase()) || 
      p.category.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 8);
    setSuggestions(filtered);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (!searchQuery.trim() && products.length > 0) {
      const popular = products.slice(0, 5);
      setSuggestions(popular);
    }
  };

  const executeSearch = (query: string) => {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch(searchQuery);
    }
  };

  const handleSuggestionClick = (productId: string) => {
    router.push(`/product/${productId}`);
    setSuggestions([]);
    setSearchQuery('');
  };

  return (
    <div className="mobile-header">
      {/* ROW 1: Logo, Login, and Cart */}
      <div className="mobile-header-top">
        <Link href="/" className="mobile-logo-link">
          <img src="/assets/logo.png" className="mobile-logo" alt="Logo" />
        </Link>
        
        <div className="mobile-header-actions">
          <button 
            className="mobile-login-btn" 
            onClick={() => user ? router.push('/my-profile') : openLoginModal()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {user ? user.name.split(' ')[0] : 'Login'}
          </button>
        </div>
      </div>

      {/* ROW 2: Location and Search Side by Side */}
      <div className="mobile-header-bottom">
          <div className="mobile-location-wrapper" style={{ position: 'relative', flex: 1 }}>
            <div className="mobile-location-bar" onClick={() => setIsLocationOpen(true)} style={{ width: '100%' }}>
              <div className="location-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="location-content">
                <span className="location-label">Delivery to</span>
                <span className="location-value">{displayCity}</span>
              </div>
              <div className="location-chevron">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            <LocationModal 
              isOpen={isLocationOpen} 
              onClose={() => setIsLocationOpen(false)} 
            />
          </div>

        <div className="mobile-search-container" ref={searchRef}>
          <div className="mobile-search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={handleSearchFocus}
            />
            <VoiceSearch onResult={(text) => {
              setSearchQuery(text);
              executeSearch(text);
            }} className="mobile-voice-btn" />
          </div>

          {/* Search Suggestions */}
          {isSearchFocused && suggestions.length > 0 && (
            <div className="mobile-search-suggestions">
              <div className="mobile-suggestion-header">
                {searchQuery ? "Search Results" : "🔥 Popular Products"}
              </div>
              {suggestions.map(p => (
                <div 
                  key={p.id} 
                  className="mobile-suggestion-item"
                  onClick={() => handleSuggestionClick(p.id)}
                >
                  <div className="mobile-suggestion-thumb">
                    {p.image ? (
                      <img src={p.image} alt="" />
                    ) : (
                      <div className="mobile-suggestion-placeholder">🍴</div>
                    )}
                  </div>
                  <div className="mobile-suggestion-info">
                    <span className="mobile-suggestion-name">{p.name}</span>
                    <div className="mobile-suggestion-meta">
                      <span className="mobile-suggestion-price">₹{p.price}</span>
                      <span className="mobile-suggestion-category">{p.category}</span>
                    </div>
                  </div>
                </div>
              ))}
              {searchQuery && (
                <div 
                  className="mobile-suggestion-view-all"
                  onClick={() => executeSearch(searchQuery)}
                >
                  View all results for "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {isSearchFocused && searchQuery && suggestions.length === 0 && (
            <div className="mobile-search-suggestions">
              <div className="mobile-suggestion-header">No Results</div>
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#888' }}>
                No products found for "{searchQuery}"
              </div>
            </div>
          )}
        </div>
        </div>

    </div>
  );
}

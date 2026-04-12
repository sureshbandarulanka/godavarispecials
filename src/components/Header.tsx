"use client";
import React, { useState, useEffect, useRef } from 'react';
import styles from './Header.module.css';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getProducts, getStoreSettings } from '@/services/productService';
import { useLocation } from '@/context/LocationContext';
import { useClientMount } from '@/hooks/useClientMount';
import LocationModal from './LocationModal';
import VoiceSearch from './VoiceSearch';
import { MapPin, ChevronDown, Gift, Sparkles, Megaphone } from 'lucide-react';

const libraries: "places"[] = ["places"];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const { user, openLoginModal, logout } = useAuth();
  const { cartItems, openCart } = useCart();
  const { location, isDetecting, isHydrated } = useLocation();
  const mounted = useClientMount();
  // Show stable default until client has read localStorage (matches SSR default)
  const displayCity = (mounted && isHydrated) ? location.city : 'Hyderabad';
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  

  // Logo Click Handler
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === '/') {
      const banner = document.getElementById('home-banner');
      if (banner) {
        banner.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      router.push('/?scrollToTop=true');
    }
  };

  // Close dropdown on click away
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Listen for external open request
  useEffect(() => {
    const handleOpenModal = () => setIsLocationOpen(true);
    window.addEventListener('open-location-modal', handleOpenModal);
    return () => window.removeEventListener('open-location-modal', handleOpenModal);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!value.trim()) {
      // Show popular products when empty but focused
      const popular = getProducts().slice(0, 5);
      setSuggestions(popular);
      return;
    }
    const filtered = getProducts().filter(p => 
      p.name.toLowerCase().includes(value.toLowerCase()) || 
      p.category.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 10);
    setSuggestions(filtered);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (!searchQuery.trim()) {
      const popular = getProducts().slice(0, 5);
      setSuggestions(popular);
    }
  };

  // Close suggestions search on click away
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const executeSearch = (query: string) => {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setSuggestions([]);
    setSearchQuery(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch(searchQuery);
    }
  };

  return (
    <>
      <header className={`${styles.header} desktop-only`}>
        <div className={`container ${styles.headerContainer}`}>
          
          {/* Logo Area */}
          <div className={styles.logoArea}>
            <a href="/" onClick={handleLogoClick}>
              <img src="/assets/logo.png" alt="Godavari Specials" className={styles.headerLogo} />
            </a>
          </div>

          {/* Location Dropdown (Desktop) */}
          <div className={styles.locationWrapper}>
            <div className={styles.location} onClick={() => setIsLocationOpen(true)}>
              <div className={styles.locationTitle}>
                {location.isServiceable ? (
                  <>
                    <MapPin size={18} className={styles.locationIcon} />
                    <span className={styles.deliveringTo}>Delivering to:</span>
                    <span className={styles.cityName}>{displayCity}</span>
                  </>
                ) : (
                  <>
                    <span className={styles.restrictedIcon}>🌍</span>
                    <span className={styles.cityName}>Delivering only in India</span>
                  </>
                )}
                <span className={styles.changeAction}>[Change]</span>
              </div>
            </div>
            
            <LocationModal 
              isOpen={isLocationOpen} 
              onClose={() => setIsLocationOpen(false)} 
            />
          </div>

          {/* Search Bar */}
          <div className={`${styles.searchBar} ${styles.searchContainer}`} ref={searchRef}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search for Pickles, Sweets, Dry Fish..." 
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={handleSearchFocus}
            />
            <VoiceSearch onResult={(text) => {
              setSearchQuery(text);
              executeSearch(text);
            }} className={styles.voiceBtn} />
            
            {isSearchFocused && suggestions.length > 0 && (
              <div className={styles.searchSuggestions}>
                <div className={styles.suggestionHeader}>
                  {searchQuery ? "Search Results" : "🔥 Popular Products"}
                </div>
                {suggestions.map(p => (
                  <div 
                    key={p.id} 
                    className={styles.searchItem}
                    onClick={() => {
                      router.push(`/product/${p.id}`);
                      setIsSearchFocused(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className={styles.suggestionThumb}>
                      {p.image ? (
                        <img src={p.image} alt="" />
                      ) : (
                        <div className={styles.suggestionPlaceholder}>🍴</div>
                      )}
                    </div>
                    <div className={styles.suggestionInfo}>
                      <span className={styles.suggestionName}>{p.name}</span>
                      <div className={styles.suggestionMeta}>
                        <span className={styles.suggestionPrice}>₹{p.price}</span>
                        <span className={styles.suggestionCategory}>{p.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isSearchFocused && searchQuery && suggestions.length === 0 && (
              <div className={styles.searchSuggestions}>
                <div className={styles.noResults}>
                  No products found for "{searchQuery}"
                </div>
              </div>
            )}
          </div>

          {/* Actions (Login & Cart) */}
          <div className={styles.actions}>
            {user ? (
              <div className={styles.userMenu} ref={dropdownRef}>
                <button 
                  className={styles.userMenuBtn} 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <div className={styles.userAvatar}>{user.name.charAt(0).toUpperCase()}</div>
                  <span className={styles.userName}>{user.name}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {isUserDropdownOpen && (
                  <div className={styles.userDropdown}>
                    {user.role === 'admin' && (
                      <Link href="/admin" className={styles.dropdownItem} style={{ color: 'var(--brand-blue)', fontWeight: 'bold' }} onClick={() => setIsUserDropdownOpen(false)}>
                        🛡️ Admin Dashboard
                      </Link>
                    )}
                    <Link href="/my-orders" className={styles.dropdownItem} onClick={() => setIsUserDropdownOpen(false)}>My Orders</Link>
                    <Link href="/my-profile" className={styles.dropdownItem} onClick={() => setIsUserDropdownOpen(false)}>My Profile</Link>
                    <button className={styles.dropdownItem} onClick={() => { logout(); setIsUserDropdownOpen(false); router.push('/'); }}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <button className={styles.loginBtn} onClick={openLoginModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Login
              </button>
            )}

            {pathname !== '/checkout' && (
              <button id="cart-icon" className={styles.cartBtn} onClick={openCart}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                My Cart
                {cartItems.length > 0 && (
                  <span className={styles.cartBadge}>{cartItems.length}</span>
                )}
              </button>
            )}
          </div>

        </div>
      </header>
    </>
  );
}

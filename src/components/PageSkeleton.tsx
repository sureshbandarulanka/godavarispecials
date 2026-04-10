import React from "react";
import styles from "./PageSkeleton.module.css";

/** Single shimmer block — pass className for sizing */
function Shimmer({ className }: { className: string }) {
  return <div className={`${styles.shimmer} ${className}`} aria-hidden="true" />;
}

/** Product card skeleton — mirrors ProductCard exactly */
function ProductCardSkeleton() {
  return (
    <div className={styles.productCard}>
      <Shimmer className={styles.productImageShimmer} />
      <div className={styles.productBody}>
        <Shimmer className={styles.productNameShimmer} />
        <Shimmer className={styles.productNameShimmer2} />
        <Shimmer className={styles.productPriceShimmer} />
        <Shimmer className={styles.productBtnShimmer} />
      </div>
    </div>
  );
}

/** Mobile header skeleton — reserves exact header space to prevent CLS */
export function MobileHeaderSkeleton() {
  return (
    <div className={styles.mobileHeaderSkeleton} aria-hidden="true">
      <div className={styles.mobileHeaderTop}>
        <Shimmer className={styles.logoShimmer} />
        <Shimmer className={styles.loginBtnShimmer} />
      </div>
      <div className={styles.mobileHeaderBottom}>
        <Shimmer className={styles.locationShimmer} />
        <Shimmer className={styles.searchShimmer} />
      </div>
    </div>
  );
}

/** Desktop header skeleton */
export function DesktopHeaderSkeleton() {
  return (
    <div className={styles.desktopHeaderSkeleton} aria-hidden="true">
      <Shimmer className={styles.desktopLogoShimmer} />
      <Shimmer className={styles.desktopLocationShimmer} />
      <Shimmer className={styles.desktopSearchShimmer} />
      <div className={styles.desktopActionsShimmer}>
        <Shimmer className={styles.desktopBtnShimmer} />
        <Shimmer className={styles.desktopCartShimmer} />
      </div>
    </div>
  );
}

/** Mobile bottom nav skeleton */
export function MobileBottomNavSkeleton() {
  return (
    <div className={styles.mobileBottomNavSkeleton} aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Shimmer key={i} className={styles.navItemShimmer} />
      ))}
    </div>
  );
}

/**
 * Full-page Blinkit-style skeleton for the home page.
 * Shown as the Suspense fallback — perfectly matches the real layout
 * in dimensions to ensure CLS = 0.
 */
export default function PageSkeleton() {
  return (
    <>
      <MobileHeaderSkeleton />
      <DesktopHeaderSkeleton />

      <div className={styles.pageBody}>
        {/* Categories Row */}
        <div className={styles.categoryRow}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Shimmer key={i} className={styles.categoryChip} />
          ))}
        </div>

        {/* Hero Banner */}
        <Shimmer className={styles.heroBanner} />

        {/* Section 1 */}
        <div className={styles.sectionHeader}>
          <Shimmer className={styles.sectionTitle} />
          <Shimmer className={styles.sectionLink} />
        </div>
        <div className={styles.productGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>

        {/* Section 2 */}
        <div className={styles.sectionHeader}>
          <Shimmer className={styles.sectionTitle} />
          <Shimmer className={styles.sectionLink} />
        </div>
        <div className={styles.productGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <MobileBottomNavSkeleton />
    </>
  );
}

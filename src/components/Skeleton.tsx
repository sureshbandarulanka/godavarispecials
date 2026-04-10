"use client";
import React from "react";
import styles from "./Skeleton.module.css";

/**
 * Product Card Skeleton — shimmer placeholder that matches
 * the real ProductCard dimensions exactly (CLS = 0).
 */
export default function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      {/* image area rendered via ::before pseudo-element in CSS */}
      <div style={{ height: "8px" }} />
      <div className={styles.shimmerLine} style={{ width: "75%" }} />
      <div style={{ height: "6px" }} />
      <div className={styles.shimmerLine} style={{ width: "50%" }} />
      <div style={{ height: "6px" }} />
      <div className={styles.shimmerLine} style={{ width: "40%", height: "16px" }} />
      <div className={styles.shimmerBtn} />
    </div>
  );
}

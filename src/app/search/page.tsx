"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/context/ProductContext";
import { Product } from "@/data/products";

function SearchResults() {
  const { products } = useProducts();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true); // ✅ FIXED

  useEffect(() => {
    setIsLoading(true);

    if (query && products.length > 0) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }

    setIsLoading(false);
  }, [query, products]);

  // ✅ Loading UI
  if (isLoading) {
    return (
      <div className="pb-mobile-nav main-content">
        <Header />
        <main className="container pb-mobile-nav-specific">
          <div
            className="skeleton"
            style={{ width: "200px", height: "32px", marginBottom: "24px" }}
          />
          <div className="products-grid">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: "300px", borderRadius: "12px" }}
                />
              ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pb-mobile-nav main-content">
      <Header />

      <main className="container pb-mobile-nav-specific">
        {/* Mobile spacing fix */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media (max-width: 767px) {
            .pb-mobile-nav-specific {
              padding-bottom: 160px !important;
            }
          }
        `,
          }}
        />

        <div style={{ marginBottom: "24px" }}>
          <h1 className="h2" style={{ marginBottom: "8px" }}>
            {query ? `Search results for "${query}"` : "Search"} {/* ✅ FIXED */}
          </h1>

          <p className="text-secondary">
            {results.length} {results.length === 1 ? "item" : "items"} found
          </p>
        </div>

        {results.length > 0 ? (
          <div className="products-grid">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 20px",
              textAlign: "center",
              background: "white",
              borderRadius: "16px",
              border: "1px dashed var(--border-color)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <h3 className="h3" style={{ marginBottom: "8px" }}>
              No products found
            </h3>
            <p className="text-secondary">
              Try a different keyword or browse our categories.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ✅ Suspense Wrapper (Next.js requirement)
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="pb-mobile-nav main-content">
          <Header />
          <div className="container" style={{ padding: "24px" }}>
            <div
              className="skeleton"
              style={{ width: "200px", height: "32px", marginBottom: "24px" }}
            />
            <div className="products-grid">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: "300px", borderRadius: "12px" }}
                  />
                ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
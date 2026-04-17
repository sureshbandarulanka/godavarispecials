

import React from 'react';

type JsonLdProps = {
  data: any;
};

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Helper types for common schemas
export const getLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  "name": "Godavari Specials",
  "image": "https://godavarispecials.in/og-image.jpg",
  "@id": "https://godavarispecials.in",
  "url": "https://godavarispecials.in",
  "telephone": "+91 9491559901",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rajamahendravaram",
    "addressLocality": "Rajahmundry",
    "addressRegion": "Andhra Pradesh",
    "postalCode": "533101",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 17.0005,
    "longitude": 81.7835
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ],
    "opens": "09:00",
    "closes": "20:00"
  },
  "sameAs": [
    "https://www.facebook.com/godavarispecials",
    "https://www.instagram.com/godavarispecials"
  ]
});

export const getProductSchema = (product: any, offer?: any) => {
  const price = offer ? offer.offerPrice : (product.variants?.[0]?.price || 0);
  
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [product.image],
    "description": product.description || `Authentic ${product.name} from Godavari.`,
    "sku": product.id.toString(),
    "brand": {
      "@type": "Brand",
      "name": "Godavari Specials"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://godavarispecials.in/product/${product.id}`,
      "priceCurrency": "INR",
      "price": price,
      "priceValidUntil": "2026-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 40,
          "currency": "INR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 3,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      }
    }
  };
};

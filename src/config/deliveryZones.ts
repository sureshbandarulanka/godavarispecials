export const deliveryZones = {
  local: ["Rajahmundry", "Kakinada"],
  metro: [
    "Hyderabad", "Bangalore", "Chennai", "Mumbai", 
    "Delhi", "Kolkata", "Pune", "Ahmedabad", "Gurgaon"
  ]
} as const;

export const deliveryConfig = {
  minOrderValue: 299,
  freeDeliveryAbove: 999,
};

export type DeliveryZoneType = keyof typeof deliveryZones;

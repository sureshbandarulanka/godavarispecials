const ORIGIN = { lat: 17.0005, lng: 81.7835 };
const MUMBAI = { lat: 19.0760, lng: 72.8777 };

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const dist = calculateHaversineDistance(ORIGIN.lat, ORIGIN.lng, MUMBAI.lat, MUMBAI.lng);
console.log("Distance from Rajahmundry to Mumbai:", dist, "km");

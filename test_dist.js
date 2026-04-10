
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

const raj = { lat: 17.0005, lng: 81.7835 };
const hyd = { lat: 17.3850, lng: 78.4867 };
const vij = { lat: 16.5062, lng: 80.6480 };
const mum = { lat: 19.0760, lng: 72.8777 };

console.log('Hyderabad:', calculateHaversineDistance(raj.lat, raj.lng, hyd.lat, hyd.lng), 'km');
console.log('Vijayawada:', calculateHaversineDistance(raj.lat, raj.lng, vij.lat, vij.lng), 'km');
console.log('Mumbai:', calculateHaversineDistance(raj.lat, raj.lng, mum.lat, mum.lng), 'km');

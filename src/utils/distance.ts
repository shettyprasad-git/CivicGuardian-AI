// Calculate distance between two coordinates in km using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

export function estimateWalkingTime(distanceKm: number): string {
  const timeInMinutes = Math.round(distanceKm * 12); // ~5 km/h
  if (timeInMinutes < 1) return '< 1 min walk';
  if (timeInMinutes >= 60) {
    const hours = Math.floor(timeInMinutes / 60);
    const mins = timeInMinutes % 60;
    return `${hours}h ${mins}m walk`;
  }
  return `${timeInMinutes} min walk`;
}

export function estimateDrivingTime(distanceKm: number): string {
  const timeInMinutes = Math.round(distanceKm * 2); // ~30 km/h
  if (timeInMinutes < 1) return '< 1 min drive';
  if (timeInMinutes >= 60) {
    const hours = Math.floor(timeInMinutes / 60);
    const mins = timeInMinutes % 60;
    return `${hours}h ${mins}m drive`;
  }
  return `${timeInMinutes} min drive`;
}

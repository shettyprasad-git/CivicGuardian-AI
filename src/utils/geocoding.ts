import { Locality } from '../types';

export async function reverseGeocode(lat: number, lng: number): Promise<Locality> {
  const defaultLocality: Locality = {
    area: 'Unknown Area',
    city: 'Unknown City',
    state: 'Unknown State',
    country: 'Unknown Country',
    formatted: 'Unknown Location',
  };

  try {
    const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const locality: Partial<Locality> = {};
        
        result.address_components.forEach((component: any) => {
          if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
            locality.area = component.long_name;
          }
          if (component.types.includes('locality')) {
            locality.city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            locality.state = component.long_name;
          }
          if (component.types.includes('country')) {
            locality.country = component.long_name;
          }
        });
        
        return {
          area: locality.area || locality.city || 'Unknown Area',
          city: locality.city || 'Unknown City',
          state: locality.state || 'Unknown State',
          country: locality.country || 'Unknown Country',
          formatted: result.formatted_address || `${locality.area ? locality.area + ', ' : ''}${locality.city || 'Unknown Location'}`
        };
      }
    } else {
      // Fallback to nominatim
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.address) {
        return {
          area: data.address.suburb || data.address.neighbourhood || data.address.residential || 'Unknown Area',
          city: data.address.city || data.address.town || data.address.village || 'Unknown City',
          state: data.address.state || 'Unknown State',
          country: data.address.country || 'Unknown Country',
          formatted: data.display_name || 'Unknown Location'
        };
      }
    }
  } catch (error) {
    console.error("Geocoding failed", error);
  }
  
  return defaultLocality;
}

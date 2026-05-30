// Singleton loader — Google Maps script can only be loaded once per page.
// Both MapView and GpsTrackMap must use this same config.
export const MAPS_LIBRARIES: ('drawing' | 'places' | 'geometry')[] = ['drawing', 'geometry'];

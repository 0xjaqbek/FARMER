// src/utils/mapStyles.js - Custom map styles
export const mapStyles = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }]
  }
];

// Custom farm icon styles
export const farmMarkerIcon = {
  url: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16a34a">
      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
      <circle cx="12" cy="12" r="2" fill="#ffffff"/>
    </svg>
  `),
  scaledSize: { width: 32, height: 32 },
  origin: { x: 0, y: 0 },
  anchor: { x: 16, y: 32 }
};

export const verifiedFarmMarkerIcon = {
  url: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#059669">
      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
      <path d="M9 12L11 14L15 10" stroke="#ffffff" stroke-width="2" fill="none"/>
    </svg>
  `),
  scaledSize: { width: 32, height: 32 },
  origin: { x: 0, y: 0 },
  anchor: { x: 16, y: 32 }
};
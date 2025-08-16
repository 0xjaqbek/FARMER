// src/components/maps/FarmersMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Star, Navigation, Maximize2, Minimize2 } from 'lucide-react';
import GoogleMapsService from '../../services/googleMapsService';
import { EnhancedSearchService } from '../../services/enhancedSearchService';

const FarmersMap = ({ 
  userLocation, 
  farmers = [], 
  products = [], 
  onFarmerSelect, 
  selectedFarmer = null,
  className = "",
  height = "400px" 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        await GoogleMapsService.loadGoogleMaps();
        
        if (!mapRef.current) return;

        // Default center (Poland)
        const defaultCenter = userLocation || { lat: 52.0693, lng: 19.4803 };
        
        // Create map
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: userLocation ? 11 : 6,
          center: defaultCenter,
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        mapInstanceRef.current = map;
        
        // Create info window
        infoWindowRef.current = new window.google.maps.InfoWindow();
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to load map. Please check your internet connection.');
      }
    };

    initializeMap();

    return () => {
      // Cleanup
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [userLocation]);

  // Add user location marker
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !userLocation) return;

    const userMarker = new window.google.maps.Marker({
      position: userLocation,
      map: mapInstanceRef.current,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });

    return () => {
      userMarker.setMap(null);
    };
  }, [isLoaded, userLocation]);

  // Add farmer markers
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add farmer markers
    farmers.forEach(farmer => {
      if (!farmer.location?.coordinates) return;

      const position = {
        lat: farmer.location.coordinates.lat || farmer.location.coordinates.latitude,
        lng: farmer.location.coordinates.lng || farmer.location.coordinates.longitude
      };

      // Count products for this farmer
      const farmerProducts = products.filter(p => p.farmerId === farmer.id);
      
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: farmer.farmName || farmer.displayName,
        icon: {
          url: farmer.verified ? '/icons/verified-farm.png' : '/icons/farm.png',
          scaledSize: new window.google.maps.Size(32, 32),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(16, 32)
        }
      });

      // Create info window content
      const infoContent = createFarmerInfoContent(farmer, farmerProducts);

      // Add click listener
      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
        
        if (onFarmerSelect) {
          onFarmerSelect(farmer);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (farmers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      if (userLocation) {
        bounds.extend(userLocation);
      }
      
      farmers.forEach(farmer => {
        if (farmer.location?.coordinates) {
          bounds.extend({
            lat: farmer.location.coordinates.lat || farmer.location.coordinates.latitude,
            lng: farmer.location.coordinates.lng || farmer.location.coordinates.longitude
          });
        }
      });
      
      mapInstanceRef.current.fitBounds(bounds);
      
      // Prevent over-zooming for single markers
      const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current.getZoom() > 15) {
          mapInstanceRef.current.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    }

  }, [isLoaded, farmers, products, onFarmerSelect]);

  // Highlight selected farmer
  useEffect(() => {
    if (!selectedFarmer || !isLoaded) return;

    const marker = markersRef.current.find(m => 
      m.getTitle() === (selectedFarmer.farmName || selectedFarmer.displayName)
    );

    if (marker) {
      // Center map on selected farmer
      mapInstanceRef.current.setCenter(marker.getPosition());
      mapInstanceRef.current.setZoom(13);
      
      // Open info window
      const farmerProducts = products.filter(p => p.farmerId === selectedFarmer.id);
      const infoContent = createFarmerInfoContent(selectedFarmer, farmerProducts);
      
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(infoContent);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      }
    }
  }, [selectedFarmer, isLoaded, products]);

  // Create farmer info window content
  const createFarmerInfoContent = (farmer, farmerProducts) => {
    const distance = farmer.distance ? 
      GoogleMapsService.formatDistance(farmer.distance) : '';

    return `
      <div class="p-3 max-w-sm">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="font-semibold text-lg">${farmer.farmName || farmer.displayName}</h3>
          ${farmer.verified ? '<span class="text-green-600">✓</span>' : ''}
        </div>
        
        ${distance ? `<p class="text-sm text-gray-600 mb-2">${distance} away</p>` : ''}
        
        ${farmer.location?.address ? 
          `<p class="text-sm text-gray-600 mb-2">${farmer.location.address}</p>` : ''
        }
        
        ${farmerProducts.length > 0 ? `
          <div class="mb-3">
            <p class="text-sm font-medium mb-1">${farmerProducts.length} products available</p>
            <div class="flex flex-wrap gap-1">
              ${farmerProducts.slice(0, 3).map(product => 
                `<span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${product.name}</span>`
              ).join('')}
              ${farmerProducts.length > 3 ? 
                `<span class="text-xs text-gray-500">+${farmerProducts.length - 3} more</span>` : ''
              }
            </div>
          </div>
        ` : ''}
        
        <button 
          onclick="window.viewFarmerProfile('${farmer.id}')"
          class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
        >
          View Profile
        </button>
      </div>
    `;
  };

  // Add global function for info window buttons
  useEffect(() => {
    window.viewFarmerProfile = (farmerId) => {
      const farmer = farmers.find(f => f.id === farmerId);
      if (farmer && onFarmerSelect) {
        onFarmerSelect(farmer);
      }
    };

    return () => {
      delete window.viewFarmerProfile;
    };
  }, [farmers, onFarmerSelect]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Farmers Near You
          {farmers.length > 0 && (
            <Badge variant="outline">{farmers.length} farmers</Badge>
          )}
        </CardTitle>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative">
          {!isLoaded && (
            <div 
              className="flex items-center justify-center bg-gray-100"
              style={{ height }}
            >
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          
          <div
            ref={mapRef}
            style={{ 
              height: isFullscreen ? 'calc(100vh - 8rem)' : height,
              width: '100%'
            }}
            className={!isLoaded ? 'hidden' : ''}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmersMap;
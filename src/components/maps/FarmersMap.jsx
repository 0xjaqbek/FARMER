// src/components/maps/FarmersMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Star, Navigation, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import GoogleMapsService from '../../services/googleMapsService';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if Google Maps API key is available
  const hasGoogleMapsKey = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return apiKey && apiKey !== 'your_api_key_here' && apiKey !== '';
  };

  // Initialize Google Maps using the centralized service
  useEffect(() => {
    const initializeMap = async () => {
        console.log("🚀 initializeMap called, mapRef:", mapRef.current);
        console.log("🧩 FarmersMap rendered with props:", { userLocation, farmers, products });

      try {
        setIsLoading(true);
        setError(null);

        if (!hasGoogleMapsKey()) {
            console.log("🔑 Google Maps key check:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

          throw new Error('Google Maps API key not configured');
        }

        // Use the centralized GoogleMapsService instead of local loading
        await GoogleMapsService.loadGoogleMaps();
        
        if (!mapRef.current) {
        console.warn("⏳ mapRef still null, retrying in 100ms...");
        setTimeout(initializeMap, 100);
        return;
        }

        // Default center (Poland)
        const defaultCenter = userLocation || { lat: 52.0693, lng: 19.4803 };
        console.log("🗺️ Initializing map with center:", defaultCenter, "zoom:", userLocation ? 11 : 6);

        
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
        console.log('✅ Google Maps loaded successfully');
      } catch (error) {
        console.error('❌ Error initializing map:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
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

    console.log('🗺️ Adding farmer markers:', farmers);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add farmer markers
    farmers.forEach((farmer, index) => {
      console.log(`📍 Processing farmer ${index + 1}:`, farmer);

      const coords = farmer.location?.coordinates;
      if (!coords) {
        console.warn(`⚠️ No coordinates for farmer:`, farmer);
        return;
      }

      const position = {
        lat: coords.lat || coords.latitude,
        lng: coords.lng || coords.longitude
      };

      console.log(`📍 Creating marker at:`, position);

      // Count products for this farmer
      const farmerProducts = products.filter(p => 
        (p.farmerId || p.rolnikId) === farmer.id
      );
      
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: farmer.farmName || farmer.farmerName || farmer.displayName || `Farmer ${index + 1}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: farmer.verified ? '#10B981' : '#F59E0B',
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
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

    console.log(`✅ Added ${markersRef.current.length} farmer markers`);

    // Fit map to show all markers
    if (farmers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      if (userLocation) {
        bounds.extend(userLocation);
      }
      
      farmers.forEach(farmer => {
        const coords = farmer.location?.coordinates;
        if (coords) {
          bounds.extend({
            lat: coords.lat || coords.latitude,
            lng: coords.lng || coords.longitude
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
      m.getTitle() === (selectedFarmer.farmName || selectedFarmer.farmerName || selectedFarmer.displayName)
    );

    if (marker) {
      // Center map on selected farmer
      mapInstanceRef.current.setCenter(marker.getPosition());
      mapInstanceRef.current.setZoom(13);
      
      // Open info window
      const farmerProducts = products.filter(p => 
        (p.farmerId || p.rolnikId) === selectedFarmer.id
      );
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
      `${farmer.distance}km away` : '';

    const farmName = farmer.farmName || farmer.farmerName || farmer.displayName || 'Local Farm';
    const productCount = farmerProducts.length;

    return `
      <div style="padding: 12px; max-width: 250px; font-family: system-ui;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${farmName}</h3>
          ${farmer.verified ? 
            '<span style="color: #10B981; font-size: 12px;">✓ Verified</span>' : 
            '<span style="color: #F59E0B; font-size: 12px;">○ Unverified</span>'
          }
        </div>
        ${distance ? `<p style="margin: 4px 0; color: #666; font-size: 14px;">📍 ${distance}</p>` : ''}
        <p style="margin: 4px 0; color: #666; font-size: 14px;">🥕 ${productCount} products available</p>
        ${farmer.location?.address ? 
          `<p style="margin: 4px 0; color: #666; font-size: 12px;">${farmer.location.address}</p>` : 
          ''
        }
      </div>
    `;
  };

  // Render error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Map unavailable:</strong> {error}</p>
                {!hasGoogleMapsKey() && (
                  <div className="text-sm">
                    <p>To enable the map:</p>
                    <ol className="list-decimal list-inside space-y-1 mt-2">
                      <li>Get a Google Maps API key from <a href="https://developers.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                      <li>Add it to your .env file as: <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY=your_key_here</code></li>
                      <li>Restart your development server</li>
                    </ol>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Fallback farmer list */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Farmers in your area:</h3>
            <div className="space-y-2">
              {farmers.map((farmer, index) => (
                <div 
                  key={farmer.id || index}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => onFarmerSelect && onFarmerSelect(farmer)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{farmer.farmName || farmer.farmerName || farmer.displayName}</p>
                      {farmer.distance && (
                        <p className="text-sm text-gray-600">{farmer.distance}km away</p>
                      )}
                    </div>
                    <Badge variant={farmer.verified ? "success" : "outline"}>
                      {farmer.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render map
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Interactive Map View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {farmers.length} farmer{farmers.length !== 1 ? 's' : ''} nearby
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef}
          style={{ 
            height: isFullscreen ? '70vh' : height,
            width: '100%',
            borderRadius: '8px'
          }}
          className="bg-gray-100"
        />
        
        {/* Map controls */}
        <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Your location</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Verified farmers</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Unverified farmers</span>
            </div>
          </div>
          
          {userLocation && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => {
                if (mapInstanceRef.current && userLocation) {
                  mapInstanceRef.current.setCenter(userLocation);
                  mapInstanceRef.current.setZoom(11);
                }
              }}
            >
              <Navigation className="h-3 w-3 mr-1" />
              Center on me
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmersMap;
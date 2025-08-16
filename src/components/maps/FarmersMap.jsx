// src/components/maps/FarmersMap.jsx - Final Enhanced Version
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Navigation, Maximize2, Minimize2, AlertCircle, Map, Satellite } from 'lucide-react';
import GoogleMapsService from '../../services/googleMapsService';
import './FarmersMap.css'; // Import custom styles

const FarmersMap = ({ 
  userLocation, 
  farmers = [], 
  products = [], 
  onFarmerSelect, 
  selectedFarmer = null,
  className = "",
  height = "400px",
  showControls = true,
  showLegend = true
}) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState('roadmap');

  // Check if Google Maps API key is available
  const hasGoogleMapsKey = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return apiKey && apiKey !== 'your_api_key_here' && apiKey !== '';
  };

  // Create custom marker icon with enhanced visuals
  const createFarmerMarkerIcon = (farmer, isHovered = false) => {
    const baseScale = isHovered ? 14 : 10;
    const strokeWeight = isHovered ? 3 : 2;
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: baseScale,
      fillColor: farmer.verified ? '#10B981' : '#F59E0B',
      fillOpacity: isHovered ? 1 : 0.8,
      strokeColor: isHovered ? '#1f2937' : '#ffffff',
      strokeWeight: strokeWeight,
      zIndex: isHovered ? 1000 : (farmer.verified ? 100 : 50)
    };
  };

  // Create hover info window content (minimal information)
  const createHoverInfoContent = (farmer, farmerProducts) => {
    const farmName = farmer.farmName || farmer.farmerName || farmer.displayName || 'Local Farm';
    const productCount = farmerProducts.length;
    const distance = farmer.distance ? `${farmer.distance}km away` : '';

    return `
      <div class="farmer-info-content" style="padding: 8px; max-width: 200px; cursor: pointer;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">${farmName}</h4>
          <span class="verification-badge ${farmer.verified ? '' : 'unverified'}">
            ${farmer.verified ? '✓ Verified' : '○ Unverified'}
          </span>
        </div>
        ${distance ? `<p style="margin: 2px 0; color: #6b7280; font-size: 12px;">📍 ${distance}</p>` : ''}
        <p style="margin: 2px 0; color: #6b7280; font-size: 12px;">🥕 ${productCount} products</p>
        <div class="click-hint">
          Click to view profile →
        </div>
      </div>
    `;
  };

  // Create detailed info window content
  const createDetailedInfoContent = (farmer, farmerProducts) => {
    const farmName = farmer.farmName || farmer.farmerName || farmer.displayName || 'Local Farm';
    const productCount = farmerProducts.length;
    const distance = farmer.distance ? `${farmer.distance}km away` : '';
    const sampleProducts = farmerProducts.slice(0, 3).map(p => p.name).join(', ');

    return `
      <div class="farmer-info-content" style="padding: 12px; max-width: 280px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${farmName}</h3>
          <span class="verification-badge ${farmer.verified ? '' : 'unverified'}">
            ${farmer.verified ? '✓ Verified' : '○ Unverified'}
          </span>
        </div>
        ${distance ? `<p style="margin: 4px 0; color: #666; font-size: 14px;">📍 ${distance}</p>` : ''}
        <p style="margin: 4px 0; color: #666; font-size: 14px;">🥕 ${productCount} products available</p>
        
        ${sampleProducts ? `
          <p style="margin: 4px 0; color: #666; font-size: 12px;">
            <strong>Products:</strong> ${sampleProducts}${farmerProducts.length > 3 ? '...' : ''}
          </p>
        ` : ''}
        
        ${farmer.location?.address ? 
          `<p style="margin: 4px 0; color: #666; font-size: 12px;">${farmer.location.address}</p>` : 
          ''
        }
        
        ${farmer.farmInfo?.specialties?.length > 0 ? `
          <p style="margin: 6px 0 4px 0; color: #666; font-size: 12px;">
            <strong>Specialties:</strong> ${farmer.farmInfo.specialties.slice(0, 3).join(', ')}
          </p>
        ` : ''}
        
        <div class="click-hint">
          → Click to view full profile
        </div>
      </div>
    `;
  };

  // Initialize Google Maps
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

        // Wait for Google Maps to load
        await GoogleMapsService.loadGoogleMaps();
        
        // Double check that Google Maps is available
        if (!window.google || !window.google.maps || !window.google.maps.Map) {
          console.error("Google Maps not fully loaded");
          throw new Error('Google Maps API failed to load completely');
        }
        
        if (!mapRef.current) {
          console.warn("⏳ mapRef still null, retrying in 100ms...");
          setTimeout(initializeMap, 100);
          return;
        }

        const defaultCenter = userLocation || { lat: 52.0693, lng: 19.4803 };
        console.log("🗺️ Initializing map with center:", defaultCenter, "zoom:", userLocation ? 11 : 6);

        // Create map with error handling
        try {
          const map = new window.google.maps.Map(mapRef.current, {
            zoom: userLocation ? 11 : 6,
            center: defaultCenter,
            mapTypeId: mapType,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          });

          mapInstanceRef.current = map;
          
          // Create info window
          if (window.google.maps.InfoWindow) {
            infoWindowRef.current = new window.google.maps.InfoWindow();
          }
          
          setIsLoaded(true);
          console.log('✅ Google Maps loaded successfully');
        } catch (mapError) {
          console.error('❌ Error creating map instance:', mapError);
          throw new Error(`Failed to create map: ${mapError.message}`);
        }
        
      } catch (error) {
        console.error('❌ Error initializing map:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeMap, 100);

    return () => {
      clearTimeout(timeoutId);
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [userLocation, mapType]);

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
      },
      zIndex: 2000
    });

    return () => {
      userMarker.setMap(null);
    };
  }, [isLoaded, userLocation]);

  // Add enhanced farmer markers with hover and click functionality
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    console.log('🗺️ Adding enhanced farmer markers:', farmers);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    farmers.forEach((farmer, index) => {
      console.log(`📍 Processing farmer ${index + 1}:`, farmer);

      // Handle both coordinate formats
      let coords = null;
      if (farmer.location?.coordinates?.lat && farmer.location?.coordinates?.lng) {
        coords = farmer.location.coordinates;
      } else if (farmer.location?.lat && farmer.location?.lng) {
        coords = { lat: farmer.location.lat, lng: farmer.location.lng };
      }
      
      if (!coords) {
        console.warn(`⚠️ No coordinates for farmer:`, farmer);
        return;
      }

      const position = {
        lat: coords.lat || coords.latitude,
        lng: coords.lng || coords.longitude
      };

      // Validate coordinates
      if (typeof position.lat !== 'number' || typeof position.lng !== 'number' ||
          position.lat < -90 || position.lat > 90 || 
          position.lng < -180 || position.lng > 180) {
        console.warn(`⚠️ Invalid coordinates for farmer:`, farmer);
        return;
      }

      // Count products for this farmer
      const farmerProducts = products.filter(p => 
        (p.farmerId || p.rolnikId) === farmer.id
      );
      
      // Create enhanced marker
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: farmer.farmName || farmer.farmerName || farmer.displayName || `Farmer ${index + 1}`,
        icon: createFarmerMarkerIcon(farmer, false),
        animation: null
      });

      // Enhanced hover listeners
      marker.addListener('mouseover', () => {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }

        // Update marker appearance immediately
        marker.setIcon(createFarmerMarkerIcon(farmer, true));
        
        // Show hover info with slight delay for better UX
        hoverTimeoutRef.current = setTimeout(() => {
          const hoverContent = createHoverInfoContent(farmer, farmerProducts);
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(hoverContent);
            infoWindowRef.current.open(mapInstanceRef.current, marker);
          }
        }, 200);
      });

      marker.addListener('mouseout', () => {
        // Clear timeout to prevent showing info window
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }

        // Reset marker appearance
        marker.setIcon(createFarmerMarkerIcon(farmer, false));
        
        // Close info window with slight delay
        setTimeout(() => {
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
        }, 100);
      });

      // Enhanced click listener with navigation
      marker.addListener('click', () => {
        // Clear any hover timeouts
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }

        // Show detailed info first
        const detailedContent = createDetailedInfoContent(farmer, farmerProducts);
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(detailedContent);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }

        // Navigate to farmer profile after a short delay
        setTimeout(() => {
          navigate(`/farmers/${farmer.id}`);
        }, 300);
        
        // Trigger callback if provided
        if (onFarmerSelect) {
          onFarmerSelect(farmer);
        }
      });

      markersRef.current.push(marker);
    });

    console.log(`✅ Added ${markersRef.current.length} enhanced farmer markers`);

    // Fit map to show all markers
    if (farmers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      if (userLocation) {
        bounds.extend(userLocation);
      }
      
      farmers.forEach(farmer => {
        let coords = null;
        if (farmer.location?.coordinates?.lat && farmer.location?.coordinates?.lng) {
          coords = farmer.location.coordinates;
        } else if (farmer.location?.lat && farmer.location?.lng) {
          coords = { lat: farmer.location.lat, lng: farmer.location.lng };
        }
        
        if (coords) {
          const position = {
            lat: coords.lat || coords.latitude,
            lng: coords.lng || coords.longitude
          };
          
          if (typeof position.lat === 'number' && typeof position.lng === 'number' &&
              position.lat >= -90 && position.lat <= 90 && 
              position.lng >= -180 && position.lng <= 180) {
            bounds.extend(position);
          }
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

  }, [isLoaded, farmers, products, onFarmerSelect, navigate]);

  // Handle selected farmer highlighting
  useEffect(() => {
    if (!selectedFarmer || !isLoaded) return;

    const marker = markersRef.current.find(m => 
      m.getTitle() === (selectedFarmer.farmName || selectedFarmer.farmerName || selectedFarmer.displayName)
    );

    if (marker) {
      mapInstanceRef.current.setCenter(marker.getPosition());
      mapInstanceRef.current.setZoom(13);
      
      const farmerProducts = products.filter(p => 
        (p.farmerId || p.rolnikId) === selectedFarmer.id
      );
      const detailedContent = createDetailedInfoContent(selectedFarmer, farmerProducts);
      
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(detailedContent);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      }
    }
  }, [selectedFarmer, isLoaded, products]);

  // Handle map type changes
  const handleMapTypeChange = (newMapType) => {
    setMapType(newMapType);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(newMapType);
    }
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
                  onClick={() => navigate(`/farmers/${farmer.id}`)}
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
              <p className="text-sm text-gray-600">Loading enhanced map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render enhanced map
  return (
    <Card className={`${className} ${isFullscreen ? 'farmers-map-fullscreen' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Interactive Farmers Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {farmers.length} farmer{farmers.length !== 1 ? 's' : ''} nearby
            </Badge>
            {showControls && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative p-0">
        <div 
          ref={mapRef}
          style={{ 
            height: isFullscreen ? '100vh' : height,
            width: '100%',
            borderRadius: isFullscreen ? '0' : '0 0 8px 8px'
          }}
          className="bg-gray-100 farmers-map-container"
        />
        
        {/* Map Type Controls */}
        {showControls && (
          <div className="map-type-selector">
            <button 
              className={`map-type-btn ${mapType === 'roadmap' ? 'active' : ''}`}
              onClick={() => handleMapTypeChange('roadmap')}
            >
              <Map className="w-3 h-3 mr-1" />
              Map
            </button>
            <button 
              className={`map-type-btn ${mapType === 'satellite' ? 'active' : ''}`}
              onClick={() => handleMapTypeChange('satellite')}
            >
              <Satellite className="w-3 h-3 mr-1" />
              Satellite
            </button>
          </div>
        )}

        {/* Map Legend */}
        {showLegend && (
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-dot user"></div>
              <span>Your location</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot verified"></div>
              <span>Verified farmers</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot unverified"></div>
              <span>Unverified farmers</span>
            </div>
          </div>
        )}

        {/* Center on User Button */}
        {showControls && userLocation && (
          <div className="map-controls">
            <button 
              className="map-control-btn"
              onClick={() => {
                if (mapInstanceRef.current && userLocation) {
                  mapInstanceRef.current.setCenter(userLocation);
                  mapInstanceRef.current.setZoom(11);
                }
              }}
              title="Center on my location"
            >
              <Navigation className="h-4 w-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FarmersMap;
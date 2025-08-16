// src/components/location/AddressPicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, X, Navigation } from 'lucide-react';
import GoogleMapsService from '../../services/googleMapsService';

const AddressPicker = ({ 
  value = '', 
  onChange, 
  placeholder = "Enter address...",
  userLocation = null,
  showCurrentLocationButton = true,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const inputRef = useRef(null);

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change with debounced suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputValue.length >= 3) {
        setLoading(true);
        try {
          const suggestions = await GoogleMapsService.getPlaceSuggestions(
            inputValue, 
            userLocation
          );
          setSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error getting suggestions:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, userLocation]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion) => {
    try {
      setLoading(true);
      const placeDetails = await GoogleMapsService.getPlaceDetails(suggestion.place_id);
      
      setInputValue(placeDetails.formatted_address);
      setShowSuggestions(false);
      
      if (onChange) {
        onChange({
          address: placeDetails.formatted_address,
          coordinates: {
            lat: placeDetails.lat,
            lng: placeDetails.lng
          },
          details: placeDetails
        });
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current location
  const handleCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      
      // Get current position
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }),
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

      // Reverse geocode to get address
      const addressData = await GoogleMapsService.reverseGeocode(
        position.lat, 
        position.lng
      );

      setInputValue(addressData.formatted_address);
      setShowSuggestions(false);

      if (onChange) {
        onChange({
          address: addressData.formatted_address,
          coordinates: position,
          details: addressData
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setGettingLocation(false);
    }
  };

  // Handle manual geocoding when user types full address
  const handleManualGeocode = async () => {
    if (!inputValue.trim()) return;

    try {
      setLoading(true);
      const result = await GoogleMapsService.geocodeAddress(inputValue);
      
      setInputValue(result.formatted_address);
      
      if (onChange) {
        onChange({
          address: result.formatted_address,
          coordinates: {
            lat: result.lat,
            lng: result.lng
          },
          details: result
        });
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && showSuggestions) {
        handleSuggestionSelect(suggestions[0]);
      } else {
        handleManualGeocode();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Clear input
  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (onChange) {
      onChange(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              className="pl-10 pr-8"
            />
            
            {inputValue && (
              <button
                onClick={handleClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1">
              <CardContent className="p-0">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-3"
                  >
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {suggestion.description}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {suggestion.types.slice(0, 2).map(type => (
                          <Badge 
                            key={type} 
                            variant="outline" 
                            className="text-xs"
                          >
                            {type.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Current Location Button */}
        {showCurrentLocationButton && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleCurrentLocation}
            disabled={gettingLocation}
            title="Use current location"
          >
            {gettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddressPicker;


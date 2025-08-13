// src/services/locationService.js
// Geographic services and delivery management

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS, calculateDistance, generateGeoHash } from '../lib/firebaseSchema';

export class LocationService {
  
  // Get user's current location
  static async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }
      
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = 'Unknown error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }
  
  // Geocode address to coordinates
  static async geocodeAddress(address) {
    try {
      // In a real app, use Google Maps Geocoding API or similar
      // For demo purposes, return approximate coordinates for Polish cities
      const polishCities = {
        'Kościerzyna': { lat: 54.1217, lng: 17.9763 },
        'Gdańsk': { lat: 54.3520, lng: 18.6466 },
        'Warsaw': { lat: 52.2297, lng: 21.0122 },
        'Kraków': { lat: 50.0647, lng: 19.9450 },
        'Wrocław': { lat: 51.1079, lng: 17.0385 }
      };
      
      const cityName = Object.keys(polishCities).find(city => 
        address.toLowerCase().includes(city.toLowerCase())
      );
      
      if (cityName) {
        return polishCities[cityName];
      }
      
      // Default to Kościerzyna if no match found
      return polishCities['Kościerzyna'];
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }
  
  // Update user location
  static async updateUserLocation(userId, locationData) {
    try {
      const { address, coordinates } = locationData;
      const geoHash = generateGeoHash(coordinates.lat, coordinates.lng);
      
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        'location.address': address,
        'location.coordinates': coordinates,
        'location.geoHash': geoHash,
        updatedAt: new Date()
      });
      
      return { address, coordinates, geoHash };
    } catch (error) {
      console.error('Error updating user location:', error);
      throw error;
    }
  }
  
  // Find nearby farmers
  static async findNearbyFarmers(customerLocation, maxDistance = 50) {
    try {
      const farmersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        farmersRef,
        where('role', 'in', ['farmer', 'rolnik'])
      );
      
      const snapshot = await getDocs(q);
      const nearbyFarmers = [];
      
      for (const doc of snapshot.docs) {
        const farmer = doc.data();
        
        if (!farmer.location?.coordinates) continue;
        
        const distance = calculateDistance(
          customerLocation.lat,
          customerLocation.lng,
          farmer.location.coordinates.lat,
          farmer.location.coordinates.lng
        );
        
        if (distance <= maxDistance) {
          nearbyFarmers.push({
            id: doc.id,
            ...farmer,
            distance,
            deliveryInfo: this.getDeliveryInfo(farmer, customerLocation)
          });
        }
      }
      
      return nearbyFarmers.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error finding nearby farmers:', error);
      throw error;
    }
  }
  
  // Check if farmer delivers to location
  static isInDeliveryZone(farmer, customerLocation) {
    if (!farmer.location?.deliveryZones || !customerLocation) {
      return { delivers: false, reason: 'No delivery zones configured' };
    }
    
    const farmerCoords = farmer.location.coordinates;
    if (!farmerCoords) {
      return { delivers: false, reason: 'Farmer location not set' };
    }
    
    const distance = calculateDistance(
      customerLocation.lat,
      customerLocation.lng,
      farmerCoords.lat,
      farmerCoords.lng
    );
    
    // Check each delivery zone
    for (const zone of farmer.location.deliveryZones) {
      if (zone.isActive && distance <= zone.radius) {
        return {
          delivers: true,
          distance,
          zone,
          deliveryFee: this.calculateDeliveryFee(distance, zone)
        };
      }
    }
    
    return { 
      delivers: false, 
      reason: `Outside delivery area (${distance.toFixed(1)}km away)`,
      distance 
    };
  }
  
  // Calculate delivery fee
  static calculateDeliveryFee(distance, zone, orderTotal = 0) {
    if (!zone) return 0;
    
    // Free delivery threshold
    if (zone.freeDeliveryThreshold && orderTotal >= zone.freeDeliveryThreshold) {
      return 0;
    }
    
    // Base delivery fee
    let fee = zone.deliveryFee || 0;
    
    // Additional fee for longer distances (optional)
    if (distance > 10) {
      fee += Math.ceil((distance - 10) / 5) * 2; // 2 EUR per extra 5km
    }
    
    return Math.max(0, fee);
  }
  
  // Get delivery information for farmer
  static getDeliveryInfo(farmer, customerLocation) {
    const deliveryCheck = this.isInDeliveryZone(farmer, customerLocation);
    
    return {
      delivers: deliveryCheck.delivers,
      distance: deliveryCheck.distance,
      deliveryFee: deliveryCheck.deliveryFee || 0,
      freeDeliveryThreshold: deliveryCheck.zone?.freeDeliveryThreshold,
      estimatedTime: this.estimateDeliveryTime(deliveryCheck.distance),
      reason: deliveryCheck.reason
    };
  }
  
  // Estimate delivery time based on distance
  static estimateDeliveryTime(distance) {
    if (!distance) return 'Unknown';
    
    if (distance <= 5) return '30-60 minutes';
    if (distance <= 15) return '1-2 hours';
    if (distance <= 30) return '2-4 hours';
    return 'Next day';
  }
  
  // Add delivery address for customer
  static async addDeliveryAddress(userId, addressData) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const user = userDoc.data();
      const deliveryAddresses = user.location?.deliveryAddresses || [];
      
      // Generate coordinates if not provided
      let coordinates = addressData.coordinates;
      if (!coordinates) {
        coordinates = await this.geocodeAddress(addressData.address);
      }
      
      const newAddress = {
        id: doc(collection(db, 'temp')).id,
        label: addressData.label || 'Address',
        address: addressData.address,
        coordinates,
        isDefault: addressData.isDefault || deliveryAddresses.length === 0,
        deliveryInstructions: addressData.deliveryInstructions || '',
        createdAt: new Date()
      };
      
      // If this is set as default, unset others
      if (newAddress.isDefault) {
        deliveryAddresses.forEach(addr => addr.isDefault = false);
      }
      
      deliveryAddresses.push(newAddress);
      
      await updateDoc(userRef, {
        'location.deliveryAddresses': deliveryAddresses,
        updatedAt: new Date()
      });
      
      return newAddress;
    } catch (error) {
      console.error('Error adding delivery address:', error);
      throw error;
    }
  }
  
  // Update delivery zones for farmer
  static async updateDeliveryZones(farmerId, deliveryZones) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, farmerId);
      
      await updateDoc(userRef, {
        'location.deliveryZones': deliveryZones.map(zone => ({
          ...zone,
          updatedAt: new Date()
        })),
        updatedAt: new Date()
      });
      
      return deliveryZones;
    } catch (error) {
      console.error('Error updating delivery zones:', error);
      throw error;
    }
  }
  
  // Get optimal delivery route for farmer
  static async getOptimalDeliveryRoute(farmerId, orderIds) {
    try {
      const orders = [];
      
      // Fetch order details
      for (const orderId of orderIds) {
        const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (orderDoc.exists()) {
          orders.push({
            id: orderId,
            ...orderDoc.data()
          });
        }
      }
      
      if (orders.length === 0) {
        return { route: [], totalDistance: 0, estimatedTime: 0 };
      }
      
      // Get farmer location
      const farmerRef = doc(db, COLLECTIONS.USERS, farmerId);
      const farmerDoc = await getDoc(farmerRef);
      
      if (!farmerDoc.exists()) {
        throw new Error('Farmer not found');
      }
      
      const farmerLocation = farmerDoc.data().location?.coordinates;
      if (!farmerLocation) {
        throw new Error('Farmer location not set');
      }
      
      // Simple nearest neighbor algorithm for route optimization
      const route = this.optimizeRoute(farmerLocation, orders);
      
      return route;
    } catch (error) {
      console.error('Error getting optimal delivery route:', error);
      throw error;
    }
  }
  
  // Optimize delivery route using nearest neighbor algorithm
  static optimizeRoute(startLocation, orders) {
    if (orders.length === 0) {
      return { route: [], totalDistance: 0, estimatedTime: 0 };
    }
    
    const route = [];
    const unvisited = [...orders];
    let currentLocation = startLocation;
    let totalDistance = 0;
    
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      
      // Find nearest unvisited order
      unvisited.forEach((order, index) => {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          order.delivery.coordinates.lat,
          order.delivery.coordinates.lng
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      
      // Add nearest order to route
      const nearestOrder = unvisited[nearestIndex];
      route.push({
        ...nearestOrder,
        distanceFromPrevious: nearestDistance,
        estimatedArrival: this.calculateArrivalTime(totalDistance + nearestDistance)
      });
      
      totalDistance += nearestDistance;
      currentLocation = nearestOrder.delivery.coordinates;
      unvisited.splice(nearestIndex, 1);
    }
    
    // Add return to farm
    const returnDistance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      startLocation.lat,
      startLocation.lng
    );
    
    totalDistance += returnDistance;
    
    return {
      route,
      totalDistance: Math.round(totalDistance * 10) / 10,
      estimatedTime: this.calculateTotalDeliveryTime(totalDistance),
      returnDistance
    };
  }
  
  // Calculate arrival time based on distance
  static calculateArrivalTime(cumulativeDistance) {
    // Assume 30 km/h average speed including stops
    const hours = cumulativeDistance / 30;
    const now = new Date();
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }
  
  // Calculate total delivery time
  static calculateTotalDeliveryTime(totalDistance) {
    // Average speed including delivery stops
    const avgSpeedWithStops = 25; // km/h
    const hours = totalDistance / avgSpeedWithStops;
    return Math.ceil(hours * 60); // Return in minutes
  }
  
  // Get delivery statistics for farmer
  static async getDeliveryStats(farmerId, dateRange = null) {
    try {
      const ordersRef = collection(db, COLLECTIONS.ORDERS);
      let q = query(
        ordersRef,
        where('farmerId', '==', farmerId),
        where('status', 'in', ['delivered', 'shipped'])
      );
      
      if (dateRange) {
        q = query(q, 
          where('createdAt', '>=', dateRange.start),
          where('createdAt', '<=', dateRange.end)
        );
      }
      
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate statistics
      const totalOrders = orders.length;
      const totalDistance = orders.reduce((sum, order) => {
        if (order.delivery?.distance) {
          return sum + order.delivery.distance;
        }
        return sum;
      }, 0);
      
      const averageDistance = totalOrders > 0 ? totalDistance / totalOrders : 0;
      
      // Delivery zones analysis
      const zoneStats = {};
      orders.forEach(order => {
        const distance = order.delivery?.distance || 0;
        let zone = 'unknown';
        
        if (distance <= 10) zone = '0-10km';
        else if (distance <= 20) zone = '10-20km';
        else if (distance <= 30) zone = '20-30km';
        else zone = '30km+';
        
        zoneStats[zone] = (zoneStats[zone] || 0) + 1;
      });
      
      return {
        totalOrders,
        totalDistance: Math.round(totalDistance * 10) / 10,
        averageDistance: Math.round(averageDistance * 10) / 10,
        zoneDistribution: zoneStats,
        estimatedFuelCost: this.calculateFuelCost(totalDistance),
        carbonFootprint: this.calculateCarbonFootprint(totalDistance)
      };
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      throw error;
    }
  }
  
  // Calculate estimated fuel cost
  static calculateFuelCost(totalDistance) {
    // Assumptions: 8L/100km, 1.50 EUR/L
    const fuelConsumption = (totalDistance / 100) * 8;
    const fuelPrice = 1.50;
    return Math.round(fuelConsumption * fuelPrice * 100) / 100;
  }
  
  // Calculate carbon footprint
  static calculateCarbonFootprint(totalDistance) {
    // Assumption: 2.3 kg CO2 per liter of fuel, 8L/100km
    const fuelConsumption = (totalDistance / 100) * 8;
    const co2PerLiter = 2.3;
    return Math.round(fuelConsumption * co2PerLiter * 100) / 100;
  }
  
  // Validate delivery address
  static validateAddress(address) {
    const errors = [];
    
    if (!address.address || address.address.trim().length < 10) {
      errors.push('Address must be at least 10 characters long');
    }
    
    if (!address.label || address.label.trim().length === 0) {
      errors.push('Address label is required');
    }
    
    if (address.coordinates) {
      if (typeof address.coordinates.lat !== 'number' || 
          address.coordinates.lat < -90 || address.coordinates.lat > 90) {
        errors.push('Invalid latitude');
      }
      
      if (typeof address.coordinates.lng !== 'number' || 
          address.coordinates.lng < -180 || address.coordinates.lng > 180) {
        errors.push('Invalid longitude');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Get areas served by farmer
  static async getAreasServed(farmerId) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, farmerId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('Farmer not found');
      }
      
      const farmer = userDoc.data();
      const deliveryZones = farmer.location?.deliveryZones || [];
      const farmerLocation = farmer.location?.coordinates;
      
      if (!farmerLocation) {
        return [];
      }
      
      return deliveryZones.map(zone => ({
        radius: zone.radius,
        deliveryFee: zone.deliveryFee,
        freeDeliveryThreshold: zone.freeDeliveryThreshold,
        isActive: zone.isActive,
        centerPoint: farmerLocation,
        coverage: this.calculateCoverageArea(zone.radius)
      }));
    } catch (error) {
      console.error('Error getting areas served:', error);
      throw error;
    }
  }
  
  // Calculate coverage area
  static calculateCoverageArea(radius) {
    // Area = π * r²
    const area = Math.PI * Math.pow(radius, 2);
    return Math.round(area);
  }
  
  // Get delivery time slots
  static getDeliveryTimeSlots(distance) {
    const baseDate = new Date();
    const slots = [];
    
    // Add time slots for next 7 days
    for (let day = 1; day <= 7; day++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + day);
      
      // Skip Sundays
      if (date.getDay() === 0) continue;
      
      const daySlots = this.getDayTimeSlots(date, distance);
      slots.push(...daySlots);
    }
    
    return slots;
  }
  
  // Get time slots for a specific day
  static getDayTimeSlots(date, distance) {
    const slots = [];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Different time slots based on distance
    let timeSlots = [];
    if (distance <= 10) {
      timeSlots = ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'];
    } else if (distance <= 25) {
      timeSlots = ['09:00-12:00', '14:00-17:00'];
    } else {
      timeSlots = ['10:00-15:00'];
    }
    
    timeSlots.forEach(timeSlot => {
      slots.push({
        date: date.toISOString().split('T')[0],
        time: timeSlot,
        label: `${dayName}, ${date.toLocaleDateString()} ${timeSlot}`,
        available: true // In real app, check against farmer's schedule
      });
    });
    
    return slots;
  }
}
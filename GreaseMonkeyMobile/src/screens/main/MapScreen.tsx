import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const MapScreen = ({ navigation }: any) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (error) {
      setErrorMsg('Error getting location');
      console.error('Location error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindRides = () => {
    if (location) {
      // Navigate to rides with current location
      navigation.navigate('Rides', { 
        userLocation: {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        }
      });
    }
  };

  const handleCreateRide = () => {
    if (location) {
      navigation.navigate('CreateRide', {
        startLocation: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          address: 'Current Location'
        }
      });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (errorMsg || !location) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Map</Text>
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={80} color="#666" />
          <Text style={styles.errorTitle}>Location Access Needed</Text>
          <Text style={styles.errorMessage}>
            GreaseMonkey needs location access to help you find rides and plan routes with friends.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.retryButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => Alert.alert('Settings', 'Map settings coming soon!')}
        >
          <Ionicons name="settings-outline" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Placeholder for map - In a real app, you would use react-native-maps here */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapContent}>
          <Ionicons name="map" size={100} color="#FF6B35" />
          <Text style={styles.mapTitle}>Interactive Map</Text>
          <Text style={styles.mapSubtitle}>
            Your current location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
          </Text>
          <Text style={styles.mapNote}>
            Map integration with react-native-maps would be implemented here for production
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleFindRides}
        >
          <Ionicons name="search" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Find Nearby Rides</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleCreateRide}
        >
          <Ionicons name="add-circle" size={24} color="#FF6B35" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Create Ride Here
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Ionicons name="car-sport" size={24} color="#FF6B35" />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Nearby Rides</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="people" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Friends Online</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="location" size={24} color="#2196F3" />
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Meeting Points</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  mapTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  mapSubtitle: {
    color: '#CCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  mapNote: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#FF6B35',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  errorMessage: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
});

export default MapScreen;
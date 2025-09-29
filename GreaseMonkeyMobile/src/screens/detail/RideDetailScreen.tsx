import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

interface Ride {
  id: string;
  title: string;
  description: string;
  startLocation: string;
  endLocation?: string;
  startTime: string;
  maxParticipants?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  distance?: number;
  estimatedDuration?: number;
  status: 'active' | 'cancelled' | 'completed';
  creator: {
    id: string;
    username: string;
    full_name: string;
  };
  participants: Array<{
    id: string;
    username: string;
    full_name: string;
    joinedAt: string;
  }>;
  isJoined: boolean;
}

const RideDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { rideId } = route.params as { rideId: string };
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningRide, setJoiningRide] = useState(false);

  useEffect(() => {
    loadRideDetails();
  }, [rideId]);

  const loadRideDetails = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Mock ride data
      const mockRide: Ride = {
        id: rideId,
        title: 'Weekend Mountain Adventure',
        description: 'Join us for an epic mountain ride through winding roads and scenic views. Perfect for intermediate riders looking for a challenge!',
        startLocation: 'Mountain View Parking Lot, Highway 1',
        endLocation: 'Sunset Beach Café',
        startTime: '2024-02-15T09:00:00Z',
        maxParticipants: 8,
        difficulty: 'medium',
        distance: 120,
        estimatedDuration: 180, // minutes
        status: 'active',
        creator: {
          id: 'creator123',
          username: 'rideleader',
          full_name: 'Alex Mountain',
        },
        participants: [
          {
            id: 'user1',
            username: 'speedster',
            full_name: 'Mike Speed',
            joinedAt: '2024-02-10T14:30:00Z',
          },
          {
            id: 'user2',
            username: 'cruiser_girl',
            full_name: 'Sarah Cruise',
            joinedAt: '2024-02-11T10:15:00Z',
          },
        ],
        isJoined: Math.random() > 0.5,
      };
      
      setRide(mockRide);
    } catch (error) {
      Alert.alert('Error', 'Failed to load ride details');
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  const handleJoinRide = async () => {
    if (!ride) return;
    
    setJoiningRide(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRide(prev => prev ? {
        ...prev,
        isJoined: !prev.isJoined,
        participants: prev.isJoined 
          ? prev.participants.filter(p => p.id !== user?.id)
          : [...prev.participants, {
              id: user?.id || 'current_user',
              username: user?.username || 'current_user',
              full_name: user?.full_name || 'Current User',
              joinedAt: new Date().toISOString(),
            }]
      } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to join/leave ride');
    }
    setJoiningRide(false);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#666';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'leaf-outline';
      case 'medium': return 'trail-sign-outline';
      case 'hard': return 'flash-outline';
      default: return 'help-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="bicycle-outline" size={48} color="#FF6B35" />
        <Text style={styles.errorText}>Ride not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadRideDetails()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dateTime = formatDateTime(ride.startTime);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRideDetails(true)}
            tintColor="#FF6B35"
          />
        }
      >
        {/* Title and Creator */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{ride.title}</Text>
          <View style={styles.creatorInfo}>
            <View style={styles.creatorAvatar}>
              <Text style={styles.creatorAvatarText}>
                {ride.creator.full_name.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.creatorName}>{ride.creator.full_name}</Text>
              <Text style={styles.creatorUsername}>@{ride.creator.username}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{ride.description}</Text>
        </View>

        {/* Ride Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{dateTime.date}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#FF6B35" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Start Time</Text>
                <Text style={styles.infoValue}>{dateTime.time}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name={getDifficultyIcon(ride.difficulty) as any} size={20} color={getDifficultyColor(ride.difficulty)} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Difficulty</Text>
                <Text style={[styles.infoValue, { color: getDifficultyColor(ride.difficulty) }]}>
                  {ride.difficulty.charAt(0).toUpperCase() + ride.difficulty.slice(1)}
                </Text>
              </View>
            </View>

            {ride.distance && (
              <View style={styles.infoItem}>
                <Ionicons name="speedometer-outline" size={20} color="#FF6B35" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Distance</Text>
                  <Text style={styles.infoValue}>{ride.distance} km</Text>
                </View>
              </View>
            )}

            {ride.estimatedDuration && (
              <View style={styles.infoItem}>
                <Ionicons name="timer-outline" size={20} color="#FF6B35" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{Math.floor(ride.estimatedDuration / 60)}h {ride.estimatedDuration % 60}m</Text>
                </View>
              </View>
            )}

            <View style={styles.infoItem}>
              <Ionicons name="people-outline" size={20} color="#FF6B35" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Participants</Text>
                <Text style={styles.infoValue}>
                  {ride.participants.length}{ride.maxParticipants ? `/${ride.maxParticipants}` : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, styles.startDot]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Start</Text>
                <Text style={styles.routeLocation}>{ride.startLocation}</Text>
              </View>
            </View>
            
            {ride.endLocation && (
              <>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, styles.endDot]} />
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeLabel}>End</Text>
                    <Text style={styles.routeLocation}>{ride.endLocation}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants ({ride.participants.length})</Text>
          
          {ride.participants.map((participant) => (
            <View key={participant.id} style={styles.participant}>
              <View style={styles.participantAvatar}>
                <Text style={styles.participantAvatarText}>
                  {participant.full_name.charAt(0)}
                </Text>
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{participant.full_name}</Text>
                <Text style={styles.participantUsername}>@{participant.username}</Text>
              </View>
              <Text style={styles.joinedDate}>
                {new Date(participant.joinedAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Join/Leave Button */}
      {ride.status === 'active' && ride.creator.id !== user?.id && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, ride.isJoined && styles.leaveButton]}
            onPress={handleJoinRide}
            disabled={joiningRide}
          >
            {joiningRide ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons 
                  name={ride.isJoined ? "exit-outline" : "add-outline"} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.actionButtonText}>
                  {ride.isJoined ? 'Leave Ride' : 'Join Ride'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  titleSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  creatorName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  creatorUsername: {
    color: '#666',
    fontSize: 14,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 8,
    flex: 1,
  },
  infoLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  routeContainer: {
    paddingLeft: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  startDot: {
    backgroundColor: '#4CAF50',
  },
  endDot: {
    backgroundColor: '#F44336',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#404040',
    marginLeft: 5,
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 2,
  },
  routeLocation: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  participantUsername: {
    color: '#666',
    fontSize: 12,
  },
  joinedDate: {
    color: '#666',
    fontSize: 12,
  },
  actionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  leaveButton: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default RideDetailScreen;
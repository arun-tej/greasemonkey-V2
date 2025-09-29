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

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  location?: string;
  created_at: string;
  post_count: number;
  ride_count: number;
  garages: string[];
  friends: string[];
}

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: currentUser } = useAuth();
  const { userId } = route.params as { userId: string };
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = userId === currentUser?.id;

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Mock user data for now
      const mockUser: UserProfile = {
        id: userId,
        username: 'rider_' + userId.substring(0, 8),
        full_name: 'Motorcycle Enthusiast',
        bio: 'Love riding through mountain roads and exploring new destinations. Kawasaki Ninja owner.',
        location: 'California, USA',
        created_at: '2024-01-15T10:00:00Z',
        post_count: 42,
        ride_count: 15,
        garages: ['garage1', 'garage2'],
        friends: ['friend1', 'friend2', 'friend3'],
      };
      
      setUser(mockUser);
      setIsFollowing(Math.random() > 0.5); // Random follow status
    } catch (error) {
      Alert.alert('Error', 'Failed to load user profile');
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  const handleFollowToggle = async () => {
    try {
      setIsFollowing(!isFollowing);
      // API call would go here
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status');
      setIsFollowing(isFollowing); // Revert on error
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-circle-outline" size={48} color="#FF6B35" />
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadUserProfile()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadUserProfile(true)}
            tintColor="#FF6B35"
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.full_name?.charAt(0) || 'U'}
            </Text>
          </View>
          
          <Text style={styles.fullName}>{user.full_name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          
          {user.bio && (
            <Text style={styles.bio}>{user.bio}</Text>
          )}
          
          <View style={styles.metaInfo}>
            {user.location && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{user.location}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{formatJoinDate(user.created_at)}</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isOwnProfile ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProfile' as never)}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.followButton, isFollowing && styles.followingButton]}
                  onPress={handleFollowToggle}
                >
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageButton}>
                  <Ionicons name="mail-outline" size={20} color="#FF6B35" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.post_count}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.ride_count}</Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.garages.length}</Text>
            <Text style={styles.statLabel}>Garages</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.friends.length}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

        {/* Activity Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Rides</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Garages</Text>
          </TouchableOpacity>
        </View>

        {/* Content Placeholder */}
        <View style={styles.contentPlaceholder}>
          <Ionicons name="grid-outline" size={48} color="#666" />
          <Text style={styles.placeholderText}>No posts yet</Text>
          <Text style={styles.placeholderSubtext}>
            {isOwnProfile ? 'Share your first motorcycle adventure!' : 'This user hasn\'t posted anything yet.'}
          </Text>
        </View>
      </ScrollView>
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
  menuButton: {
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
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 24,
  },
  fullName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    color: '#666',
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#404040',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  followButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
  },
  followingButton: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#404040',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: '#666',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#404040',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF6B35',
  },
  contentPlaceholder: {
    alignItems: 'center',
    padding: 48,
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
  },
  placeholderSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default UserProfileScreen;
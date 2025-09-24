import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import FeedScreen from '../screens/main/FeedScreen';
import RidesScreen from '../screens/main/RidesScreen';
import FriendsScreen from '../screens/main/FriendsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import MapScreen from '../screens/main/MapScreen';

// Detail Screens
import RideDetailScreen from '../screens/detail/RideDetailScreen';
import CreateRideScreen from '../screens/detail/CreateRideScreen';
import PostDetailScreen from '../screens/detail/PostDetailScreen';
import CreatePostScreen from '../screens/detail/CreatePostScreen';
import UserProfileScreen from '../screens/detail/UserProfileScreen';
import EditProfileScreen from '../screens/detail/EditProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'home';

        if (route.name === 'Feed') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Rides') {
          iconName = focused ? 'car-sport' : 'car-sport-outline';
        } else if (route.name === 'Map') {
          iconName = focused ? 'map' : 'map-outline';
        } else if (route.name === 'Friends') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#FF6B35',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Feed" component={FeedScreen} />
    <Tab.Screen name="Rides" component={RidesScreen} />
    <Tab.Screen name="Map" component={MapScreen} />
    <Tab.Screen name="Friends" component={FriendsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="RideDetail" 
      component={RideDetailScreen}
      options={{ title: 'Ride Details' }}
    />
    <Stack.Screen 
      name="CreateRide" 
      component={CreateRideScreen}
      options={{ title: 'Create Ride' }}
    />
    <Stack.Screen 
      name="PostDetail" 
      component={PostDetailScreen}
      options={{ title: 'Post Details' }}
    />
    <Stack.Screen 
      name="CreatePost" 
      component={CreatePostScreen}
      options={{ title: 'Create Post' }}
    />
    <Stack.Screen 
      name="UserProfile" 
      component={UserProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{ title: 'Edit Profile' }}
    />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};
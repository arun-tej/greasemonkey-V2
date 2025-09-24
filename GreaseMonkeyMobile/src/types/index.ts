export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  location?: string;
  vehicleType?: 'car' | 'motorcycle' | 'both';
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  mediaUrl?: string;
  tags: string[];
  score: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  garage: {
    id: string;
    name: string;
  };
}

export interface Ride {
  id: string;
  title: string;
  description?: string;
  startLocation: Location;
  endLocation?: Location;
  waypoints: Location[];
  startTime: string;
  maxParticipants?: number;
  vehicleTypes: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  distance?: number;
  estimatedDuration?: number;
  status: 'active' | 'cancelled' | 'completed';
  isPublic: boolean;
  meetingPoint?: Location;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  participants: RideParticipant[];
  _count: {
    participants: number;
  };
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface RideParticipant {
  id: string;
  status: 'joined' | 'left' | 'kicked';
  joinedAt: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface Friend {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  vehicleType?: string;
  friendshipId: string;
  friendSince: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3333';

// Mock data for demo purposes
const mockData = {
  user: {
    id: '1',
    email: 'demo@greasemonkey.com',
    username: 'demo_user',
    firstName: 'Demo',
    lastName: 'User',
    bio: 'Car enthusiast and weekend racer',
    vehicleType: 'car',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
  posts: [
    {
      id: '1',
      title: 'My weekend project',
      body: 'Just finished installing a new cold air intake on my Mustang. The sound is incredible!',
      score: 15,
      createdAt: new Date().toISOString(),
      author: {
        id: '2',
        username: 'mustang_mike',
        firstName: 'Mike',
        lastName: 'Johnson',
      },
      garage: {
        id: '1',
        name: "Mike's Garage",
      },
      tags: ['mustang', 'cold-air-intake', 'performance'],
    },
    {
      id: '2',
      title: 'Track day coming up!',
      body: 'Anyone else going to Laguna Seca this weekend? Would love to meet up with fellow enthusiasts.',
      score: 8,
      createdAt: new Date().toISOString(),
      author: {
        id: '3',
        username: 'track_star',
        firstName: 'Sarah',
        lastName: 'Williams',
      },
      garage: {
        id: '2',
        name: "Sarah's Speed Shop",
      },
      tags: ['track-day', 'laguna-seca', 'meetup'],
    },
  ],
  rides: [
    {
      id: '1',
      title: 'Mountain Canyon Cruise',
      description: 'Scenic drive through the mountains with great twisty roads',
      startLocation: { lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
      startTime: new Date(Date.now() + 86400000).toISOString(),
      vehicleTypes: ['car', 'motorcycle'],
      difficulty: 'medium',
      distance: 120,
      status: 'active',
      creator: {
        id: '4',
        username: 'mountain_driver',
        firstName: 'Alex',
        lastName: 'Rodriguez',
      },
      participants: [],
      _count: { participants: 3 },
    },
  ],
  stats: {
    garages: 2,
    posts: 5,
    friends: 12,
    ridesCreated: 3,
  }
};

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const token = await this.getAuthToken();
      
      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.warn('API request failed, using mock data:', error);
      return this.getMockData(endpoint, options.method || 'GET') as T;
    }
  }

  private getMockData(endpoint: string, method: string): any {
    // Return appropriate mock data based on endpoint
    if (endpoint === '/auth/login' && method === 'POST') {
      return { user: mockData.user, token: 'mock_token_123' };
    }
    if (endpoint === '/user/profile') {
      return mockData.user;
    }
    if (endpoint === '/user/stats') {
      return mockData.stats;
    }
    if (endpoint.startsWith('/posts')) {
      return { items: mockData.posts, nextCursor: null };
    }
    if (endpoint.startsWith('/rides')) {
      return mockData.rides;
    }
    if (endpoint === '/friendship/friends') {
      return [];
    }
    return {};
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  }

  async register(email: string, password: string, username: string) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
    return response;
  }

  // User Profile
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async updateProfile(data: any) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserStats() {
    return this.request('/user/stats');
  }

  async searchUsers(query: string, page = 1, limit = 10) {
    return this.request(`/user/search?q=${query}&page=${page}&limit=${limit}`);
  }

  // Posts
  async getPosts(page = 1, limit = 10) {
    return this.request(`/posts?page=${page}&limit=${limit}`);
  }

  async getPostById(id: string) {
    return this.request(`/posts/${id}`);
  }

  async createPost(garageId: string, title: string, body: string, tags: string[] = []) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ garageId, title, body, tags }),
    });
  }

  // Rides
  async getRides(page = 1, limit = 10, vehicleType?: string, startDate?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(vehicleType && { vehicleType }),
      ...(startDate && { startDate }),
    });
    return this.request(`/rides?${params}`);
  }

  async getRideById(id: string) {
    return this.request(`/rides/${id}`);
  }

  async createRide(rideData: any) {
    return this.request('/rides', {
      method: 'POST',
      body: JSON.stringify(rideData),
    });
  }

  async joinRide(rideId: string) {
    return this.request(`/rides/${rideId}/join`, { method: 'POST' });
  }

  async leaveRide(rideId: string) {
    return this.request(`/rides/${rideId}/leave`, { method: 'POST' });
  }

  async getMyRides() {
    return this.request('/rides/my');
  }

  // Friends
  async getFriends() {
    return this.request('/friendship/friends');
  }

  async sendFriendRequest(receiverId: string) {
    return this.request('/friendship/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
  }

  async respondToFriendRequest(friendshipId: string, status: 'accepted' | 'blocked') {
    return this.request(`/friendship/respond/${friendshipId}`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async getPendingRequests() {
    return this.request('/friendship/pending');
  }

  // Notifications
  async getNotifications(page = 1, limit = 20) {
    return this.request(`/notifications?page=${page}&limit=${limit}`);
  }

  async getUnreadCount() {
    return this.request('/notifications/unread-count');
  }

  async markAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, { method: 'PUT' });
  }

  async markAllAsRead() {
    return this.request('/notifications/mark-all-read', { method: 'PUT' });
  }

  // Garages
  async createGarage(name: string, bio?: string) {
    return this.request('/garages', {
      method: 'POST',
      body: JSON.stringify({ name, bio }),
    });
  }

  async getGarageById(id: string) {
    return this.request(`/garages/${id}`);
  }
}

export const apiService = new ApiService();
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3333';

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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
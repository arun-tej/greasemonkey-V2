import AsyncStorage from '@react-native-async-storage/async-storage';

// Use localhost for development - same as our backend
const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('greasemonkey_token');
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
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication - Updated to match our backend API
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  }

  async register(userData: {
    email: string;
    password: string;
    username: string;
    full_name: string;
    bio?: string;
    location?: string;
  }) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  }

  // User Profile - Updated to match our backend API
  async getUserProfile() {
    return this.request('/auth/me');
  }

  // Garages - Updated to match our backend API
  async getGarages() {
    return this.request('/garages/');
  }

  async createGarage(garageData: {
    name: string;
    description?: string;
    location?: string;
    is_private?: boolean;
  }) {
    return this.request('/garages/', {
      method: 'POST',
      body: JSON.stringify(garageData),
    });
  }

  async joinGarage(garageId: string) {
    return this.request(`/garages/${garageId}/join`, {
      method: 'POST',
    });
  }

  async discoverGarages() {
    return this.request('/garages/discover');
  }

  // Posts - Updated to match our backend API
  async getPosts(garageId?: string, limit = 20, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(garageId && { garage_id: garageId }),
    });
    return this.request(`/posts/?${params}`);
  }

  async getPostById(id: string) {
    return this.request(`/posts/${id}`);
  }

  async createPost(postData: {
    content: string;
    garage_id?: string;
    image_urls?: string[];
    hashtags?: string[];
  }) {
    return this.request('/posts/', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async voteOnPost(postId: string, voteType: 'like' | 'dislike' | 'remove') {
    return this.request(`/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    });
  }

  // Comments - Updated to match our backend API
  async getComments(postId: string, limit = 50, offset = 0) {
    const params = new URLSearchParams({
      post_id: postId,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.request(`/comments/?${params}`);
  }

  async createComment(commentData: {
    post_id: string;
    content: string;
  }) {
    return this.request('/comments/', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async toggleCommentLike(commentId: string) {
    return this.request(`/comments/${commentId}/like`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
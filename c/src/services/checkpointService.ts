// src/services/checkpointService.ts

import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types
export interface CheckpointImage {
  url: string;
  file?: File;
}

export interface CheckpointLocation {
  title: string;
  province: string;
  municipality: string;
  barangay: string;
  street: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

export interface CheckpointData {
  id?: string;
  title: string;
  province: string;
  municipality: string;
  barangay: string;
  street: string;
  full_address: string;
  latitude: number;
  longitude: number;
  image_urls: string[];
  reported_by?: string;
  reporter_name?: string;
  reporter_avatar?: string;
  status: 'active' | 'expired' | 'reported';
  likes: number;
  dislikes: number;
  created_at?: string;
  expires_at?: string;
  comments?: CheckpointComment[];
}

export interface CheckpointComment {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar: string;
}

export interface CheckpointReaction {
  reaction: 'like' | 'dislike' | null;
}

export interface CheckpointsResponse {
  checkpoints: CheckpointData[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateCheckpointRequest {
  title: string;
  province: string;
  municipality: string;
  barangay: string;
  street: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
}

export interface AddCommentRequest {
  content: string;
}

// Helper function for authenticated requests
const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

class CheckpointService {
  private static instance: CheckpointService;
  
  public static getInstance(): CheckpointService {
    if (!CheckpointService.instance) {
      CheckpointService.instance = new CheckpointService();
    }
    return CheckpointService.instance;
  }

  /**
   * Upload images to server
   * @param files - Array of image files
   * @returns Array of image URLs
   */
  async uploadImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await fetch(`${API_URL}/checkpoints/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload images');
    }

    const result = await response.json();
    return result.imageUrls;
  }

  /**
   * Create a new checkpoint report
   * @param data - Checkpoint data
   * @param images - Optional image files to upload
   */
  async createCheckpoint(
    data: Omit<CreateCheckpointRequest, 'imageUrls'>,
    images?: File[]
  ): Promise<CheckpointData> {
    // Upload images first if any
    let imageUrls: string[] = [];
    if (images && images.length > 0) {
      imageUrls = await this.uploadImages(images);
    }

    const requestData: CreateCheckpointRequest = {
      ...data,
      imageUrls
    };

    const response = await fetch(`${API_URL}/checkpoints`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkpoint');
    }

    return response.json();
  }

  /**
   * Get all checkpoints with pagination and search
   * @param options - Query options
   */
  async getCheckpoints(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: 'active' | 'expired' | 'reported';
  }): Promise<CheckpointsResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.search) params.append('search', options.search);
    if (options?.status) params.append('status', options.status);

    const url = `${API_URL}/checkpoints${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch checkpoints');
    }

    return response.json();
  }

  /**
   * Get a single checkpoint by ID
   * @param id - Checkpoint ID
   */
  async getCheckpoint(id: string): Promise<CheckpointData> {
    const response = await fetch(`${API_URL}/checkpoints/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch checkpoint');
    }

    return response.json();
  }

  /**
   * Add a reaction (like/dislike) to a checkpoint
   * @param checkpointId - Checkpoint ID
   * @param type - Reaction type ('like' or 'dislike')
   */
  async addReaction(checkpointId: string, type: 'like' | 'dislike'): Promise<{ reaction: string | null }> {
    const response = await fetch(`${API_URL}/checkpoints/${checkpointId}/react`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add reaction');
    }

    return response.json();
  }

  /**
   * Get user's reaction to a checkpoint
   * @param checkpointId - Checkpoint ID
   */
  async getUserReaction(checkpointId: string): Promise<CheckpointReaction> {
    const response = await fetch(`${API_URL}/checkpoints/${checkpointId}/reaction`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user reaction');
    }

    return response.json();
  }

  /**
   * Add a comment to a checkpoint
   * @param checkpointId - Checkpoint ID
   * @param content - Comment content
   */
  async addComment(checkpointId: string, content: string): Promise<CheckpointComment> {
    const response = await fetch(`${API_URL}/checkpoints/${checkpointId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add comment');
    }

    return response.json();
  }

  /**
   * Get comments for a checkpoint
   * @param checkpointId - Checkpoint ID
   * @param options - Pagination options
   */
  async getComments(
    checkpointId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ comments: CheckpointComment[]; limit: number; offset: number }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const url = `${API_URL}/checkpoints/${checkpointId}/comments${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch comments');
    }

    return response.json();
  }

  /**
   * Get checkpoints near a location
   * @param lat - Latitude
   * @param lng - Longitude
   * @param radiusKm - Radius in kilometers (default: 10)
   */
  async getNearbyCheckpoints(lat: number, lng: number, radiusKm: number = 10): Promise<CheckpointData[]> {
    const response = await fetch(
      `${API_URL}/checkpoints/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch nearby checkpoints');
    }

    return response.json();
  }

  /**
   * Get checkpoints reported by the current user
   * @param options - Pagination options
   */
  async getUserCheckpoints(options?: { limit?: number; offset?: number }): Promise<CheckpointsResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const url = `${API_URL}/checkpoints/user${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user checkpoints');
    }

    return response.json();
  }

  /**
   * Report a checkpoint as suspicious/fake
   * @param checkpointId - Checkpoint ID
   * @param reason - Reason for reporting
   */
  async reportCheckpoint(checkpointId: string, reason: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/checkpoints/${checkpointId}/report`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to report checkpoint');
    }

    return response.json();
  }
}

// Export singleton instance
export const checkpointService = CheckpointService.getInstance();

// Also export the class for testing
export { CheckpointService };
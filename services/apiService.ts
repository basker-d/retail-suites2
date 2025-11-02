
import { User, GeneratedVideo, AspectRatio } from '../types';

const API_BASE_URL = 'http://localhost:3001/api'; // The address of your running backend server.

interface AuthResponse {
    token: string;
    user: User;
}

const getAuthHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
});

export const loginWithGoogle = async (credential: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Google login failed');
    }

    return data;
};

export const registerUser = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
    }

    return data;
};

export const loginUser = async (email: string, password:string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Login failed');
    }

    return data;
};

export const getVideos = async (token: string): Promise<GeneratedVideo[]> => {
    const response = await fetch(`${API_BASE_URL}/videos`, {
        method: 'GET',
        headers: getAuthHeaders(token),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch videos');
    }
    return data;
};

interface VideoGenerationPayload {
    imageB64: string;
    imageMimeType: string;
    prompt: string;
    aspectRatio: AspectRatio;
}

export const generateVideoAd = async (payload: VideoGenerationPayload, token: string): Promise<GeneratedVideo> => {
    const response = await fetch(`${API_BASE_URL}/generate-video`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to generate video');
    }
    return data;
};

interface ImageEditPayload {
    imageB64: string;
    imageMimeType: string;
    prompt: string;
}

export const editImage = async (payload: ImageEditPayload, token: string): Promise<{ imageB64: string }> => {
    const response = await fetch(`${API_BASE_URL}/edit-image`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to edit image');
    }
    return data;
};
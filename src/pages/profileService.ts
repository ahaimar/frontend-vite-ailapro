/**
 * Profile update payloads
 */

import type { User } from "../hooks/Utils";
import api from "../lib/axios";

export interface UpdateProfilePayload {
    name?: string;
    avatarUrl?: string;
    timezone?: string;
    country?: string;
    targetScore?: number;
    testType?: string;
    targetType?: 'academic' | 'general' | 'both';
}

export interface UpdatePasswordPayload {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface UploadAvatarPayload {
    file: File;
}

export interface ProfileUpdateResponse {
    user: User;
    message: string;
}

/**
 * Profile update service methods
 */
export const profileService = {
    /**
     * Update profile fields (name, timezone, country, targetScore, etc.)
     * PATCH /api/users/profile
     */
    updateProfile: async (payload: UpdateProfilePayload): Promise<ProfileUpdateResponse> => {
        const { data } = await api.patch<ProfileUpdateResponse>('/users/profile', payload);
        return data;
    },

    /**
     * Upload avatar image to Cloudinary via backend
     * POST /api/users/profile/avatar
     * 
     * Backend should:
     * 1. Receive multipart FormData with 'file'
     * 2. Upload to Cloudinary
     * 3. Update User.avatarUrl
     * 4. Return updated user
     */
    uploadAvatar: async (file: File): Promise<ProfileUpdateResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post<ProfileUpdateResponse>(
            '/users/profile/avatar',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return data;
    },

    /**
     * Change password
     * POST /api/users/profile/change-password
     * 
     * Backend validates:
     * - currentPassword matches user.passwordHash
     * - newPassword !== currentPassword
     * - newPassword meets requirements
     */
    changePassword: async (payload: UpdatePasswordPayload): Promise<{ message: string }> => {
        const { data } = await api.post<{ message: string }>(
            '/users/profile/change-password',
            payload
        );
        return data;
    },

    /**
     * Update email (with verification)
     * POST /api/users/profile/change-email
     */
    changeEmail: async (newEmail: string): Promise<{ message: string }> => {
        const { data } = await api.post<{ message: string }>(
            '/users/profile/change-email',
            { newEmail }
        );
        return data;
    },
};
import { useState, useCallback } from 'react';
import { useAuthStore } from '../context/authStore';
import { profileService, type UpdateProfilePayload } from '../pages/profileService';

export interface UseProfileUpdateReturn {
    // Update profile fields
    updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
    
    // Upload avatar
    uploadAvatar: (file: File) => Promise<void>;
    
    // Change password
    changePassword: (current: string, newPwd: string) => Promise<void>;
    
    // States
    loading: boolean;
    error: string | null;
    success: boolean;
    
    // Helpers
    clearError: () => void;
    clearSuccess: () => void;
}

/**
 * Hook for managing profile updates
 * Handles validation, loading states, and Zustand store updates
 */
export function useProfileUpdate(): UseProfileUpdateReturn {
    const { setUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const clearError = useCallback(() => setError(null), []);
    const clearSuccess = useCallback(() => setSuccess(false), []);

    const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await profileService.updateProfile(payload);
            setUser(res.user as any);
            setSuccess(true);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to update profile';
            setError(msg);
            console.error('Profile update error:', err);
        } finally {
            setLoading(false);
        }
    }, [setUser]);

    const uploadAvatar = useCallback(async (file: File) => {
        // Validate file
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            setError('Avatar must be under 5MB');
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Avatar must be JPEG, PNG, or WebP');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await profileService.uploadAvatar(file);
            setUser(res?.user as any);
            setSuccess(true);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to upload avatar';
            setError(msg);
            console.error('Avatar upload error:', err);
        } finally {
            setLoading(false);
        }
    }, [setUser]);

    const changePassword = useCallback(async (current: string, newPwd: string) => {
        // Validate
        if (!current || !newPwd) {
            setError('All password fields are required');
            return;
        }

        if (newPwd.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (current === newPwd) {
            setError('New password must be different from current password');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await profileService.changePassword({
                currentPassword: current,
                newPassword: newPwd,
                confirmPassword: newPwd,
            });
            setSuccess(true);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to change password';
            setError(msg);
            console.error('Password change error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        updateProfile,
        uploadAvatar,
        changePassword,
        loading,
        error,
        success,
        clearError,
        clearSuccess,
    };
}
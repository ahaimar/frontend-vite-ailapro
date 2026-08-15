/**
 * 
 */

import { useState, useRef } from 'react';
import { useAuthStore, type TestType } from '../context/authStore';
import { useToast } from '../ui';
import { Button, Field, Input, Label, SectionCard, SectionZone, Select } from '../ui/UI';
import { useNavigate } from 'react-router';
import { ToastBanner } from '../ui/Toest';
import { userService } from '../context/authService';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProfileEditForm() {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();
    const { toast, show: showToast } = useToast();

    // Avatar upload state
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Profile fields state
    const [name, setName] = useState(user?.name ?? '');
    const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC');
    const [country, setCountry] = useState(user?.country ?? '');
    const [targetScore, setTargetScore] = useState<number | undefined>(user?.targetScore);
    const [testType, setTestType] = useState<TestType>(user?.testType ?? 'Academic');
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // Password change state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [changingPassword, setChangingPassword] = useState(false);

    /**
     * Handle avatar file selection and upload to Cloudinary
     */
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
            showToast('Invalid file type. Please use JPEG, PNG, or WebP.', 'ERROR');
            return;
        }

        // Validate file size
        if (file.size > MAX_AVATAR_BYTES) {
            showToast('File too large. Maximum 5MB allowed.', 'ERROR');
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (event) => {
            setAvatarPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server (which handles Cloudinary upload)
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('/api/users/avatar', {
                method: 'POST',
                body: formData,
                headers: {
                    // Don't set Content-Type — browser will set it with boundary
                }
            });

            if (!response.ok) {
                throw new Error('Avatar upload failed');
            }

            const data = await response.json();

            // Update user in store
            if (user) {
                setUser({ ...user, avatarUrl: data.avatarUrl });
            }

            showToast('Avatar updated successfully', 'SUCCESS');
        } catch (error) {
            showToast( error instanceof Error ? error.message : 'Avatar upload failed','ERROR');
            setAvatarPreview(user?.avatarUrl ?? null);
        } finally {
            setUploadingAvatar(false);
            // Reset file input
            if (avatarInputRef.current) {
                avatarInputRef.current.value = '';
            }
        }
    };

    /**
     * Handle profile field save
     */
    const handleUpdateProfile = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Basic validation
        if (!name.trim()) {
            showToast('Name is required', 'ERROR');
            return;
        }

        setUpdatingProfile(true);
        try {
            const result = await userService.updateProfile({
                name: name.trim(),
                timezone,
                country: country.trim(),
                avatar:
                targetScore,
                testType,
            });

            // Update user in store
            if (user) {
                setUser({
                    ...user,
                    name: result.profile?.name || name,
                    timezone,
                    country,
                    targetScore,
                    testType,
                });
            }

            showToast('Profile updated successfully', 'SUCCESS');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to update profile', 'ERROR');
        } finally {
            setUpdatingProfile(false);
        }
    };

    /**
     * Handle password change
     */
    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Reset error
        setPasswordError(null);

        // Validation
        if (!currentPassword || !newPassword) {
            setPasswordError('Current password and new password are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError('New password must be different from current password');
            return;
        }

        setChangingPassword(true);
        try {
            await userService.changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });

            showToast('Password changed successfully','SUCCESS');

            // Reset form
            setShowPasswordForm(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            // API might return error message in different formats
            const errorMsg = error instanceof Error ? error.message : 'Failed to change password';
            setPasswordError(errorMsg);
            showToast( errorMsg, 'ERROR');
        } finally {
            setChangingPassword(false);
        }
    };

    if (!user) {
        return <div className="text-base-content/60">Not authenticated</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-8">
            <ToastBanner toast={toast} />

            {/* Avatar Upload Section */}
            <SectionZone title='Profile Picture'>
                <div className="card-body">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">

                        {/* Preview */}
                        <div className="flex flex-col items-center gap-3">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    className="w-32 h-32 rounded-2xl object-cover ring-2 ring-primary/40"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-2xl bg-base-300 flex items-center justify-center ring-2 ring-base-300">
                                    <span className="text-base-content/40">No image</span>
                                </div>
                            )}
                        </div>

                        {/* Upload */}
                        <div className="flex-1">
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleAvatarChange}
                                disabled={uploadingAvatar}
                                className="file-input file-input-bordered w-full"
                            />
                            <Label>
                                {uploadingAvatar ? 'Uploading…' : 'Max 5MB • JPEG, PNG, or WebP'}
                            </Label>
                        </div>

                        <Button
                            label='Manage subscription'
                            variant='ghost'
                            onClick={() => navigate('/payment')}
                        />
                    </div>
                </div>
            </SectionZone>

            {/* Profile Form */}
            <form onSubmit={handleUpdateProfile} className="card bg-base-200 border border-base-300">
                
                <SectionZone title='user profile'>
                    <Label><h2 className="card-title">Profile Information</h2></Label>

                    {/* Name */}
                    <Field label='Full Name' htmlFor='name'>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={updatingProfile}
                            className="input input-bordered"
                            required
                        />
                    </Field>

                    {/* Timezone */}
                    <Field label='Timezone' htmlFor='timezone'>
                        <Select
                            id="timezone"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            disabled={updatingProfile}
                            className="select select-bordered"
                        >
                            <option value="UTC">UTC (GMT+0)</option>
                            <option value="America/New_York">Eastern Time (GMT-5)</option>
                            <option value="America/Chicago">Central Time (GMT-6)</option>
                            <option value="America/Denver">Mountain Time (GMT-7)</option>
                            <option value="America/Los_Angeles">Pacific Time (GMT-8)</option>
                            <option value="Europe/London">London (GMT+0)</option>
                            <option value="Europe/Paris">Paris (GMT+1)</option>
                            <option value="Asia/Dubai">Dubai (GMT+4)</option>
                            <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
                            <option value="Asia/Singapore">Singapore (GMT+8)</option>
                            <option value="Australia/Sydney">Sydney (GMT+10)</option>
                        </Select>
                    </Field>

                    {/* Country */}
                    <Field label='Country' htmlFor='country'>
                        <Input
                            id="country"
                            type="text"
                            placeholder="e.g., United States, Canada, India"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            disabled={updatingProfile}
                            className="input input-bordered"
                        />
                    </Field>

                    {/* Test Type */}
                    <Field label='IELTS Test Type' htmlFor='testType'>
                        <Select
                            id="testType"
                            value={testType}
                            onChange={(e) => setTestType(e.target.value as TestType)}
                            disabled={updatingProfile}
                            className="select select-bordered"
                        >
                            <option value="Academic">Academic</option>
                            <option value="General">General Training</option>
                            <option value="Training">Training</option>
                        </Select>
                    </Field>

                    {/* Target Score */}
                    <Field label='Target Band Score' htmlFor='targetScore'>
                        <Input
                            id="targetScore"
                            type="number"
                            placeholder="e.g., 7.0"
                            min="0"
                            max="9"
                            step="0.5"
                            value={targetScore ?? ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setTargetScore(val === '' ? undefined : parseFloat(val));
                            }}
                            disabled={updatingProfile}
                            className="input input-bordered"
                        />
                    </Field>

                    <div className='w-full flex justify-center items-center'>
                        <Button
                            label='Save Changes'
                            variant="ghost"
                            loading={updatingProfile}
                        />
                    </div>

                </SectionZone>

            </form>

            {/* Password Change Section */}
            <SectionCard title='Security' subtitle='Manage your password and account security'>
                <div className="card-body">

                    {!showPasswordForm ? (
                        <Button
                            onClick={() => setShowPasswordForm(true)}
                            variant='ghost'
                            label='Change Password'
                        />
                    ) : (
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            {passwordError && (
                                <div className="alert alert-error">
                                    <p className="text-sm">{passwordError}</p>
                                </div>
                            )}

                            {/* Current Password */}
                            <Field label='Current Password' htmlFor='currentPassword' required>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    placeholder="Enter current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    disabled={changingPassword}
                                    className="input input-bordered"
                                    required
                                />
                            </Field>

                            {/* New Password */}
                            <Field label='New Password' htmlFor='newPassword' required>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={changingPassword}
                                    className="input input-bordered"
                                    required
                                    minLength={8}
                                />
                                <Label>
                                    <span className="label-text-alt">Minimum 8 characters</span>
                                </Label>
                            </Field>

                            {/* Confirm Password */}
                            <Field label='Confirm Password' htmlFor='confirmPassword' required>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={changingPassword}
                                    className="input input-bordered"
                                    required
                                />
                            </Field>

                            <div className='w-full grid grid-cols-2 gap-2'>
                                <Button
                                    label='Change Password'
                                    loading={changingPassword}
                                />

                                <Button
                                    label='Cancel'
                                    variant='ghost'
                                    onClick={() => {
                                        setShowPasswordForm(false);
                                        setPasswordError(null);
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                />
                            </div>
                        </form>
                    )}
                </div>
            </SectionCard>
        </div>
    );
}
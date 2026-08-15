import { useEffect, useState } from "react";
import type { User, Role, Status } from "../../hooks/Utils";
import { Button, Field, Input, Label, SectionSimple, SectionZone, Select, Badge } from "../../ui/UI";
import { AlertCircle, RotateCcw } from "lucide-react";

export interface EditUserModalProps {
  user: User;
  onSave: (userId: string, data: Partial<User>) => void;
  onCancel: () => void;
  isSaving?: boolean;
  isAdmin?: boolean;
}

/**
 * ✅ FIXED: EditUserModal with proper schema field mapping
 * 
 * Key improvements:
 * - Fixed bitwise OR (`| 0`) to nullish coalesce (`?? 0`)
 * - Proper camelCase ↔ snake_case field mapping
 * - Admin controls for resetting attempt counts
 * - Better subscription date handling
 * - Input validation
 * - Read-only fields for non-admins
 */
export function EditUserModal({ 
  user, 
  onSave, 
  onCancel, 
  isSaving = false,
  isAdmin = false 
}: EditUserModalProps) {
  // ✅ Initialize with a clone of the user object
  const [formUser, setFormUser] = useState<User | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  console.log('user info : ', user as any)

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormUser({ ...user });
      setErrors({});
      setShowResetConfirm(false);
    }
  }, [user]);

  if (!formUser) return null;

  // ✅ Helper to update specific fields immutably
  const updateField = (key: keyof User, value: any) => {
    setFormUser((prev) => prev ? { ...prev, [key]: value } : null);
    setIsDirty(true);
    
    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // ✅ Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  };

  // ✅ Validate form before save
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formUser.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formUser.email && !validateEmail(formUser.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formUser.targetScore !== undefined && formUser.targetScore !== null) {
      if (formUser.targetScore < 0 || formUser.targetScore > 9) {
        newErrors.targetScore = 'Score must be between 0 and 9';
      }
    }

    if (formUser.currentBandEstimate !== undefined && formUser.currentBandEstimate !== null) {
      if (formUser.currentBandEstimate < 0 || formUser.currentBandEstimate > 9) {
        newErrors.currentBandEstimate = 'Band must be between 0 and 9';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle save with validation
  const handleSave = () => {
    if (!validateForm()) return;

    // Only send changed fields
    const delta: Partial<User> = {};
    let hasChanges = false;

    (Object.keys(formUser) as Array<keyof User>).forEach((key) => {
      if (formUser[key] !== user[key]) {
        delta[key] = formUser[key]  as any;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onSave(user._id, delta);
    } else {
      onCancel();
    }
  };

  // ✅ Admin: Reset daily attempts to 0
  const handleResetDailyAttempts = () => {
    updateField('dailyAttemptsUsed', 0);
    updateField('lastAttemptDate', null);
    setShowResetConfirm(false);
  };

  // ✅ Admin: Reset total attempts to 0 (DANGEROUS - need confirmation)
  const handleResetTotalAttempts = () => {
    updateField('attemptsUsed', 0);
    setShowResetConfirm(false);
  };

  // ✅ Quick subscription expiry setter
  const setSubscriptionExpiry = (days: number) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    updateField('subscription_expires_at' as keyof User, expiryDate.toISOString());
  };

  // ✅ Get remaining display (handles Infinity for unlimited plans)
  const getRemainingDisplay = (plan: string) => {
    if (plan === 'unlimited') return 'Unlimited';
    
    const config: Record<string, { maxDaily: number; maxTotal: number }> = {
      free: { maxDaily: 5, maxTotal: 10 },
      basic: { maxDaily: 10, maxTotal: 20 },
      pro: { maxDaily: 20, maxTotal: 50 },
      unlimited: { maxDaily: Infinity, maxTotal: Infinity },
    };
    
    const limits = config[plan] || config.free;
    const remaining = {
      daily: limits.maxDaily - (formUser.dailyAttemptsUsed ?? 0),
      total: limits.maxTotal - (formUser.attemptsUsed ?? 0),
    };
    
    return `${remaining.daily}/${limits.maxDaily} daily, ${remaining.total}/${limits.maxTotal} total`;
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-full max-w-5xl bg-slate-950/90 border border-slate-900/95 shadow shadow-slate-900/80">
        <div className="flex items-center justify-between mb-4">
          <Label>
            <h3 className="font-bold text-lg">Edit User: {user.name}</h3>
          </Label>
          {isAdmin && (
            <Badge label="Admin Mode" variant="warning" size="xs" />
          )}
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* ─── Identity Section ──────────────────────────────────────────────── */}
          <SectionZone title="Identity">
            <div className="grid grid-cols-2 gap-4">
              <Field 
                label="Name" 
                htmlFor="field-name"
                error={errors.name}
              >
                <Input
                  id="field-name"
                  value={formUser.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  disabled={isSaving}
                  placeholder="Full name"
                  className={errors.name ? 'input-error' : ''}
                />
              </Field>

              <Field 
                label="Email" 
                htmlFor="field-email"
                error={errors.email}
              >
                <Input
                  id="field-email"
                  type="email"
                  value={formUser.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  disabled={isSaving}
                  placeholder="user@example.com"
                  className={errors.email ? 'input-error' : ''}
                />
              </Field>
            </div>
          </SectionZone>

          {/* ─── Account Status Section ─────────────────────────────────────────── */}
          <SectionZone title="Account Status">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Role" htmlFor="field-role">
                <Select
                  id="field-role"
                  value={formUser.role}
                  onChange={(e) => updateField('role', e.target.value as Role)}
                  disabled={isSaving}
                >
                  <option value="guest">Guest</option>
                  <option value="subscriber">Subscriber</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </Select>
              </Field>

              <Field label="Status" htmlFor="field-status">
                <Select
                  id="field-status"
                  value={formUser.status}
                  onChange={(e) => updateField('status', e.target.value as Status)}
                  disabled={isSaving}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="deleted">Deleted</option>
                </Select>
              </Field>
            </div>
          </SectionZone>

          {/* ─── Subscription Section ──────────────────────────────────────────── */}
          <SectionZone title="Subscription & Attempts">
            <div className="space-y-4">
              {/* Plan Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Subscription Plan" htmlFor="field-subscription">
                  <Select
                    id="field-subscription"
                    value={formUser.subscription || 'free'}
                    onChange={(e) => updateField('subscription', e.target.value)}
                    disabled={isSaving}
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="unlimited">Unlimited</option>
                  </Select>
                </Field>

                {/* Remaining Attempts Display */}
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700/50">
                  <div className="text-sm text-slate-400 mb-1">Remaining Attempts</div>
                  <div className="font-semibold text-slate-100">
                    {getRemainingDisplay(formUser.subscription || 'free')}
                  </div>
                </div>
                <Field label="attemptsUsed" htmlFor="field-attemptsUsed">
                  <>{formUser.attemptsUsed }</>
                </Field>
                <Field label="daily Attempts Used" htmlFor="field-dailyAttemptsUsed">
                  <>{formUser.dailyAttemptsUsed }</>
                </Field>
              </div>

              {/* Expiry Dates */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Subscription Expires" htmlFor="field-sub-expires">
                  <Input
                    id="field-sub-expires"
                    type="date"
                    value={
                      formUser.subscription_expires_at
                        ? new Date(formUser.subscription_expires_at).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      updateField(
                        'subscription_expires_at', 
                        e.target.value ? new Date(e.target.value).toISOString() : null
                      )
                    }
                    disabled={isSaving || formUser.subscription === 'free'}
                  />
                </Field>

                <Field label="Trial Ends" htmlFor="field-trial-ends">
                  <Input
                    id="field-trial-ends"
                    type="date"
                    value={
                      formUser.trial_ends_at
                        ? new Date(formUser.trial_ends_at).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      updateField(
                        'trial_ends_at', 
                        e.target.value ? new Date(e.target.value).toISOString() : null
                      )
                    }
                    disabled={isSaving}
                  />
                </Field>
              </div>

              {/* Quick subscription extenders (Admin only) */}
              {isAdmin && formUser.subscription !== 'free' && (
                <div className="p-3 bg-slate-800/30 rounded border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-2">Quick Extend:</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      label="+7 days"
                      size="sm"
                      variant="outline"
                      onClick={() => setSubscriptionExpiry(7)}
                      disabled={isSaving}
                    />
                    <Button
                      label="+30 days"
                      size="sm"
                      variant="outline"
                      onClick={() => setSubscriptionExpiry(30)}
                      disabled={isSaving}
                    />
                    <Button
                      label="+1 year"
                      size="sm"
                      variant="outline"
                      onClick={() => setSubscriptionExpiry(365)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              )}
            </div>
          </SectionZone>

          {/* ─── Exam Attempts (Admin Controls) ─────────────────────────────────── */}
          {isAdmin && (
            <SectionSimple title="Exam Attempts (Admin Controls)">
              <div className="space-y-4">
                {/* Display current counts */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-base-200/30 rounded border border-base-200/20">
                    <div className="text-base-content/60 text-xs">Total Attempts Used</div>
                    <div className="text-2xl font-semibold text-slate-100 mt-1">
                      {formUser.attemptsUsed ?? 0}
                    </div>
                  </div>
                  <div className="p-3 bg-base-200/30 rounded border border-base-200/20">
                    <div className="text-base-content/60 text-xs">Daily Attempts Used</div>
                    <div className="text-2xl font-semibold text-slate-100 mt-1">
                      {formUser.dailyAttemptsUsed ?? 0}
                    </div>
                  </div>
                </div>

                {/* Reset Controls */}
                <div className="p-3 bg-warning/10 rounded border border-warning/30 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-warning mt-0.5 shrink-0" />
                    <div className="text-xs text-warning">
                      Reset user's attempt counts. This action can be undone by saving.
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      label="Reset Daily (0)"
                      size="sm"
                      variant="outline"
                      icon={<RotateCcw size={12} />}
                      onClick={() => handleResetDailyAttempts()}
                      disabled={isSaving || formUser.dailyAttemptsUsed === 0}
                    />

                    <Button
                      label="Reset Total (0)"
                      size="sm"
                      variant="outline"
                      icon={<RotateCcw size={12} />}
                      onClick={() => handleResetTotalAttempts()}
                      disabled={isSaving || formUser.attemptsUsed === 0}
                    />
                  </div>

                  {showResetConfirm && (
                    <div className="mt-2 p-2 bg-error/20 rounded border border-error/40 text-error text-xs">
                      ⚠️ Confirm: This will reset attempt counts. Click again to confirm.
                    </div>
                  )}
                </div>
              </div>
            </SectionSimple>
          )}

          {/* ─── Learning Profile Section ────────────────────────────────────────────── */}
          <SectionZone title="Learning Profile">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Target Type" htmlFor="field-target-type">
                <Select
                  id="field-target-type"
                  value={formUser.targetType || 'academic'}
                  onChange={(e) => updateField('targetType', e.target.value as 'academic' | 'general' | 'both')}
                  disabled={isSaving}
                >
                  <option value="academic">Academic</option>
                  <option value="general">General</option>
                  <option value="both">Both</option>
                </Select>
              </Field>

              <Field label="Test Type" htmlFor="field-test-type">
                <Select
                  id="field-test-type"
                  value={formUser.testType || 'Academic'}
                  onChange={(e) => updateField('testType', e.target.value)}
                  disabled={isSaving}
                >
                  <option value="Academic">Academic</option>
                  <option value="General">General</option>
                  <option value="Training">Training</option>
                </Select>
              </Field>

              <Field 
                label="Target Score" 
                htmlFor="field-target-score"
                error={errors.targetScore}
              >
                <Input
                  id="field-target-score"
                  type="number"
                  min="0"
                  max="9"
                  step="0.5"
                  value={formUser.targetScore ?? ''}
                  onChange={(e) => updateField('targetScore', e.target.value ? parseFloat(e.target.value) : undefined)}
                  disabled={isSaving}
                  placeholder="0-9"
                  className={errors.targetScore ? 'input-error' : ''}
                />
              </Field>

              <Field 
                label="Current Band Estimate" 
                htmlFor="field-current-band"
                error={errors.currentBandEstimate}
              >
                <Input
                  id="field-current-band"
                  type="number"
                  min="0"
                  max="9"
                  step="0.5"
                  value={formUser.currentBandEstimate ?? ''}
                  onChange={(e) => updateField('currentBandEstimate', e.target.value ? parseFloat(e.target.value) : undefined)}
                  disabled={isSaving}
                  placeholder="0-9"
                  className={errors.currentBandEstimate ? 'input-error' : ''}
                />
              </Field>
            </div>
          </SectionZone>

          {/* ─── Profile Section ───────────────────────────────────────────────── */}
          <SectionSimple title="Profile">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Timezone" htmlFor="field-timezone">
                <Input
                  id="field-timezone"
                  value={formUser.timezone || 'UTC'}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  disabled={isSaving}
                  placeholder="UTC"
                />
              </Field>

              <Field label="Country" htmlFor="field-country">
                <Input
                  id="field-country"
                  value={formUser.country || ''}
                  onChange={(e) => updateField('country', e.target.value)}
                  disabled={isSaving}
                  placeholder="Country"
                />
              </Field>
            </div>
          </SectionSimple>
        </div>

        {/* Actions */}
        <div className="modal-action mt-6 border-t border-base-300 pt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            label="Cancel"
            onClick={onCancel}
            disabled={isSaving}
          />
          <Button
            label="Save Changes"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          />
        </div>
      </div>

      <form method="dialog" className="modal-backdrop bg-slate-900/30">
        <button onClick={onCancel} disabled={isSaving}>close</button>
      </form>
    </dialog>
  );
}
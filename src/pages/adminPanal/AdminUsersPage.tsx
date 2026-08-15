import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  PencilLine,
  UserCog,
  ShieldCheck,
  Lock,
  UserStar,
  Trash2,
} from "lucide-react";
import { useToast } from "../../ui/index.ts";
import { Button, Input, Label, Select } from "../../ui/UI.tsx";
import { ToastBanner } from "../../ui/Toest.tsx";
import { adminService } from "../../context/authService.ts";
import type { AppError } from "../../context/excaption/AppError.ts";
import type { Role, Status, User } from "../../hooks/Utils.ts";
import { EditUserModal } from "./EditUserModal.tsx";
import { RoleBadge, StatusBadge } from "./Badges.tsx";

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface FilterState {
  search: string;
  role: string;
  status: string;
}


interface UserActionsProps {
  user: User;
  onStatusChange: (status: string) => void;
  onRoleChange: (role: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  onClose: () => void;
  isLoading: boolean;
}

export function UserActions({
  user,
  onStatusChange,
  onRoleChange,
  onDelete,
  onEdit,
  onClose,
  isLoading,
}: UserActionsProps) {
  
  // Closes the menu first, then triggers the action
  const act = (actionFn: () => void) => () => {
    onClose();
    actionFn();
  };

  return (
    <ul className="menu p-2 w-full text-base-content gap-1">
      {/* Edit User Section */}
      <li>
        <Button
          label="Edit User"
          variant="ghost"
          icon={<UserCog />}
          onClick={act(onEdit)}
          disabled={isLoading}
        />
      </li>

      <li><hr className="divider my-1" /></li>

      {/* Change Status Section */}
      <li className="menu-title">
        <span>Change Status</span>
      </li>
      {user.status !== "active" && (
        <li>
          <Button
            label="Activate"
            variant="ghost"
            icon={<ShieldCheck />}
            onClick={act(() => onStatusChange("active"))}
            disabled={isLoading}
          />
        </li>
      )}
      {user.status !== "suspended" && (
        <li>
          <Button
            label="Suspend"
            variant="ghost"
            icon={<Lock />}
            onClick={act(() => onStatusChange("suspended"))}
            disabled={isLoading}
          />
        </li>
      )}

      <li><hr className="divider my-1" /></li>

      {/* Change Role Section */}
      <li className="menu-title">
        <span>Change Role</span>
      </li>
      {user.role !== "subscriber" && (
        <li>
          <Button
            label="User"
            variant="ghost"
            onClick={act(() => onRoleChange("subscriber"))}
            disabled={isLoading}
          />
        </li>
      )}
      {user.role !== "teacher" && (
        <li>
          <Button
            label="Teacher"
            variant="ghost"
            onClick={act(() => onRoleChange("teacher"))}
            disabled={isLoading}
            hoverText={'This function is still under development !!'}
          />
        </li>
      )}
      {user.role !== "admin" && (
        <li>
          <Button
            label="Admin"
            variant="ghost"
            icon={<UserStar />}
            onClick={act(() => onRoleChange("admin"))}
            disabled={isLoading}
          />
        </li>
      )}

      <li><hr className="divider my-1" /></li>

      {/* Delete User Section */}
      <li>
        <Button
          label="Delete User"
          variant="reset"
          icon={<Trash2 />}
          onClick={act(onDelete)}
          disabled={isLoading}
        />
      </li>
    </ul>
  );
}

// ─── Single Table Row (owns its own dialog ref — legal hook usage) ───────────

function UserRow({
  user,
  onEdit,
  onStatusChange,
  onRoleChange,
  onDelete,
  isLoading,
}: {
  user: User;
  onEdit: (user: User) => void;
  onStatusChange: (userId: string, status: string) => void;
  onRoleChange: (userId: string, role: string) => void;
  onDelete: (user: User) => void;
  isLoading: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <tr className="hover:bg-base-200/60">
      {/* User */}
      <td>
        <div>
          <div className="font-medium text-base-content">{user.name}</div>
          <div className="text-sm text-base-content/60">{user.email}</div>
        </div>
      </td>

      {/* Role */}
      <td>
        <RoleBadge role={user.role} />
      </td>

      {/* Status */}
      <td className="tooltip tooltip-info" data-tip={`${user.status}`}>
        <StatusBadge status={user.status} />
      </td>

      {/* Subscription */}
      <td>
        {user.subscription && user.subscription !== "free" ? (
          <span className="badge badge-sm badge-success">
            {user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)}
          </span>
        ) : (
          <span className="badge badge-sm badge-ghost">Free</span>
        )}
      </td>

      {/* Joined */}
      <td className="text-sm text-base-content/70">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>

      {/* Last Login */}
      <td className="text-sm text-base-content/70">
        {user.subscription_expires_at
          ? new Date(user.subscription_expires_at).toLocaleDateString()
          : "Never"}
      </td>

      {/* Actions */}
      <td className="text-right">
        <Button
          variant="ghost"
          onClick={() => dialogRef.current?.showModal()}
          icon={<PencilLine />}
          aria-label={`Actions for ${user.name}`}
        />
        <dialog ref={dialogRef} className="modal">
          <div className="modal-box min-w-2xs bg-slate-950/95">
            <UserActions
              user={user}
              onEdit={() => onEdit(user)}
              onStatusChange={(status) => onStatusChange(user._id, status)}
              onRoleChange={(role) => onRoleChange(user._id, role)}
              onDelete={() => onDelete(user)}
              onClose={() => dialogRef.current?.close()}
              isLoading={isLoading}
            />
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => dialogRef.current?.close()}>close</button>
          </form>
        </dialog>
      </td>
    </tr>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({
  user,
  onConfirm,
  onCancel,
  isLoading,
}: {
  user: User | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  if (!user) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-sm">
        <Label><h3 className="font-bold text-lg text-rose-700">Delete User</h3></Label>
        <Label>
          <p className="py-4 text-base-content/80">
            Are you sure you want to delete {" "}
            <span className="font-semibold"> {user.name}</span>? This cannot be undone.
          </p>
        </Label>
        <div className="modal-action">
          <Button
            label="Cancel"
            variant="ghost"
            onClick={onCancel} disabled={isLoading}
          />
            
          <Button
            label="Delete"
            variant="reset"
            onClick={onConfirm}
            disabled={isLoading}
          />
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel} disabled={isLoading}>
          close
        </button>
      </form>
    </dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    role: "all",
    status: "all",
  });
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const queryClient = useQueryClient();
  const { toast, show: showToast } = useToast();
  const limit = 20;

  // Fetch users — adminService.listUsers resolves to { status, data: { users, pagination } }
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", page, filters],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (filters.role !== "all") params.role = filters.role;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const res = await adminService.listUsers(params);
      return res.data as { users: User[]; pagination: Pagination };
    },
    staleTime: 30000,
  });

  // Mutations — wrap() throws AppError, not AxiosError
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      adminService.updateStatus(userId, status as Status),
    onSuccess: (res) => {
      showToast(res.message, "SUCCESS");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: AppError) => {
      showToast(err.message || "Failed to update status", "ERROR");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminService.updateRole(userId, role as Role),
      onSuccess: (res) => {
        showToast(res.message, "SUCCESS");
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      },
    onError: (err: AppError) => {
      showToast(err.message || "Failed to update role", "ERROR");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<User> }) =>
      adminService.updateUser(userId, data),
    onSuccess: (res) => {
      showToast(res.message || "User updated", "SUCCESS");
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: AppError) => {
      showToast(err.message || "Failed to update user", "ERROR");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: (res) => {
      showToast(res.message || "User deleted successfully", "SUCCESS");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: AppError) => {
      showToast(err.message || "Failed to delete user", "ERROR");
    },
  });

  const isActionLoading =
    updateStatusMutation.isPending ||
    updateRoleMutation.isPending ||
    deleteMutation.isPending;

  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-6 w-full bg-base-100 min-h-screen">
      {/** message handling */}
      <ToastBanner toast={toast} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-base-content">User Management</h1>
        <p className="text-base-content/60 mt-1">
          Manage users, roles, and account statuses
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-base-200 p-4 rounded-box">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-base-content/40" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        <Select
          value={filters.role}
          onChange={(e) => {
            setFilters({ ...filters, role: e.target.value });
            setPage(1);
          }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="subscriber">Subscriber</option>
          <option value="guest">Guest</option>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onChange={(e) => {
            setFilters({ ...filters, status: e.target.value });
            setPage(1);
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending_verification">Pending Verification</option>
        </Select>
        {/*<Button
            variant="submit"
            label="add user"
        />*/}

        {/* Clear Filters */}
        {(filters.search || filters.role !== "all" || filters.status !== "all") && (
          <Button
            variant="ghost"
            label="Clear"
            onClick={() => {
              setFilters({ search: "", role: "all", status: "all" });
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>Failed to load users. Please try again.</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <div className="text-center py-20 text-base-content/60">
          <p className="text-lg font-medium">No users found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && users.length > 0 && (
        <div className="overflow-x-auto bg-base-100 shadow rounded-box border border-base-300">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200 text-2sm capitalize italic">
              <tr>
                <th>user</th>
                <th>Role</th>
                <th>Status</th>
                <th>Subscription</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserRow
                  key={user._id}
                  user={user}
                  onEdit={setSelectedUser}
                  onStatusChange={(userId, status) =>
                    updateStatusMutation.mutate({ userId, status })
                  }
                  onRoleChange={(userId, role) =>
                    updateRoleMutation.mutate({ userId, role })
                  }
                  onDelete={setDeleteTarget}
                  isLoading={isActionLoading}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-base-content/60">
            Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
            {Math.min(page * limit, pagination.total)} of {pagination.total} users
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              icon={<ChevronLeft />}
            />

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((p) => {
                  return p === 1 || p === pagination.pages || Math.abs(p - page) <= 1;
                })
                .map((p, idx, arr) => (
                  <div key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-2 text-base-content/40">...</span>
                    )}
                    <Button
                      variant={page === p ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setPage(p)}
                      disabled={isLoading}
                    >
                      {p}
                    </Button>
                  </div>
                ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages || isLoading}
              icon={<ChevronRight />}
            />
          </div>
        </div>
      )}

      {/* Edit User Modal — Rendered at top level, not in table map */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          onCancel={() => setSelectedUser(null)}
          onSave={(userId, data) => updateUserMutation.mutate({ userId, data })}
          isSaving={updateUserMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        user={deleteTarget}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget._id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default AdminUsersPage;
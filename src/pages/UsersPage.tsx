import { useQuery } from "@tanstack/react-query";
import type { User } from "../hooks/Utils.ts";
import { userService } from "../context/authService.ts";

type AdminUsersResponse = {
  users: User[];
  total: number;
};

export function UsersPage() {
  const { data, isLoading } = useQuery<AdminUsersResponse>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await userService.getProfile("me");
      return res.data;
    },
  });

  const users = data?.users || [];

  const roleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "badge badge-warning";
      case "teacher":
        return "badge badge-secondary";
      case "subscriber":
        return "badge badge-primary";
      default:
        return "badge badge-ghost";
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "badge badge-success";
      case "suspended":
        return "badge badge-error";
      default:
        return "badge badge-ghost";
    }
  };

  return (
    <div className="p-4 space-y-4 w-full">

      {/* Header */}
      <h1 className="text-2xl font-bold">User Management</h1>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
 
      {/* Table */}
      {!isLoading && (
        <div className="overflow-x-auto bg-base-100 shadow rounded-box">
          <table className="table">

            {/* Head */}
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Test Type</th>
                <th>Joined</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="hover">

                  {/* User */}
                  <td>
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs opacity-60">
                        {u.email}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td>
                    <span className={roleBadge(u.role)}>
                      {u.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={statusBadge(u.status)}>
                      {u.status}
                    </span>
                  </td>

                  {/* Test Type */}
                  <td className="text-sm opacity-70">
                    {u.testType}
                  </td>

                  {/* Test is apony */}
                  <td className="text-sm opacity-70">
                    {u.subscription }
                  </td>

                  {/* Date */}
                  <td className="text-sm opacity-60">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}
    </div>
  );
}
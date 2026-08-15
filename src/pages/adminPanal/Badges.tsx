import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "badge-success",
    suspended: "badge-error",
    pending_verification: "badge-warning",
    deleted: "badge-ghost",
  };

  const icons: Record<string, React.ReactNode> = {
    active: <CheckCircle size={14} />,
    suspended: <AlertCircle size={14} />,
    pending_verification: <AlertCircle size={14} />,
    deleted: <XCircle size={14} />,
  };

  return (
    <div className={`badge badge-sm gap-2 ${styles[status] ?? "badge-ghost"}`}>
      {icons[status]}
      
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "badge-warning",
    teacher: "badge-secondary",
    subscriber: "badge-primary",
    guest: "badge-ghost",
  };

  return (
    <span className={`badge badge-sm ${styles[role] ?? "badge-ghost"}`}>
      {role}
    </span>
  );
}
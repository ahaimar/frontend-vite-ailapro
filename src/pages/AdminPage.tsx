import {useQuery} from "@tanstack/react-query";
import { adminService } from "../context/authService";
import { Link } from "react-router";
//import { adminService } from "../context/authService";

type AdminStatsResponse = {
    totals: { total: number; active: number; guests: number }
    byRole: { role: string; count: number }[]
}

export function AdminPage() {


    const { data, isLoading } = useQuery<AdminStatsResponse>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await adminService.getStats();
            return res.data;
        }
    })

    return (
        <div className="w-full">
            { isLoading && <span className="loading loading-ring loading-xl"></span> }
            <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-8 text-base-content">Admin Panel</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" >
                <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm border-t-2 border-t-warning">
                    <div className="text-[11px] text-base-content uppercase tracking-wider mb-2">Total Users</div>
                    <div className="font-syne font-bold text-3xl">{data?.totals?.total || '…'}</div>
                    <div className="text-[12px] text-base-200 mt-1">Active: {data?.totals?.active || '—'}</div>
                </div>
                <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm border-t-2 border-t-warning">
                    <div className="text-[11px] text-base-content uppercase tracking-wider mb-2">Guest Sessions</div>
                    <div className="font-syne font-bold text-3xl">{data?.totals?.guests || '0'}</div>
                    <div className="text-[12px] text-base-200 mt-1">48h active</div>
                </div>
                <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm border-t-2 border-t-warning">
                    <div className="text-[11px] text-base-content uppercase tracking-wider mb-2">By Role</div>
                    {(data?.byRole || []).map(r => (
                        <div key={r.role} className="flex justify-between text-[12px] text-base-content">
                            <span className="capitalize">{r.role}</span><span className="font-mono">{r.count}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex gap-3">
                <Link  to="/admin/users" className="px-5 py-2.5 bg-surface border border-base-200 rounded-xl text-[13px] text-base-content hover:text-base-content hover:border-base-200 transition-all">Manage Users →</Link>
                <Link to="/admin/audit" className="px-5 py-2.5 bg-surface border border-base-200 rounded-xl text-[13px] text-base-content hover:text-base-content hover:border-base-200 transition-all">Audit Log →</Link>
            </div>
        </div>
    );
}
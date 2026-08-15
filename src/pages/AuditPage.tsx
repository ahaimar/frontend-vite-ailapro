import {useQuery} from "@tanstack/react-query";
import type { AuditLog } from "../hooks/Utils.ts";
import {adminService} from '../context/authService.ts';

export function AuditPage() {

    const { data, isLoading } = useQuery<AuditLog>({
        queryKey: ['audit-log'],
        queryFn:  async () => {
            return await adminService.getAuditLog({ limit: 50 });
        }
    });


    const logs = data?.logs || [];
    return (
        <div className="w-full h-full justify-center items-center bg-base-100">
            <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-6">Audit Log</h1>
            {isLoading ? 
                    <div className="w-full h-full justify-center items-center">
                        <span className="loading loading-ring loading-xl"></span>
                    </div>
                    
                : (
                    <div className="w- bg-surface border border-base-100 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                            <tr className="bg-base-300">
                                {['Time','Action','User','IP'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-base-content uppercase tracking-wider border-b border-base-200">{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {logs.map(l => (
                                <tr key={l._id} className="border-b border-base-100 hover:bg-base-200">
                                    <td className="px-4 py-3 text-[11px] text-base-content font-mono">{new Date(l.createdAt).toLocaleTimeString()}</td>
                                    <td className="px-4 py-3"><span className={`text-[12px] font-semibold 'text-white/50'}`}>{ l.action }</span></td>
                                    <td className="px-4 py-3 text-[12px] text-base-content">{ l.name || '—'}</td>
                                    <td className="px-4 py-3 text-[11px] text-base-content font-mono">{l.ipAddress || '—'}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-white/25 text-sm">No audit events yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )
            }
        </div>
    );
}
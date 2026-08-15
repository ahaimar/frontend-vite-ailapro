import { useAuthStore } from "../../context/authStore";



const ROLE_COLORS = {
  admin:      "text-gold bg-gold/10 border-gold/25",
  teacher:    "text-purple bg-purple/10 border-purple/25",
  subscriber: "text-blue bg-blue/10 border-blue/25",
  guest:      "text-gray-400 bg-white/5 border-white/10",
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "gold" | "blue" | "green" | "purple";
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  const accents = {
    gold:   "from-gold to-gold2",
    blue:   "from-blue to-sky-400",
    green:  "from-green to-emerald-400",
    purple: "from-purple to-violet-400",
  };
  return (
    <div className="bg-surface border border-white/[0.07] rounded-2xl p-5 relative overflow-hidden hover:border-white/12 transition-all">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r ${accents[accent as keyof typeof accents] ?? accents.gold}`} />
      <div className="text-[11px] text-white/30 uppercase tracking-widest mb-3">{label}</div>
      <div className="font-syne font-extrabold text-3xl tracking-tight text-white mb-1">{value}</div>
      {sub && <div className="text-[12px] text-white/30">{sub}</div>}
    </div>
  );
}

export default function UserMenu() {
  const { user, permissions } = useAuthStore();

  //const testsTaken = user?.tests_taken ?? 0;
  //const streak     = user?.streak ?? 1;
  const testsTaken =  0;
  const streak     = 1;

  const stats = [
    {
      label:  "Tests Taken",
      value:  testsTaken,
      sub:    testsTaken === 0 ? "Start your first test" : `${testsTaken} completed`,
      accent: "gold",
    },
    {
      label:  "Avg Band",
      //value:  user?.avg_band ?? "—",
      value:  "—",
      sub:    testsTaken === 0 ? "Complete a test to see your band" : undefined,
      accent: "blue",
    },
    {
      label:  "Day Streak",
      value:  streak,
      sub:    "Keep it up!",
      accent: "green",
    },
  ] as const;

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const roleColor =
    ROLE_COLORS[user?.role as keyof typeof ROLE_COLORS] ?? ROLE_COLORS.guest;

  return (
    <div className="w-full bg-base-100">
      {/* User card */}
      <div className="bg-surface border border-base rounded-2xl p-5 mb-6 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-gold via-blue to-transparent" />
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-syne font-bold text-lg shrink-0 border ${roleColor}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px] truncate">{user?.name}</div>
          <div className="text-[12px] text-base-content truncate">
            {user?.email || "Guest Account"}
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2.5 py-0.5 inline-block mt-1.5 ${roleColor}`}>
            {user?.role}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-2xl font-medium text-gold">
            user?.target_score || "—"
          </div>
          <div className="text-[10px] text-white/25 uppercase tracking-wider">
            Target Band
          </div>
            <div className="text-[11px] text-base-content mt-0.5">ser.test_type</div>
          
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Permissions */}
      {(permissions ?? []).length > 0 && (
        <div className="mb-6">
          <h3 className="font-syne font-bold text-[14px] text-base-content mb-3 uppercase tracking-wider">
            Your Permissions
          </h3>
          <div className="flex flex-wrap gap-2">
            {permissions!.map((p) => (
              <span
                key={p}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surf2 border border-white/6 rounded-lg text-[12px] text-white/55"
              >
                <span className="text-green text-[10px]" aria-hidden="true">✓</span>
                {p.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Guest upgrade CTA */}
      {user?.role === "guest" && (
        <div className="bg-linear-to-r from-gold/[0.08] to-blue/[0.06] border border-gold/20 rounded-2xl p-5">
            <h3 className="font-syne font-bold text-gold text-lg mb-1">
                Unlock Full Access
            </h3>
            <p className="text-base-content text-sm mb-4">
                Create a free account to access all 20+ mock tests, AI writing feedback, and speaking simulation.
            </p>
            <a
            href="/signup"
            className="inline-block px-5 py-2.5 bg-gold text-bg font-syne font-bold text-sm rounded-xl hover:opacity-90 transition-all"
            >
            Create Free Account →
          </a>
        </div>
      )}
    </div>
  );
}
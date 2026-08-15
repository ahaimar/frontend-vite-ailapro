import {Outlet, NavLink, useNavigate, Link} from "react-router";
import { useAuthStore } from "../../context/authStore";
import toast from "react-hot-toast";
import type { Role, UserWithAttemptSummary } from "../../hooks/Utils.ts";
import {
  AlertCircle,
  BookOpen,
  ClipboardPlus,
  Clock,
  Crown,
  LogOut,
  type LucideIcon,
  Menu,
  Play,
  SquareMenu,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import BG_ from "../../assets/menu icon-19.png"
import { Button } from "../../ui/UI.tsx";

interface SubscriptionBadgeProps {
  user: UserWithAttemptSummary | null;
  compact?: boolean;
}
 
const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ user, compact = false }) => {
  if (!user) return null;
 
  // ✅ Active subscription
  if (user.isSubscriptionActive && !user.isInTrial) {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                   text-[9px] font-bold tracking-wide
                   bg-amber-400/15 text-amber-400 border border-amber-400/30"
        title={`Subscription: ${user.planTier}. Expires ${new Date(user.subscriptionExpiresAt!).toLocaleDateString()}`}
      >
        <Crown size={9} className="shrink-0" />
        {compact ? user.planTier?.toUpperCase() : `${user.planTier?.toUpperCase()} PLAN`}
      </span>
    );
  }
 
  // ⏱️ Trial period
  if (user.isInTrial) {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                   text-[9px] font-bold tracking-wide
                   bg-blue-400/15 text-blue-400 border border-blue-400/30"
        title={`Trial period. Expires ${new Date(user.trialEndsAt!).toLocaleDateString()}`}
      >
        <Zap size={9} className="shrink-0" />
        {compact ? 'TRIAL' : 'TRIAL ACTIVE'}
      </span>
    );
  }
 
  // ❌ Expired subscription
  if (user.isSubscriptionExpired && user.subscription !== 'free') {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                   text-[9px] font-bold tracking-wide
                   bg-rose-400/15 text-rose-400 border border-rose-400/30"
        title="Subscription has expired. Renew to restore access."
      >
        <AlertCircle size={9} className="shrink-0" />
        {compact ? 'EXPIRED' : 'SUBSCRIPTION EXPIRED'}
      </span>
    );
  }
 
  // Free plan (no badge)
  return null;
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

interface AttemptBadgeProps {
  user: UserWithAttemptSummary | null;
}
 
const AttemptBadge: React.FC<AttemptBadgeProps> = ({ user }) => {
  if (!user || !('attemptStatus' in user)) return null;
 
  // Unlimited plan — show lightning bolt
  if (user.isUnlimited) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                   text-[10px] font-bold tracking-wide
                   bg-amber-400/15 text-amber-400 border border-amber-400/30"
        title="Unlimited attempts"
      >
        <Zap size={10} className="shrink-0" />
        UNLIMITED
      </span>
    );
  }
 
  // Show remaining attempts with color coding
  const remaining = user.remainingDailyAttempts ?? 0;
 
  // Exhausted (error)
  if (remaining <= 0) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                   text-[10px] font-bold tracking-wide
                   bg-rose-400/15 text-rose-400 border border-rose-400/30"
        title="Daily limit reached. Resets tomorrow at midnight UTC."
      >
        <AlertCircle size={10} className="shrink-0" />
        {remaining}/{user.maxDailyAttempts}
      </span>
    );
  }
 
  // Low on attempts (warning)
  if (remaining <= 2) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                   text-[10px] font-bold tracking-wide
                   bg-orange-400/15 text-orange-400 border border-orange-400/30"
        title={`${remaining} attempt${remaining === 1 ? '' : 's'} remaining today`}
      >
        <Clock size={10} className="shrink-0" />
        {remaining}/{user.maxDailyAttempts}
      </span>
    );
  }
 
  // Normal (info)
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                 text-[10px] font-bold tracking-wide
                 bg-blue-400/15 text-blue-400 border border-blue-400/30"
      title={`${remaining} attempt${remaining === 1 ? '' : 's'} remaining today`}
    >
      <Zap size={10} className="shrink-0" />
      {remaining}/{user.maxDailyAttempts}
    </span>
  );
};

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
 
  const role = (user?.role ?? 'guest') as Role;
  const navigate = useNavigate();
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.subscriber;
  const initials = getInitials(user?.name);
 
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out');
      navigate('/home');
    } catch {
      toast.error('Logout failed');
    }
  };
 
  return (
    <div className="flex flex-col h-screen bg-base-200 text-base-content overflow-hidden">
      {/* ──────────────────────────────────────────────────────────────────────
          TOP NAVBAR
          ────────────────────────────────────────────────────────────────────── */}
      <header
        className={`relative z-40 flex items-center justify-between px-4 shrink-0
          bg-base-200/80 backdrop-blur-xl border-b border-base-content/10
          transition-all duration-300 ease-in-out overflow-hidden
          ${isCollapsed ? 'h-0 opacity-0 border-none' : 'h-16 opacity-100'}`}
        role="banner"
      >
        {/* Brand Logo */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 hover:opacity-80 transition  shrink-0"
          aria-label="Home"
        >
          <div
            className="w-10 h-10 rounded-lg bg-linear-to-br
                       flex items-center justify-center font-bold text-primary-content
                       border border-primary/30 shadow-sm"
          >
            <img 
                    src={BG_} 
                    className="rounded-3xl w-full lg:max-w-md object-cover shadow-2xl border border-slate-800/10" 
                    alt="Student studying for IELTS exam" 
                  />
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="font-mono text-lg font-bold tracking-tight">
              <i>AILA</i>
            </div>
            <div className="text-[10px] font-semibold text-base-content/60 tracking-wider">
              SIMULATOR
            </div>
          </div>
        </button>
 
        {/* Desktop Navigation (Center) */}
        <nav
          className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2"
          role="navigation"
          aria-label="Main"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                   transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                   ${
                     isActive
                       ? 'bg-base-100 text-base-content shadow-inner'
                       : 'text-base-content/50 hover:text-base-content hover:bg-base-100/60'
                   }`
                }
                title={item.label}
              >
                <Icon size={20} className="shrink-0" />
              </NavLink>
            );
          })}
        </nav>
 
        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Attempt Status Badge */}
          {user && (
            <div className="hidden sm:block">
              <AttemptBadge user={user} />
            </div>
          )}
 
          {/* Subscription Status Badge */}
          {user && (
            <div className="hidden sm:block">
              <SubscriptionBadge user={user} compact />
            </div>
          )}
 
          {/* User Profile Link */}
          {user && (
            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl
                       border border-base-content/10 bg-base-100/40
                       hover:bg-base-100 transition duration-200 group"
              aria-label={`Profile: ${user.name}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center
                          text-xs font-bold border ${ROLE_COLORS[role]}`}
              >
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold truncate max-w-xs">
                  {user.name}
                </div>
                <div className="text-[10px] text-base-content/40 uppercase">
                  {user.role}
                </div>
              </div>
            </Link>
          )}
 
          {/* Logout Button */}
          <div className="tooltip tooltip-bottom" data-tip="Sign Out">
            <Button
              onClick={handleLogout}
              variant="ghost"
              icon={<LogOut size={16} className="shrink-0" />}
              aria-label="Logout"
            />
          </div>
 
          {/* Collapse Button */}
          <div className="tooltip tooltip-bottom" data-tip={isCollapsed ? 'Show menu' : 'Hide menu'}>
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="ghost"
              icon={<Play size={16} className="shrink-0" />}
              aria-label="Toggle navbar"
            />
          </div>
 
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileOpen((v) => !v)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg
                     border border-base-content/10
                     text-base-content/60 hover:bg-base-100 transition"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>
 
      {/* Floating Expand Button (when navbar is collapsed) */}
      {isCollapsed && (
        <div className="fixed top-4 left-4 z-50">
          <Button
            onClick={() => setIsCollapsed(false)}
            variant="ghost"
            className="rounded-full w-10 h-10 p-0 shadow-lg hover:shadow-xl transition"
            icon={<Menu size={16} />}
            aria-label="Show navbar"
          />
        </div>
      )}
 
      {/* ──────────────────────────────────────────────────────────────────────
          MOBILE DRAWER
          ────────────────────────────────────────────────────────────────────── */}
      {isMobileOpen && (
        <nav
          className="md:hidden z-30 bg-base-200/95 backdrop-blur-xl
                   border-b border-base-content/10 px-3 py-3 space-y-1"
          role="navigation"
          aria-label="Mobile"
        >
          {/* Mobile User Card */}
          {user && (
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl
                       border border-base-content/10 bg-base-100/40
                       hover:bg-base-100 transition"
              onClick={() => setIsMobileOpen(false)}
              aria-label={`Profile: ${user.name}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center
                          text-xs font-bold border ${ROLE_COLORS[role]}`}
              >
                {initials}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-base-content/40 uppercase">{user.role}</div>
              </div>
            </Link>
          )}
 
          {/* Mobile Status Badges */}
          {user && (
            <div className="flex flex-col gap-2 px-3 py-2">
              <AttemptBadge user={user} />
              <SubscriptionBadge user={user} />
            </div>
          )}
 
          {/* Mobile Nav Links */}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition
                   ${
                     isActive
                       ? 'bg-base-100 text-base-content shadow-inner'
                       : 'text-base-content/50 hover:text-base-content hover:bg-base-100'
                   }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      )}
 
      {/* ──────────────────────────────────────────────────────────────────────
          PAGE CONTENT
          ────────────────────────────────────────────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto bg-linear-to-br from-base-300 to-base-100 p-1"
        role="main"
      >
        <Outlet />
      </main>
    </div>
  );
}

const ROLE_COLORS: Record<Role, string> = {
  admin:      "bg-slate-400/10 text-slate-400",
  teacher:    "bg-lime-500/10 text-lime-400",
  subscriber: "bg-blue-500/10 text-blue-400",
  guest:      "bg-green/5 text-green/60",
};

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { to: "/users-manager",       label: "users manager",           icon: Users },
    { to: "/progress",            label: "Progress",                icon: TrendingUp },
    { to: "/create-test",         label: "Create Test",             icon: ClipboardPlus },
    { to: "/choose",              label: "choose",                  icon: SquareMenu },
  ],
  teacher: [
    { to: "/tests",       label: "Tests",     icon: BookOpen },
    { to: "/progress",    label: "Progress",  icon: TrendingUp },
  ],
  subscriber: [
    { to: "/progress",      label: "Progress",    icon: TrendingUp },
    { to: "/choose",        label: "Menu",        icon: SquareMenu },
  ],
  guest: [
    { to: "/progress",      label: "Progress",    icon: TrendingUp },
    { to: "/choose",        label: "Menu",        icon: SquareMenu },
  ],
};
  
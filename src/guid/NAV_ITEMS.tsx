import type { LucideIcon } from "lucide-react";
import {LayoutDashboard,Users, BookOpen, TrendingUp, Settings, FileText} from "lucide-react";
import type {Role} from "../hooks/Utils.ts";

type NavItem = {
    to: string;
    label: string;
    icon: LucideIcon;
};

export const NAV_ITEMS: Record<Role, NavItem[]> = {

    admin:      [
        { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
        { to: '/admin/users', label: 'Users',       icon: Users },
        { to: '/tests',       label: 'Mock Tests',  icon: BookOpen },
        { to: '/progress',    label: 'My Progress', icon: TrendingUp },
        { to: '/admin',       label: 'Admin Panel', icon: Settings },
        { to: '/admin/audit', label: 'Audit Log',   icon: FileText },
    ],

    teacher:    [
        { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
        { to: '/tests',       label: 'Mock Tests',  icon: BookOpen },
        { to: '/progress',    label: 'My Progress', icon: TrendingUp },
    ],

    subscriber: [
        { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
        { to: '/tests',       label: 'Mock Tests',  icon: BookOpen },
        { to: '/progress',    label: 'My Progress', icon: TrendingUp },
    ],

    guest:      [
        { to: '/tests',       label: 'Mock Tests (Free)', icon: BookOpen },
        { to: '/progress',    label: 'My Progress',       icon: TrendingUp },
    ],
};
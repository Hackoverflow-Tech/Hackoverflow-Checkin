"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import Image from "next/image";
import { useState, useEffect } from "react";

interface Props {
    participantId: string;
    participantName: string;
}

const NAV_ITEMS = [
    { label: "Overview", href: "overview", icon: "🏠" },
    { label: "Check-in", href: "checkin", icon: "✅" },
    { label: "Schedule", href: "schedule", icon: "📅" },
    { label: "Team", href: "team", icon: "👥" },
    { label: "Resources", href: "resources", icon: "📡" },
    { label: "Food", href: "food", icon: "🍔" },
];

export default function DashboardSidebar({ participantId, participantName }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const base = `/participant/${participantId}/dashboard`;

    // Handle mobile screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsCollapsed(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    async function handleLogout() {
        await logoutAction();
        router.push(`/participant/${participantId}/login`);
    }

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

    return (
        <>
            {/* Mobile/Global Toggle Button in Top Right Corner */}
            <button
                onClick={toggleMobile}
                className="md:hidden fixed top-6 right-6 z-50 p-3 bg-gradient-to-br from-[#FCB216] to-[#E85D24] rounded-xl text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all outline-none"
                aria-label="Toggle Menu"
            >
                {isMobileOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                )}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden animate-fade-in"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed md:relative z-40 h-screen transition-all duration-300 ease-in-out
                    border-r border-white/10 bg-[#0F0F0F] flex flex-col
                    ${isCollapsed ? "w-20" : "w-64"}
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                {/* Branding & Collapse Toggle */}
                <div className={`relative flex items-center p-6 ${isCollapsed ? "justify-center" : "gap-3"} min-h-[100px]`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 animate-fade-in">
                            <div className="relative w-8 h-8 flex-shrink-0">
                                <Image
                                    src="/images/Logo.png"
                                    alt="Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Hackoverflow 4.0</p>
                                <p className="text-sm font-semibold text-white truncate w-32">{participantName}</p>
                            </div>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="relative w-8 h-8 animate-fade-in">
                            <Image
                                src="/images/Logo.png"
                                alt="Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}

                    {/* Desktop Toggle Button - Top Right of Sidebar */}
                    <button
                        onClick={toggleSidebar}
                        className="hidden md:flex absolute -right-3 top-10 w-6 h-6 bg-gradient-to-br from-[#FCB216] to-[#E85D24] rounded-full items-center justify-center text-white text-xs font-bold border-2 border-[#0F0F0F] hover:scale-110 active:scale-95 transition-all cursor-pointer z-50 shadow-lg"
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? "→" : "←"}
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-1 flex-1 px-4">
                    {NAV_ITEMS.map((item) => {
                        const href = `${base}/${item.href}`;
                        const isActive = pathname === href || pathname.startsWith(href);

                        return (
                            <Link
                                key={item.href}
                                href={href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center gap-3 py-3 rounded-xl text-sm transition-all duration-200 group relative
                                    ${isCollapsed ? "justify-center px-0" : "px-4"}
                                    ${isActive
                                        ? "bg-gradient-to-r from-[#FCB216]/10 to-[#D91B57]/10 text-white border border-white/10 shadow-[0_0_20px_rgba(252,178,22,0.05)]"
                                        : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                    }`}
                            >
                                <span className={`text-lg flex-shrink-0 ${isCollapsed ? "" : ""}`}>{item.icon}</span>
                                {!isCollapsed && <span className={isActive ? "font-bold" : ""}>{item.label}</span>}

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-4 px-2 py-1 bg-black border border-white/10 rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 mt-auto">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 py-3 rounded-xl text-sm text-red-500/80 hover:text-red-400 hover:bg-red-500/5 transition-all border border-transparent hover:border-red-500/10 w-full group relative
                            ${isCollapsed ? "justify-center" : "px-4"}
                        `}
                    >
                        <span className="text-lg flex-shrink-0">🚪</span>
                        {!isCollapsed && <span className="font-medium">Log out</span>}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                            <div className="absolute left-full ml-4 px-2 py-1 bg-black border border-white/10 rounded text-xs text-red-500 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                Log out
                            </div>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}

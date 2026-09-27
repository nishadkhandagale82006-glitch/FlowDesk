"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, UsersRound, Flower2 } from "lucide-react";

const navLinks = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", Icon: ClipboardList },
  { href: "/team", label: "Team", Icon: UsersRound },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 shrink-0 bg-slate-950 text-white flex-col min-h-screen fixed top-0 left-0 bottom-0 z-40 border-r border-white/5">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
            <Flower2 size={20} strokeWidth={1.5} className="text-indigo-400" aria-hidden="true" />
            FlowDesk
          </h1>
          <p className="text-[10px] uppercase text-slate-400 mt-2 tracking-[0.18em]">Small business workspace</p>
        </div>

        {/* Nav */}
        <nav aria-label="Main navigation" className="flex-1 px-3 py-5 space-y-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.Icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={1.7} className={isActive ? "text-indigo-200" : "text-gray-500"} aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-[11px] font-medium text-slate-500">A simpler way to run your day</p>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav aria-label="Main navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 flex items-center justify-around pb-safe z-50 shadow-[0_-4px_14px_-4px_rgba(15,23,42,0.12)]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.Icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full py-3 gap-1 transition-colors ${
                isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
              <span className="text-[10px] font-medium tracking-wide">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

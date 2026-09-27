import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between px-4 md:px-8 py-5 bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-30 gap-4 sm:gap-0">
      {/* Left: Greeting */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl md:text-3xl font-medium text-slate-950 tracking-tight">Welcome to FlowDesk</h2>
          <Sparkles size={17} strokeWidth={1.5} className="text-indigo-500" aria-hidden="true" />
        </div>
        <p className="text-sm text-slate-500 mt-1">
          A clear view of the work ahead for your business today.
        </p>
      </div>

      <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 py-2 px-3">
        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
        <span className="text-xs font-semibold text-slate-600">Team workspace</span>
      </div>
    </header>
  );
}
